const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

// Apple touch icon sizes
const appleIconSizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 167, name: 'apple-touch-icon-ipad.png' },
  { size: 152, name: 'apple-touch-icon-ipad-retina.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' }
];

// Splash screen sizes for various iOS devices
const splashScreens = [
  // iPhone 15 Pro Max, 14 Pro Max
  { width: 1290, height: 2796, name: 'apple-splash-2796-1290.png', orientation: 'portrait' },
  { width: 2796, height: 1290, name: 'apple-splash-1290-2796.png', orientation: 'landscape' },

  // iPhone 15 Pro, 15, 14 Pro
  { width: 1179, height: 2556, name: 'apple-splash-2556-1179.png', orientation: 'portrait' },
  { width: 2556, height: 1179, name: 'apple-splash-1179-2556.png', orientation: 'landscape' },

  // iPhone 14, 13, 12
  { width: 1170, height: 2532, name: 'apple-splash-2532-1170.png', orientation: 'portrait' },
  { width: 2532, height: 1170, name: 'apple-splash-1170-2532.png', orientation: 'landscape' },

  // iPhone 13 mini, 12 mini
  { width: 1080, height: 2340, name: 'apple-splash-2340-1080.png', orientation: 'portrait' },
  { width: 2340, height: 1080, name: 'apple-splash-1080-2340.png', orientation: 'landscape' },

  // iPhone 11 Pro Max, XS Max
  { width: 1242, height: 2688, name: 'apple-splash-2688-1242.png', orientation: 'portrait' },
  { width: 2688, height: 1242, name: 'apple-splash-1242-2688.png', orientation: 'landscape' },

  // iPhone 11, XR
  { width: 828, height: 1792, name: 'apple-splash-1792-828.png', orientation: 'portrait' },
  { width: 1792, height: 828, name: 'apple-splash-828-1792.png', orientation: 'landscape' },

  // iPad Pro 12.9"
  { width: 2048, height: 2732, name: 'apple-splash-2732-2048.png', orientation: 'portrait' },
  { width: 2732, height: 2048, name: 'apple-splash-2048-2732.png', orientation: 'landscape' },

  // iPad Pro 11"
  { width: 1668, height: 2388, name: 'apple-splash-2388-1668.png', orientation: 'portrait' },
  { width: 2388, height: 1668, name: 'apple-splash-1668-2388.png', orientation: 'landscape' },

  // iPad Air, iPad 10.9"
  { width: 1640, height: 2360, name: 'apple-splash-2360-1640.png', orientation: 'portrait' },
  { width: 2360, height: 1640, name: 'apple-splash-1640-2360.png', orientation: 'landscape' },

  // iPad Mini
  { width: 1536, height: 2048, name: 'apple-splash-2048-1536.png', orientation: 'portrait' },
  { width: 2048, height: 1536, name: 'apple-splash-1536-2048.png', orientation: 'landscape' }
];

const logoPath = path.join(PUBLIC_DIR, 'actuon-logo.svg');
const backgroundColor = '#FFFFFF';

async function generateAppleIcons() {
  console.log('📱 Generating Apple touch icons...');

  for (const icon of appleIconSizes) {
    const outputPath = path.join(PUBLIC_DIR, icon.name);

    await sharp(logoPath)
      .resize(icon.size, icon.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Created ${icon.name} (${icon.size}x${icon.size})`);
  }
}

async function generateSplashScreens() {
  console.log('\n🎨 Generating splash screens...');

  for (const splash of splashScreens) {
    const outputPath = path.join(PUBLIC_DIR, splash.name);

    // Calculate logo size (30% of the smaller dimension)
    const logoSize = Math.min(splash.width, splash.height) * 0.3;

    // Create a white background and overlay the logo in the center
    await sharp({
      create: {
        width: splash.width,
        height: splash.height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
      .composite([{
        input: await sharp(logoPath)
          .resize(Math.round(logoSize), Math.round(logoSize), {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Created ${splash.name} (${splash.width}x${splash.height})`);
  }
}

async function generateAssets() {
  try {
    if (!fs.existsSync(logoPath)) {
      console.error('❌ Logo file not found:', logoPath);
      process.exit(1);
    }

    console.log('🚀 Starting PWA asset generation...\n');

    await generateAppleIcons();
    await generateSplashScreens();

    console.log('\n✅ All PWA assets generated successfully!');
    console.log(`\n📁 Assets saved to: ${PUBLIC_DIR}`);
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

generateAssets();
