// routes/incidentes.js - CORREGIDO AL 100%
const express = require('express');
const router = express.Router();
const Incidente = require('../models/Incidente');
const Usuario = require('../models/Usuario');
const { verifyToken, requireRole } = require('../middleware/auth');
const auditoriaMiddleware = require('../middleware/auditoria');
const { body, query, validationResult } = require('express-validator');
const { enviarNotificacionAsignacion, enviarNotificacionCambioEstado } = require('../config/email');

router.post('/',
  verifyToken,
  [
    body('tipo').isString().notEmpty(),
    body('descripcion').isString().notEmpty(),
    body('severidad').isIn(['Baja','Media','Alta'])
  ],
  auditoriaMiddleware('Gestión de Incidentes'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { tipo, descripcion, severidad, tags } = req.body;
      const inc = new Incidente({ 
        tipo, 
        descripcion, 
        severidad, 
        cliente: req.user._id,
        tags: tags || []
      });
      
      inc.agregarHistorial(req.user._id, 'Incidente creado', {
        campoModificado: 'estado',
        valorNuevo: 'Abierto'
      });
      
      await inc.save();
      await inc.populate('cliente', 'nombre email');
      
      res.status(201).json(inc);
    } catch (err) {
      console.error('Error creando incidente:', err);
      res.status(500).json({ message: 'Error al crear incidente' });
    }
  }
);

router.get('/buscar',
  verifyToken,
  async (req, res) => {
    try {
      const { 
        q, tipo, estado, severidad, tecnico, cliente, desde, hasta, tags,
        page = 1, limit = 50
      } = req.query;
      
      const filter = {};
      
      if (q) {
        filter.$or = [
          { tipo: new RegExp(q, 'i') },
          { descripcion: new RegExp(q, 'i') }
        ];
      }
      
      if (tipo) filter.tipo = new RegExp(tipo, 'i');
      if (estado) filter.estado = estado;
      if (severidad) filter.severidad = severidad;
      if (tecnico) filter.tecnicoAsignado = tecnico;
      if (cliente) filter.cliente = cliente;
      if (tags) filter.tags = { $in: tags.split(',') };
      
      if (desde || hasta) {
        filter.fechaCreacion = {};
        if (desde) filter.fechaCreacion.$gte = new Date(desde);
        if (hasta) filter.fechaCreacion.$lte = new Date(hasta);
      }
      
      const total = await Incidente.countDocuments(filter);
      const incidents = await Incidente.find(filter)
        .populate('cliente', 'nombre email')
        .populate('tecnicoAsignado', 'nombre email rol')
        .populate('historial.usuario', 'nombre')
        .populate('comentarios.usuario', 'nombre rol')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ fechaCreacion: -1 });
      
      res.json({
        incidentes: incidents,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      });
    } catch (err) {
      console.error('Error en búsqueda:', err);
      res.status(500).json({ message: 'Error en búsqueda' });
    }
  }
);

router.get('/',
  verifyToken,
  [
    query('estado').optional().isIn(['Abierto','En progreso','Cerrado']),
    query('tipo').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 500 })
  ],
  auditoriaMiddleware('Gestión de Incidentes'),
  async (req, res) => {
    const { estado, tipo, desde, hasta, misTareas, page = 1, limit = 50 } = req.query;
    const filter = {};
    
    if (estado) filter.estado = estado;
    if (tipo) filter.tipo = tipo;
    
    if (misTareas === 'true') {
      filter.tecnicoAsignado = req.user._id;
    }
    
    if (desde || hasta) filter.fechaCreacion = {};
    if (desde) filter.fechaCreacion.$gte = new Date(desde);
    if (hasta) filter.fechaCreacion.$lte = new Date(hasta);
    
    try {
      const incidents = await Incidente.find(filter)
        .populate('cliente', 'nombre email')
        .populate('tecnicoAsignado', 'nombre email rol')
        .populate('responsable', 'nombre email')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ fechaCreacion: -1 });
      
      res.json(incidents);
    } catch (err) {
      console.error('Error listando incidentes:', err);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

router.get('/:id',
  verifyToken,
  async (req, res) => {
    try {
      const incidente = await Incidente.findById(req.params.id)
        .populate('cliente', 'nombre email')
        .populate('tecnicoAsignado', 'nombre email rol')
        .populate('responsable', 'nombre email')
        .populate('historial.usuario', 'nombre rol')
        .populate('comentarios.usuario', 'nombre rol');
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      res.json(incidente);
    } catch (err) {
      console.error('Error obteniendo incidente:', err);
      res.status(500).json({ message: 'Error al obtener incidente' });
    }
  }
);

router.patch('/:id/asignar',
  verifyToken,
  requireRole(['Administrador', 'Analista']),
  [
    body('tecnicoId').isMongoId()
  ],
  auditoriaMiddleware('Asignación de Técnico'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { tecnicoId } = req.body;
      const incidente = await Incidente.findById(req.params.id);
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      const tecnico = await Usuario.findById(tecnicoId);
      if (!tecnico) {
        return res.status(404).json({ message: 'Técnico no encontrado' });
      }
      
      if (!['Técnico', 'Analista', 'Administrador'].includes(tecnico.rol)) {
        return res.status(400).json({ message: 'El usuario debe ser Técnico, Analista o Administrador' });
      }
      
      const tecnicoAnterior = incidente.tecnicoAsignado;
      incidente.tecnicoAsignado = tecnicoId;
      incidente.responsable = tecnicoId;
      
      const accion = tecnicoAnterior 
        ? `Reasignado a ${tecnico.nombre}`
        : `Asignado a ${tecnico.nombre}`;
      
      incidente.agregarHistorial(req.user._id, accion, {
        campoModificado: 'tecnicoAsignado',
        valorAnterior: tecnicoAnterior ? tecnicoAnterior.toString() : 'Sin asignar',
        valorNuevo: tecnicoId
      });
      
      await incidente.save();
      
      try {
        await enviarNotificacionAsignacion(
          tecnico.email,
          tecnico.nombre,
          incidente.tipo,
          incidente.descripcion,
          incidente.severidad,
          incidente._id
        );
      } catch (emailErr) {
        console.error('Error enviando email de asignación:', emailErr);
      }
      
      const incidenteActualizado = await Incidente.findById(req.params.id)
        .populate('tecnicoAsignado', 'nombre email rol')
        .populate('cliente', 'nombre email');
      
      console.log(`✅ Técnico asignado: ${tecnico.nombre} → Incidente ${req.params.id}`);
      
      res.json({ 
        message: 'Técnico asignado correctamente',
        incidente: incidenteActualizado
      });
    } catch (err) {
      console.error('Error asignando técnico:', err);
      res.status(500).json({ message: 'Error al asignar técnico' });
    }
  }
);

router.patch('/:id/estado',
  verifyToken,
  [
    body('estado').isIn(['Abierto','En progreso','Cerrado'])
  ],
  auditoriaMiddleware('Cambio de Estado'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { estado } = req.body;
      const incidente = await Incidente.findById(req.params.id)
        .populate('tecnicoAsignado', 'nombre email')
        .populate('cliente', 'nombre email');
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      const estadoAnterior = incidente.estado;
      incidente.estado = estado;
      
      incidente.agregarHistorial(req.user._id, `Cambió estado de ${estadoAnterior} a ${estado}`, {
        campoModificado: 'estado',
        valorAnterior: estadoAnterior,
        valorNuevo: estado
      });
      
      await incidente.save();
      
      if (incidente.tecnicoAsignado && incidente.tecnicoAsignado._id.toString() !== req.user._id.toString()) {
        try {
          await enviarNotificacionCambioEstado(
            incidente.tecnicoAsignado.email,
            incidente.tecnicoAsignado.nombre,
            incidente.tipo,
            estadoAnterior,
            estado,
            req.user.nombre,
            incidente._id
          );
        } catch (emailErr) {
          console.error('Error enviando notificación de cambio de estado:', emailErr);
        }
      }
      
      console.log(`✅ Estado actualizado: ${estadoAnterior} → ${estado} (Incidente: ${req.params.id})`);
      
      res.json({ 
        message: 'Estado actualizado correctamente',
        incidente,
        cambio: {
          anterior: estadoAnterior,
          nuevo: estado
        }
      });
    } catch (err) {
      console.error('Error actualizando estado:', err);
      res.status(500).json({ message: 'Error al actualizar estado' });
    }
  }
);

router.post('/:id/comentarios',
  verifyToken,
  [
    body('texto').isString().notEmpty().isLength({ min: 1, max: 2000 }),
    body('esInterno').optional().isBoolean()
  ],
  auditoriaMiddleware('Comentario en Incidente'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { texto, esInterno = false } = req.body;
      const incidente = await Incidente.findById(req.params.id);
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      const puedeHacerInterno = ['Administrador', 'Analista', 'Técnico', 'Auditor'].includes(req.user.rol);
      const esInternoFinal = esInterno && puedeHacerInterno;
      
      incidente.agregarComentario(req.user._id, texto, esInternoFinal);
      
      incidente.agregarHistorial(req.user._id, 'Agregó un comentario', {
        campoModificado: 'comentarios'
      });
      
      await incidente.save();
      
      const incidenteActualizado = await Incidente.findById(req.params.id)
        .populate('comentarios.usuario', 'nombre rol');
      
      res.json({
        message: 'Comentario agregado correctamente',
        comentarios: incidenteActualizado.comentarios
      });
    } catch (err) {
      console.error('Error agregando comentario:', err);
      res.status(500).json({ message: 'Error al agregar comentario' });
    }
  }
);

router.get('/:id/historial',
  verifyToken,
  async (req, res) => {
    try {
      const incidente = await Incidente.findById(req.params.id)
        .populate('historial.usuario', 'nombre rol')
        .select('historial');
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      res.json(incidente.historial);
    } catch (err) {
      console.error('Error obteniendo historial:', err);
      res.status(500).json({ message: 'Error al obtener historial' });
    }
  }
);

router.put('/:id',
  verifyToken,
  [
    body('tipo').optional().isString(),
    body('descripcion').optional().isString(),
    body('severidad').optional().isIn(['Baja','Media','Alta']),
    body('estado').optional().isIn(['Abierto','En progreso','Cerrado'])
  ],
  auditoriaMiddleware('Actualización de Incidente'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    try {
      const { tipo, descripcion, severidad, estado, tags } = req.body;
      const incidente = await Incidente.findById(req.params.id);
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      const cambios = [];
      
      if (tipo && tipo !== incidente.tipo) {
        cambios.push({ campo: 'tipo', anterior: incidente.tipo, nuevo: tipo });
        incidente.tipo = tipo;
      }
      
      if (descripcion && descripcion !== incidente.descripcion) {
        incidente.descripcion = descripcion;
        cambios.push({ campo: 'descripcion' });
      }
      
      if (severidad && severidad !== incidente.severidad) {
        cambios.push({ campo: 'severidad', anterior: incidente.severidad, nuevo: severidad });
        incidente.severidad = severidad;
      }
      
      if (estado && estado !== incidente.estado) {
        cambios.push({ campo: 'estado', anterior: incidente.estado, nuevo: estado });
        incidente.estado = estado;
      }
      
      if (tags) {
        incidente.tags = tags;
      }
      
      if (cambios.length > 0) {
        const descripcionCambios = cambios.map(c => 
          c.anterior ? `${c.campo}: ${c.anterior} → ${c.nuevo}` : `Modificó ${c.campo}`
        ).join(', ');
        
        incidente.agregarHistorial(req.user._id, `Actualizó incidente: ${descripcionCambios}`);
      }
      
      await incidente.save();
      
      const incidenteActualizado = await Incidente.findById(req.params.id)
        .populate('cliente', 'nombre email')
        .populate('tecnicoAsignado', 'nombre email rol');
      
      console.log(`✅ Incidente actualizado: ${req.params.id}`);
      
      res.json({ 
        message: 'Incidente actualizado correctamente',
        incidente: incidenteActualizado
      });
    } catch (err) {
      console.error('Error actualizando incidente:', err);
      res.status(500).json({ message: 'Error al actualizar incidente' });
    }
  }
);

router.delete('/:id',
  verifyToken,
  requireRole(['Administrador']),
  auditoriaMiddleware('Eliminación de Incidente'),
  async (req, res) => {
    try {
      const incidente = await Incidente.findByIdAndDelete(req.params.id);
      
      if (!incidente) {
        return res.status(404).json({ message: 'Incidente no encontrado' });
      }
      
      console.log(`✅ Incidente eliminado: ${req.params.id}`);
      
      res.json({ 
        message: 'Incidente eliminado correctamente',
        incidente
      });
    } catch (err) {
      console.error('Error eliminando incidente:', err);
      res.status(500).json({ message: 'Error al eliminar incidente' });
    }
  }
);

router.get('/reportes/estadisticas',
  verifyToken,
  auditoriaMiddleware('Estadísticas'),
  async (req, res) => {
    try {
      const { tecnico, desde, hasta } = req.query;
      const filter = {};
      
      if (tecnico) filter.tecnicoAsignado = tecnico;
      if (desde || hasta) {
        filter.fechaCreacion = {};
        if (desde) filter.fechaCreacion.$gte = new Date(desde);
        if (hasta) filter.fechaCreacion.$lte = new Date(hasta);
      }
      
      const [
        porEstado,
        porSeveridad,
        porTecnico,
        tiemposPromedio,
        totalIncidentes
      ] = await Promise.all([
        Incidente.aggregate([
          { $match: filter },
          { $group: { _id: "$estado", total: { $sum: 1 } } }
        ]),
        Incidente.aggregate([
          { $match: filter },
          { $group: { _id: "$severidad", total: { $sum: 1 } } }
        ]),
        Incidente.aggregate([
          { $match: { ...filter, tecnicoAsignado: { $exists: true } } },
          { $group: { _id: "$tecnicoAsignado", total: { $sum: 1 } } },
         { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'tecnico' } },
          { $unwind: '$tecnico' },
          { $project: { nombre: '$tecnico.nombre', total: 1 } }
        ]),
        Incidente.aggregate([
          { $match: { ...filter, tiempoResolucion: { $exists: true } } },
          { $group: {
            _id: null,
            promedioRespuesta: { $avg: '$tiempoRespuesta' },
            promedioResolucion: { $avg: '$tiempoResolucion' }
          }}
        ]),
        Incidente.countDocuments(filter)
      ]);
      
      res.json({
        total: totalIncidentes,
        porEstado,
        porSeveridad,
        porTecnico,
        tiemposPromedio: tiemposPromedio[0] || { promedioRespuesta: 0, promedioResolucion: 0 }
      });
    } catch (err) {
      console.error('Error generando estadísticas:', err);
      res.status(500).json({ message: 'Error generando estadísticas' });
    }
  }
);

router.get('/reportes/summary', 
  verifyToken, 
  auditoriaMiddleware('Reportes'), 
  async (req, res) => {
    try {
      const byEstado = await Incidente.aggregate([
        { $group: { _id: "$estado", total: { $sum: 1 } } }
      ]);
      const bySeveridad = await Incidente.aggregate([
        { $group: { _id: "$severidad", total: { $sum: 1 } } }
      ]);
      res.json({ byEstado, bySeveridad });
    } catch (err) {
      res.status(500).json({ message: 'Error generando reportes' });
    }
  }
);

module.exports = router;