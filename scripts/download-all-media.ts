/**
 * Download all WordPress media and update content references
 *
 * Usage: npx tsx scripts/download-all-media.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const WP_BASE_URL = 'https://3.93.147.195';
const IMAGES_DIR = path.join(process.cwd(), 'public/images/wp-content');
const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');

// Allow self-signed certificates
const agent = new https.Agent({ rejectUnauthorized: false });

interface WPMedia {
  id: number;
  source_url: string;
  title: { rendered: string };
}

async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${WP_BASE_URL}${endpoint}`;
  console.log(`Fetching: ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}`));
        }
      });
    }).on('error', reject);
  });
}

async function downloadFile(imageUrl: string, outputPath: string): Promise<boolean> {
  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    return true;
  }

  // Ensure directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve) => {
    const protocol = imageUrl.startsWith('https') ? https : http;
    const options = imageUrl.startsWith('https') ? { agent } : {};

    protocol.get(imageUrl, options, (res: any) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        downloadFile(res.headers.location, outputPath).then(resolve);
        return;
      }

      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
        fileStream.on('error', () => resolve(false));
      } else {
        console.log(`  Failed: ${imageUrl} (${res.statusCode})`);
        resolve(false);
      }
    }).on('error', () => {
      console.log(`  Error: ${imageUrl}`);
      resolve(false);
    });
  });
}

function getLocalPath(wpUrl: string): string {
  // Extract path after wp-content/uploads/
  const match = wpUrl.match(/wp-content\/uploads\/(.+)/);
  if (match) {
    return `/images/wp-content/uploads/${match[1]}`;
  }
  // Fallback: use filename
  const filename = path.basename(wpUrl.split('?')[0]);
  return `/images/wp-content/${filename}`;
}

function getOutputPath(wpUrl: string): string {
  const localPath = getLocalPath(wpUrl);
  return path.join(process.cwd(), 'public', localPath);
}

async function main() {
  console.log('🖼️  Downloading all WordPress media...\n');

  // Create output directory
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Fetch all media (paginated)
  let page = 1;
  let allMedia: WPMedia[] = [];

  while (true) {
    const media = await fetchJson<WPMedia[]>(`/wp-json/wp/v2/media?per_page=100&page=${page}`);
    if (media.length === 0) break;
    allMedia = allMedia.concat(media);
    page++;
    if (media.length < 100) break;
  }

  console.log(`Found ${allMedia.length} media items\n`);

  // Download each media item
  let downloaded = 0;
  let failed = 0;

  for (const item of allMedia) {
    const outputPath = getOutputPath(item.source_url);
    console.log(`Downloading: ${path.basename(item.source_url)}`);

    const success = await downloadFile(item.source_url, outputPath);
    if (success) {
      downloaded++;
    } else {
      failed++;
    }
  }

  console.log(`\n✅ Downloaded: ${downloaded}`);
  console.log(`❌ Failed: ${failed}`);

  // Now scan blog content for image URLs and collect unique ones
  console.log('\n📝 Scanning blog content for image URLs...\n');

  const mdFiles = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const imageUrls = new Set<string>();

  // Patterns to match WordPress image URLs
  const urlPatterns = [
    /https?:\/\/(?:www\.)?vivaspot\.com\/wp-content\/uploads\/[^\s\)\]"']+/gi,
    /https?:\/\/3\.93\.147\.195\/wp-content\/uploads\/[^\s\)\]"']+/gi,
    /http:\/\/3\.93\.147\.195\/wp-content\/uploads\/[^\s\)\]"']+/gi,
  ];

  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');

    for (const pattern of urlPatterns) {
      const matches = content.match(pattern) || [];
      matches.forEach(url => imageUrls.add(url));
    }
  }

  console.log(`Found ${imageUrls.size} unique image URLs in blog content\n`);

  // Download any missing images from content
  for (const url of imageUrls) {
    const outputPath = getOutputPath(url);
    if (!fs.existsSync(outputPath)) {
      console.log(`Downloading missing: ${path.basename(url)}`);
      // Normalize URL to use the IP if it's vivaspot.com
      const normalizedUrl = url.replace('www.vivaspot.com', '3.93.147.195').replace('http://', 'https://');
      await downloadFile(normalizedUrl, outputPath);
    }
  }

  // Update markdown files to use local paths
  console.log('\n✏️  Updating image references in blog posts...\n');

  for (const file of mdFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const url of imageUrls) {
      if (content.includes(url)) {
        const localPath = getLocalPath(url);
        content = content.split(url).join(localPath);
        modified = true;
      }
    }

    // Also handle http:// variants
    const httpUrls = Array.from(imageUrls).map(u => u.replace('https://', 'http://'));
    for (const url of httpUrls) {
      if (content.includes(url)) {
        const localPath = getLocalPath(url.replace('http://', 'https://'));
        content = content.split(url).join(localPath);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`  Updated: ${file}`);
    }
  }

  console.log('\n✅ Media migration complete!');
}

main().catch(console.error);
