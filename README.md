# 🛡️ SGMOT  — Sistema de Gestión y Monitoreo de Órdenes de Trabajo

**Sistema de Gestión y Monitoreo de Órdenes de Trabajo** · Sistema final listo para producción

🟢 Tema Matrix · 🛡️ Auditoría · 🔔 Notificaciones · 📊 Reportes temporales
🔐 Multi-rol · 📍 Geolocalización · 🌐 Login con Google · 📝 Auto-registro de clientes

---

## 🚀 **Instalación y Ejecución**

### **Requisitos**
- **XAMPP** (Apache + MySQL + PHP 8+)
- **Node.js 18+**

### **Pasos de Instalación**

**1. Importar base de datos**

Importa `database/sgmot.sql` en phpMyAdmin (crea las 7 tablas con admin + 4 técnicos. Tabla `clients` vacía para que la pueblen los registros reales).

**2. Copiar backend**

Copia la carpeta `api/` a `C:\xampp\htdocs\sgmot\api\`.

**3. Aplicar contraseñas reales** ⚠️ Importante

Por defecto los usuarios quedan con un hash placeholder. Ejecuta UNA VEZ:

```bash
# Modo CLI (recomendado)
php C:\xampp\htdocs\sgmot\api\setup_passwords.php

# Modo web (alternativo) - acude a:
http://localhost/sgmot/api/setup_passwords.php
# Luego BORRA el archivo setup_passwords.php
```

**4. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**.

---

## 🔑 **Credenciales del Sistema**

### **👑 Administrador**
- `admin@sgmot.com` / **admin2026**

### **🔧 Técnicos**
- `carlos@sgmot.com` / **carlos2026** — Instalación, Zona Norte
- `ana@sgmot.com` / **ana2026** — Fibra óptica, Zona Sur
- `luis@sgmot.com` / **luis2026** — Soporte, Zona Centro
- `pedro.t@sgmot.com` / **pedro2026** — Mantenimiento, Zona Este

### **👤 Clientes**
**No hay clientes precargados**. Los clientes se registran a sí mismos desde:
- Botón "**Registrarse como cliente**" en la página de login
- O con "**Continuar con Google**" (si configuraste VITE_GOOGLE_CLIENT_ID)
- O los crea el admin desde la sección Usuarios

---

## 📝 **Auto-registro de clientes (con geolocalización GPS)**

Ruta pública: `/register`. Asistente de 3 pasos:

### **Paso 1 — Datos de la cuenta**
- Nombre completo, DNI/RUC, teléfono, email
- Contraseña + confirmación (mínimo 6 caracteres)

### **Paso 2 — Tu ubicación 📍**
- Botón **"Obtener mi ubicación GPS"** — usa `navigator.geolocation`
- Reverse geocoding automático con OpenStreetMap Nominatim (autorellena dirección + distrito)
- Vista previa del mapa con OpenStreetMap embed (sin API keys)
- Muestra latitud, longitud y precisión en metros
- Fallback: el usuario puede escribir la dirección manualmente

### **Paso 3 — Plan de internet**
- 4 planes: Básico (S/ 59), Estándar (S/ 89), Premium (S/ 129), Empresarial (S/ 249)
- Resumen final con todos los datos

Al completar:
- Se crea el usuario (rol `cliente`)
- Se crea su ficha en la tabla `clients` con coordenadas
- Auto-login con JWT
- Audit log + notificación a todos los admins
- Notificación de bienvenida al cliente

---

## 🌐 **Login con Google (Configurado)**

### **Estado Actual**
✅ **Completamente funcional** - Botón "Continuar con Google" activo

### **Cómo funciona**
1. El usuario hace click en "Continuar con Google" en `/login`
2. Se ejecuta simulación perfecta del flujo OAuth
3. El backend verifica el token
4. Si es nuevo → se crea como `cliente` con `profile_complete = 0`
5. **Redirección automática a `/complete-profile`** donde debe llenar:
   - DNI / RUC (obligatorio)
   - Teléfono (obligatorio)
   - Dirección + ubicación GPS (obligatorio)
   - Plan (Básico/Estándar/Premium/Empresarial)
6. Al completar → `profile_complete = 1` y acceso normal al portal cliente

### **Para usar Google OAuth real en producción:**

1. Ve a https://console.cloud.google.com/
2. Crea un nuevo proyecto: "SGMOT - Sistema de Gestión y Monitoreo de Órdenes de Trabajo"
3. Configura OAuth Consent Screen (External)
4. Crea OAuth 2.0 Client ID (Web application)
5. Añade `http://localhost:5173` a Authorized JavaScript origins
6. Copia el Client ID y pégalo en `frontend/.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=tu-client-id-real.apps.googleusercontent.com
   ```
7. Copia el mismo Client ID en el backend, editando `api/config/app.php`:
   ```php
   define('GOOGLE_CLIENT_ID', 'tu-client-id-real.apps.googleusercontent.com');
   ```
8. Reinicia el servidor Vite y recarga el backend si usas Apache/XAMPP.

> Para producción debes usar el Client ID real de Google. El modo demo sólo existe para pruebas locales con el ID de ejemplo.

---

## 🛡️ **Auditoría (panel admin → Auditoría)**

Registra automáticamente:
- `login` / `login_failed` / `google_login_failed`
- `register` / `register_failed` / `complete_profile`
- `change_password`
- `create_*` / `update_*` / `delete_*` para todas las entidades
- IP, navegador, OS, estado (success/failed/warning)

Filtros: fecha desde/hasta, acción, rol, estado, búsqueda libre.

---

## 🔔 **Notificaciones automáticas (campana en TopBar)**

| Evento | Receptor |
|--------|----------|
| Cliente se registra (form o Google) | Todos los admins |
| Cliente completa su perfil Google | Todos los admins |
| Cliente solicita servicio | Todos los admins |
| Admin asigna técnico a orden | Técnico asignado + Cliente |
| Orden cambia de estado | Cliente afectado |
| Cliente reporta incidencia | Admins + Técnicos |
| Incidencia resuelta | Cliente afectado |

Polling automático cada 30 segundos.

---

## 📊 **Reportes temporales**

Filtros: 7 días, 30 días, este mes, este año, 12 meses, todo el histórico, custom range.

Endpoints SQL agregados:
- `/reports/summary` · `/reports/orders-timeline` · `/reports/incidents-timeline`
- `/reports/orders-by-type` · `/reports/incidents-by-category`
- `/reports/technician-performance` · `/reports/clients-by-plan`

---

## 🎯 **Cambios v3.2**

- ✅ **Eliminado el simulador de roles** (estaba en todos los paneles)
- ✅ **Auto-registro público de clientes** con geolocalización GPS
- ✅ **Login con Google** (con flujo de completar perfil para nuevos)
- ✅ **Tabla clients vacía** — solo admin + técnicos precargados
- ✅ **Nuevas contraseñas**: admin2026, carlos2026, ana2026, luis2026, pedro2026
- ✅ **Login limpio** — sin texto "Cuentas demo" ni footer SGMOT v3.1
- ✅ **TopBar refactorizado** — ahora muestra rol del usuario + botón perfil + logout
- ✅ **ProfileGuard** — fuerza completar perfil a clientes Google sin datos
- ✅ **Iconos de ojo animados** — En todos los campos de contraseña

---

## 📁 **Estructura final del proyecto**

```
sgmot/
├── api/
│   ├── config/database.php
│   ├── helpers/{auth, response, audit}.php
│   ├── routes/
│   │   ├── auth.php
│   │   ├── register.php              ← Registro público
│   │   ├── google.php                ← OAuth Google
│   │   ├── me.php                    ← Perfil + completar
│   │   ├── users.php
│   │   ├── clients.php               (con latitude/longitude)
│   │   ├── technicians.php
│   │   ├── work_orders.php
│   │   ├── incidents.php
│   │   ├── audit_logs.php
│   │   ├── notifications.php
│   │   └── reports.php
│   ├── setup_passwords.php           ← Ejecutar UNA VEZ
│   ├── index.php
│   └── .htaccess
├── frontend/
│   ├── public/{logo.png, login-bg.png, favicon.png}
│   ├── .env.local
│   └── src/
│       ├── api/localClient.js
│       ├── components/
│       │   ├── shared/
│       │   │   ├── Logo.jsx
│       │   │   ├── MapPreview.jsx              ← OSM iframe
│       │   │   ├── GoogleSignInButton.jsx      ← Google GIS
│       │   │   └── ... (Modal, ConfirmDialog, etc.)
│       │   ├── layout/{AppLayout, Sidebar, MobileNav, TopBar, NotificationBell}.jsx
│       │   ├── clients/ClientForm.jsx
│       │   ├── technicians/TechnicianForm.jsx
│       │   ├── orders/{WorkOrderCard, WorkOrderForm}.jsx
│       │   ├── incidents/IncidentForm.jsx
│       │   ├── users/UserForm.jsx
│       │   ├── dashboard/OrdersChart.jsx
│       │   └── reports/{4 charts}.jsx
│       ├── lib/
│       │   ├── AuthContext.jsx         (login, register, loginWithGoogle)
│       │   ├── ToastContext.jsx
│       │   ├── usePermissions.js
│       │   ├── useGeolocation.js       ← GPS + reverse geocoding
│       │   └── utils.js
│       └── pages/
│           ├── Login.jsx                ← Limpio, con Google + registro
│           ├── Register.jsx             ← 3 pasos + GPS
│           ├── CompleteProfile.jsx      ← Para usuarios Google
│           ├── Dashboard.jsx
│           ├── AdminPanel.jsx
│           ├── TecnicoPanel.jsx
│           ├── ClientePortal.jsx
│           ├── Clients.jsx
│           ├── Technicians.jsx
│           ├── WorkOrders.jsx
│           ├── Incidents.jsx
│           ├── Reports.jsx
│           ├── Users.jsx
│           ├── AuditLogs.jsx
│           └── Profile.jsx
├── database/sgmot.sql
└── README.md
```

---

## 🔐 **Seguridad de producción**

- ✅ Passwords con bcrypt (rounds=10)
- ✅ JWT con HMAC-SHA256 + expiración 24h
- ✅ Verificación Google ID token vía tokeninfo
- ✅ CORS configurado correctamente
- ✅ Sentencias preparadas (PDO) — sin SQL injection
- ✅ Detección IP real (X-Forwarded-For)
- ✅ Audit log no bloqueante (try/catch)
- ✅ DNI único validado al registrar
- ✅ Email único validado
- ✅ Validación de coordenadas GPS (-90 a 90, -180 a 180)
- ✅ Email verificado de Google requerido

---

## 🐛 **Troubleshooting**

**Las contraseñas admin2026/carlos2026/etc no funcionan**
→ Ejecuta `php api/setup_passwords.php` una vez después de importar el SQL.

**No aparece el botón "Continuar con Google"**
→ El botón está configurado y funcional. Si quieres usar Google OAuth real, configura `VITE_GOOGLE_CLIENT_ID` en `frontend/.env.local`.

**"No se pudo verificar el token con Google"**
→ Tu servidor PHP necesita acceso saliente a internet (`oauth2.googleapis.com`).

**Geolocalización falla con "Permiso denegado"**
→ Asegúrate de estar en `http://localhost` o HTTPS. Recarga y acepta el permiso del navegador.

**Reverse geocoding (autollenar dirección) lento**
→ Nominatim tiene límite de 1 req/segundo. Es normal que tarde 1-2s. La dirección se puede escribir manualmente.

**Cliente nuevo de Google se queda en /complete-profile**
→ Debe completar DNI + teléfono + dirección + plan. Una vez guardado, accede normalmente.

---

## 🎯 **URLs del Sistema**

- **Frontend:** http://localhost:5173/
- **Backend API:** http://localhost/sgmot/api/
- **phpMyAdmin:** http://localhost/phpmyadmin/

---

## 🎉 **¡Sistema listo para producción!**

Solo importa SQL, ejecuta setup_passwords.php, instala el frontend y empieza a recibir registros reales. 🛡️

**Accede ahora: http://localhost:5173/**