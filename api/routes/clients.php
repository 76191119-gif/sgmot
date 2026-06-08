<?php
$user = requireAuth();

function canReadClientRecord($db, $user, $clientId) {
    if ($user['role'] === 'admin') return true;

    if ($user['role'] === 'cliente') {
        $client = findCurrentClient($db, $user);
        return $client && (int)$client['id'] === (int)$clientId;
    }

    if ($user['role'] === 'tecnico') {
        $tech = findCurrentTechnician($db, $user);
        if (!$tech) return false;

        $stmt = $db->prepare("
            SELECT 1 FROM work_orders WHERE client_id = ? AND technician_id = ?
            UNION
            SELECT 1 FROM incidents WHERE client_id = ? AND technician_id = ?
            LIMIT 1
        ");
        $stmt->execute([(int)$clientId, (int)$tech['id'], (int)$clientId, (int)$tech['id']]);
        return (bool)$stmt->fetchColumn();
    }

    return false;
}

if ($method === 'GET' && !$id) {
    if ($user['role'] === 'admin') {
        $stmt = $db->query("SELECT * FROM clients ORDER BY created_date DESC");
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($user['role'] === 'cliente') {
        $client = findCurrentClient($db, $user);
        sendResponse($client ? [$client] : []);
    }

    if ($user['role'] === 'tecnico') {
        $tech = findCurrentTechnician($db, $user);
        if (!$tech) sendResponse([]);

        $stmt = $db->prepare("
            SELECT DISTINCT c.*
            FROM clients c
            LEFT JOIN work_orders wo ON wo.client_id = c.id AND wo.technician_id = ?
            LEFT JOIN incidents i ON i.client_id = c.id AND i.technician_id = ?
            WHERE wo.id IS NOT NULL OR i.id IS NOT NULL
            ORDER BY c.created_date DESC
        ");
        $stmt->execute([(int)$tech['id'], (int)$tech['id']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM clients WHERE id = ?");
    $stmt->execute([(int)$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendResponse(['error' => 'No encontrado'], 404);
    if (!canReadClientRecord($db, $user, (int)$id)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }
    sendResponse($row);
}

if ($method === 'POST') {
    requireRole('admin');
    $b = getBody();
    if (empty($b['full_name']) || empty($b['dni']) || empty($b['phone']) || empty($b['address']) || empty($b['plan'])) {
        sendResponse(['error' => 'Campos obligatorios faltantes'], 400);
    }

    $email = strtolower(trim($b['email'] ?? ''));
    $linkedUserId = null;
    if ($email) {
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'cliente'");
        $userStmt->execute([$email]);
        $linkedUserId = $userStmt->fetchColumn() ?: null;
    }

    try {
        $stmt = $db->prepare("INSERT INTO clients
            (user_id, full_name, dni, phone, email, address, district, latitude, longitude, plan, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $linkedUserId, $b['full_name'], $b['dni'], $b['phone'], $email,
            $b['address'], $b['district'] ?? '',
            isset($b['latitude']) && $b['latitude'] !== '' ? (float)$b['latitude'] : null,
            isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null,
            $b['plan'], $b['status'] ?? 'activo', $b['notes'] ?? '',
        ]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_client', 'client', $newId, "Cliente creado: {$b['full_name']}", 'success', $user);
        sendResponse(['id' => $newId, 'message' => 'Cliente creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al crear cliente. Revisa DNI, email o usuario asociado.'], 400);
    }
}

if ($method === 'PUT' && $id) {
    requireRole('admin');
    $b = getBody();
    if (empty($b['full_name']) || empty($b['dni']) || empty($b['phone']) || empty($b['address']) || empty($b['plan'])) {
        sendResponse(['error' => 'Campos obligatorios faltantes'], 400);
    }

    $email = strtolower(trim($b['email'] ?? ''));
    $linkedUserId = null;
    if ($email) {
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'cliente'");
        $userStmt->execute([$email]);
        $linkedUserId = $userStmt->fetchColumn() ?: null;
    }

    try {
        $stmt = $db->prepare("UPDATE clients
            SET user_id = ?, full_name = ?, dni = ?, phone = ?, email = ?, address = ?, district = ?,
                latitude = ?, longitude = ?, plan = ?, status = ?, notes = ?, updated_date = NOW()
            WHERE id = ?");
        $stmt->execute([
            $linkedUserId, $b['full_name'], $b['dni'], $b['phone'], $email,
            $b['address'], $b['district'] ?? '',
            isset($b['latitude']) && $b['latitude'] !== '' ? (float)$b['latitude'] : null,
            isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null,
            $b['plan'], $b['status'] ?? 'activo', $b['notes'] ?? '', (int)$id,
        ]);
        audit_log($db, 'update_client', 'client', (int)$id, "Cliente actualizado: {$b['full_name']}", 'success', $user);
        sendResponse(['message' => 'Cliente actualizado']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'No se pudo actualizar el cliente. Revisa DNI, email o usuario asociado.'], 400);
    }
}

if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT full_name FROM clients WHERE id = ?");
    $prev->execute([(int)$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    try {
        $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([(int)$id]);
        audit_log($db, 'delete_client', 'client', (int)$id, "Cliente eliminado: " . ($row['full_name'] ?? "#$id"), 'warning', $user);
        sendResponse(['message' => 'Cliente eliminado']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'No se puede eliminar: tiene ordenes o incidencias asociadas'], 400);
    }
}

sendResponse(['error' => 'Metodo no permitido'], 405);
