/* WhatsApp: un único lugar para construir los enlaces y el botón flotante. */

import { WHATSAPP_MENSAJE, WHATSAPP_NUMERO } from './config.js?v=20261104c';
import { aviso, qs } from './ui.js?v=20261104c';

export function urlWhatsApp(mensaje = WHATSAPP_MENSAJE) {
  const numero = String(WHATSAPP_NUMERO || '').replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(numero)) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function abrirWhatsApp(mensaje = WHATSAPP_MENSAJE) {
  const url = urlWhatsApp(mensaje);
  if (!url) {
    aviso('WhatsApp aún no está configurado. Revisa el número en js/config.js.', 'error');
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function iniciarWhatsAppFlotante() {
  const boton = qs('#whatsappFloat');
  if (!boton) return;
  boton.addEventListener('click', () => abrirWhatsApp());
}
