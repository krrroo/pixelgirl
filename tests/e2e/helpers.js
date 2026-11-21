import { readFileSync } from 'node:fs';

const fixture = (name) => readFileSync(new URL('./fixtures/' + name, import.meta.url), 'utf8');
const SUPABASE_STUB = fixture('supabase-stub.js');
const SOUNDCLOUD_STUB = fixture('soundcloud-stub.js');

export const ADMIN_SESSION = { user: { id: 'u1', email: 'k@example.com' } };

// Opens a page with Supabase and SoundCloud replaced by local fakes, so tests
// are fast, deterministic and never touch real data.
//   stub:    options for the fake Supabase (see fixtures/supabase-stub.js)
//   scBlock: make the fake SoundCloud widget refuse to start (iOS behaviour)
export async function open(page, path = '/', { stub = {}, scBlock = false } = {}) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.route(/supabase-js@2/, (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.__STUB = ${JSON.stringify(stub)};\n${SUPABASE_STUB}`,
    }),
  );
  await page.route('**/player/api.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: (scBlock ? 'window.__SC_BLOCK = true;\n' : '') + SOUNDCLOUD_STUB,
    }),
  );
  await page.route('https://w.soundcloud.com/player/?**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html></html>' }),
  );
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());

  await page.goto(path);
  return { errors };
}

export const writes = (page) => page.evaluate(() => window.__writes);
export const scCalls = (page) => page.evaluate(() => window.__sc && window.__sc.calls);
