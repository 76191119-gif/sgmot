<?php
$user = requireAuth();
$action = $segments[1] ?? null;

function validateProfilePhoto($photo) {
    if ($photo === null || $photo === '') return null;
    if (!is_string($photo) || !preg_match('/^data:image\/(png|jpe?g|webp);base64,/i', $photo)) {
        sendResponse(['error' => 'Foto no valida. Usa PNG, JPG o WEBP.'], 400);
    }
    if (strlen($photo) > 700000) {
        sendResponse(['error' => 'La foto es muy pesada. Usa una imagen menor a 500 KB.'], 400);
    }
    return $photo;
}

function currentUserPayload($db, $user) {
    $stmt = $db->prepare("SELECT id, full_name, email, photo_url, role, provider, profile_complete, created_date, updated_date FROM users WHERE id = ?");
    $stmt->execute([(int)$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) return null;

    $profile = null;
    if ($row['role'] === 'cliente') {
        $profile = findCurrentClient($db, $row);
    } elseif ($row['role'] === 'tecnico') {
        $profile = findCurrentTechnician($db, $row);
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

if ($method === 'GET' && !$action) {
    $payload = currentUserPayload($db, $user);
    sendResponse($payload ?: ['error' => 'Usuario no encontrado'], $payload ? 200 : 404);
}

if ($method === 'GET' && $action === 'client') {
    if ($user['role'] !== 'cliente') {
        sendResponse(['error' => 'Solo los clientes tienen ficha'], 403);
    }
    sendResponse(findCurrentClient($db, $user));
}

if ($method === 'PUT' && $action === 'profile') {
    if ($user['role'] === 'tecnico') {
        sendResponse(['error' => 'El perfil del tecnico solo puede ser actualizado por el admin'], 403);
    }

    $b = getBody();
    $fullName = trim($b['full_name'] ?? '');
    $email = strtolower(trim($b['email'] ?? ''));
    $photo = array_key_exists('photo_url', $b) ? validateProfilePhoto($b['photo_url']) : ($user['photo_url'] ?? null);

    if (!$fullName || !$email) {
        sendResponse(['error' => 'Nombre y email son obligatorios'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Email no valido'], 400);
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE users SET full_name = ?, email = ?, photo_url = ?, updated_date = NOW() WHERE id = ?");
        $stmt->execute([$fullName, $email, $photo, (int)$user['id']]);
        syncPersonRecordForUser($db, (int)$user['id'], $user['role'], $fullName, $email);

        $db->commit();

        sendResponse([
            'message' => 'Perfil actualizado',
            'user' => currentUserPayload($db, ['id' => (int)$user['id'], 'role' => $user['role']]),
        ]);
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'Email ya en uso por otro usuario'], 400);
    }
}

if ($method === 'PUT' && $action === 'password') {
    if ($user['role'] === 'tecnico') {
        sendResponse(['error' => 'La contrasena del tecnico solo puede ser actualizada por el admin'], 403);
    }

    $b = getBody();
    $current = $b['current_password'] ?? '';
    $newPwd = $b['new_password'] ?? '';

    if (!$current || !$newPwd) {
        sendResponse(['error' => 'Contrasenas requeridas'], 400);
    }
    if (strlen($newPwd) < 8) {
        sendResponse(['error' => 'La nueva contrasena debe tener al menos 8 caracteres'], 400);
    }

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([(int)$user['id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || !password_verify($current, $row['password'])) {
        sendResponse(['error' => 'La contrasena actual es incorrecta'], 401);
    }

    $hash = password_hash($newPwd, PASSWORD_BCRYPT);
    $upd = $db->prepare("UPDATE users SET password = ?, updated_date = NOW() WHERE id = ?");
    $upd->execute([$hash, (int)$user['id']]);

    audit_log($db, 'change_password', 'user', (int)$user['id'], 'Cambio propio de contrasena', 'warning', $user);
    sendResponse(['message' => 'Contrasena actualizada']);
}

if ($method === 'POST' && $action === 'complete-profile') {
    if ($user['role'] !== 'cliente') {
        sendResponse(['error' => 'Solo clientes pueden completar perfil'], 403);
    }

    $b = getBody();
    $currentClient = findCurrentClient($db, $user);

    $fullName = trim($b['full_name'] ?? '') ?: $user['full_name'];
    $dni = trim($b['dni'] ?? '') ?: ($currentClient['dni'] ?? '');
    $phone = trim($b['phone'] ?? '') ?: ($currentClient['phone'] ?? '');
    $address = trim($b['address'] ?? '');
    $district = trim($b['district'] ?? '');
    $plan = $b['plan'] ?? 'basico_30mbps';
    $latitude = isset($b['latitude']) && $b['latitude'] !== '' ? (float)$b['latitude'] : null;
    $longitude = isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null;
    $planLabels = [
        'basico_30mbps' => 'Basico 30 Mbps',
        'estandar_60mbps' => 'Estandar 60 Mbps',
        'premium_100mbps' => 'Premium 100 Mbps',
        'empresarial_200mbps' => 'Empresarial 200 Mbps',
    ];
    $planLabel = $planLabels[$plan] ?? $plan;

    if (!$dni || !$phone || !$address) {
        sendResponse(['error' => 'DNI, telefono y direccion son obligatorios'], 400);
    }
    if (!in_array($plan, ['basico_30mbps', 'estandar_60mbps', 'premium_100mbps', 'empresarial_200mbps'], true)) {
        sendResponse(['error' => 'Plan invalido'], 400);
    }

    $ck = $db->prepare("SELECT id, user_id, email FROM clients WHERE dni = ?");
    $ck->execute([$dni]);
    $existing = $ck->fetch(PDO::FETCH_ASSOC);
    if ($existing && (int)$existing['id'] !== (int)($currentClient['id'] ?? 0)) {
        if (!empty($existing['user_id']) && (int)$existing['user_id'] !== (int)$user['id']) {
            sendResponse(['error' => 'Ese DNI ya esta registrado por otro cliente'], 409);
        }
        if (empty($existing['user_id']) && $existing['email'] !== $user['email']) {
            sendResponse(['error' => 'Ese DNI ya esta registrado por otro cliente'], 409);
        }
    }

    try {
        $db->beginTransaction();
        $createdNewClient = false;
        $orderId = null;
        $orderNum = null;

        if ($currentClient) {
            $up = $db->prepare("UPDATE clients
                SET user_id = ?, full_name = ?, dni = ?, phone = ?, email = ?, address = ?, district = ?,
                    latitude = ?, longitude = ?, plan = ?, updated_date = NOW()
                WHERE id = ?");
            $up->execute([
                (int)$user['id'], $fullName, $dni, $phone, $user['email'], $address, $district,
                $latitude, $longitude, $plan, (int)$currentClient['id'],
            ]);
            $clientId = (int)$currentClient['id'];
        } else {
            $ins = $db->prepare("INSERT INTO clients
                (user_id, full_name, dni, phone, email, address, district, latitude, longitude, plan, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')");
            $ins->execute([
                (int)$user['id'], $fullName, $dni, $phone, $user['email'], $address, $district,
                $latitude, $longitude, $plan,
            ]);
            $clientId = (int)$db->lastInsertId();
            $createdNewClient = true;
        }

        if ($createdNewClient) {
            $orderNum = 'OT-INST-' . date('ymd') . '-' . str_pad($clientId, 4, '0', STR_PAD_LEFT);
            $desc = "Nueva instalacion solicitada por $fullName. Plan: $planLabel. Direccion: $address" .
                ($district ? ", $district" : '') .
                ($latitude !== null ? " (GPS: $latitude, $longitude)" : '');

            $wo = $db->prepare("INSERT INTO work_orders
                (order_number, type, client_id, client_name, client_address, status, priority, description)
                VALUES (?, 'nueva_instalacion', ?, ?, ?, 'pendiente', 'alta', ?)");
            $wo->execute([$orderNum, $clientId, $fullName, $address, $desc]);
            $orderId = (int)$db->lastInsertId();
        }

        $upUser = $db->prepare("UPDATE users SET full_name = ?, profile_complete = 1, updated_date = NOW() WHERE id = ?");
        $upUser->execute([$fullName, (int)$user['id']]);

        $db->commit();

        audit_log($db, 'complete_profile', 'client', $clientId, "Cliente completo su perfil: $fullName", 'success', $user);
        if ($createdNewClient) {
            notify_role($db, 'admin', 'order_new',
                'Nueva instalacion pendiente',
                "$fullName completo su perfil con Google y requiere instalacion. Plan: $planLabel. Orden: $orderNum.",
                '/work-orders', 'work_order', $orderId);

            notify_user($db, (int)$user['id'], 'system',
                "Perfil completado, $fullName",
                "Generamos la orden $orderNum para instalar tu servicio ($planLabel).",
                '/work-orders', 'work_order', $orderId);
        } else {
            notify_role($db, 'admin', 'info', 'Cliente completo su perfil', "$fullName ya tiene todos sus datos cargados.", '/clients', 'client', $clientId);
        }

        sendResponse([
            'message' => 'Perfil completado',
            'client_id' => $clientId,
            'order_id' => $orderId,
            'order_number' => $orderNum,
            'is_new_client' => $createdNewClient,
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('SGMOT complete profile error: ' . $e->getMessage());
        sendResponse(['error' => 'Error al guardar el perfil'], 500);
    }
}

sendResponse(['error' => 'Ruta no encontrada'], 404);
