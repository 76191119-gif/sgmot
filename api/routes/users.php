<?php
// Solo admin puede gestionar usuarios
$user = requireRole('admin');

if ($method === 'GET' && !$id) {
    $stmt = $db->query("SELECT id, full_name, email, role, created_date FROM users ORDER BY created_date DESC");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT id, full_name, email, role, created_date FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($row ?: ['error' => 'No encontrado'], $row ? 200 : 404);
}

if ($method === 'POST') {
    $b = getBody();
    if (empty($b['full_name']) || empty($b['email']) || empty($b['password']) || empty($b['role'])) {
        sendResponse(['error' => 'Nombre, email, contraseña y rol son obligatorios'], 400);
    }
    if (strlen($b['password']) < 4) {
        sendResponse(['error' => 'La contraseña debe tener al menos 4 caracteres'], 400);
    }
    if (!in_array($b['role'], ['admin', 'tecnico', 'cliente'])) {
        sendResponse(['error' => 'Rol inválido'], 400);
    }
    try {
        $hash = password_hash($b['password'], PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$b['full_name'], $b['email'], $hash, $b['role']]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_user', 'user', $newId, "Usuario creado: {$b['email']} ({$b['role']})", 'success', $user);
        // Notificación de bienvenida al nuevo usuario
        notify_user($db, $newId, 'system', '¡Bienvenido al SGMOT!', "Tu cuenta ({$b['role']}) ha sido creada.", '/profile');
        sendResponse(['id' => $newId, 'message' => 'Usuario creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Email ya registrado'], 400);
    }
}

if ($method === 'PUT' && $id) {
    $b = getBody();
    // No permitir cambiarse a uno mismo el rol (evita lockout accidental)
    if ((int)$id === (int)$user['id'] && isset($b['role']) && $b['role'] !== 'admin') {
        sendResponse(['error' => 'No puedes degradar tu propio rol'], 400);
    }
    if (!empty($b['password'])) {
        if (strlen($b['password']) < 4) sendResponse(['error' => 'Contraseña muy corta'], 400);
        $hash = password_hash($b['password'], PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE users SET full_name=?, email=?, role=?, password=?, updated_date=NOW() WHERE id=?");
        $stmt->execute([$b['full_name'], $b['email'], $b['role'], $hash, $id]);
        audit_log($db, 'update_user_password', 'user', (int)$id, "Cambio de contraseña para {$b['email']}", 'warning', $user);
    } else {
        $stmt = $db->prepare("UPDATE users SET full_name=?, email=?, role=?, updated_date=NOW() WHERE id=?");
        $stmt->execute([$b['full_name'], $b['email'], $b['role'], $id]);
        audit_log($db, 'update_user', 'user', (int)$id, "Usuario actualizado: {$b['email']} ({$b['role']})", 'success', $user);
    }
    sendResponse(['message' => 'Usuario actualizado']);
}

if ($method === 'DELETE' && $id) {
    if ((int)$id === (int)$user['id']) {
        sendResponse(['error' => 'No puedes eliminarte a ti mismo'], 400);
    }
    $prev = $db->prepare("SELECT email FROM users WHERE id = ?");
    $prev->execute([$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    audit_log($db, 'delete_user', 'user', (int)$id, "Usuario eliminado: " . ($row['email'] ?? "#$id"), 'warning', $user);
    sendResponse(['message' => 'Usuario eliminado']);
}

sendResponse(['error' => 'Método no permitido'], 405);
