<?php
// Configuración global de la API.
// Aquí puedes colocar las claves necesarias para el backend.

// Client ID de Google para verificar ID tokens en login con Google.
// Preferir variable de entorno, si no está definida usar el Client ID proporcionado
define('GOOGLE_CLIENT_ID', getenv('GOOGLE_CLIENT_ID') ?: '907151369822-iomp7pkf5pbeea2e1vt1gldkee02crg2.apps.googleusercontent.com');
