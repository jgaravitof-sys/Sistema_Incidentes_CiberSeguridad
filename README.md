# Sistema de Gestión de Incidentes de Ciberseguridad

Sistema web para registrar, gestionar y dar seguimiento a incidentes de seguridad informática con control de acceso por roles, auditoría de acciones y gestión de evidencias.

## Descripción

Aplicación desarrollada con metodología SCRUM que permite a equipos de ciberseguridad gestionar incidentes de seguridad de manera eficiente. Incluye autenticación de usuarios, asignación de responsables, actualización de estados, carga de evidencias y generación de reportes con trazabilidad completa.

## Tecnologías

- **Backend**: Node.js, Express.js
- **Base de Datos**: MongoDB
- **Autenticación**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript

## Requisitos

- Node.js >= 18
- MongoDB (local o MongoDB Atlas)

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/sistema-incidentes.git
cd sistema-incidentes
```

2. Copia el archivo de configuración:
```bash
cp .env.example .env
```

3. Configura las variables de entorno en `.env`:
```
MONGO_URI=mongodb://localhost:27017/incidentes
JWT_SECRET=tu_clave_secreta
PORT=4000
```

4. Instala las dependencias:
```bash
npm install
```

5. Inicia el servidor:
```bash
npm run dev
```
O en producción:
```bash
npm start
```

6. Abre en el navegador:
```
http://localhost:4000/login.html
```

## Funcionalidades

- Autenticación y autorización por roles (Admin, Analista, Técnico)
- Registro y gestión de incidentes de seguridad
- Asignación de responsables a incidentes
- Actualización de estados (Abierto, En Proceso, Resuelto, Cerrado)
- Carga de evidencias (archivos adjuntos)
- Sistema de auditoría para trazabilidad
- Generación de reportes y estadísticas
- Gestión de usuarios (solo administradores)

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Incidentes
- `GET /api/incidentes` - Listar incidentes
- `POST /api/incidentes` - Crear incidente
- `PUT /api/incidentes/:id/asignar` - Asignar responsable
- `PUT /api/incidentes/:id/estado` - Actualizar estado

### Evidencias
- `POST /api/evidencias/:incidenteId` - Subir evidencia (multipart/form-data)

## Estructura del Proyecto
```
├── server.js              # Servidor principal
├── routes/               # Rutas de la API
├── models/               # Modelos de MongoDB
├── middleware/           # Middleware de autenticación
├── public/               # Archivos estáticos (HTML, CSS, JS)
├── uploads/              # Evidencias cargadas
└── .env                  # Variables de entorno
```

## Usuarios de Prueba
```
Admin:
- Email: admin@sistema.com
- Contraseña: admin123

Analista:
- Email: analista@sistema.com
- Contraseña: analista123
```

## Metodología

Proyecto desarrollado siguiendo metodología SCRUM con sprints de 2 semanas, incluyendo Product Backlog, Sprint Planning, Daily Standups y Retrospectivas.

## Autor

Juan Felipe Garavito

## Licencia

MIT
