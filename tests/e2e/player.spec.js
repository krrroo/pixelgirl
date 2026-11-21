import { test, expect } from '@playwright/test';
import { open, scCalls } from './helpers.js';

const paused = (page) => page.evaluate(() => document.getElementById('aud').paused);

test.describe('music player (desktop sidebar)', () => {
  test('playlist = published songs; tile, next and auto-advance', async ({ page }) => {
    const { errors } = await open(page);
    await expect(page.locator('#track-name')).toHaveText('night song');
    await expect(page.locator('#track-counter')).toHaveText('1 / 2'); // draft excluded

    await page.locator('.tile', { hasText: 'second song' }).locator('.tile-play').click();
    await expect(page.locator('#track-name')).toHaveText('second song');
    await expect(page.locator('#lb')).not.toHaveClass(/open/); // ▶ doesn't open the post
    await expect(page.locator('.tile-play.on')).toHaveCount(1);
    expect(await paused(page)).toBe(false);

    await page.click('#playbtn');
    await expect.poll(() => paused(page)).toBe(true);

    await page.click('.player-controls [data-action=player-next]');
    await expect(page.locator('#track-name')).toHaveText('night song');

    await page.evaluate(() => document.getElementById('aud').dispatchEvent(new Event('ended')));
    await expect(page.locator('#track-name')).toHaveText('second song');
    expect(errors).toEqual([]);
  });

  test('lightbox ▶ plays that song', async ({ page }) => {
    await open(page);
    await page.locator('.tile', { hasText: 'second song' }).click();
    await page.click('.lb-play-btn');
    await expect(page.locator('#track-name')).toHaveText('second song');
  });

  test('no songs → SoundCloud default track, loaded only on play', async ({ page }) => {
    const scRequests = [];
    page.on('request', (r) => r.url().includes('soundcloud') && scRequests.push(r.url()));
    const { errors } = await open(page, '/', { stub: { noMusic: true } });

    await expect(page.locator('#track-name')).toHaveText('gajówka');
    expect(scRequests).toEqual([]); // nothing from SoundCloud until play

    await page.click('#playbtn');
    await expect.poll(() => scCalls(page)).toContain('play');
    await expect(page.locator('#track-credit')).toHaveText('bassvictim · via soundcloud ↗');
    await expect(page.locator('#playbtn')).toHaveText('▮▮');

    await page.locator('#vol').fill('0.3');
    expect(await scCalls(page)).toContain('volume:30');

    // single track loops
    await page.evaluate(() => window.__scWidget.fire('finish'));
    await expect.poll(async () => (await scCalls(page)).filter((c) => c === 'play').length).toBe(2);
    expect(errors).toEqual([]);
  });

  test('Supabase down → default track still plays', async ({ page }) => {
    await open(page, '/', { stub: { down: true } });
    await expect(page.locator('#track-name')).toHaveText('gajówka');
  });
});

test.describe('music player (phone) @mobile', () => {
  test('♪ in the header starts music and shows the bottom bar', async ({ page }) => {
    const { errors } = await open(page, '/', { stub: { noMusic: true } });
    await expect(page.locator('#mob-music')).toBeVisible();
    await expect(page.locator('#mob-player')).toBeHidden();
    await page.tap('#mob-music');
    await expect(page.locator('#mob-player')).toBeVisible();
    await expect(page.locator('#mob-track')).toHaveText('gajówka');
    await expect(page.locator('#mob-music')).toHaveClass(/on/);
    expect(errors).toEqual([]);
  });

  test('tile ▶ buttons are always visible on touch screens', async ({ page }) => {
    await open(page);
    await expect(page.locator('.tile-play').first()).toHaveCSS('opacity', '1');
  });

  test('iOS-style block → SoundCloud player is revealed, then hides once playing', async ({
    page,
  }) => {
    await open(page, '/', { stub: { noMusic: true }, scBlock: true });
    await page.tap('#mob-music');
    await expect(page.locator('#sc-wrap')).toHaveClass(/show/, { timeout: 5000 });
    await page.evaluate(() => window.__scWidget.fire('play')); // visitor taps SoundCloud's button
    await expect(page.locator('#sc-wrap')).not.toHaveClass(/show/);
    await expect(page.locator('#mob-playbtn')).toHaveText('▮▮');
  });
});
