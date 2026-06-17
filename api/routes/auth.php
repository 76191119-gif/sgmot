<?php
$b = getBody();
$email = strtolower(trim($b['email'] ?? ''));
$password = $b['password'] ?? '';

if (!$email || !$password) {
    sendResponse(['error' => 'Email y contrasena requeridos'], 400);
}

$ip = function_exists('get_client_ip') ? get_client_ip() : ($_SERVER['REMOTE_ADDR'] ?? '');
$limit = $db->prepare("
    SELECT COUNT(*)
    FROM audit_logs
    WHERE action = 'login_failed'
      AND status = 'failed'
      AND created_date >= (NOW() - INTERVAL 15 MINUTE)
      AND (user_email = ? OR ip_address = ?)
");
$limit->execute([$email, $ip]);
if ((int)$limit->fetchColumn() >= 5) {
    sendResponse(['error' => 'Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.'], 429);
}

$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    // NO revelar si el email existe (información disclosure)
    audit_log($db, 'login_failed', null, null, 'Email o contraseña inválidos', 'failed', ['email' => $email]);
    sendResponse(['error' => 'Credenciales incorrectas'], 401);
}

if (!password_verify($password, $user['password'])) {
    // NO revelar datos sensibles en logs públicos
    audit_log($db, 'login_failed', null, null, 'Email o contraseña inválidos', 'failed', ['email' => $email]);
    sendResponse(['error' => 'Credenciales incorrectas'], 401);
}

audit_log($db, 'login', null, null, 'Inicio de sesion exitoso', 'success', $user);

sendResponse([
    'token' => generateToken($user),
    'user' => [
        'id' => (int)$user['id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
]);
