/**
 * WordPress to Astro Migration Script
 *
 * Fetches all content from the VivaSpot WordPress site and converts it to
 * Markdown files compatible with Astro's content collections.
 *
 * Usage: npx tsx scripts/migrate-wp.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const WP_BASE_URL = 'https://3.93.147.195';
const OUTPUT_DIR = path.join(process.cwd(), 'src/content/blog');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/blog');

// Allow self-signed certificates
const agent = new https.Agent({ rejectUnauthorized: false });

interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  categories: number[];
  tags: number[];
  featured_media: number;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
}

interface WPMedia {
  id: number;
  source_url: string;
  title: { rendered: string };
}

// Simple HTML to Markdown converter (handles Elementor soup)
function htmlToMarkdown(html: string): string {
  let md = html;

  // Remove Elementor wrapper divs but keep content
  md = md.replace(/<div[^>]*class="[^"]*elementor[^"]*"[^>]*>/gi, '');
  md = md.replace(/<\/div>/gi, '\n');

  // Convert headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');

  // Convert paragraphs
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');

  // Convert bold/strong
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

  // Convert italic/em
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Convert links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Convert images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Convert lists
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n');

  // Convert blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n');

  // Convert line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Remove figure tags but keep content
  md = md.replace(/<figure[^>]*>/gi, '');
  md = md.replace(/<\/figure>/gi, '');
  md = md.replace(/<figcaption[^>]*>(.*?)<\/figcaption>/gi, '*$1*\n');

  // Remove remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#8217;/g, "'");
  md = md.replace(/&#8220;/g, '"');
  md = md.replace(/&#8221;/g, '"');
  md = md.replace(/&#8211;/g, '–');
  md = md.replace(/&#8212;/g, '—');
  md = md.replace(/&rsquo;/g, "'");
  md = md.replace(/&lsquo;/g, "'");
  md = md.replace(/&rdquo;/g, '"');
  md = md.replace(/&ldquo;/g, '"');

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();

  return md;
}

// Strip HTML tags for excerpt
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').trim().slice(0, 300);
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

async function downloadImage(imageUrl: string, filename: string): Promise<string | null> {
  const outputPath = path.join(IMAGES_DIR, filename);

  // Skip if already downloaded
  if (fs.existsSync(outputPath)) {
    console.log(`  Image already exists: ${filename}`);
    return `/images/blog/${filename}`;
  }

  return new Promise((resolve) => {
    const protocol = imageUrl.startsWith('https') ? https : require('http');

    protocol.get(imageUrl, { agent }, (res: any) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`  Downloaded: ${filename}`);
          resolve(`/images/blog/${filename}`);
        });
      } else {
        console.log(`  Failed to download: ${imageUrl} (${res.statusCode})`);
        resolve(null);
      }
    }).on('error', () => {
      console.log(`  Error downloading: ${imageUrl}`);
      resolve(null);
    });
  });
}

async function main() {
  console.log('🚀 Starting WordPress to Astro migration...\n');

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Fetch categories and tags first to build lookup maps
  console.log('📂 Fetching categories...');
  const categories = await fetchJson<WPCategory[]>('/wp-json/wp/v2/categories?per_page=100');
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  console.log(`  Found ${categories.length} categories\n`);

  console.log('🏷️  Fetching tags...');
  const tags = await fetchJson<WPTag[]>('/wp-json/wp/v2/tags?per_page=100');
  const tagMap = new Map(tags.map(t => [t.id, t.name]));
  console.log(`  Found ${tags.length} tags\n`);

  // Fetch all posts
  console.log('📝 Fetching posts...');
  const posts = await fetchJson<WPPost[]>('/wp-json/wp/v2/posts?per_page=100');
  console.log(`  Found ${posts.length} posts\n`);

  // Fetch media to get featured images
  console.log('🖼️  Fetching media...');
  const media = await fetchJson<WPMedia[]>('/wp-json/wp/v2/media?per_page=100');
  const mediaMap = new Map(media.map(m => [m.id, m]));
  console.log(`  Found ${media.length} media items\n`);

  // Process each post
  console.log('✍️  Converting posts to Markdown...\n');

  for (const post of posts) {
    console.log(`Processing: ${post.title.rendered}`);

    // Get category names
    const postCategories = post.categories
      .map(id => categoryMap.get(id))
      .filter(Boolean) as string[];

    // Get tag names
    const postTags = post.tags
      .map(id => tagMap.get(id))
      .filter(Boolean) as string[];

    // Handle featured image
    let featuredImage: string | undefined;
    if (post.featured_media && mediaMap.has(post.featured_media)) {
      const mediaItem = mediaMap.get(post.featured_media)!;
      const imageUrl = mediaItem.source_url;
      const ext = path.extname(imageUrl.split('?')[0]) || '.jpg';
      const filename = `${post.slug}${ext}`;
      featuredImage = await downloadImage(imageUrl, filename) || undefined;
    }

    // Convert content
    const content = htmlToMarkdown(post.content.rendered);

    // Clean up title and excerpt
    const title = post.title.rendered
      .replace(/&amp;/g, '&')
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"');

    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 200) + '...';

    // Build frontmatter
    const frontmatter = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: ${post.date.split('T')[0]}`,
      `excerpt: "${excerpt.replace(/"/g, '\\"')}"`,
      `categories: [${postCategories.map(c => `"${c}"`).join(', ')}]`,
    ];

    if (postTags.length > 0) {
      frontmatter.push(`tags: [${postTags.map(t => `"${t}"`).join(', ')}]`);
    }

    if (featuredImage) {
      frontmatter.push(`featuredImage: "${featuredImage}"`);
    }

    frontmatter.push('---');

    // Write markdown file
    const markdown = `${frontmatter.join('\n')}\n\n${content}`;
    const outputFile = path.join(OUTPUT_DIR, `${post.slug}.md`);
    fs.writeFileSync(outputFile, markdown, 'utf-8');
    console.log(`  ✓ Created: ${post.slug}.md\n`);
  }

  console.log('\n✅ Migration complete!');
  console.log(`   - ${posts.length} posts converted`);
  console.log(`   - Output: ${OUTPUT_DIR}`);
  console.log(`   - Images: ${IMAGES_DIR}`);
}

main().catch(console.error);
