<?php
/**
 * SECURITY CHECK - Verificar configuración de seguridad de SGMOT
 * Uso: php api/security-check.php
 */

echo "\n";
echo "════════════════════════════════════════════════════════════════\n";
echo "🔒 SGMOT SECURITY CHECK\n";
echo "════════════════════════════════════════════════════════════════\n\n";

$checks = [
    'passed' => [],
    'warnings' => [],
    'failed' => [],
];

// Cargar configuración
require_once __DIR__ . '/config/app.php';

// 1. JWT_SECRET
echo "✓ Verificando JWT_SECRET...\n";
if (!defined('JWT_SECRET')) {
    $checks['failed'][] = 'JWT_SECRET no está definido';
} elseif (JWT_SECRET === 'SGMOT_CHANGE_THIS_SECRET_IN_ENV') {
    $checks['failed'][] = 'JWT_SECRET usa valor por defecto (INSEGURO)';
} elseif (strlen(JWT_SECRET) < 32) {
    $checks['failed'][] = 'JWT_SECRET es muy corto (< 32 caracteres)';
} else {
    $checks['passed'][] = 'JWT_SECRET: Configurado correctamente';
}

// 2. CORS
echo "✓ Verificando CORS_ALLOWED_ORIGIN...\n";
if (CORS_ALLOWED_ORIGIN === '*') {
    $checks['warnings'][] = 'CORS_ALLOWED_ORIGIN = * (aceptable en desarrollo, inseguro en producción)';
} else {
    $checks['passed'][] = "CORS_ALLOWED_ORIGIN: {" . CORS_ALLOWED_ORIGIN . "}";
}

// 3. Base de datos
echo "✓ Verificando conexión a base de datos...\n";
try {
    require_once __DIR__ . '/config/database.php';
    $db = (new Database())->getConnection();
    $checks['passed'][] = 'Base de datos: Conectada';
} catch (Exception $e) {
    $checks['failed'][] = 'Base de datos: ' . $e->getMessage();
}

// 4. Archivos de ayuda
echo "✓ Verificando helpers...\n";
$helpers = ['auth.php', 'response.php', 'audit.php', 'identity.php', 'validators.php', 'csrf.php'];
foreach ($helpers as $helper) {
    $path = __DIR__ . '/helpers/' . $helper;
    if (file_exists($path)) {
        $checks['passed'][] = "Helper: {$helper} ✓";
    } else {
        $checks['failed'][] = "Helper faltante: {$helper}";
    }
}

// 5. Rutas
echo "✓ Verificando rutas...\n";
$routes = ['auth.php', 'register.php', 'google.php', 'me.php', 'users.php', 'clients.php',
           'technicians.php', 'work_orders.php', 'incidents.php', 'notifications.php',
           'audit_logs.php', 'reports.php'];
foreach ($routes as $route) {
    $path = __DIR__ . '/routes/' . $route;
    if (file_exists($path)) {
        $checks['passed'][] = "Ruta: {$route} ✓";
    } else {
        $checks['failed'][] = "Ruta faltante: {$route}";
    }
}

// 6. Extensiones PHP requeridas
echo "✓ Verificando extensiones PHP...\n";
$requiredExtensions = ['json', 'pdo', 'curl', 'openssl', 'gd'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        $checks['passed'][] = "Extensión PHP: {$ext} ✓";
    } else {
        $checks['failed'][] = "Extensión PHP faltante: {$ext}";
    }
}

// 7. Permisos de archivos
echo "✓ Verificando permisos...\n";
$importantDirs = ['routes', 'helpers', 'config'];
foreach ($importantDirs as $dir) {
    $path = __DIR__ . '/' . $dir;
    if (is_readable($path)) {
        $checks['passed'][] = "Directorio legible: {$dir}/ ✓";
    } else {
        $checks['failed'][] = "Directorio no legible: {$dir}/";
    }
}

// 8. .env.example
echo "✓ Verificando configuración...\n";
if (file_exists(__DIR__ . '/.env.example')) {
    $checks['passed'][] = '.env.example presente ✓';
} else {
    $checks['warnings'][] = '.env.example no encontrado';
}

// 9. Timezone
echo "✓ Verificando timezone...\n";
if (defined('APP_TIMEZONE')) {
    $checks['passed'][] = "APP_TIMEZONE: " . APP_TIMEZONE;
} else {
    $checks['warnings'][] = 'APP_TIMEZONE no definido (usará default)';
}

// 10. Google Client ID (opcional)
echo "✓ Verificando Google OAuth...\n";
if (defined('GOOGLE_CLIENT_ID') && GOOGLE_CLIENT_ID) {
    $checks['passed'][] = 'GOOGLE_CLIENT_ID: Configurado ✓';
} else {
    $checks['warnings'][] = 'GOOGLE_CLIENT_ID no configurado (Google OAuth deshabilitado)';
}

// Resultados
echo "\n";
echo "════════════════════════════════════════════════════════════════\n";
echo "RESULTADOS\n";
echo "════════════════════════════════════════════════════════════════\n\n";

if (!empty($checks['passed'])) {
    echo "✅ PASARON (" . count($checks['passed']) . "):\n";
    foreach ($checks['passed'] as $check) {
        echo "   ✓ $check\n";
    }
    echo "\n";
}

if (!empty($checks['warnings'])) {
    echo "⚠️  ADVERTENCIAS (" . count($checks['warnings']) . "):\n";
    foreach ($checks['warnings'] as $check) {
        echo "   ⚠ $check\n";
    }
    echo "\n";
}

if (!empty($checks['failed'])) {
    echo "❌ FALLARON (" . count($checks['failed']) . "):\n";
    foreach ($checks['failed'] as $check) {
        echo "   ✗ $check\n";
    }
    echo "\n";
}

// Resumen
$totalChecks = count($checks['passed']) + count($checks['warnings']) + count($checks['failed']);
$failureCount = count($checks['failed']);

echo "════════════════════════════════════════════════════════════════\n";
if ($failureCount === 0) {
    echo "✅ SECURITY CHECK PASSED - Sistema seguro para usar\n";
} else {
    echo "❌ SECURITY CHECK FAILED - Hay $failureCount problemas a resolver\n";
}
echo "════════════════════════════════════════════════════════════════\n\n";

echo "Total: $totalChecks checks\n";
echo "Pasaron: " . count($checks['passed']) . "\n";
echo "Advertencias: " . count($checks['warnings']) . "\n";
echo "Fallaron: " . count($checks['failed']) . "\n\n";

// Recomendaciones
if ($failureCount > 0 || !empty($checks['warnings'])) {
    echo "📋 RECOMENDACIONES:\n";
    echo "   1. Revisar archivos de configuración (api/.env)\n";
    echo "   2. Asegurar JWT_SECRET es aleatorio (32+ caracteres)\n";
    echo "   3. En producción, CORS_ALLOWED_ORIGIN debe ser dominio específico\n";
    echo "   4. Verificar permisos de directorio/archivos\n";
    echo "   5. Leer SECURITY.md para más detalles\n\n";
}

exit($failureCount > 0 ? 1 : 0);
