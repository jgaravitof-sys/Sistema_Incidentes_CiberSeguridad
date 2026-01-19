const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const { verifyToken, requireRole } = require('../middleware/auth');
const { notificarAdminUsuarioRegistrado } = require('../config/email');

// ✅ REGISTRO PÚBLICO
router.post('/register-public', async (req, res) => {
  try {
    const { nombre, email, password, rol, codigoVerificacion } = req.body;

    console.log('📝 Intento de registro público:', { nombre, email, rol });

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el email ya existe
    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    let rolFinal = 'Cliente';
    let requiereAprobacion = false;

    // Si solicita un rol diferente a Cliente, DEBE tener código
    if (rol && rol !== 'Cliente') {
      if (!codigoVerificacion) {
        return res.status(400).json({ 
          message: 'Necesitas un código de verificación para registrarte con este rol' 
        });
      }

      // Validar código de verificación
      const codigo = await CodigoVerificacion.findOne({
        codigo: codigoVerificacion.toUpperCase(),
        email: email.toLowerCase(),
        rol: rol,
        usado: false,
        fechaExpiracion: { $gt: new Date() }
      });

      if (!codigo) {
        return res.status(400).json({ 
          message: 'Código de verificación inválido, ya usado, expirado o no corresponde a este email/rol' 
        });
      }

      // Código válido
      rolFinal = rol;
      requiereAprobacion = true; // Los roles especiales requieren aprobación

      // Marcar código como usado
      codigo.usado = true;
      codigo.fechaUso = new Date();
      await codigo.save();
    }

    // Hash de contraseña
    const hashed = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const nuevo = new Usuario({ 
      nombre, 
      email: email.toLowerCase(),
      password: hashed,
      rol: rolFinal,
      aprobado: !requiereAprobacion // Cliente se aprueba automáticamente
    });
    
    await nuevo.save();

    // Actualizar referencia en código
    if (requiereAprobacion) {
      const codigo = await CodigoVerificacion.findOne({
        codigo: codigoVerificacion.toUpperCase()
      });
      if (codigo) {
        codigo.usadoPor = nuevo._id;
        await codigo.save();
      }

      // Notificar a TODOS los administradores
      const administradores = await Usuario.find({ rol: 'Administrador', activo: true });
      
      for (const admin of administradores) {
        try {
          await notificarAdminUsuarioRegistrado(admin.email, nombre, email, rolFinal);
        } catch (err) {
          console.error(`Error notificando a admin ${admin.email}:`, err.message);
        }
      }
    }

    console.log('✅ Usuario registrado:', email, '- Rol:', rolFinal, '- Aprobado:', !requiereAprobacion);

    if (requiereAprobacion) {
      res.json({ 
        message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador. Recibirás un correo cuando sea aprobada.',
        usuario: { 
          nombre: nuevo.nombre, 
          email: nuevo.email, 
          rol: nuevo.rol,
          aprobado: false
        } 
      });
    } else {
      res.json({ 
        message: 'Registro exitoso. Ahora puedes iniciar sesión.',
        usuario: { 
          nombre: nuevo.nombre, 
          email: nuevo.email, 
          rol: nuevo.rol,
          aprobado: true
        } 
      });
    }
  } catch (err) {
    console.error('❌ Error en registro público:', err);
    res.status(500).json({ 
      message: 'Error en el registro', 
      error: err.message 
    });
  }
});

// ✅ REGISTRO DE USUARIO (solo para Admin)
router.post('/register', verifyToken, requireRole(['Administrador']), async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    console.log('📝 Intento de registro por Admin:', { nombre, email, rol });

    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    const nuevo = new Usuario({ 
      nombre, 
      email: email.toLowerCase(),
      password: hashed,
      rol: rol || 'Cliente',
      aprobado: true, // Admin crea usuarios pre-aprobados
      aprobadoPor: req.user.id
    });
    
    await nuevo.save();

    console.log('✅ Usuario creado por Admin:', email);

    res.json({ 
      message: 'Usuario creado correctamente', 
      usuario: { 
        nombre: nuevo.nombre, 
        email: nuevo.email, 
        rol: nuevo.rol,
        aprobado: true
      } 
    });
  } catch (err) {
    console.error('❌ Error en registro:', err);
    res.status(500).json({ 
      message: 'Error en el registro', 
      error: err.message 
    });
  }
});

// ✅ LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login para:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const user = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      console.log('❌ Usuario inactivo:', email);
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' });
    }

    // Verificar si el usuario está aprobado
    if (!user.aprobado) {
      console.log('⏳ Usuario no aprobado:', email);
      return res.status(403).json({ 
        message: 'Tu cuenta está pendiente de aprobación por un administrador. Recibirás un correo cuando sea aprobada.' 
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      console.log('❌ Contraseña incorrecta para:', email);
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    console.log('✅ Login exitoso:', email, '- Rol:', user.rol);

    const token = jwt.sign(
      { 
        id: user._id, 
        rol: user.rol,
        email: user.email 
      },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (err) {
    console.error('❌ Error en login:', err);
    res.status(500).json({ 
      message: 'Error en el login', 
      error: err.message 
    });
  }
});

// 🔍 VERIFICAR TOKEN
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ 
      valid: true,
      user 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error verificando token', 
      error: err.message 
    });
  }
});

module.exports = router;