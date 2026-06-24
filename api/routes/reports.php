<?php
$user = requireRole(['admin', 'cliente']);
$action = $segments[1] ?? 'summary';

$from = $_GET['from'] ?? null;
$to = $_GET['to'] ?? null;
$group = $_GET['group'] ?? 'day';

$currentClient = null;
$currentClientId = null;
if ($user['role'] === 'cliente') {
    $currentClient = findCurrentClient($db, $user);
    $currentClientId = $currentClient ? (int)$currentClient['id'] : 0;
}

function report_where($dateColumn = 'created_date', $clientColumn = null) {
    global $from, $to, $currentClientId;

    $filters = [];
    $params = [];

    if ($from) {
        $filters[] = "$dateColumn >= ?";
        $params[] = $from . ' 00:00:00';
    }

    if ($to) {
        $filters[] = "$dateColumn <= ?";
        $params[] = $to . ' 23:59:59';
    }

    if ($currentClientId !== null && $clientColumn) {
        $filters[] = "$clientColumn = ?";
        $params[] = $currentClientId;
    }

    return [
        'sql' => $filters ? 'WHERE ' . implode(' AND ', $filters) : '',
        'params' => $params,
    ];
}

$dateGroups = [
    'day' => "DATE_FORMAT(created_date, '%Y-%m-%d')",
    'month' => "DATE_FORMAT(created_date, '%Y-%m')",
    'year' => "DATE_FORMAT(created_date, '%Y')",
];

if (!isset($dateGroups[$group])) {
    sendResponse(['error' => 'Agrupacion invalida. Use: day, month o year'], 400);
}

if ($action === 'summary') {
    $ordersWhere = report_where('created_date', 'client_id');
    $stmt = $db->prepare("SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status='completado' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN status='en_proceso' THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN status='pendiente' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END), 0) AS cancelled
        FROM work_orders {$ordersWhere['sql']}");
    $stmt->execute($ordersWhere['params']);
    $orders = $stmt->fetch(PDO::FETCH_ASSOC);

    $incidentsWhere = report_where('created_date', 'client_id');
    $stmt2 = $db->prepare("SELECT
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status='resuelta' THEN 1 ELSE 0 END), 0) AS resolved,
        COALESCE(SUM(CASE WHEN status='cerrada' THEN 1 ELSE 0 END), 0) AS closed,
        COALESCE(SUM(CASE WHEN status='abierta' THEN 1 ELSE 0 END), 0) AS open,
        COALESCE(SUM(CASE WHEN status='en_atencion' THEN 1 ELSE 0 END), 0) AS in_attention
        FROM incidents {$incidentsWhere['sql']}");
    $stmt2->execute($incidentsWhere['params']);
    $incidents = $stmt2->fetch(PDO::FETCH_ASSOC);

    if ($user['role'] === 'cliente') {
        $activeClients = $currentClient && ($currentClient['status'] ?? '') === 'activo' ? 1 : 0;
        $techStmt = $db->prepare("
            SELECT COUNT(DISTINCT technician_id) FROM (
                SELECT technician_id FROM work_orders WHERE client_id = ? AND technician_id IS NOT NULL
                UNION
                SELECT technician_id FROM incidents WHERE client_id = ? AND technician_id IS NOT NULL
            ) assigned
        ");
        $techStmt->execute([$currentClientId, $currentClientId]);
        $activeTechnicians = (int)$techStmt->fetchColumn();
    } else {
        $activeClients = (int)$db->query("SELECT COUNT(*) FROM clients WHERE status='activo'")->fetchColumn();
        $activeTechnicians = (int)$db->query("SELECT COUNT(*) FROM technicians WHERE status IN ('disponible','en_campo')")->fetchColumn();
    }

    sendResponse([
        'orders' => $orders,
        'incidents' => $incidents,
        'active_clients' => $activeClients,
        'active_technicians' => $activeTechnicians,
    ]);
}

if ($action === 'orders-timeline') {
    $ordersWhere = report_where('created_date', 'client_id');
    $sql = "SELECT
        {$dateGroups[$group]} AS period,
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status='completado' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN status='cancelado' THEN 1 ELSE 0 END), 0) AS cancelled
        FROM work_orders {$ordersWhere['sql']}
        GROUP BY period ORDER BY period ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($ordersWhere['params']);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'incidents-timeline') {
    $incidentsWhere = report_where('created_date', 'client_id');
    $sql = "SELECT
        {$dateGroups[$group]} AS period,
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN status='resuelta' THEN 1 ELSE 0 END), 0) AS resolved
        FROM incidents {$incidentsWhere['sql']}
        GROUP BY period ORDER BY period ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($incidentsWhere['params']);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'orders-by-type') {
    $ordersWhere = report_where('created_date', 'client_id');
    $stmt = $db->prepare("SELECT type, COUNT(*) AS value FROM work_orders {$ordersWhere['sql']} GROUP BY type");
    $stmt->execute($ordersWhere['params']);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'incidents-by-category') {
    $incidentsWhere = report_where('created_date', 'client_id');
    $stmt = $db->prepare("SELECT category, COUNT(*) AS value FROM incidents {$incidentsWhere['sql']} GROUP BY category");
    $stmt->execute($incidentsWhere['params']);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'technician-performance') {
    if ($user['role'] !== 'admin') {
        sendResponse([]);
    }

    $ordersWhere = report_where('o.created_date', null);
    $sql = "SELECT
        t.id, t.full_name, t.specialty, t.zone,
        COUNT(o.id) AS total,
        COALESCE(SUM(CASE WHEN o.status='completado' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN o.status='en_proceso' THEN 1 ELSE 0 END), 0) AS in_progress,
        COALESCE(SUM(CASE WHEN o.status='pendiente' THEN 1 ELSE 0 END), 0) AS pending
        FROM technicians t
        LEFT JOIN work_orders o ON o.technician_id = t.id";
    if ($ordersWhere['sql']) {
        $sql .= ' AND ' . preg_replace('/^WHERE\s+/i', '', $ordersWhere['sql']);
    }
    $sql .= ' GROUP BY t.id ORDER BY completed DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($ordersWhere['params']);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($action === 'clients-by-plan') {
    if ($user['role'] === 'cliente') {
        if (!$currentClient) sendResponse([]);
        sendResponse([[
            'plan' => $currentClient['plan'] ?? 'basico_30mbps',
            'value' => 1,
        ]]);
    }

    $stmt = $db->query("SELECT plan, COUNT(*) AS value FROM clients GROUP BY plan");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

sendResponse(['error' => 'Reporte no encontrado'], 404);
