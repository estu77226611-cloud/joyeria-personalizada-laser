/* Comunidad: comentarios locales o públicos (Firestore) y carrusel accesible. */

import {
  agregarComentario,
  borrarComentario,
  esModoDemo,
  observarSesion,
  suscribirComentarios
} from './store.js';
import { aviso, copiarTexto, crear, fechaHora, pedirConfirmacion, qs } from './ui.js';

function iniciar() {
  const formulario = qs('#commentForm');
  const lista = qs('#commentsList');
  if (!formulario || !lista) return;

  const retroalimentacion = qs('#commentFeedback');
  const botonEnviar = formulario.querySelector('button[type="submit"]');
  const gestion = qs('#toggleCommentManager');
  const avisoGestion = qs('#commentManagerNote');
  const anterior = qs('#commentsPrev');
  const siguiente = qs('#commentsNext');
  const contador = qs('#commentsCounter');
  const pista = lista;

  let comentarios = [];
  let esAdmin = esModoDemo;
  let modoGestion = false;
  let indice = 0;
  let detenerSuscripcion = () => {};
  let detenerSesion = () => {};

  function refrescarGestion() {
    if (gestion) {
      gestion.hidden = !esAdmin;
      gestion.setAttribute('aria-pressed', String(modoGestion));
      gestion.textContent = modoGestion
        ? 'Terminar gestión de comentarios'
        : esModoDemo
          ? 'Gestionar comentarios de este navegador'
          : 'Gestionar comentarios publicados';
    }
    if (avisoGestion) {
      avisoGestion.hidden = !(esAdmin && modoGestion);
      if (esAdmin && modoGestion) {
        avisoGestion.textContent = esModoDemo
          ? 'Podrás borrar los comentarios guardados en este navegador. Para moderar comentarios públicos desde otros dispositivos se necesita Firebase Authentication y reglas de Firestore.'
          : 'Los comentarios que borres desaparecerán para todos los visitantes del sitio.';
      }
    }
    pintar();
  }

  function aplicarPermisos(sesion) {
    esAdmin = esModoDemo || Boolean(sesion);
    if (!esAdmin && modoGestion) modoGestion = false;
    refrescarGestion();
  }

  function tarjetas() {
    return [...pista.querySelectorAll('.comment')];
  }

  function actualizarControles() {
    const items = tarjetas();
    if (indice > items.length - 1) indice = Math.max(0, items.length - 1);
    if (anterior) anterior.disabled = items.length <= 1 || indice <= 0;
    if (siguiente) siguiente.disabled = items.length <= 1 || indice >= items.length - 1;
    if (contador) {
      contador.textContent = items.length
        ? `Comentario ${indice + 1} de ${items.length}`
        : 'Aún no hay comentarios';
    }
  }

  function irA(destino, { suave = true } = {}) {
    const items = tarjetas();
    if (!items.length) return;
    indice = Math.max(0, Math.min(items.length - 1, destino));
    const base = items[0].offsetLeft;
    const objetivo = items[indice].offsetLeft - base;
    /* El scroll-snap obligatorio bloquea el desplazamiento programático:
       lo desactivamos brevemente y lo restauramos al terminar. */
    const snapOriginal = pista.style.scrollSnapType;
    pista.style.scrollSnapType = 'none';
    pista.scrollTo({ left: objetivo, behavior: suave ? 'smooth' : 'auto' });
    window.setTimeout(
      () => {
        pista.style.scrollSnapType = snapOriginal;
      },
      suave ? 500 : 0
    );
    actualizarControles();
  }

  function pintar() {
    pista.replaceChildren();
    if (!comentarios.length) {
      pista.append(
        crear('p', {
          class: 'comments-empty',
          text: esModoDemo
            ? 'Aún no hay comentarios. Escribe el primero.'
            : 'Aún no hay comentarios publicados.'
        })
      );
      indice = 0;
      actualizarControles();
      return;
    }

    comentarios.forEach((comentario) => {
      const articulo = crear('article', { class: 'comment' });
      const cabecera = crear(
        'div',
        { class: 'comment__head' },
        crear('b', { text: comentario.nombre }),
        crear('time', {
          class: 'comment__date',
          text: fechaHora(comentario.creado),
          attrs: { datetime: new Date(Number(comentario.creado) || Date.now()).toISOString() }
        })
      );
      articulo.append(cabecera, crear('p', { text: comentario.texto }));

      if (modoGestion && esAdmin) {
        const borrar = crear('button', {
          type: 'button',
          class: 'comment-delete',
          text: 'Eliminar comentario',
          attrs: { 'aria-label': `Eliminar comentario de ${comentario.nombre}` }
        });
        borrar.addEventListener('click', async () => {
          const confirmado = await pedirConfirmacion({
            titulo: 'Eliminar comentario',
            mensaje: esModoDemo
              ? 'Este comentario se borrará de este navegador. ¿Continuar?'
              : 'Este comentario se borrará para todos los visitantes. ¿Continuar?',
            confirmar: 'Sí, eliminar'
          });
          if (!confirmado) return;
          try {
            await borrarComentario(comentario.id);
            aviso(
              esModoDemo
                ? 'Comentario eliminado de este navegador.'
                : 'Comentario eliminado para todos los visitantes.',
              'info'
            );
          } catch (error) {
            aviso(error?.message || 'No se pudo eliminar el comentario.', 'error');
          }
        });
        articulo.append(borrar);
      }
      pista.append(articulo);
    });

    if (indice > comentarios.length - 1) indice = 0;
    actualizarControles();
    window.requestAnimationFrame(() => irA(indice, { suave: false }));
  }

  function iniciarSuscripcion() {
    detenerSuscripcion();
    detenerSuscripcion = suscribirComentarios(
      (nuevos, contexto) => {
        comentarios = nuevos;
        if (!contexto.demo && !esAdmin && avisoGestion) avisoGestion.hidden = true;
        pintar();
      },
      () => {
        if (retroalimentacion) {
          retroalimentacion.textContent =
            'No se pudieron cargar los comentarios públicos. Revisa la configuración y los permisos de Firebase.';
          retroalimentacion.classList.add('form-message--error');
        }
      }
    );
  }

  gestion?.addEventListener('click', () => {
    modoGestion = !modoGestion;
    refrescarGestion();
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nombre = qs('#commentName')?.value || '';
    const texto = qs('#commentText')?.value || '';
    if (!nombre.trim() || !texto.trim()) {
      if (retroalimentacion) {
        retroalimentacion.textContent = 'Escribe tu nombre y tu comentario.';
        retroalimentacion.classList.add('form-message--error');
      }
      return;
    }
    if (botonEnviar) botonEnviar.disabled = true;
    try {
      await agregarComentario({ nombre, texto });
      formulario.reset();
      if (retroalimentacion) {
        retroalimentacion.classList.remove('form-message--error');
        retroalimentacion.textContent = esModoDemo
          ? 'Comentario publicado en este navegador. Activa Firebase para que lo vea toda la comunidad.'
          : 'Comentario publicado para la comunidad.';
      }
      aviso('Comentario publicado.', 'ok');
    } catch (error) {
      if (retroalimentacion) {
        retroalimentacion.textContent =
          error?.message || 'No se pudo publicar el comentario. Inténtalo otra vez.';
        retroalimentacion.classList.add('form-message--error');
      }
    } finally {
      if (botonEnviar) botonEnviar.disabled = false;
    }
  });

  anterior?.addEventListener('click', () => irA(indice - 1));
  siguiente?.addEventListener('click', () => irA(indice + 1));

  pista.addEventListener(
    'scroll',
    () => {
      const items = tarjetas();
      if (!items.length) return;
      const base = items[0].offsetLeft;
      let cercano = 0;
      let distancia = Infinity;
      items.forEach((item, posicion) => {
        const delta = Math.abs(item.offsetLeft - base - pista.scrollLeft);
        if (delta < distancia) {
          distancia = delta;
          cercano = posicion;
        }
      });
      indice = cercano;
      actualizarControles();
    },
    { passive: true }
  );

  pista.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      irA(indice + 1);
    } else if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      irA(indice - 1);
    }
  });

  window.addEventListener('resize', actualizarControles);
  window.addEventListener('beforeunload', () => {
    detenerSuscripcion();
    detenerSesion();
  });

  const compartir = qs('#shareButton');
  compartir?.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Lúmina Joyería', url: window.location.href });
        return;
      }
      const copiado = await copiarTexto(window.location.href);
      compartir.textContent = copiado
        ? '✓ Enlace copiado'
        : 'Comparte la dirección de esta página.';
    } catch {
      /* El usuario canceló la opción de compartir. */
    }
  });

  detenerSesion = observarSesion((sesion) => aplicarPermisos(sesion));

  iniciarSuscripcion();
  pintar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
