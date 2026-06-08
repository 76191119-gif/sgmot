<?php

function findCurrentClient($db, $user) {
    $stmt = $db->prepare("SELECT * FROM clients WHERE user_id = ? OR (user_id IS NULL AND email = ?) LIMIT 1");
    $stmt->execute([(int)$user['id'], $user['email'] ?? '']);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($client && empty($client['user_id'])) {
        $link = $db->prepare("UPDATE clients SET user_id = ?, email = ?, updated_date = NOW() WHERE id = ?");
        $link->execute([(int)$user['id'], $user['email'] ?? $client['email'], (int)$client['id']]);
        $client['user_id'] = (int)$user['id'];
        $client['email'] = $user['email'] ?? $client['email'];
    }

    return $client ?: null;
}

function findCurrentTechnician($db, $user) {
    $stmt = $db->prepare("SELECT * FROM technicians WHERE user_id = ? OR (user_id IS NULL AND email = ?) LIMIT 1");
    $stmt->execute([(int)$user['id'], $user['email'] ?? '']);
    $tech = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($tech && empty($tech['user_id'])) {
        $link = $db->prepare("UPDATE technicians SET user_id = ?, email = ?, updated_date = NOW() WHERE id = ?");
        $link->execute([(int)$user['id'], $user['email'] ?? $tech['email'], (int)$tech['id']]);
        $tech['user_id'] = (int)$user['id'];
        $tech['email'] = $user['email'] ?? $tech['email'];
    }

    return $tech ?: null;
}

function syncPersonRecordForUser($db, $userId, $role, $fullName, $email) {
    if ($role === 'cliente') {
        $stmt = $db->prepare("UPDATE clients SET full_name = ?, email = ?, updated_date = NOW() WHERE user_id = ?");
        $stmt->execute([$fullName, $email, (int)$userId]);
    }

    if ($role === 'tecnico') {
        $stmt = $db->prepare("UPDATE technicians SET full_name = ?, email = ?, updated_date = NOW() WHERE user_id = ?");
        $stmt->execute([$fullName, $email, (int)$userId]);
    }
}
