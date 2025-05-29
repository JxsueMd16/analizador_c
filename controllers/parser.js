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

  // Inicialización con operador como nodo padre
  DeclaracionVariable() {
    const nodo = new NodoArbol("Declaración");
    const tipo = this.match('Palabra clave');
    
    const nodoTipo = new NodoArbol("Tipo");
    nodoTipo.agregarHijo(new NodoArbol(tipo.lexema));
    nodo.agregarHijo(nodoTipo);
    
    const nodoVariables = new NodoArbol("Variables");
    
    while (this.verToken() && this.verToken().lexema !== ';') {
      const token = this.verToken();
      
      if (token.categoria === 'Identificador') {
        const nombreVar = this.siguiente().lexema;
        
        // Si hay inicialización, el '=' es el nodo padre
        if (this.verLexema('=')) {
          const operadorAsignacion = this.siguiente().lexema; // consume el '='
          
          // El operador '=' es el nodo padre
          const nodoAsignacion = new NodoArbol(operadorAsignacion);
          nodoAsignacion.agregarHijo(new NodoArbol(nombreVar)); // lado izquierdo
          
          // Agregar el valor de inicialización (lado derecho)
          if (this.verToken() && this.verToken().lexema !== ',' && this.verToken().lexema !== ';') {
            nodoAsignacion.agregarHijo(new NodoArbol(this.siguiente().lexema));
          }
          
          nodoVariables.agregarHijo(nodoAsignacion);
        } else {
          // Solo declaración sin inicialización
          nodoVariables.agregarHijo(new NodoArbol(nombreVar));
        }
      } else {
        this.siguiente();
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

  // Operador de asignación como nodo padre
  Asignacion() {
    const variable = this.siguiente().lexema;
    
    // Verificar qué tipo de operador viene después
    if (this.verLexema('=')) {
      // Asignación simple: el '=' es el nodo padre
      const operador = this.siguiente().lexema;
      const nodoAsignacion = new NodoArbol(operador);
      
      nodoAsignacion.agregarHijo(new NodoArbol(variable)); // lado izquierdo
      
      // Lado derecho (puede ser una expresión compleja)
      const valorDerecho = this.ExpresionHastaDelimitador([';']);
      nodoAsignacion.agregarHijo(valorDerecho);
      
      this.matchLexema(';');
      return nodoAsignacion;
      
    } else if (this.verCategoria('Operador aritmético') && 
               ['+=', '-=', '*=', '/=', '%='].includes(this.verToken().lexema)) {
      // Asignación compuesta: el operador es el nodo padre
      const operador = this.siguiente().lexema;
      const nodoAsignacion = new NodoArbol(operador);
      
      nodoAsignacion.agregarHijo(new NodoArbol(variable)); // lado izquierdo
      
      // Lado derecho
      const valorDerecho = this.ExpresionHastaDelimitador([';']);
      nodoAsignacion.agregarHijo(valorDerecho);
      
      this.matchLexema(';');
      return nodoAsignacion;
      
    } else if (this.verCategoria('Operador de incremento-decremento')) {
      // Operadores unarios: mantener estructura actual (++ y -- no son binarios)
      const nodo = new NodoArbol("Expresión Unaria");
      nodo.agregarHijo(new NodoArbol(variable));
      nodo.agregarHijo(new NodoArbol(this.siguiente().lexema));
      
      this.matchLexema(';');
      return nodo;
    }
    
    // Fallback para otros casos
    const nodo = new NodoArbol("Asignación");
    nodo.agregarHijo(new NodoArbol(variable));
    
    if (this.verToken() && this.verToken().lexema !== ';') {
      const operador = this.siguiente().lexema;
      nodo.agregarHijo(new NodoArbol(operador));
      
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

  // Función auxiliar para parsear expresiones hasta delimitadores
  ExpresionHastaDelimitador(delimitadores) {
    const tokens = [];
    
    while (this.verToken() && !delimitadores.includes(this.verToken().lexema)) {
      tokens.push(this.siguiente());
    }
    
    if (tokens.length === 1) {
      return new NodoArbol(tokens[0].lexema);
    } else if (tokens.length > 1) {
      // Detectar operadores binarios y hacerlos nodos padre
      return this.construirExpresionBinaria(tokens);
    }
    
    return new NodoArbol("expresión_vacía");
  }

  // Construir expresiones binarias con operadores como nodos padre
  construirExpresionBinaria(tokens) {
    if (tokens.length === 1) {
      return new NodoArbol(tokens[0].lexema);
    }
    
    // Buscar operadores binarios (precedencia simple: +, -, *, /, %)
    const operadoresBinarios = ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '!='];
    
    for (let i = 1; i < tokens.length - 1; i++) {
      const token = tokens[i];
      if (operadoresBinarios.includes(token.lexema)) {
        // El operador es el nodo padre
        const nodoOperador = new NodoArbol(token.lexema);
        
        // Lado izquierdo
        const tokensIzquierda = tokens.slice(0, i);
        const ladoIzquierdo = tokensIzquierda.length === 1 ? 
          new NodoArbol(tokensIzquierda[0].lexema) : 
          this.construirExpresionBinaria(tokensIzquierda);
        
        // Lado derecho
        const tokensDerecha = tokens.slice(i + 1);
        const ladoDerecho = tokensDerecha.length === 1 ? 
          new NodoArbol(tokensDerecha[0].lexema) : 
          this.construirExpresionBinaria(tokensDerecha);
        
        nodoOperador.agregarHijo(ladoIzquierdo);
        nodoOperador.agregarHijo(ladoDerecho);
        
        return nodoOperador;
      }
    }
    
    // Si no hay operadores binarios, crear nodo de expresión simple
    const nodo = new NodoArbol("Expresión");
    tokens.forEach(token => {
      nodo.agregarHijo(new NodoArbol(token.lexema));
    });
    return nodo;
  }

  // Expresiones con mejor estructura
  Expresion() {
    const tokens = [];
    
    while (this.verToken() && 
           this.verToken().lexema !== ';' && 
           this.verToken().lexema !== ')' && 
           this.verToken().lexema !== '{' &&
           this.verToken().lexema !== ',') {
      tokens.push(this.siguiente());
    }
    
    if (tokens.length === 1) {
      return new NodoArbol(tokens[0].lexema);
    } else if (tokens.length > 1) {
      return this.construirExpresionBinaria(tokens);
    }
    
    return new NodoArbol("Expresión");
  }

  If() {
    const nodo = new NodoArbol("If");
    this.match('Palabra clave');
    this.matchLexema('(');
    
    const nodoCondicion = new NodoArbol("Condición");
    const expresion = this.Expresion();
    nodoCondicion.agregarHijo(expresion);
    nodo.agregarHijo(nodoCondicion);
    
    this.matchLexema(')');
    this.matchLexema('{');
    
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
    
    // Estructura más clara manteniendo asignaciones mejoradas
    const nodoInicializacion = new NodoArbol("Inicialización");
    const inicializacion = this.Asignacion();
    nodoInicializacion.agregarHijo(inicializacion);
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
    this.match('Palabra clave');
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
      if (t.lexema === 'case') {
        nodoCasos.agregarHijo(this.Case());
      } else if (t.lexema === 'default') {
        nodoCasos.agregarHijo(this.Default());
      } else {
        // Procesar las instrucciones dentro de cada caso
        if (t.lexema === 'break') {
          nodoCasos.agregarHijo(this.InstruccionSimple());
        } else if (['printf', 'scanf', 'getch'].includes(t.lexema)) {
          nodoCasos.agregarHijo(this.LlamadaIO());
        } else if (t.categoria === 'Identificador') {
          const siguiente = this.tokens[this.index + 1];
          if (siguiente && siguiente.lexema === '(') {
            nodoCasos.agregarHijo(this.LlamadaGenerica());
          } else {
            nodoCasos.agregarHijo(this.Asignacion());
          }
        } else if (t.categoria === 'Palabra clave' && ['int', 'float', 'char'].includes(t.lexema)) {
          nodoCasos.agregarHijo(this.DeclaracionVariable());
        } else if (t.lexema === 'if') {
          nodoCasos.agregarHijo(this.If());
        } else if (t.lexema === 'for') {
          nodoCasos.agregarHijo(this.For());
        } else if (t.lexema === 'while') {
          nodoCasos.agregarHijo(this.While());
        } else if (t.lexema === 'return') {
          nodoCasos.agregarHijo(this.Return());
        } else {
          // Si no reconoce la instrucción, la consume para evitar bucle infinito
          this.error(`Instrucción no reconocida en switch: ${t.lexema}`);
          this.siguiente();
        }
      }
    }
    nodo.agregarHijo(nodoCasos);
    
    this.matchLexema('}');
    return nodo;
  }

  Case() {
    const nodo = new NodoArbol("Case");
    this.match('Palabra clave'); // consume 'case'
    
    const nodoValor = new NodoArbol("Valor");
    if (this.verToken()) {
      nodoValor.agregarHijo(new NodoArbol(this.siguiente().lexema));
    }
    nodo.agregarHijo(nodoValor);
    
    this.matchLexema(':');
    
    // Agregar las instrucciones que siguen al case
    const nodoCuerpo = new NodoArbol("Cuerpo Case");
    while (this.verToken() && 
           this.verToken().lexema !== 'case' && 
           this.verToken().lexema !== 'default' && 
           this.verToken().lexema !== '}') {
      
      const t = this.verToken();
      if (t.lexema === 'break') {
        nodoCuerpo.agregarHijo(this.InstruccionSimple());
        break; // Salir después del break
      } else if (['printf', 'scanf', 'getch'].includes(t.lexema)) {
        nodoCuerpo.agregarHijo(this.LlamadaIO());
      } else if (t.categoria === 'Identificador') {
        const siguiente = this.tokens[this.index + 1];
        if (siguiente && siguiente.lexema === '(') {
          nodoCuerpo.agregarHijo(this.LlamadaGenerica());
        } else {
          nodoCuerpo.agregarHijo(this.Asignacion());
        }
      } else if (t.categoria === 'Palabra clave' && ['int', 'float', 'char'].includes(t.lexema)) {
        nodoCuerpo.agregarHijo(this.DeclaracionVariable());
      } else if (t.lexema === 'if') {
        nodoCuerpo.agregarHijo(this.If());
      } else if (t.lexema === 'for') {
        nodoCuerpo.agregarHijo(this.For());
      } else if (t.lexema === 'while') {
        nodoCuerpo.agregarHijo(this.While());
      } else if (t.lexema === 'return') {
        nodoCuerpo.agregarHijo(this.Return());
      } else {
        this.error(`Instrucción no reconocida en case: ${t.lexema}`);
        this.siguiente();
      }
    }
    
    if (nodoCuerpo.hijos.length > 0) {
      nodo.agregarHijo(nodoCuerpo);
    }
    
    return nodo;
  }

  Default() {
    const nodo = new NodoArbol("Default");
    this.match('Palabra clave'); // consume 'default'
    this.matchLexema(':');
    
    // Agregar las instrucciones que siguen al default
    const nodoCuerpo = new NodoArbol("Cuerpo Default");
    while (this.verToken() && 
           this.verToken().lexema !== 'case' && 
           this.verToken().lexema !== '}') {
      
      const t = this.verToken();
      if (t.lexema === 'break') {
        nodoCuerpo.agregarHijo(this.InstruccionSimple());
        break; // Salir después del break
      } else if (['printf', 'scanf', 'getch'].includes(t.lexema)) {
        nodoCuerpo.agregarHijo(this.LlamadaIO());
      } else if (t.categoria === 'Identificador') {
        const siguiente = this.tokens[this.index + 1];
        if (siguiente && siguiente.lexema === '(') {
          nodoCuerpo.agregarHijo(this.LlamadaGenerica());
        } else {
          nodoCuerpo.agregarHijo(this.Asignacion());
        }
      } else if (t.categoria === 'Palabra clave' && ['int', 'float', 'char'].includes(t.lexema)) {
        nodoCuerpo.agregarHijo(this.DeclaracionVariable());
      } else if (t.lexema === 'if') {
        nodoCuerpo.agregarHijo(this.If());
      } else if (t.lexema === 'for') {
        nodoCuerpo.agregarHijo(this.For());
      } else if (t.lexema === 'while') {
        nodoCuerpo.agregarHijo(this.While());
      } else if (t.lexema === 'return') {
        nodoCuerpo.agregarHijo(this.Return());
      } else {
        this.error(`Instrucción no reconocida en default: ${t.lexema}`);
        this.siguiente();
      }
    }
    
    if (nodoCuerpo.hijos.length > 0) {
      nodo.agregarHijo(nodoCuerpo);
    }
    
    return nodo;
  }

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