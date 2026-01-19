// routes/usuarios.js - COMPLETO CON TODAS LAS RUTAS
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const { verifyToken, requireRole } = require('../middleware/auth');

// Funciones de email con manejo seguro de errores
let notificarUsuarioAprobado, notificarUsuarioRechazado;
try {
  const emailConfig = require('../config/email');
  notificarUsuarioAprobado = emailConfig.notificarUsuarioAprobado || (async () => ({ success: false, error: 'Email no configurado' }));
  notificarUsuarioRechazado = emailConfig.notificarUsuarioRechazado || (async () => ({ success: false, error: 'Email no configurado' }));
} catch (err) {
  console.log('⚠️ Módulo de email no configurado - Las notificaciones no se enviarán');
  notificarUsuarioAprobado = async () => ({ success: false, error: 'Email no configurado' });
  notificarUsuarioRechazado = async () => ({ success: false, error: 'Email no configurado' });
}

// ===============================
// 📋 LISTAR TODOS LOS USUARIOS
// ===============================
router.get('/',
  verifyToken,
  requireRole(['Administrador', 'Auditor']),
  async (req, res) => {
    try {
      const { estado } = req.query;
      const filter = {};
      
      // Filtrar por estado de aprobación
      if (estado === 'pendientes') {
        filter.aprobado = false;
      } else if (estado === 'aprobados') {
        filter.aprobado = true;
      }
      
      const usuarios = await Usuario.find(filter)
        .select('-password') // Excluir contraseña
        .sort({ fechaCreacion: -1 });
      
      console.log(`📋 Listando ${usuarios.length} usuarios con filtro: ${estado || 'todos'}`);
      
      res.json(usuarios);
    } catch (err) {
      console.error('❌ Error listando usuarios:', err);
      res.status(500).json({ 
        message: 'Error al listar usuarios',
        error: err.message 
      });
    }
  }
);

// ===============================
// 👨‍🔧 LISTAR SOLO TÉCNICOS (para asignación)
// ===============================
router.get('/tecnicos/disponibles',
  verifyToken,
  requireRole(['Administrador', 'Analista', 'Técnico']),
  async (req, res) => {
    try {
      const tecnicos = await Usuario.find({
        rol: { $in: ['Técnico', 'Analista', 'Administrador'] },
        aprobado: true,
        activo: true
      })
        .select('nombre email rol')
        .sort({ nombre: 1 });
      
      console.log(`👨‍🔧 Listando ${tecnicos.length} técnicos disponibles`);
      
      res.json(tecnicos);
    } catch (err) {
      console.error('❌ Error listando técnicos:', err);
      res.status(500).json({ 
        message: 'Error al listar técnicos',
        error: err.message 
      });
    }
  }
);

// ===============================
// 👤 OBTENER UN USUARIO POR ID
// ===============================
router.get('/:id',
  verifyToken,
  requireRole(['Administrador', 'Auditor']),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.params.id)
        .select('-password');
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      res.json(usuario);
    } catch (err) {
      console.error('❌ Error obteniendo usuario:', err);
      res.status(500).json({ 
        message: 'Error al obtener usuario',
        error: err.message 
      });
    }
  }
);

// ===============================
// ✏️ ACTUALIZAR USUARIO
// ===============================
router.put('/:id',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { nombre, email, rol, password } = req.body;
      const usuario = await Usuario.findById(req.params.id);
      
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Verificar si el email ya existe (si cambió)
      if (email && email !== usuario.email) {
        const emailExiste = await Usuario.findOne({ email });
        if (emailExiste) {
          return res.status(400).json({ message: 'El email ya está registrado' });
        }
      }
      
      // No permitir cambiar rol del último admin
      if (usuario.rol === 'Administrador' && rol && rol !== 'Administrador') {
        const adminCount = await Usuario.countDocuments({ rol: 'Administrador' });
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'No puedes cambiar el rol del último administrador' 
          });
        }
      }
      
      // Actualizar campos
      if (nombre) usuario.nombre = nombre;
      if (email) usuario.email = email;
      if (rol) usuario.rol = rol;
      if (password) usuario.password = password; // El pre-save hook lo hasheará
      
      await usuario.save();
      
      console.log(`✏️ Usuario actualizado: ${usuario.email}`);
      
      res.json({
        message: 'Usuario actualizado correctamente',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        }
      });
    } catch (err) {
      console.error('❌ Error actualizando usuario:', err);
      res.status(500).json({ 
        message: 'Error al actualizar usuario',
        error: err.message 
      });
    }
  }
);

// ===============================
// ✅ APROBAR USUARIO (solo Admin)
// ===============================
router.post('/:id/aprobar',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.params.id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (usuario.aprobado) {
        return res.status(400).json({ 
          message: 'Este usuario ya está aprobado' 
        });
      }

      usuario.aprobado = true;
      usuario.activo = true;
      usuario.aprobadoPor = req.user.id;
      usuario.fechaAprobacion = new Date();
      await usuario.save();

      console.log(`✅ Usuario aprobado: ${usuario.email} - ${usuario.rol}`);

      let emailEnviado = false;
      let errorEmail = null;
      
      try {
        const resultEmail = await notificarUsuarioAprobado(usuario.email, usuario.nombre, usuario.rol);
        emailEnviado = resultEmail.success;
        if (!emailEnviado) {
          errorEmail = resultEmail.error;
          console.warn('⚠️ No se pudo enviar email de aprobación:', errorEmail);
        } else {
          console.log('✅ Email de aprobación enviado correctamente');
        }
      } catch (emailErr) {
        errorEmail = emailErr.message;
        console.error('⚠️ Error enviando email de aprobación:', emailErr);
      }

      res.json({
        message: emailEnviado 
          ? 'Usuario aprobado correctamente. Se le ha notificado por email.' 
          : 'Usuario aprobado correctamente. (Email no enviado: ' + (errorEmail || 'Email no configurado') + ')',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          aprobado: true,
          activo: true
        },
        emailEnviado,
        avisoEmail: !emailEnviado ? 'El email de notificación no pudo ser enviado, pero el usuario fue aprobado exitosamente.' : null
      });
    } catch (err) {
      console.error('❌ Error aprobando usuario:', err);
      res.status(500).json({ 
        message: 'Error al aprobar usuario',
        error: err.message 
      });
    }
  }
);

// ===============================
// ❌ RECHAZAR USUARIO (solo Admin)
// ===============================
router.post('/:id/rechazar',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { motivo } = req.body;
      const usuario = await Usuario.findById(req.params.id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (usuario.aprobado) {
        return res.status(400).json({ 
          message: 'No puedes rechazar un usuario ya aprobado. Desactívalo en su lugar.' 
        });
      }

      const email = usuario.email;
      const nombre = usuario.nombre;
      const rol = usuario.rol;

      await Usuario.findByIdAndDelete(req.params.id);

      console.log(`❌ Usuario rechazado y eliminado: ${email} - ${rol}`);

      let emailEnviado = false;
      try {
        const resultEmail = await notificarUsuarioRechazado(email, nombre, rol, motivo || 'No especificado');
        emailEnviado = resultEmail.success;
        if (!emailEnviado) {
          console.warn('⚠️ No se pudo enviar email de rechazo');
        }
      } catch (emailErr) {
        console.error('⚠️ Error enviando email de rechazo:', emailErr);
      }

      res.json({
        message: emailEnviado 
          ? 'Usuario rechazado y eliminado correctamente. Se le ha notificado por email.' 
          : 'Usuario rechazado y eliminado correctamente.',
        usuario: { email, nombre, rol },
        emailEnviado
      });
    } catch (err) {
      console.error('❌ Error rechazando usuario:', err);
      res.status(500).json({ 
        message: 'Error al rechazar usuario',
        error: err.message 
      });
    }
  }
);

// ===============================
// 🔄 ACTIVAR/DESACTIVAR USUARIO
// ===============================
router.patch('/:id/toggle-activo',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.params.id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (!usuario.aprobado) {
        return res.status(400).json({ 
          message: 'No puedes activar/desactivar un usuario no aprobado' 
        });
      }

      if (usuario.rol === 'Administrador' && usuario.activo) {
        const adminCount = await Usuario.countDocuments({ 
          rol: 'Administrador', 
          activo: true 
        });
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'No puedes desactivar el último administrador del sistema' 
          });
        }
      }

      usuario.activo = !usuario.activo;
      await usuario.save();

      console.log(`🔄 Usuario ${usuario.activo ? 'activado' : 'desactivado'}: ${usuario.email}`);

      res.json({
        message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} correctamente`,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          activo: usuario.activo
        }
      });
    } catch (err) {
      console.error('❌ Error cambiando estado del usuario:', err);
      res.status(500).json({ 
        message: 'Error al cambiar estado del usuario',
        error: err.message 
      });
    }
  }
);

// ===============================
// 🔧 CAMBIAR ROL (solo Admin)
// ===============================
router.patch('/:id/cambiar-rol',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { nuevoRol } = req.body;
      const usuario = await Usuario.findById(req.params.id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const rolesValidos = ['Cliente', 'Técnico', 'Analista', 'Auditor', 'Administrador'];
      if (!rolesValidos.includes(nuevoRol)) {
        return res.status(400).json({ 
          message: 'Rol inválido',
          rolesPermitidos: rolesValidos
        });
      }

      if (usuario.rol === 'Administrador' && nuevoRol !== 'Administrador') {
        const adminCount = await Usuario.countDocuments({ rol: 'Administrador' });
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'No puedes cambiar el rol del último administrador' 
          });
        }
      }

      const rolAnterior = usuario.rol;
      usuario.rol = nuevoRol;
      await usuario.save();

      console.log(`🔧 Rol cambiado: ${usuario.email} - ${rolAnterior} → ${nuevoRol}`);

      res.json({
        message: 'Rol actualizado correctamente',
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rolAnterior,
          rolNuevo: nuevoRol
        }
      });
    } catch (err) {
      console.error('❌ Error cambiando rol:', err);
      res.status(500).json({ 
        message: 'Error al cambiar rol',
        error: err.message 
      });
    }
  }
);

// ===============================
// 🗑️ ELIMINAR USUARIO (solo Admin)
// ===============================
router.delete('/:id',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.params.id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (usuario.rol === 'Administrador') {
        const adminCount = await Usuario.countDocuments({ rol: 'Administrador' });
        
        if (adminCount <= 1) {
          return res.status(400).json({ 
            message: 'No puedes eliminar el último administrador del sistema' 
          });
        }
      }

      await Usuario.findByIdAndDelete(req.params.id);

      console.log(`🗑️ Usuario eliminado: ${usuario.email}`);

      res.json({
        message: 'Usuario eliminado correctamente',
        usuario: {
          nombre: usuario.nombre,
          email: usuario.email
        }
      });
    } catch (err) {
      console.error('❌ Error eliminando usuario:', err);
      res.status(500).json({ 
        message: 'Error al eliminar usuario',
        error: err.message 
      });
    }
  }
);

module.exports = router;