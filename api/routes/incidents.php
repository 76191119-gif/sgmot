<?php
$user = requireAuth();

function getCurrentIncidentTechnician($db, $user) {
    static $tech = null;
    if ($tech !== null) return $tech ?: null;

    $tech = findCurrentTechnician($db, $user) ?: false;
    return $tech ?: null;
}

function getCurrentIncidentClient($db, $user) {
    static $client = null;
    if ($client !== null) return $client ?: null;

    $client = findCurrentClient($db, $user) ?: false;
    return $client ?: null;
}

function canAccessIncident($db, $user, $incident) {
    if ($user['role'] === 'admin') return true;

    if ($user['role'] === 'tecnico') {
        $tech = getCurrentIncidentTechnician($db, $user);
        return $tech && (int)$incident['technician_id'] === (int)$tech['id'];
    }

    if ($user['role'] === 'cliente') {
        $client = getCurrentIncidentClient($db, $user);
        return $client && (int)$incident['client_id'] === (int)$client['id'];
    }

    return false;
}

function validateIncidentCategory($category) {
    $validCategories = ['sin_servicio', 'lentitud', 'corte_fibra', 'equipo_danado', 'configuracion', 'otro'];
    if (!in_array($category, $validCategories, true)) {
        sendResponse(['error' => 'Categoria de incidencia no valida'], 400);
    }
}

function resolveIncidentTechnician($db, &$body) {
    if (empty($body['technician_id'])) {
        $body['technician_id'] = null;
        $body['technician_name'] = '';
        return;
    }

    $stmt = $db->prepare("SELECT full_name FROM technicians WHERE id = ?");
    $stmt->execute([$body['technician_id']]);
    $techName = $stmt->fetchColumn();
    if (!$techName) sendResponse(['error' => 'Tecnico asignado no existe'], 400);

    $body['technician_name'] = $techName;
}

function notifyAssignedIncidentTechnician($db, $technicianId, $clientName, $title, $incidentId) {
    if (!$technicianId) return;

    $stmt = $db->prepare("SELECT email FROM technicians WHERE id = ?");
    $stmt->execute([$technicianId]);
    $email = $stmt->fetchColumn();
    if (!$email) return;

    notify_email($db, $email, 'incident_new',
        'Incidencia asignada',
        "$clientName: $title",
        '/incidents', 'incident', $incidentId);
}

if ($method === 'GET' && !$id) {
    if ($user['role'] === 'admin') {
        $stmt = $db->query("SELECT * FROM incidents ORDER BY created_date DESC LIMIT 500");
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($user['role'] === 'tecnico') {
        $tech = getCurrentIncidentTechnician($db, $user);
        if (!$tech) sendResponse([]);
        $stmt = $db->prepare("SELECT * FROM incidents WHERE technician_id = ? ORDER BY created_date DESC");
        $stmt->execute([$tech['id']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($user['role'] === 'cliente') {
        $client = getCurrentIncidentClient($db, $user);
        if (!$client) sendResponse([]);
        $stmt = $db->prepare("SELECT * FROM incidents WHERE client_id = ? ORDER BY created_date DESC");
        $stmt->execute([$client['id']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM incidents WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendResponse(['error' => 'No encontrado'], 404);
    if (!canAccessIncident($db, $user, $row)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }
    sendResponse($row);
}

if ($method === 'POST') {
    if (!in_array($user['role'], ['admin', 'cliente'])) {
        sendResponse(['error' => 'Sin permisos'], 403);
    }

    $b = getBody();

    if ($user['role'] === 'cliente') {
        $client = getCurrentIncidentClient($db, $user);
        if ($client) {
            $b['client_id'] = $client['id'];
            $b['client_name'] = $client['full_name'];
        }
        $b['status'] = 'abierta';
        $b['technician_id'] = null;
        $b['technician_name'] = '';
    } else {
        resolveIncidentTechnician($db, $b);
    }

    if (empty($b['title']) || empty($b['client_id']) || empty($b['category'])) {
        sendResponse(['error' => 'Titulo, cliente y categoria son obligatorios'], 400);
    }
    validateIncidentCategory($b['category']);

    $stmt = $db->prepare("INSERT INTO incidents
        (title, client_id, client_name, category, priority, technician_id, technician_name, status, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $b['title'],
        $b['client_id'],
        $b['client_name'] ?? '',
        $b['category'],
        $b['priority'] ?? 'media',
        $b['technician_id'],
        $b['technician_name'] ?? '',
        $b['status'] ?? 'abierta',
        $b['description'] ?? ''
    ]);
    $newId = (int)$db->lastInsertId();

    audit_log($db, 'create_incident', 'incident', $newId,
        "Nueva incidencia: {$b['title']} ({$b['client_name']})", 'success', $user);

    notify_role($db, 'admin', 'incident_new',
        'Nueva incidencia reportada',
        "{$b['client_name']}: {$b['title']}",
        '/incidents', 'incident', $newId);

    notifyAssignedIncidentTechnician($db, $b['technician_id'], $b['client_name'] ?? '', $b['title'], $newId);

    sendResponse(['id' => $newId, 'message' => 'Incidencia creada'], 201);
}

if ($method === 'PUT' && $id) {
    if (!in_array($user['role'], ['admin', 'tecnico'])) {
        sendResponse(['error' => 'Sin permisos'], 403);
    }

    $b = getBody();

    $prev = $db->prepare("SELECT * FROM incidents WHERE id = ?");
    $prev->execute([$id]);
    $previous = $prev->fetch(PDO::FETCH_ASSOC);
    if (!$previous) sendResponse(['error' => 'No encontrado'], 404);
    if (!canAccessIncident($db, $user, $previous)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }

    if ($user['role'] === 'tecnico') {
        $validTechStatuses = ['abierta', 'en_atencion', 'resuelta', 'cerrada'];
        $techStatus = $b['status'] ?? $previous['status'];
        if (!in_array($techStatus, $validTechStatuses, true)) {
            sendResponse(['error' => 'Estado de incidencia no valido'], 400);
        }

        $stmt = $db->prepare("UPDATE incidents
                              SET status=?, resolution=?, updated_date=NOW()
                              WHERE id=?");
        $stmt->execute([
            $techStatus,
            $b['resolution'] ?? '',
            $id
        ]);
    } else {
        resolveIncidentTechnician($db, $b);
        $category = $b['category'] ?? $previous['category'];
        validateIncidentCategory($category);

        $stmt = $db->prepare("UPDATE incidents
                              SET title=?, category=?, priority=?, technician_id=?, technician_name=?, status=?, description=?, resolution=?, updated_date=NOW()
                              WHERE id=?");
        $stmt->execute([
            $b['title'] ?? $previous['title'],
            $category,
            $b['priority'] ?? $previous['priority'],
            $b['technician_id'],
            $b['technician_name'],
            $b['status'] ?? $previous['status'],
            $b['description'] ?? $previous['description'],
            $b['resolution'] ?? $previous['resolution'],
            $id
        ]);
    }

    audit_log($db, 'update_incident', 'incident', (int)$id,
        "Incidencia '{$previous['title']}': {$previous['status']} -> " . ($b['status'] ?? $previous['status']), 'success', $user);

    $newStatus = $b['status'] ?? $previous['status'];
    if ($previous['status'] !== $newStatus) {
        $statusLabels = ['abierta'=>'Abierta','en_atencion'=>'En Atencion','resuelta'=>'Resuelta','cerrada'=>'Cerrada'];
        $label = $statusLabels[$newStatus] ?? $newStatus;

        if ($user['role'] === 'tecnico') {
            notify_role($db, 'admin', 'incident_status',
                'Tecnico actualizo una incidencia',
                "{$user['full_name']} cambio la incidencia '{$previous['title']}' ({$previous['client_name']}) a: $label",
                '/incidents', 'incident', (int)$id);
        }

        $cl = $db->prepare("SELECT email FROM clients WHERE id = ?");
        $cl->execute([$previous['client_id']]);
        $cEmail = $cl->fetchColumn();
        if ($cEmail) {
            $title = $newStatus === 'resuelta' ? 'Incidencia resuelta' : "Incidencia: $label";
            notify_email($db, $cEmail,
                $newStatus === 'resuelta' ? 'incident_resolved' : 'incident_status',
                $title,
                "'{$previous['title']}' cambio a: $label",
                '/incidents', 'incident', (int)$id);
        }
    }

    if ($user['role'] === 'admin' && !empty($b['technician_id']) && $previous['technician_id'] != $b['technician_id']) {
        notifyAssignedIncidentTechnician($db, $b['technician_id'], $previous['client_name'], $previous['title'], (int)$id);
    }

    sendResponse(['message' => 'Incidencia actualizada']);
}

if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT title FROM incidents WHERE id = ?");
    $prev->execute([$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);

    $stmt = $db->prepare("DELETE FROM incidents WHERE id = ?");
    $stmt->execute([$id]);

    if ($row) {
        audit_log($db, 'delete_incident', 'incident', (int)$id,
            "Incidencia eliminada: {$row['title']}", 'warning', $user);
    }
    sendResponse(['message' => 'Incidencia eliminada']);
}

sendResponse(['error' => 'Metodo no permitido'], 405);
