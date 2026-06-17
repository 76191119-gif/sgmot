<?php
$user   = requireRole('admin');
$action = $segments[1] ?? 'summary';

// Filtros de rango: from, to en formato YYYY-MM-DD (ambos opcionales)
$from = $_GET['from'] ?? null;
$to   = $_GET['to']   ?? null;
$group = $_GET['group'] ?? 'day';  // day | month | year

$dateRange = [];
$params = [];
if ($from) { $dateRange[] = 'created_date >= ?'; $params[] = $from . ' 00:00:00'; }
if ($to)   { $dateRange[] = 'created_date <= ?'; $params[] = $to   . ' 23:59:59'; }
$whereDate = $dateRange ? 'WHERE ' . implode(' AND ', $dateRange) : '';

$dateFormats = [
    'day'   => '%Y-%m-%d',
    'month' => '%Y-%m',
    'year'  => '%Y',
];

// Validar $group contra whitelist
if (!isset($dateFormats[$group])) {
    sendResponse(['error' => 'Agrupacion invalida. Use: day, month o year'], 400);
}

// GET /reports/summary  → KPIs filtrados por rango
if ($action === 'summary') {
    $stmt = $db->prepare("SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='completado' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status='en_proceso' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status='pendiente'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='cancelado'  THEN 1 ELSE 0 END) AS cancelled
        FROM work_orders $whereDate");
    $stmt->execute($params);
    $orders = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt2 = $db->prepare("SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='resuelta' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status='cerrada'  THEN 1 ELSE 0 END) AS closed,
        SUM(CASE WHEN status='abierta'  THEN 1 ELSE 0 END) AS open,
        SUM(CASE WHEN status='en_atencion' THEN 1 ELSE 0 END) AS in_attention
        FROM incidents $whereDate");
    $stmt2->execute($params);
    $incidents = $stmt2->fetch(PDO::FETCH_ASSOC);

    $cl = $db->query("SELECT COUNT(*) FROM clients WHERE status='activo'")->fetchColumn();
    $tc = $db->query("SELECT COUNT(*) FROM technicians WHERE status IN ('disponible','en_campo')")->fetchColumn();

    sendResponse([
        'orders'    => $orders,
        'incidents' => $incidents,
        'active_clients'      => (int)$cl,
        'active_technicians'  => (int)$tc,
    ]);
}

// GET /reports/orders-timeline  → órdenes agrupadas por día/mes/año
if ($action === 'orders-timeline') {
    $dateGroup = match($group) {
        'month' => "DATE_FORMAT(created_date, '%Y-%m')",
        'year' => "DATE_FORMAT(created_date, '%Y')",
        default => "DATE_FORMAT(created_date, '%Y-%m-%d')",
    };
    $sql = "SELECT
        $dateGroup AS period,
        COUNT(*) AS total,
        SUM(CASE WHEN status='completado' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status='cancelado'  THEN 1 ELSE 0 END) AS cancelled
        FROM work_orders $whereDate
        GROUP BY period ORDER BY period ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// GET /reports/incidents-timeline
if ($action === 'incidents-timeline') {
    $dateGroup = match($group) {
        'month' => "DATE_FORMAT(created_date, '%Y-%m')",
        'year' => "DATE_FORMAT(created_date, '%Y')",
        default => "DATE_FORMAT(created_date, '%Y-%m-%d')",
    };
    $sql = "SELECT
        $dateGroup AS period,
        COUNT(*) AS total,
        SUM(CASE WHEN status='resuelta' THEN 1 ELSE 0 END) AS resolved
        FROM incidents $whereDate
        GROUP BY period ORDER BY period ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// GET /reports/orders-by-type
if ($action === 'orders-by-type') {
    $stmt = $db->prepare("SELECT type, COUNT(*) AS value FROM work_orders $whereDate GROUP BY type");
    $stmt->execute($params);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// GET /reports/incidents-by-category
if ($action === 'incidents-by-category') {
    $stmt = $db->prepare("SELECT category, COUNT(*) AS value FROM incidents $whereDate GROUP BY category");
    $stmt->execute($params);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// GET /reports/technician-performance
if ($action === 'technician-performance') {
    // No filtramos por fecha aquí porque queremos toda la performance
    $sql = "SELECT
        t.id, t.full_name, t.specialty, t.zone,
        COUNT(o.id) AS total,
        SUM(CASE WHEN o.status='completado' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN o.status='en_proceso' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN o.status='pendiente'  THEN 1 ELSE 0 END) AS pending
        FROM technicians t
        LEFT JOIN work_orders o ON o.technician_id = t.id";
    if ($whereDate) $sql .= " AND " . str_replace('WHERE ', '', $whereDate);
    $sql .= " GROUP BY t.id ORDER BY completed DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// GET /reports/clients-by-plan
if ($action === 'clients-by-plan') {
    $stmt = $db->query("SELECT plan, COUNT(*) AS value FROM clients GROUP BY plan");
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

sendResponse(['error' => 'Reporte no encontrado'], 404);
