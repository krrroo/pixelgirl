// A fake SoundCloud Widget API (served in place of w.soundcloud.com/player/api.js).
// window.__SC_BLOCK = true simulates iOS Safari refusing to start the widget.
// window.__sc.calls records what the site asked the widget to do;
// window.__scWidget.fire('finish') etc. simulates widget events.
(function () {
  window.__sc = { calls: [] };
  const Events = { READY: 'ready', PLAY: 'play', PAUSE: 'pause', FINISH: 'finish' };
  function Widget() {
    const handlers = {};
    const w = {
      bind: (e, fn) => (handlers[e] = handlers[e] || []).push(fn),
      fire: (e) => (handlers[e] || []).forEach((fn) => fn()),
      play() {
        window.__sc.calls.push('play');
        if (!window.__SC_BLOCK) setTimeout(() => w.fire('play'), 20);
      },
      pause() {
        window.__sc.calls.push('pause');
        setTimeout(() => w.fire('pause'), 20);
      },
      setVolume: (v) => window.__sc.calls.push('volume:' + v),
      getCurrentSound: (cb) =>
        cb({
          title: 'gajówka',
          user: { username: 'bassvictim' },
          permalink_url: 'https://soundcloud.com/bassvictimm/gajowka',
        }),
    };
    window.__scWidget = w;
    setTimeout(() => w.fire('ready'), 20);
    return w;
  }
  window.SC = { Widget: Object.assign(Widget, { Events }) };
})();
