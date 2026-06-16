<?php
$file = __DIR__ . '/Taller_Calidad_SGMOT.html';

if (!file_exists($file)) {
    http_response_code(404);
    exit('Archivo no encontrado.');
}

header('Content-Type: application/msword');
header('Content-Disposition: attachment; filename="Taller_Calidad_SGMOT.doc"');
header('Content-Length: ' . filesize($file));
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
readfile($file);
exit;
