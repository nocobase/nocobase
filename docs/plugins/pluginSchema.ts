/**
 * Rspress plugin: inject Schema.org JSON-LD into pages that have _schema.json.
 *
 * Data sources:
 *   _schema.json  — headline, description, keywords, FAQ (Schema-specific)
 *   _meta.json    — chapter list (reused from rspress sidebar config)
 *
 * Usage in rspress.config.ts:
 *   import { pluginSchema } from './plugins/pluginSchema';
 *   plugins: [pluginSchema()]
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';

interface SchemaConfig {
  headline: string;
  description: string;
  keywords: string;
  datePublished: string;
  dateModified: string;
  faq?: { q: string; a: string }[];
}

interface MetaItem {
  type: string;
  name: string;
  label: string;
}

interface SchemaEntry {
  routePrefix: string;
  config: SchemaConfig;
  chapters: { slug: string; title: string }[];
  lang: string;
}

function loadEntries(docsRoot: string, lang: string): SchemaEntry[] {
  const entries: SchemaEntry[] = [];

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    const schemaPath = path.join(dir, '_schema.json');
    const metaPath = path.join(dir, '_meta.json');
    if (!fs.existsSync(schemaPath)) return;

    const config: SchemaConfig = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const routePrefix = '/' + path.relative(docsRoot, dir).replace(/\\/g, '/') + '/';

    // Read chapters from _meta.json (skip index entries)
    let chapters: { slug: string; title: string }[] = [];
    if (fs.existsSync(metaPath)) {
      const meta: MetaItem[] = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      chapters = meta
        .filter(m => m.type === 'file' && m.name !== 'index')
        .map(m => ({ slug: m.name, title: m.label }));
    }

    entries.push({ routePrefix, config, chapters, lang });

    // Recurse into subdirs
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        scan(path.join(dir, entry.name));
      }
    }
  }

  scan(docsRoot);
  return entries;
}

function buildScripts(route: string, entry: SchemaEntry): string {
  const { config, chapters, lang, routePrefix } = entry;
  const langMap: Record<string, string> = { cn: 'zh-CN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR' };
  const inLanguage = langMap[lang] || 'en-US';
  const baseUrl = lang === 'en'
    ? 'https://v2.docs.nocobase.com'
    : `https://v2.docs.nocobase.com/${lang}`;

  const tag = (obj: object) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;

  const isIndex = route === routePrefix || route === routePrefix.slice(0, -1);

  if (isIndex) {
    const scripts: string[] = [];
    scripts.push(tag({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: config.headline,
      description: config.description,
      author: { '@type': 'Organization', name: 'NocoBase', url: 'https://www.nocobase.com' },
      publisher: { '@type': 'Organization', name: 'NocoBase', url: 'https://www.nocobase.com' },
      datePublished: config.datePublished,
      dateModified: config.dateModified,
      proficiencyLevel: 'Beginner',
      inLanguage,
      keywords: config.keywords,
      ...(chapters.length > 0 && {
        hasPart: chapters.map((ch, i) => ({
          '@type': 'TechArticle',
          headline: ch.title,
          url: `${baseUrl}${routePrefix}${ch.slug}`,
          position: i + 1,
        })),
      }),
    }));

    if (config.faq?.length) {
      scripts.push(tag({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: config.faq.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }));
    }
    return scripts.join('\n');
  }

  // Chapter pages
  const chapter = chapters.find(ch => route.includes(ch.slug));
  if (chapter) {
    return tag({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: chapter.title,
      author: { '@type': 'Organization', name: 'NocoBase', url: 'https://www.nocobase.com' },
      publisher: { '@type': 'Organization', name: 'NocoBase', url: 'https://www.nocobase.com' },
      datePublished: config.datePublished,
      dateModified: config.dateModified,
      proficiencyLevel: 'Beginner',
      inLanguage,
      isPartOf: {
        '@type': 'TechArticle',
        headline: config.headline,
        url: `${baseUrl}${routePrefix}`,
      },
      position: chapters.indexOf(chapter) + 1,
    });
  }

  return '';
}

export function pluginSchema(): RspressPlugin {
  return {
    name: 'plugin-schema',
    config(config) {
      const lang = process.env.DOCS_LANG || 'en';
      const docsRoot = path.join(process.cwd(), `docs/${lang}`);
      const entries = loadEntries(docsRoot, lang);
      if (entries.length === 0) return config;

      const head = Array.isArray(config.head) ? config.head : [];
      head.push((route: { routePath: string }) => {
        for (const entry of entries) {
          if (route.routePath.includes(entry.routePrefix.replace(/\/$/, ''))) {
            return buildScripts(route.routePath, entry);
          }
        }
        return '';
      });

      return { ...config, head };
    },
  };
}
