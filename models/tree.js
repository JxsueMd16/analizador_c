// models/tree.js
class NodoArbol {
  constructor(nombre) {
    this.nombre = nombre;
    this.hijos = [];
  }

  agregarHijo(hijo) {
    this.hijos.push(hijo);
  }
}

module.exports = NodoArbol;
