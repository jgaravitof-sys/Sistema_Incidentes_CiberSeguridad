// routes/reportes.js
const express = require('express');
const router = express.Router();
const Incidente = require('../models/Incidente');
const { verifyToken, requireRole } = require('../middleware/auth');
const auditoria = require('../middleware/auditoria');

router.get('/por-tipo-mes', verifyToken, auditoria('Reportes'), async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  try {
    const pipeline = [
      { $match: { fechaCreacion: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: { _id: { tipo: "$tipo", mes: { $month: "$fechaCreacion" } }, total: { $sum: 1 } } },
      { $group: { _id: '$_id.mes', tipos: { $push: { tipo: '$_id.tipo', total: '$total' } } } },
      { $sort: { _id: 1 } }
    ];
    const result = await Incidente.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error generando reporte' });
  }
});

module.exports = router;