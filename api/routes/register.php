<?php
/**
 * Registro público de clientes.
 * Crea un usuario (role=cliente) + ficha en clients vinculada por email,
 * con coordenadas opcionales. Devuelve token JWT para auto-login.
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

// ============= VALIDACIONES =============
if (!$full_name || !$dni || !$phone || !$email || !$password || !$address) {
    sendResponse(['error' => 'Faltan campos obligatorios'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Email no válido'], 400);
}
if (strlen($password) < 6) {
    sendResponse(['error' => 'La contraseña debe tener al menos 6 caracteres'], 400);
}
if (!in_array($plan, ['basico_30mbps', 'estandar_60mbps', 'premium_100mbps', 'empresarial_200mbps'])) {
    sendResponse(['error' => 'Plan no válido'], 400);
}
if ($latitude !== null && ($latitude < -90 || $latitude > 90)) {
    sendResponse(['error' => 'Latitud fuera de rango'], 400);
}
if ($longitude !== null && ($longitude < -180 || $longitude > 180)) {
    sendResponse(['error' => 'Longitud fuera de rango'], 400);
}

// Verificar duplicados
$ck = $db->prepare("SELECT id FROM users WHERE email = ?");
$ck->execute([$email]);
if ($ck->fetch()) {
    audit_log($db, 'register_failed', null, null, "Email ya registrado: $email", 'failed', ['email' => $email]);
    sendResponse(['error' => 'Ya existe una cuenta con ese email'], 409);
}
$ck = $db->prepare("SELECT id FROM clients WHERE dni = ?");
$ck->execute([$dni]);
if ($ck->fetch()) {
    audit_log($db, 'register_failed', null, null, "DNI ya registrado: $dni", 'failed');
    sendResponse(['error' => 'Ya existe un cliente con ese DNI'], 409);
}

try {
    $db->beginTransaction();

    // 1) Crear usuario
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $u = $db->prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'cliente')");
    $u->execute([$full_name, $email, $hash]);
    $userId = (int)$db->lastInsertId();

    // 2) Crear ficha de cliente con coordenadas
    $c = $db->prepare("INSERT INTO clients
        (full_name, dni, phone, email, address, district, latitude, longitude, plan, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')");
    $c->execute([$full_name, $dni, $phone, $email, $address, $district, $latitude, $longitude, $plan]);
    $clientId = (int)$db->lastInsertId();

    $db->commit();

    // 3) Datos de usuario para token
    $user = [
        'id'        => $userId,
        'email'     => $email,
        'role'      => 'cliente',
        'full_name' => $full_name,
    ];

    // 4) Audit + notificaciones
    $hasLoc = $latitude !== null ? " (con geolocalización)" : "";
    audit_log($db, 'register', 'user', $userId,
        "Auto-registro de cliente: $email - Plan $plan$hasLoc", 'success', $user);

    // Notificar a todos los admins
    notify_role($db, 'admin', 'order_new',
        '🆕 Nuevo cliente registrado',
        "$full_name ($email) se registró desde el formulario público. Plan: $plan.",
        '/clients', 'client', $clientId);

    // Bienvenida al nuevo cliente
    notify_user($db, $userId, 'system',
        "¡Bienvenido a SGMOT, $full_name!",
        "Tu cuenta de cliente fue creada exitosamente. Plan contratado: $plan. Desde tu portal puedes solicitar servicios y reportar incidencias.",
        '/profile');

    sendResponse([
        'token'     => generateToken($user),
        'user'      => $user,
        'client_id' => $clientId,
        'message'   => 'Cuenta creada correctamente',
    ], 201);

} catch (PDOException $e) {
    if ($db->inTransaction()) $db->rollBack();
    audit_log($db, 'register_failed', null, null, 'Error en registro: ' . $e->getMessage(), 'failed');
    sendResponse(['error' => 'Error al crear la cuenta. Intenta nuevamente.'], 500);
}
