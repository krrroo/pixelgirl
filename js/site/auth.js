// The public site has no admin UI — that's admin.html. Two auth jobs remain:
//   * /#admin (old bookmark) → admin.html
//   * Supabase invite / password-reset links land on the site root; show
//     the set-password page, then continue to admin.html.
import { $, delegate, onEnter } from '../core/dom.js';
import { sb } from '../core/supabase.js';
import { showPage } from './router.js';

const ADMIN_APP = 'admin.html';

export function redirectOldAdminLink() {
  if (location.hash === '#admin') {
    location.replace(ADMIN_APP);
    return true;
  }
  return false;
}

export function initPasswordReset() {
  sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') showPage('set-password');
  });
  onEnter($('#sp-pass'), setNewPassword);
  onEnter($('#sp-confirm'), setNewPassword);
  delegate(document, 'click', { 'set-password': setNewPassword });
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
  location.href = ADMIN_APP;
}
