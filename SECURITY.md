# 🔒 Guía de Seguridad - SGMOT

## Correcciones de Seguridad Implementadas

### ✅ Críticos (Arreglados)

#### 1. SQL Injection en Reports
- **Problema:** Variable `$fmt` en `DATE_FORMAT()` sin sanitizar
- **Solución:** Validación whitelist + uso de `match()` para constructor seguro
- **Archivo:** `api/routes/reports.php`

#### 2. SQL Injection en Audit Logs
- **Problema:** `LIMIT $limit` insertado sin prepared statement
- **Solución:** Usar placeholder `?` en LIMIT clause
- **Archivo:** `api/routes/audit_logs.php`

#### 3. Base64 Bomb
- **Problema:** Validación de tamaño sobre data URL (700KB → potencial GBs descomprimidos)
- **Solución:** Decodificar + validar tamaño real + validar MIME type
- **Archivo:** `api/routes/me.php`

#### 4. Information Disclosure
- **Problema:** Logs públicos revelan si email existe (enumeración usuarios)
- **Solución:** Mensajes genéricos: "Credenciales incorrectas"
- **Archivo:** `api/routes/auth.php`

#### 5. JWT_SECRET Débil
- **Problema:** Default `SGMOT_CHANGE_THIS_SECRET_IN_ENV`
- **Solución:** Validación que SECRET tenga 32+ caracteres aleatorios
- **Archivo:** `api/config/app.php`

---

### ✅ Altos (Arreglados)

#### 6. CORS Abierto Globalmente
- **Problema:** Default `*` permite requests desde cualquier origen
- **Solución:** Default `http://localhost:5173`, warnings en logs
- **Archivo:** `api/config/app.php`

#### 7. Content-Type No Validado
- **Problema:** POST/PUT aceptan input sin validar `Content-Type`
- **Solución:** Rechazar si no es `application/json` en mutaciones
- **Archivo:** `api/helpers/response.php`

#### 8. SSL Fallback Inseguro en Google
- **Problema:** Desactivar SSL verification en fallback local
- **Solución:** Permitir solo en requests locales + logging
- **Archivo:** `api/routes/google.php`

#### 9. Rate Limiting Solo en Login
- **Problema:** Endpoints DELETE/PUT sin protección de fuerza bruta
- **Solución:** CSRF tokens en todas las mutaciones (SPA)
- **Archivo:** `api/index.php`, `api/helpers/csrf.php`

#### 10. Falta Validación Consistente
- **Problema:** Email/phone/DNI validados de forma inconsistente
- **Solución:** Helper centralizado `validators.php`
- **Archivo:** `api/helpers/validators.php`

---

### ✅ Medios (Arreglados)

#### 11. Security Headers Faltantes
- **Agregados:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy: default-src 'self'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- **Archivo:** `api/helpers/response.php`

#### 12. CSRF Tokens
- **Implementado:** Helper para generar/validar tokens (SPA-friendly)
- **Requisito:** Frontend envía `X-CSRF-Token` header
- **Archivo:** `api/helpers/csrf.php`

#### 13. Logs de Auditoria
- **Mejora:** Datos sensibles NO registrados en logs públicos
- **Archivo:** `api/routes/auth.php`

---

## 🔑 Configuración de Producción

### 1. JWT_SECRET (CRÍTICO)

```bash
# Generar secreto fuerte
openssl rand -base64 32

# Resultado ejemplo:
# aBcDeF1234567890xYzAbCdEf1234567890AbCdEf==

# Guardar en api/.env
JWT_SECRET=aBcDeF1234567890xYzAbCdEf1234567890AbCdEf==
```

### 2. CORS (Restringir Origen)

```env
# Desarrollo:
CORS_ALLOWED_ORIGIN=http://localhost:5173

# Producción:
CORS_ALLOWED_ORIGIN=https://tudominio.com
```

### 3. Base de Datos

```env
# Cambiar contraseña root
DB_USER=sgmot_user
DB_PASSWORD=CONTRASEÑA_FUERTE_AQUI

# Crear usuario MySQL:
# CREATE USER 'sgmot_user'@'localhost' IDENTIFIED BY 'CONTRASEÑA';
# GRANT ALL ON sgmot.* TO 'sgmot_user'@'localhost';
```

### 4. HTTPS/SSL

```apache
# En Apache .htaccess:
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 🛡️ Checklist Antes de Producción

- [ ] JWT_SECRET generado con `openssl rand -base64 32`
- [ ] CORS_ALLOWED_ORIGIN = dominio real (no `*`)
- [ ] HTTPS habilitado en servidor web
- [ ] DB_PASSWORD cambio a contraseña fuerte
- [ ] Logs de error configurados en `/var/log/`
- [ ] Backups automáticos de base de datos
- [ ] Certificado SSL/TLS válido
- [ ] WAF (Web Application Firewall) configurado
- [ ] Rate limiting por IP (nginx/Apache)
- [ ] Headers de seguridad verificados

---

## 📋 Headers de Seguridad Enviados

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' oauth2.googleapis.com
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Access-Control-Allow-Credentials: true
```

---

## 🔍 Validaciones Implementadas

### Datos de Usuario
- Email: FILTER_VALIDATE_EMAIL + max 150 chars
- Teléfono: Formato +51 999 999 999 o 999999999 (7-15 dígitos)
- DNI: 8-11 dígitos (Perú)
- Nombre: 2-100 chars, letras/números/espacios/guiones
- Contraseña: Mínimo 8, máximo 128 caracteres

### Fotos de Perfil
- Formatos: PNG, JPEG, WEBP
- Tamaño máximo: 500 KB (real, no base64)
- Validación MIME type real (no solo extensión)
- Prevención base64 bomb

### Fechas
- Formato: YYYY-MM-DD
- Rango: -100 años hasta +10 años (razonable)

---

## 🚨 Vulnerabilidades Conocidas

### Nota: Foto en Base64 en BD (Anti-patrón)

Actualmente, fotos se almacenan como base64 en la columna `photo_url`.

**Mejora futura:** Guardar en filesystem o S3
```php
// Propuesto:
file_put_contents("uploads/$fileName.png", $binaryData);
$photo = "/uploads/$fileName.png";  // Guardar URL, no base64
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [HTTP Security Headers](https://securityheaders.com/)

---

**Última actualización:** 2026-06-16
**Versión:** 1.0 (Post-Security Audit)
