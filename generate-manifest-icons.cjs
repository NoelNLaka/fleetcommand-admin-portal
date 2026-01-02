const sharp = require('sharp');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const logoPath = path.join(PUBLIC_DIR, 'actuon-logo.svg');

// Icon configurations for manifest
const manifestIcons = [
    { size: 192, name: 'pwa-192x192.png', padding: 20 },
    { size: 512, name: 'pwa-512x512.png', padding: 50 },
    { size: 512, name: 'maskable-icon.png', padding: 100 } // More padding for maskable
];

async function generateManifestIcons() {
    console.log('🎨 Generating PWA manifest icons from SVG logo...\n');

    for (const icon of manifestIcons) {
        const outputPath = path.join(PUBLIC_DIR, icon.name);

        // Calculate the logo size (icon size minus padding)
        const logoSize = icon.size - (icon.padding * 2);

        // Create white background with centered logo
        await sharp({
            create: {
                width: icon.size,
                height: icon.size,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
            .composite([{
                input: await sharp(logoPath)
                    .resize(logoSize, logoSize, {
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255, alpha: 0 }
                    })
                    .png()
                    .toBuffer(),
                gravity: 'center'
            }])
            .png()
            .toFile(outputPath);

        console.log(`  ✅ Created ${icon.name} (${icon.size}x${icon.size})`);
    }

    console.log('\n🎉 All manifest icons generated successfully!');
    console.log('📁 Icons saved to: public/');
    console.log('\n📝 Next steps:');
    console.log('  1. Commit and push the new icons to your repository');
    console.log('  2. Deploy to Vercel (it will auto-deploy on push)');
    console.log('  3. Wait for deployment to complete');
    console.log('  4. Re-run the APK workflow');
}

generateManifestIcons().catch(console.error);
