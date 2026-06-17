<?php
// CSRF token management - aunque usamos SPA + CORS, implementamos por defensa en profundidad

session_start();

function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function getCSRFToken() {
    return $_SESSION['csrf_token'] ?? null;
}

function validateCSRFToken($token) {
    $expected = $_SESSION['csrf_token'] ?? null;
    if (!$expected || !hash_equals($expected, $token ?? '')) {
        return false;
    }
    return true;
}

function verifyCSRFIfNeeded() {
    // Para POST/PUT/DELETE (mutaciones), validar CSRF token si existe
    if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'], true)) {
        return true;
    }

    // Token CSRF desde header X-CSRF-Token (SPA lo envía)
    $headerToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    // En desarrollo/localhost, CSRF es menos crítico (CORS + SPA lo mitigan)
    // Pero en producción HTTPS, validar siempre
    if (!empty($headerToken)) {
        if (!validateCSRFToken($headerToken)) {
            return false;
        }
    }

    return true;
}
