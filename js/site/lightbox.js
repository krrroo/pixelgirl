// The post detail overlay: image/text, tags, likes, and — for the admin —
// publish/hide, edit and delete.
import { $, html, raw, compact, setHTML, delegate } from '../core/dom.js';
import { parseTags } from '../core/format.js';
import { updatePost, deletePost } from '../data/posts.js';
import { likes } from '../data/likes.js';
import { store } from './store.js';

const POST_TYPES = [
  ['photo', 'photography'],
  ['illustration', 'illustration'],
  ['pixel', 'pixel art'],
  ['writing', 'writing'],
  ['mixed', 'mixed media'],
  ['music', 'music'], // without this, editing a song post silently turned it into a photo
];

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
      'lb-toggle-published': () => this.togglePublished(),
      'lb-edit': () => this.renderEditForm(),
      'lb-save': () => this.saveEdit(),
      'lb-cancel': () => this.open(this.currentId),
      'lb-delete': (btn) => this.delete(btn),
    });
  }

  get post() {
    return store.find(this.currentId);
  }

  open(id) {
    const p = store.find(id);
    if (!p) return;
    this.currentId = p.id;
    setHTML(this.content, view(p, store.isAdmin));
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
    p.likes += p.liked ? 1 : -1;
    likes.set(p.id, p.liked);
    const btn = $('.hbtn', this.content);
    if (btn) {
      btn.classList.toggle('liked', p.liked);
      $('span', btn).textContent = p.likes;
    }
    try {
      await updatePost(p.id, { likes: p.likes });
    } catch (e) {
      console.warn('Like save failed:', e.message);
    }
  }

  async togglePublished() {
    const p = this.post;
    if (!p || !store.isAdmin) return;
    const published = !p.published;
    try {
      await updatePost(p.id, { published });
    } catch (e) {
      alert('update failed: ' + e.message);
      return;
    }
    store.patchPost(p.id, { published });
    this.open(p.id);
  }

  async delete(btn) {
    const p = this.post;
    if (!p || !store.isAdmin) return;
    // two taps: first arms, second deletes
    if (!btn.dataset.armed) {
      btn.dataset.armed = '1';
      btn.textContent = 'confirm delete?';
      return;
    }
    btn.textContent = 'deleting…';
    btn.disabled = true;
    try {
      await deletePost(p.id);
    } catch (e) {
      btn.textContent = 'delete post';
      btn.disabled = false;
      delete btn.dataset.armed;
      alert('delete failed: ' + e.message);
      return;
    }
    this.close();
    store.removePost(p.id);
  }

  renderEditForm() {
    const p = this.post;
    const info = $('.lb-info', this.content);
    if (!p || !info) return;
    setHTML(info, editForm(p));
  }

  async saveEdit() {
    const p = this.post;
    if (!p || !store.isAdmin) return;
    const fields = {
      title: $('#ef-title').value.trim() || 'untitled',
      type: $('#ef-type').value,
      body: $('#ef-body').value.trim(),
      tags: parseTags($('#ef-tags').value),
      published: !$('#ef-draft').checked,
    };
    const fb = $('#ef-fb');
    fb.textContent = 'saving…';
    try {
      await updatePost(p.id, fields);
    } catch (e) {
      fb.textContent = 'error: ' + e.message;
      return;
    }
    store.patchPost(p.id, fields);
    this.open(p.id);
  }
}

// ── templates ────────────────────────────────────────────────────
const draftLabel = html` · <span style="color:var(--accent2)">draft</span>`;

function view(p, isAdmin) {
  const adminBtns = isAdmin
    ? html`<div class="admin-post-btns">
        <button class="pub-btn" data-action="lb-toggle-published">${p.published ? 'hide post' : 'publish post'}</button>
        <button class="edit-btn" data-action="lb-edit">edit post</button>
        <button class="del-btn" data-action="lb-delete">delete post</button>
      </div>`
    : '';
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
      <div class="lb-type">${p.type}${!p.published ? draftLabel : ''}</div>
      <div class="lb-title">${p.title}</div>
      ${playRow}${body}
      <div class="lb-tags">${p.tags.map((t) => html`<span class="lb-tag">#${t}</span>`)}</div>
      <div class="lb-foot">
        <span class="lb-date">${p.date}</span>
        <button class="hbtn${p.liked ? ' liked' : ''}" data-action="lb-like">${raw('&#9825;')} <span>${p.likes}</span></button>
      </div>
      ${adminBtns}
    </div>`);
}

function editForm(p) {
  const noAuto = raw('autocapitalize="none" autocorrect="off"');
  return compact(html`<div class="edit-form">
    <div class="fld"><label>title</label><input type="text" id="ef-title" value="${p.title}" ${noAuto} /></div>
    <div class="fld"><label>type</label>
      <select id="ef-type">
        ${POST_TYPES.map(([v, label]) => html`<option value="${v}"${p.type === v ? raw(' selected') : ''}>${label}</option>`)}
      </select>
    </div>
    <div class="fld"><label>body / caption</label><textarea id="ef-body" ${noAuto}>${p.body}</textarea></div>
    <div class="fld"><label>tags (comma separated)</label><input type="text" id="ef-tags" value="${p.tags.join(', ')}" ${noAuto} /></div>
    <div class="fld-check"><label class="check-label"><input type="checkbox" id="ef-draft"${!p.published ? raw(' checked') : ''} /> save as draft</label></div>
    <div class="admin-post-btns">
      <button class="pub-btn" data-action="lb-save">save changes</button>
      <button class="del-btn" data-action="lb-cancel">cancel</button>
    </div>
    <div class="fbk" id="ef-fb"></div>
  </div>`);
}
