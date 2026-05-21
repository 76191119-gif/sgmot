-- =============================================================
-- SGMOT v3.2 - INPE CABLE - BD PRODUCCIÓN
-- - Admins y técnicos pre-cargados
-- - Tabla clients VACÍA (registro mediante /register o desde admin)
-- - Coordenadas GPS en clients
-- =============================================================

CREATE DATABASE IF NOT EXISTS sgmot CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE sgmot;

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS work_orders;
DROP TABLE IF EXISTS technicians;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','tecnico','cliente') DEFAULT 'cliente',
  provider VARCHAR(20) DEFAULT 'local',          -- local | google
  google_sub VARCHAR(100) NULL UNIQUE,
  profile_complete TINYINT(1) DEFAULT 1,         -- 0 si Google login pendiente de completar
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  address TEXT NOT NULL,
  district VARCHAR(80),
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  plan ENUM('basico_30mbps','estandar_60mbps','premium_100mbps','empresarial_200mbps') NOT NULL,
  status ENUM('activo','suspendido','retirado') DEFAULT 'activo',
  notes TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clients_email (email)
);

CREATE TABLE technicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  specialty ENUM('instalacion','soporte','mantenimiento','fibra_optica') NOT NULL,
  status ENUM('disponible','en_campo','no_disponible') DEFAULT 'disponible',
  zone VARCHAR(80),
  user_id INT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tech_email (email)
);

CREATE TABLE work_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE,
  type ENUM('instalacion','soporte','mantenimiento','retiro') NOT NULL,
  client_id INT NOT NULL,
  client_name VARCHAR(100),
  client_address TEXT,
  technician_id INT NULL,
  technician_name VARCHAR(100),
  status ENUM('pendiente','en_proceso','completado','cancelado') DEFAULT 'pendiente',
  priority ENUM('baja','media','alta','urgente') DEFAULT 'media',
  scheduled_date DATE NULL,
  completed_date DATE NULL,
  description TEXT,
  resolution_notes TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (technician_id) REFERENCES technicians(id) ON DELETE SET NULL,
  INDEX idx_orders_date (created_date),
  INDEX idx_orders_status (status)
);

CREATE TABLE incidents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  client_id INT NOT NULL,
  client_name VARCHAR(100),
  category ENUM('sin_servicio','lentitud','corte_fibra','equipo_danado','configuracion','otro') NOT NULL,
  priority ENUM('baja','media','alta','critica') DEFAULT 'media',
  status ENUM('abierta','en_atencion','resuelta','cerrada') DEFAULT 'abierta',
  description TEXT,
  resolution TEXT,
  work_order_id INT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL,
  INDEX idx_incidents_date (created_date)
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(150),
  user_role VARCHAR(20),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  browser VARCHAR(60),
  os VARCHAR(60),
  status ENUM('success','failed','warning') DEFAULT 'success',
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_date (created_date),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('order_new','order_assigned','order_status','order_completed','incident_new','incident_resolved','incident_status','system','info') DEFAULT 'info',
  title VARCHAR(150) NOT NULL,
  message TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id INT NULL,
  action_url VARCHAR(200),
  is_read TINYINT(1) DEFAULT 0,
  read_date TIMESTAMP NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_date (created_date)
);

-- =============================================================
-- USUARIOS PRE-CARGADOS (1 admin + 4 técnicos)
-- IMPORTANTE: las contraseñas reales se aplican ejecutando
--             api/setup_passwords.php DESPUÉS de importar este SQL.
-- Por defecto quedan con hash de "password" como placeholder.
-- =============================================================
INSERT INTO users (full_name, email, password, role, profile_complete) VALUES
('Administrador SGMOT', 'admin@sgmot.com',   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',  1),
('Carlos Mendoza',      'carlos@sgmot.com',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tecnico',1),
('Ana Torres',          'ana@sgmot.com',     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tecnico',1),
('Luis Ramos',          'luis@sgmot.com',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tecnico',1),
('Pedro Castillo',      'pedro.t@sgmot.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','tecnico',1);

-- TÉCNICOS (fichas operativas)
INSERT INTO technicians (full_name, dni, phone, email, specialty, status, zone, user_id) VALUES
('Carlos Mendoza','45678901','951234567','carlos@sgmot.com', 'instalacion',  'disponible','Zona Norte', 2),
('Ana Torres',    '56789012','962345678','ana@sgmot.com',    'fibra_optica', 'disponible','Zona Sur',   3),
('Luis Ramos',    '67890123','973456789','luis@sgmot.com',   'soporte',      'disponible','Zona Centro',4),
('Pedro Castillo','78901234','984567890','pedro.t@sgmot.com','mantenimiento','disponible','Zona Este',  5);

-- Notificación de bienvenida al admin
INSERT INTO notifications (user_id, type, title, message, action_url) VALUES
(1,'system','✅ Sistema SGMOT inicializado','Recuerda ejecutar setup_passwords.php para aplicar las contraseñas reales.','/profile');
