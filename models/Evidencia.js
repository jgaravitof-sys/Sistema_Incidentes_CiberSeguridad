// models/Evidencia.js
const mongoose = require('mongoose');

const EvidenciaSchema = new mongoose.Schema({
  incidente: { type: mongoose.Schema.Types.ObjectId, ref: 'Incidente', required: true },
  nombreArchivo: { type: String },
  ruta: { type: String },
  tipo: { type: String },
  subidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Evidencia', EvidenciaSchema);
