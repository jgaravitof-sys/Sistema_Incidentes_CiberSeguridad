const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  rol: {
    type: String,
    enum: ['Administrador', 'Analista', 'Técnico', 'Cliente', 'Auditor'],
    default: 'Cliente'
  },
  activo: {
    type: Boolean,
    default: true
  },
  aprobado: {
    type: Boolean,
    default: false  // Por defecto NO aprobado
  },
  aprobadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  fechaAprobacion: {
    type: Date
  },
  motivoRechazo: {
    type: String
  },
  creadoEn: { 
    type: Date, 
    default: Date.now 
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para ocultar la contraseña en respuestas JSON
UsuarioSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Usuario', UsuarioSchema);