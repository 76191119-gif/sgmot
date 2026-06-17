# SGMOT - Sistema de Gestion y Monitoreo de Ordenes de Trabajo

SGMOT es un sistema web para gestionar clientes, tecnicos, ordenes de trabajo, incidencias, notificaciones, auditoria y reportes.

Estado actual:
- Backend PHP/PDO sobre XAMPP.
- Frontend React/Vite.
- Base de datos unica en `database/sgmot.sql`.
- Roles: admin, cliente y tecnico.
- Login local y Google OAuth.
- Clientes sin servicio generan orden automatica de instalacion.

---

## Instalacion Rapida

### Requisitos

- XAMPP con Apache, MySQL y PHP 8+
- Node.js 18+

### Base de datos

La base es unica. Solo se usa:

```text
database/sgmot.sql
```

Para reiniciar todo desde cero:

```bash
mysql -u root -e "DROP DATABASE IF EXISTS sgmot;"
mysql -u root < database/sgmot.sql
```

En XAMPP/PowerShell:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' -u root -e "DROP DATABASE IF EXISTS sgmot;"
Get-Content database\sgmot.sql | & 'C:\xampp\mysql\bin\mysql.exe' -u root
```

El SQL crea:
- `users`
- `clients`
- `technicians`
- `work_orders`
- `incidents`
- `notifications`
- `audit_logs`

La tabla `clients` inicia vacia. Solo vienen precargados 1 admin y 4 tecnicos.

### Backend

El proyecto debe estar en:

```text
C:\xampp\htdocs\sgmot
```

API:

```text
http://localhost/sgmot/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

URL:

```text
http://localhost:5173/login
```

---

## Identidad Visual Final

SGMOT usa una interfaz cyberpunk futurista orientada a operacion tecnica:

- Fondo oscuro profesional con video animado en login: `frontend/public/cyberpunk.mp4`.
- Paleta premium: fondo base `#03060A`, paneles `#07111D`, superficies `#0B1A26`.
- Verde neon principal `#39FF14`, hover `#00FF66`, HUD `#19E35A`, glow `#66FF99`.
- Apoyos visuales: cian tecnologico `#00E5FF`, azul electrico `#1E90FF`, advertencia `#FFD83D`, alerta `#FF4D57`.
- Texto principal `#EAFEF0`, secundario `#A7C7B2`, tenue `#6D8B78`.
- Superficies glassmorphism con transparencia, blur, bordes HUD y profundidad visual.
- Animaciones de scanlines, auroras, barridos de luz, botones neon y tarjetas flotantes.
- Graficos y reportes con colores contrastados sobre fondo oscuro.
- Formularios oscuros translcidos con texto claro para mantener legibilidad.
- Login con panel transparente para integrar el video de fondo sin perder contraste.

Variables CSS base:

```css
:root{
  --bg-main: #03060A;
  --bg-panel: #07111D;
  --bg-card: #0B1A26;
  --neon-primary: #39FF14;
  --neon-secondary: #00FF66;
  --neon-glow: #66FF99;
  --neon-border: #19E35A;
  --info: #00E5FF;
  --warning: #FFD83D;
  --danger: #FF4D57;
  --text-main: #EAFEF0;
  --text-secondary: #A7C7B2;
  --text-muted: #6D8B78;
}
```

Uso de estados:
- Pendiente: `#FFD83D`
- En proceso: `#00E5FF`
- Completado: `#39FF14`
- Cancelado/error: `#FF4D57`

Archivos principales de estilo:

```text
frontend/src/index.css
frontend/tailwind.config.js
frontend/src/pages/Login.jsx
frontend/src/components/shared/StatCard.jsx
frontend/src/components/shared/Modal.jsx
frontend/src/components/shared/PageHeader.jsx
frontend/src/pages/Reports.jsx
frontend/src/components/dashboard/OrdersChart.jsx
```

---

## Credenciales Iniciales

### Admin

| Email | Password |
|---|---|
| `admin@sgmot.com` | `admin2026` |

### Tecnicos

| Tecnico | Email | Password | Especialidad |
|---|---|---|---|
| Carlos Mendoza | `carlos@sgmot.com` | `carlos2026` | Instalacion |
| Ana Torres | `ana@sgmot.com` | `ana2026` | Fibra optica |
| Luis Ramos | `luis@sgmot.com` | `luis2026` | Soporte |
| Pedro Castillo | `pedro.t@sgmot.com` | `pedro2026` | Mantenimiento |

---

## Roles y Permisos

| Rol | Acceso principal | Ordenes | Incidencias | Clientes | Tecnicos | Perfil |
|---|---|---|---|---|---|---|
| Admin | Acceso total | Ve, crea, edita, asigna y elimina todas | Ve, crea, edita, asigna y elimina todas | Ve, crea, edita y elimina todos | Ve, crea, edita y elimina todos | Puede actualizar su perfil |
| Cliente | Solo su informacion y servicios | Ve sus ordenes y puede crear solicitudes propias | Ve sus incidencias y puede crear incidencias propias | Ve solo su ficha | No lista tecnicos | Puede actualizar perfil, ubicacion, plan y contrasena |
| Tecnico | Solo trabajo asignado | Ve asignadas y solo actualiza estado/notas | Ve asignadas y solo actualiza estado/resolucion | Ve clientes relacionados con sus asignaciones | Ve solo su ficha | No puede actualizar perfil ni contrasena |

Cuando un tecnico cambia el estado de una orden o incidencia asignada, el sistema notifica al admin.

---

## Ordenes vs Incidencias

| Modulo | Uso |
|---|---|
| Ordenes de trabajo | Trabajos operativos: nueva instalacion, instalacion, soporte, mantenimiento o retiro |
| Incidencias | Problemas reportados: sin servicio, lentitud, corte de fibra, equipo danado, configuracion u otro |

Regla principal:
- Cliente nuevo sin servicio: genera una orden automatica de nueva instalacion.
- Cliente con servicio y problema: crea una incidencia.

---

## Registro de Clientes

Ruta publica:

```text
/register
```

El registro tiene 3 pasos:

1. Datos de cuenta: nombre, DNI/RUC, telefono, email y contrasena.
2. Ubicacion: direccion manual o GPS.
3. Plan: Basico, Estandar, Premium o Empresarial.

### Cliente nuevo sin servicio

Si el DNI/RUC no existe en `clients`:

- Se crea usuario con rol `cliente`.
- Se crea ficha en `clients`.
- Se crea automaticamente una orden `nueva_instalacion`.
- La orden queda en estado `pendiente`.
- El admin recibe notificacion para gestionarla/asignarla.
- El cliente entra automaticamente.

### Cliente existente con servicio

Si el DNI/RUC ya existe en `clients` y aun no tiene cuenta:

- Se valida que el telefono coincida.
- Se crea usuario con rol `cliente`.
- Se vincula `clients.user_id`.
- Se actualiza plan/datos de contacto.
- No se genera orden de instalacion.
- El cliente entra automaticamente.

Si el DNI ya tiene una cuenta vinculada, el registro se bloquea y debe iniciar sesion o contactar soporte.

---

## Google OAuth

El login con Google usa Google Identity Services en frontend y validacion del ID token en backend.

Configurar frontend:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

El backend puede leer ese valor desde `frontend/.env.local`. Tambien se puede configurar en `api/.env`:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

Origenes autorizados en Google Cloud para desarrollo:

```text
http://localhost:5173
http://127.0.0.1:5173
```

---

## Configuracion Backend

Ejemplo en `api/.env`:

```env
GOOGLE_CLIENT_ID=
JWT_SECRET=cambia-este-secreto-largo-y-aleatorio
CORS_ALLOWED_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_NAME=sgmot
DB_USER=root
DB_PASSWORD=

```

En desarrollo local, los valores por defecto funcionan con XAMPP.

---

## Produccion Final

### Build del frontend

```bash
cd frontend
npm install
npm run build
```

La salida de produccion queda en:

```text
frontend/dist
```

### Checklist antes de publicar

- Importar `database/sgmot.sql` en MySQL.
- Configurar `api/.env` con datos reales de base de datos y `JWT_SECRET` fuerte.
- Configurar `frontend/.env.local` con `VITE_API_URL` y `VITE_GOOGLE_CLIENT_ID`.
- Autorizar en Google Cloud el origen real del frontend.
- Verificar que `frontend/public/cyberpunk.mp4` este disponible si se usa el login animado.
- Ejecutar `npm run build` sin errores.
- Probar login local y Google OAuth.
- Probar roles admin, tecnico y cliente.
- Verificar que Apache/PHP pueda acceder a MySQL.

### Verificacion rapida

```powershell
$body = @{ email='admin@sgmot.com'; password='admin2026' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost/sgmot/api/auth/login' -Body $body -ContentType 'application/json'
```

### Despliegue recomendado

- Backend PHP dentro del servidor Apache.
- Frontend compilado desde `frontend/dist`.
- MySQL con charset `utf8mb4`.
- HTTPS en produccion para OAuth, geolocalizacion y seguridad del token.

---

## Notificaciones

| Evento | Receptor |
|---|---|
| Cliente nuevo sin servicio se registra | Admin |
| Cliente existente con servicio se registra | Cliente |
| Cliente solicita orden | Admin |
| Admin asigna tecnico a orden | Tecnico asignado y cliente |
| Tecnico cambia estado de orden | Admin y cliente |
| Cliente reporta incidencia | Admin |
| Admin asigna incidencia | Tecnico asignado |
| Tecnico cambia estado de incidencia | Admin y cliente |

La campana consulta notificaciones periodicamente.

---

## Auditoria

El sistema registra:

- Login correcto/fallido.
- Registro correcto/fallido.
- Login Google fallido.
- Cambios de contrasena.
- Crear, actualizar y eliminar entidades.
- IP, navegador, sistema operativo, estado y fecha.

Solo admin accede al panel de auditoria.

---

## Reportes

Solo admin accede a reportes:

- Resumen general.
- Ordenes por tiempo.
- Incidencias por tiempo.
- Ordenes por tipo.
- Incidencias por categoria.
- Rendimiento de tecnicos.
- Clientes por plan.

---

## Estructura

```text
sgmot/
  api/
    config/
      app.php
      database.php
    helpers/
      audit.php
      auth.php
      identity.php
      response.php
    routes/
      auth.php
      register.php
      google.php
      me.php
      users.php
      clients.php
      technicians.php
      work_orders.php
      incidents.php
      notifications.php
      audit_logs.php
      reports.php
    index.php
    .env.example
  database/
    sgmot.sql
  frontend/
    src/
    public/
    .env.example
  README.md
```

No se usan migraciones separadas actualmente. El esquema completo vive en `database/sgmot.sql`.

---

## Comandos de Verificacion

PHP lint:

```powershell
$failed = $false
Get-ChildItem -Recurse api -Filter *.php | ForEach-Object {
  & 'C:\xampp\php\php.exe' -l $_.FullName
  if ($LASTEXITCODE -ne 0) { $failed = $true }
}
if ($failed) { exit 1 }
```

Frontend build:

```bash
cd frontend
npm run build
```

Login admin API:

```powershell
$body = @{ email='admin@sgmot.com'; password='admin2026' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost/sgmot/api/auth/login' -Body $body -ContentType 'application/json'
```

---

## Troubleshooting

**No puedo iniciar sesion con admin o tecnicos**

Reimporta `database/sgmot.sql`. Las contrasenas iniciales ya vienen hasheadas.

**Google no inicia sesion**

Revisa `VITE_GOOGLE_CLIENT_ID`, origenes autorizados en Google Cloud y acceso saliente de PHP a `oauth2.googleapis.com`.

**Geolocalizacion no funciona**

Usa `localhost` o HTTPS y acepta el permiso del navegador. Tambien se puede escribir la direccion manualmente.

**El frontend abre pero el API falla**

Verifica que Apache y MySQL esten activos en XAMPP y que el proyecto este en `C:\xampp\htdocs\sgmot`.

---

## URLs

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:5173/login` |
| API | `http://localhost/sgmot/api` |
| phpMyAdmin | `http://localhost/phpmyadmin` |
