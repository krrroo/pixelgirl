// Page switching (posts / about / set-password).
import { $$, delegate } from '../core/dom.js';

export function showPage(name, navLink) {
  $$('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-' + name));
  $$('.nav-links a, .mob-nav a').forEach((a) => a.classList.remove('active'));
  if (navLink) navLink.classList.add('active');
}

export function initRouter() {
  delegate(document, 'click', {
    nav: (link, e) => {
      e.preventDefault();
      showPage(link.dataset.page, link);
    },
  });
}
