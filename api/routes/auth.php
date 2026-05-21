<?php
$b = getBody();
$email    = trim($b['email'] ?? '');
$password = $b['password'] ?? '';

if (!$email || !$password) {
    sendResponse(['error' => 'Email y contraseña requeridos'], 400);
}

$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    audit_log($db, 'login_failed', null, null, "Email no registrado: $email", 'failed', ['email' => $email]);
    sendResponse(['error' => 'Credenciales incorrectas'], 401);
}

if (!password_verify($password, $user['password'])) {
    audit_log($db, 'login_failed', null, null, "Contraseña incorrecta para $email", 'failed', $user);
    sendResponse(['error' => 'Credenciales incorrectas'], 401);
}

// Login exitoso
audit_log($db, 'login', null, null, 'Inicio de sesión exitoso', 'success', $user);

sendResponse([
    'token' => generateToken($user),
    'user'  => [
        'id'        => (int)$user['id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
    ]
]);
