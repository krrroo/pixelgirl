// The masonry grid of posts and the filter tags above it.
import { $, $$, html, raw, compact, setHTML, delegate } from '../core/dom.js';
import { store } from './store.js';

export class Grid {
  // onOpen(id):  a tile was tapped
  // onPlay(id):  a tile's ▶ button was tapped
  constructor({ onOpen, onPlay }) {
    this.el = $('#grid');

    delegate(this.el, 'click', {
      'play-post': (btn, e) => {
        e.stopPropagation();
        onPlay(btn.closest('.tile').dataset.id);
      },
      'open-post': (tile) => onOpen(tile.dataset.id),
    });

    delegate($('.filters'), 'click', {
      filter: (tag) => {
        $$('.ftag').forEach((t) => t.classList.toggle('on', t === tag));
        store.setFilter(tag.dataset.filter);
      },
    });

    for (const type of ['posts', 'filter', 'user']) {
      store.addEventListener(type, () => this.render());
    }
  }

  render() {
    const list = store.visiblePosts;
    $('#pcount').textContent = list.length + ' post' + (list.length !== 1 ? 's' : '');
    if (!list.length) {
      setHTML(this.el, html`<div class="empty">nothing here yet.</div>`);
    } else {
      setHTML(
        this.el,
        list.map((p, i) => tile(p, i, store.isAdmin)),
      );
    }
    this.el.dispatchEvent(new Event('rendered', { bubbles: true }));
  }
}

function tile(p, i, isAdmin) {
  const draft = !p.published;
  const draftBadge = draft && isAdmin ? html`<div class="draft-badge">draft</div>` : '';
  const playBtn = p.audio
    ? html`<button class="tile-play" data-action="play-post" title="play">${raw('&#9654;')}</button>`
    : '';
  const cls = `tile ${p.img ? 't-img' : 't-txt'}${draft ? ' draft' : ''}`;
  const delay = `animation-delay:${(i * 0.04).toFixed(2)}s`;

  if (p.img) {
    return compact(html`<div class="${cls}" data-id="${p.id}" data-action="open-post" style="${delay}">
      <img src="${p.img}" alt="${p.title}" loading="lazy" />${playBtn}${draftBadge}
    </div>`);
  }
  const peek = p.body
    ? html`<div class="t-body-peek">${p.body.substring(0, 90)}${p.body.length > 90 ? '…' : ''}</div>`
    : '';
  const tileDate =
    p.type === 'writing' && p.shortDate ? html`<div class="t-tile-date">${p.shortDate}</div>` : '';
  return compact(html`<div class="${cls}" data-id="${p.id}" data-action="open-post" style="${delay}">
    <div class="t-type">${p.type}</div>
    <div class="t-title">${p.title}</div>
    ${peek}${playBtn}${draftBadge}${tileDate}
  </div>`);
}
