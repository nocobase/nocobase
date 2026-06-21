/**
 * Rspress plugin: remove <meta name="generator" content="Rspress ..."> from HTML output.
 *
 * Rspress injects this tag by default; this plugin strips it in afterBuild.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';

const GENERATOR_REGEX = /<meta\s+name="generator"\s+content="[^"]*">\s*/gi;

function removeGeneratorFromHtml(html: string): string {
  return html.replace(GENERATOR_REGEX, '');
}

function processDir(dir: string): number {
  let count = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += processDir(fullPath);
    } else if (entry.name.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const newContent = removeGeneratorFromHtml(content);
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        count++;
      }
    }
  }
  return count;
}

export function pluginRemoveGenerator(): RspressPlugin {
  return {
    name: 'plugin-remove-generator',
    async afterBuild(config: { outDir?: string }, isProd: boolean) {
      if (!isProd) return;
      const outDir = config?.outDir;
      if (!outDir) return;
      const absOutDir = path.isAbsolute(outDir) ? outDir : path.join(process.cwd(), outDir);
      const n = processDir(absOutDir);
      if (n > 0) {
        console.log(`[plugin-remove-generator] Removed generator meta from ${n} HTML file(s)`);
      }
    },
  };
}
