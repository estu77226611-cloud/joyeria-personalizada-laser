/* Arranque común: contador de la bolsa, menú móvil, año del pie y WhatsApp. */

import { iniciarContador } from './carrito.js?v=20261104c';
import { iniciarWhatsAppFlotante } from './whatsapp.js?v=20261104c';
import { qsa, qs } from './ui.js?v=20261104c';

function iniciarMenu() {
  const boton = qs('#menuToggle');
  const nav = qs('#mainNav');
  if (!boton || !nav) return;

  const cerrar = () => {
    nav.classList.remove('open');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Mostrar navegación');
  };

  boton.addEventListener('click', () => {
    const abierto = nav.classList.toggle('open');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Ocultar navegación' : 'Mostrar navegación');
  });

  nav.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) cerrar();
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && nav.classList.contains('open')) {
      cerrar();
      boton.focus();
    }
  });
}

function iniciarAnio() {
  const anio = String(new Date().getFullYear());
  qsa('[data-year]').forEach((nodo) => {
    nodo.textContent = anio;
  });
}

function iniciar() {
  iniciarContador();
  iniciarMenu();
  iniciarWhatsAppFlotante();
  iniciarAnio();
}

iniciar();
