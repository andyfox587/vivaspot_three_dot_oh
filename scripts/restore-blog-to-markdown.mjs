#!/usr/bin/env node

/**
 * Reverse migration script to convert Keystatic document JSON back to Markdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// Convert document JSON to markdown
function documentToMarkdown(document) {
  let markdown = '';

  for (const node of document) {
    markdown += nodeToMarkdown(node) + '\n\n';
  }

  return markdown.trim();
}

function nodeToMarkdown(node) {
  switch (node.type) {
    case 'paragraph':
      return childrenToMarkdown(node.children);

    case 'heading':
      const hashes = '#'.repeat(node.level || 2);
      return `${hashes} ${childrenToMarkdown(node.children)}`;

    case 'unordered-list':
      return node.children.map(item => {
        const content = item.children
          .filter(c => c.type === 'list-item-content')
          .map(c => childrenToMarkdown(c.children))
          .join('');
        return `- ${content}`;
      }).join('\n');

    case 'ordered-list':
      return node.children.map((item, i) => {
        const content = item.children
          .filter(c => c.type === 'list-item-content')
          .map(c => childrenToMarkdown(c.children))
          .join('');
        return `${i + 1}. ${content}`;
      }).join('\n');

    case 'blockquote':
      const quoteContent = node.children
        .map(c => nodeToMarkdown(c))
        .join('\n');
      return quoteContent.split('\n').map(line => `> ${line}`).join('\n');

    case 'code':
      const lang = node.language || '';
      const code = node.children.map(c => c.text || '').join('');
      return `\`\`\`${lang}\n${code}\n\`\`\``;

    case 'divider':
      return '---';

    default:
      // Unknown node type, try to extract text
      if (node.children) {
        return childrenToMarkdown(node.children);
      }
      return '';
  }
}

function childrenToMarkdown(children) {
  if (!children) return '';

  return children.map(child => {
    // Text node
    if (child.text !== undefined) {
      let text = child.text;
      if (child.bold && child.italic) {
        text = `***${text}***`;
      } else if (child.bold) {
        text = `**${text}**`;
      } else if (child.italic) {
        text = `*${text}*`;
      }
      if (child.code) {
        text = `\`${text}\``;
      }
      return text;
    }

    // Link node
    if (child.type === 'link') {
      const linkText = childrenToMarkdown(child.children);
      return `[${linkText}](${child.href})`;
    }

    // Image node
    if (child.type === 'image') {
      return `![${child.alt || ''}](${child.src})`;
    }

    return '';
  }).join('');
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
  const jsonContent = frontmatterMatch[2].trim();

  // Check if it's JSON (our migrated format)
  if (!jsonContent.startsWith('[')) {
    console.log(`  Skipping ${path.basename(postDir)} - already markdown`);
    return false;
  }

  try {
    const document = JSON.parse(jsonContent);
    const markdownContent = documentToMarkdown(document);

    // Write back with frontmatter + markdown
    const finalContent = `---\n${frontmatter}\n---\n\n${markdownContent}\n`;
    fs.writeFileSync(indexPath, finalContent);
    console.log(`  Restored ${path.basename(postDir)}`);
    return true;
  } catch (e) {
    console.log(`  Error restoring ${path.basename(postDir)}: ${e.message}`);
    return false;
  }
}

// Main
console.log('Restoring blog posts to Markdown format...\n');

const postDirs = fs.readdirSync(BLOG_DIR)
  .map(name => path.join(BLOG_DIR, name))
  .filter(p => fs.statSync(p).isDirectory());

let restored = 0;
let skipped = 0;

for (const postDir of postDirs) {
  if (processBlogPost(postDir)) {
    restored++;
  } else {
    skipped++;
  }
}

console.log(`\nRestore complete!`);
console.log(`  Restored: ${restored}`);
console.log(`  Skipped: ${skipped}`);
