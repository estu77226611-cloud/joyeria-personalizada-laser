/* Inicio: muestra solo las piezas destacadas, no todo el catálogo. */

import { productosDestacados } from './productos.js';
import { crearTarjeta } from './producto-card.js';
import { qs } from './ui.js';

function iniciar() {
  const contenedor = qs('#featuredProducts');
  if (!contenedor) return;
  const destacados = productosDestacados();
  contenedor.replaceChildren(
    ...destacados.map((producto, indice) => crearTarjeta(producto, { prioridad: indice < 2 }))
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
