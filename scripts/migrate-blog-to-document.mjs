#!/usr/bin/env node

/**
 * Migration script to convert Markdown blog posts to Keystatic document format
 *
 * Keystatic's fields.document() expects a JSON structure like:
 * [
 *   { "type": "paragraph", "children": [{ "text": "Hello" }] },
 *   { "type": "heading", "level": 2, "children": [{ "text": "Title" }] },
 *   ...
 * ]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// Parse markdown content into Keystatic document format
function markdownToDocument(markdown) {
  const lines = markdown.split('\n');
  const document = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      document.push({
        type: 'heading',
        level,
        children: parseInlineContent(text)
      });
      i++;
      continue;
    }

    // Images (standalone)
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const alt = imageMatch[1];
      const src = imageMatch[2];
      document.push({
        type: 'paragraph',
        children: [{
          type: 'image',
          src: src,
          alt: alt || '',
          title: '',
          children: [{ text: '' }]
        }]
      });
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        const itemText = lines[i].replace(/^[-*]\s+/, '');
        listItems.push({
          type: 'list-item',
          children: [{
            type: 'list-item-content',
            children: parseInlineContent(itemText)
          }]
        });
        i++;
      }
      document.push({
        type: 'unordered-list',
        children: listItems
      });
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        listItems.push({
          type: 'list-item',
          children: [{
            type: 'list-item-content',
            children: parseInlineContent(itemText)
          }]
        });
        i++;
      }
      document.push({
        type: 'ordered-list',
        children: listItems
      });
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      let quoteText = '';
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteText += lines[i].replace(/^>\s*/, '') + '\n';
        i++;
      }
      document.push({
        type: 'blockquote',
        children: [{
          type: 'paragraph',
          children: parseInlineContent(quoteText.trim())
        }]
      });
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plain';
      i++;
      let code = '';
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      i++; // skip closing ```
      document.push({
        type: 'code',
        language,
        children: [{ text: code.trimEnd() }]
      });
      continue;
    }

    // Horizontal rule / divider
    if (line.match(/^[-*_]{3,}$/)) {
      document.push({ type: 'divider', children: [{ text: '' }] });
      i++;
      continue;
    }

    // Regular paragraph - collect consecutive non-empty lines
    let paragraphText = line;
    i++;
    while (i < lines.length && lines[i].trim() !== '' &&
           !lines[i].match(/^#{1,6}\s/) &&
           !lines[i].match(/^[-*]\s+/) &&
           !lines[i].match(/^\d+\.\s+/) &&
           !lines[i].startsWith('>') &&
           !lines[i].startsWith('```') &&
           !lines[i].match(/^[-*_]{3,}$/) &&
           !lines[i].match(/^!\[/)) {
      paragraphText += ' ' + lines[i];
      i++;
    }

    document.push({
      type: 'paragraph',
      children: parseInlineContent(paragraphText)
    });
  }

  return document;
}

// Parse inline content (bold, italic, links, inline code, images)
function parseInlineContent(text) {
  const children = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for inline image
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      children.push({
        type: 'image',
        src: imageMatch[2],
        alt: imageMatch[1] || '',
        title: '',
        children: [{ text: '' }]
      });
      remaining = remaining.slice(imageMatch[0].length);
      continue;
    }

    // Check for link
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      children.push({
        type: 'link',
        href: linkMatch[2],
        children: [{ text: linkMatch[1] }]
      });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Check for bold+italic (***text***)
    const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/);
    if (boldItalicMatch) {
      children.push({ text: boldItalicMatch[1], bold: true, italic: true });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // Check for bold (**text**)
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      children.push({ text: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Check for italic (*text* or _text_)
    const italicMatch = remaining.match(/^[*_]([^*_]+)[*_]/);
    if (italicMatch) {
      children.push({ text: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Check for inline code (`code`)
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      children.push({ text: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Find next special character or end of string
    const nextSpecial = remaining.search(/[*_`\[!]/);
    if (nextSpecial === -1) {
      // No more special characters
      if (remaining.length > 0) {
        children.push({ text: remaining });
      }
      break;
    } else if (nextSpecial === 0) {
      // Special character at start but didn't match any pattern - treat as literal
      children.push({ text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      // Add text up to special character
      children.push({ text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    }
  }

  // If no children were added, add empty text node
  if (children.length === 0) {
    children.push({ text: '' });
  }

  return children;
}

// Process a single blog post
function processBlogPost(postDir) {
  const indexPath = path.join(postDir, 'index.mdoc');

  if (!fs.existsSync(indexPath)) {
    console.log(`  Skipping ${path.basename(postDir)} - no index.mdoc found`);
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf-8');

  // Split frontmatter and content
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    console.log(`  Skipping ${path.basename(postDir)} - no frontmatter found`);
    return false;
  }

  const frontmatter = frontmatterMatch[1];
  const markdownContent = frontmatterMatch[2].trim();

  // Convert markdown to document format
  const documentContent = markdownToDocument(markdownContent);

  // Write YAML file with frontmatter (without content field, as content goes in separate file)
  // Parse existing frontmatter
  const frontmatterLines = frontmatter.split('\n');
  const yamlData = {};
  let currentKey = null;
  let inArray = false;
  let arrayItems = [];

  for (const line of frontmatterLines) {
    if (line.match(/^(\w+):\s*\[/)) {
      // Inline array like: categories: ["Marketing", "Technology"]
      const match = line.match(/^(\w+):\s*\[(.*)\]$/);
      if (match) {
        const key = match[1];
        const values = match[2].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        yamlData[key] = values;
      }
    } else if (line.match(/^(\w+):\s*$/)) {
      // Start of multi-line array
      currentKey = line.match(/^(\w+):/)[1];
      inArray = true;
      arrayItems = [];
    } else if (inArray && line.match(/^\s*-\s*/)) {
      arrayItems.push(line.replace(/^\s*-\s*["']?|["']?$/g, ''));
    } else if (inArray && !line.match(/^\s*-/)) {
      yamlData[currentKey] = arrayItems;
      inArray = false;
      currentKey = null;
      // Process this line as normal
      const kvMatch = line.match(/^(\w+):\s*(.+)$/);
      if (kvMatch) {
        let value = kvMatch[2].trim().replace(/^["']|["']$/g, '');
        yamlData[kvMatch[1]] = value;
      }
    } else {
      const kvMatch = line.match(/^(\w+):\s*(.+)$/);
      if (kvMatch) {
        let value = kvMatch[2].trim().replace(/^["']|["']$/g, '');
        yamlData[kvMatch[1]] = value;
      }
    }
  }
  if (inArray) {
    yamlData[currentKey] = arrayItems;
  }

  // Build new YAML frontmatter
  let newYaml = '---\n';
  if (yamlData.title) newYaml += `title: ${JSON.stringify(yamlData.title)}\n`;
  if (yamlData.date) newYaml += `date: ${yamlData.date}\n`;
  if (yamlData.excerpt) newYaml += `excerpt: ${JSON.stringify(yamlData.excerpt)}\n`;
  if (yamlData.featuredImage) newYaml += `featuredImage: ${yamlData.featuredImage}\n`;
  if (yamlData.categories && yamlData.categories.length > 0) {
    newYaml += `categories:\n`;
    for (const cat of yamlData.categories) {
      newYaml += `  - ${cat}\n`;
    }
  }
  if (yamlData.tags && yamlData.tags.length > 0) {
    newYaml += `tags:\n`;
    for (const tag of yamlData.tags) {
      newYaml += `  - ${tag}\n`;
    }
  }
  newYaml += '---\n';

  // Write the document content as JSON after the frontmatter
  const jsonContent = JSON.stringify(documentContent, null, 2);
  const finalContent = newYaml + jsonContent;

  fs.writeFileSync(indexPath, finalContent);
  console.log(`  Migrated ${path.basename(postDir)}`);
  return true;
}

// Main
console.log('Migrating blog posts to Keystatic document format...\n');

const postDirs = fs.readdirSync(BLOG_DIR)
  .map(name => path.join(BLOG_DIR, name))
  .filter(p => fs.statSync(p).isDirectory());

let migrated = 0;
let skipped = 0;

for (const postDir of postDirs) {
  if (processBlogPost(postDir)) {
    migrated++;
  } else {
    skipped++;
  }
}

console.log(`\nMigration complete!`);
console.log(`  Migrated: ${migrated}`);
console.log(`  Skipped: ${skipped}`);
