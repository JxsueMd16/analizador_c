const Token = require('../models/token');

exports.analizar = (codigo) => {
  const palabrasClave = [
    'int', 'double', 'float', 'char', 'if', 'else', 'while', 'return',
    'switch', 'case', 'break', 'default', 'for', 'do', 'void', 'printf', 'scanf', 'getch'
  ];

  // Regex  - patrones ordenados por especificidad
  // IMPORTANTE: Los patrones mas especificos van PRIMERO
  const regex = /(=<|=>|=!|!>|!<|<>)|(#\w+)|(\"(?:[^"\\]|\\.)*\"?)|(\"[^"]*$)|('(?:[^'\\]|\\.)*'?)|('$)|(<.*?>)|(\/\/.*)|\/\*[\s\S]*?\*\/|(\/\*[\s\S]*$)|(0x[0-9a-fA-F]*[g-zG-Z]+[0-9a-fA-F]*)|(\d+\.\d*\.[\d.]*)|(\d*\.\d+\.[\d.]*)|(\d+\.\d+e[+-]?\d+)|(\d+e[+-]?\d+)|(\d+\.\d+e[+-]?$)|(\d+e[+-]?$)|(\d+e$)|(0x[0-9a-fA-F]+)|(\d+\.\d+)|(\d+\.)|([0-9]+[a-zA-Z_][a-zA-Z0-9_]*)|([a-zA-Z_][a-zA-Z0-9_]*[$@#%^&`~\\]+[a-zA-Z0-9_]*)|([=!<>]=?|&&|\|\||\+\+|--|[+\-*/%=<>!&])|(\d+)|([a-zA-Z_][a-zA-Z0-9_]*)|([;:,(){}[\]])|(\S)/g;

  let match;
  const tablaTokens = [];

  const identificadores = {};
  let idCounter = 1;

  const contadores = {
    'Palabra clave': 1,
    'Preprocesador': 1,
    'Cadena de texto': 1,
    'Caracter': 1,
    'Numero decimal': 1,
    'Numero entero': 1,
    'Numero hexadecimal': 1,
    'Comentario': 1,
    'Operador logico': 1,
    'Operador relacional': 1,
    'Operador aritmetico': 1,
    'Operador de asignacion': 1,
    'Operador de incremento-decremento': 1,
    'Delimitador': 1,
    'Archivo de biblioteca': 1,
    'Error lexico': 1
  };

  // Funcion para calcular el numero de linea basado en la posicion
  const calcularLinea = (posicion) => {
    return codigo.substring(0, posicion).split('\n').length;
  };

  while ((match = regex.exec(codigo)) !== null) {
    const lexema = match[0];
    const posicion = match.index;
    const numeroLinea = calcularLinea(posicion);
    let categoria = '';

    // Clasificacion detallada con deteccion de errores
    // OPERADORES INVaLIDOS PRIMERO (=<, =>, =!, !>, !<, <>)
    if (/^=<$|^=>$|^=!$|^!>$|^!<$|^<>$/.test(lexema)) {
      categoria = 'Error lexico';
    } else if (palabrasClave.includes(lexema)) {
      categoria = 'Palabra clave';
    } else if (/^<.*?>$/.test(lexema)) {
      categoria = 'Archivo de biblioteca';
    } else if (/^#\w+$/.test(lexema)) {
      categoria = 'Preprocesador';
    } 
    // Cadenas validas
    else if (/^"(?:[^"\\]|\\.)*"$/.test(lexema)) {
      categoria = 'Cadena de texto';
    } 
    // Cadenas mal formadas
    else if (/^"[^"]*$/.test(lexema) || /^".*\\.$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Caracteres validos - Solo un caracter o secuencia de escape valida
    else if (/^'(?:[^'\\]|\\[nrtbfav\\'"0])'$/.test(lexema)) {
      categoria = 'Caracter';
    }
    // Caracteres mal formados - multiples caracteres, vacio o mal cerrado
    else if (/^'[^']*$/.test(lexema) || /^'..+'$/.test(lexema) || /^''$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Comentarios validos (NO se agregan a la tabla de tokens)
    else if (/^\/\/.*$/.test(lexema) || /^\/\*[\s\S]*?\*\/$/.test(lexema)) {
      continue; // Ignorar comentarios validos
    }
    // Comentarios mal formados
    else if (/^\/\*[\s\S]*$/.test(lexema) && !lexema.endsWith('*/')) {
      categoria = 'Error lexico';
    }
    // Numeros hexadecimales validos
    else if (/^0x[0-9a-fA-F]+$/.test(lexema)) {
      categoria = 'Numero hexadecimal';
    }
    // Hexadecimal con digitos invalidos
    else if (/^0x[0-9a-fA-F]*[g-zG-Z]+[0-9a-fA-F]*$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Numeros en notacion cientifica validos (332.41e-1, 123e+5, etc.)
    else if (/^\d+\.\d+e[+-]?\d+$/.test(lexema) || /^\d+e[+-]?\d+$/.test(lexema)) {
      categoria = 'Numero decimal';
    }
    // Numeros mal formados (multiples puntos, notacion cientifica incorrecta, etc.)
    else if (/^\d+\.\d*\.[\d.]*$/.test(lexema) || /^\d*\.\d+\.[\d.]*$/.test(lexema) || 
             /^\d+\.\d+e[+-]?$/.test(lexema) || /^\d+e[+-]?$/.test(lexema) || 
             /^\d+e$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Numeros decimales validos
    else if (/^\d+\.\d+$/.test(lexema)) {
      categoria = 'Numero decimal';
    }
    // Numeros con punto pero sin decimales (ej: 123.)
    else if (/^\d+\.$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Numeros enteros validos
    else if (/^\d+$/.test(lexema)) {
      categoria = 'Numero entero';
    }
    // Identificadores que empiezan con numero (123variable)
    else if (/^[0-9]+[a-zA-Z_]+/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Identificadores con caracteres especiales (var$especial se detecta completo)
    else if (/^[a-zA-Z_][a-zA-Z0-9_]*[$@#%^&`~\\]+[a-zA-Z0-9_]*$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Operadores logicos
    else if (/^&&$|^\|\|$|^!$/.test(lexema)) {
      categoria = 'Operador logico';
    }
    // Operadores relacionales validos
    else if (/^==$|^!=$|^<=$|^>=$|^<$|^>$/.test(lexema)) {
      categoria = 'Operador relacional';
    }
    // Operadores de incremento/decremento
    else if (/^\+\+$|^--$/.test(lexema)) {
      categoria = 'Operador de incremento-decremento';
    }
    // Operador de asignacion
    else if (/^=$/.test(lexema)) {
      categoria = 'Operador de asignacion';
    }
    // Operadores aritmeticos (incluyendo % y &)
    else if (/^[+\-*/%&]$/.test(lexema)) {
      categoria = 'Operador aritmetico';
    }
    // Delimitadores
    else if (/^[;:,(){}[\]]$/.test(lexema)) {
      categoria = 'Delimitador';
    }
    // Identificadores validos (con verificacion de palabras clave pegadas)
    else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lexema)) {
      // Verificar si es una palabra clave pegada directamente con numeros o letras
      let esPalabraPegada = false;
      for (let palabra of palabrasClave) {
        if (lexema.startsWith(palabra) && lexema.length > palabra.length) {
          const resto = lexema.substring(palabra.length);
          
          // Es error si la palabra clave esta seguida directamente de digitos
          // Ejemplo: int123, if456, while789
          if (/^[0-9]/.test(resto)) {
            categoria = 'Error lexico';
            esPalabraPegada = true;
            break;
          }
          
          // Tambien es error si es claramente una palabra clave pegada con otra palabra
          // pero solo para casos obvios, permitiendo palabras naturales como "dos"
          if (lexema === palabra + resto && resto.length <= 6) {
            // Lista especifica de palabras que Si son validas aunque contengan palabras clave
            const palabrasValidas = ['dos', 'case', 'else', 'char', 'void'];
            if (!palabrasValidas.includes(lexema)) {
              // Para casos como "intnumero", "ifcondition", etc.
              if (resto.match(/^(numero|condition|statement|variable|function|method)$/i)) {
                categoria = 'Error lexico';
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
    // Caracteres no reconocidos especificos (removido & ya que es operador valido)
    else if (/^[@#$^`~\\]$/.test(lexema)) {
      categoria = 'Error lexico';
    }
    // Espacios en blanco (ignorar)
    else if (/^\s+$/.test(lexema)) {
      continue;
    }
    // Cualquier otra cosa
    else {
      categoria = 'Error lexico';
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

    // Crear el token con el numero de linea
    tablaTokens.push(new Token(lexema, categoria, token, numeroLinea));
  }

  return tablaTokens;
};