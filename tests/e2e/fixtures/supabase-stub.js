// A fake supabase-js for browser tests: an in-memory posts table, no network.
// Served in place of the CDN script. Configure before it loads via:
//   window.__STUB = { session: {...} | null, empty: bool, down: bool, noMusic: bool }
// Every write is recorded in window.__writes for assertions.
(function () {
  const cfg = window.__STUB || {};
  const AUDIO = location.origin + '/tests/e2e/fixtures/silence.wav';
  let posts = [
    {
      id: '3f2a9c1e-aaaa-4bbb-8ccc-000000000001',
      title: 'night song',
      type: 'music',
      img_url: null,
      audio_url: AUDIO + '?1',
      body: '',
      tags: [],
      likes: 0,
      published: true,
      created_at: '2026-11-20T10:00:00Z',
    },
    {
      id: '3f2a9c1e-aaaa-4bbb-8ccc-000000000002',
      title: 'photo post',
      type: 'photo',
      img_url: location.origin + '/samples/low-tide.jpg',
      audio_url: null,
      body: 'hi',
      tags: ['a'],
      likes: 2,
      published: true,
      created_at: '2026-11-19T10:00:00Z',
    },
    {
      id: '3f2a9c1e-aaaa-4bbb-8ccc-000000000003',
      title: 'second song',
      type: 'music',
      img_url: null,
      audio_url: AUDIO + '?3',
      body: '',
      tags: [],
      likes: 0,
      published: true,
      created_at: '2026-11-18T10:00:00Z',
    },
    {
      id: '3f2a9c1e-aaaa-4bbb-8ccc-000000000004',
      title: 'draft song',
      type: 'music',
      img_url: null,
      audio_url: AUDIO + '?4',
      body: '',
      tags: [],
      likes: 0,
      published: false,
      created_at: '2026-11-17T10:00:00Z',
    },
  ];
  if (cfg.noMusic) posts = posts.filter((p) => p.type !== 'music');
  if (cfg.empty) posts = [];

  window.__writes = [];
  const write = (...w) => window.__writes.push(w);
  const fail = { data: null, error: { message: 'connection refused' } };

  function query(table) {
    let rows = table === 'posts' ? posts.slice() : [];
    let pendingUpdate = null;
    let eq = null;
    const q = {
      select: () => q,
      order: () => q,
      gte: () => q,
      limit: () => q,
      eq(k, v) {
        eq = [k, v];
        rows = rows.filter((r) => r[k] === v);
        return q;
      },
      insert(x) {
        const row = {
          id: 'new-' + Math.random().toString(36).slice(2),
          created_at: new Date().toISOString(),
          ...(Array.isArray(x) ? x[0] : x),
        };
        write('insert', table, row);
        if (table === 'posts') posts.unshift(row);
        rows = [row];
        return q;
      },
      update(x) {
        write('update', table, x);
        pendingUpdate = x;
        return q;
      },
      delete() {
        write('delete', table);
        q._delete = true;
        return q;
      },
      single: () => Promise.resolve({ data: rows[0] || null, error: null }),
      maybeSingle: () => Promise.resolve({ data: rows[0] || null, error: null }),
      then(resolve, reject) {
        if (cfg.down) return Promise.resolve(fail).then(resolve, reject);
        if (eq && pendingUpdate)
          posts.filter((r) => r[eq[0]] === eq[1]).forEach((r) => Object.assign(r, pendingUpdate));
        if (eq && q._delete) posts = posts.filter((r) => r[eq[0]] !== eq[1]);
        return Promise.resolve({ data: rows, error: null, count: rows.length }).then(
          resolve,
          reject,
        );
      },
    };
    return q;
  }

  window.supabase = {
    createClient: () => ({
      from: query,
      auth: {
        getSession: async () => ({ data: { session: cfg.session || null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        signInWithPassword: async ({ email }) => ({
          data: { user: { id: 'u1', email } },
          error: null,
        }),
        signOut: async () => ({ error: null }),
        updateUser: async () => ({ error: null }),
      },
      storage: {
        from: () => ({
          upload: async (path) => {
            write('upload', path);
            return { data: { path }, error: null };
          },
          getPublicUrl: (path) => ({ data: { publicUrl: AUDIO + '?' + path } }),
        }),
      },
    }),
  };
})();
