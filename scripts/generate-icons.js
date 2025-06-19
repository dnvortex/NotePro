import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SVG_PATH = path.join(__dirname, '../client/public/icons/icon.svg');
const ICONS_DIR = path.join(__dirname, '../client/public/icons');

// Ensure the icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Size variations for the icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate PNG icons for all sizes
async function generateIcons() {
  try {
    const svgBuffer = fs.readFileSync(SVG_PATH);
    
    for (const size of sizes) {
      const outputFilename = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFilename);
        
      console.log(`Generated: ${outputFilename}`);
    }
    
    console.log('All icons generated successfully');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();