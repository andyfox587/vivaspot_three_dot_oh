import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const categories = new Set();

for (const slug of fs.readdirSync(blogDir)) {
  const mdoc = path.join(blogDir, slug, 'index.mdoc');
  if (!fs.existsSync(mdoc)) continue;
  const content = fs.readFileSync(mdoc, 'utf-8');
  const match = content.match(/categories:\n([\s\S]*?)(?=tags:|---)/);
  if (match) {
    const cats = match[1].match(/  - (.+)/g);
    if (cats) cats.forEach(c => categories.add(c.replace('  - ', '').trim()));
  }
}
console.log([...categories].sort().join('\n'));
