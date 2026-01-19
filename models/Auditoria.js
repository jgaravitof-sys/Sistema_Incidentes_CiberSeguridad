// models/Auditoria.js
const mongoose = require('mongoose');

const AuditoriaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false
  },
  accion: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'LOGIN_FALLIDO',
      'CREAR_INCIDENTE',
      'MODIFICAR_INCIDENTE',
      'ELIMINAR_INCIDENTE',
      'CAMBIAR_ESTADO_INCIDENTE',
      'ASIGNAR_TECNICO',
      'AGREGAR_COMENTARIO',
      'LISTAR_INCIDENTES',
      'VER_INCIDENTE',
      'CREAR_USUARIO',
      'MODIFICAR_USUARIO',
      'ELIMINAR_USUARIO',
      'APROBAR_USUARIO',
      'RECHAZAR_USUARIO',
      'LISTAR_USUARIOS',
      'VER_USUARIO',
      'SUBIR_EVIDENCIA',
      'DESCARGAR_EVIDENCIA',
      'GENERAR_REPORTE',
      'EXPORTAR_DATOS',
      'VER_AUDITORIAS',
      'EXPORTAR_AUDITORIAS',
      'SOLICITAR_CODIGO',
      'USAR_CODIGO'
    ]
  },
  modulo: {
    type: String,
    required: true
  },
  detalles: {
    type: String
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
});

AuditoriaSchema.index({ usuario: 1, fecha: -1 });
AuditoriaSchema.index({ accion: 1, fecha: -1 });
AuditoriaSchema.index({ modulo: 1 });
AuditoriaSchema.index({ fecha: -1 });
AuditoriaSchema.index({ fecha: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('Auditoria', AuditoriaSchema);