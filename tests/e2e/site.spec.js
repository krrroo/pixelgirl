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

  test('keeps drafts hidden even when signed in to admin in this browser', async ({ page }) => {
    await open(page, '/', { stub: { session: ADMIN_SESSION } });
    await expect(page.locator('.tile')).toHaveCount(3);
    await expect(page.locator('.tile', { hasText: 'draft song' })).toHaveCount(0);
  });

  test('has no admin UI', async ({ page }) => {
    await open(page, '/', { stub: { session: ADMIN_SESSION } });
    await page.locator('.tile[data-id$="0002"]').click();
    await expect(page.locator('.lb-title')).toHaveText('photo post');
    await expect(page.locator('#lb [data-action^="lb-"]')).toHaveCount(2); // close + like only
    await expect(page.locator('#page-admin, #page-login, [data-page=admin]')).toHaveCount(0);
  });

  test('old /#admin bookmark goes to the admin app', async ({ page }) => {
    await open(page, '/#admin');
    await expect(page).toHaveURL(/\/admin\.html$/);
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

  test('lightbox opens and closes on backdrop', async ({ page }) => {
    await open(page);
    await page.locator('.tile[data-id$="0002"]').click();
    await expect(page.locator('.lb-tag')).toHaveText(['#a']);
    await page.mouse.click(5, 5);
    await expect(page.locator('#lb')).not.toHaveClass(/open/);
  });

  test('likes go through increment_likes, never a direct update', async ({ page }) => {
    await open(page);
    await page.locator('.tile[data-id$="0002"]').click();
    await page.click('.hbtn');
    await expect(page.locator('.hbtn span')).toHaveText('3');
    await expect(page.locator('.hbtn')).toHaveClass(/liked/);
    expect(await page.evaluate(() => localStorage.getItem('liked_posts'))).toContain('0002');

    await page.click('.hbtn'); // unlike
    await expect(page.locator('.hbtn span')).toHaveText('2');

    const w = await writes(page);
    expect(w.filter((x) => x[0] === 'rpc').map((x) => x[2].delta)).toEqual([1, -1]);
    expect(w.filter((x) => x[0] === 'update')).toEqual([]);
  });

  test('likes on sample posts stay local (they are not in the database)', async ({ page }) => {
    await open(page, '/', { stub: { down: true } });
    await page.locator('.tile').first().click();
    await page.click('.hbtn');
    await expect(page.locator('.hbtn')).toHaveClass(/liked/);
    expect(await writes(page)).toEqual([]);
  });

  test('post text is escaped, never rendered as HTML', async ({ page }) => {
    await open(page, '/', { stub: { evil: true } });
    await page.click('.ftag[data-filter=photo]');
    await expect(page.locator('.tile img').first()).toHaveAttribute('alt', /<img/);
    await page.locator('.tile').first().click();
    await expect(page.locator('.lb-title')).toHaveText(/<img src=x/);
    expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  });

  test('password reset page sends you on to the admin app', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      document.getElementById('page-set-password').classList.add('active');
    });
    await page.fill('#sp-pass', 'abc');
    await page.click('#sp-btn');
    await expect(page.locator('#sp-fb')).toHaveText('password must be at least 6 characters.');
    await page.fill('#sp-pass', 'longenough');
    await page.fill('#sp-confirm', 'different');
    await page.click('#sp-btn');
    await expect(page.locator('#sp-fb')).toHaveText('passwords do not match.');
    await page.fill('#sp-confirm', 'longenough');
    await page.click('#sp-btn');
    await expect(page).toHaveURL(/\/admin\.html$/);
  });
});
