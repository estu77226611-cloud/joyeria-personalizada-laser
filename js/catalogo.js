/* Catálogo: filtros con enlace profundo (?tipo=) y URL compartible. */

import { TIPOS, filtrarPorTipo, tipoPorId } from './productos.js?v=20261104c';
import { crearTarjeta } from './producto-card.js?v=20261104c';
import { qs, qsa } from './ui.js?v=20261104c';

const contenedor = qs('#allProducts');
const botones = qsa('[data-filter]');
const contador = qs('#catalogCount');

function tipoDesdeUrl() {
  const tipo = new URLSearchParams(window.location.search).get('tipo');
  return TIPOS.some((elemento) => elemento.id === tipo) ? tipo : 'todos';
}

function pintar(tipo) {
  if (!contenedor) return;
  const productos = filtrarPorTipo(tipo);
  contenedor.replaceChildren(...productos.map((producto) => crearTarjeta(producto)));
  botones.forEach((boton) => {
    const activo = boton.dataset.filter === tipo;
    boton.classList.toggle('active', activo);
    boton.setAttribute('aria-pressed', String(activo));
  });
  if (contador) {
    if (productos.length === 1) {
      contador.textContent = '1 pieza disponible';
    } else {
      const etiqueta =
        tipo === 'todos' ? 'piezas disponibles' : tipoPorId(tipo).label.toLowerCase();
      contador.textContent = `${productos.length} ${etiqueta}`;
    }
  }
}

function aplicar(tipo, { empujar = false } = {}) {
  pintar(tipo);
  const url = new URL(window.location.href);
  if (tipo === 'todos') url.searchParams.delete('tipo');
  else url.searchParams.set('tipo', tipo);
  const metodo = empujar ? 'pushState' : 'replaceState';
  if (url.href !== window.location.href) {
    window.history[metodo]({ tipo }, '', url);
  }
  const titulo = tipo === 'todos' ? 'Catálogo de joyas personalizadas' : tipoPorId(tipo).label;
  document.title = `${titulo} | Lúmina Joyería`;
}

function iniciar() {
  if (!contenedor) return;
  aplicar(tipoDesdeUrl());

  botones.forEach((boton) => {
    boton.addEventListener('click', () => aplicar(boton.dataset.filter, { empujar: true }));
  });

  window.addEventListener('popstate', () => aplicar(tipoDesdeUrl()));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
