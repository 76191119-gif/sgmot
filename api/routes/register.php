<?php
/**
 * Registro publico de clientes.
 *
 * CASO A - DNI nuevo:
 *   - Crea usuario cliente + ficha clients.
 *   - Crea una orden nueva_instalacion en estado pendiente.
 *   - Notifica al admin para gestionar/asignar la instalacion.
 *
 * CASO B - DNI ya existe en clients:
 *   - Crea usuario cliente y lo vincula a la ficha existente.
 *   - Actualiza plan/datos de contacto.
 *   - No genera orden porque el cliente ya tiene servicio.
 */
$b = getBody();

$full_name = trim($b['full_name'] ?? '');
$dni       = trim($b['dni']       ?? '');
$phone     = trim($b['phone']     ?? '');
$email     = strtolower(trim($b['email'] ?? ''));
$password  = $b['password']       ?? '';
$address   = trim($b['address']   ?? '');
$district  = trim($b['district']  ?? '');
$plan      = $b['plan']           ?? 'basico_30mbps';
$latitude  = isset($b['latitude'])  && $b['latitude']  !== '' ? (float)$b['latitude']  : null;
$longitude = isset($b['longitude']) && $b['longitude'] !== '' ? (float)$b['longitude'] : null;

if (!$full_name || !$dni || !$phone || !$email || !$password || !$address) {
    sendResponse(['error' => 'Faltan campos obligatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Email no valido'], 400);
}
if (strlen($password) < 8) {
    sendResponse(['error' => 'La contrasena debe tener al menos 8 caracteres'], 400);
}
if (!in_array($plan, ['basico_30mbps','estandar_60mbps','premium_100mbps','empresarial_200mbps'], true)) {
    sendResponse(['error' => 'Plan no valido'], 400);
}
if ($latitude !== null && ($latitude < -90 || $latitude > 90)) {
    sendResponse(['error' => 'Latitud fuera de rango'], 400);
}
if ($longitude !== null && ($longitude < -180 || $longitude > 180)) {
    sendResponse(['error' => 'Longitud fuera de rango'], 400);
}

$ckEmail = $db->prepare("SELECT id FROM users WHERE email = ?");
$ckEmail->execute([$email]);
if ($ckEmail->fetch()) {
    audit_log($db, 'register_failed', null, null, "Email ya registrado: $email", 'failed', ['email' => $email]);
    sendResponse(['error' => 'Ya existe una cuenta con ese email'], 409);
}

$ckDni = $db->prepare("SELECT id, full_name, email, phone, user_id FROM clients WHERE dni = ?");
$ckDni->execute([$dni]);
$existingClient = $ckDni->fetch(PDO::FETCH_ASSOC);
$isNewClient = !$existingClient;

if ($existingClient && !empty($existingClient['user_id'])) {
    sendResponse(['error' => 'Ese cliente ya tiene una cuenta. Inicia sesion o contacta al soporte.'], 409);
}

if ($existingClient && !empty($existingClient['phone'])) {
    $knownPhone = preg_replace('/\D+/', '', $existingClient['phone']);
    $inputPhone = preg_replace('/\D+/', '', $phone);
    if ($knownPhone && $inputPhone && $knownPhone !== $inputPhone) {
        sendResponse(['error' => 'El DNI pertenece a un cliente existente, pero el telefono no coincide. Contacta al soporte.'], 409);
    }
}

$planLabels = [
    'basico_30mbps'       => 'Basico 30 Mbps',
    'estandar_60mbps'     => 'Estandar 60 Mbps',
    'premium_100mbps'     => 'Premium 100 Mbps',
    'empresarial_200mbps' => 'Empresarial 200 Mbps',
];
$planLabel = $planLabels[$plan] ?? $plan;

try {
    $db->beginTransaction();

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $u = $db->prepare("INSERT INTO users (full_name, email, password, role, profile_complete) VALUES (?, ?, ?, 'cliente', 1)");
    $u->execute([$full_name, $email, $hash]);
    $userId = (int)$db->lastInsertId();

    $user = [
        'id'        => $userId,
        'email'     => $email,
        'role'      => 'cliente',
        'full_name' => $full_name,
    ];

    if ($isNewClient) {
        $c = $db->prepare("INSERT INTO clients
            (user_id, full_name, dni, phone, email, address, district, latitude, longitude, plan, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')");
        $c->execute([$userId, $full_name, $dni, $phone, $email, $address, $district, $latitude, $longitude, $plan]);
        $clientId = (int)$db->lastInsertId();

        $orderNum = 'OT-INST-' . date('ymd') . '-' . str_pad($clientId, 4, '0', STR_PAD_LEFT);
        $desc = "Nueva instalacion solicitada por $full_name. Plan: $planLabel. Direccion: $address" .
            ($district ? ", $district" : '') .
            ($latitude !== null ? " (GPS: $latitude, $longitude)" : '');

        $wo = $db->prepare("INSERT INTO work_orders
            (order_number, type, client_id, client_name, client_address, status, priority, description)
            VALUES (?, 'nueva_instalacion', ?, ?, ?, 'pendiente', 'alta', ?)");
        $wo->execute([$orderNum, $clientId, $full_name, $address, $desc]);
        $orderId = (int)$db->lastInsertId();

        $db->commit();

        audit_log($db, 'register', 'user', $userId, "Nuevo cliente: $email - Plan $planLabel - Orden $orderNum generada", 'success', $user);

        notify_role($db, 'admin', 'order_new',
            'Nueva instalacion pendiente',
            "$full_name se registro y requiere instalacion. Plan: $planLabel. Orden: $orderNum.",
            '/work-orders', 'work_order', $orderId);

        notify_user($db, $userId, 'system',
            "Bienvenido a SGMOT, $full_name",
            "Tu cuenta fue creada. Generamos la orden $orderNum para instalar tu servicio ($planLabel).",
            '/work-orders');

        sendResponse([
            'token' => generateToken($user),
            'user' => $user,
            'client_id' => $clientId,
            'order_id' => $orderId,
            'order_number' => $orderNum,
            'is_new_client' => true,
            'message' => 'Cuenta creada. Orden de instalacion enviada al admin.',
        ], 201);
    }

    $clientId = (int)$existingClient['id'];
    $up = $db->prepare("UPDATE clients
        SET user_id = ?, full_name = ?, phone = ?, email = ?, address = ?, district = ?,
            latitude = ?, longitude = ?, plan = ?, status = 'activo', updated_date = NOW()
        WHERE id = ?");
    $up->execute([
        $userId, $full_name, $phone, $email, $address, $district,
        $latitude, $longitude, $plan, $clientId
    ]);

    $db->commit();

    audit_log($db, 'register', 'user', $userId, "Cliente existente registro cuenta: $email - Plan $planLabel", 'success', $user);

    notify_user($db, $userId, 'system',
        "Bienvenido de vuelta, $full_name",
        "Tu cuenta fue creada y tu plan quedo registrado como $planLabel. Tu servicio sigue activo.",
        '/profile');

    sendResponse([
        'token' => generateToken($user),
        'user' => $user,
        'client_id' => $clientId,
        'is_new_client' => false,
        'message' => 'Cuenta creada. Acceso habilitado.',
    ], 201);
} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    audit_log($db, 'register_failed', null, null, 'Error en registro: ' . $e->getMessage(), 'failed');
    sendResponse(['error' => 'Error al crear la cuenta. Intenta nuevamente.'], 500);
}
