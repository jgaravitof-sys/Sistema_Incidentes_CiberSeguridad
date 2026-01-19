const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const existe = await Usuario.findOne({ email: 'admin@ciberseguridad.com' });
    if (existe) {
      console.log('⚠️ Ya existe un administrador con ese correo.');
      return mongoose.connection.close();
    }

    // 👇 NO hash aquí, se encripta automáticamente en el modelo
    const admin = new Usuario({
      nombre: 'Administrador General',
      email: 'admin@ciberseguridad.com',
      password: 'admin123',
      rol: 'Administrador'
    });

    await admin.save();
    console.log('✅ Usuario administrador creado correctamente');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    mongoose.connection.close();
  }
})();
