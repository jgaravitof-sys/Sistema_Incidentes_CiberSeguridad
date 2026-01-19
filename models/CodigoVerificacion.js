// models/CodigoVerificacion.js
const mongoose = require('mongoose');

const CodigoVerificacionSchema = new mongoose.Schema({
  codigo: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  nombreSolicitante: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['Analista', 'Técnico', 'Auditor'],
    required: true
  },
  usado: {
    type: Boolean,
    default: false
  },
  usadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaExpiracion: {
    type: Date,
    required: true
  },
  fechaUso: {
    type: Date
  },
  emailEnviado: {
    type: Boolean,
    default: false
  }
});

// Índices para búsquedas rápidas
CodigoVerificacionSchema.index({ codigo: 1, email: 1 });
CodigoVerificacionSchema.index({ fechaExpiracion: 1 });
CodigoVerificacionSchema.index({ estado: 1 });

module.exports = mongoose.model('CodigoVerificacion', CodigoVerificacionSchema);