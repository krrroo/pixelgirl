// Invisible watermark: hides the text MARK in the least significant bit of
// the blue channel of the first pixels. Invisible to the eye, and
// readWatermark() can read it back to prove an image came from this site.
//
// Limits worth knowing: it only survives lossless copies (a downloaded PNG).
// Re-saving as JPEG, screenshots, or uploading to Instagram/Pinterest wipes it.
export const MARK = 'p1x3lg1rl.com';

const MAX_BITS = 8 * 64; // marks are short; stop reading after 64 chars

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error('could not read image'));
    img.src = url;
  });
}

// Returns a watermarked PNG (lossless, so the mark survives), scaled down so
// its longest side is at most maxSize px — phone photos are 4000px+, which
// as PNG would be 20MB+.
export async function watermarkImage(file, { maxSize = 2000 } = {}) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const bits = [];
  for (const ch of MARK + '\0') {
    const code = ch.charCodeAt(0);
    for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
  }
  for (let i = 0; i < bits.length && i * 4 + 2 < d.length; i++) {
    d[i * 4 + 2] = (d[i * 4 + 2] & 0xfe) | bits[i];
  }
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
}

// Reads the hidden text back, or returns null if there isn't one.
// Also recognises images marked before the domain change ('pixelgirl.com').
export async function readWatermark(file) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let text = '';
  for (let i = 0; i + 8 <= MAX_BITS && (i + 7) * 4 + 2 < d.length; i += 8) {
    let code = 0;
    for (let b = 0; b < 8; b++) code = (code << 1) | (d[(i + b) * 4 + 2] & 1);
    if (code === 0) break;
    if (code < 32 || code > 126) return null; // not text → no mark
    text += String.fromCharCode(code);
  }
  return /^[a-z0-9.-]+\.[a-z]+$/i.test(text) ? text : null;
}
