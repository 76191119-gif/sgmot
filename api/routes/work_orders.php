<?php
$user = requireAuth();

// =================== LISTADO FILTRADO POR ROL ===================
if ($method === 'GET' && !$id) {
    if ($user['role'] === 'admin') {
        $stmt = $db->query("SELECT * FROM work_orders ORDER BY created_date DESC LIMIT 500");
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    if ($user['role'] === 'tecnico') {
        $t = $db->prepare("SELECT id, full_name FROM technicians WHERE email = ?");
        $t->execute([$user['email']]);
        $tech = $t->fetch(PDO::FETCH_ASSOC);
        if (!$tech) sendResponse([]);
        $stmt = $db->prepare("SELECT * FROM work_orders WHERE technician_id = ? OR technician_name = ? ORDER BY created_date DESC");
        $stmt->execute([$tech['id'], $tech['full_name']]);
        sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    // cliente
    $cl = $db->prepare("SELECT id, full_name FROM clients WHERE email = ?");
    $cl->execute([$user['email']]);
    $client = $cl->fetch(PDO::FETCH_ASSOC);
    if (!$client) sendResponse([]);
    $stmt = $db->prepare("SELECT * FROM work_orders WHERE client_id = ? OR client_name = ? ORDER BY created_date DESC");
    $stmt->execute([$client['id'], $client['full_name']]);
    sendResponse($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method === 'GET' && $id) {
    $stmt = $db->prepare("SELECT * FROM work_orders WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    sendResponse($row ?: ['error' => 'No encontrado'], $row ? 200 : 404);
}

// =================== CREAR ===================
if ($method === 'POST') {
    if (!in_array($user['role'], ['admin', 'cliente'])) {
        sendResponse(['error' => 'Sin permisos'], 403);
    }
    $b = getBody();

    if ($user['role'] === 'cliente') {
        $cl = $db->prepare("SELECT id, full_name, address FROM clients WHERE email = ?");
        $cl->execute([$user['email']]);
        $client = $cl->fetch(PDO::FETCH_ASSOC);
        if ($client) {
            $b['client_id']      = $client['id'];
            $b['client_name']    = $client['full_name'];
            $b['client_address'] = $client['address'];
        }
        $b['status'] = 'pendiente';
    }

    if (empty($b['type']) || empty($b['client_id'])) {
        sendResponse(['error' => 'Tipo y cliente son obligatorios'], 400);
    }

    $orderNum = $b['order_number'] ?? ('OT-' . date('ymd') . '-' . rand(100, 999));

    $stmt = $db->prepare("INSERT INTO work_orders
        (order_number, type, client_id, client_name, client_address, technician_id, technician_name, status, priority, scheduled_date, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $orderNum, $b['type'], $b['client_id'],
        $b['client_name'] ?? '', $b['client_address'] ?? '',
        !empty($b['technician_id']) ? $b['technician_id'] : null,
        $b['technician_name'] ?? '',
        $b['status'] ?? 'pendiente', $b['priority'] ?? 'media',
        !empty($b['scheduled_date']) ? $b['scheduled_date'] : null,
        $b['description'] ?? ''
    ]);
    $newId = (int)$db->lastInsertId();

    // ===== AUDITORÍA =====
    audit_log($db, 'create_work_order', 'work_order', $newId,
        "Orden $orderNum creada para {$b['client_name']} (tipo {$b['type']})", 'success', $user);

    // ===== NOTIFICACIONES =====
    // 1. Si el cliente la solicitó → notificar a admins
    if ($user['role'] === 'cliente') {
        notify_role($db, 'admin', 'order_new',
            'Nueva solicitud de servicio',
            "{$b['client_name']} solicitó: " . ($b['description'] ?? $b['type']),
            '/work-orders', 'work_order', $newId);
    }

    // 2. Si tiene técnico asignado → notificarle
    if (!empty($b['technician_id'])) {
        $t = $db->prepare("SELECT email FROM technicians WHERE id = ?");
        $t->execute([$b['technician_id']]);
        $tEmail = $t->fetchColumn();
        if ($tEmail) {
            notify_email($db, $tEmail, 'order_assigned',
                'Nueva orden asignada',
                "Se te asignó la orden $orderNum ({$b['client_name']})",
                '/work-orders', 'work_order', $newId);
        }
    }

    // 3. Notificar al cliente de la creación
    $cl = $db->prepare("SELECT email FROM clients WHERE id = ?");
    $cl->execute([$b['client_id']]);
    $cEmail = $cl->fetchColumn();
    if ($cEmail && $cEmail !== $user['email']) {
        notify_email($db, $cEmail, 'order_status',
            'Orden creada',
            "Se ha registrado la orden $orderNum a tu nombre",
            '/work-orders', 'work_order', $newId);
    }

    sendResponse(['id' => $newId, 'order_number' => $orderNum, 'message' => 'Orden creada'], 201);
}

// =================== ACTUALIZAR ===================
if ($method === 'PUT' && $id) {
    if (!in_array($user['role'], ['admin', 'tecnico'])) {
        sendResponse(['error' => 'Sin permisos'], 403);
    }
    $b = getBody();

    // Obtener estado previo para auditar el cambio
    $prev = $db->prepare("SELECT * FROM work_orders WHERE id = ?");
    $prev->execute([$id]);
    $previous = $prev->fetch(PDO::FETCH_ASSOC);
    if (!$previous) sendResponse(['error' => 'No encontrado'], 404);

    if ($user['role'] === 'tecnico') {
        $completedDate = ($b['status'] ?? '') === 'completado'
            ? ($b['completed_date'] ?? date('Y-m-d')) : null;
        $stmt = $db->prepare("UPDATE work_orders
                              SET status=?, resolution_notes=?, completed_date=?, updated_date=NOW()
                              WHERE id=?");
        $stmt->execute([
            $b['status'] ?? 'pendiente',
            $b['resolution_notes'] ?? '',
            $completedDate, $id
        ]);
    } else {
        $completedDate = !empty($b['completed_date']) ? $b['completed_date']
                        : (($b['status'] ?? '') === 'completado' ? date('Y-m-d') : null);
        $stmt = $db->prepare("UPDATE work_orders SET
            type=?, client_id=?, client_name=?, client_address=?,
            technician_id=?, technician_name=?, status=?, priority=?,
            scheduled_date=?, description=?, resolution_notes=?, completed_date=?, updated_date=NOW()
            WHERE id=?");
        $stmt->execute([
            $b['type'], $b['client_id'],
            $b['client_name'] ?? '', $b['client_address'] ?? '',
            !empty($b['technician_id']) ? $b['technician_id'] : null,
            $b['technician_name'] ?? '',
            $b['status'], $b['priority'],
            !empty($b['scheduled_date']) ? $b['scheduled_date'] : null,
            $b['description'] ?? '', $b['resolution_notes'] ?? '',
            $completedDate, $id
        ]);
    }

    // ===== AUDITORÍA =====
    $changes = [];
    if ($previous['status'] !== ($b['status'] ?? $previous['status'])) {
        $changes[] = "estado: {$previous['status']} → {$b['status']}";
    }
    if (!empty($b['technician_id']) && $previous['technician_id'] != $b['technician_id']) {
        $changes[] = "técnico reasignado";
    }
    $desc = "Orden {$previous['order_number']} actualizada" . ($changes ? ' (' . implode(', ', $changes) . ')' : '');
    audit_log($db, 'update_work_order', 'work_order', (int)$id, $desc, 'success', $user);

    // ===== NOTIFICACIONES por cambio de estado =====
    $newStatus = $b['status'] ?? $previous['status'];
    if ($previous['status'] !== $newStatus) {
        $statusLabels = ['pendiente'=>'Pendiente','en_proceso'=>'En Proceso','completado'=>'Completado','cancelado'=>'Cancelado'];
        $label = $statusLabels[$newStatus] ?? $newStatus;

        // Notificar al cliente
        $cl = $db->prepare("SELECT email FROM clients WHERE id = ?");
        $cl->execute([$previous['client_id']]);
        $cEmail = $cl->fetchColumn();
        if ($cEmail) {
            $title = $newStatus === 'completado' ? '✅ Orden completada' : "Orden actualizada: $label";
            notify_email($db, $cEmail, $newStatus === 'completado' ? 'order_completed' : 'order_status',
                $title,
                "Tu orden {$previous['order_number']} cambió a estado: $label",
                '/work-orders', 'work_order', (int)$id);
        }
    }

    // Notificar al nuevo técnico si fue reasignado
    if (!empty($b['technician_id']) && $previous['technician_id'] != $b['technician_id']) {
        $t = $db->prepare("SELECT email FROM technicians WHERE id = ?");
        $t->execute([$b['technician_id']]);
        $tEmail = $t->fetchColumn();
        if ($tEmail) {
            notify_email($db, $tEmail, 'order_assigned',
                'Nueva orden asignada',
                "Se te asignó la orden {$previous['order_number']} ({$previous['client_name']})",
                '/work-orders', 'work_order', (int)$id);
        }
    }

    sendResponse(['message' => 'Orden actualizada']);
}

// =================== ELIMINAR ===================
if ($method === 'DELETE' && $id) {
    requireRole('admin');
    $prev = $db->prepare("SELECT order_number, client_name FROM work_orders WHERE id = ?");
    $prev->execute([$id]);
    $row = $prev->fetch(PDO::FETCH_ASSOC);

    $stmt = $db->prepare("DELETE FROM work_orders WHERE id = ?");
    $stmt->execute([$id]);

    if ($row) {
        audit_log($db, 'delete_work_order', 'work_order', (int)$id,
            "Orden {$row['order_number']} eliminada ({$row['client_name']})", 'warning', $user);
    }
    sendResponse(['message' => 'Orden eliminada']);
}

sendResponse(['error' => 'Método no permitido'], 405);
