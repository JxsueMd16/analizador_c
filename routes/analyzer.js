// routes/analyzer.js
const express = require('express');
const router = express.Router();
const analyzer = require('../controllers/analyzer'); // Lexer
const parser = require('../controllers/parser');     // Parser

// Página inicial
router.get('/', (req, res) => {
  res.render('index', { resultado: null, arbol: null, erroresSintacticos: [] });
});

// Análisis Léxico
router.post('/analizar', (req, res) => {
  const { codigo } = req.body;
  const resultado = analyzer.analizarCodigo(codigo);
  res.render('index', { resultado, arbol: null, erroresSintacticos: [] });
});

// Análisis Sintáctico
router.post('/analizar-sintactico', (req, res) => {
  const { codigo } = req.body;
  const resultadoLexer = analyzer.analizarCodigo(codigo);
  const tokens = resultadoLexer.tokens; // Extraer el array de tokens
  console.log('TOKENS PARA EL PARSER:', tokens);
  const { arbol, erroresSintacticos } = parser.analizarTokens(tokens);
  console.log('ÁRBOL PARA TREANT:', JSON.stringify(arbol, null, 2));
  res.render('index', { resultado: null, arbol, erroresSintacticos });

});



// Documentación
router.get('/documentacion', (req, res) => {
  res.render('documentacion', { resultado: null, arbol: null, erroresSintacticos: [] });
});

module.exports = router;
