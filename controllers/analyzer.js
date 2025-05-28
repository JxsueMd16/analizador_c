  const lexer = require('./lexer');

  exports.analizarCodigo = (codigo) => {
    const tokens = lexer.analizar(codigo);

    // Extraer datos para estadísticas
    const lineasAnalizadas = codigo.split('\n').length;
    const tokensGenerados = tokens.length;

    const erroresDetalle = tokens
      .filter(t => t.categoria === 'Error léxico')
      .map(t => ({
        lexema: t.lexema,
        linea: t.linea,
        tipo: 'Error léxico'
      }));

    const errores = erroresDetalle.length;

    const simbolosMap = {};
    const simbolos = [];

    tokens.forEach(t => {
      if (t.categoria === 'Identificador') {
        if (!simbolosMap[t.lexema]) {
          simbolosMap[t.lexema] = {
            id: t.token,
            nombre: t.lexema,
            token: t.token,
            linea: t.linea  // Aquí es donde guardamos la línea correctamente
          };
          simbolos.push(simbolosMap[t.lexema]);
        }
      }
    });


    const identificadoresUnicos = simbolos.length;

    return {
      tokens,
      simbolos,
      erroresDetalle,
      lineasAnalizadas,
      tokensGenerados,
      errores,
      identificadoresUnicos,
      codigoOriginal: codigo  
    };

  };
