<?php
// Funciones reutilizables de validación de datos

function validateEmail($email) {
    $email = trim(strtolower($email ?? ''));
    if (!$email) {
        return null;  // Campo vacío
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Email no válido'], 400);
    }
    if (strlen($email) > 150) {
        sendResponse(['error' => 'Email muy largo (máx 150 caracteres)'], 400);
    }
    return $email;
}

function validatePhone($phone) {
    $phone = trim($phone ?? '');
    if (!$phone) {
        return null;  // Campo vacío
    }
    // Permitir formatos comunes: +51 999 999 999, 999999999, +51999999999, etc.
    if (!preg_match('/^(\+\d{1,3})?[\s\-]?\d{7,15}$/', preg_replace('/[\s\-]/', '', $phone))) {
        sendResponse(['error' => 'Teléfono inválido. Use formato: +51 999 999 999 o 999999999'], 400);
    }
    return $phone;
}

function validateDNI($dni) {
    $dni = trim($dni ?? '');
    if (!$dni) {
        return null;  // Campo vacío
    }
    // DNI: 8 dígitos (Perú), RUC: 11 dígitos
    if (!preg_match('/^[0-9]{8,11}$/', $dni)) {
        sendResponse(['error' => 'DNI/RUC debe tener 8 o 11 dígitos'], 400);
    }
    return $dni;
}

function validateFullName($name) {
    $name = trim($name ?? '');
    if (!$name) {
        return null;  // Campo vacío
    }
    if (strlen($name) < 2) {
        sendResponse(['error' => 'Nombre muy corto (mínimo 2 caracteres)'], 400);
    }
    if (strlen($name) > 100) {
        sendResponse(['error' => 'Nombre muy largo (máximo 100 caracteres)'], 400);
    }
    // Prevenir inyección - solo letras, números, espacios, guiones
    if (!preg_match('/^[a-zá-ú0-9\s\-\'\.]{2,100}$/i', $name)) {
        sendResponse(['error' => 'Nombre contiene caracteres no permitidos'], 400);
    }
    return $name;
}

function validatePassword($password) {
    if (!$password) {
        return null;
    }
    if (strlen($password) < 8) {
        sendResponse(['error' => 'Contraseña muy corta (mínimo 8 caracteres)'], 400);
    }
    if (strlen($password) > 128) {
        sendResponse(['error' => 'Contraseña muy larga'], 400);
    }
    return $password;
}

function validateAddress($address) {
    $address = trim($address ?? '');
    if (!$address) {
        return null;
    }
    if (strlen($address) < 5) {
        sendResponse(['error' => 'Dirección muy corta'], 400);
    }
    if (strlen($address) > 255) {
        sendResponse(['error' => 'Dirección muy larga (máximo 255 caracteres)'], 400);
    }
    return $address;
}

function validateEnum($value, $validValues, $fieldName = 'Campo') {
    if (!in_array($value, $validValues, true)) {
        $valid = implode(', ', $validValues);
        sendResponse(['error' => "$fieldName inválido. Valores válidos: $valid"], 400);
    }
    return $value;
}

function validateLatLng($lat, $lng) {
    if ($lat === null || $lng === null) {
        return null;
    }

    $lat = (float)$lat;
    $lng = (float)$lng;

    if ($lat < -90 || $lat > 90) {
        sendResponse(['error' => 'Latitud inválida (debe estar entre -90 y 90)'], 400);
    }
    if ($lng < -180 || $lng > 180) {
        sendResponse(['error' => 'Longitud inválida (debe estar entre -180 y 180)'], 400);
    }

    return [$lat, $lng];
}

function validateDate($date, $fieldName = 'Fecha') {
    if (!$date) {
        return null;
    }

    $timestamp = strtotime($date);
    if ($timestamp === false) {
        sendResponse(['error' => "$fieldName no es válida. Use formato YYYY-MM-DD"], 400);
    }

    // Validar que sea fecha razonable (no pasado muy lejano, no futuro muy lejano)
    $year = date('Y', $timestamp);
    $now = date('Y');
    if ($year < $now - 100 || $year > $now + 10) {
        sendResponse(['error' => "$fieldName está fuera de rango permitido"], 400);
    }

    return date('Y-m-d', $timestamp);
}

function sanitizeString($value) {
    return htmlspecialchars(trim($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function sanitizeJSON($value) {
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
