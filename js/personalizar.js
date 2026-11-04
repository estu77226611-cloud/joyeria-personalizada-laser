/* Personalizador: vista previa, guardado en la bolsa y envío por WhatsApp. */

import { TIPOS, productoParaTipo, productoPorId } from './productos.js?v=20261104c';
import { agregarProducto } from './store.js?v=20261104c';
import { abrirWhatsApp } from './whatsapp.js?v=20261104c';
import { aviso, qs } from './ui.js?v=20261104c';

function iniciar() {
  const formulario = qs('#designForm');
  if (!formulario) return;

  const campoTipo = qs('#jewelType');
  const campoTexto = qs('#engraving');
  const campoAcabado = qs('#finish');
  const campoNota = qs('#designNote');
  const retroalimentacion = qs('#designFeedback');
  const imagen = qs('#previewImage');
  const textoPrevio = qs('#previewText');
  const tipoPrevio = qs('#previewType');
  const acabadoPrevio = qs('#previewFinish');
  const arte = qs('.preview-art');

  if (campoTipo) {
    campoTipo.replaceChildren(
      ...TIPOS.filter((tipo) => tipo.id !== 'todos').map(
        (tipo) => new Option(tipo.label.replace(/s$/, ''), tipo.id)
      )
    );
    /* Etiquetas más naturales para el selector. */
    [...campoTipo.options].forEach((opcion) => {
      const nombres = {
        collar: 'Collar personalizado',
        pulsera: 'Pulsera personalizada',
        anillo: 'Anillo grabado',
        aretes: 'Aretes grabados',
        conjunto: 'Conjunto personalizado'
      };
      opcion.textContent = nombres[opcion.value] || opcion.textContent;
    });
  }

  const parametros = new URLSearchParams(window.location.search);
  const productoUrl = productoPorId(parametros.get('producto'));
  let productoActual = productoUrl && !productoUrl.oculto ? productoUrl : null;

  if (productoActual && campoTipo) {
    campoTipo.value = productoActual.tipo;
  } else {
    const tipoUrl = parametros.get('tipo');
    if (tipoUrl && TIPOS.some((tipo) => tipo.id === tipoUrl) && campoTipo) {
      campoTipo.value = tipoUrl;
    }
    productoActual = productoParaTipo(campoTipo ? campoTipo.value : 'collar');
  }

  function actualizar() {
    if (!productoActual) return;
    if (imagen) {
      imagen.src = productoActual.imagen;
      imagen.alt = `Vista previa de ${productoActual.nombre}`;
      imagen.width = 500;
      imagen.height = 625;
    }
    if (textoPrevio) textoPrevio.textContent = (campoTexto?.value || '').trim() || 'Tu nombre';
    if (tipoPrevio) tipoPrevio.textContent = productoActual.nombre.toUpperCase();
    if (acabadoPrevio) {
      acabadoPrevio.textContent = String(campoAcabado?.value || 'dorado').toUpperCase();
    }
    if (arte) {
      arte.classList.toggle('es-plateado', campoAcabado?.value === 'plateado');
      arte.classList.toggle('es-dorado', campoAcabado?.value !== 'plateado');
    }
  }

  campoTipo?.addEventListener('change', () => {
    productoActual = productoParaTipo(campoTipo.value);
    actualizar();
  });
  campoTexto?.addEventListener('input', actualizar);
  campoAcabado?.addEventListener('change', actualizar);
  campoNota?.addEventListener('input', actualizar);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (!productoActual) return;
    const grabado = (campoTexto?.value || '').trim();
    if (!grabado) {
      if (retroalimentacion) {
        retroalimentacion.textContent =
          'Escribe el nombre, la fecha o el texto que quieres grabar.';
        retroalimentacion.classList.add('form-message--error');
      }
      campoTexto?.focus();
      return;
    }
    agregarProducto({
      id: productoActual.id,
      grabado,
      acabado: campoAcabado?.value || 'dorado',
      nota: (campoNota?.value || '').trim()
    });
    if (retroalimentacion) {
      retroalimentacion.classList.remove('form-message--error');
      retroalimentacion.replaceChildren(
        document.createTextNode('Diseño guardado en tu bolsa. '),
        Object.assign(document.createElement('a'), {
          href: 'pedidos.html',
          className: 'under-link',
          textContent: 'Revisar y confirmar pedido →'
        })
      );
    }
    aviso('Diseño guardado en tu bolsa.', 'ok');
  });

  const botonWhatsApp = qs('#designWhatsApp');
  botonWhatsApp?.addEventListener('click', () => {
    if (!productoActual) return;
    const grabado = (campoTexto?.value || '').trim();
    if (!grabado) {
      aviso('Escribe primero el texto que quieres grabar.', 'error');
      campoTexto?.focus();
      return;
    }
    const mensaje = [
      'Hola, quiero cotizar este diseño de Lúmina:',
      `• Pieza: ${productoActual.nombre}`,
      `• Grabado: ${grabado}`,
      `• Acabado: ${campoAcabado?.value || 'dorado'}`,
      (campoNota?.value || '').trim() ? `• Indicaciones: ${(campoNota?.value || '').trim()}` : '',
      '',
      'Si necesitan una foto de referencia, la envío por este chat.'
    ]
      .filter(Boolean)
      .join('\n');
    abrirWhatsApp(mensaje);
  });

  /* Fotografía de referencia: solo vista previa local. */
  const foto = qs('#referencePhoto');
  const previsualizacion = qs('#referencePreview');
  foto?.addEventListener('change', () => {
    if (!previsualizacion) return;
    previsualizacion.replaceChildren();
    const archivo = foto.files && foto.files[0];
    if (!archivo) return;
    const validos = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      previsualizacion.textContent = 'Elige una imagen PNG, JPG o WEBP de hasta 5 MB.';
      foto.value = '';
      return;
    }
    const nodo = document.createElement('img');
    nodo.alt = 'Vista previa de tu fotografía de referencia';
    nodo.src = URL.createObjectURL(archivo);
    nodo.onload = () => URL.revokeObjectURL(nodo.src);
    previsualizacion.append(nodo);
  });

  actualizar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
