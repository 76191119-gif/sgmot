<?php
$user = requireAuth();
$action = $segments[1] ?? null;

// GET /notifications  → lista del usuario actual
if ($method === 'GET' && !$id && !$action) {
    $onlyUnread = isset($_GET['unread']) && $_GET['unread'] === '1';
    $sql = "SELECT * FROM notifications WHERE user_id = ?";
    if ($onlyUnread) $sql .= " AND is_read = 0";
    $sql .= " ORDER BY created_date DESC LIMIT 50";
    $stmt = $db->prepare($sql);
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // contador de no leídas
    $cnt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
    $cnt->execute([$user['id']]);
    $unread = (int)$cnt->fetchColumn();

    sendResponse(['notifications' => $rows, 'unread_count' => $unread]);
}

// PUT /notifications/:id/read  → marcar una como leída
if ($method === 'PUT' && $id && ($segments[2] ?? null) === 'read') {
    $stmt = $db->prepare("UPDATE notifications SET is_read = 1, read_date = NOW() WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);
    sendResponse(['message' => 'Notificación marcada como leída']);
}

// PUT /notifications/read-all  → marcar todas como leídas
if ($method === 'PUT' && $action === 'read-all') {
    $stmt = $db->prepare("UPDATE notifications SET is_read = 1, read_date = NOW() WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$user['id']]);
    sendResponse(['message' => 'Todas marcadas como leídas', 'rows' => $stmt->rowCount()]);
}

// DELETE /notifications/:id  → eliminar una
if ($method === 'DELETE' && $id) {
    $stmt = $db->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);
    sendResponse(['message' => 'Notificación eliminada']);
}

// DELETE /notifications/clear-read  → limpiar leídas
if ($method === 'DELETE' && $action === 'clear-read') {
    $stmt = $db->prepare("DELETE FROM notifications WHERE user_id = ? AND is_read = 1");
    $stmt->execute([$user['id']]);
    sendResponse(['message' => 'Notificaciones leídas eliminadas', 'rows' => $stmt->rowCount()]);
}

sendResponse(['error' => 'Método no permitido'], 405);
