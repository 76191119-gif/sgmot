<?php
$user = requireRole('admin');

if ($method === 'GET' && !$id) {
    $filters = [];
    $params  = [];

    if (!empty($_GET['action']))   { $filters[] = 'action = ?';       $params[] = $_GET['action']; }
    if (!empty($_GET['role']))     { $filters[] = 'user_role = ?';    $params[] = $_GET['role']; }
    if (!empty($_GET['status']))   { $filters[] = 'status = ?';       $params[] = $_GET['status']; }
    if (!empty($_GET['user_id']))  { $filters[] = 'user_id = ?';      $params[] = (int)$_GET['user_id']; }
    if (!empty($_GET['from']))     { $filters[] = 'created_date >= ?'; $params[] = $_GET['from'] . ' 00:00:00'; }
    if (!empty($_GET['to']))       { $filters[] = 'created_date <= ?'; $params[] = $_GET['to'] . ' 23:59:59'; }
    if (!empty($_GET['search']))   {
        $filters[] = '(user_email LIKE ? OR description LIKE ? OR ip_address LIKE ?)';
        $like = '%' . $_GET['search'] . '%';
        array_push($params, $like, $like, $like);
    }

    $where  = $filters ? 'WHERE ' . implode(' AND ', $filters) : '';
    $limit  = min((int)($_GET['limit']  ?? 200), 500);

    $stmt = $db->prepare("SELECT * FROM audit_logs $where ORDER BY created_date DESC LIMIT $limit");
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Estadísticas resumen
    $totals = $db->query("SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) AS successes,
        SUM(CASE WHEN status='failed'  THEN 1 ELSE 0 END) AS failures,
        SUM(CASE WHEN action='login_failed' THEN 1 ELSE 0 END) AS failed_logins,
        COUNT(DISTINCT user_id) AS unique_users,
        COUNT(DISTINCT ip_address) AS unique_ips
        FROM audit_logs")->fetch(PDO::FETCH_ASSOC);

    sendResponse(['logs' => $rows, 'stats' => $totals]);
}

if ($method === 'DELETE' && $id === null && isset($_GET['purge_before'])) {
    $stmt = $db->prepare("DELETE FROM audit_logs WHERE created_date < ?");
    $stmt->execute([$_GET['purge_before'] . ' 00:00:00']);
    audit_log($db, 'purge_logs', 'audit_log', null, "Logs anteriores a {$_GET['purge_before']} eliminados", 'success', $user);
    sendResponse(['message' => 'Logs antiguos eliminados', 'rows' => $stmt->rowCount()]);
}

sendResponse(['error' => 'Método no permitido'], 405);
