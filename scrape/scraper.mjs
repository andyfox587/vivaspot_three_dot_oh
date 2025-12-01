#!/usr/bin/env node
/**
 * VivaSpot Website Scraper
 * Comprehensively scrapes the original vivaspot site for content migration
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://3.93.147.195';
const OUTPUT_DIR = path.dirname(new URL(import.meta.url).pathname);

// Pages to scrape
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'features', path: '/features/' },
  { name: 'pricing', path: '/pricing/' },
  { name: 'contact', path: '/contact/' },
  { name: 'about', path: '/about/' },
  { name: 'blog', path: '/blog/' },
  { name: 'resources', path: '/resources/' },
  { name: 'wifi-marketing', path: '/wifi-marketing/' },
  { name: 'guest-wifi', path: '/guest-wifi/' },
  { name: 'splash-page', path: '/splash-page/' },
  { name: 'email-marketing', path: '/email-marketing/' },
  { name: 'sms-marketing', path: '/sms-marketing/' },
  { name: 'integrations', path: '/integrations/' },
];

// Create HTTPS agent that ignores self-signed certs
const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractText(html) {
  // Remove scripts and styles
  let clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Extract title
  const titleMatch = clean.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaMatch = clean.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : '';

  // Extract all headings
  const headings = [];
  const h1Matches = clean.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  for (const m of h1Matches) headings.push({ level: 1, text: stripTags(m[1]).trim() });
  const h2Matches = clean.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  for (const m of h2Matches) headings.push({ level: 2, text: stripTags(m[1]).trim() });
  const h3Matches = clean.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);
  for (const m of h3Matches) headings.push({ level: 3, text: stripTags(m[1]).trim() });
  const h4Matches = clean.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi);
  for (const m of h4Matches) headings.push({ level: 4, text: stripTags(m[1]).trim() });

  // Extract paragraphs
  const paragraphs = [];
  const pMatches = clean.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
  for (const m of pMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 20) paragraphs.push(text);
  }

  // Extract list items
  const listItems = [];
  const liMatches = clean.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const m of liMatches) {
    const text = stripTags(m[1]).trim();
    if (text.length > 5) listItems.push(text);
  }

  // Extract images with alt text
  const images = [];
  const imgMatches = clean.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*?)["'])?[^>]*>/gi);
  for (const m of imgMatches) {
    images.push({ src: m[1], alt: m[2] || '' });
  }
  // Also try alt before src
  const imgMatches2 = clean.matchAll(/<img[^>]*alt=["']([^"']*?)["'][^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const m of imgMatches2) {
    images.push({ src: m[2], alt: m[1] || '' });
  }

  // Extract links
  const links = [];
  const linkMatches = clean.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const m of linkMatches) {
    const text = stripTags(m[2]).trim();
    if (text && !m[1].startsWith('#') && !m[1].startsWith('javascript')) {
      links.push({ href: m[1], text });
    }
  }

  // Extract sections/divs with specific classes that might indicate features
  const sections = [];
  const sectionMatches = clean.matchAll(/<(?:section|div)[^>]*class=["'][^"']*(?:feature|benefit|service|product|pricing|testimonial)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div)>/gi);
  for (const m of sectionMatches) {
    sections.push(stripTags(m[1]).trim().substring(0, 500));
  }

  return {
    title,
    metaDescription: metaDesc,
    headings: headings.filter(h => h.text),
    paragraphs: paragraphs.filter(p => p),
    listItems: listItems.filter(li => li),
    images: images.filter(img => img.src && !img.src.includes('data:')),
    links: links.slice(0, 50),
    sections
  };
}

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapePage(page) {
  const url = BASE_URL + page.path;
  console.log(`Scraping: ${page.name} (${url})`);

  try {
    const { status, html } = await fetchPage(url);

    if (status !== 200) {
      console.log(`  - Status ${status}, skipping`);
      return null;
    }

    const content = extractText(html);

    // Save raw HTML
    const htmlPath = path.join(OUTPUT_DIR, 'html', `${page.name}.html`);
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, html);

    // Save extracted content
    const jsonPath = path.join(OUTPUT_DIR, 'content', `${page.name}.json`);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));

    console.log(`  - ${content.headings.length} headings, ${content.paragraphs.length} paragraphs, ${content.images.length} images`);

    return { page: page.name, ...content };
  } catch (err) {
    console.error(`  - Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('Starting VivaSpot scrape...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const results = [];

  for (const page of PAGES) {
    const result = await scrapePage(page);
    if (result) results.push(result);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Save combined summary
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

  // Create a readable text summary
  let textSummary = '# VivaSpot Website Scrape Summary\n\n';
  for (const result of results) {
    textSummary += `## ${result.page.toUpperCase()}\n\n`;
    textSummary += `**Title:** ${result.title}\n\n`;
    if (result.metaDescription) {
      textSummary += `**Description:** ${result.metaDescription}\n\n`;
    }
    textSummary += '### Headings\n';
    for (const h of result.headings) {
      textSummary += `${'#'.repeat(h.level)} ${h.text}\n`;
    }
    textSummary += '\n### Key Content\n';
    for (const p of result.paragraphs.slice(0, 10)) {
      textSummary += `- ${p.substring(0, 200)}${p.length > 200 ? '...' : ''}\n`;
    }
    textSummary += '\n### Features/List Items\n';
    for (const li of result.listItems.slice(0, 20)) {
      textSummary += `- ${li}\n`;
    }
    textSummary += '\n---\n\n';
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.md'), textSummary);

  console.log(`\nScrape complete! Results saved to ${OUTPUT_DIR}`);
  console.log(`- HTML files: ${OUTPUT_DIR}/html/`);
  console.log(`- Content JSON: ${OUTPUT_DIR}/content/`);
  console.log(`- Summary: ${OUTPUT_DIR}/summary.json`);
  console.log(`- Readable: ${OUTPUT_DIR}/summary.md`);
}

main().catch(console.error);
