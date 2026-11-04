/* Pedidos y checkout: bolsa, validación y creación del pedido con código. */

import {
  ENTREGAS,
  ENVIO_TEXTO,
  dinero,
  entregaPorId,
  urlSeguimiento
} from './config.js?v=20261104b';
import { renderBolsa } from './carrito.js?v=20261104b';
import {
  crearPedido,
  detalleBolsa,
  esModoDemo,
  ultimoPedido,
  vaciarBolsa
} from './store.js?v=20261104b';
import { abrirWhatsApp } from './whatsapp.js?v=20261104b';
import { aviso, copiarTexto, crear, fechaHora, pedirConfirmacion, qs } from './ui.js?v=20261104b';

const OBLIGATORIOS_ENTREGA = new Set(['deliveryDistrito', 'deliveryDireccion', 'deliveryAgencia']);

function iniciar() {
  const contenedor = qs('#cartItems');
  if (!contenedor) return;

  const formulario = qs('#checkoutForm');
  const exito = qs('#orderSuccess');
  const retroalimentacion = qs('#checkoutFeedback');
  const botonEnviar = qs('#checkoutSubmit');
  const selectorEntrega = qs('#deliveryType');
  const botonVaciar = qs('#clearCart');
  const notaDemo = qs('#demoNote');
  const ultimo = ultimoPedido();

  if (notaDemo) notaDemo.hidden = !esModoDemo;

  if (selectorEntrega) {
    selectorEntrega.replaceChildren(
      ...ENTREGAS.map((entrega) => new Option(entrega.label, entrega.id))
    );
  }

  function camposEntrega() {
    if (!selectorEntrega) return null;
    return entregaPorId(selectorEntrega.value);
  }

  function actualizarCamposEntrega() {
    const entrega = camposEntrega();
    document.querySelectorAll('[data-campo]').forEach((grupo) => {
      const campo = grupo.dataset.campo;
      const visible = Boolean(entrega && entrega[campo]);
      grupo.hidden = !visible;
      grupo.querySelectorAll('input, select, textarea').forEach((control) => {
        control.required = visible && OBLIGATORIOS_ENTREGA.has(control.id);
        if (!visible) control.value = '';
      });
    });
    const nota = qs('#envioNota');
    if (nota && entrega) {
      nota.textContent =
        entrega.id === 'recojo'
          ? 'Sin costo de envío: coordinas el recojo por WhatsApp.'
          : `Envío: ${ENVIO_TEXTO}. ${entrega.detalle}`;
    }
  }

  function actualizarBolsa() {
    const detalle = renderBolsa(contenedor, { onCambio: actualizarBolsa });
    const vacia = !detalle || detalle.length === 0;
    if (formulario) formulario.hidden = vacia;
    if (exito) {
      /* No mostramos el formulario ni el éxito si la bolsa quedó vacía
         después de confirmar; el panel de éxito se conserva si está visible. */
      if (vacia && !exito.hidden) {
        /* Se mantiene el resumen del pedido ya creado. */
      }
    }
    if (botonVaciar) botonVaciar.disabled = vacia;
    const resumen = qs('#cartResumen');
    if (resumen) {
      resumen.textContent = vacia
        ? 'Tu bolsa está vacía.'
        : `${detalle.length} ${detalle.length === 1 ? 'línea' : 'líneas'} en tu bolsa.`;
    }
  }

  selectorEntrega?.addEventListener('change', actualizarCamposEntrega);

  botonVaciar?.addEventListener('click', async () => {
    const confirmado = await pedirConfirmacion({
      titulo: 'Vaciar la bolsa',
      mensaje: 'Se quitarán todas las piezas que agregaste. Esta acción no se puede deshacer.',
      confirmar: 'Sí, vaciar'
    });
    if (!confirmado) return;
    vaciarBolsa();
    actualizarBolsa();
    aviso('Bolsa vaciada.', 'info');
  });

  formulario?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (retroalimentacion) {
      retroalimentacion.textContent = '';
      retroalimentacion.classList.remove('form-message--error');
    }

    const nombre = (qs('#customerName')?.value || '').trim();
    const telefono = (qs('#customerPhone')?.value || '').trim();
    const tipo = selectorEntrega?.value || '';
    const entrega = entregaPorId(tipo);
    const distrito = (qs('#deliveryDistrito')?.value || '').trim();
    const direccion = (qs('#deliveryDireccion')?.value || '').trim();
    const referencia = (qs('#deliveryReferencia')?.value || '').trim();
    const agencia = (qs('#deliveryAgencia')?.value || '').trim();
    const notas = (qs('#orderNotes')?.value || '').trim();
    const acepta = Boolean(qs('#acceptPrivacy')?.checked);

    const fallar = (mensaje, selector) => {
      if (retroalimentacion) {
        retroalimentacion.textContent = mensaje;
        retroalimentacion.classList.add('form-message--error');
      }
      qs(selector)?.focus();
    };

    if (nombre.length < 3) return fallar('Escribe tu nombre completo.', '#customerName');
    if (!/^[0-9+()\s-]{6,20}$/.test(telefono)) {
      return fallar('Escribe un teléfono o WhatsApp válido.', '#customerPhone');
    }
    if (!detalleBolsa().length) return fallar('Tu bolsa está vacía.', '#cartItems');
    if (entrega.id === 'delivery' && !distrito) {
      return fallar('Indica el distrito de entrega.', '#deliveryDistrito');
    }
    if (entrega.direccion && !direccion) {
      return fallar('Indica la dirección de entrega.', '#deliveryDireccion');
    }
    if (entrega.agencia && !agencia) {
      return fallar('Indica la agencia de Shalom donde recogerás tu pedido.', '#deliveryAgencia');
    }
    if (!acepta) {
      return fallar('Acepta la política de privacidad para continuar.', '#acceptPrivacy');
    }

    if (botonEnviar) {
      botonEnviar.disabled = true;
      botonEnviar.textContent = 'Registrando pedido…';
    }

    try {
      const pedido = await crearPedido({
        cliente: { nombre, telefono },
        entrega: { tipo, distrito, direccion, referencia, agencia },
        notas
      });
      vaciarBolsa();
      actualizarBolsa();
      mostrarExito(pedido);
      aviso(`Pedido ${pedido.codigo} registrado. Guarda tu código.`, 'ok', 7000);
    } catch (error) {
      if (retroalimentacion) {
        retroalimentacion.textContent =
          error?.message || 'No se pudo registrar el pedido. Inténtalo otra vez.';
        retroalimentacion.classList.add('form-message--error');
      }
    } finally {
      if (botonEnviar) {
        botonEnviar.disabled = false;
        botonEnviar.textContent = 'Confirmar pedido ↗';
      }
    }
  });

  function mostrarExito(pedido) {
    if (!exito) return;
    if (formulario) formulario.hidden = true;
    exito.hidden = false;
    exito.replaceChildren();

    const entrega = entregaPorId(pedido.entrega?.tipo);
    const codigo =
      qs('#orderCode') || crear('strong', { id: 'orderCode', class: 'order-code__value' });
    codigo.textContent = pedido.codigo;

    const copiar = crear('button', {
      type: 'button',
      class: 'button button--outline',
      text: 'Copiar código'
    });
    copiar.addEventListener('click', async () => {
      const ok = await copiarTexto(pedido.codigo);
      copiar.textContent = ok ? '✓ Código copiado' : 'No se pudo copiar';
      aviso(ok ? 'Código copiado.' : 'Copia el código manualmente.', ok ? 'ok' : 'error');
    });

    const enlaceSeguimiento = crear('a', {
      class: 'button dark',
      href: urlSeguimiento(pedido.codigo),
      text: 'Ver seguimiento ↗'
    });

    const mensajeWhatsApp = [
      `Hola, acabo de registrar el pedido ${pedido.codigo} en Lúmina.`,
      `Total referencial: ${dinero(pedido.total)}`,
      `Entrega: ${entrega.label}`,
      '¿Me confirman el pago y el costo de envío, por favor?'
    ].join('\n');

    const botonWhatsApp = crear('button', {
      type: 'button',
      class: 'button light',
      text: 'Coordinar por WhatsApp ↗'
    });
    botonWhatsApp.addEventListener('click', () => abrirWhatsApp(mensajeWhatsApp));

    const lista = crear(
      'ul',
      { class: 'order-success__items' },
      ...pedido.items.map((item) =>
        crear('li', {
          text: `${item.nombre} x${item.cantidad}${item.grabado ? ` · Grabado: ${item.grabado}` : ''} — ${dinero(item.precio * item.cantidad)}`
        })
      )
    );

    exito.append(
      crear('span', { class: 'overline', text: 'PEDIDO REGISTRADO' }),
      crear('h2', {}, 'Guarda tu ', crear('i', { text: 'código.' })),
      crear('p', {
        class: 'order-success__lead',
        text: 'Con este código puedes consultar el estado de tu pedido cuando quieras, sin crear una cuenta.'
      }),
      crear('div', { class: 'order-code' }, codigo, copiar),
      crear(
        'dl',
        { class: 'order-success__meta' },
        crear(
          'div',
          {},
          crear('dt', { text: 'Fecha' }),
          crear('dd', { text: fechaHora(pedido.creado) })
        ),
        crear('div', {}, crear('dt', { text: 'Entrega' }), crear('dd', { text: entrega.label })),
        crear(
          'div',
          {},
          crear('dt', { text: 'Total referencial' }),
          crear('dd', { text: dinero(pedido.total) })
        )
      ),
      lista,
      crear('p', {
        class: 'fineprint',
        text: 'El pedido queda registrado. El pago, el costo de envío y la fecha de entrega se confirman por WhatsApp.'
      }),
      crear('div', { class: 'order-success__actions' }, enlaceSeguimiento, botonWhatsApp)
    );
    exito.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  actualizarCamposEntrega();
  actualizarBolsa();

  /* Enlace al último pedido guardado en este navegador (útil en modo demo). */
  const accesoUltimo = qs('#ultimoPedido');
  if (accesoUltimo && ultimo) {
    accesoUltimo.hidden = false;
    accesoUltimo.href = urlSeguimiento(ultimo);
    accesoUltimo.textContent = `Ver mi último pedido (${ultimo}) →`;
  }

  const consultar = qs('#consultarPedido');
  consultar?.addEventListener('click', () => {
    const codigo = ultimo || '';
    const mensaje = codigo
      ? `Hola, quiero consultar el pedido ${codigo} de Lúmina.`
      : 'Hola, tengo una consulta sobre mi pedido de Lúmina.';
    abrirWhatsApp(mensaje);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
