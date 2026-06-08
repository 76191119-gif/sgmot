<?php

function b64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateToken($user) {
    $header  = b64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = b64url_encode(json_encode([
        'id'        => $user['id'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'full_name' => $user['full_name'],
        'exp'       => time() + 86400, // 24h
    ]));
    $sig = b64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;
    $expected = b64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($s, $expected)) return null;
    $data = json_decode(b64url_decode($p), true);
    if (!$data || ($data['exp'] ?? 0) < time()) return null;
    return $data;
}

function requireAuth() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if (!str_starts_with($auth, 'Bearer ')) {
        sendResponse(['error' => 'No autenticado'], 401);
    }
    $user = verifyToken(substr($auth, 7));
    if (!$user) sendResponse(['error' => 'Token inválido o expirado'], 401);
    return $user;
}

function requireRole($roles) {
    $user = requireAuth();
    if (!in_array($user['role'], (array)$roles)) {
        sendResponse(['error' => 'Acceso denegado'], 403);
    }
    return $user;
}
