/* Capa de datos de Lúmina.
   - Sin configuración de Firebase: modo demostración con localStorage.
   - Con configuración: pedidos en Firestore y administración con Firebase Auth.

   Seguridad real: las reglas de firestore.rules impiden listar pedidos y
   limitan la actualización al administrador. El código del pedido es la
   "llave" para consultar el seguimiento, como en Shalom. */

import {
  ALFABETO_CODIGO,
  CLAVES,
  LONGITUD_CODIGO,
  PREFIJO_CODIGO,
  codigoValido,
  estadoPorId,
  normalizarCodigo
} from './config.js';
import { PRODUCTOS_VISIBLES, productoPorId } from './productos.js';
import { cargarFirebase, firebaseConfigurado, COLECCIONES } from './firebase.js';

export const esModoDemo = !firebaseConfigurado;

const ALMACEN = typeof localStorage !== 'undefined' ? localStorage : null;

function leerJson(clave, defecto) {
  if (!ALMACEN) return defecto;
  try {
    const valor = JSON.parse(ALMACEN.getItem(clave));
    return valor ?? defecto;
  } catch {
    return defecto;
  }
}

function guardarJson(clave, valor) {
  if (!ALMACEN) return false;
  try {
    ALMACEN.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function emitir(nombre, detalle) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
}

/* ------------------------------------------------------------------ */
/* Bolsa                                                              */
/* ------------------------------------------------------------------ */

function normalizarItem(item) {
  return {
    uid: item.uid ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: Number(item.id),
    grabado: String(item.grabado || '').slice(0, 60),
    acabado: item.acabado === 'plateado' ? 'plateado' : 'dorado',
    nota: String(item.nota || '').slice(0, 300),
    cantidad: Math.max(1, Math.min(20, Number(item.cantidad) || 1))
  };
}

export function leerBolsa() {
  const guardada = leerJson(CLAVES.bolsa, []);
  if (!Array.isArray(guardada)) return [];
  return guardada.map(normalizarItem).filter((item) => Boolean(productoPorId(item.id)));
}

export function guardarBolsa(bolsa) {
  const limpia = (Array.isArray(bolsa) ? bolsa : [])
    .map(normalizarItem)
    .filter((item) => Boolean(productoPorId(item.id)));
  guardarJson(CLAVES.bolsa, limpia);
  emitir('lumina:bolsa', { bolsa: limpia });
  return limpia;
}

export function agregarProducto({ id, grabado = '', acabado = 'dorado', nota = '', cantidad = 1 }) {
  const producto = productoPorId(id);
  if (!producto) return null;
  const bolsa = leerBolsa();
  const existente = bolsa.find(
    (item) =>
      item.id === Number(id) &&
      item.grabado === String(grabado).slice(0, 60) &&
      item.acabado === acabado &&
      item.nota === String(nota).slice(0, 300)
  );
  if (existente) {
    existente.cantidad = Math.min(20, existente.cantidad + Math.max(1, Number(cantidad) || 1));
  } else {
    bolsa.push(
      normalizarItem({
        uid: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        id,
        grabado,
        acabado,
        nota,
        cantidad
      })
    );
  }
  guardarBolsa(bolsa);
  return producto;
}

export function cambiarCantidad(uid, delta) {
  const bolsa = leerBolsa();
  const item = bolsa.find((elemento) => elemento.uid === uid);
  if (!item) return;
  item.cantidad = Math.max(1, Math.min(20, item.cantidad + Number(delta || 0)));
  guardarBolsa(bolsa);
}

export function quitarProducto(uid) {
  guardarBolsa(leerBolsa().filter((item) => item.uid !== uid));
}

export function vaciarBolsa() {
  guardarBolsa([]);
}

export function contarBolsa(bolsa = leerBolsa()) {
  return bolsa.reduce((suma, item) => suma + item.cantidad, 0);
}

export function totalBolsa(bolsa = leerBolsa()) {
  return bolsa.reduce((suma, item) => {
    const producto = productoPorId(item.id);
    return suma + (producto ? producto.precio * item.cantidad : 0);
  }, 0);
}

export function detalleBolsa(bolsa = leerBolsa()) {
  return bolsa
    .map((item) => {
      const producto = productoPorId(item.id);
      if (!producto) return null;
      return { ...item, producto, subtotal: producto.precio * item.cantidad };
    })
    .filter(Boolean);
}

export function textoBolsa() {
  const detalle = detalleBolsa();
  if (!detalle.length) return '';
  return detalle
    .map((item, indice) => {
      const partes = [
        `${indice + 1}. ${item.producto.nombre} x${item.cantidad} — ${item.producto.precio * item.cantidad}`
      ];
      if (item.grabado) partes.push(`   Grabado: ${item.grabado}`);
      partes.push(`   Acabado: ${item.acabado}`);
      if (item.nota) partes.push(`   Nota: ${item.nota}`);
      return partes.join('\n');
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* Comentarios                                                        */
/* ------------------------------------------------------------------ */

function leerComentariosLocal() {
  const guardados = leerJson(CLAVES.comentarios, []);
  if (!Array.isArray(guardados)) return [];
  return guardados
    .filter((comentario) => comentario && comentario.nombre && comentario.texto)
    .map((comentario) => ({
      id:
        comentario.id ||
        `${comentario.creado || Date.now()}-${Math.random().toString(16).slice(2)}`,
      nombre: String(comentario.nombre).slice(0, 40),
      texto: String(comentario.texto).slice(0, 280),
      creado: comentario.creado || Date.now(),
      demo: true
    }))
    .slice(0, 50);
}

export function suscribirComentarios(alCargar, alFallar) {
  if (esModoDemo) {
    const emitirLocal = () => alCargar(leerComentariosLocal(), { demo: true });
    emitirLocal();
    const alCambiar = () => emitirLocal();
    window.addEventListener('lumina:comentarios', alCambiar);
    window.addEventListener('storage', alCambiar);
    return () => {
      window.removeEventListener('lumina:comentarios', alCambiar);
      window.removeEventListener('storage', alCambiar);
    };
  }

  let detener = () => {};
  let cancelado = false;
  cargarFirebase()
    .then((firebase) => {
      if (!firebase || cancelado) return;
      const { db, fs } = firebase;
      const consulta = fs.query(
        fs.collection(db, COLECCIONES.comentarios),
        fs.orderBy('creado', 'desc'),
        fs.limit(50)
      );
      detener = fs.onSnapshot(
        consulta,
        (instantanea) => {
          const comentarios = instantanea.docs.map((documento) => {
            const datos = documento.data() || {};
            return {
              id: documento.id,
              nombre: String(datos.nombre || 'Visitante').slice(0, 40),
              texto: String(datos.texto || '').slice(0, 280),
              creado: datos.creado || Date.now(),
              demo: false
            };
          });
          alCargar(comentarios, { demo: false });
        },
        (error) => {
          if (alFallar) alFallar(error);
        }
      );
    })
    .catch((error) => {
      if (alFallar) alFallar(error);
    });

  return () => {
    cancelado = true;
    detener();
  };
}

export async function agregarComentario({ nombre, texto }) {
  const limpio = {
    nombre: String(nombre || '')
      .trim()
      .slice(0, 40),
    texto: String(texto || '')
      .trim()
      .slice(0, 280)
  };
  if (!limpio.nombre || !limpio.texto) throw new Error('Escribe tu nombre y tu comentario.');

  if (esModoDemo) {
    const comentarios = leerComentariosLocal();
    comentarios.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...limpio,
      creado: Date.now(),
      demo: true
    });
    guardarJson(CLAVES.comentarios, comentarios.slice(0, 50));
    emitir('lumina:comentarios', {});
    return;
  }

  const firebase = await cargarFirebase();
  const { db, fs } = firebase;
  await fs.addDoc(fs.collection(db, COLECCIONES.comentarios), {
    ...limpio,
    creado: Date.now()
  });
}

export async function borrarComentario(id) {
  if (!esModoDemo) {
    throw new Error('Solo el administrador puede borrar comentarios públicos.');
  }
  const comentarios = leerComentariosLocal().filter((comentario) => comentario.id !== id);
  guardarJson(CLAVES.comentarios, comentarios);
  emitir('lumina:comentarios', {});
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                            */
/* ------------------------------------------------------------------ */

function generarCodigo() {
  const bytes = new Uint8Array(LONGITUD_CODIGO);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let codigo = '';
  for (const byte of bytes) codigo += ALFABETO_CODIGO[byte % ALFABETO_CODIGO.length];
  return `${PREFIJO_CODIGO}-${codigo}`;
}

function leerPedidosDemo() {
  const guardados = leerJson(CLAVES.pedidos, {});
  return guardados && typeof guardados === 'object' && !Array.isArray(guardados) ? guardados : {};
}

function guardarPedidosDemo(pedidos) {
  guardarJson(CLAVES.pedidos, pedidos);
  emitir('lumina:pedidos', {});
}

function normalizarPedido(datos, codigo) {
  const base = datos && typeof datos === 'object' ? datos : {};
  return {
    codigo: normalizarCodigo(base.codigo || codigo),
    creado: base.creado || Date.now(),
    actualizado: base.actualizado || base.creado || Date.now(),
    estado: base.estado || 'registrado',
    historial: Array.isArray(base.historial) ? base.historial : [],
    items: Array.isArray(base.items) ? base.items : [],
    total: Number(base.total) || 0,
    entrega: base.entrega || { tipo: 'recojo' },
    cliente: base.cliente || {},
    notas: String(base.notas || ''),
    notasAdmin: String(base.notasAdmin || '')
  };
}

export async function crearPedido({ cliente, entrega, notas = '' }) {
  const detalle = detalleBolsa();
  if (!detalle.length) throw new Error('Tu bolsa está vacía.');
  if (!cliente || !String(cliente.nombre || '').trim())
    throw new Error('Falta el nombre del cliente.');
  if (!cliente || !String(cliente.telefono || '').trim())
    throw new Error('Falta el teléfono de contacto.');
  if (!entrega || !entrega.tipo) throw new Error('Falta el tipo de entrega.');

  const ahora = Date.now();
  const codigo = generarCodigo();
  const pedido = {
    codigo,
    creado: ahora,
    actualizado: ahora,
    estado: 'registrado',
    historial: [
      {
        estado: 'registrado',
        fecha: ahora,
        nota: 'Pedido recibido. Coordinaremos el pago y la entrega por WhatsApp.'
      }
    ],
    items: detalle.map((item) => ({
      id: item.producto.id,
      nombre: item.producto.nombre,
      precio: item.producto.precio,
      cantidad: item.cantidad,
      grabado: item.grabado,
      acabado: item.acabado,
      nota: item.nota
    })),
    total: detalle.reduce((suma, item) => suma + item.subtotal, 0),
    entrega: {
      tipo: entrega.tipo,
      distrito: String(entrega.distrito || '')
        .trim()
        .slice(0, 80),
      direccion: String(entrega.direccion || '')
        .trim()
        .slice(0, 200),
      referencia: String(entrega.referencia || '')
        .trim()
        .slice(0, 200),
      agencia: String(entrega.agencia || '')
        .trim()
        .slice(0, 120),
      guia: ''
    },
    cliente: {
      nombre: String(cliente.nombre).trim().slice(0, 80),
      telefono: String(cliente.telefono).trim().slice(0, 20)
    },
    notas: String(notas || '')
      .trim()
      .slice(0, 400),
    notasAdmin: ''
  };

  if (esModoDemo) {
    const pedidos = leerPedidosDemo();
    let intento = pedido.codigo;
    let vueltas = 0;
    while (pedidos[intento] && vueltas < 10) {
      intento = generarCodigo();
      vueltas += 1;
    }
    pedido.codigo = intento;
    pedidos[intento] = pedido;
    guardarPedidosDemo(pedidos);
    guardarJson(CLAVES.ultimoPedido, pedido.codigo);
    return pedido;
  }

  const firebase = await cargarFirebase();
  const { db, fs } = firebase;
  let codigoFinal = pedido.codigo;
  for (let intento = 0; intento < 5; intento += 1) {
    const referencia = fs.doc(db, COLECCIONES.pedidos, codigoFinal);
    const existente = await fs.getDoc(referencia);
    if (!existente.exists()) {
      pedido.codigo = codigoFinal;
      await fs.setDoc(referencia, {
        ...pedido,
        creado: fs.serverTimestamp(),
        actualizado: fs.serverTimestamp()
      });
      guardarJson(CLAVES.ultimoPedido, pedido.codigo);
      return pedido;
    }
    codigoFinal = generarCodigo();
  }
  throw new Error('No se pudo generar un código único. Inténtalo otra vez.');
}

export async function obtenerPedido(codigo) {
  const normalizado = normalizarCodigo(codigo);
  if (!codigoValido(normalizado)) return null;

  if (esModoDemo) {
    const pedidos = leerPedidosDemo();
    return pedidos[normalizado] ? normalizarPedido(pedidos[normalizado], normalizado) : null;
  }

  const firebase = await cargarFirebase();
  const { db, fs } = firebase;
  const instantanea = await fs.getDoc(fs.doc(db, COLECCIONES.pedidos, normalizado));
  return instantanea.exists() ? normalizarPedido(instantanea.data(), normalizado) : null;
}

export function suscribirPedido(codigo, alCambiar, alFallar) {
  const normalizado = normalizarCodigo(codigo);
  if (!codigoValido(normalizado)) {
    alCambiar(null);
    return () => {};
  }

  if (esModoDemo) {
    const emitirPedido = () => {
      const pedidos = leerPedidosDemo();
      alCambiar(pedidos[normalizado] ? normalizarPedido(pedidos[normalizado], normalizado) : null);
    };
    emitirPedido();
    const alGuardar = () => emitirPedido();
    window.addEventListener('lumina:pedidos', alGuardar);
    window.addEventListener('storage', alGuardar);
    return () => {
      window.removeEventListener('lumina:pedidos', alGuardar);
      window.removeEventListener('storage', alGuardar);
    };
  }

  let detener = () => {};
  let cancelado = false;
  cargarFirebase()
    .then((firebase) => {
      if (!firebase || cancelado) return;
      const { db, fs } = firebase;
      detener = fs.onSnapshot(
        fs.doc(db, COLECCIONES.pedidos, normalizado),
        (instantanea) => {
          alCambiar(
            instantanea.exists() ? normalizarPedido(instantanea.data(), normalizado) : null
          );
        },
        (error) => {
          if (alFallar) alFallar(error);
        }
      );
    })
    .catch((error) => {
      if (alFallar) alFallar(error);
    });

  return () => {
    cancelado = true;
    detener();
  };
}

export function suscribirPedidos(alCambiar, alFallar) {
  if (esModoDemo) {
    const emitirPedidos = () => {
      const pedidos = Object.values(leerPedidosDemo())
        .map((pedido) => normalizarPedido(pedido, pedido.codigo))
        .sort((a, b) => Number(b.creado) - Number(a.creado));
      alCambiar(pedidos);
    };
    emitirPedidos();
    const alGuardar = () => emitirPedidos();
    window.addEventListener('lumina:pedidos', alGuardar);
    window.addEventListener('storage', alGuardar);
    return () => {
      window.removeEventListener('lumina:pedidos', alGuardar);
      window.removeEventListener('storage', alGuardar);
    };
  }

  let detener = () => {};
  let cancelado = false;
  cargarFirebase()
    .then((firebase) => {
      if (!firebase || cancelado) return;
      const { db, fs } = firebase;
      const consulta = fs.query(
        fs.collection(db, COLECCIONES.pedidos),
        fs.orderBy('creado', 'desc'),
        fs.limit(200)
      );
      detener = fs.onSnapshot(
        consulta,
        (instantanea) => {
          alCambiar(
            instantanea.docs.map((documento) => normalizarPedido(documento.data(), documento.id))
          );
        },
        (error) => {
          if (alFallar) alFallar(error);
        }
      );
    })
    .catch((error) => {
      if (alFallar) alFallar(error);
    });

  return () => {
    cancelado = true;
    detener();
  };
}

export async function actualizarPedido(codigo, { estado, guia, notasAdmin } = {}) {
  const normalizado = normalizarCodigo(codigo);
  if (!codigoValido(normalizado)) throw new Error('Código de pedido inválido.');
  const estadoFinal = estado ? estadoPorId(estado).id : null;
  if (estado && estadoFinal !== estado && estado !== 'cancelado') {
    throw new Error('Estado de pedido inválido.');
  }

  if (esModoDemo) {
    const pedidos = leerPedidosDemo();
    const actual = pedidos[normalizado];
    if (!actual) throw new Error('El pedido no existe.');
    const pedido = normalizarPedido(actual, normalizado);
    const antes = pedido.estado;
    const ahora = Date.now();
    if (estado && estado !== antes) {
      pedido.estado = estado;
      pedido.historial = [
        ...pedido.historial,
        {
          estado,
          fecha: ahora,
          nota: String(notasAdmin || '').slice(0, 400) || `Estado: ${estadoPorId(estado).label}`
        }
      ];
    }
    if (typeof guia === 'string') pedido.entrega.guia = guia.trim().slice(0, 60);
    if (typeof notasAdmin === 'string') pedido.notasAdmin = notasAdmin.trim().slice(0, 400);
    pedido.actualizado = ahora;
    pedidos[normalizado] = pedido;
    guardarPedidosDemo(pedidos);
    return pedido;
  }

  const firebase = await cargarFirebase();
  const { db, fs } = firebase;
  const referencia = fs.doc(db, COLECCIONES.pedidos, normalizado);
  const instantanea = await fs.getDoc(referencia);
  if (!instantanea.exists()) throw new Error('El pedido no existe.');
  const pedido = normalizarPedido(instantanea.data(), normalizado);
  const antes = pedido.estado;
  const ahora = Date.now();
  const cambios = { actualizado: fs.serverTimestamp() };

  if (estado && estado !== antes) {
    cambios.estado = estado;
    cambios.historial = [
      ...pedido.historial,
      {
        estado,
        fecha: ahora,
        nota: String(notasAdmin || '').slice(0, 400) || `Estado: ${estadoPorId(estado).label}`
      }
    ];
  }
  if (typeof guia === 'string') cambios['entrega.guia'] = guia.trim().slice(0, 60);
  if (typeof notasAdmin === 'string') cambios.notasAdmin = notasAdmin.trim().slice(0, 400);

  await fs.updateDoc(referencia, cambios);
  return normalizarPedido(
    {
      ...pedido,
      ...(cambios.estado ? { estado: cambios.estado, historial: cambios.historial } : {}),
      ...(typeof guia === 'string' ? { entrega: { ...pedido.entrega, guia: guia.trim() } } : {}),
      ...(typeof notasAdmin === 'string' ? { notasAdmin: notasAdmin.trim() } : {}),
      actualizado: ahora
    },
    normalizado
  );
}

export function crearPedidoEjemplo() {
  if (!esModoDemo) throw new Error('Solo disponible en modo demostración.');
  const ahora = Date.now();
  const codigo = generarCodigo();
  const elegidos = PRODUCTOS_VISIBLES.slice(0, 2);
  const pedido = {
    codigo,
    creado: ahora,
    actualizado: ahora,
    estado: 'preparando',
    historial: [
      { estado: 'registrado', fecha: ahora - 3600000, nota: 'Pedido recibido.' },
      { estado: 'preparando', fecha: ahora, nota: 'Pedido de ejemplo para probar el panel.' }
    ],
    items: elegidos.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      grabado: 'Andrea',
      acabado: 'dorado',
      nota: ''
    })),
    total: elegidos.reduce((suma, producto) => suma + producto.precio, 0),
    entrega: {
      tipo: 'shalom',
      distrito: 'Arequipa',
      direccion: 'Av. Ejemplo 123',
      referencia: 'Frente al parque',
      agencia: 'Shalom Arequipa Centro',
      guia: ''
    },
    cliente: { nombre: 'Cliente de ejemplo', telefono: '999888777' },
    notas: 'Pedido de ejemplo creado desde el panel de administración.',
    notasAdmin: ''
  };
  const pedidos = leerPedidosDemo();
  pedidos[codigo] = pedido;
  guardarPedidosDemo(pedidos);
  guardarJson(CLAVES.ultimoPedido, codigo);
  return pedido;
}

/* ------------------------------------------------------------------ */
/* Administración                                                     */
/* ------------------------------------------------------------------ */

const CREDENCIALES_DEMO = { email: 'admin@lumina.pe', password: 'demo1234' };

function leerSesionDemo() {
  return leerJson(CLAVES.sesionDemo, null);
}

export function observarSesion(alCambiar) {
  if (esModoDemo) {
    const emitir = () => alCambiar(leerSesionDemo());
    emitir();
    const alGuardar = () => emitir();
    window.addEventListener('lumina:sesion', alGuardar);
    window.addEventListener('storage', alGuardar);
    return () => {
      window.removeEventListener('lumina:sesion', alGuardar);
      window.removeEventListener('storage', alGuardar);
    };
  }

  let detener = () => {};
  let cancelado = false;
  cargarFirebase()
    .then((firebase) => {
      if (!firebase || cancelado) return;
      const { auth, au } = firebase;
      detener = au.onAuthStateChanged(auth, (usuario) => {
        alCambiar(usuario ? { email: usuario.email, uid: usuario.uid, demo: false } : null);
      });
    })
    .catch(() => alCambiar(null));

  return () => {
    cancelado = true;
    detener();
  };
}

export async function entrarAdmin(email, password) {
  const correo = String(email || '').trim();
  const clave = String(password || '');
  if (!correo || !clave) throw new Error('Escribe tu correo y tu contraseña.');

  if (esModoDemo) {
    if (correo.toLowerCase() !== CREDENCIALES_DEMO.email || clave !== CREDENCIALES_DEMO.password) {
      throw new Error('Credenciales de demostración incorrectas. Usa las credenciales indicadas.');
    }
    const sesion = { email: CREDENCIALES_DEMO.email, demo: true, desde: Date.now() };
    guardarJson(CLAVES.sesionDemo, sesion);
    emitir('lumina:sesion', sesion);
    return sesion;
  }

  const firebase = await cargarFirebase();
  const { auth, au } = firebase;
  try {
    const credencial = await au.signInWithEmailAndPassword(auth, correo, clave);
    return { email: credencial.user.email, uid: credencial.user.uid, demo: false };
  } catch (error) {
    const codigo = error && error.code ? error.code : '';
    if (
      codigo === 'auth/invalid-credential' ||
      codigo === 'auth/wrong-password' ||
      codigo === 'auth/user-not-found'
    ) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    if (codigo === 'auth/too-many-requests') {
      throw new Error('Demasiados intentos. Espera unos minutos e inténtalo otra vez.');
    }
    if (codigo === 'auth/network-request-failed') {
      throw new Error('No hay conexión con Firebase. Revisa tu internet.');
    }
    throw new Error('No se pudo iniciar sesión. Revisa la configuración de Firebase.');
  }
}

export async function salirAdmin() {
  if (esModoDemo) {
    guardarJson(CLAVES.sesionDemo, null);
    emitir('lumina:sesion', null);
    return;
  }
  const firebase = await cargarFirebase();
  await firebase.au.signOut(firebase.auth);
}

export const CREDENCIALES_DEMO_PUBLICAS = CREDENCIALES_DEMO;

export function ultimoPedido() {
  return leerJson(CLAVES.ultimoPedido, '');
}
