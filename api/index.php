<?php
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/auth.php';
require_once __DIR__ . '/helpers/audit.php';
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/config/database.php';

// CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit(0);
}

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^/sgmot/api#', '', $uri);
$method = $_SERVER['REQUEST_METHOD'];

$db = (new Database())->getConnection();

// Endpoints públicos de autenticación
if ($uri === '/auth/login' && $method === 'POST') {
    require __DIR__ . '/routes/auth.php';
    exit;
}
if ($uri === '/auth/register' && $method === 'POST') {
    require __DIR__ . '/routes/register.php';
    exit;
}
if ($uri === '/auth/google' && $method === 'POST') {
    require __DIR__ . '/routes/google.php';
    exit;
}

// Rutas protegidas
$segments = explode('/', trim($uri, '/'));
$resource = $segments[0] ?? '';
$id       = isset($segments[1]) && is_numeric($segments[1]) ? (int)$segments[1] : null;

switch ($resource) {
    case 'clients':     require __DIR__ . '/routes/clients.php'; break;
    case 'technicians': require __DIR__ . '/routes/technicians.php'; break;
    case 'work_orders': require __DIR__ . '/routes/work_orders.php'; break;
    case 'incidents':     require __DIR__ . '/routes/incidents.php'; break;
    case 'users':         require __DIR__ . '/routes/users.php'; break;
    case 'audit_logs':    require __DIR__ . '/routes/audit_logs.php'; break;
    case 'notifications': require __DIR__ . '/routes/notifications.php'; break;
    case 'reports':       require __DIR__ . '/routes/reports.php'; break;
    case 'me':            require __DIR__ . '/routes/me.php'; break;
    default:            sendResponse(['error' => 'Ruta no encontrada', 'uri' => $uri], 404);
}
