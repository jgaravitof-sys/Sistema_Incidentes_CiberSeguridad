// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');

const app = express();

// 🛡️ Seguridad y middlewares
app.use(helmet({
  contentSecurityPolicy: false // Desactivar para desarrollo
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit básico
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100
});
app.use(limiter);

// 📁 Crear carpeta uploads si no existe
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Servir archivos de uploads públicamente
app.use('/uploads', express.static(path.join(__dirname, UPLOAD_DIR)));

// 🔌 Conexión a la base de datos
connectDB(process.env.MONGODB_URI);

// 👑 Crear admin inicial si no existe
(async () => {
  try {
    const adminEmail = process.env.INIT_ADMIN_EMAIL || 'admin@ciberseguridad.com';
    let admin = await Usuario.findOne({ email: adminEmail });

    if (!admin) {
      const hashed = await bcrypt.hash(process.env.INIT_ADMIN_PASS || 'admin123', 10);
      admin = new Usuario({
        nombre: process.env.INIT_ADMIN_NAME || 'Administrador General',
        email: adminEmail,
        password: hashed, 
        rol: 'Administrador',
        aprobado: true,  // ⬅️ IMPORTANTE: Admin auto-aprobado
        activo: true     // ⬅️ IMPORTANTE: Admin activo
      });
      await admin.save();
      console.log('✅ Admin inicial creado:', adminEmail);
      console.log('🔑 Password: admin123');
    } else {
      console.log('🔧 Admin inicial ya existe:', adminEmail);
    }
  } catch (err) {
    console.error('❌ Error creando admin inicial:', err.message || err);
  }
})();

// 🧩 Rutas API - DEBEN IR ANTES de todo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));        // ⬅️ ¡FALTABA ESTA LÍNEA!
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/incidentes', require('./routes/incidentes'));
app.use('/api/evidencias', require('./routes/evidencias'));
app.use('/api/auditorias', require('./routes/auditorias'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/codigos', require('./routes/codigos'));

// ⚠️ IMPORTANTE: Rutas explícitas ANTES de express.static
// Esto evita que index.html se sirva automáticamente
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/reportes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

app.get('/auditorias', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auditorias.html'));
});

// Servir archivos estáticos DESPUÉS de las rutas explícitas
app.use(express.static(path.join(__dirname, 'public')));

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('════════════════════════════════════════');
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('════════════════════════════════════════');
});