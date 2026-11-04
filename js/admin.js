/* Panel de administración: pedidos en tiempo real y cambio de estado. */

import {
  ESTADOS,
  ESTADO_CANCELADO,
  dinero,
  entregaPorId,
  estadoPorId,
  urlSeguimiento
} from './config.js?v=20261104c';
import {
  CREDENCIALES_DEMO_PUBLICAS,
  actualizarPedido,
  crearPedidoEjemplo,
  entrarAdmin,
  esModoDemo,
  observarSesion,
  repararSeguimientos,
  salirAdmin,
  suscribirPedidos
} from './store.js?v=20261104c';
import { aviso, crear, desplazarA, fechaHora, qs } from './ui.js?v=20261104c';

function iniciar() {
  const formulario = qs('#adminLogin');
  const panel = qs('#adminPanel');
  if (!formulario || !panel) return;

  const correo = qs('#adminEmail');
  const clave = qs('#adminPassword');
  const retroalimentacion = qs('#loginFeedback');
  const botonEntrar = qs('#adminSubmit');
  const usuario = qs('#adminUser');
  const salir = qs('#logoutAdmin');
  const lista = qs('#ordersList');
  const buscador = qs('#adminSearch');
  const filtro = qs('#adminFilter');
  const contador = qs('#ordersCount');
  const banner = qs('#adminBanner');
  const semilla = qs('#demoSeed');
  const credenciales = qs('#demoCredentials');

  let pedidos = [];
  let detenerPedidos = () => {};
  let detenerSesion = () => {};
  let reparacionHecha = false;

  if (credenciales && esModoDemo) {
    credenciales.hidden = false;
    credenciales.textContent = `Modo demostración: ${CREDENCIALES_DEMO_PUBLICAS.email} / ${CREDENCIALES_DEMO_PUBLICAS.password}`;
  }
  if (banner && esModoDemo) {
    banner.hidden = false;
  }
  if (semilla) semilla.hidden = !esModoDemo;

  if (filtro) {
    filtro.replaceChildren(
      new Option('Todos los estados', 'todos'),
      ...ESTADOS.map((estado) => new Option(estado.label, estado.id)),
      new Option(ESTADO_CANCELADO.label, ESTADO_CANCELADO.id)
    );
  }

  function mensaje(texto, error = true) {
    if (!retroalimentacion) return;
    retroalimentacion.textContent = texto;
    retroalimentacion.classList.toggle('form-message--error', error);
    // El aviso queda justo debajo del botón. Si el formulario está al final de
    // la pantalla, hay que acercarlo para que la respuesta sea visible.
    if (texto) desplazarA(retroalimentacion, 'center');
  }

  function telefonoWhatsApp(telefono) {
    let numero = String(telefono || '').replace(/\D/g, '');
    if (numero.length === 9) numero = `51${numero}`;
    return numero.length >= 10 ? `https://wa.me/${numero}` : '';
  }

  function crearPedidoCard(pedido) {
    const entrega = entregaPorId(pedido.entrega?.tipo);
    const estado = estadoPorId(pedido.estado);

    const selectEstado = crear(
      'select',
      { class: 'admin-field', attrs: { 'aria-label': `Estado del pedido ${pedido.codigo}` } },
      ...ESTADOS.map((elemento) => {
        const opcion = new Option(elemento.label, elemento.id);
        if (pedido.estado === elemento.id) opcion.selected = true;
        return opcion;
      }),
      (() => {
        const opcion = new Option(ESTADO_CANCELADO.label, ESTADO_CANCELADO.id);
        if (pedido.estado === ESTADO_CANCELADO.id) opcion.selected = true;
        return opcion;
      })()
    );

    const campoGuia = crear('input', {
      class: 'admin-field',
      value: pedido.entrega?.guia || '',
      placeholder: 'N° de guía Shalom (opcional)',
      attrs: { 'aria-label': `Guía Shalom del pedido ${pedido.codigo}`, maxlength: '60' }
    });

    const campoNota = crear('textarea', {
      class: 'admin-field',
      value: pedido.notasAdmin || '',
      rows: 2,
      placeholder: 'Nota para el historial del cliente',
      attrs: { 'aria-label': `Nota del pedido ${pedido.codigo}`, maxlength: '400' }
    });

    const guardar = crear('button', {
      type: 'button',
      class: 'button dark admin-save',
      text: 'Guardar cambios'
    });

    guardar.addEventListener('click', async () => {
      guardar.disabled = true;
      guardar.textContent = 'Guardando…';
      try {
        await actualizarPedido(pedido.codigo, {
          estado: selectEstado.value,
          guia: campoGuia.value,
          notasAdmin: campoNota.value
        });
        aviso(`Pedido ${pedido.codigo} actualizado.`, 'ok');
      } catch (error) {
        aviso(error?.message || 'No se pudo actualizar el pedido.', 'error');
      } finally {
        guardar.disabled = false;
        guardar.textContent = 'Guardar cambios';
      }
    });

    const enlaceSeguimiento = crear('a', {
      class: 'under-link',
      href: urlSeguimiento(pedido.codigo),
      target: '_blank',
      rel: 'noopener',
      text: 'Ver seguimiento ↗'
    });

    const whatsapp = telefonoWhatsApp(pedido.cliente?.telefono);
    const contacto = whatsapp
      ? crear('a', {
          class: 'under-link',
          href: whatsapp,
          target: '_blank',
          rel: 'noopener',
          text: `WhatsApp ${pedido.cliente?.telefono} ↗`
        })
      : crear('span', { class: 'admin-muted', text: pedido.cliente?.telefono || 'Sin teléfono' });

    const items = crear(
      'ul',
      { class: 'admin-items' },
      ...(pedido.items || []).map((item) =>
        crear('li', {
          text: `${item.nombre} x${item.cantidad}${item.grabado ? ` · ${item.grabado}` : ''} · ${dinero(item.precio * item.cantidad)}`
        })
      )
    );

    const historial = crear(
      'details',
      { class: 'admin-history' },
      crear('summary', { text: `Historial (${(pedido.historial || []).length})` }),
      crear(
        'ol',
        {},
        ...(pedido.historial || []).map((entrada) =>
          crear(
            'li',
            {},
            crear('b', { text: estadoPorId(entrada.estado).label }),
            crear('span', { text: ` · ${fechaHora(entrada.fecha)}` }),
            entrada.nota ? crear('p', { text: entrada.nota }) : null
          )
        )
      )
    );

    return crear(
      'article',
      { class: 'admin-order', dataset: { codigo: pedido.codigo, estado: pedido.estado } },
      crear(
        'header',
        { class: 'admin-order__head' },
        crear(
          'div',
          {},
          crear('span', { class: 'admin-order__code', text: pedido.codigo }),
          crear('p', {
            class: 'admin-order__client',
            text: `${pedido.cliente?.nombre || 'Sin nombre'} · ${fechaHora(pedido.creado)}`
          })
        ),
        crear('span', { class: `status-pill status-pill--${estado.id}`, text: estado.label })
      ),
      crear(
        'div',
        { class: 'admin-order__meta' },
        crear('p', {}, crear('b', { text: 'Entrega: ' }), entrega.label),
        crear('p', {}, crear('b', { text: 'Total: ' }), dinero(pedido.total)),
        crear('p', {}, crear('b', { text: 'Contacto: ' }), contacto)
      ),
      items,
      pedido.notas
        ? crear('p', { class: 'admin-order__note', text: `Indicaciones: ${pedido.notas}` })
        : null,
      historial,
      crear(
        'div',
        { class: 'admin-order__controls' },
        crear('label', {}, 'Estado', selectEstado),
        crear('label', {}, 'Guía Shalom', campoGuia),
        crear('label', { class: 'admin-order__wide' }, 'Nota interna', campoNota)
      ),
      crear('div', { class: 'admin-order__actions' }, guardar, enlaceSeguimiento)
    );
  }

  function filtrar() {
    const texto = (buscador?.value || '').trim().toLowerCase();
    const estado = filtro?.value || 'todos';
    const visibles = pedidos.filter((pedido) => {
      const coincideEstado = estado === 'todos' || pedido.estado === estado;
      if (!coincideEstado) return false;
      if (!texto) return true;
      return [pedido.codigo, pedido.cliente?.nombre, pedido.cliente?.telefono]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(texto));
    });

    lista.replaceChildren();
    if (!visibles.length) {
      lista.append(
        crear('p', {
          class: 'admin-empty',
          text: pedidos.length
            ? 'No hay pedidos que coincidan con tu búsqueda.'
            : 'Todavía no hay pedidos registrados.'
        })
      );
    } else {
      visibles.forEach((pedido) => lista.append(crearPedidoCard(pedido)));
    }

    if (contador) {
      contador.textContent = `${visibles.length} de ${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'}`;
    }
    actualizarEstadisticas();
  }

  function actualizarEstadisticas() {
    const total = pedidos.length;
    const preparando = pedidos.filter((pedido) =>
      ['registrado', 'preparando', 'listo'].includes(pedido.estado)
    ).length;
    const entregados = pedidos.filter((pedido) => pedido.estado === 'entregado').length;
    const nodoTotal = qs('#statTotal');
    const nodoPreparando = qs('#statPreparando');
    const nodoEntregados = qs('#statEntregados');
    if (nodoTotal) nodoTotal.textContent = String(total);
    if (nodoPreparando) nodoPreparando.textContent = String(preparando);
    if (nodoEntregados) nodoEntregados.textContent = String(entregados);
  }

  function conectarPedidos() {
    detenerPedidos();
    detenerPedidos = suscribirPedidos(
      (nuevos) => {
        pedidos = nuevos;
        filtrar();
        // Pedidos anteriores a la sincronización pública: se crea su
        // documento de seguimiento para que el código funcione.
        if (!reparacionHecha && nuevos.length > 0) {
          reparacionHecha = true;
          repararSeguimientos(nuevos).catch(() => {});
        }
      },
      () => {
        if (lista) {
          lista.replaceChildren(
            crear('p', {
              class: 'admin-empty',
              text: 'No se pudieron cargar los pedidos. Revisa la configuración de Firebase y las reglas de Firestore.'
            })
          );
        }
      }
    );
  }

  function mostrarPanel(sesion) {
    if (formulario) formulario.hidden = true;
    if (panel) {
      panel.hidden = false;
      // Al ocultar el formulario la página se acorta; sin este ajuste el panel
      // puede quedar por encima del área visible y parecer que no pasó nada.
      desplazarA(panel, 'start');
    }
    if (usuario) usuario.textContent = sesion?.email || 'Administrador';
    conectarPedidos();
  }

  function mostrarLogin() {
    if (formulario) formulario.hidden = false;
    if (panel) panel.hidden = true;
    detenerPedidos();
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mensaje('');
    if (botonEntrar) {
      botonEntrar.disabled = true;
      botonEntrar.textContent = 'Verificando…';
    }
    try {
      const sesion = await entrarAdmin(correo?.value || '', clave?.value || '');
      if (clave) clave.value = '';
      // No esperamos solo a onAuthStateChanged: abrimos el panel con la sesión devuelta.
      if (sesion) mostrarPanel(sesion);
    } catch (error) {
      mensaje(error?.message || 'No se pudo iniciar sesión.');
    } finally {
      if (botonEntrar) {
        botonEntrar.disabled = false;
        botonEntrar.textContent = 'Entrar al panel ↗';
      }
    }
  });

  salir?.addEventListener('click', async () => {
    await salirAdmin();
    aviso('Sesión cerrada.', 'info');
  });

  buscador?.addEventListener('input', filtrar);
  filtro?.addEventListener('change', filtrar);

  semilla?.addEventListener('click', () => {
    try {
      const pedido = crearPedidoEjemplo();
      aviso(`Pedido de ejemplo ${pedido.codigo} creado.`, 'ok');
    } catch (error) {
      aviso(error?.message || 'No se pudo crear el pedido de ejemplo.', 'error');
    }
  });

  detenerSesion = observarSesion((sesion) => {
    if (sesion) mostrarPanel(sesion);
    else mostrarLogin();
  });

  window.addEventListener('beforeunload', () => {
    detenerPedidos();
    detenerSesion();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
