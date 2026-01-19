// routes/auditorias.js
const express = require('express');
const router = express.Router();
const Auditoria = require('../models/Auditoria');
const Usuario = require('../models/Usuario');
const { verifyToken, requireRole } = require('../middleware/auth');

// ===============================
// 📋 LISTAR AUDITORÍAS CON FILTROS
// ===============================
router.get('/',
  verifyToken,
  requireRole(['Administrador', 'Auditor']),
  async (req, res) => {
    try {
      const { accion, usuario, desde, hasta, ip, limite = 100 } = req.query;
      
      let filtro = {};
      
      // Filtro por acción
      if (accion) {
        filtro.accion = accion;
      }
      
      // Filtro por usuario
      if (usuario) {
        filtro.usuario = usuario;
      }
      
      // Filtro por IP
      if (ip) {
        filtro.ip = ip;
      }
      
      // Filtro por rango de fechas
      if (desde || hasta) {
        filtro.fecha = {};
        if (desde) filtro.fecha.$gte = new Date(desde);
        if (hasta) {
          const fechaHasta = new Date(hasta);
          fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
          filtro.fecha.$lte = fechaHasta;
        }
      }
      
      // Obtener auditorías
      const logs = await Auditoria.find(filtro)
        .populate('usuario', 'nombre email rol')
        .sort({ fecha: -1 })
        .limit(parseInt(limite));
      
      // Calcular estadísticas
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const [total, logsHoy, usuariosActivos] = await Promise.all([
        Auditoria.countDocuments(filtro),
        Auditoria.countDocuments({ ...filtro, fecha: { $gte: hoy } }),
        Auditoria.distinct('usuario', filtro).then(ids => ids.length)
      ]);
      
      res.json({
        logs,
        stats: {
          total,
          hoy: logsHoy,
          usuariosActivos
        }
      });
    } catch (err) {
      console.error('❌ Error obteniendo auditorías:', err);
      res.status(500).json({ 
        message: 'Error al obtener auditorías',
        error: err.message 
      });
    }
  }
);

// ===============================
// 👥 LISTAR USUARIOS PARA FILTRO
// ===============================
router.get('/usuarios',
  verifyToken,
  requireRole(['Administrador', 'Auditor']),
  async (req, res) => {
    try {
      const usuarios = await Usuario.find({ aprobado: true, activo: true })
        .select('nombre email rol')
        .sort({ nombre: 1 });
      
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
// 📊 ESTADÍSTICAS DE AUDITORÍA
// ===============================
router.get('/stats',
  verifyToken,
  requireRole(['Administrador', 'Auditor']),
  async (req, res) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      
      const [
        totalLogs,
        logsHoy,
        logsSemana,
        accionesFrecuentes,
        usuariosActivos
      ] = await Promise.all([
        Auditoria.countDocuments(),
        Auditoria.countDocuments({ fecha: { $gte: hoy } }),
        Auditoria.countDocuments({ fecha: { $gte: semanaAtras } }),
        Auditoria.aggregate([
          { $group: { _id: '$accion', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]),
        Auditoria.distinct('usuario')
      ]);
      
      res.json({
        total: totalLogs,
        hoy: logsHoy,
        semana: logsSemana,
        accionesFrecuentes,
        usuariosActivos: usuariosActivos.length
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
// 🗑️ LIMPIAR AUDITORÍAS ANTIGUAS (Admin only)
// ===============================
router.delete('/limpiar',
  verifyToken,
  requireRole(['Administrador']),
  async (req, res) => {
    try {
      const { diasAntiguedad = 90 } = req.body;
      
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
      
      const result = await Auditoria.deleteMany({
        fecha: { $lt: fechaLimite }
      });
      
      console.log(`🗑️ Auditorías antiguas eliminadas: ${result.deletedCount}`);
      
      res.json({
        message: `Se eliminaron ${result.deletedCount} registros de auditoría`,
        eliminados: result.deletedCount,
        fechaLimite
      });
    } catch (err) {
      console.error('❌ Error limpiando auditorías:', err);
      res.status(500).json({ 
        message: 'Error al limpiar auditorías',
        error: err.message 
      });
    }
  }
);

module.exports = router;