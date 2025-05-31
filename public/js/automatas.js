const viz = new Viz();

    function mostrarCategoria(nombreCategoria){
        document.querySelectorAll('.categoria')
            .forEach(div => div.style.display = 'none');
        document.querySelectorAll('.' + nombreCategoria)
            .forEach(div => div.style.display = 'block');
        }
    function mostrarAutomata(nombreID, dot){
        viz.renderSVGElement(dot)
            .then(function(element){
                document.getElementById(nombreID).appendChild(element);
            });
    }
        
    // identificadores y literares
    const dotAFD_identificador = `
        digraph AFD_identificador {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="[a-zA-Z_]"];
            q1 -> q1 [label="[a-zA-Z0-9_]"];
        }
    `;

    const dotEntero = `
        digraph AFD_entero {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="[0-9]"];
            q1 -> q1 [label="[0-9]"];
        }
    `;
    const dotDecimal = `
        digraph AFD_decimal {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="[0-9]"];
            q1 -> q1 [label="[0-9]"];
            q1 -> q2 [label="."];
            q2 -> q3 [label="[0-9]"];
            q3 -> q3 [label="[0-9]"];
        }
    `;
    const dotCadena = `
        digraph AFD_cadena {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="\\\""];
            q1 -> q1 [label="[^\\\\\\\"]"];
            q1 -> q1 [label="\\\\."];
            q1 -> q2 [label="\\\""];
        }
    `;

    const dotCaracter = `
        digraph AFD_caracter {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="'"];
            q1 -> q2 [label="[^'\\\\]"];
            q1 -> q2 [label="\\\\."];
            q2 -> q3 [label="'"];
        }
    `;
    // Palabras Clave
    const dotPalabraClaveInt = `
        digraph AFD_palabra_clave_int {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="i"];
            q1 -> q2 [label="n"];
            q2 -> q3 [label="t"];
        }
    `; 
    
    //operadores
    const dotOperadorAsignacion = `
        digraph AFD_operador_asignacion {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q2 [label="q2"];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            q4 [label="q4"];
            // '='
            q0 -> q1 [label="="];
            // '+='
            q0 -> q2 [label="+"];
            q2 -> q3 [label="="];
            // '-='
            q0 -> q4 [label="-"];
            q4 -> q3 [label="="];
            // '*='
            q0 -> q2 [label="*"];
            q2 -> q3 [label="="];
            // '/='
            q0 -> q2 [label="/"];
            q2 -> q3 [label="="];
            // '%='
            q0 -> q2 [label="%"];
            q2 -> q3 [label="="];
        }
    `;

    const dotOperadorLogico = `
        digraph AFD_operador_logico {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            // '&&'
            q0 -> q1 [label="&"];
            q1 -> q2 [label="&"];
            // '||'
            q0 -> q1 [label="|"];
            q1 -> q2 [label="|"];
            // '!'
            q0 -> q3 [label="!"];
        }
    `;

    const dotOperadorRelacional = `
        digraph AFD_operador_relacional {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            // '=='
            q0 -> q1 [label="="];
            q1 -> q2 [label="="];
            // '!='
            q0 -> q1 [label="!"];
            q1 -> q2 [label="="];
            // '<'
            q0 -> q3 [label="<"];
            // '>'
            q0 -> q3 [label=">"];
            // '<='
            q0 -> q1 [label="<"];
            q1 -> q2 [label="="];
            // '>='
            q0 -> q1 [label=">"];
            q1 -> q2 [label="="];
        }
    `;
    const dotOperadorAritmetico = `
        digraph AFD_operador_aritmetico {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="+"];
            q0 -> q1 [label="-"];
            q0 -> q1 [label="*"];
            q0 -> q1 [label="/"];
            q0 -> q1 [label="%"];
        }
    `;
    const dotOperadorUnario = `
        digraph AFD_operador_unario {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            // '++'
            q0 -> q1 [label="+"];
            q1 -> q2 [label="+"];
            // '--'
            q0 -> q1 [label="-"];
            q1 -> q2 [label="-"];
            // '&', '*', '!', '+', '-'
            q0 -> q3 [label="&"];
            q0 -> q3 [label="*"];
            q0 -> q3 [label="!"];
            q0 -> q3 [label="+"];
            q0 -> q3 [label="-"];
        }
    `;
    const dotOperadorAcceso = `
        digraph AFD_operador_acceso {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q3 [label="q3 (aceptación)", shape=doublecircle];
            // '.'
            q0 -> q3 [label="."];
            // '->'
            q0 -> q1 [label="-"];
            q1 -> q2 [label=">"];
        }
    `;
    // delimitadores
    const dotDelimitadores = `
        digraph AFD_delimitadores {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label=";"];
            q0 -> q1 [label=":"];
            q0 -> q1 [label=","];
            q0 -> q1 [label="("];
            q0 -> q1 [label=")"];
            q0 -> q1 [label="{"];
            q0 -> q1 [label="}"];
            q0 -> q1 [label="["];
            q0 -> q1 [label="]"];
        }
    `;
    const dotParentesis = `
        digraph AFD_parentesis {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="("];
            q0 -> q1 [label=")"];
        }
    `;
    const dotLlaves = `
        digraph AFD_llaves {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="{"];
            q0 -> q1 [label="}"];
        }
    `;
    const dotCorchetes = `
        digraph AFD_corchetes {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="["];
            q0 -> q1 [label="]"];
        }
    `;
    // Preprocesador
    const dotDirectivaPreprocesador = `
        digraph AFD_directiva_preprocesador {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3"];
            q4 [label="q4"];
            q5 [label="q5"];
            q6 [label="q6"];
            q7 [label="q7"];
            q8 [label="q8 (aceptación)", shape=doublecircle];
            // '#include'
            q0 -> q1 [label="#"];
            q1 -> q2 [label="i"];
            q2 -> q3 [label="n"];
            q3 -> q4 [label="c"];
            q4 -> q5 [label="l"];
            q5 -> q6 [label="u"];
            q6 -> q7 [label="d"];
            q7 -> q8 [label="e"];
            // '#define'
            q1 -> q2 [label="d"];
            q2 -> q3 [label="e"];
            q3 -> q4 [label="f"];
            q4 -> q5 [label="i"];
            q5 -> q6 [label="n"];
            q6 -> q7 [label="e"];
            q7 -> q8 [label=""];
        }
    `;
    const dotBiblioteca = `
        digraph AFD_biblioteca {
            rankdir=LR;
            node [shape = circle];

            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3"];
            q4 [label="q4"];
            q5 [label="q5"];
            q6 [label="q6"];
            q7 [label="q7"];
            q8 [label="q8"];
            q9 [label="q9"];
            q10 [label="q10"];
            qf [label="qf (aceptación)", shape=doublecircle];

            // Inicio: < o "
            q0 -> q1 [label="<"];
            q0 -> q1 [label="\\\""];

            // Primer caracter: letra o guion bajo
            q1 -> q2 [label="[a-zA-Z_]"];

            // Más caracteres: letra, número o guion bajo
            q2 -> q2 [label="[a-zA-Z0-9_]"];

            // Punto
            q2 -> q3 [label="."];

            // h
            q3 -> q4 [label="h"];

            // Cierre: > o "
            q4 -> qf [label=">"];
            q4 -> qf [label="\\\""];
        }
    `;
    // Espacios en blanco
    const dotEspacioBlanco = `
        digraph AFD_espacio_blanco {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="espacio|tab|\\n|\\r"];
            q1 -> q1 [label="espacio|tab|\\n|\\r"];
        }
    `;
    const dotComentarioLinea = `
        digraph AFD_comentario_linea {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="/"];
            q1 -> q2 [label="/"];
            q2 -> q2 [label="cualquier excepto \\n"];
        }
    `;
    const dotComentarioBloque = `
        digraph AFD_comentario_bloque {
            rankdir=LR;
            node [shape = circle];
            q0 [label="q0 (inicio)"];
            q1 [label="q1"];
            q2 [label="q2"];
            q3 [label="q3"];
            q4 [label="q4 (aceptación)", shape=doublecircle];
            q0 -> q1 [label="/"];
            q1 -> q2 [label="*"];
            q2 -> q2 [label="cualquier excepto *"];
            q2 -> q3 [label="*"];
            q3 -> q3 [label="*"];
            q3 -> q2 [label="cualquier excepto /"];
            q3 -> q4 [label="/"];
        }
    `;
    window.addEventListener('DOMContentLoaded', () => {
        const automatas = [
            { id: "AFD_identificador", dot: dotAFD_identificador },
            { id: "AFD_numeroEntero", dot: dotEntero },
            { id: "AFD_numeroDecimal", dot: dotDecimal },
            { id: "AFD_cadena", dot: dotCadena },
            { id: "AFD_caracter", dot: dotCaracter },
            { id: "AFD_palabraClave", dot: dotPalabraClaveInt }, // O pon uno general si lo tienes
            { id: "AFD_operadorAsignacion", dot: dotOperadorAsignacion },
            { id: "AFD_operadorLogico", dot: dotOperadorLogico },
            { id: "AFD_operadorRacional", dot: dotOperadorRelacional },
            { id: "AFD_operadorAritmetico", dot: dotOperadorAritmetico },
            { id: "AFD_operadorUnario", dot: dotOperadorUnario },
            { id: "AFD_operadorAcceso", dot: dotOperadorAcceso },
            { id: "AFD_delimitadores", dot: dotDelimitadores },
            { id: "AFD_parentesis", dot: dotParentesis },
            { id: "AFD_llaves", dot: dotLlaves },
            { id: "AFD_corchetes", dot: dotCorchetes },
            { id: "AFD_directivaPreprocesador", dot: dotDirectivaPreprocesador },
            { id: "AFD_biblioteca", dot: dotBiblioteca },
            { id: "AFD_espacioBlanco", dot: dotEspacioBlanco },
            { id: "AFD_comentarioLinea", dot: dotComentarioLinea },
            { id: "AFD_comentarioBloque", dot: dotComentarioBloque },
        ];

        automatas.forEach(({ id, dot }) => {
            viz.renderSVGElement(dot)
                .then(element => {
                    const cont = document.getElementById(id);
                    if(cont) cont.appendChild(element);
                });
        });
    });