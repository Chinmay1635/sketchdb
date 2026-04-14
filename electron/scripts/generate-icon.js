const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');
const sharp = require('sharp');

async function run() {
  const sourcePng = path.resolve(__dirname, '..', '..', 'client', 'public', 'logo.png');
  const buildDir = path.resolve(__dirname, '..', 'build');
  const outputIco = path.resolve(buildDir, 'icon.ico');

  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Logo not found: ${sourcePng}`);
  }

  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(sourcePng)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(outputIco, icoBuffer);

  console.log(`Generated icon: ${outputIco}`);
}

run().catch((error) => {
  console.error('Failed to generate icon:', error.message);
  process.exit(1);
});
