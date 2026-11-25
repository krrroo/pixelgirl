// Music tab. Every post with type 'music' and an audio_url is one track in
// the public site's playlist (newest first).
import { $, $$, html, setHTML, delegate } from '../core/dom.js';
import { monthDay, titleFromFilename, fileExt } from '../core/format.js';
import { listRows, createPost, updatePost, deletePost, uploadMedia } from '../data/posts.js';
import { toast } from './ui.js';

let file = null;
let tracks = [];
let previewId = null;

export function initMusic({ onChanged }) {
  $('#music-input').addEventListener('change', (e) => {
    file = e.target.files[0] || null;
    if (!file) return;
    $('#music-zone-label').textContent = '🎵 ' + file.name;
    $('#music-zone').classList.add('has-file');
    if (!$('#music-title').value.trim()) $('#music-title').value = titleFromFilename(file.name);
  });

  $('#music-save-btn').addEventListener('click', () => add().then((ok) => ok && onChanged()));

  delegate($('#track-list'), 'click', {
    preview: (btn) => togglePreview(trackFor(btn), btn),
    publish: (btn) => setPublished(trackFor(btn), btn),
    delete: (btn) => remove(trackFor(btn), btn).then((ok) => ok && onChanged()),
  });
}

const trackFor = (el) => tracks.find((t) => String(t.id) === el.closest('.track-row').dataset.id);

export async function loadMusic() {
  const list = $('#track-list');
  try {
    tracks = (await listRows({ type: 'music' })).filter((t) => t.audio_url);
  } catch (e) {
    setHTML(
      list,
      html`<div class="empty-state">Couldn't load tracks.<br /><span style="font-size:12px">${e.message}</span></div>`,
    );
    return;
  }
  const live = tracks.filter((t) => t.published !== false).length;
  $('#track-count').textContent = tracks.length ? `· ${live} live` : '';
  if (!tracks.length) {
    setHTML(list, html`<div class="empty-state"><div class="glyph">♪</div>No tracks yet.</div>`);
    return;
  }
  setHTML(list, tracks.map(row));
}

function row(t) {
  const isDraft = t.published === false;
  const playing = previewId === t.id;
  return html`<div class="track-row" data-id="${t.id}">
    <button class="t-play${playing ? ' on' : ''}" data-action="preview" title="Preview">${playing ? '❚❚' : '▶'}</button>
    <div class="t-main">
      <div class="t-name">${t.title || 'untitled'}</div>
      <div class="t-meta">${monthDay(t.created_at)}${isDraft ? html` · <span class="draft-tag">draft</span>` : ''}</div>
    </div>
    <button class="t-btn t-pub" data-action="publish">${isDraft ? 'Publish' : 'Hide'}</button>
    <button class="t-btn danger t-del" data-action="delete">Delete</button>
  </div>`;
}

async function setPublished(t, btn) {
  const publish = t.published === false;
  btn.disabled = true;
  try {
    await updatePost(t.id, { published: publish });
  } catch (e) {
    toast(e.message);
    btn.disabled = false;
    return;
  }
  toast(publish ? 'Track is live' : 'Track hidden');
  loadMusic();
}

async function remove(t, btn) {
  // two taps: first arms, second deletes
  if (!btn.dataset.armed) {
    btn.dataset.armed = '1';
    btn.textContent = 'Sure?';
    return false;
  }
  btn.disabled = true;
  try {
    await deletePost(t.id);
  } catch (e) {
    toast(e.message);
    btn.disabled = false;
    return false;
  }
  if (previewId === t.id) stopPreview();
  toast('Track deleted');
  loadMusic();
  return true;
}

function togglePreview(t, btn) {
  const a = $('#admin-preview');
  if (previewId === t.id && !a.paused) {
    stopPreview();
    return;
  }
  stopPreview();
  previewId = t.id;
  a.src = t.audio_url;
  a.play().catch(() => toast('Could not play this file'));
  btn.classList.add('on');
  btn.textContent = '❚❚';
  a.onended = stopPreview;
}

function stopPreview() {
  $('#admin-preview').pause();
  previewId = null;
  $$('.track-row .t-play').forEach((b) => {
    b.classList.remove('on');
    b.textContent = '▶';
  });
}

async function add() {
  if (!file) {
    toast('Choose an audio file first');
    return false;
  }
  const title = $('#music-title').value.trim() || 'untitled track';
  const published = !$('#music-draft').checked;
  const btn = $('#music-save-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading…';
  try {
    const audio_url = await uploadMedia(`music/${Date.now()}.${fileExt(file.name)}`, file, {
      contentType: file.type,
    });
    await createPost({
      title,
      type: 'music',
      body: '',
      tags: [],
      img_url: null,
      audio_url,
      published,
    });
    toast(published ? 'Added to playlist' : 'Saved as draft');
    file = null;
    $('#music-input').value = '';
    $('#music-title').value = '';
    $('#music-draft').checked = false;
    $('#music-zone-label').textContent = 'Tap to choose an audio file';
    $('#music-zone').classList.remove('has-file');
    loadMusic();
    return true;
  } catch (err) {
    toast(err.message || 'Upload failed');
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add to playlist';
  }
}
