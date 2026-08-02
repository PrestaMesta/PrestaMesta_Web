#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from the configured `siteUrl`. The sitemap protocol requires
 * absolute URLs, and this repo intentionally ships no real production domain (see
 * public/config/app-config.json) — so rather than hardcode a placeholder domain, this script
 * simply does nothing until `siteUrl` is actually configured. Run manually (`npm run
 * generate:sitemap`) after setting `siteUrl`, before deploying.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const configPath = path.join(rootDir, 'public', 'config', 'app-config.json');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
const robotsPath = path.join(rootDir, 'public', 'robots.txt');

const ROUTES = ['/', '/aviso-de-privacidad', '/terminos-de-uso', '/seguridad'];

async function main() {
  const raw = await readFile(configPath, 'utf-8');
  const config = JSON.parse(raw);
  const siteUrl = typeof config.siteUrl === 'string' ? config.siteUrl.trim() : '';

  if (!siteUrl) {
    console.log('siteUrl is not configured; skipping sitemap generation.');
    return;
  }

  const baseUrl = siteUrl.replace(/\/$/, '');
  const urlEntries = ROUTES.map((route) => `  <url><loc>${baseUrl}${route}</loc></url>`).join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>\n`;

  await writeFile(sitemapPath, sitemap, 'utf-8');
  console.log(`Wrote ${sitemapPath}`);

  const robots = await readFile(robotsPath, 'utf-8');
  if (!robots.includes('Sitemap:')) {
    await writeFile(robotsPath, `${robots.trimEnd()}\nSitemap: ${baseUrl}/sitemap.xml\n`, 'utf-8');
    console.log(`Updated ${robotsPath} with the sitemap location.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
