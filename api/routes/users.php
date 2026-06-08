<?php
$user = requireRole('admin');

function userSelectSql() {
    return "SELECT
        u.id, u.full_name, u.email, u.photo_url, u.role, u.provider, u.profile_complete, u.created_date, u.updated_date,
        c.id AS client_id, c.dni AS client_dni, c.phone AS client_phone, c.address AS client_address,
        c.district AS client_district, c.plan AS client_plan, c.status AS client_status,
        t.id AS technician_id, t.dni AS technician_dni, t.phone AS technician_phone,
        t.specialty AS technician_specialty, t.status AS technician_status, t.zone AS technician_zone
        FROM users u
        LEFT JOIN clients c ON c.user_id = u.id
        LEFT JOIN technicians t ON t.user_id = u.id";
}

function normalizeUserRow($row) {
    if (!$row) return null;
    $profile = null;
    if ($row['role'] === 'cliente' && $row['client_id']) {
        $profile = [
            'type' => 'cliente',
            'id' => (int)$row['client_id'],
            'dni' => $row['client_dni'],
            'phone' => $row['client_phone'],
            'address' => $row['client_address'],
            'district' => $row['client_district'],
            'plan' => $row['client_plan'],
            'status' => $row['client_status'],
        ];
    } elseif ($row['role'] === 'tecnico' && $row['technician_id']) {
        $profile = [
            'type' => 'tecnico',
            'id' => (int)$row['technician_id'],
            'dni' => $row['technician_dni'],
            'phone' => $row['technician_phone'],
            'specialty' => $row['technician_specialty'],
            'status' => $row['technician_status'],
            'zone' => $row['technician_zone'],
        ];
    }

    return [
        'id' => (int)$row['id'],
        'full_name' => $row['full_name'],
        'email' => $row['email'],
        'photo_url' => $row['photo_url'],
        'role' => $row['role'],
        'provider' => $row['provider'],
        'profile_complete' => (int)$row['profile_complete'],
        'created_date' => $row['created_date'],
        'updated_date' => $row['updated_date'],
        'profile' => $profile,
    ];
}

function validatePhoto($photo) {
    if ($photo === null || $photo === '') return null;
    if (!is_string($photo) || !preg_match('/^data:image\/(png|jpe?g|webp);base64,/i', $photo)) {
        sendResponse(['error' => 'Foto no valida. Usa PNG, JPG o WEBP.'], 400);
    }
    if (strlen($photo) > 700000) {
        sendResponse(['error' => 'La foto es muy pesada. Usa una imagen menor a 500 KB.'], 400);
    }
    return $photo;
}

if ($method === 'GET' && !$id) {
    $stmt = $db->query(userSelectSql() . " ORDER BY u.created_date DESC");
    $rows = array_map('normalizeUserRow', $stmt->fetchAll(PDO::FETCH_ASSOC));
    sendResponse($rows);
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare(userSelectSql() . " WHERE u.id = ?");
    $stmt->execute([(int)$id]);
    $row = normalizeUserRow($stmt->fetch(PDO::FETCH_ASSOC));
    sendResponse($row ?: ['error' => 'No encontrado'], $row ? 200 : 404);
}

function validateUserPayload($body, $requirePassword = false) {
    if (empty($body['full_name']) || empty($body['email']) || empty($body['role']) || ($requirePassword && empty($body['password']))) {
        sendResponse(['error' => 'Nombre, email, contrasena y rol son obligatorios'], 400);
    }
    if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Email no valido'], 400);
    }
    if (!in_array($body['role'], ['admin', 'tecnico', 'cliente'], true)) {
        sendResponse(['error' => 'Rol invalido'], 400);
    }
    if (!empty($body['password']) && strlen($body['password']) < 8) {
        sendResponse(['error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
    }
}

if ($method === 'POST') {
    $b = getBody();
    $b['email'] = strtolower(trim($b['email'] ?? ''));
    $photo = validatePhoto($b['photo_url'] ?? null);
    validateUserPayload($b, true);

    try {
        $hash = password_hash($b['password'], PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (full_name, email, photo_url, password, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$b['full_name'], $b['email'], $photo, $hash, $b['role']]);
        $newId = (int)$db->lastInsertId();
        audit_log($db, 'create_user', 'user', $newId, "Usuario creado: {$b['email']} ({$b['role']})", 'success', $user);
        notify_user($db, $newId, 'system', 'Bienvenido al SGMOT', "Tu cuenta ({$b['role']}) ha sido creada.", '/profile');
        sendResponse(['id' => $newId, 'message' => 'Usuario creado'], 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Email ya registrado'], 400);
    }
}

if ($method === 'PUT' && $id) {
    $b = getBody();
    $b['email'] = strtolower(trim($b['email'] ?? ''));
    $photo = array_key_exists('photo_url', $b) ? validatePhoto($b['photo_url']) : null;
    validateUserPayload($b, false);

    if ((int)$id === (int)$user['id'] && $b['role'] !== 'admin') {
        sendResponse(['error' => 'No puedes degradar tu propio rol'], 400);
    }

    try {
        $db->beginTransaction();

        if (!empty($b['password'])) {
            $hash = password_hash($b['password'], PASSWORD_BCRYPT);
            $stmt = $db->prepare("UPDATE users SET full_name = ?, email = ?, photo_url = ?, role = ?, password = ?, updated_date = NOW() WHERE id = ?");
            $stmt->execute([$b['full_name'], $b['email'], $photo, $b['role'], $hash, (int)$id]);
            audit_log($db, 'update_user_password', 'user', (int)$id, "Cambio de contrasena para {$b['email']}", 'warning', $user);
        } else {
            $stmt = $db->prepare("UPDATE users SET full_name = ?, email = ?, photo_url = ?, role = ?, updated_date = NOW() WHERE id = ?");
            $stmt->execute([$b['full_name'], $b['email'], $photo, $b['role'], (int)$id]);
            audit_log($db, 'update_user', 'user', (int)$id, "Usuario actualizado: {$b['email']} ({$b['role']})", 'success', $user);
        }

        syncPersonRecordForUser($db, (int)$id, $b['role'], $b['full_name'], $b['email']);
        $db->commit();

        sendResponse(['message' => 'Usuario actualizado']);
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'No se pudo actualizar el usuario'], 400);
    }
}

if ($method === 'DELETE' && $id) {
    if ((int)$id === (int)$user['id']) {
        sendResponse(['error' => 'No puedes eliminarte a ti mismo'], 400);
    }
    $b = getBody();
    $adminPassword = $b['admin_password'] ?? '';

    if (!is_string($adminPassword) || trim($adminPassword) === '') {
        sendResponse(['error' => 'Confirma tu contrasena de administrador para eliminar usuarios'], 400);
    }

    $check = $db->prepare("SELECT password FROM users WHERE id = ? AND role = 'admin'");
    $check->execute([(int)$user['id']]);
    $adminRow = $check->fetch(PDO::FETCH_ASSOC);
    if (!$adminRow || !password_verify($adminPassword, $adminRow['password'])) {
        audit_log($db, 'delete_user', 'user', (int)$id, "Intento de eliminar usuario con contrasena invalida", 'failed', $user);
        sendResponse(['error' => 'Contrasena de administrador incorrecta'], 403);
    }

    $prev = $db->prepare("SELECT email FROM users WHERE id = ?");
    $prev->execute([(int)$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        sendResponse(['error' => 'Usuario no encontrado'], 404);
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([(int)$id]);
    audit_log($db, 'delete_user', 'user', (int)$id, "Usuario eliminado: " . ($row['email'] ?? "#$id"), 'warning', $user);
    sendResponse(['message' => 'Usuario eliminado']);
}

sendResponse(['error' => 'Metodo no permitido'], 405);
