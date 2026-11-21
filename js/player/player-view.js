// Renders the Player into every place it appears: the desktop sidebar, the
// mobile bottom bar, the ♪ button in the mobile header, and the play
// buttons on tiles. Also wires those controls back to the Player.
import { $, $$, html, raw, setHTML, delegate } from '../core/dom.js';

const PLAY = raw('&#9654;');
const PAUSE = raw('&#9646;&#9646;');

export class PlayerView {
  constructor(player) {
    this.player = player;
    player.addEventListener('change', () => this.render());

    delegate(document, 'click', {
      'player-toggle': () => player.toggle(),
      'player-next': () => player.next(),
      'player-prev': () => player.prev(),
    });
    $('#vol').addEventListener('input', (e) => player.setVolume(parseFloat(e.target.value)));
  }

  render() {
    const { player } = this;
    const t = player.current;
    const has = Boolean(t);
    const icon = player.playing ? PAUSE : PLAY;
    const title = t ? t.title : '—';
    const counter =
      player.tracks.length > 1 ? `${player.index + 1} / ${player.tracks.length}` : '';
    // SoundCloud tracks get a credit linking back to the artist
    const credit =
      t && t.sc
        ? html`<a href="${t.link || t.sc}" target="_blank" rel="noopener">${t.artist ? t.artist + ' · ' : ''}via soundcloud ↗</a>`
        : '';

    // desktop sidebar
    $('#player-on').style.display = has ? 'block' : 'none';
    $('#no-music').style.display = has ? 'none' : 'block';
    $('#track-name').textContent = title;
    $('#track-counter').textContent = counter;
    setHTML($('#playbtn'), icon);
    setHTML($('#track-credit'), credit);

    // ♪ in the mobile header — the way in to music on phones
    const note = $('#mob-music');
    note.style.display = has ? '' : 'none';
    note.classList.toggle('on', player.playing);

    // mobile bottom bar — only after something has been played, so it never
    // covers the grid for visitors who don't want music
    $('#mob-player').classList.toggle('show', has && player.started);
    $('#mob-track').textContent = title;
    $('#mob-counter').textContent = counter;
    setHTML($('#mob-playbtn'), icon);
    setHTML($('#mob-credit'), credit);

    // play buttons on tiles
    for (const b of $$('.tile-play')) {
      const on = player.playing && b.closest('.tile')?.dataset.id === String(t && t.id);
      b.classList.toggle('on', on);
      setHTML(b, on ? PAUSE : PLAY);
    }
  }
}
