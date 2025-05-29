const express = require('express');
const router = express.Router();
const parser = require('../controllers/parser');

router.post('/analizar-sintactico', (req, res) => {
  const { codigo } = req.body;
  const { arbol, erroresSintacticos } = parser.analizarCodigo(codigo);
  res.render('index', { resultado: null, arbol, erroresSintacticos });
});

module.exports = router;
