<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = defined('DB_HOST') ? DB_HOST : 'localhost';
        $this->db_name = defined('DB_NAME') ? DB_NAME : 'sgmot';
        $this->username = defined('DB_USER') ? DB_USER : 'root';
        $this->password = defined('DB_PASSWORD') ? DB_PASSWORD : '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            if (defined('DB_TIME_ZONE') && DB_TIME_ZONE !== '') {
                $this->conn->exec("SET time_zone = " . $this->conn->quote(DB_TIME_ZONE));
            }
        } catch (PDOException $e) {
            error_log('SGMOT DB connection error: ' . $e->getMessage());
            http_response_code(500);
            die(json_encode(['error' => 'No se pudo conectar a la base de datos']));
        }
        return $this->conn;
    }
}
