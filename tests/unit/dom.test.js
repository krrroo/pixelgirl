import { describe, it, expect } from 'vitest';
import { html, raw, compact, setHTML, esc, delegate } from '../../js/core/dom.js';

const render = (tpl) => {
  const el = document.createElement('div');
  setHTML(el, tpl);
  return el.innerHTML;
};

describe('esc', () => {
  it('escapes HTML-significant characters', () => {
    expect(esc(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });
});

describe('html template', () => {
  it('escapes interpolated values', () => {
    const el = document.createElement('div');
    setHTML(el, html`<p>${'<img src=x onerror=alert(1)>'}</p>`);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes quotes inside attributes', () => {
    const el = document.createElement('div');
    setHTML(el, html`<a title="${'" onmouseover="alert(1)'}">x</a>`);
    expect(el.querySelector('a').getAttribute('onmouseover')).toBeNull();
  });

  it('does not double-escape nested templates', () => {
    expect(render(html`<ul>${html`<li>${'a&b'}</li>`}</ul>`)).toBe('<ul><li>a&amp;b</li></ul>');
  });

  it('renders arrays and skips null / false', () => {
    expect(render(html`${['a', 'b']}${null}${false}${undefined}`)).toBe('ab');
  });

  it('renders 0 (falsy but meaningful)', () => {
    expect(render(html`<span>${0}</span>`)).toBe('<span>0</span>');
  });

  it('raw() passes trusted markup through', () => {
    expect(render(html`<b>${raw('&#9654;')}</b>`)).toBe('<b>▶</b>');
  });

  it('compact() removes whitespace between tags only', () => {
    expect(render(compact(html`<p>  <b>a b</b>  </p>`))).toBe('<p><b>a b</b></p>');
  });
});

describe('delegate', () => {
  it('calls the handler named by the closest data-action', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button data-action="go"><span>x</span></button>';
    document.body.appendChild(root);
    const calls = [];
    delegate(root, 'click', { go: (el) => calls.push(el.tagName) });
    root.querySelector('span').click();
    expect(calls).toEqual(['BUTTON']);
    root.remove();
  });
});
