# LÚMINA · Joyería personalizada con grabado láser

Sitio web estático (HTML + CSS + módulos ES) para una joyería personalizada. Incluye catálogo,
personalizador, bolsa, registro de pedidos, **seguimiento público por código tipo Shalom**,
comunidad y un panel de administración. Los pedidos privados y su seguimiento público viven en
documentos separados de Firestore.

> Proyecto académico. Los precios, materiales, fotografías y datos legales son referenciales y
> deben confirmarse antes de usarlo con clientes reales.

---

## 1. Cómo abrirlo

Los módulos ES no funcionan abriendo el archivo con doble clic (`file://`). Necesitas un servidor
local o publicar el sitio:

**Opción A — VS Code + Live Server**

1. Abre la carpeta del proyecto en VS Code.
2. Clic derecho en `index.html` → **Open with Live Server**.

**Opción B — Python**

```bash
python -m http.server 5173
```

Abre <http://localhost:5173>.

En Windows, la forma recomendada es hacer doble clic en `servir-local.bat`: cierra
cualquier servidor anterior, arranca `servidor-local.py` y abre solo el panel en
<http://127.0.0.1:5173/admin.html>. Deja esa ventana abierta. El servidor envía
`Cache-Control: no-store`, así que una recarga siempre trae el JavaScript
actualizado.

**No abras los HTML con doble clic** (`file:///...`): el navegador bloquea los
módulos ES y el login no responde. Si lo haces, la página muestra una guía con
el enlace correcto.

**Opción C — Node**

```bash
npm start        # npx serve . -l 5173
```

Para publicar, sube la carpeta a GitHub Pages (rama `main`, carpeta raíz). No requiere compilación.

## 2. Páginas

| Página              | Contenido                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| `index.html`        | Inicio, piezas destacadas, proceso y acceso al seguimiento                      |
| `catalogo.html`     | 18 piezas visibles con filtros: collares, pulseras, anillos, aretes y conjuntos |
| `personalizar.html` | Grabado, acabado, vista previa y envío del diseño por WhatsApp                  |
| `pedidos.html`      | Bolsa, checkout, código de pedido y preguntas frecuentes                        |
| `seguimiento.html`  | Consulta pública por código, línea de tiempo y guía Shalom                      |
| `comunidad.html`    | Comentarios locales o públicos (Firestore) y carrusel accesible                 |
| `admin.html`        | Panel interno: pedidos en tiempo real, estados, guía y notas                    |
| `privacidad.html`   | Política de privacidad y tratamiento de datos                                   |

`admin.html` no aparece en el menú y tiene `noindex`. El acceso real está protegido por Firebase
Authentication y reglas de Firestore.

## 3. Modo demostración vs. Firebase

Sin configurar Firebase, el sitio funciona con **localStorage**:

- Los pedidos, la bolsa y los comentarios viven solo en ese navegador.
- El panel se desbloquea con las credenciales de demostración:

  ```
  Correo:   admin@lumina.pe
  Contraseña: demo1234
  ```

- En el panel aparece el botón **Crear pedido de ejemplo** para probar los estados.
- En `pedidos.html` y `seguimiento.html` se avisa que es modo demostración.

Para usar Firebase real (Firestore + Authentication + reglas), sigue
[`FIREBASE_SETUP.md`](FIREBASE_SETUP.md). Al completar `js/firebase-config.js`, el modo
demostración se desactiva solo.

## 4. Flujo de un pedido

1. El cliente elige una pieza y la personaliza (texto, acabado, nota).
2. La bolsa permite cambiar cantidades, quitar artículos y vaciarla.
3. En `pedidos.html` completa nombre, WhatsApp, tipo de entrega y acepta la privacidad.
4. Al confirmar se genera un código `LUM-XXXXXXXX` (8 caracteres de un alfabeto de 32) y se
   escriben **dos documentos en una sola operación atómica**: `pedidos/{codigo}` (privado) y
   `seguimientos/{codigo}` (público y mínimo).
5. El cliente guarda el código y consulta el avance en `seguimiento.html?codigo=...`.
6. El administrador cambia el estado desde `admin.html`; el seguimiento se actualiza en vivo.
7. El pago, el costo de envío y la fecha se coordinan por WhatsApp.

El documento público de seguimiento solo contiene `codigo`, `creado`, `actualizado`, `estado` e
`historial` con etiquetas de estado. **Nunca** incluye nombre, teléfono, dirección, importes,
grabados ni notas internas.

### Estados

`registrado` → `preparando` → `listo` → `enviado` → `en_transito` → `entregado`

Además existe `cancelado`, que se muestra aparte en la línea de tiempo.

### Entregas

- **Recojo en el taller**: sin costo de envío.
- **Delivery en Lima**: costo coordinado por WhatsApp según el distrito.
- **Shalom (provincias)**: el administrador registra el número de guía en el panel, dentro del
  documento privado del pedido. El seguimiento público solo muestra estado y fechas; el cliente
  coordina el recojo por WhatsApp. Shalom no ofrece API pública, así que no hay actualización
  automática de estados.

## 5. Estructura

```
├─ index.html · catalogo.html · personalizar.html · comunidad.html
├─ pedidos.html · seguimiento.html · admin.html · privacidad.html
├─ css/estilos.css          Estilos del sitio + bloque de mejoras 2026
├─ js/
│  ├─ config.js             Teléfono, URL, estados, entregas, códigos y formato de dinero
│  ├─ productos.js          Catálogo y filtros
│  ├─ store.js              Capa de datos demo/Firebase: bolsa, pedidos, comentarios, auth
│  ├─ firebase.js           Carga diferida del SDK modular
│  ├─ firebase-config.js    Configuración del proyecto (vacía por defecto)
│  ├─ ui.js                 Toasts, diálogo, fechas, copiado y helpers DOM
│  ├─ carrito.js            Contador y renderizado de la bolsa
│  ├─ producto-card.js      Tarjeta reutilizable de producto
│  ├─ main.js               Menú, contador, año y WhatsApp flotante
│  ├─ inicio.js · catalogo.js · personalizar.js
│  ├─ pedidos.js · seguimiento.js · admin.js · comunidad.js
│  └─ whatsapp.js
├─ assets/productos/        Fotografías de referencia
├─ firestore.rules          Reglas de seguridad para Firestore
├─ FIREBASE_SETUP.md        Guía paso a paso de Firebase
├─ robots.txt · sitemap.xml · favicon
└─ package.json             Scripts de servidor y formato
```

## 6. Datos que faltan confirmar

- Precios, materiales y medidas: hoy son **referenciales**. Se editan en `js/productos.js`.
- Número de WhatsApp: `WHATSAPP_NUMERO` en `js/config.js` (actualmente `51936099354`).
- Dominio definitivo: `SITE_URL` en `js/config.js`, etiquetas `canonical`/`og:url`, `robots.txt`
  y `sitemap.xml`.
- Datos legales del negocio (razón social, RUC, dirección, correo): `privacidad.html` y pie.
- Derechos de uso de las 19 fotografías de `assets/productos/`.
- `joya-17.jpg` mide 299×168 px y duplica el modelo de `joya-12`. La pieza está **oculta** en el
  catálogo hasta reemplazar la foto.
- `joya-18` se reclasificó como **aretes**; las piezas 08, 09 y 14 forman la categoría **Conjuntos**.

## 7. Decisiones técnicas

- **Sin cuentas de cliente**: el código del pedido es la llave de consulta. La colección privada
  no se puede leer ni listar sin ser administrador, y el código tiene ~1.1 × 10¹² combinaciones.
- **Dos documentos por pedido**: `pedidos/{codigo}` guarda contacto y dirección para la entrega;
  `seguimientos/{codigo}` es el único documento que se lee sin sesión y solo expone estado,
  fechas e historial. Así el enlace público no filtra datos personales.
- **Autorización de administrador**: después de `signInWithEmailAndPassword`, el sitio consulta
  `admins/{uid}`. Si el documento no existe, cierra la sesión y muestra un error claro; no basta
  con tener una cuenta en Authentication.
- **Firebase Spark**: sin Cloud Functions ni Storage. La foto de referencia no se sube.
- **Módulos ES sin build**: el SDK de Firebase se carga solo si hay configuración, desde
  `https://www.gstatic.com/firebasejs/11.10.0`.
- **Accesibilidad**: foco visible, `skip-link`, toasts con `aria-live`, diálogos `<dialog>`,
  etiquetas asociadas, contraste corregido y respeto a `prefers-reduced-motion`.

## 8. Scripts

```bash
npm install        # instala Prettier (solo desarrollo)
npm start          # servidor local en http://localhost:5173
npm run format     # formatea JS, HTML y Markdown
npm run format:check
```

También puedes validar la sintaxis de los módulos con:

```bash
node --check js/store.js
```

## 9. Verificación rápida antes de entregar

- [ ] `index.html` muestra 6 piezas destacadas y el contador de bolsa funciona.
- [ ] Los filtros del catálogo actualizan la URL (`?tipo=anillo`).
- [ ] El personalizador guarda en la bolsa y el enlace de WhatsApp lleva el mensaje.
- [ ] El checkout valida nombre, teléfono, entrega y privacidad.
- [ ] Al confirmar aparece el código y el enlace al seguimiento.
- [ ] El seguimiento muestra la línea de tiempo y el estado real.
- [ ] El seguimiento público no muestra nombre, teléfono, dirección, importes ni productos.
- [ ] El panel de demostración entra con `admin@lumina.pe` / `demo1234`.
- [ ] En Firebase real, el panel solo entra si existe `admins/{uid}`; si falta, muestra el error.
- [ ] Cambiar el estado en el panel se refleja en el seguimiento.
- [ ] Un administrador autenticado puede borrar comentarios públicos desde `comunidad.html`.
- [ ] La consola del navegador no muestra errores.
- [ ] Lighthouse móvil ≥ 90 en Rendimiento, Accesibilidad y Buenas prácticas.

## 10. Publicar cambios

```bash
git add .
git commit -m "Pedidos con Firebase, seguimiento por código y panel admin"
git push origin main
```

Repositorio: <https://github.com/estu77226611-cloud/joyeria-personalizada-laser>

## 11. Comprobar el acceso al panel

1. Abre `admin.html` desde el servidor local (`http://localhost:5173`) o desde el dominio publicado.
2. Escribe el correo y la contraseña del usuario creado en Firebase Authentication.
3. Si el acceso falla, revisa en este orden:
   - Authentication → **Users**: el usuario existe y el proveedor correo/contraseña está activo.
   - Authentication → **Settings → Authorized domains**: `localhost` y el dominio del sitio.
   - Firestore → colección `admins`: existe un documento cuyo **ID es el UID** del usuario.
   - Firestore → **Reglas**: están publicadas las reglas de `firestore.rules` de este repositorio.
4. El mensaje de error del formulario indica el problema concreto (`unauthorized-domain`,
   `operation-not-allowed`, credenciales incorrectas o falta de `admins/{uid}`).
5. La contraseña solo se cambia en Firebase Authentication; nunca se guarda en el código.
