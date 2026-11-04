/* Utilidades de interfaz compartidas: creación de nodos, avisos, diálogos,
   fechas y copiado al portapapeles. */

export const qs = (selector, raiz = document) => raiz.querySelector(selector);
export const qsa = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

export function crear(etiqueta, propiedades = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(propiedades || {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'class') elemento.className = valor;
    else if (clave === 'text') elemento.textContent = valor;
    else if (clave === 'dataset') Object.assign(elemento.dataset, valor);
    else if (clave === 'attrs') {
      for (const [nombre, dato] of Object.entries(valor)) {
        if (dato !== null && dato !== undefined) elemento.setAttribute(nombre, String(dato));
      }
    } else if (clave.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else if (clave.startsWith('aria-') || clave.startsWith('data-')) {
      elemento.setAttribute(clave, String(valor));
    } else {
      elemento[clave] = valor;
    }
  }
  for (const hijo of hijos.flat(Infinity)) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    elemento.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return elemento;
}

/* Desplaza un elemento a la vista de inmediato.
   El CSS usa `scroll-behavior: smooth`; si esa animación no avanza (pestaña en
   segundo plano, movimiento reducido, equipos lentos), la respuesta puede
   quedarse fuera de la pantalla y parecer que el botón no hizo nada. */
export function desplazarA(elemento, block = 'start') {
  if (!elemento) return;
  const raiz = document.documentElement;
  const anterior = raiz.style.scrollBehavior;
  raiz.style.scrollBehavior = 'auto';
  elemento.scrollIntoView({ block });
  raiz.style.scrollBehavior = anterior;
}

export function escaparHtml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let contenedorAvisos = null;

function obtenerContenedorAvisos() {
  if (contenedorAvisos && contenedorAvisos.isConnected) return contenedorAvisos;
  contenedorAvisos = document.getElementById('toasts');
  if (!contenedorAvisos) {
    contenedorAvisos = crear('div', {
      id: 'toasts',
      class: 'toasts',
      attrs: { 'aria-live': 'polite', 'aria-atomic': 'false' }
    });
    document.body.append(contenedorAvisos);
  }
  return contenedorAvisos;
}

/* tipo: "ok" | "error" | "info" */
export function aviso(mensaje, tipo = 'info', duracion = 4500) {
  if (!mensaje) return;
  const contenedor = obtenerContenedorAvisos();
  const nodo = crear(
    'div',
    { class: `toast toast--${tipo}`, attrs: { role: 'status' } },
    crear('span', { class: 'toast__text', text: mensaje }),
    crear('button', {
      type: 'button',
      class: 'toast__close',
      'aria-label': 'Cerrar aviso',
      text: '×',
      onclick: () => nodo.remove()
    })
  );
  contenedor.append(nodo);
  if (duracion > 0) {
    window.setTimeout(() => nodo.remove(), duracion);
  }
}

/* Diálogo de confirmación accesible basado en <dialog>. */
export function pedirConfirmacion({
  titulo = 'Confirmar acción',
  mensaje = '',
  confirmar = 'Sí, continuar',
  cancelar = 'Cancelar'
} = {}) {
  if (typeof HTMLDialogElement === 'undefined' || !document.body) {
    return Promise.resolve(window.confirm(mensaje || titulo));
  }
  return new Promise((resolver) => {
    const dialogo = crear('dialog', { class: 'modal' });
    let resuelto = false;
    const terminar = (aceptado) => {
      if (resuelto) return;
      resuelto = true;
      if (dialogo.open) dialogo.close();
      dialogo.remove();
      resolver(aceptado);
    };
    const formulario = crear(
      'form',
      { method: 'dialog', class: 'modal__form' },
      crear('h2', { class: 'modal__title', text: titulo }),
      crear('p', { class: 'modal__text', text: mensaje }),
      crear(
        'div',
        { class: 'modal__actions' },
        crear('button', {
          type: 'button',
          class: 'button modal__cancel',
          text: cancelar,
          onclick: () => terminar(false)
        }),
        crear('button', {
          type: 'submit',
          class: 'button dark',
          value: 'confirmar',
          text: confirmar
        })
      )
    );
    /* El evento submit resuelve la promesa sin depender del evento close,
       que algunos navegadores no emiten al cerrar con el formulario. */
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      terminar(evento.submitter?.value === 'confirmar');
    });
    dialogo.append(formulario);
    dialogo.addEventListener('close', () => terminar(dialogo.returnValue === 'confirmar'));
    dialogo.addEventListener('cancel', (evento) => {
      evento.preventDefault();
      terminar(false);
    });
    document.body.append(dialogo);
    dialogo.showModal();
  });
}

export function aFecha(valor) {
  if (!valor) return null;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (valor instanceof Date) return valor;
  if (typeof valor === 'number') return new Date(valor);
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function fechaHora(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return fecha.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

export function fechaCorta(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function copiarTexto(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* Continúa con el método alternativo. */
  }
  try {
    const campo = crear('textarea', {
      value: texto,
      attrs: { readonly: '', 'aria-hidden': 'true' }
    });
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.append(campo);
    campo.select();
    const copiado = document.execCommand('copy');
    campo.remove();
    return copiado;
  } catch {
    return false;
  }
}

export function iniciarCuandoListo(iniciar) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
}
