// Small shared UI bits for the admin app: toast messages and tab switching.
import { $, $$ } from '../core/dom.js';

let toastTimer;
export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

const tabOpeners = {}; // view → callback run the first time a tab opens

export function onFirstOpen(view, fn) {
  tabOpeners[view] = fn;
}

export function goToTab(view) {
  $$('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + view));
  // the + button makes image/text posts; on Music it'd cover the last track row
  $('#fab-new').style.display = view === 'music' ? 'none' : '';
  if (tabOpeners[view]) {
    tabOpeners[view]();
    delete tabOpeners[view];
  }
}

export function initTabs() {
  $$('.tab-btn').forEach((btn) => btn.addEventListener('click', () => goToTab(btn.dataset.view)));
}
