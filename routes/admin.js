// routes/admin.js
const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const { verifyToken, requireRole } = require('../middleware/auth');

// Helper para verificar si es admin (simplifica el código)
const requireAdmin = requireRole(['Administrador']);

// ===============================
// 📊 ESTADÍSTICAS DEL SISTEMA
// ===============================
router.get('/stats',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const [
        totalUsuarios,
        usuariosPendientes,
        usuariosActivos,
        codigosTotales,
        codigosUsados
      ] = await Promise.all([
        Usuario.countDocuments(),
        Usuario.countDocuments({ aprobado: false }),
        Usuario.countDocuments({ aprobado: true, activo: true }),
        CodigoVerificacion.countDocuments(),
        CodigoVerificacion.countDocuments({ usado: true })
      ]);

      res.json({
        usuarios: {
          total: totalUsuarios,
          pendientes: usuariosPendientes,
          activos: usuariosActivos,
          inactivos: totalUsuarios - usuariosActivos - usuariosPendientes
        },
        codigos: {
          total: codigosTotales,
          usados: codigosUsados,
          disponibles: codigosTotales - codigosUsados
        }
      });
    } catch (err) {
      console.error('❌ Error obteniendo estadísticas:', err);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas',
        error: err.message 
      });
    }
  }
);

// ===============================
// 👥 LISTAR USUARIOS CON FILTROS
// ===============================
router.get('/usuarios',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { estado, busqueda } = req.query;
      
      let filtro = {};

      // Aplicar filtros según el estado
      switch(estado) {
        case 'pendientes':
          filtro.aprobado = false;
          break;
        case 'aprobados':
          filtro.aprobado = true;
          break;
        case 'activos':
          filtro.aprobado = true;
          filtro.activo = true;
          break;
        case 'inactivos':
          filtro.aprobado = true;
          filtro.activo = false;
          break;
        case 'todos':
          // Sin filtro adicional
          break;
        default:
          filtro.aprobado = false; // Por defecto mostrar pendientes
      }

      // Aplicar búsqueda si existe
      if (busqueda && busqueda.trim() !== '') {
        filtro.$or = [
          { nombre: { $regex: busqueda, $options: 'i' } },
          { email: { $regex: busqueda, $options: 'i' } }
        ];
      }

      const usuarios = await Usuario.find(filtro)
        .select('-password')
        .populate('aprobadoPor', 'nombre email')
        .sort({ creadoEn: -1 });

      console.log(`📋 Listando ${usuarios.length} usuarios con filtro:`, estado);

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
// 👤 OBTENER UN USUARIO POR ID
// ===============================
router.get('/usuarios/:id',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const usuario = await Usuario.findById(req.params.id)
        .select('-password')
        .populate('aprobadoPor', 'nombre email');

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

module.exports = router;