// '21 nov 2026'
export function longDate(iso) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .toLowerCase();
}

// '21/11/26'
export function shortDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

// 'Nov 21' in the viewer's locale (admin panel)
export function monthDay(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function parseTags(text) {
  return text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// 'grouper_-_heavy-water.mp3' → 'grouper heavy water'
export function titleFromFilename(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fileExt(name) {
  return name.split('.').pop();
}
