/**
 * Download missing images from production vivaspot.com
 *
 * Usage: npx tsx scripts/download-missing-from-prod.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');

// Missing images that returned 404 from dev server
const missingImages = [
  'https://www.vivaspot.com/wp-content/uploads/hot-summer-672x1024.png',
  'https://www.vivaspot.com/wp-content/uploads/2020/07/Guide-for-Brewers-3.pdf',
  'https://www.vivaspot.com/wp-content/uploads/2021/03/SMS-Marketing-Statistics-MobileMonkey-1-2.png',
  'https://www.vivaspot.com/wp-content/uploads/2020/11/Connecting-Vivaspot-to-your-Email-Service-410x1024.png',
  'https://www.vivaspot.com/wp-content/uploads/2021/05/Screen-Shot-2021-05-06-at-8.20.49-AM.png',
  'https://www.vivaspot.com/wp-content/uploads/2020/09/Screen-Shot-2020-09-03-at-9.55.59-AM.png',
  'https://www.vivaspot.com/wp-content/uploads/2021/02/Maximizing-WiFi-performance-with-Vivaspot-410x1024.png',
  'https://www.vivaspot.com/wp-content/uploads/Screenshot-2024-05-30-at-4.51.08%E2%80%AFPM.png',
  'https://www.vivaspot.com/wp-content/uploads/2021/09/fromthevine-image-with-medallion-1024x488.jpg',
  'https://www.vivaspot.com/wp-content/uploads/2020/10/Screen-Shot-2020-10-24-at-1.50.52-PM.png',
  'https://www.vivaspot.com/wp-content/uploads/2021/04/VivaSpot-GuardianTM-Built-in-protection-and-security-for-your-WiFi-device-3-1024x1024.png',
  'https://www.vivaspot.com/wp-content/uploads/2020/07/VivaSpot-Marketing-Campaigns-072420.pdf',
  'https://www.vivaspot.com/wp-content/uploads/2022/01/BirthdayEmailsGraphs-1024x311.png',
  'https://www.vivaspot.com/wp-content/uploads/2020/07/Contact-Tracing-v1.pdf',
];

function getLocalPath(wpUrl: string): string {
  const match = wpUrl.match(/wp-content\/uploads\/(.+)/);
  if (match) {
    return `/images/wp-content/uploads/${match[1]}`;
  }
  const filename = path.basename(wpUrl.split('?')[0]);
  return `/images/wp-content/${filename}`;
}

function getOutputPath(wpUrl: string): string {
  const localPath = getLocalPath(wpUrl);
  return path.join(process.cwd(), 'public', localPath);
}

async function downloadFile(imageUrl: string, outputPath: string): Promise<boolean> {
  if (fs.existsSync(outputPath)) {
    console.log(`  Already exists: ${path.basename(outputPath)}`);
    return true;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve) => {
    https.get(imageUrl, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          console.log(`  Following redirect...`);
          downloadFile(redirectUrl, outputPath).then(resolve);
        } else {
          resolve(false);
        }
        return;
      }

      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`  ✓ Downloaded: ${path.basename(outputPath)}`);
          resolve(true);
        });
        fileStream.on('error', () => resolve(false));
      } else {
        console.log(`  ✗ Failed (${res.statusCode}): ${path.basename(imageUrl)}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`  ✗ Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🔍 Downloading missing images from vivaspot.com...\n');

  let downloaded = 0;
  let failed = 0;

  for (const url of missingImages) {
    console.log(`Fetching: ${path.basename(decodeURIComponent(url))}`);
    const outputPath = getOutputPath(decodeURIComponent(url));
    const success = await downloadFile(url, outputPath);
    if (success) downloaded++;
    else failed++;
  }

  console.log(`\n✅ Downloaded: ${downloaded}`);
  console.log(`❌ Failed: ${failed}`);

  // Update markdown files to use local paths
  console.log('\n✏️  Updating remaining image references...\n');

  const mdFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));

  for (const file of mdFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const url of missingImages) {
      const decodedUrl = decodeURIComponent(url);
      // Check various URL formats
      const variants = [
        url,
        decodedUrl,
        url.replace('https://www.', 'https://'),
        url.replace('https://www.', 'http://www.'),
        url.replace('https://www.', 'http://'),
      ];

      for (const variant of variants) {
        if (content.includes(variant)) {
          const localPath = getLocalPath(decodedUrl);
          content = content.split(variant).join(localPath);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  Updated: ${file}`);
    }
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
