<?php
// Configuracion global de la API.

function sgmot_env_value($key, $default = '') {
    $value = getenv($key);
    if ($value !== false && $value !== '') return $value;

    $envFiles = [
        __DIR__ . '/../.env',
        __DIR__ . '/../../frontend/.env.local',
    ];

    foreach ($envFiles as $file) {
        if (!is_readable($file)) continue;

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) continue;

            [$name, $raw] = explode('=', $line, 2);
            $name = trim($name);
            if ($name !== $key && $name !== "VITE_$key") continue;

            return trim(trim($raw), "\"'");
        }
    }

    return $default;
}

// Client ID de Google para verificar ID tokens.
// En XAMPP local toma VITE_GOOGLE_CLIENT_ID desde frontend/.env.local si no existe GOOGLE_CLIENT_ID.
define('APP_TIMEZONE', sgmot_env_value('APP_TIMEZONE', 'America/Lima'));
date_default_timezone_set(APP_TIMEZONE);

define('GOOGLE_CLIENT_ID', sgmot_env_value('GOOGLE_CLIENT_ID'));
define('JWT_SECRET', sgmot_env_value('JWT_SECRET', 'SGMOT_CHANGE_THIS_SECRET_IN_ENV'));
define('CORS_ALLOWED_ORIGIN', sgmot_env_value('CORS_ALLOWED_ORIGIN', '*'));
define('DB_HOST', sgmot_env_value('DB_HOST', 'localhost'));
define('DB_NAME', sgmot_env_value('DB_NAME', 'sgmot'));
define('DB_USER', sgmot_env_value('DB_USER', 'root'));
define('DB_PASSWORD', sgmot_env_value('DB_PASSWORD', ''));
define('DB_TIME_ZONE', sgmot_env_value('DB_TIME_ZONE', '-05:00'));
