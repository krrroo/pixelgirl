// Which posts this browser has liked. Kept in localStorage so a refresh
// doesn't let someone like the same post twice (from the same browser).
const KEY = 'liked_posts';

function read() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export const likes = {
  has(id) {
    return read().has(id);
  },
  set(id, liked) {
    const all = read();
    if (liked) all.add(id);
    else all.delete(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...all]));
    } catch {
      /* private mode / storage full — likes just won't persist */
    }
  },
};
