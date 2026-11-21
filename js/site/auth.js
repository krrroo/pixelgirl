// Sign in / out, and setting a password from a Supabase invite or reset link.
import { $, delegate, onEnter } from '../core/dom.js';
import { sb } from '../core/supabase.js';
import { store } from './store.js';
import { showPage } from './router.js';

export async function initAuth() {
  const {
    data: { session },
  } = await sb.auth.getSession();
  store.setUser(session ? session.user : null);

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      showPage('set-password');
      return;
    }
    store.setUser(session ? session.user : null);
    if (event === 'SIGNED_OUT') showPage('home', $('#snav-home'));
  });

  onEnter($('#login-email'), login);
  onEnter($('#login-pass'), login);
  onEnter($('#sp-pass'), setNewPassword);
  onEnter($('#sp-confirm'), setNewPassword);
  delegate(document, 'click', {
    login,
    logout,
    'set-password': setNewPassword,
  });
}

async function login() {
  const email = $('#login-email').value.trim();
  const password = $('#login-pass').value;
  const fb = $('#login-fb');
  const btn = $('#login-btn');
  fb.textContent = '';
  btn.textContent = 'signing in…';
  btn.disabled = true;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  btn.textContent = 'sign in';
  btn.disabled = false;
  if (error) {
    fb.textContent = error.message.toLowerCase();
    return;
  }
  store.setUser(data.user);
  $('#login-email').value = '';
  $('#login-pass').value = '';
  showPage('admin');
}

async function logout() {
  await sb.auth.signOut();
  history.replaceState(null, '', location.pathname);
  showPage('home', $('#snav-home'));
}

async function setNewPassword() {
  const pass = $('#sp-pass').value;
  const confirm = $('#sp-confirm').value;
  const fb = $('#sp-fb');
  const btn = $('#sp-btn');

  fb.textContent = '';
  if (pass.length < 6) {
    fb.textContent = 'password must be at least 6 characters.';
    return;
  }
  if (pass !== confirm) {
    fb.textContent = 'passwords do not match.';
    return;
  }

  btn.textContent = 'saving…';
  btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: pass });
  btn.textContent = 'set password';
  btn.disabled = false;
  if (error) {
    fb.textContent = error.message.toLowerCase();
    return;
  }

  $('#sp-pass').value = '';
  $('#sp-confirm').value = '';
  const {
    data: { session },
  } = await sb.auth.getSession();
  store.setUser(session ? session.user : null);
  showPage('admin');
}
