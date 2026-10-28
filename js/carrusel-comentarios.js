/* Navegación horizontal accesible. Funciona con comentarios locales y Firebase. */
document.addEventListener('DOMContentLoaded', () => {
  const pista = document.getElementById('commentsList');
  const anterior = document.getElementById('commentsPrev');
  const siguiente = document.getElementById('commentsNext');
  const contador = document.getElementById('commentsCounter');
  if (!pista || !anterior || !siguiente || !contador) return;

  const tarjetas = () => [...pista.querySelectorAll('.comment')];
  const indiceActual = () => {
    const items = tarjetas();
    if (!items.length) return 0;
    let elegido = 0, distancia = Infinity;
    items.forEach((item, indice) => {
      const delta = Math.abs(item.offsetLeft - pista.offsetLeft - pista.scrollLeft);
      if (delta < distancia) { distancia = delta; elegido = indice; }
    });
    return elegido;
  };
  const actualizar = () => {
    const items = tarjetas();
    const indice = indiceActual();
    anterior.disabled = items.length <= 1 || indice === 0;
    siguiente.disabled = items.length <= 1 || indice === items.length - 1;
    contador.textContent = items.length ? `Comentario ${indice + 1} de ${items.length}` : 'Aún no hay comentarios';
  };
  const mover = paso => {
    const items = tarjetas();
    if (!items.length) return;
    const destino = Math.max(0, Math.min(items.length - 1, indiceActual() + paso));
    pista.scrollTo({left: items[destino].offsetLeft - pista.offsetLeft, behavior:'smooth'});
  };
  anterior.addEventListener('click', () => mover(-1));
  siguiente.addEventListener('click', () => mover(1));
  pista.addEventListener('scroll', actualizar, {passive:true});
  pista.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); mover(e.key === 'ArrowRight' ? 1 : -1); }
  });
  new MutationObserver(() => { pista.scrollLeft = 0; actualizar(); }).observe(pista, {childList:true});
  window.addEventListener('resize', actualizar);
  actualizar();
});
