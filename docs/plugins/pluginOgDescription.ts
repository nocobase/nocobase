/**
 * Rspress plugin: auto-inject meta tags from page frontmatter.
 *
 * - og:description: from frontmatter `description` (Rspress does not add it by default)
 * - keywords: from frontmatter `keywords` (Rspress does not support it natively)
 *
 * Usage: just add `description` and/or `keywords` in frontmatter, no need for head config.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';

interface FrontmatterMeta {
  description?: string | null;
  keywords?: string | null;
}

function parseFrontmatter(content: string): FrontmatterMeta {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const getValue = (key: string): string | null => {
    const keyRe = new RegExp(`^${key}:\\s*(.*)$`, 'm');
    const keyMatch = yaml.match(keyRe);
    if (!keyMatch) return null;
    const rest = keyMatch[1].trim();
    // Block scalar: | or |- or |+ or > or >- or >+
    if (/^[|>][-+]?\s*$/.test(rest) || rest === '|' || rest === '>') {
      const keyLineEnd = yaml.indexOf(keyMatch[0]) + keyMatch[0].length;
      const afterKey = yaml.slice(keyLineEnd);
      const lines = afterKey.split('\n');
      const contentLines: string[] = [];
      let minIndent = Infinity;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '' && contentLines.length === 0) continue;
        const indentMatch = /^(\s*)/.exec(line);
        const indent = indentMatch ? indentMatch[1].length : 0;
        if (line.trim() === '') {
          if (contentLines.length > 0) contentLines.push('');
        } else if (indent > 0 && (contentLines.length > 0 || indent < minIndent)) {
          minIndent = Math.min(minIndent, indent);
          contentLines.push(line);
        } else if (indent === 0 && line.match(/^\w+:/)) {
          break; // next key
        } else if (contentLines.length > 0) {
          break;
        }
      }
      const text = contentLines
        .map((l) => l.replace(/^\s+/, '').trimEnd())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      return text || null;
    }
    // Inline: quoted or plain
    const val = rest.replace(/^['"]|['"]$/g, '').trim();
    return val || null;
  };
  return {
    description: getValue('description'),
    keywords: getValue('keywords'),
  };
}

function buildMetaMaps(docsRoot: string): {
  descriptionMap: Map<string, string>;
  keywordsMap: Map<string, string>;
} {
  const descriptionMap = new Map<string, string>();
  const keywordsMap = new Map<string, string>();

  function scan(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) scan(fullPath);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const meta = parseFrontmatter(content);
        const relative = path.relative(docsRoot, fullPath).replace(/\\/g, '/');
        const routePath = '/' + relative.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '') || '/';
        const normalized = routePath === '/' ? '/' : routePath.replace(/\/$/, '');

        if (meta.description) {
          descriptionMap.set(normalized, meta.description);
          if (normalized !== '/') descriptionMap.set(normalized + '/', meta.description);
        }
        if (meta.keywords) {
          keywordsMap.set(normalized, meta.keywords);
          if (normalized !== '/') keywordsMap.set(normalized + '/', meta.keywords);
        }
      }
    }
  }

  scan(docsRoot);
  return { descriptionMap, keywordsMap };
}

function lookup<T>(map: Map<string, T>, routePath: string): T | undefined {
  const r = routePath || '/';
  return map.get(r) ?? map.get(r.replace(/\/$/, '') || '/') ?? map.get(r.endsWith('/') ? r : r + '/');
}

export function pluginOgDescription(): RspressPlugin {
  return {
    name: 'plugin-og-description',
    config(config) {
      const lang = process.env.DOCS_LANG || 'en';
      const docsRoot = path.join(process.cwd(), `docs/${lang}`);
      const { descriptionMap, keywordsMap } = buildMetaMaps(docsRoot);
      if (descriptionMap.size === 0 && keywordsMap.size === 0) return config;

      const head = Array.isArray(config.head) ? config.head : [];

      if (descriptionMap.size > 0) {
        head.push((route: { routePath: string }) => {
          const description = lookup(descriptionMap, route.routePath);
          return description ? ['meta', { property: 'og:description', content: description }] : undefined;
        });
      }
      if (keywordsMap.size > 0) {
        head.push((route: { routePath: string }) => {
          const keywords = lookup(keywordsMap, route.routePath);
          return keywords ? ['meta', { name: 'keywords', content: keywords }] : undefined;
        });
      }

      return { ...config, head };
    },
  };
}
