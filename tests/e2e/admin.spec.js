import { test, expect } from '@playwright/test';
import { open, writes, ADMIN_SESSION } from './helpers.js';

const signedIn = { stub: { session: ADMIN_SESSION } };
const lastWrites = async (page, n) => (await writes(page)).slice(-n).map((w) => w[0]);

test.describe('admin app (admin.html) @mobile', () => {
  test.beforeEach(({ page }) => page.on('dialog', (d) => d.accept()));

  test('login', async ({ page }) => {
    await open(page, '/admin.html');
    await expect(page.locator('#login-screen')).toBeVisible();
    await page.click('#login-btn');
    await expect(page.locator('#login-error')).toHaveText('Enter email and password.');
    await page.fill('#email', 'k@example.com');
    await page.fill('#password', 'secret');
    await page.click('#login-btn');
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('.post-card')).toHaveCount(4);
  });

  test('composer: validation, text post, photo post', async ({ page }) => {
    const { errors } = await open(page, '/admin.html', signedIn);
    await page.click('#fab-new');
    await page.click('#post-btn');
    await expect(page.locator('#toast')).toHaveText('Choose a photo first');

    await page.click('.type-toggle [data-type=writing]');
    await expect(page.locator('#upload-zone')).toBeHidden();
    await page.fill('#caption-input', 'hello world');
    await page.click('#post-btn');
    await expect(page.locator('#toast')).toHaveText('Posted');
    await expect(page.locator('#sheet')).not.toHaveClass(/open/);

    await page.click('#fab-new');
    await page.setInputFiles('#file-input', 'samples/low-tide.jpg');
    await expect(page.locator('#upload-zone img')).toHaveCount(1);
    // picking a second photo replaces the first
    await page.setInputFiles('#file-input', 'samples/layers.jpg');
    await page.click('#post-btn');
    await expect(page.locator('#toast')).toHaveText('Posted');
    expect(await lastWrites(page, 2)).toEqual(['upload', 'insert']);
    expect(errors).toEqual([]);
  });

  test('feed: edit opens composer; music edit goes to Music tab; delete', async ({ page }) => {
    await open(page, '/admin.html', signedIn);
    await page.locator('.post-card', { hasText: 'hi' }).locator('.edit-link').click();
    await expect(page.locator('.sheet-title')).toHaveText('Edit post');
    await expect(page.locator('#caption-input')).toHaveValue('hi');
    await expect(page.locator('#upload-zone img')).toHaveCount(1); // existing image shown
    await page.click('#post-btn');
    await expect(page.locator('#toast')).toHaveText('Saved');

    await page.locator('.post-card', { hasText: '♪ night song' }).locator('.edit-link').click();
    await expect(page.locator('.tab-btn.active')).toContainText('Music');
    await expect(page.locator('#fab-new')).toBeHidden();

    await page.click('.tab-btn[data-view=feed]');
    const before = await page.locator('.post-card').count();
    await page.locator('.swipe-delete').first().click();
    await expect(page.locator('.post-card')).toHaveCount(before - 1);
  });

  test('music tab: add, hide, delete', async ({ page }) => {
    const { errors } = await open(page, '/admin.html', signedIn);
    await page.click('.tab-btn[data-view=music]');
    await expect(page.locator('.track-row')).toHaveCount(3);
    await expect(page.locator('#track-count')).toHaveText('· 2 live');

    await page.setInputFiles('#music-input', 'tests/e2e/fixtures/silence.wav');
    await expect(page.locator('#music-title')).toHaveValue('silence');
    await page.click('#music-save-btn');
    await expect(page.locator('#toast')).toHaveText('Added to playlist');
    await expect(page.locator('.track-row')).toHaveCount(4);
    const insert = (await writes(page)).find((w) => w[0] === 'insert');
    expect(insert[2]).toMatchObject({ type: 'music', title: 'silence', published: true });

    await page.locator('.track-row .t-pub').first().click();
    await expect(page.locator('#toast')).toHaveText('Track hidden');

    const del = page.locator('.track-row .t-del').first();
    await del.click();
    await expect(del).toHaveText('Sure?');
    await del.click();
    await expect(page.locator('#toast')).toHaveText('Track deleted');
    expect(errors).toEqual([]);
  });

  test('stats tab loads', async ({ page }) => {
    await open(page, '/admin.html', signedIn);
    await page.click('.tab-btn[data-view=stats]');
    await expect(page.locator('#stat-total')).toHaveText('0');
    await expect(page.locator('#stat-unique')).toHaveText('0');
  });
});
