// Pixel snow: big flakes are "*" glyphs, small ones single pixels.
export function startSnow() {
  const canvas = document.createElement('canvas');
  canvas.className = 'snow-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const COUNT = 88;
  const FLAKES = [];
  for (let i = 0; i < COUNT; i++) {
    const big = i < 20;
    FLAKES.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      big,
      speed: big ? (.15 + Math.random() * .2) : (.08 + Math.random() * .14),
      drift: (Math.random() - .5) * .1,
      alpha: big ? (.5 + Math.random() * .3) : (.3 + Math.random() * .3),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: .003 + Math.random() * .005,
    });
  }
  function drawFlake(ctx, x, y, alpha) {
    ctx.fillStyle = `rgba(220,210,230,${alpha})`;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;
    ctx.fillText('*', x, y);
    ctx.globalAlpha = 1;
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const f of FLAKES) {
      const px = Math.round(f.x), py = Math.round(f.y);
      if (f.big) { drawFlake(ctx, px, py, f.alpha); }
      else { ctx.fillStyle = `rgba(220,210,230,${f.alpha})`; ctx.fillRect(px, py, 1, 1); }
      f.wobble += f.wobbleSpeed;
      f.x += f.drift + Math.sin(f.wobble) * .15;
      f.y += f.speed;
      if (f.y > canvas.height + 6) { f.y = -6; f.x = Math.random() * canvas.width; }
      if (f.x > canvas.width + 6) f.x = -6;
      if (f.x < -6) f.x = canvas.width + 6;
    }
    requestAnimationFrame(draw);
  }
  draw();
}
