// The bottom-sheet composer for image/text posts — new or editing.
import { $, $$, html, setHTML } from '../core/dom.js';
import { fileExt } from '../core/format.js';
import { createPost, updatePost, uploadMedia, randomName } from '../data/posts.js';
import { toast } from './ui.js';

const state = {
  editing: null, // the post row being edited, or null for a new post
  type: 'photo',
  file: null, // newly chosen image
  existingImg: null, // img_url already on the post being edited
};

export function initComposer({ onSaved }) {
  $('#fab-new').addEventListener('click', () => open());
  $('#sheet-overlay').addEventListener('click', close);
  $('#post-btn').addEventListener('click', () => submit().then((ok) => ok && onSaved()));

  $$('.type-toggle button').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.type = btn.dataset.type;
      state.file = null;
      // switching to "writing" means the old image no longer applies
      state.existingImg =
        state.editing && state.editing.type === state.type ? state.editing.img_url : null;
      syncTypeButtons();
      syncUploadZone();
    }),
  );

  // one persistent file input; the zone only swaps its preview
  const zone = $('#upload-zone');
  zone.addEventListener('change', (e) => {
    if (e.target.id !== 'file-input') return;
    const file = e.target.files[0];
    if (!file) return;
    state.file = file;
    showPreview(URL.createObjectURL(file));
  });
  syncUploadZone();
}

export function open(post = null) {
  state.editing = post;
  state.existingImg = post ? post.img_url || null : null;
  state.file = null;
  state.type = post ? post.type || 'photo' : 'photo';

  $('.sheet-title').textContent = post ? 'Edit post' : 'New post';
  $('#post-btn').textContent = post ? 'Save' : 'Post';
  $('#caption-input').value = post ? post.body || '' : '';
  $('#draft-checkbox').checked = post ? post.published === false : false;
  syncTypeButtons();
  syncUploadZone();

  $('#sheet-overlay').style.display = 'block';
  requestAnimationFrame(() => $('#sheet').classList.add('open'));
}

function close() {
  $('#sheet').classList.remove('open');
  setTimeout(() => ($('#sheet-overlay').style.display = 'none'), 250);
  Object.assign(state, { editing: null, file: null, existingImg: null });
  $('#caption-input').value = '';
  $('#draft-checkbox').checked = false;
  syncUploadZone();
}

function syncTypeButtons() {
  $$('.type-toggle button').forEach((b) =>
    b.classList.toggle('active', b.dataset.type === state.type),
  );
}

function syncUploadZone() {
  const zone = $('#upload-zone');
  zone.style.display = state.type === 'writing' ? 'none' : 'block';
  if (state.existingImg) showPreview(state.existingImg);
  else {
    zone.classList.remove('has-file');
    setHTML(
      zone,
      html`Tap to choose a photo<input type="file" id="file-input" accept="image/*" />`,
    );
  }
}

function showPreview(url) {
  const zone = $('#upload-zone');
  zone.classList.add('has-file');
  // the input stays on top (invisible), so tapping the preview picks a new file
  setHTML(zone, html`<img src="${url}" /><input type="file" id="file-input" accept="image/*" />`);
}

async function submit() {
  const body = $('#caption-input').value.trim();
  const published = !$('#draft-checkbox').checked;
  const btn = $('#post-btn');
  const isEdit = Boolean(state.editing);

  if (state.type !== 'writing' && !state.file && !state.existingImg) {
    toast('Choose a photo first');
    return false;
  }
  if (state.type === 'writing' && !body) {
    toast('Write something first');
    return false;
  }

  btn.disabled = true;
  btn.textContent = isEdit ? 'Saving…' : 'Posting…';
  // keep the saved image unless a new one was picked
  let img_url = state.type === 'writing' ? null : state.existingImg;

  try {
    if (state.file) {
      img_url = await uploadMedia(`posts/${randomName()}.${fileExt(state.file.name)}`, state.file);
    }
    if (isEdit) {
      await updatePost(state.editing.id, { type: state.type, body, img_url, published });
      toast('Saved');
    } else {
      await createPost({
        title: body ? body.slice(0, 60) : 'untitled',
        type: state.type,
        body,
        img_url,
        tags: [],
        published,
      });
      toast(published ? 'Posted' : 'Saved as draft');
    }
    close();
    return true;
  } catch (err) {
    toast(err.message || (isEdit ? 'Save failed' : 'Post failed'));
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = isEdit ? 'Save' : 'Post';
  }
}
