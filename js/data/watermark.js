// Embeds an invisible mark ("pixelgirl.com") in the least significant bit of
// the blue channel of the first pixels, then re-encodes as PNG (lossless, so
// the mark survives). Proves origin if an image is reposted without credit.
export function watermarkImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const mark = 'pixelgirl.com\0';
      const bits = [];
      for (const ch of mark) {
        const code = ch.charCodeAt(0);
        for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
      }
      // encode into LSB of blue channel
      for (let i = 0; i < bits.length && i * 4 + 2 < d.length; i++) {
        d[i * 4 + 2] = (d[i * 4 + 2] & 0xFE) | bits[i];
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(blob => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' }));
      }, 'image/png');
    };
    img.src = url;
  });
}
