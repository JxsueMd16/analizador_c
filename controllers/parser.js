const NodoArbol = require('../models/tree');

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
    this.errores = [];
  }

  analizar() {
    const raiz = new NodoArbol("Programa");
    while (this.verToken()) {
      const t = this.verToken();
      if (t.categoria === 'Preprocesador') {
        raiz.agregarHijo(this.Preprocesador());
      } else if (t.categoria === 'Palabra clave' && ['int', 'float', 'char', 'void'].includes(t.lexema)) {
        raiz.agregarHijo(this.DeclaracionOFuncion());
      } else {
        this.error(`Estructura no reconocida en programa`);
        this.siguiente();
      }
    }
    return { arbol: this.generarTreant(raiz), erroresSintacticos: this.errores };
  }

  generarTreant(nodo) {
    if (!nodo) return null;
    const hijos = nodo.hijos.map(h => this.generarTreant(h)).filter(h => h !== null);
    const estructura = { text: { name: nodo.nombre }, HTMLclass: "nodo-treant" };
    if (hijos.length > 0) estructura.children = hijos;
    return estructura;
  }

  Preprocesador() {
  const nodo = new NodoArbol("Preprocesador");
  const token = this.match('Preprocesador');
  if (token) nodo.agregarHijo(new NodoArbol(token.lexema));

  // Aquí creamos el nodo intermedio "Biblioteca"
  const nodoBiblioteca = new NodoArbol("Biblioteca");
  const archivo = this.matchUnaDe(['Archivo de biblioteca', 'Cadena de texto']);
  if (archivo) {
    nodoBiblioteca.agregarHijo(new NodoArbol(archivo.lexema));
    nodo.agregarHijo(nodoBiblioteca); // Lo añadimos como hijo del Preprocesador
  } else {
    this.error("Falta archivo de biblioteca en #include");
  }

  return nodo;
}


  DeclaracionOFuncion() {
    const nodo = new NodoArbol("Declaración/Función");
    const tipo = this.match('Palabra clave');
    if (tipo) nodo.agregarHijo(new NodoArbol(tipo.lexema));
    const id = this.match('Identificador');
    if (id) nodo.agregarHijo(new NodoArbol(id.lexema));
    if (this.verLexema('(')) {
      nodo.agregarHijo(this.Funcion());
    } else {
      nodo.agregarHijo(this.DeclaracionVariable());
    }
    return nodo;
  }

  Funcion() {
    const nodo = new NodoArbol("Función");
    this.matchLexema('(');
    this.Parametros(nodo);
    this.matchLexema(')');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    return nodo;
  }

  Parametros(nodoPadre) {
    const nodo = new NodoArbol("Parámetros");
    while (this.verToken() && this.verToken().lexema !== ')') {
      const tipo = this.match('Palabra clave');
      if (!tipo) break;
      nodo.agregarHijo(new NodoArbol(tipo.lexema));
      const id = this.match('Identificador');
      if (id) nodo.agregarHijo(new NodoArbol(id.lexema));
      if (this.verLexema(',')) this.matchLexema(',');
      else break;
    }
    nodoPadre.agregarHijo(nodo);
  }

  CuerpoFuncion(nodoPadre) {
    while (this.verToken() && this.verToken().lexema !== '}') {
      const t = this.verToken();
      if (t.lexema === 'return') nodoPadre.agregarHijo(this.Return());
      else if (t.lexema === 'if') nodoPadre.agregarHijo(this.If());
      else if (t.lexema === 'for') nodoPadre.agregarHijo(this.For());
      else if (t.lexema === 'while') nodoPadre.agregarHijo(this.While());
      else if (t.lexema === 'do') nodoPadre.agregarHijo(this.DoWhile());
      else if (t.lexema === 'switch') nodoPadre.agregarHijo(this.Switch());
      else if (['break', 'continue'].includes(t.lexema)) nodoPadre.agregarHijo(this.InstruccionSimple());
      else if (['printf', 'scanf', 'getch'].includes(t.lexema)) nodoPadre.agregarHijo(this.LlamadaIO());
      else if (t.categoria === 'Palabra clave' && ['int', 'float', 'char'].includes(t.lexema)) nodoPadre.agregarHijo(this.DeclaracionVariable());
      else if (t.categoria === 'Identificador') {
        const siguiente = this.tokens[this.index + 1];
        if (siguiente && siguiente.lexema === '(') nodoPadre.agregarHijo(this.LlamadaGenerica());
        else nodoPadre.agregarHijo(this.Asignacion());
      } else {
        this.error(`Sentencia no reconocida: ${t.lexema}`);
        this.siguiente();
      }
    }
  }

  DeclaracionVariable() {
    const nodo = new NodoArbol("Declaración");
    const tipo = this.match('Palabra clave');
    nodo.agregarHijo(new NodoArbol(tipo.lexema));
    while (this.verToken() && this.verToken().lexema !== ';') {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
      if (this.verLexema(',')) this.matchLexema(',');
    }
    this.matchLexema(';');
    return nodo;
  }

  Asignacion() {
    const nodo = new NodoArbol("Asignación");
    nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    if (this.verLexema('=') || this.verCategoria('Operador aritmético') || this.verCategoria('Operador de incremento-decremento')) {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    while (this.verToken() && this.verToken().lexema !== ';') {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    this.matchLexema(';');
    return nodo;
  }

  If() {
    const nodo = new NodoArbol("If");
    this.match('Palabra clave');
    this.matchLexema('(');
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(')');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    if (this.verLexema('else')) nodo.agregarHijo(this.Else());
    return nodo;
  }

  Else() {
    const nodo = new NodoArbol("Else");
    this.match('Palabra clave');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    return nodo;
  }

  For() {
    const nodo = new NodoArbol("For");
    this.match('Palabra clave');
    this.matchLexema('(');
    nodo.agregarHijo(this.Asignacion());
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(';');
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(')');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    return nodo;
  }

  While() {
    const nodo = new NodoArbol("While");
    this.match('Palabra clave');
    this.matchLexema('(');
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(')');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    return nodo;
  }

  DoWhile() {
    const nodo = new NodoArbol("DoWhile");
    this.match('Palabra clave');
    this.matchLexema('{');
    this.CuerpoFuncion(nodo);
    this.matchLexema('}');
    this.match('Palabra clave'); // while
    this.matchLexema('(');
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  Switch() {
    const nodo = new NodoArbol("Switch");
    this.match('Palabra clave');
    this.matchLexema('(');
    nodo.agregarHijo(this.Expresion());
    this.matchLexema(')');
    this.matchLexema('{');
    while (this.verToken() && this.verToken().lexema !== '}') {
      const t = this.verToken();
      if (t.lexema === 'case') nodo.agregarHijo(this.Case());
      else if (t.lexema === 'default') nodo.agregarHijo(this.Default());
      else if (t.lexema === 'break') nodo.agregarHijo(this.InstruccionSimple());
      else this.siguiente();
    }
    this.matchLexema('}');
    return nodo;
  }

  Case() {
    const nodo = new NodoArbol("Case");
    this.match('Palabra clave');
    nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    this.matchLexema(':');
    return nodo;
  }

  Default() {
    const nodo = new NodoArbol("Default");
    this.match('Palabra clave');
    this.matchLexema(':');
    return nodo;
  }

  LlamadaGenerica() {
    const nodo = new NodoArbol("Llamada a Función");
    nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    this.matchLexema('(');
    while (this.verToken() && this.verToken().lexema !== ')') {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  LlamadaIO() {
    const nodo = new NodoArbol("Entrada/Salida");
    nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    this.matchLexema('(');
    while (this.verToken() && this.verToken().lexema !== ')') {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  Return() {
    const nodo = new NodoArbol("Return");
    this.match('Palabra clave');
    if (!this.verLexema(';')) nodo.agregarHijo(this.Expresion());
    this.matchLexema(';');
    return nodo;
  }

  Expresion() {
    const nodo = new NodoArbol("Expresión");
    while (this.verToken() && this.verToken().lexema !== ';' && this.verToken().lexema !== ')' && this.verToken().lexema !== '{') {
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    return nodo;
  }

  InstruccionSimple() {
    const nodo = new NodoArbol(this.siguiente().lexema);
    this.matchLexema(';');
    return nodo;
  }

  // --- Utilidades
  verToken() {
    return this.tokens[this.index];
  }
  siguiente() {
    return this.tokens[this.index++];
  }
  verLexema(lexema) {
    return this.verToken() && this.verToken().lexema === lexema;
  }
  verCategoria(cat) {
    return this.verToken() && this.verToken().categoria === cat;
  }
  match(categoria) {
    const token = this.verToken();
    if (token && token.categoria === categoria) return this.siguiente();
    this.error(`Se esperaba ${categoria}, se encontró ${token ? token.lexema : 'EOF'}`);
    return null;
  }
  matchLexema(lexema) {
    const token = this.verToken();
    if (token && token.lexema === lexema) return this.siguiente();
    this.error(`Se esperaba '${lexema}', se encontró ${token ? token.lexema : 'EOF'}`);
    return null;
  }
  matchUnaDe(categorias) {
  const token = this.verToken();
  if (token && categorias.includes(token.categoria)) {
    return this.siguiente();
  } else {
    this.error(`Se esperaba una de las categorías: ${categorias.join(' o ')}, se encontró ${token ? token.lexema : 'EOF'}`);
    return null;
  }
}

  error(msg) {
    this.errores.push(`Error: ${msg} (línea ${this.verToken() ? this.verToken().linea : 'EOF'})`);
  }
}

module.exports = { analizarTokens: (tokens) => (new Parser(tokens)).analizar() };