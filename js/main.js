// Entry point for the public site: creates each part and connects them.
// Modules don't import each other's internals — they meet here or via the store.
import { $ } from './core/dom.js';
import { DEFAULT_TRACK, DEFAULT_VOLUME } from './core/config.js';
import { loadPosts } from './data/posts.js';
import { trackVisit } from './data/tracking.js';
import { HtmlAudioEngine, SoundCloudEngine } from './player/engines.js';
import { Player } from './player/player.js';
import { PlayerView } from './player/player-view.js';
import { store } from './site/store.js';
import { Grid } from './site/grid.js';
import { Lightbox } from './site/lightbox.js';
import { initRouter, handleHash } from './site/router.js';
import { initAuth } from './site/auth.js';
import { initAdminPanel } from './site/admin-panel.js';
import { startSnow } from './site/snow.js';

const player = new Player({
  engines: [
    new HtmlAudioEngine($('#aud')),
    new SoundCloudEngine({ iframe: $('#sc-frame'), fallbackEl: $('#sc-wrap') }),
  ],
  defaultTrack: DEFAULT_TRACK,
  volume: DEFAULT_VOLUME,
});
const playerView = new PlayerView(player);

const lightbox = new Lightbox({ onPlay: (id) => player.playById(id) });
new Grid({
  onOpen: (id) => lightbox.open(id),
  onPlay: (id) => player.playById(id),
});

// keep the playlist in step with posts (new / hidden / deleted songs)
store.addEventListener('posts', () => player.setTracksFromPosts(store.posts));
// tiles are re-rendered on every change; repaint their play buttons
$('#grid').addEventListener('rendered', () => playerView.render());

startSnow();
initRouter();
initAdminPanel();
trackVisit();

await initAuth();
const { posts, source } = await loadPosts();
store.setPosts(posts, source);
handleHash();
