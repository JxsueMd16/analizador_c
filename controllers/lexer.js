const Token = require('../models/token');

exports.analizar = (codigo) => {
  const palabrasClave = [
    'int', 'float', 'char', 'if', 'else', 'while', 'return',
    'switch', 'case', 'break', 'default', 'for', 'do', 'void', 'printf', 'scanf'
  ];

  // Regex  - patrones ordenados por especificidad
  // IMPORTANTE: Los patrones más específicos van PRIMERO
  const regex = /(=<|=>|=!|!>|!<|<>)|(#\w+)|(\"(?:[^"\\]|\\.)*\"?)|(\"[^"]*$)|('(?:[^'\\]|\\.)*'?)|('$)|(<.*?>)|(\/\/.*)|\/\*[\s\S]*?\*\/|(\/\*[\s\S]*$)|(0x[0-9a-fA-F]*[g-zG-Z]+[0-9a-fA-F]*)|(\d+\.\d*\.[\d.]*)|(\d*\.\d+\.[\d.]*)|(\d+\.\d+e[+-]?\d*[^0-9])|(\d+e[+-]?[^0-9])|(\d+e$)|(\d+\.\d+)|(\d+\.)|([0-9]+[a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*[$@#%^&`~\\]+[a-zA-Z0-9_]*)|([=!<>]=?|&&|\|\||\+\+|--|[+\-*/%=<>!])|(\d+)|([a-zA-Z_][a-zA-Z0-9_]*)|([;:,(){}[\]])|(\S)/g;

  let match;
  const tablaTokens = [];

  const identificadores = {};
  let idCounter = 1;

  const contadores = {
    'Palabra clave': 1,
    'Preprocesador': 1,
    'Cadena de texto': 1,
    'Carácter': 1,
    'Número decimal': 1,
    'Número entero': 1,
    'Comentario': 1,
    'Operador lógico': 1,
    'Operador relacional': 1,
    'Operador aritmético': 1,
    'Operador de asignación': 1,
    'Operador de incremento/decremento': 1,
    'Delimitador': 1,
    'Archivo de biblioteca': 1,
    'Error léxico': 1
  };

  while ((match = regex.exec(codigo)) !== null) {
    const lexema = match[0];
    let categoria = '';

    // Clasificación detallada con detección de errores
    // OPERADORES INVÁLIDOS PRIMERO (=<, =>, =!, !>, !<, <>)
    if (/^=<$|^=>$|^=!$|^!>$|^!<$|^<>$/.test(lexema)) {
      categoria = 'Error léxico';
    } else if (palabrasClave.includes(lexema)) {
      categoria = 'Palabra clave';
    } else if (/^<.*?>$/.test(lexema)) {
      categoria = 'Archivo de biblioteca';
    } else if (/^#\w+$/.test(lexema)) {
      categoria = 'Preprocesador';
    } 
    // Cadenas válidas
    else if (/^"(?:[^"\\]|\\.)*"$/.test(lexema)) {
      categoria = 'Cadena de texto';
    } 
    // Cadenas mal formadas
    else if (/^"[^"]*$/.test(lexema) || /^".*\\.$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Caracteres válidos - Solo un carácter o secuencia de escape válida
    else if (/^'(?:[^'\\]|\\[nrtbfav\\'"0])'$/.test(lexema)) {
      categoria = 'Carácter';
    }
    // Caracteres mal formados - múltiples caracteres, vacío o mal cerrado
    else if (/^'[^']*$/.test(lexema) || /^'..+'$/.test(lexema) || /^''$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Comentarios válidos (NO se agregan a la tabla de tokens)
    else if (/^\/\/.*$/.test(lexema) || /^\/\*[\s\S]*?\*\/$/.test(lexema)) {
      continue; // Ignorar comentarios válidos
    }
    // Comentarios mal formados
    else if (/^\/\*[\s\S]*$/.test(lexema) && !lexema.endsWith('*/')) {
      categoria = 'Error léxico';
    }
    // Hexadecimal con dígitos inválidos
    else if (/^0x[0-9a-fA-F]*[g-zG-Z]+/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Números mal formados (múltiples puntos, notación científica incorrecta, etc.)
    else if (/^\d+\.\d*\.[\d.]*$/.test(lexema) || /^\d*\.\d+\.[\d.]*$/.test(lexema) || 
             /^\d+\.\d+e[+-]?\d*[^0-9]/.test(lexema) || /^\d+e[+-]?[^0-9]/.test(lexema) || 
             /^\d+e$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Números decimales válidos
    else if (/^\d+\.\d+$/.test(lexema)) {
      categoria = 'Número decimal';
    }
    // Números con punto pero sin decimales (ej: 123.)
    else if (/^\d+\.$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Números enteros válidos
    else if (/^\d+$/.test(lexema)) {
      categoria = 'Número entero';
    }
    // Identificadores que empiezan con número (123variable)
    else if (/^[0-9]+[a-zA-Z_]+/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Identificadores con caracteres especiales (var$especial se detecta completo)
    else if (/^[a-zA-Z_][a-zA-Z0-9_]*[$@#%^&`~\\]+[a-zA-Z0-9_]*$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Operadores lógicos
    else if (/^&&$|^\|\|$|^!$/.test(lexema)) {
      categoria = 'Operador lógico';
    }
    // Operadores relacionales válidos
    else if (/^==$|^!=$|^<=$|^>=$|^<$|^>$/.test(lexema)) {
      categoria = 'Operador relacional';
    }
    // Operadores de incremento/decremento
    else if (/^\+\+$|^--$/.test(lexema)) {
      categoria = 'Operador de incremento/decremento';
    }
    // Operador de asignación
    else if (/^=$/.test(lexema)) {
      categoria = 'Operador de asignación';
    }
    // Operadores aritméticos
    else if (/^[+\-*/%]$/.test(lexema)) {
      categoria = 'Operador aritmético';
    }
    // Delimitadores
    else if (/^[;:,(){}[\]]$/.test(lexema)) {
      categoria = 'Delimitador';
    }
    // Identificadores válidos (con verificación de palabras clave pegadas)
    else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lexema)) {
      // Verificar si es una palabra clave pegada a otra palabra (if123)
      let esPalabraPegada = false;
      for (let palabra of palabrasClave) {
        if (lexema.startsWith(palabra) && lexema.length > palabra.length) {
          const resto = lexema.substring(palabra.length);
          // Si después de la palabra clave hay más caracteres alfanuméricos
          if (/^[a-zA-Z0-9_]/.test(resto)) {
            categoria = 'Error léxico';
            esPalabraPegada = true;
            break;
          }
        }
      }
      
      if (!esPalabraPegada) {
        categoria = 'Identificador';
      }
    }
    // Caracteres no reconocidos específicos
    else if (/^[@#$%^&`~\\]$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Espacios en blanco (ignorar)
    else if (/^\s+$/.test(lexema)) {
      continue;
    }
    // Cualquier otra cosa
    else {
      categoria = 'Error léxico';
    }

    let token = 0;
    if (categoria === 'Identificador') {
      if (!identificadores[lexema]) {
        identificadores[lexema] = idCounter++;
      }
      token = identificadores[lexema];
    } else {
      token = contadores[categoria] || 1;
      contadores[categoria] = token + 1;
    }

    tablaTokens.push(new Token(lexema, categoria, token));
  }

  return tablaTokens;
};