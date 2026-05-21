<?php
$user = requireAuth();

if ($method === 'GET' && !$id) {
    $stmt = $db->query("SELECT * FROM technicians ORDER BY created_date DESC");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM technicians WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($row ?: ['error' => 'No encontrado'], $row ? 200 : 404);
}

if ($method === 'POST') {
    requireRole('admin');
    $b = getBody();
    if (empty($b['full_name']) || empty($b['dni']) || empty($b['phone']) || empty($b['specialty'])) {
        sendResponse(['error' => 'Campos obligatorios faltantes'], 400);
    }
    try {
        $stmt = $db->prepare("INSERT INTO technicians (full_name, dni, phone, email, specialty, status, zone)
                              VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $b['full_name'], $b['dni'], $b['phone'],
            $b['email'] ?? '', $b['specialty'],
            $b['status'] ?? 'disponible', $b['zone'] ?? ''
        ]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_technician', 'technician', $newId, "Técnico creado: {$b['full_name']}", 'success', $user);
        sendResponse(['id' => $newId, 'message' => 'Técnico creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Error al crear técnico (¿DNI duplicado?)', 'detail' => $e->getMessage()], 400);
    }
}

if ($method === 'PUT' && $id) {
    requireRole('admin');
    $b = getBody();
    $stmt = $db->prepare("UPDATE technicians
                          SET full_name=?, dni=?, phone=?, email=?, specialty=?, status=?, zone=?, updated_date=NOW()
                          WHERE id=?");
    $stmt->execute([
        $b['full_name'], $b['dni'], $b['phone'],
        $b['email'] ?? '', $b['specialty'],
        $b['status'] ?? 'disponible', $b['zone'] ?? '', $id
    ]);
    audit_log($db, 'update_technician', 'technician', (int)$id, "Técnico actualizado: {$b['full_name']}", 'success', $user);
    sendResponse(['message' => 'Técnico actualizado']);
}

if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT full_name FROM technicians WHERE id = ?");
    $prev->execute([$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    $stmt = $db->prepare("DELETE FROM technicians WHERE id = ?");
    $stmt->execute([$id]);
    audit_log($db, 'delete_technician', 'technician', (int)$id, "Técnico eliminado: " . ($row['full_name'] ?? "#$id"), 'warning', $user);
    sendResponse(['message' => 'Técnico eliminado']);
}

sendResponse(['error' => 'Método no permitido'], 405);
