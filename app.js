// ═══════════════════════════════════════
// CONFIG — replace with your values
// ═══════════════════════════════════════
const SUPABASE_URL = 'https://ydgolqvrhppqyqioymlk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_IUwxXSr3JhogSRf52mCzRw_4cfTPeta';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Sample posts — shown when Supabase is unreachable or empty.
// Images live in /samples so normal visitors never download them.
let posts = [
  {id:1,title:'flower shop door',type:'photo',img:'samples/flower-shop-door.jpg',ratio:1.4578,body:'',tags:["photo", "london", "colour"],date:'may 2025',likes:0,liked:false},
  {id:2,title:'layers',type:'photo',img:'samples/layers.jpg',ratio:0.75,body:'',tags:["photo", "texture", "street"],date:'may 2025',likes:0,liked:false},
{id:101,title:'on bad weather',type:'writing',img:null,ratio:null,body:'it rained for eleven days straight. i started to feel like the city was on my side.',tags:['writing','thoughts'],date:'apr 2025',likes:0,liked:false},
  {id:3,title:'polaroids',type:'photo',img:'samples/polaroids.jpg',ratio:1.0,body:'',tags:["photo", "home", "light"],date:'may 2025',likes:0,liked:false},
  {id:4,title:'face on the wall',type:'photo',img:'samples/face-on-the-wall.jpg',ratio:1.25,body:'',tags:["photo", "street art", "colour"],date:'may 2025',likes:0,liked:false},
  {id:5,title:'notebook',type:'mixed',img:'samples/notebook.jpg',ratio:0.7264,body:'',tags:["mixed", "writing", "archive"],date:'may 2025',likes:0,liked:false},
{id:102,title:'things i keep',type:'writing',img:null,ratio:null,body:'ticket stubs. bad receipts. the wrapper from a chocolate bar i ate on a train to nowhere in particular.',tags:['writing','misc'],date:'apr 2025',likes:0,liked:false},
  {id:6,title:'krakow in snow',type:'photo',img:'samples/krakow-in-snow.jpg',ratio:0.75,body:'',tags:["photo", "snow", "poland"],date:'may 2025',likes:0,liked:false},
  {id:7,title:'winter tree',type:'photo',img:'samples/winter-tree.jpg',ratio:0.9967,body:'',tags:["photo", "bw", "winter"],date:'may 2025',likes:0,liked:false},
{id:103,title:'note to self',type:'writing',img:null,ratio:null,body:'you don\'t have to explain every photo you take.',tags:['writing'],date:'mar 2025',likes:0,liked:false},
  {id:8,title:'mirror study',type:'photo',img:'samples/mirror-study.jpg',ratio:0.9996,body:'',tags:["photo", "bw", "self"],date:'may 2025',likes:0,liked:false},
  {id:9,title:'low tide',type:'photo',img:'samples/low-tide.jpg',ratio:0.75,body:'',tags:["photo", "sea", "sky"],date:'may 2025',likes:0,liked:false},
{id:104,title:'2am thought',type:'writing',img:null,ratio:null,body:'the best creative work happens when you stop trying to make it good and just make it.',tags:['writing','process'],date:'mar 2025',likes:0,liked:false},
  {id:10,title:'blue unicorn',type:'photo',img:'samples/blue-unicorn.jpg',ratio:1.3333,body:'',tags:["photo", "tattoo", "blue"],date:'may 2025',likes:0,liked:false}
];

let livePosts = [];
let filter    = 'all';
let adminUser = null;
let currentLbId = null;
let playlist = [];
let currentTrackIdx = -1;
let currentTrackId = null;

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
window.addEventListener('load', async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) { adminUser = session.user; updateAdminUI(true); }

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-set-password').classList.add('active');
      return;
    }
    adminUser = session ? session.user : null;
    updateAdminUI(!!adminUser);
    if (event === 'SIGNED_OUT') showPage('home');
  });

  const aud = document.getElementById('aud');
  aud.addEventListener('ended', nextTrack);
  // keep buttons right when iOS lock-screen / headphone controls pause or play
  aud.addEventListener('play', updatePlayerUI);
  aud.addEventListener('pause', updatePlayerUI);

  await loadPosts();
  buildPlaylist();
  handleHash();
});

window.addEventListener('hashchange', handleHash);

function handleHash() {
  const h = location.hash.replace('#', '');
  if (h === 'admin') {
    if (adminUser) { showAdminPanel(); }
    else {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-login').classList.add('active');
    }
  }
}

function updateAdminUI(loggedIn) {
  const l = document.getElementById('nav-admin-link');
  if (l) l.style.display = loggedIn ? 'block' : 'none';
  const m = document.getElementById('mob-admin-link');
  if (m) m.style.display = loggedIn ? 'inline' : 'none';
}

// ═══════════════════════════════════════
// NAV
// ═══════════════════════════════════════
function showPage(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-links a, .mob-nav a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  if (name === 'home') renderGrid();
}

function showAdminPanel() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a, .mob-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-admin').classList.add('active');
}

// ═══════════════════════════════════════
// AUTH
// ═══════════════════════════════════════
async function adminLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const fb    = document.getElementById('login-fb');
  const btn   = document.getElementById('login-btn');
  fb.textContent = ''; btn.textContent = 'signing in…'; btn.disabled = true;

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.textContent = 'sign in'; btn.disabled = false;

  if (error) { fb.textContent = error.message.toLowerCase(); return; }
  adminUser = data.user;
  updateAdminUI(true);
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value = '';
  showAdminPanel();
}

async function logout() {
  await sb.auth.signOut();
  history.replaceState(null, '', location.pathname);
  showPage('home', document.getElementById('snav-home'));
}

function updateFontPreview(val) {
  const text = val.trim() || 'untitled';
  document.getElementById('fp-lg').textContent = text;
  document.getElementById('fp-sm').textContent = text;
}

async function setNewPassword() {
  const pass    = document.getElementById('sp-pass').value;
  const confirm = document.getElementById('sp-confirm').value;
  const fb      = document.getElementById('sp-fb');
  const btn     = document.getElementById('sp-btn');

  fb.textContent = '';
  if (pass.length < 6) { fb.textContent = 'password must be at least 6 characters.'; return; }
  if (pass !== confirm) { fb.textContent = 'passwords do not match.'; return; }

  btn.textContent = 'saving…'; btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: pass });
  btn.textContent = 'set password'; btn.disabled = false;

  if (error) { fb.textContent = error.message.toLowerCase(); return; }

  document.getElementById('sp-pass').value = '';
  document.getElementById('sp-confirm').value = '';
  const { data: { session } } = await sb.auth.getSession();
  adminUser = session ? session.user : null;
  updateAdminUI(!!adminUser);
  showAdminPanel();
}

// ═══════════════════════════════════════
// LOAD POSTS
// ═══════════════════════════════════════
async function loadPosts() {
  try {
    const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || !data.length) throw new Error('no posts in database');
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    livePosts = data.map(row => ({
      id:    row.id,
      title: row.title,
      type:  row.type,
      img:   row.img_url || null,
      audio: row.audio_url || null,
      body:  row.body || '',
      tags:  row.tags || [],
      date:  new Date(row.created_at).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}).toLowerCase(),
      shortDate: new Date(row.created_at).toLocaleDateString('en-GB', {day:'2-digit',month:'2-digit',year:'2-digit'}),
      likes:     row.likes || 0,
      liked:     liked.includes(row.id),
      published: row.published !== false,
    }));
  } catch(e) {
    console.warn('Supabase not connected, using seed posts:', e.message);
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    livePosts = posts.map(p => ({ ...p, liked: liked.includes(p.id), published: p.published !== false }));
  }
  renderGrid();
}

// ═══════════════════════════════════════
// PLAYLIST
// ═══════════════════════════════════════
// Playlist = every published post with an audio file, newest first.
// The current track is tracked by post id so edits/deletes elsewhere
// in the list don't swap the song out from under the listener.
function buildPlaylist() {
  playlist = livePosts.filter(p => p.audio && p.published !== false);
  const stillThere = playlist.findIndex(p => p.id === currentTrackId);
  if (stillThere !== -1) {
    currentTrackIdx = stillThere;
  } else {
    currentTrackIdx = playlist.length ? 0 : -1;
    currentTrackId = playlist.length ? playlist[0].id : null;
    const a = document.getElementById('aud');
    a.pause();
    if (playlist.length) a.src = playlist[0].audio; else a.removeAttribute('src');
  }
  updatePlayerUI();
}

function updatePlayerUI() {
  const has = playlist.length > 0;
  const a = document.getElementById('aud');
  const p = has ? playlist[currentTrackIdx] : null;
  const playing = has && !a.paused;
  const title = p ? p.title : '—';
  const counter = has ? (currentTrackIdx + 1) + ' / ' + playlist.length : '';
  const icon = playing ? '&#9646;&#9646;' : '&#9654;';

  // sidebar player (desktop)
  document.getElementById('player-on').style.display = has ? 'block' : 'none';
  document.getElementById('no-music').style.display = has ? 'none' : 'block';
  document.getElementById('track-name').textContent = title;
  document.getElementById('track-counter').textContent = counter;
  document.getElementById('playbtn').innerHTML = icon;

  // bottom bar (mobile) — only once something has been played,
  // so it never covers the grid for visitors who don't want music
  const mob = document.getElementById('mob-player');
  if (mob) {
    mob.classList.toggle('show', has && a.dataset.started === '1');
    document.getElementById('mob-track').textContent = title;
    document.getElementById('mob-counter').textContent = counter;
    document.getElementById('mob-playbtn').innerHTML = icon;
  }

  // highlight the playing tile
  document.querySelectorAll('.tile-play').forEach(b => {
    const on = playing && b.closest('.tile')?.dataset.id === String(currentTrackId);
    b.classList.toggle('on', on);
    b.innerHTML = on ? '&#9646;&#9646;' : '&#9654;';
  });
}

function playTrack(idx) {
  if (!playlist.length) return;
  currentTrackIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
  const p = playlist[currentTrackIdx];
  currentTrackId = p.id;
  const a = document.getElementById('aud');
  if (a.getAttribute('src') !== p.audio) a.src = p.audio;
  a.volume = parseFloat(document.getElementById('vol').value);
  a.dataset.started = '1';
  a.play().catch(() => {}).finally(updatePlayerUI);
  updatePlayerUI();
}

function nextTrack() { playTrack(currentTrackIdx + 1); }
function prevTrack() { playTrack(currentTrackIdx - 1); }

// Tile / lightbox play button: toggles if it's the current track, otherwise jumps to it.
function playPostAudio(postId, e) {
  if (e) e.stopPropagation();
  const idx = playlist.findIndex(p => p.id === postId);
  if (idx === -1) return;
  const a = document.getElementById('aud');
  if (postId === currentTrackId && a.dataset.started === '1') { togglePlay(); return; }
  playTrack(idx);
}

// ═══════════════════════════════════════
// RENDER GRID
// ═══════════════════════════════════════
function renderGrid(f) {
  if (f !== undefined) filter = f;
  let list = filter === 'all' ? livePosts : livePosts.filter(p => p.type === filter);
  if (!adminUser) list = list.filter(p => p.published !== false);
  document.getElementById('pcount').textContent = list.length + ' post' + (list.length !== 1 ? 's' : '');
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  if (!list.length) { grid.innerHTML = '<div class="empty">nothing here yet.</div>'; return; }
  list.forEach((p, i) => grid.appendChild(buildTile(p, i)));
  updatePlayerUI();
}

function buildTile(p, i) {
  const d = document.createElement('div');
  d.dataset.id = p.id;
  d.style.animationDelay = (i * .04) + 's';
  const draftBadge = (!p.published && adminUser) ? '<div class="draft-badge">draft</div>' : '';
  const playBtn = p.audio ? '<button class="tile-play" title="play">&#9654;</button>' : '';
  if (p.img) {
    d.className = 'tile t-img' + (!p.published ? ' draft' : '');
    d.innerHTML = '<img src="' + p.img + '" alt="' + esc(p.title) + '" loading="lazy">' + playBtn + draftBadge;
  } else {
    d.className = 'tile t-txt' + (!p.published ? ' draft' : '');
    const peek = p.body ? '<div class="t-body-peek">' + esc(p.body.substring(0,90)) + (p.body.length>90?'…':'') + '</div>' : '';
    const tileDate = (p.type === 'writing' && p.shortDate) ? '<div class="t-tile-date">' + p.shortDate + '</div>' : '';
    d.innerHTML = '<div class="t-type">' + p.type + '</div><div class="t-title">' + esc(p.title) + '</div>' + peek + playBtn + draftBadge + tileDate;
  }
  d.addEventListener('click', () => openLb(p.id));
  const tp = d.querySelector('.tile-play');
  if (tp) tp.addEventListener('click', e => playPostAudio(p.id, e));
  return d;
}

function doFilter(f, el) {
  document.querySelectorAll('.ftag').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  renderGrid(f);
}

// ═══════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════
function openLb(id) {
  const p = livePosts.find(x => x.id === id); if (!p) return;
  currentLbId = id;
  const adminBtns = adminUser ? `
    <div class="admin-post-btns">
      <button class="pub-btn" onclick="togglePublished()">${p.published ? 'hide post' : 'publish post'}</button>
      <button class="edit-btn" onclick="openEditForm()">edit post</button>
      <button class="del-btn" onclick="deletePost()">delete post</button>
    </div>` : '';
  const playRow = p.audio ? `<div class="lb-play-row"><button class="lb-play-btn" onclick="playPostAudio(currentLbId)">&#9654; play in sidebar</button></div>` : '';
  document.getElementById('lb-content').innerHTML = `
    ${p.img ? '<div class="lb-img"><img src="' + p.img + '" alt="' + esc(p.title) + '"></div>' : ''}
    <div class="lb-info">
      <div class="lb-type">${p.type}${!p.published ? ' · <span style="color:var(--accent2)">draft</span>' : ''}</div>
      <div class="lb-title">${esc(p.title)}</div>
      ${playRow}
      ${p.body ? '<div class="lb-body' + (p.type==='writing'?' w':'') + '">' + esc(p.body).replace(/\n/g,'<br>') + '</div>' : ''}
      <div class="lb-tags">${p.tags.map(t=>'<span class="lb-tag">#'+esc(t)+'</span>').join('')}</div>
      <div class="lb-foot">
        <span class="lb-date">${p.date}</span>
        <button class="hbtn${p.liked?' liked':''}" id="hb${p.id}" onclick="likeCurrentPost()">&#9825; <span>${p.likes}</span></button>
      </div>
      ${adminBtns}
    </div>`;
  document.getElementById('lb').classList.add('open');
}

async function togglePublished() {
  const id = currentLbId;
  const p = livePosts.find(x => x.id === id); if (!p || !adminUser) return;
  const newVal = !p.published;
  const { error } = await sb.from('posts').update({ published: newVal }).eq('id', id);
  if (error) { alert('update failed: ' + error.message); return; }
  p.published = newVal;
  const btn = document.querySelector('#lb-content .pub-btn');
  if (btn) btn.textContent = newVal ? 'hide post' : 'publish post';
  const typeEl = document.querySelector('#lb-content .lb-type');
  if (typeEl) typeEl.innerHTML = p.type + (!newVal ? ' · <span style="color:var(--accent2)">draft</span>' : '');
  buildPlaylist();
  renderGrid();
}

async function deletePost() {
  const id = currentLbId;
  if (!adminUser || !id) return;
  const btn = document.querySelector('#lb-content .del-btn');
  if (!btn) return;
  if (!btn.dataset.armed) {
    btn.dataset.armed = '1';
    btn.textContent = 'confirm delete?';
    return;
  }
  btn.textContent = 'deleting…';
  btn.disabled = true;
  const { error } = await sb.from('posts').delete().eq('id', id);
  if (error) {
    btn.textContent = 'delete post';
    btn.disabled = false;
    delete btn.dataset.armed;
    alert('delete failed: ' + error.message);
    return;
  }
  livePosts = livePosts.filter(x => x.id !== id);
  closeLb();
  buildPlaylist();
  renderGrid();
}
function openEditForm() {
  const p = livePosts.find(x => x.id === currentLbId); if (!p) return;
  const info = document.querySelector('#lb-content .lb-info');
  if (!info) return;
  info.innerHTML = `
    <div class="edit-form">
      <div class="fld"><label>title</label><input type="text" id="ef-title" value="${esc(p.title)}" autocapitalize="none" autocorrect="off"></div>
      <div class="fld"><label>type</label>
        <select id="ef-type">
          <option value="photo"${p.type==='photo'?' selected':''}>photography</option>
          <option value="illustration"${p.type==='illustration'?' selected':''}>illustration</option>
          <option value="pixel"${p.type==='pixel'?' selected':''}>pixel art</option>
          <option value="writing"${p.type==='writing'?' selected':''}>writing</option>
          <option value="mixed"${p.type==='mixed'?' selected':''}>mixed media</option>
        </select>
      </div>
      <div class="fld"><label>body / caption</label><textarea id="ef-body" autocapitalize="none" autocorrect="off">${esc(p.body)}</textarea></div>
      <div class="fld"><label>tags (comma separated)</label><input type="text" id="ef-tags" value="${esc(p.tags.join(', '))}" autocapitalize="none" autocorrect="off"></div>
      <div class="fld-check"><label class="check-label"><input type="checkbox" id="ef-draft"${!p.published?' checked':''}> save as draft</label></div>
      <div class="admin-post-btns">
        <button class="pub-btn" onclick="saveEdit()">save changes</button>
        <button class="del-btn" onclick="openLb(currentLbId)">cancel</button>
      </div>
      <div class="fbk" id="ef-fb"></div>
    </div>`;
}

async function saveEdit() {
  const p = livePosts.find(x => x.id === currentLbId); if (!p || !adminUser) return;
  const title     = document.getElementById('ef-title').value.trim() || 'untitled';
  const type      = document.getElementById('ef-type').value;
  const body      = document.getElementById('ef-body').value.trim();
  const tags      = document.getElementById('ef-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const published = !document.getElementById('ef-draft').checked;
  const fb        = document.getElementById('ef-fb');
  fb.textContent  = 'saving…';
  const { error } = await sb.from('posts').update({ title, type, body, tags, published }).eq('id', p.id);
  if (error) { fb.textContent = 'error: ' + error.message; return; }
  Object.assign(p, { title, type, body, tags, published });
  renderGrid();
  openLb(p.id);
}

function closeLb() { document.getElementById('lb').classList.remove('open'); currentLbId = null; }
function closeLbBg(e) { if (e.target === document.getElementById('lb')) closeLb(); }
function likeCurrentPost() { if (currentLbId !== null) like(currentLbId); }

// ═══════════════════════════════════════
// LIKES
// ═══════════════════════════════════════
async function like(id) {
  const p = livePosts.find(x => x.id === id); if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
  const btn = document.getElementById('hb' + id);
  if (btn) { btn.classList.toggle('liked', p.liked); btn.querySelector('span').textContent = p.likes; }
  const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]');
  const updated = p.liked ? [...new Set([...liked, id])] : liked.filter(x => x !== id);
  localStorage.setItem('liked_posts', JSON.stringify(updated));
  try { await sb.from('posts').update({ likes: p.likes }).eq('id', id); }
  catch(e) { console.warn('Like save failed:', e.message); }
}

// ═══════════════════════════════════════
// WATERMARK — embeds invisible LSB mark before upload
// ═══════════════════════════════════════
function watermarkImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const mark = 'pixelgirl.com\0';
      const bits = [];
      for (const ch of mark) {
        const code = ch.charCodeAt(0);
        for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
      }
      // encode into LSB of blue channel
      for (let i = 0; i < bits.length && i * 4 + 2 < d.length; i++) {
        d[i * 4 + 2] = (d[i * 4 + 2] & 0xFE) | bits[i];
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.src = url;
  });
}

// ═══════════════════════════════════════
// PUBLISH — uploads image to Storage first
// ═══════════════════════════════════════
function prevImg(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => { const i = document.getElementById('p-prev'); i.src = e.target.result; i.style.display = 'block'; };
  r.readAsDataURL(f);
}

async function publish() {
  if (!adminUser) { alert('not logged in'); return; }
  const title = document.getElementById('p-title').value.trim() || 'untitled';
  const type  = document.getElementById('p-type').value;
  const body  = document.getElementById('p-body').value.trim();
  const tags      = document.getElementById('p-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const published = !document.getElementById('p-draft').checked;
  const fb        = document.getElementById('pfb');
  const imgFile   = document.getElementById('p-img').files[0];

  fb.textContent = published ? 'publishing…' : 'saving draft…';
  let imgUrl = null;
  let audioUrl = null;

  // Upload audio if this is a music post
  if (type === 'music') {
    const audioFile = document.getElementById('p-audio').files[0];
    if (!audioFile) { fb.textContent = 'please select an audio file.'; return; }
    document.getElementById('audio-progress').textContent = 'uploading audio…';
    const ext = audioFile.name.split('.').pop();
    const path = `music/${Date.now()}.${ext}`;
    const { error: audErr } = await sb.storage.from('media').upload(path, audioFile, { contentType: audioFile.type });
    if (audErr) { fb.textContent = 'audio upload failed: ' + audErr.message; document.getElementById('audio-progress').textContent = ''; return; }
    const { data: audUrlData } = sb.storage.from('media').getPublicUrl(path);
    audioUrl = audUrlData.publicUrl;
    document.getElementById('audio-progress').textContent = '';
  }

  // Upload image to Supabase Storage if provided
  if (imgFile) {
    document.getElementById('img-progress').textContent = 'watermarking…';
    const marked = await watermarkImage(imgFile);
    document.getElementById('img-progress').textContent = 'uploading image…';
    const path = `posts/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;
    const { error: upErr } = await sb.storage.from('media').upload(path, marked, { contentType: 'image/png' });
    if (upErr) { fb.textContent = 'image upload failed: ' + upErr.message; return; }
    const { data: urlData } = sb.storage.from('media').getPublicUrl(path);
    imgUrl = urlData.publicUrl;
    document.getElementById('img-progress').textContent = '';
  }

  try {
    const { data, error } = await sb.from('posts')
      .insert([{ title, type, body, tags, img_url: imgUrl, audio_url: audioUrl, likes: 0, published }])
      .select().single();
    if (error) throw error;

    livePosts.unshift({
      id: data.id, title, type, img: imgUrl, audio: audioUrl, body, tags,
      date: new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toLowerCase(),
      likes: 0, liked: false, published,
    });
    buildPlaylist();
    renderGrid();

    ['p-title','p-body','p-tags'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('p-img').value = '';
    document.getElementById('p-audio').value = '';
    document.getElementById('p-draft').checked = false;
    const pr = document.getElementById('p-prev'); pr.style.display = 'none'; pr.src = '';
    fb.textContent = published ? '✦ published.' : '✦ saved as draft.';
  } catch(e) {
    fb.textContent = 'error: ' + e.message;
  }
  setTimeout(() => fb.textContent = '', 4000);
}

function onTypeChange(type) {
  document.getElementById('audio-fld').style.display = type === 'music' ? '' : 'none';
}

function togglePlay() {
  if (!playlist.length) return;
  const a = document.getElementById('aud');
  if (a.dataset.started !== '1') { playTrack(currentTrackIdx < 0 ? 0 : currentTrackIdx); return; }
  if (a.paused) a.play().catch(() => {}).finally(updatePlayerUI);
  else a.pause();
  updatePlayerUI();
}
function setVol(v) { document.getElementById('aud').volume = parseFloat(v); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══════════════════════════════════════
// PIXEL SNOW
// ═══════════════════════════════════════
(function() {
  const canvas = document.createElement('canvas');
  canvas.className = 'snow-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const COUNT = 88;
  const FLAKES = [];
  for (let i = 0; i < COUNT; i++) {
    const big = i < 20;
    FLAKES.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      big,
      speed: big ? (.15 + Math.random() * .2) : (.08 + Math.random() * .14),
      drift: (Math.random() - .5) * .1,
      alpha: big ? (.5 + Math.random() * .3) : (.3 + Math.random() * .3),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: .003 + Math.random() * .005,
    });
  }
  function drawFlake(ctx, x, y, alpha) {
    ctx.fillStyle = `rgba(220,210,230,${alpha})`;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;
    ctx.fillText('*', x, y);
    ctx.globalAlpha = 1;
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const f of FLAKES) {
      const px = Math.round(f.x), py = Math.round(f.y);
      if (f.big) { drawFlake(ctx, px, py, f.alpha); }
      else { ctx.fillStyle = `rgba(220,210,230,${f.alpha})`; ctx.fillRect(px, py, 1, 1); }
      f.wobble += f.wobbleSpeed;
      f.x += f.drift + Math.sin(f.wobble) * .15;
      f.y += f.speed;
      if (f.y > canvas.height + 6) { f.y = -6; f.x = Math.random() * canvas.width; }
      if (f.x > canvas.width + 6) f.x = -6;
      if (f.x < -6) f.x = canvas.width + 6;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
