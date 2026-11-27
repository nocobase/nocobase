import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildReleaseEntry,
  describeRelease,
  entryFileNames,
  existingField,
  renderEntryFiles,
} from '../../scripts/studio-website-changelog.mjs';

const script = fileURLToPath(
  new URL('../../scripts/studio-website-changelog.mjs', import.meta.url),
);
const workflow = readFileSync(
  new URL('../../.github/workflows/v3-studio-release.yml', import.meta.url),
  'utf8',
);

const NOTES = {
  en: '### 🎉 New Features\n\n- **[Quality]** {{edition:enterprise}} Show quality data.',
  'zh-CN':
    '### 🎉 新特性\n\n- **[质量]** {{edition:enterprise}} 展示质量数据。',
  'ja-JP':
    '### 🎉 新機能\n\n- **[品質]** {{edition:enterprise}} 品質データを表示します。',
};

test('names, titles and channels a Studio release by its version', () => {
  assert.deepEqual(describeRelease('1.0.0-beta.90'), {
    id: 'studio-1.0.0-beta.90',
    tag: 'v1.0.0-beta.90',
    channel: 'beta',
    title: 'NocoBase Studio · v1.0.0-beta.90',
  });
  assert.equal(describeRelease('1.0.0').channel, 'stable');
  assert.throws(() => describeRelease('v1.0.0'), /Not a Studio version/);
  assert.throws(() => describeRelease('latest'), /Not a Studio version/);
  assert.deepEqual(entryFileNames('studio-1.0.0'), {
    en: 'studio-1.0.0.md',
    'zh-CN': 'studio-1.0.0.zh-CN.md',
    'ja-JP': 'studio-1.0.0.ja-JP.md',
  });
});

test('writes the front matter as quoted strings followed by the notes, without a url', () => {
  const entry = buildReleaseEntry({
    version: '1.0.0-beta.90',
    notes: NOTES,
    date: '2026-11-23',
    publishedAt: '2026-11-23T09:12:00Z',
  });
  const files = renderEntryFiles(entry);
  assert.deepEqual(Object.keys(files), [
    'studio-1.0.0-beta.90.md',
    'studio-1.0.0-beta.90.zh-CN.md',
    'studio-1.0.0-beta.90.ja-JP.md',
  ]);
  assert.equal(
    files['studio-1.0.0-beta.90.md'],
    `---
type: "release"
product: "studio"
tag: "v1.0.0-beta.90"
channel: "beta"
version: "1.0.0-beta.90"
title: "NocoBase Studio · v1.0.0-beta.90"
date: "2026-11-23"
publishedAt: "2026-11-23T09:12:00Z"
---

${NOTES.en}
`,
  );
  assert.match(files['studio-1.0.0-beta.90.ja-JP.md'], /品質データ/);
});

test('has no entry without English notes and leaves out a language without notes', () => {
  const base = {
    version: '1.0.0',
    date: '2026-11-23',
    publishedAt: '2026-11-23T09:12:00Z',
  };
  assert.equal(
    buildReleaseEntry({ ...base, notes: { 'zh-CN': NOTES['zh-CN'] } }),
    undefined,
  );
  const files = renderEntryFiles(
    buildReleaseEntry({ ...base, notes: { en: NOTES.en } }),
  );
  assert.deepEqual(Object.keys(files), ['studio-1.0.0.md']);
  assert.throws(
    () => buildReleaseEntry({ ...base, notes: NOTES, date: '2026/11/23' }),
    /YYYY-MM-DD/,
  );
});

test('reads a field from existing front matter', () => {
  const content =
    '---\ndate: "2026-11-20"\npublishedAt: \'2026-11-20T01:02:03Z\'\n---\n\nBody\n';
  assert.equal(existingField(content, 'date'), '2026-11-20');
  assert.equal(existingField(content, 'publishedAt'), '2026-11-20T01:02:03Z');
  assert.equal(existingField(content, 'title'), undefined);
  assert.equal(existingField('no front matter', 'date'), undefined);
});

test('writes, keeps and removes the entry files in the website directory', (t) => {
  const temp = mkdtempSync(path.join(tmpdir(), 'studio-website-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const notes = path.join(temp, 'notes');
  const out = path.join(temp, 'changelog');
  mkdirSync(notes);
  const writeNotes = (all) => {
    for (const locale of ['en', 'zh-CN', 'ja-JP']) {
      const file = path.join(notes, `release-notes.website.${locale}.md`);
      if (all[locale]) writeFileSync(file, `${all[locale]}\n`);
      else rmSync(file, { force: true });
    }
  };
  const run = (...args) =>
    execFileSync(
      process.execPath,
      [script, '--version', '1.0.0-beta.90', '--notes-dir', notes, ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );

  writeNotes(NOTES);
  const first = run(
    '--out-dir',
    out,
    '--date',
    '2026-11-22',
    '--published-at',
    '2026-11-22T10:00:00Z',
  );
  assert.deepEqual(first.trim().split('\n'), [
    path.join(out, 'studio-1.0.0-beta.90.md'),
    path.join(out, 'studio-1.0.0-beta.90.zh-CN.md'),
    path.join(out, 'studio-1.0.0-beta.90.ja-JP.md'),
  ]);
  const english = readFileSync(
    path.join(out, 'studio-1.0.0-beta.90.md'),
    'utf8',
  );
  assert.match(english, /date: "2026-11-22"/);
  assert.match(english, /publishedAt: "2026-11-22T10:00:00Z"/);

  // A resend keeps the date and publishedAt, so nothing changes.
  assert.equal(run('--out-dir', out), first);
  assert.equal(
    readFileSync(path.join(out, 'studio-1.0.0-beta.90.md'), 'utf8'),
    english,
  );

  // A language without notes any more loses its file.
  writeNotes({ en: NOTES.en, 'zh-CN': NOTES['zh-CN'] });
  run('--out-dir', out);
  assert.equal(
    existsSync(path.join(out, 'studio-1.0.0-beta.90.ja-JP.md')),
    false,
  );

  // No English notes: no entry, empty stdout, nothing written.
  writeNotes({});
  assert.equal(run('--out-dir', path.join(temp, 'other')), '');
  assert.equal(existsSync(path.join(temp, 'other')), false);

  // Without --out-dir it prints the English file.
  writeNotes(NOTES);
  assert.match(run(), /^---\ntype: "release"\nproduct: "studio"/);
});

test('the Studio release publishes the website entry as best-effort steps', () => {
  const start = workflow.indexOf('      - name: Check for website notes\n');
  const end = workflow.indexOf('      - name: Summary\n', start);
  assert.ok(start > 0 && end > start);
  const block = workflow.slice(start, end);
  for (const id of [
    'website_token',
    'website_tooling',
    'website',
    'website_changelog',
  ])
    assert.match(
      block,
      new RegExp(`id: ${id}\\n        continue-on-error: true`),
    );
  assert.match(block, /repositories: website-v3/);
  assert.match(block, /permission-contents: write/);
  assert.match(block, /scripts\/studio-website-changelog\.mjs/);
  assert.match(block, /--out-dir homepage\/content\/changelog/);
  assert.match(block, /git push origin HEAD:main/);
  assert.doesNotMatch(block, /skip ci/);
  assert.match(
    workflow,
    /WEBSITE_RESULT: \$\{\{ steps\.website_result\.outputs\.result \}\}/,
  );
});
