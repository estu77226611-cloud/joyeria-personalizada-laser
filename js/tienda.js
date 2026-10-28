/* LÚMINA — Catálogo, personalización, carrito y comunidad. */
'use strict';

// 1. Productos y precios de ejemplo. Cambia estos datos para editar el catálogo.
const productos = [
  {
    "id": 1,
    "tipo": "collar",
    "nombre": "Collares dorados con dijes",
    "precio": 89,
    "imagen": "assets/productos/joya-01.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 2,
    "tipo": "anillo",
    "nombre": "Anillo brillante plata",
    "precio": 99,
    "imagen": "assets/productos/joya-02.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 3,
    "tipo": "pulsera",
    "nombre": "Pulsera corazón personalizada",
    "precio": 69,
    "imagen": "assets/productos/joya-03.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 4,
    "tipo": "pulsera",
    "nombre": "Pulsera con dijes y nombre",
    "precio": 69,
    "imagen": "assets/productos/joya-04.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 5,
    "tipo": "pulsera",
    "nombre": "Pulsera de corazones",
    "precio": 69,
    "imagen": "assets/productos/joya-05.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 6,
    "tipo": "pulsera",
    "nombre": "Pulsera Amor Fe Paz",
    "precio": 69,
    "imagen": "assets/productos/joya-06.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 7,
    "tipo": "anillo",
    "nombre": "Anillo solitario dorado",
    "precio": 99,
    "imagen": "assets/productos/joya-07.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 8,
    "tipo": "collar",
    "nombre": "Conjunto mariposa en plata",
    "precio": 89,
    "imagen": "assets/productos/joya-08.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 9,
    "tipo": "collar",
    "nombre": "Conjunto turquesa",
    "precio": 89,
    "imagen": "assets/productos/joya-09.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 10,
    "tipo": "collar",
    "nombre": "Collar nombre personalizado",
    "precio": 89,
    "imagen": "assets/productos/joya-10.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 11,
    "tipo": "anillo",
    "nombre": "Anillo piedra rosa",
    "precio": 99,
    "imagen": "assets/productos/joya-11.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 12,
    "tipo": "anillo",
    "nombre": "Argollas para pareja",
    "precio": 99,
    "imagen": "assets/productos/joya-12.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 13,
    "tipo": "pulsera",
    "nombre": "Pulsera luna plata",
    "precio": 69,
    "imagen": "assets/productos/joya-13.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 14,
    "tipo": "collar",
    "nombre": "Cadena y pulsera plata",
    "precio": 89,
    "imagen": "assets/productos/joya-14.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 15,
    "tipo": "pulsera",
    "nombre": "Pulseras estilo delicado",
    "precio": 69,
    "imagen": "assets/productos/joya-15.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 16,
    "tipo": "pulsera",
    "nombre": "Pulsera piedra verde",
    "precio": 69,
    "imagen": "assets/productos/joya-16.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 17,
    "tipo": "anillo",
    "nombre": "Argollas de pareja",
    "precio": 99,
    "imagen": "assets/productos/joya-17.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 18,
    "tipo": "dije",
    "nombre": "Aretes corazón",
    "precio": 59,
    "imagen": "assets/productos/joya-18.jpg",
    "etiqueta": "COLECCIÓN"
  },
  {
    "id": 19,
    "tipo": "anillo",
    "nombre": "Anillo de compromiso dorado",
    "precio": 99,
    "imagen": "assets/productos/joya-19.jpg",
    "etiqueta": "COLECCIÓN"
  }
];
const dinero = monto => `S/ ${monto.toFixed(2)}`;
const seleccionar = selector => document.querySelector(selector);

// 2. Guardamos la bolsa en el navegador del usuario, sin base de datos.
function leerBolsa() {
  try { return JSON.parse(localStorage.getItem('lumina_bolsa_v2')) || []; }
  catch { return []; }
}
function guardarBolsa(bolsa) {
  localStorage.setItem('lumina_bolsa_v2', JSON.stringify(bolsa));
  actualizarContador();
}
function actualizarContador() {
  const contador = seleccionar('#cartCount');
  if (contador) contador.textContent = leerBolsa().length;
}
function agregarProducto(id, grabado = '', acabado = 'dorado', nota = '') {
  const producto = productos.find(item => item.id === id);
  if (!producto) return;
  const bolsa = leerBolsa();
  bolsa.push({ uid: Date.now() + Math.random(), id, grabado, acabado, nota });
  guardarBolsa(bolsa);
  alert(`${producto.nombre} agregado a tu bolsa.`);
}

// 3. Catálogo: botones funcionales y filtros por categoría.
function tarjetaProducto(producto) {
  return `<article class="product-card">
    <div class="product-image"><img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy"><span class="product-tag">${producto.etiqueta}</span></div>
    <div class="product-details"><div><h3>${producto.nombre}</h3><p>Personalizable con grabado láser</p></div><strong>${dinero(producto.precio)}</strong></div>
    <div class="product-actions"><a href="personalizar.html">Personalizar ↗</a><button type="button" data-agregar="${producto.id}">+ Agregar a bolsa</button></div>
  </article>`;
}
function pintarProductos(filtro = 'todos') {
  const catalogo = seleccionar('#allProducts');
  const destacados = seleccionar('#featuredProducts');
  if (catalogo) catalogo.innerHTML = productos.filter(p => filtro === 'todos' || p.tipo === filtro).map(tarjetaProducto).join('');
  if (destacados) destacados.innerHTML = productos.map(tarjetaProducto).join('');
}

// 4. Vista previa: el texto introducido aparece en una etiqueta ilustrativa.
function iniciarDisenador() {
  const formulario = seleccionar('#designForm');
  if (!formulario) return;
  const campoTexto = seleccionar('#engraving');
  const campoTipo = seleccionar('#jewelType');
  const campoAcabado = seleccionar('#finish');
  const actualizar = () => {
    const producto = productos.find(p => p.tipo === campoTipo.value);
    seleccionar('#previewImage').src = producto.imagen;
    seleccionar('#previewImage').alt = producto.nombre;
    seleccionar('#previewText').textContent = campoTexto.value.trim() || 'Tu nombre';
    seleccionar('#previewType').textContent = producto.nombre.toUpperCase();
    seleccionar('#previewFinish').textContent = campoAcabado.value.toUpperCase();
  };
  [campoTexto, campoTipo, campoAcabado].forEach(campo => campo.addEventListener('input', actualizar));
  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const producto = productos.find(p => p.tipo === campoTipo.value);
    const texto = campoTexto.value.trim();
    if (!texto) return;
    const bolsa = leerBolsa();
    bolsa.push({ uid: Date.now() + Math.random(), id: producto.id, grabado: texto, acabado: campoAcabado.value, nota: seleccionar('#designNote').value.trim() });
    guardarBolsa(bolsa);
    seleccionar('#designFeedback').textContent = 'Diseño guardado. Revisa tu bolsa en «Pedidos y ayuda».';
  });
  actualizar();
}

// 5. Comunidad: comentarios locales del navegador (no públicos).
function iniciarComunidad() {
  const formulario = seleccionar('#commentForm');
  if (!formulario) return;
  const lista = seleccionar('#commentsList');
  if (!lista) return;
  function leerComentarios() {
    try { return JSON.parse(localStorage.getItem('lumina_comentarios_v2')) || []; }
    catch { return []; }
  }
  function pintarComentarios() {
    lista.replaceChildren(); // textContent evita insertar HTML escrito por visitantes.
    const comentarios = leerComentarios();
    if (!comentarios.length) { lista.textContent = 'Aún no hay comentarios. Escribe el primero.'; return; }
    comentarios.forEach(item => {
      const contenedor = document.createElement('article');
      contenedor.className = 'comment';
      const nombre = document.createElement('b');
      nombre.textContent = item.nombre;
      const texto = document.createElement('p');
      texto.textContent = item.texto;
      contenedor.append(nombre, texto);
      lista.append(contenedor);
    });
  }
  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const nombre = seleccionar('#commentName').value.trim();
    const texto = seleccionar('#commentText').value.trim();
    if (!nombre || !texto) return;
    const comentarios = leerComentarios();
    comentarios.unshift({ nombre, texto });
    localStorage.setItem('lumina_comentarios_v2', JSON.stringify(comentarios.slice(0, 30)));
    formulario.reset();
    seleccionar('#commentFeedback').textContent = 'Comentario publicado en este navegador. Para que lo vean todos, configura Firebase siguiendo el README.';
    pintarComentarios();
  });
  const compartir = seleccionar('#shareButton');
  compartir.addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Lúmina Joyería', url: window.location.href });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(window.location.href); compartir.textContent = '✓ Enlace copiado'; }
      else compartir.textContent = 'Comparte la dirección de esta página.';
    } catch { /* El usuario canceló la opción para compartir. */ }
  });
  pintarComentarios();
}

// 6. Bolsa: eliminar productos y preparar un texto para consultar (no confirma compras).
function iniciarPedidos() {
  const contenedor = seleccionar('#cartItems');
  if (!contenedor) return;
  function pintarBolsa() {
    const bolsa = leerBolsa();
    contenedor.replaceChildren();
    if (!bolsa.length) {
      contenedor.innerHTML = '<div class="empty-cart"><h3>Tu bolsa está vacía ✳</h3><p>Visita la colección para añadir tu primera joya.</p><a class="under-link" href="catalogo.html">Explorar catálogo →</a></div>';
    } else {
      bolsa.forEach(item => {
        const producto = productos.find(p => p.id === item.id);
        if (!producto) return;
        const fila = document.createElement('article');
        fila.className = 'cart-entry';
        const imagen = document.createElement('img');
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;
        const detalle = document.createElement('div');
        const nombre = document.createElement('h3');
        nombre.textContent = producto.nombre;
        const descripcion = document.createElement('p');
        descripcion.textContent = item.grabado ? `Grabado: ${item.grabado} · ${item.acabado}` : 'Sin personalización especificada';
        const importe = document.createElement('strong');
        importe.textContent = dinero(producto.precio);
        detalle.append(nombre, descripcion, importe);
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = 'Quitar';
        boton.addEventListener('click', () => { guardarBolsa(leerBolsa().filter(x => x.uid !== item.uid)); pintarBolsa(); });
        fila.append(imagen, detalle, boton);
        contenedor.append(fila);
      });
    }
    const total = bolsa.reduce((suma, item) => suma + (productos.find(p => p.id === item.id)?.precio || 0), 0);
    seleccionar('#cartTotal').textContent = dinero(total);
  }
  seleccionar('#clearCart').addEventListener('click', () => { guardarBolsa([]); pintarBolsa(); });
  seleccionar('#copyOrder').addEventListener('click', () => {
    const bolsa = leerBolsa();
    if (!bolsa.length) { seleccionar('#orderFeedback').textContent = 'Primero agrega una joya a tu bolsa.'; return; }
    const resumen = bolsa.map((item, indice) => {
      const producto = productos.find(p => p.id === item.id);
      return `${indice + 1}. ${producto.nombre} - ${dinero(producto.precio)}${item.grabado ? ` | Grabado: ${item.grabado}` : ''} | Acabado: ${item.acabado}${item.nota ? ` | Nota: ${item.nota}` : ''}`;
    }).join('\n');
    const total = bolsa.reduce((suma, item) => suma + (productos.find(p => p.id === item.id)?.precio || 0), 0);
    const mensaje = `Hola, quisiera consultar por estas joyas de Lúmina:\n${resumen}\nTotal referencial: ${dinero(total)}\n¿Podrían confirmarme disponibilidad, el pago y la entrega?`;
    window.open('https://wa.me/51936099354?text=' + encodeURIComponent(mensaje), '_blank', 'noopener,noreferrer');
    seleccionar('#orderFeedback').textContent = 'Se abrió WhatsApp con el resumen. El pedido se confirma al conversar con atención.';
  });
  pintarBolsa();
}

// 7. Iniciar funciones cuando termina de cargar el HTML.
document.addEventListener('DOMContentLoaded', () => {
  actualizarContador();
  pintarProductos();
  document.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-agregar]');
    if (boton) agregarProducto(Number(boton.dataset.agregar));
  });
  document.querySelectorAll('[data-filter]').forEach(boton => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      boton.classList.add('active');
      pintarProductos(boton.dataset.filter);
    });
  });
  const botonMenu = seleccionar('#menuToggle');
  botonMenu?.addEventListener('click', () => {
    const abierto = seleccionar('#mainNav').classList.toggle('open');
    botonMenu.setAttribute('aria-expanded', String(abierto));
  });
  iniciarDisenador();
  iniciarComunidad();
  iniciarPedidos();
});

// Foto opcional: previsualización LOCAL, no se envía a internet ni se guarda.
const fotoReferencia = document.getElementById('referencePhoto');
if (fotoReferencia) {
  fotoReferencia.addEventListener('change', () => {
    const contenedor = document.getElementById('referencePreview');
    contenedor.replaceChildren();
    const archivo = fotoReferencia.files[0];
    if (!archivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      contenedor.textContent = 'Elige una imagen PNG, JPG o WEBP de hasta 5 MB.';
      fotoReferencia.value = '';
      return;
    }
    const img = document.createElement('img');
    img.alt = 'Vista previa de tu fotografía de referencia';
    img.src = URL.createObjectURL(archivo);
    img.onload = () => URL.revokeObjectURL(img.src);
    contenedor.appendChild(img);
  });
}
const consultarWhatsApp = document.getElementById('whatsappOrder');
if (consultarWhatsApp) consultarWhatsApp.addEventListener('click', () => document.getElementById('whatsappFloat')?.click());
