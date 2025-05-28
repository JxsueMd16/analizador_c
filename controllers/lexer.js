const Token = require('../models/token');

exports.analizar = (codigo) => {
  const palabrasClave = [
    'int', 'double', 'float', 'char', 'if', 'else', 'while', 'return',
    'switch', 'case', 'break', 'default', 'for', 'do', 'void', 'printf', 'scanf'
  ];

  // Regex  - patrones ordenados por especificidad
  // IMPORTANTE: Los patrones más específicos van PRIMERO
  const regex = /(=<|=>|=!|!>|!<|<>)|(#\w+)|(\"(?:[^"\\]|\\.)*\"?)|(\"[^"]*$)|('(?:[^'\\]|\\.)*'?)|('$)|(<.*?>)|(\/\/.*)|\/\*[\s\S]*?\*\/|(\/\*[\s\S]*$)|(0x[0-9a-fA-F]*[g-zG-Z]+[0-9a-fA-F]*)|(\d+\.\d*\.[\d.]*)|(\d*\.\d+\.[\d.]*)|(\d+\.\d+e[+-]?\d+)|(\d+e[+-]?\d+)|(\d+\.\d+e[+-]?$)|(\d+e[+-]?$)|(\d+e$)|(0x[0-9a-fA-F]+)|(\d+\.\d+)|(\d+\.)|([0-9]+[a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*[$@#%^&`~\\]+[a-zA-Z0-9_]*)|([=!<>]=?|&&|\|\||\+\+|--|[+\-*/%=<>!])|(\d+)|([a-zA-Z_][a-zA-Z0-9_]*)|([;:,(){}[\]])|(\S)/g;

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
    'Número hexadecimal': 1,
    'Comentario': 1,
    'Operador lógico': 1,
    'Operador relacional': 1,
    'Operador aritmético': 1,
    'Operador de asignación': 1,
    'Operador de incremento-decremento': 1,
    'Delimitador': 1,
    'Archivo de biblioteca': 1,
    'Error léxico': 1
  };

  // Función para calcular el número de línea basado en la posición
  const calcularLinea = (posicion) => {
    return codigo.substring(0, posicion).split('\n').length;
  };

  while ((match = regex.exec(codigo)) !== null) {
    const lexema = match[0];
    const posicion = match.index;
    const numeroLinea = calcularLinea(posicion);
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
    // Números hexadecimales válidos
    else if (/^0x[0-9a-fA-F]+$/.test(lexema)) {
      categoria = 'Número hexadecimal';
    }
    // Hexadecimal con dígitos inválidos
    else if (/^0x[0-9a-fA-F]*[g-zG-Z]+[0-9a-fA-F]*$/.test(lexema)) {
      categoria = 'Error léxico';
    }
    // Números en notación científica válidos (332.41e-1, 123e+5, etc.)
    else if (/^\d+\.\d+e[+-]?\d+$/.test(lexema) || /^\d+e[+-]?\d+$/.test(lexema)) {
      categoria = 'Número decimal';
    }
    // Números mal formados (múltiples puntos, notación científica incorrecta, etc.)
    else if (/^\d+\.\d*\.[\d.]*$/.test(lexema) || /^\d*\.\d+\.[\d.]*$/.test(lexema) || 
             /^\d+\.\d+e[+-]?$/.test(lexema) || /^\d+e[+-]?$/.test(lexema) || 
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
      categoria = 'Operador de incremento-decremento';
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
      // Verificar si es una palabra clave pegada directamente con números o letras
      let esPalabraPegada = false;
      for (let palabra of palabrasClave) {
        if (lexema.startsWith(palabra) && lexema.length > palabra.length) {
          const resto = lexema.substring(palabra.length);
          
          // Es error si la palabra clave está seguida directamente de dígitos
          // Ejemplo: int123, if456, while789
          if (/^[0-9]/.test(resto)) {
            categoria = 'Error léxico';
            esPalabraPegada = true;
            break;
          }
          
          // También es error si es claramente una palabra clave pegada con otra palabra
          // pero solo para casos obvios, permitiendo palabras naturales como "dos"
          if (lexema === palabra + resto && resto.length <= 6) {
            // Lista específica de palabras que SÍ son válidas aunque contengan palabras clave
            const palabrasValidas = ['dos', 'case', 'else', 'char', 'void'];
            if (!palabrasValidas.includes(lexema)) {
              // Para casos como "intnumero", "ifcondition", etc.
              if (resto.match(/^(numero|condition|statement|variable|function|method)$/i)) {
                categoria = 'Error léxico';
                esPalabraPegada = true;
                break;
              }
            }
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

    // Crear el token con el número de línea
    tablaTokens.push(new Token(lexema, categoria, token, numeroLinea));
  }

  return tablaTokens;
};