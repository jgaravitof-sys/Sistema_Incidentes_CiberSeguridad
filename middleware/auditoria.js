// middleware/auditoria.js
const Auditoria = require('../models/Auditoria');

const auditoria = (modulo) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let accion = determinarAccion(req);
        let detalles = generarDetalles(req, data);
        
        guardarAuditoria({
          usuario: req.user._id,
          accion,
          modulo,
          detalles,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizarBody(req.body)
          }
        }).catch(err => {
          console.error('❌ Error guardando auditoría:', err);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

function determinarAccion(req) {
  const { method, path } = req;
  
  if (path.includes('/incidentes')) {
    if (method === 'POST') return 'CREAR_INCIDENTE';
    if (method === 'GET') {
      if (path.match(/\/incidentes\/[a-f0-9]{24}$/)) return 'VER_INCIDENTE';
      return 'LISTAR_INCIDENTES';
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/estado')) return 'CAMBIAR_ESTADO_INCIDENTE';
      if (path.includes('/asignar')) return 'ASIGNAR_TECNICO';
      if (path.includes('/comentarios')) return 'AGREGAR_COMENTARIO';
      return 'MODIFICAR_INCIDENTE';
    }
    if (method === 'DELETE') return 'ELIMINAR_INCIDENTE';
  }
  
  if (path.includes('/usuarios')) {
    if (method === 'POST') return 'CREAR_USUARIO';
    if (method === 'GET') {
      if (path.match(/\/usuarios\/[a-f0-9]{24}$/)) return 'VER_USUARIO';
      return 'LISTAR_USUARIOS';
    }
    if (method === 'PUT' || method === 'PATCH') {
      if (path.includes('/aprobar')) return 'APROBAR_USUARIO';
      if (path.includes('/rechazar')) return 'RECHAZAR_USUARIO';
      return 'MODIFICAR_USUARIO';
    }
    if (method === 'DELETE') return 'ELIMINAR_USUARIO';
  }
  
  if (path.includes('/evidencias')) {
    if (method === 'POST') return 'SUBIR_EVIDENCIA';
    if (method === 'GET') return 'DESCARGAR_EVIDENCIA';
  }
  
  if (path.includes('/reportes')) return 'GENERAR_REPORTE';
  
  if (path.includes('/auditorias')) {
    if (path.includes('/export')) return 'EXPORTAR_AUDITORIAS';
    return 'VER_AUDITORIAS';
  }
  
  if (path.includes('/codigos')) {
    if (method === 'POST') return 'SOLICITAR_CODIGO';
    if (method === 'GET') return 'USAR_CODIGO';
  }
  
  if (path.includes('/login')) return 'LOGIN';
  if (path.includes('/logout')) return 'LOGOUT';
  
  if (method === 'GET') return 'LISTAR_INCIDENTES';
  
  console.warn(`⚠️ Acción no mapeada: ${method} ${path}`);
  return 'MODIFICAR_INCIDENTE';
}

function generarDetalles(req, responseData) {
  const { method, path, body } = req;
  let detalles = '';
  
  if (path.includes('/incidentes')) {
    if (method === 'POST' && body.tipo) {
      detalles = `Creó incidente: ${body.tipo} (${body.severidad})`;
    } else if (method === 'GET' && path.match(/\/incidentes\/[a-f0-9]{24}$/)) {
      detalles = `Consultó detalle de incidente`;
    } else if (method === 'GET') {
      detalles = `Listó incidentes`;
    } else if (path.includes('/estado') && body.estado) {
      detalles = `Cambió estado a: ${body.estado}`;
    } else if (path.includes('/asignar') && responseData?.incidente) {
      detalles = `Asignó técnico: ${responseData.incidente.tecnicoAsignado?.nombre || 'desconocido'}`;
    } else if (path.includes('/comentarios')) {
      detalles = `Agregó un comentario`;
    }
  }
  
  if (path.includes('/usuarios')) {
    if (method === 'POST' && body.nombre) {
      detalles = `Creó usuario: ${body.nombre} (${body.rol})`;
    } else if (method === 'GET' && path.match(/\/usuarios\/[a-f0-9]{24}$/)) {
      detalles = `Consultó detalle de usuario`;
    } else if (method === 'GET') {
      const filtro = req.query.estado || 'todos';
      detalles = `Listó usuarios (filtro: ${filtro})`;
    } else if (method === 'PUT' && body.nombre) {
      detalles = `Modificó usuario: ${body.nombre}`;
    } else if (method === 'DELETE') {
      detalles = `Eliminó usuario`;
    } else if (path.includes('/aprobar')) {
      detalles = `Aprobó usuario`;
    } else if (path.includes('/rechazar')) {
      detalles = `Rechazó usuario`;
    }
  }
  
  if (path.includes('/evidencias')) {
    if (method === 'POST') detalles = `Subió evidencia para incidente`;
    if (method === 'GET') detalles = `Descargó evidencia`;
  }
  
  if (path.includes('/reportes')) {
    detalles = `Generó reporte del sistema`;
  }
  
  if (path.includes('/auditorias')) {
    if (path.includes('/export')) {
      detalles = `Exportó auditorías a Excel`;
    } else {
      detalles = `Consultó auditorías del sistema`;
    }
  }
  
  return detalles || `${method} ${path}`;
}

function sanitizarBody(body) {
  if (!body || typeof body !== 'object') return body;
  
  const sanitizado = { ...body };
  delete sanitizado.password;
  delete sanitizado.token;
  delete sanitizado.refreshToken;
  
  return sanitizado;
}

async function guardarAuditoria(data) {
  try {
    const log = new Auditoria(data);
    await log.save();
    console.log(`📝 Auditoría registrada: ${data.accion} por usuario ${data.usuario}`);
  } catch (err) {
    console.error('❌ Error guardando auditoría:', err);
    throw err;
  }
}

async function registrarLoginFallido(email, ip, userAgent) {
  try {
    const log = new Auditoria({
      usuario: null,
      accion: 'LOGIN_FALLIDO',
      modulo: 'Autenticación',
      detalles: `Intento fallido de login: ${email}`,
      ip,
      userAgent,
      metadata: { email }
    });
    await log.save();
    console.log(`⚠️ Login fallido registrado: ${email}`);
  } catch (err) {
    console.error('❌ Error registrando login fallido:', err);
  }
}

async function registrarLogin(userId, email, ip, userAgent) {
  try {
    const log = new Auditoria({
      usuario: userId,
      accion: 'LOGIN',
      modulo: 'Autenticación',
      detalles: `Inicio de sesión exitoso: ${email}`,
      ip,
      userAgent,
      metadata: { email }
    });
    await log.save();
    console.log(`✅ Login exitoso registrado: ${email}`);
  } catch (err) {
    console.error('❌ Error registrando login:', err);
  }
}

module.exports = auditoria;
module.exports.registrarLoginFallido = registrarLoginFallido;
module.exports.registrarLogin = registrarLogin;
module.exports.guardarAuditoria = guardarAuditoria;