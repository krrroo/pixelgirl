import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../../js/player/player.js';

// A pretend audio engine: records what the Player asks of it.
class FakeEngine extends EventTarget {
  constructor(kind) {
    super();
    this.kind = kind;
    this.loaded = null;
    this.paused = true;
    this.volume = null;
  }
  canPlay(track) {
    return Boolean(track[this.kind]);
  }
  load(track) {
    this.loaded = track;
  }
  play() {
    this.paused = false;
    this.dispatchEvent(new Event('play'));
  }
  pause() {
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }
  setVolume(v) {
    this.volume = v;
  }
  finish() {
    this.paused = true;
    this.dispatchEvent(new Event('ended'));
  }
}

const DEFAULT = { id: 'default-track', title: 'default', sc: 'https://soundcloud.com/x/y' };
const song = (id, extra = {}) => ({ id, title: 'song ' + id, audio: `/${id}.mp3`, ...extra });

describe('Player', () => {
  let audio, sc, player;

  beforeEach(() => {
    audio = new FakeEngine('audio');
    sc = new FakeEngine('sc');
    player = new Player({ engines: [audio, sc], defaultTrack: DEFAULT, volume: 0.6 });
  });

  it('sets the starting volume on every engine', () => {
    expect(audio.volume).toBe(0.6);
    expect(sc.volume).toBe(0.6);
  });

  it('builds the playlist from published posts with audio, keeping their order', () => {
    player.setTracksFromPosts([
      song('a'),
      { id: 'photo', title: 'not a song' },
      song('b', { published: false }),
      song('c'),
    ]);
    expect(player.tracks.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('falls back to the default track when there are no songs', () => {
    player.setTracksFromPosts([{ id: 'photo' }]);
    expect(player.tracks).toHaveLength(1);
    expect(player.current.id).toBe('default-track');
  });

  it('does not touch any engine until play is pressed', () => {
    player.setTracksFromPosts([song('a')]);
    expect(audio.loaded).toBeNull();
    expect(player.started).toBe(false);
  });

  it('routes each track to the engine that can play it', () => {
    player.setTracksFromPosts([]);
    player.toggle();
    expect(sc.loaded.id).toBe('default-track');
    expect(audio.loaded).toBeNull();

    player.setTracksFromPosts([song('a')]);
    player.toggle();
    expect(audio.loaded.id).toBe('a');
  });

  it('toggle starts, pauses and resumes', () => {
    player.setTracksFromPosts([song('a')]);
    player.toggle();
    expect(player.playing).toBe(true);
    player.toggle();
    expect(player.playing).toBe(false);
    player.toggle();
    expect(player.playing).toBe(true);
  });

  it('next / prev wrap around the playlist', () => {
    player.setTracksFromPosts([song('a'), song('b'), song('c')]);
    player.play(0);
    player.prev();
    expect(player.current.id).toBe('c');
    player.next();
    expect(player.current.id).toBe('a');
  });

  it('auto-advances when a track ends', () => {
    player.setTracksFromPosts([song('a'), song('b')]);
    player.play(0);
    audio.finish();
    expect(player.current.id).toBe('b');
    expect(player.playing).toBe(true);
  });

  it('loops a single track', () => {
    player.setTracksFromPosts([song('a')]);
    player.play(0);
    audio.finish();
    expect(player.current.id).toBe('a');
    expect(player.playing).toBe(true);
  });

  it('keeps playing the current song when another post is removed', () => {
    player.setTracksFromPosts([song('a'), song('b'), song('c')]);
    player.play(1);
    player.setTracksFromPosts([song('a'), song('c'), song('b')].filter((t) => t.id !== 'a'));
    expect(player.current.id).toBe('b');
    expect(player.playing).toBe(true);
  });

  it('stops and resets when the current song is removed', () => {
    player.setTracksFromPosts([song('a'), song('b')]);
    player.play(1);
    player.setTracksFromPosts([song('a')]);
    expect(player.current.id).toBe('a');
    expect(player.playing).toBe(false);
  });

  it('playById jumps to a track, or toggles it if already current', () => {
    player.setTracksFromPosts([song('a'), song('b')]);
    player.playById('b');
    expect(player.current.id).toBe('b');
    expect(player.playing).toBe(true);
    player.playById('b');
    expect(player.playing).toBe(false);
  });

  it('matches ids as strings (data-id attributes are strings)', () => {
    player.setTracksFromPosts([song(1), song(2)]);
    player.playById('2');
    expect(player.current.id).toBe(2);
  });

  it('switching engines pauses the previous one', () => {
    player.setTracks([DEFAULT, song('a')]);
    player.play(0);
    expect(sc.paused).toBe(false);
    player.play(1);
    expect(sc.paused).toBe(true);
    expect(audio.paused).toBe(false);
  });

  it('emits change events for the view', () => {
    let changes = 0;
    player.addEventListener('change', () => changes++);
    player.setTracksFromPosts([song('a')]);
    player.toggle();
    expect(changes).toBeGreaterThanOrEqual(2);
  });
});
