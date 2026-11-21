// The post detail overlay: image/text, tags and likes.
// (Editing lives in the admin app, admin.html.)
import { $, html, raw, compact, setHTML, delegate } from '../core/dom.js';
import { changeLikes } from '../data/posts.js';
import { likes } from '../data/likes.js';
import { store } from './store.js';

export class Lightbox {
  constructor({ onPlay }) {
    this.el = $('#lb');
    this.content = $('#lb-content');
    this.currentId = null;

    // tap on the dark backdrop (not the box) closes
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });
    this.content.addEventListener('dblclick', () => this.like());

    delegate(this.el, 'click', {
      'lb-close': () => this.close(),
      'lb-like': () => this.like(),
      'lb-play': () => onPlay(this.currentId),
    });
  }

  get post() {
    return store.find(this.currentId);
  }

  open(id) {
    const p = store.find(id);
    if (!p) return;
    this.currentId = p.id;
    setHTML(this.content, view(p));
    this.el.classList.add('open');
  }

  close() {
    this.el.classList.remove('open');
    this.currentId = null;
  }

  async like() {
    const p = this.post;
    if (!p) return;
    p.liked = !p.liked;
    p.likes = Math.max(0, p.likes + (p.liked ? 1 : -1));
    likes.set(p.id, p.liked);
    this.renderLikes(p);

    // sample posts (shown when Supabase is down) aren't in the database
    if (store.source !== 'supabase') return;
    try {
      const count = await changeLikes(p.id, p.liked ? 1 : -1);
      // the database count wins — other visitors may have liked meanwhile
      if (typeof count === 'number') {
        p.likes = count;
        if (this.currentId === p.id) this.renderLikes(p);
      }
    } catch (e) {
      console.warn('Like save failed:', e.message);
    }
  }

  renderLikes(p) {
    const btn = $('.hbtn', this.content);
    if (!btn) return;
    btn.classList.toggle('liked', p.liked);
    $('span', btn).textContent = p.likes;
  }
}

function view(p) {
  const playRow = p.audio
    ? html`<div class="lb-play-row">
        <button class="lb-play-btn" data-action="lb-play">${raw('&#9654;')} play in sidebar</button>
      </div>`
    : '';
  // body text keeps its line breaks
  const body = p.body
    ? html`<div class="lb-body${p.type === 'writing' ? ' w' : ''}">${p.body
        .split('\n')
        .map((line, i) => (i ? [raw('<br>'), line] : line))}</div>`
    : '';

  return compact(html`
    ${p.img ? html`<div class="lb-img"><img src="${p.img}" alt="${p.title}" /></div>` : ''}
    <div class="lb-info">
      <div class="lb-type">${p.type}</div>
      <div class="lb-title">${p.title}</div>
      ${playRow}${body}
      <div class="lb-tags">${p.tags.map((t) => html`<span class="lb-tag">#${t}</span>`)}</div>
      <div class="lb-foot">
        <span class="lb-date">${p.date}</span>
        <button class="hbtn${p.liked ? ' liked' : ''}" data-action="lb-like">${raw('&#9825;')} <span>${p.likes}</span></button>
      </div>
    </div>`);
}
