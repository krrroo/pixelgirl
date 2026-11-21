import { describe, it, expect } from 'vitest';
import { parseTags, titleFromFilename, fileExt } from '../../js/core/format.js';
import { fromRow } from '../../js/data/posts.js';
import { likes } from '../../js/data/likes.js';
import { store } from '../../js/site/store.js';

describe('format helpers', () => {
  it('parseTags trims and drops empties', () => {
    expect(parseTags(' dreamy, 2025 ,, pink ')).toEqual(['dreamy', '2025', 'pink']);
  });
  it('titleFromFilename makes a readable title', () => {
    expect(titleFromFilename('grouper_-_heavy-water.mp3')).toBe('grouper heavy water');
  });
  it('fileExt', () => {
    expect(fileExt('a.b.mp3')).toBe('mp3');
  });
});

describe('likes', () => {
  it('remembers liked posts across reads', () => {
    likes.set('p1', true);
    likes.set(2, true);
    expect(likes.has('p1')).toBe(true);
    expect(likes.has(2)).toBe(true);
    likes.set('p1', false);
    expect(likes.has('p1')).toBe(false);
  });
  it('survives corrupted storage', () => {
    localStorage.setItem('liked_posts', '{nope');
    expect(likes.has('x')).toBe(false);
  });
});

describe('fromRow', () => {
  const row = {
    id: 'abc',
    title: 't',
    type: 'music',
    img_url: null,
    audio_url: 'https://x/a.mp3',
    body: null,
    tags: null,
    likes: null,
    published: null,
    created_at: '2026-11-21T10:00:00Z',
  };

  it('maps database rows to post objects with safe defaults', () => {
    const p = fromRow(row);
    expect(p).toMatchObject({
      id: 'abc',
      img: null,
      audio: 'https://x/a.mp3',
      body: '',
      tags: [],
      likes: 0,
      liked: false,
      published: true, // only an explicit false hides a post
      date: '21 nov 2026',
    });
  });

  it('picks up likes from this browser', () => {
    likes.set('abc', true);
    expect(fromRow(row).liked).toBe(true);
  });
});

describe('store', () => {
  const posts = [
    { id: 1, type: 'photo', published: true },
    { id: 2, type: 'writing', published: false },
    { id: 3, type: 'photo', published: true },
  ];

  it('hides drafts from visitors but not from the admin', () => {
    store.setUser(null);
    store.setFilter('all');
    store.setPosts(posts.map((p) => ({ ...p })));
    expect(store.visiblePosts.map((p) => p.id)).toEqual([1, 3]);
    store.setUser({ id: 'me' });
    expect(store.visiblePosts.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('filters by type', () => {
    store.setUser(null);
    store.setPosts(posts.map((p) => ({ ...p })));
    store.setFilter('photo');
    expect(store.visiblePosts.map((p) => p.id)).toEqual([1, 3]);
    store.setFilter('all');
  });

  it('finds posts by id whether given a number or a string', () => {
    store.setPosts(posts.map((p) => ({ ...p })));
    expect(store.find('3').id).toBe(3);
    store.removePost('3');
    expect(store.find(3)).toBeUndefined();
  });
});
