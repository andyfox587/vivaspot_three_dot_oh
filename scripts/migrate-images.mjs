import fs from 'fs';
import path from 'path';

const blogDir = 'src/content/blog';
const imagesDir = 'public/images/blog';
const wpUploadsDir = 'public/images/wp-content/uploads';

// Get all blog post directories
const posts = fs.readdirSync(blogDir).filter(f => {
  return fs.statSync(path.join(blogDir, f)).isDirectory();
});

console.log(`Found ${posts.length} blog posts to migrate`);

for (const slug of posts) {
  if (slug === 'test-blog-post') {
    console.log(`Skipping ${slug} (already migrated)`);
    continue;
  }

  const mdocPath = path.join(blogDir, slug, 'index.mdoc');
  if (!fs.existsSync(mdocPath)) {
    console.log(`Skipping ${slug} (no index.mdoc)`);
    continue;
  }

  // Create post-specific image folder
  const postImagesDir = path.join(imagesDir, slug);
  if (!fs.existsSync(postImagesDir)) {
    fs.mkdirSync(postImagesDir, { recursive: true });
  }

  let content = fs.readFileSync(mdocPath, 'utf-8');
  let modified = false;

  // Handle featuredImage - move to subfolder
  const featuredMatch = content.match(/featuredImage:\s*([^\n]+)/);
  if (featuredMatch) {
    const currentPath = featuredMatch[1].trim();

    // Check if it's already in the right format
    if (currentPath.startsWith(`/images/blog/${slug}/`)) {
      console.log(`  ${slug}: featuredImage already migrated`);
    } else if (currentPath.startsWith('/images/blog/')) {
      // It's in /images/blog/ directly, need to move it
      const filename = path.basename(currentPath);
      const srcFile = path.join('public', currentPath);
      const destFile = path.join(postImagesDir, 'featuredImage' + path.extname(filename));

      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        const newPath = `/images/blog/${slug}/featuredImage${path.extname(filename)}`;
        content = content.replace(featuredMatch[0], `featuredImage: ${newPath}`);
        modified = true;
        console.log(`  ${slug}: Moved featuredImage to ${newPath}`);
      } else {
        console.log(`  ${slug}: WARNING - featuredImage not found: ${srcFile}`);
      }
    }
  }

  // Handle inline images - ![](path) or ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let imageIndex = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1];
    const imgPath = match[2];

    // Check if already migrated
    if (imgPath.startsWith(`/images/blog/${slug}/`)) {
      continue;
    }

    // Determine source file
    let srcFile;
    if (imgPath.startsWith('/images/wp-content/uploads/')) {
      srcFile = path.join('public', imgPath);
    } else if (imgPath.startsWith('/images/blog/')) {
      srcFile = path.join('public', imgPath);
    } else {
      console.log(`  ${slug}: Skipping unknown image path: ${imgPath}`);
      continue;
    }

    if (fs.existsSync(srcFile)) {
      const filename = path.basename(imgPath);
      const destFile = path.join(postImagesDir, filename);
      fs.copyFileSync(srcFile, destFile);

      const newPath = `/images/blog/${slug}/${filename}`;
      content = content.replace(match[0], `![${alt}](${newPath})`);
      modified = true;
      console.log(`  ${slug}: Moved inline image to ${newPath}`);
      imageIndex++;
    } else {
      console.log(`  ${slug}: WARNING - inline image not found: ${srcFile}`);
    }
  }

  if (modified) {
    fs.writeFileSync(mdocPath, content);
    console.log(`  ${slug}: Updated mdoc file`);
  }
}

console.log('\nMigration complete!');
