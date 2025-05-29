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

    const nodoBiblioteca = new NodoArbol("Biblioteca");
    const archivo = this.matchUnaDe(['Archivo de biblioteca', 'Cadena de texto']);
    if (archivo) {
      nodoBiblioteca.agregarHijo(new NodoArbol(archivo.lexema));
      nodo.agregarHijo(nodoBiblioteca);
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
      // Crear un nodo para cada parámetro individual
      const nodoParametro = new NodoArbol("Parámetro");
      
      const tipo = this.match('Palabra clave');
      if (!tipo) break;
      nodoParametro.agregarHijo(new NodoArbol(tipo.lexema));
      
      const id = this.match('Identificador');
      if (id) nodoParametro.agregarHijo(new NodoArbol(id.lexema));
      
      nodo.agregarHijo(nodoParametro);
      
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

  // MEJORADA: Estructura más clara para declaraciones
  DeclaracionVariable() {
    const nodo = new NodoArbol("Declaración");
    const tipo = this.match('Palabra clave');
    
    // Crear nodo tipo como primer hijo
    const nodoTipo = new NodoArbol("Tipo");
    nodoTipo.agregarHijo(new NodoArbol(tipo.lexema));
    nodo.agregarHijo(nodoTipo);
    
    // Procesar variables (pueden ser múltiples separadas por comas)
    const nodoVariables = new NodoArbol("Variables");
    
    while (this.verToken() && this.verToken().lexema !== ';') {
      const token = this.verToken();
      
      if (token.categoria === 'Identificador') {
        const nombreVar = this.siguiente().lexema;
        
        // Verificar si hay inicialización
        if (this.verLexema('=')) {
          const nodoAsignacion = new NodoArbol("Inicialización");
          nodoAsignacion.agregarHijo(new NodoArbol(nombreVar));
          nodoAsignacion.agregarHijo(new NodoArbol(this.siguiente().lexema)); // el '='
          
          // Agregar el valor de inicialización
          if (this.verToken() && this.verToken().lexema !== ',' && this.verToken().lexema !== ';') {
            nodoAsignacion.agregarHijo(new NodoArbol(this.siguiente().lexema));
          }
          
          nodoVariables.agregarHijo(nodoAsignacion);
        } else {
          // Solo declaración sin inicialización
          nodoVariables.agregarHijo(new NodoArbol(nombreVar));
        }
      } else {
        this.siguiente(); // saltar tokens no reconocidos
      }
      
      if (this.verLexema(',')) {
        this.matchLexema(',');
      } else {
        break;
      }
    }
    
    nodo.agregarHijo(nodoVariables);
    this.matchLexema(';');
    return nodo;
  }

  // MEJORADA: Estructura más clara para asignaciones
  Asignacion() {
    const nodo = new NodoArbol("Asignación");
    
    // Variable que se asigna
    const variable = this.siguiente().lexema;
    nodo.agregarHijo(new NodoArbol(variable));
    
    // Operador de asignación
    if (this.verLexema('=') || this.verCategoria('Operador aritmético') || this.verCategoria('Operador de incremento-decremento')) {
      const operador = this.siguiente().lexema;
      nodo.agregarHijo(new NodoArbol(operador));
      
      // Expresión del lado derecho
      if (this.verToken() && this.verToken().lexema !== ';') {
        const nodoExpresion = new NodoArbol("Valor");
        while (this.verToken() && this.verToken().lexema !== ';') {
          nodoExpresion.agregarHijo(new NodoArbol(this.siguiente().lexema));
        }
        nodo.agregarHijo(nodoExpresion);
      }
    }
    
    this.matchLexema(';');
    return nodo;
  }

  // MEJORADA: Estructura más clara para expresiones
  Expresion() {
    const nodo = new NodoArbol("Expresión");
    const tokens = [];
    
    // Recopilar todos los tokens de la expresión
    while (this.verToken() && 
           this.verToken().lexema !== ';' && 
           this.verToken().lexema !== ')' && 
           this.verToken().lexema !== '{' &&
           this.verToken().lexema !== ',') {
      tokens.push(this.siguiente());
    }
    
    // Si es una expresión simple (un solo token), no crear estructura compleja
    if (tokens.length === 1) {
      nodo.agregarHijo(new NodoArbol(tokens[0].lexema));
    } else if (tokens.length > 1) {
      // Para expresiones más complejas, mantener la estructura actual
      tokens.forEach(token => {
        nodo.agregarHijo(new NodoArbol(token.lexema));
      });
    }
    
    return nodo;
  }

  If() {
    const nodo = new NodoArbol("If");
    this.match('Palabra clave');
    this.matchLexema('(');
    
    // Crear nodo específico para la condición
    const nodoCondicion = new NodoArbol("Condición");
    const expresion = this.Expresion();
    nodoCondicion.agregarHijo(expresion);
    nodo.agregarHijo(nodoCondicion);
    
    this.matchLexema(')');
    this.matchLexema('{');
    
    // Crear nodo específico para el cuerpo del if
    const nodoCuerpo = new NodoArbol("Cuerpo If");
    this.CuerpoFuncion(nodoCuerpo);
    nodo.agregarHijo(nodoCuerpo);
    
    this.matchLexema('}');
    
    if (this.verLexema('else')) nodo.agregarHijo(this.Else());
    return nodo;
  }

  Else() {
    const nodo = new NodoArbol("Else");
    this.match('Palabra clave');
    this.matchLexema('{');
    
    const nodoCuerpo = new NodoArbol("Cuerpo Else");
    this.CuerpoFuncion(nodoCuerpo);
    nodo.agregarHijo(nodoCuerpo);
    
    this.matchLexema('}');
    return nodo;
  }

  For() {
    const nodo = new NodoArbol("For");
    this.match('Palabra clave');
    this.matchLexema('(');
    
    // Estructura más clara para el for
    const nodoInicializacion = new NodoArbol("Inicialización");
    nodoInicializacion.agregarHijo(this.Asignacion());
    nodo.agregarHijo(nodoInicializacion);
    
    const nodoCondicion = new NodoArbol("Condición");
    nodoCondicion.agregarHijo(this.Expresion());
    nodo.agregarHijo(nodoCondicion);
    
    this.matchLexema(';');
    
    const nodoIncremento = new NodoArbol("Incremento");
    nodoIncremento.agregarHijo(this.Expresion());
    nodo.agregarHijo(nodoIncremento);
    
    this.matchLexema(')');
    this.matchLexema('{');
    
    const nodoCuerpo = new NodoArbol("Cuerpo For");
    this.CuerpoFuncion(nodoCuerpo);
    nodo.agregarHijo(nodoCuerpo);
    
    this.matchLexema('}');
    return nodo;
  }

  While() {
    const nodo = new NodoArbol("While");
    this.match('Palabra clave');
    this.matchLexema('(');
    
    const nodoCondicion = new NodoArbol("Condición");
    nodoCondicion.agregarHijo(this.Expresion());
    nodo.agregarHijo(nodoCondicion);
    
    this.matchLexema(')');
    this.matchLexema('{');
    
    const nodoCuerpo = new NodoArbol("Cuerpo While");
    this.CuerpoFuncion(nodoCuerpo);
    nodo.agregarHijo(nodoCuerpo);
    
    this.matchLexema('}');
    return nodo;
  }

  DoWhile() {
    const nodo = new NodoArbol("DoWhile");
    this.match('Palabra clave');
    this.matchLexema('{');
    
    const nodoCuerpo = new NodoArbol("Cuerpo Do");
    this.CuerpoFuncion(nodoCuerpo);
    nodo.agregarHijo(nodoCuerpo);
    
    this.matchLexema('}');
    this.match('Palabra clave'); // while
    this.matchLexema('(');
    
    const nodoCondicion = new NodoArbol("Condición");
    nodoCondicion.agregarHijo(this.Expresion());
    nodo.agregarHijo(nodoCondicion);
    
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  Switch() {
    const nodo = new NodoArbol("Switch");
    this.match('Palabra clave');
    this.matchLexema('(');
    
    const nodoExpresion = new NodoArbol("Expresión Switch");
    nodoExpresion.agregarHijo(this.Expresion());
    nodo.agregarHijo(nodoExpresion);
    
    this.matchLexema(')');
    this.matchLexema('{');
    
    const nodoCasos = new NodoArbol("Casos");
    while (this.verToken() && this.verToken().lexema !== '}') {
      const t = this.verToken();
      if (t.lexema === 'case') nodoCasos.agregarHijo(this.Case());
      else if (t.lexema === 'default') nodoCasos.agregarHijo(this.Default());
      else if (t.lexema === 'break') nodoCasos.agregarHijo(this.InstruccionSimple());
      else this.siguiente();
    }
    nodo.agregarHijo(nodoCasos);
    
    this.matchLexema('}');
    return nodo;
  }

  Case() {
    const nodo = new NodoArbol("Case");
    this.match('Palabra clave');
    
    const nodoValor = new NodoArbol("Valor");
    nodoValor.agregarHijo(new NodoArbol(this.siguiente().lexema));
    nodo.agregarHijo(nodoValor);
    
    this.matchLexema(':');
    return nodo;
  }

  Default() {
    const nodo = new NodoArbol("Default");
    this.match('Palabra clave');
    this.matchLexema(':');
    return nodo;
  }

  // MEJORADA: Estructura más clara para llamadas a función
  LlamadaGenerica() {
    const nodo = new NodoArbol("Llamada a Función");
    
    const nombreFuncion = this.siguiente().lexema;
    nodo.agregarHijo(new NodoArbol(nombreFuncion));
    
    this.matchLexema('(');
    
    const nodoParametros = new NodoArbol("Argumentos");
    while (this.verToken() && this.verToken().lexema !== ')') {
      nodoParametros.agregarHijo(new NodoArbol(this.siguiente().lexema));
      if (this.verLexema(',')) this.matchLexema(',');
    }
    
    if (nodoParametros.hijos.length > 0) {
      nodo.agregarHijo(nodoParametros);
    }
    
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  LlamadaIO() {
    const nodo = new NodoArbol("Entrada/Salida");
    
    const nombreFuncion = this.siguiente().lexema;
    nodo.agregarHijo(new NodoArbol(nombreFuncion));
    
    this.matchLexema('(');
    
    const nodoParametros = new NodoArbol("Parámetros");
    while (this.verToken() && this.verToken().lexema !== ')') {
      nodoParametros.agregarHijo(new NodoArbol(this.siguiente().lexema));
      if (this.verLexema(',')) this.matchLexema(',');
    }
    
    if (nodoParametros.hijos.length > 0) {
      nodo.agregarHijo(nodoParametros);
    }
    
    this.matchLexema(')');
    this.matchLexema(';');
    return nodo;
  }

  Return() {
    const nodo = new NodoArbol("Return");
    this.match('Palabra clave');
    
    if (!this.verLexema(';')) {
      const nodoValor = new NodoArbol("Valor de Retorno");
      nodoValor.agregarHijo(this.Expresion());
      nodo.agregarHijo(nodoValor);
    }
    
    this.matchLexema(';');
    return nodo;
  }

  InstruccionSimple() {
    const nodo = new NodoArbol(this.siguiente().lexema);
    this.matchLexema(';');
    return nodo;
  }

  // --- Utilidades (sin cambios)
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