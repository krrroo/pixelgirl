// The music player's logic: which tracks, which one is current, what plays
// next. It owns no DOM — PlayerView renders it — which keeps it testable.
//
// Emits 'change' whenever anything a view might show has changed.
export class Player extends EventTarget {
  // engines:      e.g. [HtmlAudioEngine, SoundCloudEngine]; the first one
  //               whose canPlay(track) is true plays that track
  // defaultTrack: played when there are no other tracks
  constructor({ engines, defaultTrack, volume = 1 }) {
    super();
    this.engines = engines;
    this.defaultTrack = { ...defaultTrack };
    this.tracks = [];
    this.index = -1;
    this.started = false; // has the visitor pressed play yet?
    this.engine = null;
    this.volume = volume;

    for (const e of engines) {
      e.setVolume(volume);
      e.addEventListener('play', () => this._changed());
      e.addEventListener('pause', () => this._changed());
      e.addEventListener('meta', () => this._changed());
      e.addEventListener('ended', () => {
        if (e === this.engine) this.next();
      });
    }
  }

  get current() {
    return this.tracks[this.index] || null;
  }

  get playing() {
    return Boolean(this.engine) && !this.engine.paused;
  }

  // Playlist = every published post with an audio file, in the order given
  // (newest first). If there are none, the default track. The current track
  // is matched by id, so hiding/deleting another post doesn't cut it off.
  setTracksFromPosts(posts) {
    const tracks = posts.filter((p) => p.audio && p.published !== false);
    this.setTracks(tracks.length ? tracks : [this.defaultTrack]);
  }

  setTracks(tracks) {
    const currentId = this.current && this.current.id;
    this.tracks = tracks;
    const stillThere = tracks.findIndex((t) => String(t.id) === String(currentId));
    if (stillThere !== -1) {
      this.index = stillThere;
    } else {
      if (this.engine) this.engine.pause();
      this.index = tracks.length ? 0 : -1;
      this.engine = null;
    }
    this._changed();
  }

  play(index = this.index) {
    if (!this.tracks.length) return;
    const n = this.tracks.length;
    this.index = ((index % n) + n) % n;
    const track = this.current;
    const engine = this.engines.find((e) => e.canPlay(track));
    if (!engine) return;
    if (this.engine && this.engine !== engine) this.engine.pause();
    this.engine = engine;
    this.started = true;
    engine.load(track);
    engine.play();
    this._changed();
  }

  toggle() {
    if (!this.tracks.length) return;
    if (!this.started || !this.engine) return this.play(Math.max(this.index, 0));
    if (this.engine.paused) this.engine.play();
    else this.engine.pause();
    this._changed();
  }

  next() {
    // a single track just loops
    this.play(this.tracks.length === 1 ? this.index : this.index + 1);
  }

  prev() {
    this.play(this.index - 1);
  }

  // Tile / lightbox button: toggles the current track, otherwise jumps to it.
  playById(id) {
    const i = this.tracks.findIndex((t) => String(t.id) === String(id));
    if (i === -1) return;
    if (i === this.index && this.started) this.toggle();
    else this.play(i);
  }

  setVolume(v) {
    this.volume = v;
    for (const e of this.engines) e.setVolume(v);
  }

  _changed() {
    this.dispatchEvent(new Event('change'));
  }
}
