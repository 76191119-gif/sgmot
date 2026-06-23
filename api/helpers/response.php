<?php
function sendResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');

    // Security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    header("Content-Security-Policy: default-src 'self'; script-src 'self' https://accounts.google.com https://code.highcharts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://oauth2.googleapis.com https://nominatim.openstreetmap.org; frame-src 'self' https://accounts.google.com https://www.openstreetmap.org");
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

    // CORS
    header('Access-Control-Allow-Origin: ' . (defined('CORS_ALLOWED_ORIGIN') ? CORS_ALLOWED_ORIGIN : 'http://localhost:5173'));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 3600');

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    // Validar Content-Type en POST/PUT/PATCH
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'], true)) {
        if (strpos($contentType, 'application/json') === false) {
            sendResponse(['error' => 'Content-Type debe ser application/json'], 400);
        }
    }

    return json_decode(file_get_contents('php://input'), true) ?? [];
}
