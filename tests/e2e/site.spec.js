import { test, expect } from '@playwright/test';
import { open, writes, ADMIN_SESSION } from './helpers.js';

test.describe('public site', () => {
  test('shows published posts newest first, hides drafts', async ({ page }) => {
    const { errors } = await open(page);
    await expect(page.locator('.tile')).toHaveCount(3);
    await expect(page.locator('.tile .t-title').first()).toHaveText('night song');
    await expect(page.locator('#pcount')).toHaveText('3 posts');
    expect(errors).toEqual([]);
  });

  test('falls back to sample posts when Supabase is down', async ({ page }) => {
    const { errors } = await open(page, '/', { stub: { down: true } });
    await expect(page.locator('.tile')).toHaveCount(14);
    await expect(page.locator('.tile img').first()).toHaveJSProperty('complete', true);
    expect(errors).toEqual([]);
  });

  test('filters by type', async ({ page }) => {
    await open(page);
    await page.click('.ftag[data-filter=photo]');
    await expect(page.locator('.tile')).toHaveCount(1);
    await expect(page.locator('.ftag.on')).toHaveText('photo');
    await page.click('.ftag[data-filter=music]');
    await expect(page.locator('.tile')).toHaveCount(2);
  });

  test('navigates between pages', async ({ page }) => {
    await open(page);
    await page.click('.nav-links [data-page=about]');
    await expect(page.locator('#page-about')).toHaveClass(/active/);
    await page.click('#snav-home');
    await expect(page.locator('#page-home')).toHaveClass(/active/);
  });

  test('lightbox opens, likes, and closes on backdrop', async ({ page }) => {
    await open(page);
    await page.locator('.tile[data-id$="0002"]').click();
    await expect(page.locator('.lb-title')).toHaveText('photo post');
    await expect(page.locator('.admin-post-btns')).toHaveCount(0);

    await page.click('.hbtn');
    await expect(page.locator('.hbtn span')).toHaveText('3');
    expect(await writes(page)).toContainEqual(['update', 'posts', { likes: 3 }]);
    expect(await page.evaluate(() => localStorage.getItem('liked_posts'))).toContain('0002');

    await page.mouse.click(5, 5);
    await expect(page.locator('#lb')).not.toHaveClass(/open/);
  });

  test('post text is escaped, never rendered as HTML', async ({ page }) => {
    await open(page, '/#admin', { stub: { session: ADMIN_SESSION } });
    await page.selectOption('#p-type', 'writing');
    await page.fill('#p-title', '<img src=x onerror="window.__pwned=1">');
    await page.uncheck('#p-draft');
    await page.click('[data-action=publish]');
    await expect(page.locator('#pfb')).toHaveText('✦ published.');
    await page.click('#snav-home');
    await expect(page.locator('.tile .t-title').first()).toHaveText(/<img/);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  });
});

test.describe('in-site admin (/#admin)', () => {
  test('signed out → login page; signing in opens the admin page', async ({ page }) => {
    await open(page, '/#admin');
    await expect(page.locator('#page-login')).toHaveClass(/active/);
    await page.fill('#login-email', 'k@example.com');
    await page.fill('#login-pass', 'secret');
    await page.press('#login-pass', 'Enter');
    await expect(page.locator('#page-admin')).toHaveClass(/active/);
    await expect(page.locator('#nav-admin-link')).toBeVisible();
  });

  test('publish, hide, edit and delete a post', async ({ page }) => {
    const { errors } = await open(page, '/#admin', { stub: { session: ADMIN_SESSION } });
    await expect(page.locator('#page-admin')).toHaveClass(/active/);

    await page.fill('#fp-input', 'hello');
    await expect(page.locator('#fp-lg')).toHaveText('hello');

    // music needs a file
    await page.selectOption('#p-type', 'music');
    await expect(page.locator('#audio-fld')).toBeVisible();
    await page.click('[data-action=publish]');
    await expect(page.locator('#pfb')).toHaveText('please select an audio file.');

    await page.selectOption('#p-type', 'writing');
    await page.fill('#p-title', 'new words');
    await page.fill('#p-body', 'line one\nline two');
    await page.fill('#p-tags', 'a, b');
    await page.uncheck('#p-draft');
    await page.click('[data-action=publish]');
    await expect(page.locator('#pfb')).toHaveText('✦ published.');

    await page.click('#snav-home');
    await page.locator('.tile', { hasText: 'new words' }).click();
    await expect(page.locator('.lb-body br')).toHaveCount(1);
    await expect(page.locator('.lb-tag')).toHaveText(['#a', '#b']);

    await page.click('[data-action=lb-toggle-published]');
    await expect(page.locator('.lb-type')).toContainText('draft');

    await page.click('[data-action=lb-edit]');
    await page.fill('#ef-title', 'edited');
    await page.click('[data-action=lb-save]');
    await expect(page.locator('.lb-title')).toHaveText('edited');

    await page.click('[data-action=lb-delete]');
    await expect(page.locator('.del-btn')).toHaveText('confirm delete?');
    await page.click('[data-action=lb-delete]');
    await expect(page.locator('#lb')).not.toHaveClass(/open/);
    await expect(page.locator('.tile', { hasText: 'edited' })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('editing a music post keeps it a music post', async ({ page }) => {
    await open(page, '/', { stub: { session: ADMIN_SESSION } });
    await page.locator('.tile', { hasText: 'night song' }).click();
    await page.click('[data-action=lb-edit]');
    await expect(page.locator('#ef-type')).toHaveValue('music');
  });

  test('logout returns to posts', async ({ page }) => {
    await open(page, '/#admin', { stub: { session: ADMIN_SESSION } });
    await page.click('[data-action=logout]');
    await expect(page.locator('#page-home')).toHaveClass(/active/);
  });
});
