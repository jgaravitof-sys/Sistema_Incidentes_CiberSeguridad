// aprobarAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

const aprobarAdmin = async () => {
  try {
    // Usar la conexión de tu .env (MongoDB Atlas)
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('❌ No se encontró MONGO_URI en el archivo .env');
      console.log('💡 Asegúrate de tener el archivo .env con tu conexión de MongoDB Atlas');
      process.exit(1);
    }

    console.log('🔗 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar al admin
    const admin = await Usuario.findOne({ email: 'admin@ciberseguridad.com' });

    if (!admin) {
      console.log('❌ No se encontró el usuario admin@ciberseguridad.com');
      console.log('💡 Verifica que el email sea correcto');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('📋 Admin encontrado:', {
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol,
      aprobado: admin.aprobado,
      activo: admin.activo
    });

    // Aprobar al admin
    admin.aprobado = true;
    admin.activo = true;
    admin.fechaAprobacion = new Date();
    await admin.save();

    console.log('✅ Admin aprobado exitosamente');
    console.log('🔐 Ahora puedes hacer login con: admin@ciberseguridad.com');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('👋 Conexión cerrada');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

aprobarAdmin();