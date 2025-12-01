// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import node from '@astrojs/node';
import markdoc from '@astrojs/markdoc';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://vivaspot.com',
  output: 'server',
  trailingSlash: 'ignore',
  adapter: node({ mode: 'standalone' }),
  image: {
    // Enable image optimization for local images
    // Images in /public can be referenced with leading slash
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
    keystatic(),
  ],
});
