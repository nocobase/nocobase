import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { languageBase } from '../shared/languages.ts';
import { writeLegacyChineseRedirects } from '../plugins/pluginLegacyChineseRedirects.ts';

test('source language keys map to public URL bases', () => {
  assert.equal(languageBase('cn'), '/zh-CN/');
  assert.equal(languageBase('en'), '/');
  assert.equal(languageBase('ja'), '/ja/');
});

test('legacy pages redirect after deployment normalization and preserve URL state', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-language-'));
  try {
    const output = path.join(root, 'zh-CN');
    await mkdir(path.join(output, 'guide'), { recursive: true });
    const pages = ['index.html', 'guide/index.html', 'guide/start.html'];
    for (const file of [...pages, '404.html']) {
      await writeFile(path.join(output, file), '<html>Documentation</html>');
    }
    await writeLegacyChineseRedirects(output);
    execFileSync(process.execPath, [
      new URL('../scripts/normalize-html-output.mjs', import.meta.url).pathname,
      '--out-dir',
      root,
    ]);
    for (const [file, target] of [
      ['index.html', '/zh-CN/'],
      ['guide/index.html', '/zh-CN/guide/'],
      ['guide/start/index.html', '/zh-CN/guide/start'],
    ]) {
      const html = await readFile(path.join(root, 'cn', file), 'utf8');
      let redirected = '';
      runInNewContext(html.match(/<script>(.*?)<\/script>/)![1], {
        location: {
          search: '?from=old&mode=read',
          hash: '#details',
          replace: (value: string) => {
            redirected = value;
          },
        },
      });
      assert.equal(redirected, `${target}?from=old&mode=read#details`);
      assert.ok(html.includes(`href="${target}"`));
      assert.ok(await readFile(path.join(output, file), 'utf8'));
    }
    await assert.rejects(readFile(path.join(root, 'cn', '404.html')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
