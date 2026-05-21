<?php
$user = requireAuth();

if ($method === 'GET' && !$id) {
    // El cliente solo ve SU propia ficha (filtrado por email)
    if ($user['role'] === 'cliente') {
        $stmt = $db->prepare("SELECT * FROM clients WHERE email = ?");
        $stmt->execute([$user['email']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    // Admin y técnicos ven todos
    $stmt = $db->query("SELECT * FROM clients ORDER BY created_date DESC");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM clients WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendResponse(['error' => 'No encontrado'], 404);
    // Cliente solo puede ver su propia ficha
    if ($user['role'] === 'cliente' && $row['email'] !== $user['email']) {
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
    try {
        $stmt = $db->prepare("INSERT INTO clients (full_name, dni, phone, email, address, district, latitude, longitude, plan, status, notes)
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $b['full_name'], $b['dni'], $b['phone'],
            $b['email'] ?? '', $b['address'], $b['district'] ?? '',
            $b['latitude']  !== '' && isset($b['latitude'])  ? (float)$b['latitude']  : null,
            $b['longitude'] !== '' && isset($b['longitude']) ? (float)$b['longitude'] : null,
            $b['plan'], $b['status'] ?? 'activo', $b['notes'] ?? ''
        ]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_client', 'client', $newId, "Cliente creado: {$b['full_name']}", 'success', $user);
        sendResponse(['id' => $newId, 'message' => 'Cliente creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al crear cliente (¿DNI duplicado?)', 'detail' => $e->getMessage()], 400);
    }
}

if ($method === 'PUT' && $id) {
    requireRole('admin');
    $b = getBody();
    $stmt = $db->prepare("UPDATE clients
                          SET full_name=?, dni=?, phone=?, email=?, address=?, district=?, latitude=?, longitude=?, plan=?, status=?, notes=?, updated_date=NOW()
                          WHERE id=?");
    $stmt->execute([
        $b['full_name'], $b['dni'], $b['phone'],
        $b['email'] ?? '', $b['address'], $b['district'] ?? '',
        isset($b['latitude'])  && $b['latitude']  !== '' ? (float)$b['latitude']  : null,
        isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null,
        $b['plan'], $b['status'] ?? 'activo', $b['notes'] ?? '', $id
    ]);
    audit_log($db, 'update_client', 'client', (int)$id, "Cliente actualizado: {$b['full_name']}", 'success', $user);
    sendResponse(['message' => 'Cliente actualizado']);
}

if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT full_name FROM clients WHERE id = ?");
    $prev->execute([$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    try {
        $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        audit_log($db, 'delete_client', 'client', (int)$id, "Cliente eliminado: " . ($row['full_name'] ?? "#$id"), 'warning', $user);
        sendResponse(['message' => 'Cliente eliminado']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'No se puede eliminar: tiene órdenes o incidencias asociadas'], 400);
    }
}

sendResponse(['error' => 'Método no permitido'], 405);
