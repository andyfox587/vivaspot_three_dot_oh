// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://vivaspot.com',
  output: 'static',
  trailingSlash: 'ignore',
  image: {
    domains: ['vivaspot.com'],
    remotePatterns: [{ protocol: 'https' }],
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap(),
    react(),
    markdoc(),
    mdx(),
  ],
});
