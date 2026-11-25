export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── safe HTML templates ──────────────────────────────────────────
// html`<p>${userText}</p>` escapes every interpolated value automatically,
// so a forgotten esc() can't open an XSS hole. Templates nest; use raw()
// only for markup written in this codebase (e.g. an entity like '&#9654;').
const RAW = Symbol('raw');

export const raw = (s) => ({ [RAW]: String(s) });

function renderValue(v) {
  if (v === null || v === undefined || v === false) return '';
  if (Array.isArray(v)) return v.map(renderValue).join('');
  if (typeof v === 'object' && RAW in v) return v[RAW];
  return esc(v);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((s, i) => {
    out += s;
    if (i < values.length) out += renderValue(values[i]);
  });
  return raw(out);
}

// Drops whitespace between tags, so multi-line templates render exactly
// like hand-packed markup (matters for inline/flex layouts).
export function compact(template) {
  return raw(renderValue(template).replace(/>\s+</g, '><').trim());
}

export function setHTML(el, template) {
  el.innerHTML = renderValue(template);
}

// ── event delegation ─────────────────────────────────────────────
// Elements declare what they do with data-action="name"; one listener per
// root finds the handler. Replaces inline onclick="someGlobalFunction()".
export function delegate(root, eventType, handlers) {
  root.addEventListener(eventType, (e) => {
    const target = e.target.closest('[data-action]');
    if (!target || !root.contains(target)) return;
    const handler = handlers[target.dataset.action];
    if (handler) handler(target, e);
  });
}

export function onEnter(input, fn) {
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fn();
  });
}
