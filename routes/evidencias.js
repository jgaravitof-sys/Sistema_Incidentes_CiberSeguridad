// routes/evidencias.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Evidencia = require('../models/Evidencia');
const Incidente = require('../models/Incidente');
const { verifyToken } = require('../middleware/auth');
const auditoria = require('../middleware/auditoria');

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

router.post('/:incidenteId', verifyToken, upload.single('file'), auditoria('Evidencias'), async (req, res) => {
  try {
    const incidenteId = req.params.incidenteId;
    const incidente = await Incidente.findById(incidenteId);
    if (!incidente) return res.status(404).json({ message: 'Incidente no encontrado' });
    const file = req.file;
    const evidencia = new Evidencia({
      incidente: incidenteId,
      nombreArchivo: file.originalname,
      ruta: file.path,
      tipo: file.mimetype,
      subidoPor: req.user._id
    });
    await evidencia.save();
    incidente.evidencias.push(evidencia._id);
    await incidente.save();
    res.status(201).json(evidencia);
  } catch (err) {
    res.status(500).json({ message: 'Error subiendo evidencia', error: err.message });
  }
});

module.exports = router;
