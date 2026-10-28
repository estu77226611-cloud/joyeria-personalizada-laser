/* Comentarios públicos opcionales: Firestore.
   Sin configuración, tienda.js mantiene comentarios visibles localmente. */
import { firebaseConfig } from './firebase-config.js';
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
  const { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
  const db = getFirestore(initializeApp(firebaseConfig));
  const form = document.querySelector('#commentForm');
  const list = document.querySelector('#commentsList');
  const feedback = document.querySelector('#commentFeedback');
  const entries = collection(db, 'comentarios');
  // Sustituimos el formulario local por el formulario público: evita doble envío.
  const newForm = form.cloneNode(true);
  form.replaceWith(newForm);
  const render = snap => {
    list.replaceChildren();
    if (snap.empty) { list.textContent='Aún no hay comentarios publicados.'; return; }
    snap.forEach(doc => {
      const data=doc.data();
      const el=document.createElement('article');el.className='comment';
      const name=document.createElement('b');name.textContent=String(data.nombre||'Visitante').slice(0,40);
      const message=document.createElement('p');message.textContent=String(data.texto||'').slice(0,280);
      el.append(name,message);list.append(el);
    });
  };
  onSnapshot(query(entries,orderBy('creado','desc'),limit(50)),render,() => {
    feedback.textContent='No se pueden cargar comentarios públicos. Revisa la configuración y permisos de Firebase.';
  });
  newForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre=newForm.querySelector('#commentName').value.trim();
    const texto=newForm.querySelector('#commentText').value.trim();
    if(!nombre||!texto) return;
    const button=newForm.querySelector('button[type=submit]');button.disabled=true;
    try {await addDoc(entries,{nombre:nombre.slice(0,40),texto:texto.slice(0,280),creado:serverTimestamp()});newForm.reset();feedback.textContent='Comentario publicado para la comunidad.';}
    catch {feedback.textContent='No se pudo publicar. Verifica tu conexión o los permisos de Firebase.';}
    finally{button.disabled=false;}
  });
}
