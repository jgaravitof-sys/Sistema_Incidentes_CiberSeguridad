// config/db.js
const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    if (!uri) throw new Error('MONGODB_URI no está definido en .env');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error al conectar MongoDB:', err.message || err);
    process.exit(1);
  }
};

module.exports = connectDB;
