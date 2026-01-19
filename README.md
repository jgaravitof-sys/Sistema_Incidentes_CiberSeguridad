# Sistema de Gestión de Incidentes (ciberseguridad)

## Requisitos
- Node.js >= 18
- MongoDB (local o Atlas)

## Pasos
1. Clona / copia el proyecto.
2. Copia `.env.example` a `.env` y ajusta variables.
3. Instala dependencias:
   npm install
4. Levanta servidor:
   npm run dev   (requiere nodemon)
   o
   npm start
5. Abre en navegador:
   http://localhost:4000/login.html

## Notas
- Endpoints:
  - POST /api/auth/register
  - POST /api/auth/login
  - GET /api/incidentes
  - POST /api/incidentes
  - PUT /api/incidentes/:id/asignar
  - PUT /api/incidentes/:id/estado
  - POST /api/evidencias/:incidenteId  (multipart/form-data campo `file`)
- Logs de auditoría se almacenan en colección `auditorias`.

# En la terminal del proyecto
node server.js
```

Revisar que:
- El servidor esté corriendo en el puerto correcto (probablemente 3000)
- MongoDB esté conectado
- Tengas al menos un usuario de prueba en la BD

### **2. Problemas Detectados que Debes Corregir** 🔴

1. **Campo de contraseña inconsistente**: Tu backend probablemente espera `contraseña` pero tu frontend envía `password`
2. **Redirección incorrecta**: El login intenta ir a `/dashboard` en lugar de `/dashboard.html`
3. **Falta manejo de errores visible**

### **3. Tareas Prioritarias para Cumplir el Proyecto** 📝

#### **Sprint 1 - Funcionalidades Base (Ya tienes esto casi completo)**
- ✅ Sistema de login
- ✅ CRUD de incidentes  
- ✅ Gestión de usuarios (solo admin)
- 🔶 Corregir bugs del login
- 🔶 Validar que todas las rutas funcionen

#### **Sprint 2 - Funcionalidades Avanzadas**
- 🔶 Sistema de asignación de responsables a incidentes
- 🔶 Actualización de estados de incidentes
- 🔶 Sistema de auditoría funcional
- 🔶 Mejoras en reportes con filtros avanzados

#### **Sprint 3 - Seguridad y Optimización**
- ⚪ Hash de contraseñas (verificar implementación)
- ⚪ Validaciones de roles y permisos
- ⚪ Pruebas unitarias
- ⚪ Pruebas de integración

### **4. Documentación SCRUM Faltante** 📚

Se debe crear:

1. **Product Backlog** con 15+ historias de usuario
2. **Sprint Planning** de cada sprint
3. **Daily Standups** documentados
4. **Sprint Retrospective** de cada sprint
5. **Definición de roles**: Product Owner, Scrum Master, Dev Team

### **5. Base de Datos MongoDB** 💾

Verifica que tengas implementado:
- ✅ Colección `usuarios`
- ✅ Colección `incidentes`
- 🔶 Colección `auditorias` (verificar que esté guardando acciones)
- ✅ Colección `evidencias`
- ⚪ Agregaciones para reportes avanzados
- ⚪ Índices para optimización

### **6. Próximos Pasos Inmediatos** 🚀

**Hoy:**
1. Reemplazar `login.html` con el código corregido
2. Verificar archivo `auth.js` en el backend - se debe esperar el campo `contraseña`
3. Probar el login con un usuario de prueba
4. Verificar que el dashboard cargue correctamente

**Mañana:**
1. Agregar funcionalidad para **editar/actualizar** incidentes
2. Agregar campo de **responsable** a los incidentes
3. Mejorar el sistema de **estados** (permitir cambiar estados)

**Esta Semana:**
1. Implementar sistema de **auditoría visible** (ver quién hizo qué)
2. Mejorar **reportes** con agregaciones de MongoDB
3. Crear **historial de cambios** en incidentes
4. Pruebas de todas las funcionalidades

### **7. Estructura de Historias de Usuario Sugeridas** 📖
```
HU-01: Como usuario, quiero iniciar sesión para acceder al sistema
HU-02: Como administrador, quiero crear nuevos usuarios
HU-03: Como usuario, quiero registrar un incidente
HU-04: Como analista, quiero ver todos los incidentes asignados a mí
HU-05: Como técnico, quiero actualizar el estado de un incidente
HU-06: Como usuario, quiero subir evidencias a un incidente
HU-07: Como auditor, quiero ver el historial de acciones del sistema
HU-08: Como administrador, quiero generar reportes filtrados
HU-09: Como usuario, quiero ver estadísticas de incidentes
HU-10: Como técnico, quiero agregar comentarios a incidentes
HU-11: Como administrador, quiero exportar reportes a PDF/Excel
HU-12: Como usuario, quiero recibir notificaciones de cambios
HU-13: Como analista, quiero filtrar incidentes por múltiples criterios
HU-14: Como administrador, quiero desactivar usuarios
HU-15: Como auditor, quiero exportar logs de auditoría
