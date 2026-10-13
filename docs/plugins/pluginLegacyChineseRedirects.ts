import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';

/** Keep existing /cn/ page links working on static hosting after the URL migration. */
export async function writeLegacyChineseRedirects(outDir: string) {
  const legacyDir = path.join(outDir, '..', 'cn');
  const files = await fs.readdir(outDir, { recursive: true });
  for (const file of files) {
    if (!file.endsWith('.html') || file === '404.html') continue;
    const route = file
      .split(path.sep)
      .join('/')
      .replace(/(?:^|\/)index\.html$/, '/')
      .replace(/\.html$/, '');
    const target = `/zh-CN/${route.replace(/^\//, '')}`;
    const url = JSON.stringify(target).replace(/</g, '\\u003c');
    const escaped = target
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    const destination = path.join(legacyDir, file);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(
      destination,
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Redirecting</title><script>location.replace(${url} + location.search + location.hash)</script><meta http-equiv="refresh" content="0;url=${escaped}"></head><body><a href="${escaped}">Continue to the documentation</a></body></html>`,
    );
  }
}

export function pluginLegacyChineseRedirects(): RspressPlugin {
  return {
    name: 'plugin-legacy-chinese-redirects',
    async afterBuild(config, isProd) {
      if (isProd && config.lang === 'cn' && config.outDir) {
        await writeLegacyChineseRedirects(config.outDir);
      }
    },
  };
}
