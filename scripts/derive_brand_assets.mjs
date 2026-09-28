import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function deriveAssets() {
  const masterPath = path.resolve('public/brand/vardhan-techverse-logo.jpg');
  if (!fs.existsSync(masterPath)) {
    throw new Error(`Authoritative master asset not found at ${masterPath}`);
  }

  console.log('Loading authoritative master asset:', masterPath);
  const masterImage = sharp(masterPath);
  const { data, info } = await masterImage.raw().toBuffer({ resolveWithObject: true });
  console.log(`Master asset loaded: ${info.width}x${info.height}, channels: ${info.channels}`);

  // Create transparent RGBA representation by removing white background without altering any logo geometry or pixels
  const rgbaBuffer = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];

    const whiteness = Math.min(r, g, b);
    let a;
    let outR = r;
    let outG = g;
    let outB = b;

    if (whiteness >= 253) {
      a = 0;
    } else if (whiteness >= 240) {
      const factor = (255 - whiteness) / 15;
      a = Math.round(255 * factor);
      outR = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - factor)) / factor)));
      outG = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - factor)) / factor)));
      outB = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - factor)) / factor)));
    } else {
      a = 255;
    }

    rgbaBuffer[i * 4] = outR;
    rgbaBuffer[i * 4 + 1] = outG;
    rgbaBuffer[i * 4 + 2] = outB;
    rgbaBuffer[i * 4 + 3] = a;
  }

  const transparentSharp = sharp(rgbaBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 }
  });

  // 1. logo-full.png: Transparent-background web lockup directly cropped to content boundaries
  const logoFullPngPath = path.resolve('public/brand/logo-full.png');
  const croppedLogo = transparentSharp.clone().extract({
    left: 400,
    top: 90,
    width: 1410,
    height: 745
  });
  await croppedLogo.png({ compressionLevel: 9 }).toFile(logoFullPngPath);
  console.log('Derived logo-full.png with background removed:', logoFullPngPath);

  // 2. Extract unchanged "V" emblem for icon-192.png and favicon.ico
  // Emblem bounding box in master: x: 664, y: 98, width: 728, height: 527
  const emblemBuffer = await transparentSharp.clone().extract({
    left: 664,
    top: 98,
    width: 728,
    height: 527
  }).png().toBuffer();

  // 3. icon-192.png: Placed on 192x192 canvas with proportions strictly preserved
  const icon192Path = path.resolve('public/brand/icon-192.png');
  const emblemFor192 = await sharp(emblemBuffer)
    .resize(150, 109, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 6, g: 18, b: 41, alpha: 1 } // Deep corporate navy background matching brand palette
    }
  })
    .composite([
      {
        input: emblemFor192,
        gravity: 'centre'
      }
    ])
    .png()
    .toFile(icon192Path);
  console.log('Derived icon-192.png from unchanged emblem:', icon192Path);

  // 4. favicon.ico: Multi-resolution / 32x32 favicon from unchanged emblem
  const faviconPath = path.resolve('public/favicon.ico');
  const emblemForFavicon = await sharp(emblemBuffer)
    .resize(26, 19, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 4,
      background: { r: 6, g: 18, b: 41, alpha: 1 }
    }
  })
    .composite([
      {
        input: emblemForFavicon,
        gravity: 'centre'
      }
    ])
    .png()
    .toFile(faviconPath);
  console.log('Derived favicon.ico from unchanged emblem:', faviconPath);

  // 5. og-image.jpg: 1200x630 composition canvas with unchanged master logo centered
  const ogImagePath = path.resolve('public/brand/og-image.jpg');
  const logoForOg = await sharp(masterPath)
    .resize(1000, 500, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite([
      {
        input: logoForOg,
        gravity: 'centre'
      }
    ])
    .jpeg({ quality: 95 })
    .toFile(ogImagePath);
  console.log('Derived og-image.jpg from unchanged master asset:', ogImagePath);

  console.log('Brand asset derivation complete. Authoritative master asset public/brand/vardhan-techverse-logo.jpg left untouched.');
}

deriveAssets().catch(err => {
  console.error('Derivation error:', err);
  process.exit(1);
});
