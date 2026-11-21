// The admin page inside the public site (/#admin): title font preview and
// the new-post form. The phone-first admin app is admin.html (js/admin/).
import { $, delegate } from '../core/dom.js';
import { parseTags, fileExt } from '../core/format.js';
import { createPost, uploadMedia, fromRow, randomName } from '../data/posts.js';
import { watermarkImage } from '../data/watermark.js';
import { store } from './store.js';

export function initAdminPanel() {
  $('#fp-input').addEventListener('input', (e) => {
    const text = e.target.value.trim() || 'untitled';
    $('#fp-lg').textContent = text;
    $('#fp-sm').textContent = text;
  });

  // the audio field only matters for music posts
  $('#p-type').addEventListener('change', (e) => {
    $('#audio-fld').style.display = e.target.value === 'music' ? '' : 'none';
  });

  $('#p-img').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = $('#p-prev');
      img.src = r.result;
      img.style.display = 'block';
    };
    r.readAsDataURL(f);
  });

  delegate(document, 'click', { publish });
}

async function publish() {
  if (!store.isAdmin) {
    alert('not logged in');
    return;
  }
  const title = $('#p-title').value.trim() || 'untitled';
  const type = $('#p-type').value;
  const body = $('#p-body').value.trim();
  const tags = parseTags($('#p-tags').value);
  const published = !$('#p-draft').checked;
  const fb = $('#pfb');
  const imgFile = $('#p-img').files[0];
  const audioFile = $('#p-audio').files[0];

  if (type === 'music' && !audioFile) {
    fb.textContent = 'please select an audio file.';
    return;
  }
  fb.textContent = published ? 'publishing…' : 'saving draft…';

  try {
    let audioUrl = null;
    if (type === 'music') {
      const progress = $('#audio-progress');
      progress.textContent = 'uploading audio…';
      try {
        audioUrl = await uploadMedia(`music/${Date.now()}.${fileExt(audioFile.name)}`, audioFile, {
          contentType: audioFile.type,
        });
      } catch (e) {
        throw userError('audio upload failed: ' + e.message);
      } finally {
        progress.textContent = '';
      }
    }

    let imgUrl = null;
    if (imgFile) {
      const progress = $('#img-progress');
      progress.textContent = 'watermarking…';
      const marked = await watermarkImage(imgFile);
      progress.textContent = 'uploading image…';
      try {
        imgUrl = await uploadMedia(`posts/${randomName()}.png`, marked, { contentType: 'image/png' });
      } catch (e) {
        throw userError('image upload failed: ' + e.message);
      } finally {
        progress.textContent = '';
      }
    }

    const row = await createPost({
      title,
      type,
      body,
      tags,
      img_url: imgUrl,
      audio_url: audioUrl,
      published,
    });
    store.addPost(fromRow(row));

    for (const id of ['#p-title', '#p-body', '#p-tags', '#p-img', '#p-audio']) $(id).value = '';
    $('#p-draft').checked = false;
    const prev = $('#p-prev');
    prev.style.display = 'none';
    prev.src = '';
    fb.textContent = published ? '✦ published.' : '✦ saved as draft.';
  } catch (e) {
    fb.textContent = e.isUserError ? e.message : 'error: ' + e.message;
  }
  setTimeout(() => (fb.textContent = ''), 4000);
}

function userError(message) {
  return Object.assign(new Error(message), { isUserError: true });
}
