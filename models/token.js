// models/token.js
class Token {
  constructor(lexema, categoria, token, linea = 1) {
    this.lexema = lexema;
    this.categoria = categoria;
    this.token = token;
    this.linea = linea;
  }
}

module.exports = Token;