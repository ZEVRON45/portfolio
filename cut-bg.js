const sharp = require('sharp');

(async () => {
  const src = 'public/assets/photo-hero.png';
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = Buffer.from(data);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const lum = (r + g + b) / 3;
    const nearWhite = Math.min(r, g, b);
    let alpha = 255;
    if (nearWhite > 246 && lum > 250) alpha = 0;
    else if (nearWhite > 232 && lum > 238) alpha = Math.round(255 * (246 - nearWhite) / 14);
    buf[o + 3] = Math.min(buf[o + 3], alpha);
  }

  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile('public/assets/photo-hero-cut.png');
  console.log('DONE', width, 'x', height);
})();
