<?php
$user = requireAuth();
$action = $segments[1] ?? null;

// GET /me  → datos del usuario actual
if ($method === 'GET' && !$action) {
    $stmt = $db->prepare("SELECT id, full_name, email, role, provider, profile_complete, created_date FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($row ?: ['error' => 'Usuario no encontrado'], $row ? 200 : 404);
}

// GET /me/client → ficha de cliente del usuario actual (solo role=cliente)
if ($method === 'GET' && $action === 'client') {
    if ($user['role'] !== 'cliente') {
        sendResponse(['error' => 'Solo los clientes tienen ficha'], 403);
    }
    $stmt = $db->prepare("SELECT * FROM clients WHERE email = ?");
    $stmt->execute([$user['email']]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($client ?: null);
}

// PUT /me/profile  → actualizar nombre / email
if ($method === 'PUT' && $action === 'profile') {
    $b = getBody();
    if (empty($b['full_name']) || empty($b['email'])) {
        sendResponse(['error' => 'Nombre y email son obligatorios'], 400);
    }
    try {
        $stmt = $db->prepare("UPDATE users SET full_name=?, email=?, updated_date=NOW() WHERE id=?");
        $stmt->execute([$b['full_name'], $b['email'], $user['id']]);
        sendResponse(['message' => 'Perfil actualizado']);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Email ya en uso por otro usuario'], 400);
    }
}

// PUT /me/password  → cambiar contraseña
if ($method === 'PUT' && $action === 'password') {
    $b = getBody();
    $current = $b['current_password'] ?? '';
    $newPwd  = $b['new_password'] ?? '';
    if (!$current || !$newPwd) sendResponse(['error' => 'Contraseñas requeridas'], 400);
    if (strlen($newPwd) < 4) sendResponse(['error' => 'Nueva contraseña muy corta'], 400);

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !password_verify($current, $row['password'])) {
        sendResponse(['error' => 'La contraseña actual es incorrecta'], 401);
    }
    $hash = password_hash($newPwd, PASSWORD_BCRYPT);
    $upd = $db->prepare("UPDATE users SET password=?, updated_date=NOW() WHERE id=?");
    $upd->execute([$hash, $user['id']]);
    audit_log($db, 'change_password', 'user', (int)$user['id'], 'Cambio propio de contraseña', 'warning', $user);
    sendResponse(['message' => 'Contraseña actualizada']);
}

// POST /me/complete-profile  → cliente Google completa sus datos
if ($method === 'POST' && $action === 'complete-profile') {
    if ($user['role'] !== 'cliente') {
        sendResponse(['error' => 'Solo clientes pueden completar perfil'], 403);
    }
    $b = getBody();

    $full_name = trim($b['full_name'] ?? '') ?: $user['full_name'];
    $dni       = trim($b['dni']       ?? '');
    $phone     = trim($b['phone']     ?? '');
    $address   = trim($b['address']   ?? '');
    $district  = trim($b['district']  ?? '');
    $plan      = $b['plan']           ?? 'basico_30mbps';
    $latitude  = isset($b['latitude'])  && $b['latitude']  !== '' ? (float)$b['latitude']  : null;
    $longitude = isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null;

    if (!$dni || !$phone || !$address) {
        sendResponse(['error' => 'DNI, teléfono y dirección son obligatorios'], 400);
    }
    if (!in_array($plan, ['basico_30mbps','estandar_60mbps','premium_100mbps','empresarial_200mbps'])) {
        sendResponse(['error' => 'Plan inválido'], 400);
    }

    // Verificar DNI único
    $ck = $db->prepare("SELECT id, email FROM clients WHERE dni = ?");
    $ck->execute([$dni]);
    $existing = $ck->fetch(PDO::FETCH_ASSOC);
    if ($existing && $existing['email'] !== $user['email']) {
        sendResponse(['error' => 'Ese DNI ya está registrado por otro cliente'], 409);
    }

    try {
        $db->beginTransaction();

        // Si ya existía ficha → actualizar
        $ck = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $ck->execute([$user['email']]);
        $cur = $ck->fetch(PDO::FETCH_ASSOC);

        if ($cur) {
            $up = $db->prepare("UPDATE clients
                SET full_name=?, dni=?, phone=?, address=?, district=?, latitude=?, longitude=?, plan=?, updated_date=NOW()
                WHERE id=?");
            $up->execute([$full_name, $dni, $phone, $address, $district, $latitude, $longitude, $plan, $cur['id']]);
            $clientId = (int)$cur['id'];
        } else {
            $ins = $db->prepare("INSERT INTO clients
                (full_name, dni, phone, email, address, district, latitude, longitude, plan, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')");
            $ins->execute([$full_name, $dni, $phone, $user['email'], $address, $district, $latitude, $longitude, $plan]);
            $clientId = (int)$db->lastInsertId();
        }

        // Marcar perfil completo y actualizar nombre del usuario
        $up2 = $db->prepare("UPDATE users SET full_name=?, profile_complete=1, updated_date=NOW() WHERE id=?");
        $up2->execute([$full_name, $user['id']]);

        $db->commit();

        audit_log($db, 'complete_profile', 'client', $clientId,
            "Cliente completó su perfil: $full_name (Plan $plan)", 'success', $user);
        notify_role($db, 'admin', 'order_new',
            'Cliente completó su perfil',
            "$full_name ya tiene todos sus datos cargados.",
            '/clients', 'client', $clientId);

        sendResponse(['message' => 'Perfil completado', 'client_id' => $clientId]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'Error al guardar: ' . $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Ruta no encontrada'], 404);
