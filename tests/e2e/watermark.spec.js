import { test, expect } from '@playwright/test';

// Runs the real watermark code in the browser (it needs <canvas>).
test('watermark: marks, scales down, and reads back', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/blank.html');
  const result = await page.evaluate(async () => {
    const { watermarkImage, readWatermark, MARK } = await import('/js/data/watermark.js');
    // a 3000×1500 test image (bigger than the 2000px cap)
    const c = document.createElement('canvas');
    c.width = 3000;
    c.height = 1500;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#7a5c8e';
    ctx.fillRect(0, 0, 3000, 1500);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
    const original = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    const marked = await watermarkImage(original);
    const bmp = await createImageBitmap(marked);
    return {
      mark: MARK,
      name: marked.name,
      type: marked.type,
      size: [bmp.width, bmp.height],
      read: await readWatermark(marked),
      readOriginal: await readWatermark(original),
    };
  });
  expect(result.mark).toBe('p1x3lg1rl.com');
  expect(result).toMatchObject({
    name: 'photo.png',
    type: 'image/png',
    size: [2000, 1000],
    read: 'p1x3lg1rl.com',
    readOriginal: null,
  });
});
