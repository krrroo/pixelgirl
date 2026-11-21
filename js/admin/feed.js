// Feed tab: every post as a card. Swipe left (or tap Edit) to edit/delete.
import { $, html, setHTML } from '../core/dom.js';
import { monthDay } from '../core/format.js';
import { listRows, deletePost } from '../data/posts.js';
import { toast, goToTab } from './ui.js';

let openComposer = () => {};

export function initFeed({ onEdit }) {
  openComposer = onEdit;
}

export async function loadFeed() {
  const list = $('#feed-list');
  setHTML(list, html`<div class="empty-state">Loading…</div>`);
  let rows;
  try {
    rows = await listRows();
  } catch (e) {
    setHTML(
      list,
      html`<div class="empty-state">Couldn't load posts.<br /><span style="font-size:12px">${e.message}</span></div>`,
    );
    return;
  }
  if (!rows.length) {
    setHTML(list, html`<div class="empty-state"><div class="glyph">✦</div>No posts yet. Tap + to add one.</div>`);
    return;
  }
  list.innerHTML = '';
  rows.forEach((row) => list.appendChild(card(row)));
}

function card(post) {
  const el = document.createElement('div');
  el.className = 'post-card';
  // music posts carry their title in `title`, not `body`
  const caption = post.type === 'music' ? '♪ ' + (post.title || 'untitled') : post.body || '';
  setHTML(
    el,
    html`<div class="swipe-wrap">
      <div class="post-content">
        ${post.img_url ? html`<div class="post-media"><img src="${post.img_url}" loading="lazy" /></div>` : ''}
        <div class="post-body">
          <span class="type-pill">${post.type || 'photo'}</span>
          <div class="post-caption">${caption}</div>
          <div class="post-meta">
            <span>${monthDay(post.created_at)}${post.published === false ? html` · <span class="draft-tag">draft</span>` : ''}</span>
            <span class="likes">♥ ${post.likes || 0}</span>
            <span class="edit-link">Edit</span>
          </div>
        </div>
      </div>
      <button class="swipe-action swipe-edit">Edit</button>
      <button class="swipe-action swipe-delete">Delete</button>
    </div>`,
  );

  const wrap = el.querySelector('.swipe-wrap');
  attachSwipe(wrap);
  // music posts are managed in the Music tab — the composer only knows images/text
  const edit = post.type === 'music' ? () => goToTab('music') : () => openComposer(post);
  el.querySelector('.swipe-edit').addEventListener('click', edit);
  el.querySelector('.edit-link').addEventListener('click', edit);
  el.querySelector('.swipe-delete').addEventListener('click', () => remove(post, el));
  return el;
}

function attachSwipe(wrap) {
  let startX = 0;
  let dragging = false;
  wrap.addEventListener(
    'touchstart',
    (e) => {
      startX = e.touches[0].clientX;
      dragging = true;
    },
    { passive: true },
  );
  wrap.addEventListener(
    'touchmove',
    (e) => {
      if (!dragging) return;
      const dx = e.touches[0].clientX - startX;
      if (dx < -20) wrap.classList.add('swiped');
      else if (dx > 20) wrap.classList.remove('swiped');
    },
    { passive: true },
  );
  wrap.addEventListener('touchend', () => {
    dragging = false;
  });
}

async function remove(post, el) {
  if (!confirm("Delete this post? This can't be undone.")) return;
  try {
    await deletePost(post.id);
  } catch {
    toast('Delete failed');
    return;
  }
  el.remove();
  toast('Deleted');
}
