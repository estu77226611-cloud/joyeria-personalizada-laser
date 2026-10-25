# LÚMINA — Joyería Personalizada Láser

## Abrir el proyecto
1. Descomprime el ZIP.
2. Abre la carpeta `Joyeria_Laser_Rediseno` en Visual Studio Code.
3. Abre `index.html` en un navegador, o usa la extensión **Live Server** (recomendada).

## Organización para estudiar HTML5
- `index.html`: página de bienvenida.
- `catalogo.html`: catálogo y categorías.
- `personalizar.html`: formulario de diseño y vista previa.
- `comunidad.html`: espacio para comentarios e inspiración.
- `pedidos.html`: bolsa y preguntas frecuentes.
- `css/estilos.css`: todos los estilos visuales y diseño adaptable.
- `js/tienda.js`: productos, filtros, bolsa, formularios y comentarios.
- `assets/`: ilustraciones SVG locales de las joyas.

## Qué puedes modificar
- Productos y precios: arreglo `productos` al inicio de `js/tienda.js`.
- Textos, encabezados y secciones: el archivo HTML de cada página.
- Colores y tipografías: variables `:root` en `css/estilos.css`.
- Ilustraciones: carpeta `assets/`.

## Alcance académico
La vista previa es ilustrativa; el texto del grabado no se integra físicamente sobre la imagen de la pieza. La bolsa y los comentarios se guardan **solo en el navegador** mediante `localStorage`. El catálogo usa precios de referencia. No hay pagos, pedidos reales, envío de WhatsApp, subida de fotos, cuentas ni seguimiento mediante servidor. Para poner la tienda en producción se necesita backend, seguridad, pasarela de pago, contacto real y políticas comerciales.


## Mapa del sitio y botón WhatsApp (actualización)
La página de inicio contiene un directorio con las cuatro categorías del mapa: Catálogo, Personaliza tu joya, Comunidad y Pedidos y ayuda, cada una con sus subopciones.
Botón flotante WhatsApp en TODAS las páginas: abre `js/whatsapp.js` y reemplaza la cadena vacía de `NUMERO_WHATSAPP` por el teléfono real del negocio, con código de país y sin `+`. Ejemplo de FORMATO peruano: `51` + los 9 dígitos del número real. No inventes un teléfono. Hasta configurarlo, el botón muestra un aviso.
La imagen de referencia es solo una vista previa local; no se sube ni se guarda. Pagos, envíos y seguimiento requieren un sistema real.
