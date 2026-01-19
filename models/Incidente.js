// models/Incidente.js - SPRINT 2 y 3
const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  texto: { 
    type: String, 
    required: true 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  esInterno: {
    type: Boolean,
    default: false // true = solo visible para técnicos/admins
  }
});

const HistorialSchema = new mongoose.Schema({
  usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  accion: { 
    type: String, 
    required: true 
  }, // Ej: "Cambió estado de Abierto a En progreso"
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  detalles: {
    campoModificado: String,
    valorAnterior: String,
    valorNuevo: String
  }
});

const IncidenteSchema = new mongoose.Schema({
  tipo: { 
    type: String, 
    required: true 
  }, // ex: phishing, malware, ddos
  descripcion: { 
    type: String, 
    required: true 
  },
  severidad: { 
    type: String, 
    enum: ['Baja','Media','Alta'], 
    default: 'Media' 
  },
  estado: { 
    type: String, 
    enum: ['Abierto','En progreso','Cerrado'], 
    default: 'Abierto' 
  },
  fechaCreacion: { 
    type: Date, 
    default: Date.now 
  },
  fechaCierre: {
    type: Date
  },
  cliente: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  // ✅ SPRINT 2: Campo de asignación de técnico
  tecnicoAsignado: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario' 
  },
  fechaAsignacion: {
    type: Date
  },
  // Mantener compatibilidad con código existente
  responsable: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario' 
  },
  
  // ✅ SPRINT 3: Historial de cambios
  historial: [HistorialSchema],
  
  // ✅ SPRINT 3: Sistema de comentarios
  comentarios: [ComentarioSchema],
  
  evidencias: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Evidencia' 
  }],
  
  // ✅ Metadatos adicionales
  prioridad: {
    type: Number,
    default: 0 // 0=normal, 1=urgente
  },
  tags: [String],
  tiempoRespuesta: Number, // en minutos
  tiempoResolucion: Number // en minutos
});

// ✅ Middleware pre-save para actualizar tiempos
IncidenteSchema.pre('save', function(next) {
  // Si se cierra el incidente, calcular tiempo de resolución
  if (this.isModified('estado') && this.estado === 'Cerrado' && !this.fechaCierre) {
    this.fechaCierre = new Date();
    const minutosTranscurridos = Math.floor((this.fechaCierre - this.fechaCreacion) / (1000 * 60));
    this.tiempoResolucion = minutosTranscurridos;
  }
  
  // Si se asigna técnico por primera vez, guardar fecha
  if (this.isModified('tecnicoAsignado') && this.tecnicoAsignado && !this.fechaAsignacion) {
    this.fechaAsignacion = new Date();
    const minutosHastaAsignacion = Math.floor((this.fechaAsignacion - this.fechaCreacion) / (1000 * 60));
    this.tiempoRespuesta = minutosHastaAsignacion;
  }
  
  next();
});

// ✅ Método para agregar al historial
IncidenteSchema.methods.agregarHistorial = function(usuario, accion, detalles = {}) {
  this.historial.push({
    usuario,
    accion,
    detalles,
    fecha: new Date()
  });
};

// ✅ Método para agregar comentario
IncidenteSchema.methods.agregarComentario = function(usuario, texto, esInterno = false) {
  this.comentarios.push({
    usuario,
    texto,
    esInterno,
    fecha: new Date()
  });
};

// ✅ Índices para búsqueda rápida
IncidenteSchema.index({ tipo: 1, estado: 1 });
IncidenteSchema.index({ tecnicoAsignado: 1 });
IncidenteSchema.index({ cliente: 1 });
IncidenteSchema.index({ fechaCreacion: -1 });

module.exports = mongoose.model('Incidente', IncidenteSchema);