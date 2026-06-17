# 🚀 GUÍA DE DEPLOYMENT - SGMOT Producción

**Versión:** 1.0  
**Fecha:** 2026-06-16  
**Estado:** Listo para Producción  

---

## ⚡ Resumen Ejecutivo

SGMOT está **100% listo para producción**. Este documento guía cada paso necesario para desplegar en un servidor real.

**Requisitos:**
- Apache 2.4+ con mod_rewrite
- PHP 8.0+
- MySQL 5.7+ o MariaDB 10.3+
- HTTPS con certificado SSL/TLS válido
- 1 GB RAM mínimo

---

## 📋 PASO 1: Verificación Pre-Deployment

### Ejecutar script de deployment

**Windows (PowerShell - como Administrador):**
```powershell
cd C:\xampp\htdocs\sgmot
.\deploy.ps1
```

**Linux/Mac:**
```bash
cd /var/www/sgmot
bash deploy.sh
```

Esto verificará:
- ✅ Sintaxis PHP
- ✅ Seguridad (security-check)
- ✅ Dependencias
- ✅ Build frontend
- ✅ Estructura de archivos

---

## 🔑 PASO 2: Configuración de Seguridad Crítica

### 2.1 Generar JWT_SECRET Fuerte

```bash
# Linux/Mac/Windows Git Bash
openssl rand -base64 32

# Resultado ejemplo:
# aBcDeF1234567890xYzAbCdEf1234567890AbCdEf==

# Guardar en api/.env
JWT_SECRET=aBcDeF1234567890xYzAbCdEf1234567890AbCdEf==
```

### 2.2 Configurar CORS para Dominio Real

**Editar `api/.env`:**
```env
# Antes (desarrollo)
CORS_ALLOWED_ORIGIN=http://localhost:5173

# Después (producción)
CORS_ALLOWED_ORIGIN=https://tudominio.com
```

### 2.3 Cambiar Credenciales de Base de Datos

**NO usar root sin contraseña en producción.**

```bash
# MySQL
mysql -u root -p

# Crear usuario seguro:
CREATE USER 'sgmot_user'@'localhost' IDENTIFIED BY 'CONTRASEÑA_FUERTE_AQUI';
GRANT ALL ON sgmot.* TO 'sgmot_user'@'localhost';
FLUSH PRIVILEGES;
```

**Actualizar `api/.env`:**
```env
DB_USER=sgmot_user
DB_PASSWORD=CONTRASEÑA_FUERTE_AQUI
```

### 2.4 Verificar Configuración

```bash
cd /var/www/sgmot/api
php security-check.php
```

Debería mostrar: ✅ SECURITY CHECK PASSED

---

## 🌐 PASO 3: Configuración de Servidor Web

### 3.1 Apache (Recomendado)

**Habilitar módulos requeridos:**
```bash
a2enmod rewrite
a2enmod headers
a2enmod deflate
a2enmod expires
systemctl restart apache2
```

**VirtualHost (ejemplo):**
```apache
<VirtualHost *:443>
    ServerName tudominio.com
    ServerAlias www.tudominio.com
    DocumentRoot /var/www/sgmot

    # Certificado SSL
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/tudominio.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/tudominio.com/privkey.pem

    # Redireccionar HTTP a HTTPS
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteCond %{HTTPS} off
        RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    </IfModule>

    # Logs
    ErrorLog /var/log/apache2/sgmot-error.log
    CustomLog /var/log/apache2/sgmot-access.log combined

    # Permisos
    <Directory /var/www/sgmot>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 3.2 Nginx (Alternativa)

```nginx
server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    root /var/www/sgmot;
    index index.html index.php;

    # SSL
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Compresión
    gzip on;
    gzip_types application/json text/javascript text/css;

    # API
    location ~ ^/sgmot/api(.*)$ {
        try_files $uri $uri/ /sgmot/api/index.php$args;
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 3.3 Certificado SSL/TLS (Let's Encrypt - Gratis)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-apache

# Generar certificado
sudo certbot certonly --apache -d tudominio.com -d www.tudominio.com

# Auto-renovación (cron)
sudo certbot renew --dry-run
```

---

## 💾 PASO 4: Base de Datos

### 4.1 Importar Schema

```bash
mysql -u sgmot_user -p sgmot < /var/www/sgmot/database/sgmot.sql
```

**Verificar:**
```bash
mysql -u sgmot_user -p sgmot -e "SHOW TABLES;"
```

Debería mostrar 7 tablas:
- users
- clients
- technicians
- work_orders
- incidents
- notifications
- audit_logs

### 4.2 Configurar Backup Automático

**Script diario (cron):**
```bash
# Editar crontab
crontab -e

# Agregar línea:
0 2 * * * mysqldump -u sgmot_user -pPASSWORD sgmot | gzip > /backups/sgmot-$(date +\%Y\%m\%d).sql.gz
```

### 4.3 Optimizar MySQL

**`/etc/mysql/mysql.conf.d/mysqld.cnf`:**
```ini
[mysqld]
# Performance
max_connections = 100
innodb_buffer_pool_size = 1G
query_cache_type = 1
query_cache_size = 64M

# Timezone
default_time_zone = '-05:00'

# Charset UTF-8
character-set-server = utf8mb4
collation-server = utf8mb4_spanish_ci
```

---

## 📁 PASO 5: Estructura de Directorios

### Permisos Correctos

```bash
# Ir al proyecto
cd /var/www/sgmot

# Directorio raíz
chmod 755 .

# API
chmod 755 api
find api -type f -name "*.php" -exec chmod 644 {} \;
find api -type d -exec chmod 755 {} \;

# Frontend dist
chmod 755 frontend/dist
find frontend/dist -type f -exec chmod 644 {} \;
find frontend/dist -type d -exec chmod 755 {} \;

# Base de datos (lectura)
chmod 755 database
chmod 644 database/sgmot.sql

# Logs (escritura)
mkdir -p logs
chmod 777 logs
```

### Estructura Final

```
/var/www/sgmot/
├── api/                      # Backend PHP (644 archivos, 755 dirs)
│   ├── config/
│   ├── helpers/
│   ├── routes/
│   ├── index.php
│   ├── .env                  # 600 - Secreto
│   ├── .htaccess
│   └── security-check.php
├── database/
│   └── sgmot.sql
├── frontend/
│   └── dist/                 # Build optimizado
├── logs/                     # Escritura para errores
├── .htaccess                 # Raíz
├── .gitignore
├── README.md
├── SECURITY.md
└── DEPLOYMENT.md
```

---

## 🔒 PASO 6: Seguridad Avanzada

### 6.1 Firewall (UFW - Ubuntu)

```bash
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw status
```

### 6.2 Fail2Ban (Protección Brute Force)

```bash
sudo apt install fail2ban

# Configurar para SGMOT login
cat > /etc/fail2ban/jail.d/sgmot.conf << 'EOF'
[sgmot-login]
enabled = true
port = http,https
filter = sgmot-login
logpath = /var/log/apache2/sgmot-access.log
findtime = 900
maxretry = 5
bantime = 3600
EOF

cat > /etc/fail2ban/filter.d/sgmot-login.conf << 'EOF'
[Definition]
failregex = ^.*POST /sgmot/api/auth/login.*401.*$
ignoreregex =
EOF

sudo systemctl restart fail2ban
```

### 6.3 Rate Limiting (Apache)

```apache
<IfModule mod_ratelimit.c>
    # Limitar a 10 MB/s por IP
    SetOutputFilter RATE_LIMIT
    ModRateLimit On
    LimitRequestBody 10485760
</IfModule>
```

### 6.4 WAF - ModSecurity (Opcional)

```bash
# Instalar
sudo apt install libapache2-mod-security2

# Habilitar
a2enmod security2
systemctl restart apache2
```

---

## 📊 PASO 7: Monitoreo y Logs

### 7.1 Configurar PHP Error Logging

**`api/config/app.php`** (ya está):
```php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php-error.log');
```

### 7.2 Logs Apache

```bash
# Real-time
tail -f /var/log/apache2/sgmot-access.log
tail -f /var/log/apache2/sgmot-error.log

# Análisis
grep "401" /var/log/apache2/sgmot-access.log
grep "500" /var/log/apache2/sgmot-error.log
```

### 7.3 Monitoreo con Monit

```bash
sudo apt install monit

# /etc/monit/conf.d/sgmot
check process apache with pidfile /var/run/apache2.pid
  start program = "/etc/init.d/apache2 start"
  stop program = "/etc/init.d/apache2 stop"
  if 3 restarts within 5 cycles then alert

check process mysql with pidfile /var/run/mysqld/mysqld.pid
  start program = "/etc/init.d/mysql start"
  stop program = "/etc/init.d/mysql stop"
```

### 7.4 Panel de Salud

**API endpoint nuevo (agregar a `api/routes/health.php`):**
```php
<?php
// GET /health - Sin autenticación, para monitoreo
$response = [
    'status' => 'ok',
    'timestamp' => date('c'),
    'version' => '1.0',
];

try {
    require_once __DIR__ . '/../config/database.php';
    $db = (new Database())->getConnection();
    $db->query("SELECT 1");
    $response['database'] = 'connected';
} catch (Exception $e) {
    http_response_code(503);
    $response['database'] = 'error';
    $response['error'] = $e->getMessage();
}

header('Content-Type: application/json');
echo json_encode($response);
```

---

## ✅ PASO 8: Verificación Final

### Checklist Pre-Producción

- [ ] JWT_SECRET generado y configurado
- [ ] CORS_ALLOWED_ORIGIN = dominio real
- [ ] BD conectada y usuario seguro
- [ ] HTTPS funcionando (certificado válido)
- [ ] PHP lint: sin errores
- [ ] Security check: PASSED
- [ ] Frontend compilado (dist/)
- [ ] Permisos configurados (755/644)
- [ ] Logs configurados
- [ ] Backups automáticos activos
- [ ] Firewall habilitado
- [ ] Fail2Ban activo
- [ ] Headers de seguridad presentes
- [ ] HSTS habilitado
- [ ] CSP configurado
- [ ] Rate limiting activo

### Test Final

```bash
# 1. Frontend
curl -I https://tudominio.com/
# Debería retornar 200 OK

# 2. API Health
curl -H "Authorization: Bearer fake" https://tudominio.com/sgmot/api/
# Debería retornar JSON error (no 404)

# 3. Security Headers
curl -I https://tudominio.com/ | grep -i "strict-transport-security"
# Debería mostrar header HSTS

# 4. SSL/TLS
openssl s_client -connect tudominio.com:443
# Verificar certificado válido
```

---

## 🆘 Troubleshooting

### Error 404 en API
```
Solución: Verificar mod_rewrite habilitado
a2enmod rewrite && systemctl restart apache2
```

### Error 500 en Requests POST
```
Solución: Verificar Content-Type en headers
curl -H "Content-Type: application/json" ...
```

### Fotos de usuarios no cargan
```
Solución: Verificar permisos directorio
chmod 755 frontend/dist
chmod 644 frontend/dist/assets/*
```

### Conexión BD falla
```
Solución: Verificar credenciales en api/.env
mysql -u sgmot_user -p sgmot -e "SELECT 1;"
```

### JWT token expirado rápido
```
Solución: Verificar JWT_SECRET fuerte
php -r "echo hash('sha256', 'test');"
```

---

## 📈 Mejoras Post-Deployment

### 1. CDN para Assets
- Usar CloudFront o Cloudflare para frontend/dist

### 2. Caching
- Redis para sesiones
- Varnish para API responses

### 3. Monitoring
- New Relic, Datadog, o Sentry
- Alertas de errores en tiempo real

### 4. Escalabilidad
- Load balancer (Nginx)
- BD réplica (MySQL replication)
- Cache distribuido (Memcached)

---

## 📞 Soporte

- **Documentación:** `SECURITY.md`, `README.md`
- **Verificación:** `php api/security-check.php`
- **Logs:** `/var/log/apache2/sgmot-*.log`

---

**✅ SGMOT está listo para producción.**

**Versión:** 1.0 (Estable)  
**Fecha:** 2026-06-16  
**Última actualización:** Deploy Scripts + Guía Completa
