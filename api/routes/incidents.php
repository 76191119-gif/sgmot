<?php
$user = requireAuth();

if ($method === 'GET' && !$id) {
    if ($user['role'] === 'cliente') {
        $cl = $db->prepare("SELECT id, full_name FROM clients WHERE email = ?");
        $cl->execute([$user['email']]);
        $client = $cl->fetch(PDO::FETCH_ASSOC);
        if (!$client) sendResponse([]);
        $stmt = $db->prepare("SELECT * FROM incidents WHERE client_id = ? OR client_name = ? ORDER BY created_date DESC");
        $stmt->execute([$client['id'], $client['full_name']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    $stmt = $db->query("SELECT * FROM incidents ORDER BY created_date DESC LIMIT 500");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM incidents WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($row ?: ['error' => 'No encontrado'], $row ? 200 : 404);
}

if ($method === 'POST') {
    $b = getBody();

    if ($user['role'] === 'cliente') {
        $cl = $db->prepare("SELECT id, full_name FROM clients WHERE email = ?");
        $cl->execute([$user['email']]);
        $client = $cl->fetch(PDO::FETCH_ASSOC);
        if ($client) {
            $b['client_id']   = $client['id'];
            $b['client_name'] = $client['full_name'];
        }
        $b['status'] = 'abierta';
    }

    if (empty($b['title']) || empty($b['client_id']) || empty($b['category'])) {
        sendResponse(['error' => 'Título, cliente y categoría son obligatorios'], 400);
    }

    $stmt = $db->prepare("INSERT INTO incidents (title, client_id, client_name, category, priority, status, description)
                          VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $b['title'], $b['client_id'], $b['client_name'] ?? '',
        $b['category'], $b['priority'] ?? 'media',
        $b['status'] ?? 'abierta', $b['description'] ?? ''
    ]);
    $newId = (int)$db->lastInsertId();

    audit_log($db, 'create_incident', 'incident', $newId,
        "Nueva incidencia: {$b['title']} ({$b['client_name']})", 'success', $user);

    // Notificar a admins de la nueva incidencia
    notify_role($db, 'admin', 'incident_new',
        '🆘 Nueva incidencia reportada',
        "{$b['client_name']}: {$b['title']}",
        '/incidents', 'incident', $newId);

    // Notificar a técnicos (todos) para que puedan tomarla
    notify_role($db, 'tecnico', 'incident_new',
        'Nueva incidencia disponible',
        "{$b['client_name']}: {$b['title']}",
        '/incidents', 'incident', $newId);

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

    $stmt = $db->prepare("UPDATE incidents
                          SET title=?, category=?, priority=?, status=?, description=?, resolution=?, updated_date=NOW()
                          WHERE id=?");
    $stmt->execute([
        $b['title'] ?? '', $b['category'] ?? 'otro',
        $b['priority'] ?? 'media', $b['status'] ?? 'abierta',
        $b['description'] ?? '', $b['resolution'] ?? '', $id
    ]);

    audit_log($db, 'update_incident', 'incident', (int)$id,
        "Incidencia '{$previous['title']}': {$previous['status']} → {$b['status']}", 'success', $user);

    // Notificar al cliente si cambió el estado
    $newStatus = $b['status'] ?? $previous['status'];
    if ($previous['status'] !== $newStatus) {
        $statusLabels = ['abierta'=>'Abierta','en_atencion'=>'En Atención','resuelta'=>'Resuelta','cerrada'=>'Cerrada'];
        $label = $statusLabels[$newStatus] ?? $newStatus;
        $cl = $db->prepare("SELECT email FROM clients WHERE id = ?");
        $cl->execute([$previous['client_id']]);
        $cEmail = $cl->fetchColumn();
        if ($cEmail) {
            $title = $newStatus === 'resuelta' ? '✅ Incidencia resuelta' : "Incidencia: $label";
            notify_email($db, $cEmail,
                $newStatus === 'resuelta' ? 'incident_resolved' : 'incident_status',
                $title,
                "'{$previous['title']}' cambió a: $label",
                '/incidents', 'incident', (int)$id);
        }
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

sendResponse(['error' => 'Método no permitido'], 405);
