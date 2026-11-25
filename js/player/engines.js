// Audio engines. The Player doesn't care where sound comes from: each engine
// implements the same small interface and reports back with events.
//
//   load(track)      prepare a track (doesn't start it)
//   play() / pause()
//   paused           boolean
//   setVolume(0..1)
//   events:          'play', 'pause', 'ended', 'meta' (track info changed)

// Plain audio files (MP3s uploaded to Supabase storage).
export class HtmlAudioEngine extends EventTarget {
  constructor(audioEl) {
    super();
    this.el = audioEl;
    // forwarding the element's own events also keeps us in sync with iOS
    // lock-screen and headphone controls
    for (const type of ['play', 'pause', 'ended']) {
      audioEl.addEventListener(type, () => this.dispatchEvent(new Event(type)));
    }
  }

  canPlay(track) {
    return Boolean(track.audio);
  }

  load(track) {
    if (this.el.getAttribute('src') !== track.audio) this.el.src = track.audio;
  }

  play() {
    this.el.play().catch(() => {
      /* blocked or failed — the 'pause' state stays, UI stays honest */
    });
  }

  pause() {
    this.el.pause();
  }

  get paused() {
    return this.el.paused;
  }

  setVolume(v) {
    this.el.volume = v;
  }
}

// SoundCloud tracks, played through SoundCloud's own widget (hidden iframe)
// and controlled with its JS API — the artist-approved way to embed.
const SC_API = 'https://w.soundcloud.com/player/api.js';
const SC_PLAYER = 'https://w.soundcloud.com/player/';
const SC_OPTIONS =
  '&auto_play=false&buying=false&sharing=false&download=false' +
  '&show_artwork=false&show_comments=false&visual=false';

export class SoundCloudEngine extends EventTarget {
  // iframe:      the (hidden) widget iframe
  // fallbackEl:  wrapper shown if the browser won't let us start the hidden
  //              widget (iOS Safari can refuse) — then a tap on it works
  constructor({ iframe, fallbackEl, revealAfterMs = 2000 }) {
    super();
    this.iframe = iframe;
    this.fallbackEl = fallbackEl;
    this.revealAfterMs = revealAfterMs;
    this.widget = null;
    this.ready = null;
    this.track = null;
    this._paused = true;
    this._volume = 1;
    this._revealTimer = null;
  }

  canPlay(track) {
    return Boolean(track.sc);
  }

  load(track) {
    this.track = track;
    this._ensureWidget().catch(() => {});
  }

  play() {
    this._ensureWidget()
      .then((w) => {
        w.play();
        this._armFallback();
      })
      .catch(() => {});
  }

  pause() {
    if (this.widget) this.widget.pause();
  }

  get paused() {
    return this._paused;
  }

  setVolume(v) {
    this._volume = v;
    if (this.widget) this.widget.setVolume(Math.round(v * 100));
  }

  // Loads SoundCloud's script and widget once, on first use — visitors who
  // never press play never contact SoundCloud.
  _ensureWidget() {
    if (this.ready) return this.ready;
    this.ready = loadScript(SC_API).then(
      () =>
        new Promise((resolve) => {
          this.iframe.src = SC_PLAYER + '?url=' + encodeURIComponent(this.track.sc) + SC_OPTIONS;
          const SC = window.SC;
          const w = SC.Widget(this.iframe);
          const E = SC.Widget.Events;
          w.bind(E.READY, () => {
            this.widget = w;
            w.setVolume(Math.round(this._volume * 100));
            // use SoundCloud's own title/artist so the credit is always right
            w.getCurrentSound((snd) => {
              if (!snd) return;
              Object.assign(this.track, {
                title: snd.title || this.track.title,
                artist: snd.user && snd.user.username,
                link: snd.permalink_url || this.track.sc,
              });
              this.dispatchEvent(new Event('meta'));
            });
            resolve(w);
          });
          w.bind(E.PLAY, () => {
            this._paused = false;
            this._hideFallback();
            this.dispatchEvent(new Event('play'));
          });
          w.bind(E.PAUSE, () => {
            this._paused = true;
            this.dispatchEvent(new Event('pause'));
          });
          w.bind(E.FINISH, () => {
            this._paused = true;
            this.dispatchEvent(new Event('ended'));
          });
        }),
    );
    return this.ready;
  }

  _armFallback() {
    clearTimeout(this._revealTimer);
    this._revealTimer = setTimeout(() => {
      if (this._paused && this.fallbackEl) this.fallbackEl.classList.add('show');
    }, this.revealAfterMs);
  }

  _hideFallback() {
    clearTimeout(this._revealTimer);
    if (this.fallbackEl) this.fallbackEl.classList.remove('show');
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('could not load ' + src));
    document.head.appendChild(s);
  });
}
