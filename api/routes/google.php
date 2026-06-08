<?php
/**
 * Login con Google.
 * El frontend envía el ID token devuelto por Google Identity Services.
 * Verificamos con el endpoint público tokeninfo de Google.
 *
 * Si el usuario no existe, lo creamos como cliente con profile_complete=0
 * (deberá completar dni, phone, address, plan después).
 */
$b = getBody();
$idToken = trim($b['id_token'] ?? '');

if (!$idToken) {
    sendResponse(['error' => 'Falta id_token'], 400);
}

$allowDemoGoogle = sgmot_env_value('SGMOT_ALLOW_GOOGLE_DEMO', 'false') === 'true';

// Detectar si es un token simulado (para desarrollo)
if ($allowDemoGoogle && strpos($idToken, '.') !== false) {
    $parts = explode('.', $idToken);
    if (count($parts) === 3) {
        try {
            $payload = json_decode(base64_decode($parts[1]), true);
            if ($payload && isset($payload['email']) && $payload['email'] === 'usuario.demo@gmail.com') {
                // Es un token simulado, procesarlo directamente
                $email = 'usuario.demo@gmail.com';
                $fullName = 'Usuario Demo Google';
                $googleSub = 'demo_google_sub_123456';
                
                // Buscar usuario existente
                $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                $isNewUser = false;
                if (!$user) {
                    // Crear nuevo usuario como cliente, profile_complete=0
                    $randomPwd = bin2hex(random_bytes(16));
                    $hash = password_hash($randomPwd, PASSWORD_BCRYPT);
                    $ins = $db->prepare("INSERT INTO users (full_name, email, password, role, provider, google_sub, profile_complete)
                                         VALUES (?, ?, ?, 'cliente', 'google', ?, 0)");
                    $ins->execute([$fullName, $email, $hash, $googleSub]);
                    $userId = (int)$db->lastInsertId();

                    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                    $stmt->execute([$userId]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    $isNewUser = true;

                    audit_log($db, 'register', 'user', $userId, "Registro con Google (DEMO): $email", 'success', $user);
                    // Notificar a admins
                    notify_role($db, 'admin', 'order_new',
                        '🎯 Nuevo cliente registrado (Google Demo)',
                        "$fullName ($email) inició sesión con Google en modo demo. Debe completar su perfil.",
                        '/clients', 'user', $userId);
                    notify_user($db, $userId, 'system',
                        "¡Bienvenido, $fullName!",
                        "Tu cuenta fue creada con Google. Completa tus datos para empezar.",
                        '/complete-profile');
                } else {
                    audit_log($db, 'login', 'user', $user['id'], "Login con Google (DEMO): $email", 'success', $user);
                }

                // Verificar si su perfil de cliente está completo
                $profileComplete = (int)$user['profile_complete'] === 1;
                if ($user['role'] === 'cliente' && $profileComplete) {
                    // Asegurar que también tiene ficha en clients
                    if (!findCurrentClient($db, $user)) {
                        // Tiene profile_complete=1 pero no hay ficha → marcar incompleto
                        $db->prepare("UPDATE users SET profile_complete=0 WHERE id=?")->execute([$user['id']]);
                        $profileComplete = false;
                    }
                }

                sendResponse([
                    'token'            => generateToken($user),
                    'user'             => [
                        'id'        => (int)$user['id'],
                        'full_name' => $user['full_name'],
                        'email'     => $user['email'],
                        'role'      => $user['role'],
                        'provider'  => $user['provider'] ?? 'local',
                    ],
                    'is_new_user'      => $isNewUser,
                    'profile_complete' => $profileComplete,
                ]);
                return;
            }
        } catch (Exception $e) {
            // Si falla el parsing, continuar con verificación normal
        }
    }
}

// Verificar token con Google (modo producción)
if (!defined('GOOGLE_CLIENT_ID') || !GOOGLE_CLIENT_ID) {
    audit_log($db, 'google_login_failed', null, null, 'Google Client ID no configurado', 'failed');
    sendResponse(['error' => 'Google OAuth no esta configurado en el servidor'], 500);
}

function fetchGoogleTokenInfo($idToken) {
    $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($body !== false && $body !== '') return $body;
        error_log('google tokeninfo curl error: ' . $err);
    }

    $ctx = stream_context_create([
        'http' => ['timeout' => 8, 'ignore_errors' => true],
    ]);
    return @file_get_contents($url, false, $ctx);
}

$resp = fetchGoogleTokenInfo($idToken);

if (!$resp) {
    audit_log($db, 'google_login_failed', null, null, 'No se pudo contactar Google', 'failed');
    sendResponse(['error' => 'No se pudo verificar el token con Google. Revisa internet del servidor.'], 502);
}

$info = json_decode($resp, true);
if (!$info || isset($info['error'])) {
    audit_log($db, 'google_login_failed', null, null, 'Token inválido: ' . ($info['error_description'] ?? 'desconocido'), 'failed');
    sendResponse(['error' => 'Token de Google invalido o expirado. Intenta iniciar sesion nuevamente.'], 401);
}

// Validar audiencia si está configurada (opcional)
$expectedAud = GOOGLE_CLIENT_ID;
if (($info['aud'] ?? '') !== $expectedAud) {
    audit_log($db, 'google_login_failed', null, null, 'Audiencia inválida', 'failed');
    sendResponse(['error' => 'El Client ID de Google del frontend no coincide con el backend'], 401);
}

if (empty($info['email']) || empty($info['email_verified']) || $info['email_verified'] === 'false') {
    sendResponse(['error' => 'Email de Google no verificado'], 401);
}

$email     = strtolower($info['email']);
$fullName  = $info['name'] ?? $email;
$googleSub = $info['sub']  ?? null;

// Buscar usuario existente
$stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

$isNewUser = false;
if (!$user) {
    // Crear nuevo usuario como cliente, profile_complete=0
    $randomPwd = bin2hex(random_bytes(16));
    $hash = password_hash($randomPwd, PASSWORD_BCRYPT);
    $ins = $db->prepare("INSERT INTO users (full_name, email, password, role, provider, google_sub, profile_complete)
                         VALUES (?, ?, ?, 'cliente', 'google', ?, 0)");
    $ins->execute([$fullName, $email, $hash, $googleSub]);
    $userId = (int)$db->lastInsertId();

    $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $isNewUser = true;

    audit_log($db, 'register', 'user', $userId, "Registro con Google: $email", 'success', $user);
    // Notificar a admins
    notify_role($db, 'admin', 'order_new',
        '🆕 Nuevo cliente registrado (Google)',
        "$fullName ($email) inició sesión con Google. Debe completar su perfil.",
        '/clients', 'user', $userId);
    notify_user($db, $userId, 'system',
        "¡Bienvenido, $fullName!",
        "Tu cuenta fue creada con Google. Completa tus datos para empezar.",
        '/complete-profile');
} else {
    // Actualizar google_sub si es la primera vez
    if (empty($user['google_sub'])) {
        $up = $db->prepare("UPDATE users SET google_sub = ?, provider = 'google' WHERE id = ?");
        $up->execute([$googleSub, $user['id']]);
    }
    audit_log($db, 'login', null, null, 'Inicio de sesión con Google', 'success', $user);
}

// Verificar si su perfil de cliente está completo
$profileComplete = (int)$user['profile_complete'] === 1;
if ($user['role'] === 'cliente' && $profileComplete) {
    // Asegurar que también tiene ficha en clients
    if (!findCurrentClient($db, $user)) {
        // Tiene profile_complete=1 pero no hay ficha → marcar incompleto
        $db->prepare("UPDATE users SET profile_complete=0 WHERE id=?")->execute([$user['id']]);
        $profileComplete = false;
    }
}

sendResponse([
    'token'            => generateToken($user),
    'user'             => [
        'id'        => (int)$user['id'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'provider'  => $user['provider'] ?? 'local',
    ],
    'is_new_user'      => $isNewUser,
    'profile_complete' => $profileComplete,
]);
