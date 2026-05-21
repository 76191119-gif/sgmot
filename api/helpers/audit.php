<?php
/**
 * Helpers para auditoría de seguridad y notificaciones.
 *
 * Uso:
 *   audit_log($db, $action, $entity_type, $entity_id, $description, $status, $user);
 *   notify_user($db, $user_id, $type, $title, $message, $action_url, $entity_type, $entity_id);
 *   notify_role($db, $role, ...);
 *   notify_email($db, $email, ...);
 */

function get_client_ip() {
    foreach (['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = explode(',', $_SERVER[$key])[0];
            return trim($ip);
        }
    }
    return 'unknown';
}

function parse_user_agent($ua) {
    $browser = 'Desconocido'; $os = 'Desconocido';
    if (!$ua) return [$browser, $os];

    // Browser detection (orden importa: específicos primero)
    if (preg_match('/Edg\/([\d.]+)/', $ua, $m))       $browser = 'Edge ' . explode('.', $m[1])[0];
    elseif (preg_match('/OPR\/([\d.]+)/', $ua, $m))   $browser = 'Opera ' . explode('.', $m[1])[0];
    elseif (preg_match('/Firefox\/([\d.]+)/', $ua, $m)) $browser = 'Firefox ' . explode('.', $m[1])[0];
    elseif (preg_match('/Chrome\/([\d.]+)/', $ua, $m))  $browser = 'Chrome ' . explode('.', $m[1])[0];
    elseif (preg_match('/Safari\/([\d.]+)/', $ua, $m) && preg_match('/Version\/([\d.]+)/', $ua, $v)) $browser = 'Safari ' . explode('.', $v[1])[0];
    elseif (preg_match('/MSIE ([\d.]+)/', $ua, $m))   $browser = 'IE ' . explode('.', $m[1])[0];

    // OS
    if (stripos($ua, 'Windows NT 10') !== false)        $os = 'Windows 10/11';
    elseif (stripos($ua, 'Windows NT 6.3') !== false)   $os = 'Windows 8.1';
    elseif (stripos($ua, 'Windows') !== false)          $os = 'Windows';
    elseif (preg_match('/iPhone OS ([\d_]+)/', $ua, $m)) $os = 'iPhone iOS ' . str_replace('_', '.', explode('.', $m[1])[0]);
    elseif (stripos($ua, 'iPad') !== false)             $os = 'iPad';
    elseif (preg_match('/Android ([\d.]+)/', $ua, $m))  $os = 'Android ' . explode('.', $m[1])[0];
    elseif (preg_match('/Mac OS X ([\d_]+)/', $ua, $m)) $os = 'macOS ' . str_replace('_', '.', explode('.', $m[1])[0]);
    elseif (stripos($ua, 'Linux') !== false)            $os = 'Linux';

    return [$browser, $os];
}

function audit_log($db, $action, $entity_type = null, $entity_id = null, $description = '', $status = 'success', $user = null) {
    try {
        $ip = get_client_ip();
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        [$browser, $os] = parse_user_agent($ua);

        $stmt = $db->prepare("INSERT INTO audit_logs
            (user_id, user_email, user_role, action, entity_type, entity_id, description, ip_address, user_agent, browser, os, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $user['id'] ?? null,
            $user['email'] ?? null,
            $user['role'] ?? null,
            $action,
            $entity_type,
            $entity_id,
            $description,
            $ip,
            substr($ua, 0, 250),
            $browser,
            $os,
            $status
        ]);
    } catch (Exception $e) {
        // No bloquear la operación principal por un fallo de audit
        error_log('audit_log error: ' . $e->getMessage());
    }
}

/**
 * Notifica a un usuario específico por su user_id.
 */
function notify_user($db, $user_id, $type, $title, $message = '', $action_url = null, $entity_type = null, $entity_id = null) {
    if (!$user_id) return;
    try {
        $stmt = $db->prepare("INSERT INTO notifications
            (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $type, $title, $message, $entity_type, $entity_id, $action_url]);
    } catch (Exception $e) {
        error_log('notify_user error: ' . $e->getMessage());
    }
}

/**
 * Notifica a todos los usuarios de un rol específico.
 */
function notify_role($db, $role, $type, $title, $message = '', $action_url = null, $entity_type = null, $entity_id = null) {
    try {
        $stmt = $db->prepare("SELECT id FROM users WHERE role = ?");
        $stmt->execute([$role]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $u) {
            notify_user($db, $u['id'], $type, $title, $message, $action_url, $entity_type, $entity_id);
        }
    } catch (Exception $e) {
        error_log('notify_role error: ' . $e->getMessage());
    }
}

/**
 * Notifica al usuario con un email específico (busca su user_id).
 */
function notify_email($db, $email, $type, $title, $message = '', $action_url = null, $entity_type = null, $entity_id = null) {
    if (!$email) return;
    try {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $u = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($u) notify_user($db, $u['id'], $type, $title, $message, $action_url, $entity_type, $entity_id);
    } catch (Exception $e) {
        error_log('notify_email error: ' . $e->getMessage());
    }
}
