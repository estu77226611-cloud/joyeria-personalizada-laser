/* BOTÓN WHATSAPP: escribe tu número real con código de país, sin + ni espacios.
   Ejemplo de formato para Perú: 51 seguido de 9 dígitos.
   Déjalo vacío hasta tener el número de atención de la joyería. */
const NUMERO_WHATSAPP = '51936099354';
const MENSAJE_WHATSAPP = 'Hola, quisiera información sobre las joyas personalizadas y los pedidos.';

const botonWhatsApp = document.getElementById('whatsappFloat');
const avisoWhatsApp = document.getElementById('whatsappNotice');
if (botonWhatsApp) {
  botonWhatsApp.addEventListener('click', () => {
    if (!/^\d{10,15}$/.test(NUMERO_WHATSAPP)) {
      avisoWhatsApp.hidden = false;
      avisoWhatsApp.textContent = 'WhatsApp aún no está configurado. Escribe el número real en js/whatsapp.js (NUMERO_WHATSAPP).';
      return;
    }
    window.open('https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(MENSAJE_WHATSAPP), '_blank', 'noopener,noreferrer');
  });
}
