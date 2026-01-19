// middleware/auth.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// ✅ Verifica el token JWT y estado del usuario
const verifyToken = async (req, res, next) => {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    const user = await Usuario.findById(payload.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // ✅ Verificar que el usuario esté activo
    if (!user.activo) {
      return res.status(403).json({ 
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.' 
      });
    }

    // ✅ MODIFICADO: Los Administradores NO necesitan aprobación
    if (!user.aprobado && user.rol !== 'Administrador') {
      return res.status(403).json({ 
        message: 'Tu cuenta está pendiente de aprobación por un administrador.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Error en verifyToken:', err);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// ✅ Requiere rol específico
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` 
      });
    }
    
    next();
  };
};

// ✅ Middleware solo para admins
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  
  if (req.user.rol !== 'Administrador') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo administradores.' 
    });
  }
  
  next();
};

module.exports = { 
  verifyToken, 
  requireRole,
  requireAdmin 
};