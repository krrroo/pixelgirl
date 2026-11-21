// Page switching (posts / about / login / admin) and the #admin entry point.
import { $, $$, delegate } from '../core/dom.js';
import { store } from './store.js';

export function showPage(name, navLink) {
  $$('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-' + name));
  $$('.nav-links a, .mob-nav a').forEach((a) => a.classList.remove('active'));
  if (navLink) navLink.classList.add('active');
}

// /#admin → the admin panel if signed in, else the login page.
// Call once auth is known.
export function handleHash() {
  if (location.hash === '#admin') showPage(store.isAdmin ? 'admin' : 'login');
}

export function initRouter() {
  delegate(document, 'click', {
    nav: (link, e) => {
      e.preventDefault();
      showPage(link.dataset.page, link.dataset.page === 'admin' ? null : link);
    },
  });

  // admin links only appear when signed in
  store.addEventListener('user', () => {
    $('#nav-admin-link').style.display = store.isAdmin ? 'block' : 'none';
    $('#mob-admin-link').style.display = store.isAdmin ? 'inline' : 'none';
  });

  window.addEventListener('hashchange', handleHash);
}
