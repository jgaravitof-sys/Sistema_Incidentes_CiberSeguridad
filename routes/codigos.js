// routes/codigos.js
const express = require('express');
const router = express.Router();
const CodigoVerificacion = require('../models/CodigoVerificacion');
const Usuario = require('../models/Usuario');
const { verifyToken, requireRole } = require('../middleware/auth');
const { enviarCodigoVerificacion } = require('../config/email');
const crypto = require('crypto');

// 📨 SOLICITAR CÓDIGO (sin autenticación - público)
router.post('/solicitar', async (req, res) => {
  try {
    const { nombre, email, rol } = req.body;

    console.log('📨 Solicitud de código:', { nombre, email, rol });

    if (!nombre || !email || !rol) {
      return res.status(400).json({ 
        message: 'Nombre, email y rol son requeridos' 
      });
    }

    if (!['Analista', 'Técnico', 'Auditor'].includes(rol)) {
      return res.status(400).json({ 
        message: 'Rol inválido. Debe ser: Analista, Técnico o Auditor' 
      });
    }

    // Verificar si el email ya está registrado
    const usuarioExiste = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExiste) {
      return res.status(400).json({ 
        message: 'Este email ya está registrado en el sistema' 
      });
    }

    // Verificar si ya tiene un código activo
    const codigoExistente = await CodigoVerificacion.findOne({
      email: email.toLowerCase(),
      rol: rol,
      usado: false,
      fechaExpiracion: { $gt: new Date() }
    });

    if (codigoExistente) {
      return res.status(400).json({ 
        message: 'Ya tienes un código activo. Revisa tu email o espera a que expire.' 
      });
    }

    // Generar código aleatorio
    const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Calcular fecha de expiración (30 minutos)
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 3);

    const nuevoCodigo = new CodigoVerificacion({
      codigo,
      email: email.toLowerCase(),
      nombreSolicitante: nombre,
      rol,
      fechaExpiracion
    });

    await nuevoCodigo.save();

    // ENVIAR CÓDIGO INMEDIATAMENTE POR EMAIL
    const emailResult = await enviarCodigoVerificacion(email, codigo, rol, nombre);

    if (emailResult.success) {
      nuevoCodigo.emailEnviado = true;
      await nuevoCodigo.save();
    }

    console.log(`✅ Código generado y enviado: ${email} - ${rol} - ${codigo}`);

    res.json({
      message: 'Código enviado a tu correo electrónico. Revisa tu bandeja de entrada (y spam).',
      info: {
        email,
        rol,
        expiraEn: '30 minutos',
        emailEnviado: emailResult.success
      }
    });
  } catch (err) {
    console.error('❌ Error en solicitud de código:', err);
    res.status(500).json({ 
      message: 'Error al procesar solicitud',
      error: err.message 
    });
  }
});

// 📋 LISTAR CÓDIGOS (solo Admin)
router.get('/',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { activos } = req.query;

      let filtro = {};
      
      if (activos === 'true') {
        filtro.usado = false;
        filtro.fechaExpiracion = { $gt: new Date() };
      }

      const codigos = await CodigoVerificacion.find(filtro)
        .populate('usadoPor', 'nombre email rol')
        .sort({ fechaCreacion: -1 });

      res.json(codigos);
    } catch (err) {
      console.error('❌ Error listando códigos:', err);
      res.status(500).json({ 
        message: 'Error al listar códigos',
        error: err.message 
      });
    }
  }
);

// 🔍 VALIDAR CÓDIGO (para registro público)
router.post('/validar', async (req, res) => {
  try {
    const { codigo, email, rol } = req.body;

    if (!codigo || !email || !rol) {
      return res.status(400).json({ 
        message: 'Código, email y rol son requeridos' 
      });
    }

    const codigoVerificacion = await CodigoVerificacion.findOne({
      codigo: codigo.toUpperCase(),
      email: email.toLowerCase(),
      rol: rol,
      usado: false,
      fechaExpiracion: { $gt: new Date() }
    });

    if (!codigoVerificacion) {
      return res.status(400).json({ 
        valid: false,
        message: 'Código inválido, ya usado, expirado o no corresponde a este email/rol' 
      });
    }

    res.json({
      valid: true,
      message: 'Código válido',
      rol: codigoVerificacion.rol
    });
  } catch (err) {
    console.error('❌ Error validando código:', err);
    res.status(500).json({ 
      message: 'Error al validar código',
      error: err.message 
    });
  }
});

// ❌ ELIMINAR CÓDIGO (solo Admin)
router.delete('/:id',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const codigo = await CodigoVerificacion.findByIdAndDelete(req.params.id);

      if (!codigo) {
        return res.status(404).json({ message: 'Código no encontrado' });
      }

      console.log(`🗑️ Código eliminado: ${codigo.codigo}`);

      res.json({ 
        message: 'Código eliminado correctamente'
      });
    } catch (err) {
      console.error('❌ Error eliminando código:', err);
      res.status(500).json({ 
        message: 'Error al eliminar código',
        error: err.message 
      });
    }
  }
);

module.exports = router;