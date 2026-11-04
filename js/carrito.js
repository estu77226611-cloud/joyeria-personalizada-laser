/* Bolsa de compras: contador global y renderizado reutilizable. */

import { dinero } from './config.js?v=20261104b';
import {
  cambiarCantidad,
  contarBolsa,
  detalleBolsa,
  quitarProducto,
  totalBolsa
} from './store.js?v=20261104b';
import { aviso, crear, pedirConfirmacion, qs } from './ui.js?v=20261104b';

export function actualizarContador() {
  const contador = qs('#cartCount');
  if (!contador) return;
  const total = contarBolsa();
  contador.textContent = String(total);
  contador.setAttribute(
    'aria-label',
    `${total} ${total === 1 ? 'artículo' : 'artículos'} en la bolsa`
  );
}

export function iniciarContador() {
  actualizarContador();
  window.addEventListener('lumina:bolsa', actualizarContador);
}

export function crearFilaBolsa(item, { onCambio } = {}) {
  const fila = crear('article', { class: 'cart-entry', dataset: { uid: item.uid } });

  const imagen = crear('img', {
    src: item.producto.imagen,
    alt: item.producto.nombre,
    width: 170,
    height: 170,
    loading: 'lazy',
    decoding: 'async'
  });

  const detalle = crear(
    'div',
    { class: 'cart-entry__detail' },
    crear('h3', { text: item.producto.nombre }),
    crear(
      'p',
      {},
      item.grabado
        ? `Grabado: ${item.grabado} · Acabado: ${item.acabado}`
        : 'Sin personalización especificada'
    ),
    item.nota ? crear('p', { class: 'cart-entry__note', text: `Nota: ${item.nota}` }) : null,
    crear('p', { class: 'cart-entry__unit', text: `${dinero(item.producto.precio)} c/u` })
  );

  const controles = crear('div', { class: 'cart-entry__controls' });

  const cantidad = crear('div', {
    class: 'qty',
    attrs: { role: 'group', 'aria-label': `Cantidad de ${item.producto.nombre}` }
  });
  const menos = crear('button', {
    type: 'button',
    class: 'qty__btn',
    text: '−',
    attrs: { 'aria-label': `Quitar una unidad de ${item.producto.nombre}` }
  });
  const valor = crear('span', {
    class: 'qty__value',
    text: String(item.cantidad),
    attrs: { 'aria-live': 'polite' }
  });
  const mas = crear('button', {
    type: 'button',
    class: 'qty__btn',
    text: '+',
    attrs: { 'aria-label': `Agregar una unidad de ${item.producto.nombre}` }
  });
  menos.addEventListener('click', () => {
    cambiarCantidad(item.uid, -1);
    onCambio?.();
  });
  mas.addEventListener('click', () => {
    cambiarCantidad(item.uid, 1);
    onCambio?.();
  });
  cantidad.append(menos, valor, mas);

  const subtotal = crear('strong', { class: 'cart-entry__subtotal', text: dinero(item.subtotal) });

  const quitar = crear('button', {
    type: 'button',
    class: 'text-button cart-entry__remove',
    text: 'Quitar'
  });
  quitar.addEventListener('click', async () => {
    const confirmado = await pedirConfirmacion({
      titulo: 'Quitar de la bolsa',
      mensaje: `¿Quitar «${item.producto.nombre}» de tu bolsa?`,
      confirmar: 'Sí, quitar'
    });
    if (!confirmado) return;
    quitarProducto(item.uid);
    aviso('Producto quitado de la bolsa.', 'info');
    onCambio?.();
  });

  controles.append(cantidad, subtotal, quitar);
  fila.append(imagen, detalle, controles);
  return fila;
}

export function renderBolsa(contenedor, { onCambio } = {}) {
  if (!contenedor) return;
  const detalle = detalleBolsa();
  contenedor.replaceChildren();

  if (!detalle.length) {
    contenedor.append(
      crear(
        'div',
        { class: 'empty-cart' },
        crear('h3', { text: 'Tu bolsa está vacía ✳' }),
        crear('p', { text: 'Visita la colección para añadir tu primera joya.' }),
        crear('a', { class: 'under-link', href: 'catalogo.html', text: 'Explorar catálogo →' })
      )
    );
  } else {
    detalle.forEach((item) => contenedor.append(crearFilaBolsa(item, { onCambio })));
  }

  const total = qs('#cartTotal');
  if (total) total.textContent = dinero(totalBolsa());
  return detalle;
}
