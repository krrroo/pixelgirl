// Everything that talks to the `posts` table and the media bucket lives here.
// UI code works with "post" objects (camelCase, ready to render); rows are
// the raw database shape. fromRow() is the one place that maps between them.
import { sb } from '../core/supabase.js';
import { MEDIA_BUCKET } from '../core/config.js';
import { longDate, shortDate } from '../core/format.js';
import { likes } from './likes.js';
import { SAMPLE_POSTS } from './sample-posts.js';

export function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    img: row.img_url || null,
    audio: row.audio_url || null,
    body: row.body || '',
    tags: row.tags || [],
    createdAt: row.created_at,
    date: longDate(row.created_at),
    shortDate: shortDate(row.created_at),
    likes: row.likes || 0,
    liked: likes.has(row.id),
    published: row.published !== false,
  };
}

function check({ data, error }) {
  if (error) throw error;
  return data;
}

// Newest first. Falls back to the sample posts if Supabase is unreachable
// or empty, and says which it used.
export async function loadPosts() {
  try {
    const rows = check(
      await sb.from('posts').select('*').order('created_at', { ascending: false }),
    );
    if (!rows || !rows.length) throw new Error('no posts in database');
    return { posts: rows.map(fromRow), source: 'supabase' };
  } catch (e) {
    console.warn('Supabase not connected, using sample posts:', e.message);
    const posts = SAMPLE_POSTS.map((p) => ({
      ...p,
      liked: likes.has(p.id),
      published: p.published !== false,
    }));
    return { posts, source: 'samples' };
  }
}

export async function listRows({ type } = {}) {
  let q = sb.from('posts').select('*');
  if (type) q = q.eq('type', type);
  return check(await q.order('created_at', { ascending: false })) || [];
}

export async function createPost(fields) {
  return check(
    await sb
      .from('posts')
      .insert([{ likes: 0, ...fields }])
      .select()
      .single(),
  );
}

export async function updatePost(id, fields) {
  check(await sb.from('posts').update(fields).eq('id', id));
}

export async function deletePost(id) {
  check(await sb.from('posts').delete().eq('id', id));
}

// Likes go through a database function that can only move the count by one —
// visitors have no permission to update posts directly. Returns the new count.
export async function changeLikes(id, delta) {
  return check(await sb.rpc('increment_likes', { post_id: id, delta }));
}

// Uploads a file to the media bucket and returns its public URL.
export async function uploadMedia(path, file, options = {}) {
  check(await sb.storage.from(MEDIA_BUCKET).upload(path, file, options));
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export const randomName = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
