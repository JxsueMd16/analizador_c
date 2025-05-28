const lexer = require('./lexer');

exports.analizarCodigo = (codigo) => {
  const tokens = lexer.analizar(codigo);
  return tokens; // Devuelve el array de tokens al EJS
};
