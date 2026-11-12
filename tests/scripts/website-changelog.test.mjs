import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildReleaseEntry,
  collectNotes,
  describeRelease,
  existingPublishedAt,
  now,
  readChangelogs,
  serializeEntry,
} from '../../scripts/website-changelog.mjs';

const script = fileURLToPath(
  new URL('../../scripts/website-changelog.mjs', import.meta.url),
);

const heading = (tag) =>
  `## [${tag}](https://github.com/nocobase/nocobase/releases/tag/${encodeURIComponent(tag)})`;

const changelog = (title, sections) =>
  `# ${title}\n\nIntro.\n\n${sections.map(([tag, body]) => `${heading(tag)}\n\n${body}\n`).join('\n')}`;

test('names and titles beta, legacy beta and stable entries', () => {
  assert.deepEqual(describeRelease('nocobase-v3-beta/2026-11-12.1'), {
    channel: 'beta',
    version: '2026-11-12.1',
    date: '2026-11-12',
    title: 'NocoBase v3 Beta · 2026-11-12.1',
    fileName: 'beta-2026-11-12.1.json',
  });
  assert.equal(
    describeRelease('release-beta/2026-10-28.2').fileName,
    'beta-2026-10-28.2.json',
  );
  assert.deepEqual(describeRelease('release/2026-12-01.1'), {
    channel: 'stable',
    version: '2026-12-01.1',
    date: '2026-12-01',
    title: 'NocoBase v3 · 2026-12-01.1',
    fileName: 'stable-2026-12-01.1.json',
  });
  assert.throws(() => describeRelease('@nocobase/app@1.0.0'), /aggregate/u);
});

test('builds the entry from each language section without its heading', () => {
  const tag = 'nocobase-v3-beta/2026-11-12.1';
  const entry = buildReleaseEntry({
    tag,
    publishedAt: '2026-11-12T08:31:00Z',
    changelogs: {
      en: changelog('Changelog', [
        [tag, '### 🎉 New Features\n\n- **[Server]** New.'],
        ['nocobase-v3-beta/2026-11-11.1', '### 🐛 Bug Fixes\n\n- Old.'],
      ]),
      zh: changelog('更新日志', [
        [tag, '### 🎉 新特性\n\n- **[服务端]** 新。'],
      ]),
      ja: undefined,
    },
  });
  assert.deepEqual(entry, {
    type: 'release',
    tag,
    channel: 'beta',
    version: '2026-11-12.1',
    title: 'NocoBase v3 Beta · 2026-11-12.1',
    date: '2026-11-12',
    publishedAt: '2026-11-12T08:31:00Z',
    url: 'https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1',
    notes: {
      en: '### 🎉 New Features\n\n- **[Server]** New.',
      'zh-CN': '### 🎉 新特性\n\n- **[服务端]** 新。',
    },
  });
  assert.equal(serializeEntry(entry), `${JSON.stringify(entry, null, 2)}\n`);
});

test('has no entry without an English section or with no user-facing changes', () => {
  const tag = 'release/2026-12-01.1';
  const zh = changelog('更新日志', [[tag, '### 🐛 修复\n\n- 修复。']]);
  assert.equal(
    buildReleaseEntry({ tag, publishedAt: now(), changelogs: { zh } }),
    undefined,
  );
  assert.equal(
    buildReleaseEntry({
      tag,
      publishedAt: now(),
      changelogs: {
        en: changelog('Changelog', [[tag, 'No user-facing changes.']]),
        zh: changelog('更新日志', [[tag, '没有面向用户的变更。']]),
      },
    }),
    undefined,
  );
});

test('reads a renamed beta tag under its original release-beta heading', () => {
  const notes = collectNotes(
    {
      en: changelog('Changelog', [['release-beta/2026-10-28.2', '- Legacy.']]),
    },
    'nocobase-v3-beta/2026-10-28.2',
  );
  assert.deepEqual(notes, { en: '- Legacy.' });
});

test('keeps the publishedAt of an existing entry', () => {
  assert.equal(
    existingPublishedAt('{"publishedAt":"2026-11-12T08:31:00Z"}'),
    '2026-11-12T08:31:00Z',
  );
  assert.equal(existingPublishedAt('{}'), undefined);
  assert.equal(existingPublishedAt('not json'), undefined);
  assert.equal(existingPublishedAt(undefined), undefined);
  assert.match(now(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u);
});

test('writes the entry from the tagged commit and leaves an unchanged one alone', (t) => {
  const repository = mkdtempSync(
    path.join(tmpdir(), 'nocobase-website-changelog-'),
  );
  const outDir = mkdtempSync(path.join(tmpdir(), 'nocobase-website-out-'));
  t.after(() => {
    rmSync(repository, { force: true, recursive: true });
    rmSync(outDir, { force: true, recursive: true });
  });
  const git = (...args) =>
    execFileSync('git', args, { cwd: repository, encoding: 'utf8' });
  git('init', '--quiet');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('config', 'tag.gpgSign', 'false');
  git('config', 'commit.gpgSign', 'false');

  const tag = 'nocobase-v3-beta/2026-11-12.1';
  writeFileSync(
    path.join(repository, 'CHANGELOG.md'),
    changelog('Changelog', [[tag, '- Tagged.']]),
  );
  git('add', '.');
  git('commit', '--quiet', '-m', 'release');
  git('tag', tag);
  // A branch of the same name, as while a release is in flight, and a later commit the tag must not see.
  git('branch', tag);
  writeFileSync(
    path.join(repository, 'CHANGELOG.md'),
    changelog('Changelog', [[tag, '- Edited later.']]),
  );
  git('commit', '--quiet', '-am', 'later');

  assert.deepEqual(readChangelogs(tag, repository), {
    en: changelog('Changelog', [[tag, '- Tagged.']]),
    zh: undefined,
    ja: undefined,
  });

  const run = () =>
    execFileSync(
      process.execPath,
      [script, tag, '--root', repository, '--out-dir', outDir],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  const file = path.join(outDir, 'beta-2026-11-12.1.json');
  writeFileSync(file, '{"publishedAt":"2026-11-12T08:31:00Z"}\n');
  assert.equal(run(), `${file}\n`);
  const written = readFileSync(file, 'utf8');
  const entry = JSON.parse(written);
  assert.equal(entry.publishedAt, '2026-11-12T08:31:00Z');
  assert.deepEqual(entry.notes, { en: '- Tagged.' });
  assert.equal(run(), `${file}\n`);
  assert.equal(readFileSync(file, 'utf8'), written);

  const missing = 'nocobase-v3-beta/2026-11-13.1';
  git('tag', missing);
  assert.equal(
    execFileSync(
      process.execPath,
      [script, missing, '--root', repository, '--out-dir', outDir],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ),
    '',
  );
});

test('the GitHub Release workflow publishes the entry to website-v3 as a best-effort job', () => {
  const source = readFileSync(
    fileURLToPath(
      new URL('../../.github/workflows/v3-github-release.yml', import.meta.url),
    ),
    'utf8',
  );
  const job = source.split('\n  website-changelog:\n')[1];
  assert.ok(job, 'v3-github-release.yml has a website-changelog job');
  assert.match(job, /^    needs: publish$/mu);
  assert.match(job, /^    continue-on-error: true$/mu);
  assert.match(job, /repositories: website-v3\n\s+permission-contents: write/u);
  assert.match(job, /node scripts\/website-changelog\.mjs/u);
  assert.match(job, /git push origin HEAD:main/u);
  // website-v3's site.yml has to run on the commit to publish it.
  assert.doesNotMatch(job, /skip ci/iu);
  assert.match(job, /::warning::/u);
});
