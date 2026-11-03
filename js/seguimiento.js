/* Seguimiento público por código, al estilo Shalom. Sin cuenta de usuario. */

import {
  ESTADOS,
  dinero,
  entregaPorId,
  normalizarCodigo,
  codigoValido,
  urlSeguimiento
} from './config.js';
import { esModoDemo, obtenerPedido, suscribirPedido, ultimoPedido } from './store.js';
import { abrirWhatsApp } from './whatsapp.js';
import { crear, fechaHora, qs } from './ui.js';

const GALERIA_SHALOM = 'https://rastrea.shalom.pe/';

function iniciar() {
  const formulario = qs('#trackingForm');
  const campo = qs('#trackingCode');
  const resultado = qs('#trackingResult');
  if (!formulario || !campo || !resultado) return;

  const retroalimentacion = qs('#trackingFeedback');
  const notaDemo = qs('#trackingDemoNote');
  const accesoUltimo = qs('#trackingUltimo');
  const ultimo = ultimoPedido();

  if (notaDemo) notaDemo.hidden = !esModoDemo;
  if (accesoUltimo && ultimo) {
    accesoUltimo.hidden = false;
    accesoUltimo.href = urlSeguimiento(ultimo);
    accesoUltimo.textContent = `Ver mi último pedido (${ultimo}) →`;
  }

  let detener = () => {};

  function limpiarMensaje() {
    if (!retroalimentacion) return;
    retroalimentacion.textContent = '';
    retroalimentacion.classList.remove('form-message--error');
  }

  function mostrarMensaje(texto, error = false) {
    if (!retroalimentacion) return;
    retroalimentacion.textContent = texto;
    retroalimentacion.classList.toggle('form-message--error', error);
  }

  function estadoActual(pedido) {
    if (pedido.estado === 'cancelado') {
      return { id: 'cancelado', label: 'Pedido cancelado', detalle: 'Este pedido fue cancelado.' };
    }
    return ESTADOS.find((estado) => estado.id === pedido.estado) || ESTADOS[0];
  }

  function historialDe(pedido, estadoId) {
    return (pedido.historial || []).find((entrada) => entrada.estado === estadoId);
  }

  function pintar(pedido) {
    resultado.replaceChildren();
    if (!pedido) {
      resultado.append(
        crear(
          'div',
          { class: 'tracking-empty' },
          crear('h2', {}, 'No encontramos ese ', crear('i', { text: 'pedido.' })),
          crear('p', {
            text: 'Revisa que el código esté completo (por ejemplo, LUM-ABCD2345) o escríbenos por WhatsApp para ayudarte.'
          }),
          crear('a', { class: 'under-link', href: 'pedidos.html', text: 'Volver a mi bolsa →' })
        )
      );
      return;
    }

    const actual = estadoActual(pedido);
    const entrega = entregaPorId(pedido.entrega?.tipo);
    const cancelado = pedido.estado === 'cancelado';

    const cabecera = crear(
      'div',
      { class: 'tracking-head' },
      crear(
        'div',
        {},
        crear('span', { class: 'overline', text: 'PEDIDO' }),
        crear('h2', { class: 'tracking-code', text: pedido.codigo }),
        crear('p', { class: 'tracking-date', text: `Registrado el ${fechaHora(pedido.creado)}` })
      ),
      crear('span', { class: `status-pill status-pill--${actual.id}`, text: actual.label })
    );

    const resumen = crear(
      'dl',
      { class: 'tracking-meta' },
      crear(
        'div',
        {},
        crear('dt', { text: 'Cliente' }),
        crear('dd', { text: pedido.cliente?.nombre || '—' })
      ),
      crear('div', {}, crear('dt', { text: 'Entrega' }), crear('dd', { text: entrega.label })),
      crear(
        'div',
        {},
        crear('dt', { text: 'Total referencial' }),
        crear('dd', { text: dinero(pedido.total) })
      ),
      pedido.entrega?.distrito
        ? crear(
            'div',
            {},
            crear('dt', { text: entrega.agencia ? 'Destino' : 'Distrito' }),
            crear('dd', { text: pedido.entrega.distrito })
          )
        : null,
      pedido.entrega?.agencia
        ? crear(
            'div',
            {},
            crear('dt', { text: 'Agencia' }),
            crear('dd', { text: pedido.entrega.agencia })
          )
        : null
    );

    const linea = crear('ol', { class: 'timeline', attrs: { 'aria-label': 'Estados del pedido' } });

    if (cancelado) {
      linea.append(
        crear(
          'li',
          { class: 'timeline__item is-cancelled' },
          crear('span', { class: 'timeline__dot', attrs: { 'aria-hidden': 'true' } }),
          crear(
            'div',
            {},
            crear('b', { text: 'Pedido cancelado' }),
            crear('p', { text: 'Escríbenos por WhatsApp si necesitas retomar este pedido.' })
          )
        )
      );
    } else {
      ESTADOS.forEach((estado) => {
        const entrada = historialDe(pedido, estado.id);
        /* Solo marcamos los estados por los que el pedido pasó realmente:
           el taller puede saltar de "registrado" a "enviado". */
        const alcanzado = Boolean(entrada);
        const esActual = pedido.estado === estado.id;
        linea.append(
          crear(
            'li',
            {
              class: `timeline__item${alcanzado ? ' is-done' : ''}${esActual ? ' is-current' : ''}`
            },
            crear('span', { class: 'timeline__dot', attrs: { 'aria-hidden': 'true' } }),
            crear(
              'div',
              { class: 'timeline__body' },
              crear('b', { text: estado.label }),
              entrada?.fecha ? crear('time', { text: fechaHora(entrada.fecha) }) : null,
              crear('p', { text: entrada?.nota || estado.detalle })
            )
          )
        );
      });
    }

    const items = crear(
      'ul',
      { class: 'tracking-items' },
      ...(pedido.items || []).map((item) =>
        crear(
          'li',
          {},
          crear('span', { text: `${item.nombre} x${item.cantidad}` }),
          crear('strong', { text: dinero(item.precio * item.cantidad) }),
          item.grabado
            ? crear('small', { text: `Grabado: ${item.grabado} · ${item.acabado}` })
            : null
        )
      )
    );

    const acciones = crear('div', { class: 'tracking-actions' });

    if (pedido.entrega?.tipo === 'shalom') {
      const guia = pedido.entrega.guia;
      acciones.append(
        crear(
          'p',
          { class: 'tracking-guide' },
          crear('b', { text: 'Guía Shalom: ' }),
          crear('span', { text: guia || 'Pendiente de asignar' })
        )
      );
      if (guia) {
        acciones.append(
          crear('a', {
            class: 'button light',
            href: GALERIA_SHALOM,
            target: '_blank',
            rel: 'noopener noreferrer',
            text: 'Rastrear en Shalom ↗'
          })
        );
      }
    }

    const botonWhatsApp = crear('button', {
      type: 'button',
      class: 'button dark',
      text: 'Consultar por WhatsApp ↗'
    });
    botonWhatsApp.addEventListener('click', () =>
      abrirWhatsApp(
        `Hola, quiero consultar el pedido ${pedido.codigo} de Lúmina. El seguimiento indica: ${actual.label}.`
      )
    );
    acciones.append(botonWhatsApp);

    resultado.append(
      cabecera,
      resumen,
      crear('h3', { class: 'tracking-subtitle', text: 'Estado de tu pedido' }),
      linea,
      crear('h3', { class: 'tracking-subtitle', text: 'Detalle' }),
      items,
      pedido.notas
        ? crear('p', { class: 'fineprint', text: `Indicaciones: ${pedido.notas}` })
        : null,
      acciones
    );
  }

  async function buscar(codigo, { actualizarUrl = true } = {}) {
    limpiarMensaje();
    const normalizado = normalizarCodigo(codigo);
    if (!codigoValido(normalizado)) {
      mostrarMensaje('El código debe tener el formato LUM-ABCD2345.', true);
      resultado.replaceChildren();
      campo.focus();
      return;
    }

    campo.value = normalizado;
    if (actualizarUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('codigo', normalizado);
      window.history.replaceState({ codigo: normalizado }, '', url);
    }

    detener();
    resultado.replaceChildren(
      crear('p', { class: 'tracking-loading', text: 'Buscando tu pedido…' })
    );

    /* Una lectura directa da respuesta inmediata; la suscripción mantiene
       el estado actualizado si el taller lo cambia. */
    try {
      const pedido = await obtenerPedido(normalizado);
      pintar(pedido);
      if (!pedido) {
        mostrarMensaje('No encontramos un pedido con ese código. Revísalo o escríbenos.', true);
      }
    } catch {
      mostrarMensaje(
        'No se pudo consultar el pedido. Revisa tu conexión e inténtalo otra vez.',
        true
      );
      resultado.replaceChildren();
    }

    detener = suscribirPedido(
      normalizado,
      (pedido) => {
        if (pedido) pintar(pedido);
      },
      () => {
        /* Si falla la suscripción en tiempo real, la lectura inicial ya mostró el estado. */
      }
    );
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    buscar(campo.value);
  });

  const parametros = new URLSearchParams(window.location.search);
  const codigoUrl = parametros.get('codigo');
  if (codigoUrl) {
    buscar(codigoUrl, { actualizarUrl: false });
  } else {
    resultado.replaceChildren(
      crear(
        'div',
        { class: 'tracking-empty' },
        crear('h2', {}, 'Tu pedido, ', crear('i', { text: 'paso a paso.' })),
        crear('p', {
          text: 'Escribe el código que te dimos al confirmar tu pedido. No necesitas crear una cuenta.'
        })
      )
    );
  }

  window.addEventListener('beforeunload', () => detener());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
