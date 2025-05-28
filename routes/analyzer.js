const express = require('express');
const router = express.Router();
const analyzer = require('../controllers/analyzer');

router.get('/', (req, res) => {
  res.render('index', { resultado: null });
});

router.post('/analizar', (req, res) => {
  const { codigo } = req.body;
  const resultado = analyzer.analizarCodigo(codigo);
  res.render('index', { resultado });
});

module.exports = router;
  