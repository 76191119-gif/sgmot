<?php
/**
 * ===================================================
 * SGMOT - Script de inicialización de contraseñas
 * ===================================================
 *
 * Ejecutar UNA VEZ después de importar database/sgmot.sql para aplicar
 * las contraseñas reales con bcrypt sobre los usuarios pre-cargados.
 *
 * Modo CLI:
 *   php api/setup_passwords.php
 *
 * Modo web (UNA SOLA VEZ - bórralo después):
 *   http://localhost/sgmot/api/setup_passwords.php
 */

require_once __DIR__ . '/config/database.php';

$users = [
    'admin@sgmot.com'   => 'admin2026',
    'carlos@sgmot.com'  => 'carlos2026',
    'ana@sgmot.com'     => 'ana2026',
    'luis@sgmot.com'    => 'luis2026',
    'pedro.t@sgmot.com' => 'pedro2026',
];

$isCli = (php_sapi_name() === 'cli');
if (!$isCli) header('Content-Type: text/plain; charset=utf-8');

echo "============================================\n";
echo " SGMOT - Aplicando contraseñas\n";
echo "============================================\n\n";

try {
    $db = (new Database())->getConnection();
} catch (Exception $e) {
    echo "ERROR de conexión a MySQL: " . $e->getMessage() . "\n";
    exit(1);
}

$ok = 0; $err = 0;
foreach ($users as $email => $pwd) {
    try {
        $hash = password_hash($pwd, PASSWORD_BCRYPT);
        $stmt = $db->prepare("UPDATE users SET password = ?, updated_date = NOW() WHERE email = ?");
        $stmt->execute([$hash, $email]);
        $rows = $stmt->rowCount();
        if ($rows > 0) {
            echo " ✓  $email           ->  " . str_pad($pwd, 15) . "  (OK)\n";
            $ok++;
        } else {
            echo " !  $email           ->  No encontrado en la tabla users\n";
            $err++;
        }
    } catch (Exception $e) {
        echo " X  $email           ->  ERROR: " . $e->getMessage() . "\n";
        $err++;
    }
}

echo "\n============================================\n";
echo " Resultado: $ok aplicadas, $err errores\n";
echo "============================================\n";

if ($ok > 0 && !$isCli) {
    echo "\n⚠️  IMPORTANTE: Por seguridad, BORRA este archivo después de ejecutarlo.\n";
    echo "    Ruta: " . __FILE__ . "\n";
}
