# Configurar Firebase en Lúmina

El sitio funciona sin configuración con un **modo demostración** guardado en `localStorage`.
Al completar estos pasos, los pedidos, los comentarios y el panel de administración pasan a
usar **Firebase real**: Firestore para los datos y Firebase Authentication para el acceso del
administrador. El plan gratuito **Spark** es suficiente; no se usan Cloud Functions.

> Tiempo estimado: 20–30 minutos. No necesitas tarjeta de crédito.

---

## 1. Crear el proyecto

1. Entra a <https://console.firebase.google.com/> con tu cuenta de Google.
2. **Agregar proyecto** → nombre sugerido: `lumina-joyeria`.
3. Puedes desactivar Google Analytics para simplificar. Crea el proyecto.

## 2. Crear la base de datos Firestore

1. Menú lateral → **Compilación → Firestore Database** → **Crear base de datos**.
2. Elige **Modo de producción** (las reglas del paso 5 controlan el acceso).
3. Ubicación: `southamerica-east1` (São Paulo) es la más cercana a Perú.
4. Espera a que se cree la base.

## 3. Activar Authentication y crear el administrador

1. Menú lateral → **Compilación → Authentication** → **Comenzar**.
2. Pestaña **Sign-in method** → habilita **Correo electrónico/Contraseña**.
3. Pestaña **Users** → **Add user**:
   - Correo: el correo real del administrador (por ejemplo, `admin@lumina.pe`).
   - Contraseña: una contraseña larga y única (mínimo 8 caracteres).
4. Copia el **UID** del usuario creado (columna `User UID`). Lo necesitas en el paso 6.

> No escribas la contraseña en el código ni en GitHub. Se ingresa solo en `admin.html`.

## 4. Obtener la configuración del SDK y pegarla en el sitio

1. Engranaje → **Configuración del proyecto** → pestaña **General**.
2. En **Tus apps**, elige la app web (o crea una con el icono `</>`).
3. Copia los valores y edita `js/firebase-config.js`:

```js
export const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'lumina-joyeria.firebaseapp.com',
  projectId: 'lumina-joyeria',
  appId: '1:1234567890:web:abcdef123456'
};
```

Con esos cuatro campos completos, `js/firebase.js` descarga el SDK modular 11.10.0 desde
`gstatic.com` y el modo demostración se desactiva automáticamente.

## 5. Publicar las reglas de Firestore

1. Firestore → pestaña **Reglas**.
2. Reemplaza todo el contenido con el archivo [`firestore.rules`](firestore.rules) de este repositorio.
3. Pulsa **Publicar**.

Resumen de lo que hacen las reglas:

| Colección          | Lectura                                                       | Escritura                                                   |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `pedidos/{codigo}` | `get` público con el código exacto; `list` solo administrador | crear pedido validado; actualizar/borrar solo administrador |
| `comentarios/{id}` | pública                                                       | crear validado; actualizar/borrar solo administrador        |
| `admins/{uid}`     | solo el propio usuario autenticado                            | nadie desde el cliente (se crea en la consola)              |

El código de pedido (`LUM-` + 8 caracteres) es la llave de consulta, como en Shalom. No se puede
listar la colección sin ser administrador, así que no se pueden adivinar pedidos de otras personas.

## 6. Autorizar al administrador

1. Firestore → **Iniciar colección** → ID de colección: `admins`.
2. ID del documento: pega el **UID** copiado en el paso 3.
3. Campos del documento:
   - `email` (string): el correo del administrador.
   - `nota` (string, opcional): "Administrador del taller".
4. Guarda.

Sin este documento, el usuario puede iniciar sesión con Authentication, pero **no podrá listar
pedidos**: las reglas lo bloquean. Si el panel muestra "No se pudieron cargar los pedidos",
revisa que el documento `admins/{uid}` exista y que el UID coincida.

## 7. Probar el flujo completo

Usa dos navegadores o una ventana privada:

1. **Cliente**: agrega una joya a la bolsa → `pedidos.html` → completa datos → confirma.
   Debe aparecer un código `LUM-XXXXXXXX` y el enlace de seguimiento.
2. **Cliente**: abre `seguimiento.html?codigo=LUM-XXXXXXXX` y comprueba que se ve el estado.
3. **Administrador**: abre `admin.html` → inicia sesión con el correo y la contraseña del paso 3.
   Debe listar el pedido. Cambia el estado a `preparando`, guarda y verifica que el seguimiento
   del cliente se actualiza en tiempo real.
4. **Shalom**: en un pedido con entrega Shalom, escribe el número de guía en el panel. El enlace
   "Rastrear en Shalom" aparecerá en el seguimiento público.
5. **Comentarios**: publica uno desde `comunidad.html` y verifica que se ve en otro navegador.

## 8. Publicar en GitHub Pages

1. Sube los cambios a la rama `main`.
2. Repositorio → **Settings → Pages** → Source: `Deploy from a branch` → `main` / `/ (root)`.
3. Actualiza `SITE_URL` en `js/config.js`, las etiquetas `canonical`/`og:url`, `robots.txt` y
   `sitemap.xml` si cambias de dominio.
4. En Firebase → Authentication → **Settings → Authorized domains**, agrega
   `estu77226611-cloud.github.io` si vas a usar el dominio de GitHub Pages.

## 9. Límites y decisiones de diseño

- **Shalom no tiene API pública** documentada: se guarda el número de guía y se enlaza al rastreo
  oficial <https://rastrea.shalom.pe/>. No hay integración automática de estados.
- El costo de envío no se calcula en línea: **se coordina por WhatsApp**. El total mostrado es
  referencial y no incluye envío.
- El cliente **no crea cuenta**. Solo necesita su código de seguimiento.
- La foto de referencia del personalizador **no se sube** a Firebase (evita costos de Storage);
  se muestra localmente y se comparte por WhatsApp.
- Las reglas no pueden recorrer listas: validan el primer artículo y los límites de la lista.
  La interfaz pinta los datos con `textContent`, por lo que no se interpreta HTML.
- No se usa App Check en esta versión académica. Para producción se recomienda activarlo y
  añadir limitación de solicitudes.

## 10. Problemas frecuentes

| Síntoma                             | Causa probable                            | Solución                                               |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| "No se pudieron cargar los pedidos" | Falta `admins/{uid}` o el UID no coincide | Crear el documento en Firestore                        |
| `auth/operation-not-allowed`        | Correo/contraseña desactivado             | Activarlo en Authentication                            |
| `auth/unauthorized-domain`          | Dominio no autorizado                     | Agregar el dominio en Authentication → Settings        |
| `permission-denied` al crear pedido | Reglas no publicadas o campos extra       | Publicar `firestore.rules` y revisar la consola        |
| El sitio sigue en modo demostración | `js/firebase-config.js` incompleto        | Completar `apiKey`, `authDomain`, `projectId`, `appId` |
| El seguimiento no actualiza         | Suscripción bloqueada por reglas          | Revisar la pestaña Network/Consola del navegador       |

Para volver al modo demostración, deja vacío `js/firebase-config.js`. Los pedidos de prueba
locales seguirán en `localStorage` hasta que limpies los datos del sitio.
