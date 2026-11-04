/* Tarjeta de producto reutilizable (inicio y catálogo). */

import { dinero } from './config.js?v=20261104b';
import { agregarProducto } from './store.js?v=20261104b';
import { aviso, crear } from './ui.js?v=20261104b';

export function crearTarjeta(producto, { prioridad = false } = {}) {
  const imagen = crear('img', {
    src: producto.imagen,
    alt: producto.nombre,
    width: 500,
    height: 625,
    loading: prioridad ? 'eager' : 'lazy',
    decoding: 'async',
    attrs: { fetchpriority: prioridad ? 'high' : 'auto' }
  });

  const etiqueta = crear('span', { class: 'product-tag', text: producto.etiqueta });

  const enlaceImagen = crear(
    'a',
    {
      class: 'product-image',
      href: `personalizar.html?tipo=${encodeURIComponent(producto.tipo)}&producto=${producto.id}`,
      attrs: { 'aria-label': `Personalizar ${producto.nombre}` }
    },
    imagen,
    etiqueta
  );

  const boton = crear('button', {
    type: 'button',
    text: '+ Agregar a bolsa',
    attrs: { 'aria-label': `Agregar ${producto.nombre} a la bolsa` }
  });
  boton.addEventListener('click', () => {
    agregarProducto({ id: producto.id });
    aviso(`Se agregó «${producto.nombre}» a tu bolsa.`, 'ok');
  });

  return crear(
    'article',
    { class: 'product-card' },
    enlaceImagen,
    crear(
      'div',
      { class: 'product-details' },
      crear(
        'div',
        {},
        crear(
          'h3',
          {},
          crear('a', {
            href: `personalizar.html?tipo=${encodeURIComponent(producto.tipo)}&producto=${producto.id}`,
            text: producto.nombre
          })
        ),
        crear('p', { text: producto.descripcion || 'Personalizable con grabado láser' })
      ),
      crear('strong', { text: dinero(producto.precio) })
    ),
    crear(
      'div',
      { class: 'product-actions' },
      crear('a', {
        href: `personalizar.html?tipo=${encodeURIComponent(producto.tipo)}&producto=${producto.id}`,
        text: 'Personalizar ↗'
      }),
      boton
    )
  );
}
