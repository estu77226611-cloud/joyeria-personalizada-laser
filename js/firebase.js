/* Carga diferida del SDK de Firebase.
   Solo se descarga si js/firebase-config.js tiene datos válidos.
   Usamos la versión modular desde gstatic para no necesitar compilación. */

import { firebaseConfig } from './firebase-config.js?v=20261104b';

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0';

export const firebaseConfigurado = Boolean(
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let promesa = null;

export async function cargarFirebase() {
  if (!firebaseConfigurado) return null;
  if (!promesa) {
    promesa = (async () => {
      const [appMod, fs, au] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-firestore.js`),
        import(`${SDK}/firebase-auth.js`)
      ]);
      const app = appMod.initializeApp(firebaseConfig);
      return {
        app,
        db: fs.getFirestore(app),
        auth: au.getAuth(app),
        fs,
        au
      };
    })().catch((error) => {
      promesa = null;
      throw error;
    });
  }
  return promesa;
}

export const COLECCIONES = {
  pedidos: 'pedidos',
  comentarios: 'comentarios',
  admins: 'admins'
};
