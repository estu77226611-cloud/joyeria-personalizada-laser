# LÚMINA – Joyería personalizada · versión Web 2.0

## Abrir
Abre la carpeta con Visual Studio Code y utiliza Live Server en `index.html`. Se puede desplegar sin compilación en GitHub Pages.

## Cambios
- 19 fotografías proporcionadas por el propietario del proyecto, optimizadas para la web, en `assets/productos/`. Confirma que tienes permiso de uso/publicación de todas ellas.
- Catálogo con fotografías, filtros, personalizador, carrito, galería y botón WhatsApp.
- WhatsApp mantenido sin modificaciones: `js/whatsapp.js` (51936099354).
- Corregido el error de `comunidad.html`: antes había dos atributos `id` en el mismo elemento; JavaScript no encontraba `commentsList`. Ahora comentarios locales aparecen y persisten tras F5 en el mismo navegador.
- Comentarios públicos Web 2.0 preparados para Firebase Firestore.

## Activar comentarios públicos para todos los usuarios
1. En https://console.firebase.google.com/ crea un proyecto.
2. Agrega una aplicación web y copia la configuración en `js/firebase-config.js` (apiKey, authDomain, projectId, appId).
3. Ve a Firestore Database y crea una base de datos.
4. Publica reglas de Firestore para colección `comentarios` (abajo). Es recomendable configurar también App Check, autenticación, moderación, límites por usuario y supervisión de costos antes de habilitar publicación abierta.
5. Sube estos cambios a GitHub y prueba desde dos navegadores.

Ejemplo de reglas **para pruebas controladas** (NO son protección anti-spam; evita dejarlas abiertas en un sitio público sin medidas adicionales):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /comentarios/{comentarioId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['nombre','texto','creado'])
        && request.resource.data.nombre is string
        && request.resource.data.nombre.size() >= 1
        && request.resource.data.nombre.size() <= 40
        && request.resource.data.texto is string
        && request.resource.data.texto.size() >= 1
        && request.resource.data.texto.size() <= 280
        && request.resource.data.creado == request.time;
      allow update, delete: if false;
    }
  }
}
```

**Nota:** En modo sin Firebase, cada visitante ve solo sus propios comentarios locales. La web puede captar consultas de WhatsApp, pero no procesa pagos ni acredita entregas por sí sola; confirma los pedidos con el cliente. No se recomienda anunciar pagos/envíos como disponibles hasta contar con los mecanismos operativos. Precios del catálogo son referenciales y editables en `js/tienda.js`.

## Actualizar en GitHub
Desde la carpeta del proyecto con Git configurado:
`git add .`
`git commit -m "Actualización diseño y comunidad"`
`git push origin main`

## Corrección de fotografías
Se eliminó una captura de pantalla que por error había sido incluida como `joya-01.jpg`. Las fotografías están ahora asociadas a los productos correspondientes. Para actualizar GitHub, copia esta carpeta sobre tu repositorio local y usa `git add .`, `git commit -m "Corregir fotografías del catálogo"`, `git push origin main`.
