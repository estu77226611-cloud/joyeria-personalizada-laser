/* Configuración central de Lúmina.
   Cambia aquí el teléfono, la URL pública y los estados de los pedidos. */

export const SITE_URL = 'https://estu77226611-cloud.github.io/joyeria-personalizada-laser/';
export const WHATSAPP_NUMERO = '51936099354';
export const WHATSAPP_MENSAJE =
  'Hola, quisiera información sobre las joyas personalizadas y los pedidos.';

export const MONEDA = 'S/';
export const PREFIJO_CODIGO = 'LUM';
export const LONGITUD_CODIGO = 8;
export const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const CLAVES = {
  bolsa: 'lumina_bolsa_v2',
  comentarios: 'lumina_comentarios_v2',
  pedidos: 'lumina_pedidos_v1',
  ultimoPedido: 'lumina_ultimo_pedido',
  sesionDemo: 'lumina_admin_demo'
};

export const ESTADOS = [
  {
    id: 'registrado',
    label: 'Pedido registrado',
    detalle: 'Recibimos tu solicitud y el resumen de tu diseño.'
  },
  {
    id: 'preparando',
    label: 'En preparación',
    detalle: 'Estamos revisando y elaborando tu joya.'
  },
  {
    id: 'listo',
    label: 'Listo',
    detalle: 'Tu pedido está listo para recojo o para el envío.'
  },
  {
    id: 'enviado',
    label: 'Enviado',
    detalle: 'Entregamos tu paquete a Shalom o al servicio de delivery.'
  },
  {
    id: 'en_transito',
    label: 'En tránsito',
    detalle: 'Tu paquete está en camino al destino.'
  },
  {
    id: 'entregado',
    label: 'Entregado',
    detalle: 'Pedido entregado. Gracias por confiar en Lúmina.'
  }
];

export const ESTADO_CANCELADO = {
  id: 'cancelado',
  label: 'Pedido cancelado',
  detalle: 'Este pedido fue cancelado. Escríbenos si necesitas ayuda.'
};

export const ENTREGAS = [
  {
    id: 'recojo',
    label: 'Recojo en el taller',
    detalle: 'Coordinamos el punto y el horario por WhatsApp.',
    direccion: false,
    agencia: false,
    distrito: false
  },
  {
    id: 'delivery',
    label: 'Delivery en Lima',
    detalle: 'El costo se coordina por WhatsApp según el distrito.',
    direccion: true,
    agencia: false,
    distrito: true
  },
  {
    id: 'shalom',
    label: 'Envío por Shalom (provincias)',
    detalle: 'El costo y la agencia se coordinan por WhatsApp.',
    direccion: true,
    agencia: true,
    distrito: true
  }
];

export const ENVIO_TEXTO = 'Se coordina por WhatsApp';
export const PRIVACIDAD_URL = 'privacidad.html';

export function dinero(monto) {
  const valor = Number(monto) || 0;
  return `${MONEDA} ${valor.toFixed(2)}`;
}

export function urlSeguimiento(codigo) {
  const base =
    typeof location !== 'undefined' && /^https?:$/.test(location.protocol)
      ? new URL('seguimiento.html', location.href)
      : new URL('seguimiento.html', SITE_URL);
  if (codigo) base.searchParams.set('codigo', codigo);
  return base.href;
}

export function estadoPorId(id) {
  return ESTADOS.find((estado) => estado.id === id) || ESTADO_CANCELADO;
}

export function indiceEstado(id) {
  return ESTADOS.findIndex((estado) => estado.id === id);
}

export function entregaPorId(id) {
  return ENTREGAS.find((entrega) => entrega.id === id) || ENTREGAS[0];
}

/* Acepta "lum abcd2345", "LUM-ABCD2345" o "ABCD2345" y devuelve "LUM-ABCD2345". */
export function normalizarCodigo(codigo) {
  const limpio = String(codigo || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!limpio) return '';
  if (limpio.length === LONGITUD_CODIGO) return `${PREFIJO_CODIGO}-${limpio}`;
  if (
    limpio.startsWith(PREFIJO_CODIGO) &&
    limpio.length === PREFIJO_CODIGO.length + LONGITUD_CODIGO
  ) {
    return `${PREFIJO_CODIGO}-${limpio.slice(PREFIJO_CODIGO.length)}`;
  }
  return limpio;
}

export function codigoValido(codigo) {
  return new RegExp(`^${PREFIJO_CODIGO}-[${ALFABETO_CODIGO}]{${LONGITUD_CODIGO}}$`).test(
    normalizarCodigo(codigo)
  );
}
