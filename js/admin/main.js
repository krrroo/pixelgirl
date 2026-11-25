// Entry point for the phone-first admin app (admin.html).
import { $ } from '../core/dom.js';
import { sb } from '../core/supabase.js';
import { initTabs, onFirstOpen } from './ui.js';
import { initFeed, loadFeed } from './feed.js';
import { initComposer, open as openComposer } from './composer.js';
import { initMusic, loadMusic } from './music.js';
import { loadStats } from './stats.js';

function enterApp(user) {
  $('#login-screen').style.display = 'none';
  $('#app').style.display = 'block';
  $('#account-email').textContent = user.email;
  loadFeed();
  loadMusic();
}

async function login() {
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const btn = $('#login-btn');
  const err = $('#login-error');
  err.textContent = '';
  if (!email || !password) {
    err.textContent = 'Enter email and password.';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Logging in…';
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = 'Log in';
  if (error) {
    err.textContent = error.message;
    return;
  }
  enterApp(data.user);
}

$('#login-btn').addEventListener('click', login);
$('#signout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

initTabs();
onFirstOpen('stats', loadStats);
initFeed({ onEdit: openComposer });
initComposer({ onSaved: loadFeed });
initMusic({ onChanged: loadFeed });

const {
  data: { session },
} = await sb.auth.getSession();
if (session) enterApp(session.user);
