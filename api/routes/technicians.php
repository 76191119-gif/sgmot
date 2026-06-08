<?php
$user = requireAuth();

if ($method === 'GET' && !$id) {
    if (!in_array($user['role'], ['admin', 'tecnico'], true)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }

    if ($user['role'] === 'tecnico') {
        $tech = findCurrentTechnician($db, $user);
        sendResponse($tech ? [$tech] : []);
    }

    $stmt = $db->query("SELECT * FROM technicians ORDER BY created_date DESC");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    if (!in_array($user['role'], ['admin', 'tecnico'], true)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }

    $stmt = $db->prepare("SELECT * FROM technicians WHERE id = ?");
    $stmt->execute([(int)$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendResponse(['error' => 'No encontrado'], 404);

    if ($user['role'] === 'tecnico') {
        $tech = findCurrentTechnician($db, $user);
        if (!$tech || (int)$tech['id'] !== (int)$id) {
            sendResponse(['error' => 'Acceso denegado'], 403);
        }
    }

    sendResponse($row);
}

if ($method === 'POST') {
    requireRole('admin');
    $b = getBody();
    if (empty($b['full_name']) || empty($b['dni']) || empty($b['phone']) || empty($b['specialty'])) {
        sendResponse(['error' => 'Campos obligatorios faltantes'], 400);
    }

    $email = strtolower(trim($b['email'] ?? ''));
    $linkedUserId = null;
    if ($email) {
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'tecnico'");
        $userStmt->execute([$email]);
        $linkedUserId = $userStmt->fetchColumn() ?: null;
    }

    try {
        $stmt = $db->prepare("INSERT INTO technicians
            (full_name, dni, phone, email, specialty, status, zone, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $b['full_name'], $b['dni'], $b['phone'], $email, $b['specialty'],
            $b['status'] ?? 'disponible', $b['zone'] ?? '', $linkedUserId,
        ]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_technician', 'technician', $newId, "Tecnico creado: {$b['full_name']}", 'success', $user);
        sendResponse(['id' => $newId, 'message' => 'Tecnico creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al crear tecnico. Revisa DNI, email o usuario asociado.'], 400);
    }
}

if ($method === 'PUT' && $id) {
    requireRole('admin');
    $b = getBody();
    if (empty($b['full_name']) || empty($b['dni']) || empty($b['phone']) || empty($b['specialty'])) {
        sendResponse(['error' => 'Campos obligatorios faltantes'], 400);
    }

    $email = strtolower(trim($b['email'] ?? ''));
    $linkedUserId = null;
    if ($email) {
        $userStmt = $db->prepare("SELECT id FROM users WHERE email = ? AND role = 'tecnico'");
        $userStmt->execute([$email]);
        $linkedUserId = $userStmt->fetchColumn() ?: null;
    }

    $stmt = $db->prepare("UPDATE technicians
        SET full_name = ?, dni = ?, phone = ?, email = ?, specialty = ?, status = ?, zone = ?, user_id = ?, updated_date = NOW()
        WHERE id = ?");
    $stmt->execute([
        $b['full_name'], $b['dni'], $b['phone'], $email, $b['specialty'],
        $b['status'] ?? 'disponible', $b['zone'] ?? '', $linkedUserId, (int)$id,
    ]);
    audit_log($db, 'update_technician', 'technician', (int)$id, "Tecnico actualizado: {$b['full_name']}", 'success', $user);
    sendResponse(['message' => 'Tecnico actualizado']);
}

if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT full_name FROM technicians WHERE id = ?");
    $prev->execute([(int)$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    $stmt = $db->prepare("DELETE FROM technicians WHERE id = ?");
    $stmt->execute([(int)$id]);
    audit_log($db, 'delete_technician', 'technician', (int)$id, "Tecnico eliminado: " . ($row['full_name'] ?? "#$id"), 'warning', $user);
    sendResponse(['message' => 'Tecnico eliminado']);
}

sendResponse(['error' => 'Metodo no permitido'], 405);
