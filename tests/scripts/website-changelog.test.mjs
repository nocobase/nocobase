import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
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
  collectNotes,
  describeRelease,
  entryFileNames,
  existingPublishedAt,
  now,
  readChangelogs,
  renderEntryFiles,
  stripAuthorCredits,
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
    id: 'beta-2026-11-12.1',
  });
  assert.equal(
    describeRelease('release-beta/2026-10-28.2').id,
    'beta-2026-10-28.2',
  );
  assert.deepEqual(entryFileNames('stable-2026-12-01.1'), {
    en: 'stable-2026-12-01.1.md',
    'zh-CN': 'stable-2026-12-01.1.zh-CN.md',
    'ja-JP': 'stable-2026-12-01.1.ja-JP.md',
  });
  assert.deepEqual(describeRelease('release/2026-12-01.1'), {
    channel: 'stable',
    version: '2026-12-01.1',
    date: '2026-12-01',
    title: 'NocoBase v3 · 2026-12-01.1',
    id: 'stable-2026-12-01.1',
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
  const matter = [
    '---',
    'type: "release"',
    `tag: "${tag}"`,
    'channel: "beta"',
    'version: "2026-11-12.1"',
    'title: "NocoBase v3 Beta · 2026-11-12.1"',
    'date: "2026-11-12"',
    'publishedAt: "2026-11-12T08:31:00Z"',
    'url: "https://github.com/nocobase/nocobase/releases/tag/nocobase-v3-beta%2F2026-11-12.1"',
    '---',
    '',
  ].join('\n');
  assert.deepEqual(renderEntryFiles(entry), {
    'beta-2026-11-12.1.md': `${matter}\n### 🎉 New Features\n\n- **[Server]** New.\n`,
    'beta-2026-11-12.1.zh-CN.md': `${matter}\n### 🎉 新特性\n\n- **[服务端]** 新。\n`,
  });
});

test('quotes every front matter value so any value stays a valid YAML string', () => {
  const entry = buildReleaseEntry({
    tag: 'release/2026-12-01.1',
    publishedAt: 'a "quoted": value\nwith # and ---',
    changelogs: {
      en: changelog('Changelog', [['release/2026-12-01.1', '- Fix.']]),
    },
  });
  const [content] = Object.values(renderEntryFiles(entry));
  assert.match(
    content,
    /^publishedAt: "a \\"quoted\\": value\\nwith # and ---"$/mu,
  );
  assert.equal(content.split('\n').filter((line) => line === '---').length, 2);
  assert.equal(existingPublishedAt(content), entry.publishedAt);
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
  const at = '2026-11-12T08:31:00Z';
  assert.equal(
    existingPublishedAt(`---\npublishedAt: "${at}"\n---\n\nBody\n`),
    at,
  );
  assert.equal(existingPublishedAt(`---\npublishedAt: ${at}\n---\n`), at);
  assert.equal(existingPublishedAt(`---\npublishedAt: '${at}'\n---\n`), at);
  assert.equal(existingPublishedAt('---\ntype: "release"\n---\n'), undefined);
  assert.equal(existingPublishedAt(`publishedAt: "${at}"\n`), undefined);
  assert.equal(
    existingPublishedAt('---\npublishedAt: "broken\n---\n'),
    undefined,
  );
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
  writeFileSync(
    path.join(repository, 'CHANGELOG.zh-CN.md'),
    changelog('更新日志', [[tag, '- 已打标签。']]),
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
    zh: changelog('更新日志', [[tag, '- 已打标签。']]),
    ja: undefined,
  });

  const run = () =>
    execFileSync(
      process.execPath,
      [script, tag, '--root', repository, '--out-dir', outDir],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  const en = path.join(outDir, 'beta-2026-11-12.1.md');
  const zh = path.join(outDir, 'beta-2026-11-12.1.zh-CN.md');
  const ja = path.join(outDir, 'beta-2026-11-12.1.ja-JP.md');
  // An earlier publish left an English file to keep the publishedAt of, and a Japanese file whose section is gone.
  writeFileSync(
    en,
    '---\npublishedAt: "2026-11-12T08:31:00Z"\n---\n\n- Old.\n',
  );
  writeFileSync(ja, '---\n---\n\n- 古い。\n');
  assert.equal(run(), `${en}\n${zh}\n${ja}\n`);
  assert.equal(existsSync(ja), false);
  const written = [readFileSync(en, 'utf8'), readFileSync(zh, 'utf8')];
  assert.match(written[0], /^publishedAt: "2026-11-12T08:31:00Z"$/mu);
  assert.match(written[0], /\n---\n\n- Tagged\.\n$/u);
  assert.match(written[1], /^publishedAt: "2026-11-12T08:31:00Z"$/mu);
  assert.match(written[1], /\n---\n\n- 已打标签。\n$/u);
  assert.equal(run(), `${en}\n${zh}\n`);
  assert.deepEqual(
    [readFileSync(en, 'utf8'), readFileSync(zh, 'utf8')],
    written,
  );

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

  // A failure is reported to Feishu, which itself never fails the job, and both release workflows pass the webhook.
  const notify = job.split(
    '- name: Notify Feishu about the failed website update',
  )[1];
  assert.ok(notify, 'the job notifies Feishu');
  assert.match(notify, /continue-on-error: true/u);
  assert.match(
    notify,
    /WEBHOOK_URL: \$\{\{ secrets\.RELEASE_RESULT_FEISHU_WEBHOOK_URL \}\}/u,
  );
  assert.match(notify, /\.\/scripts\/feishu-notify\.sh/u);
  assert.match(notify, /TITLE: NocoBase 3 更新日志未发布到官网/u);
  assert.match(
    notify,
    /RELEASE_URL: \$\{\{ steps\.failed\.outputs\.release_url \}\}/u,
  );
  assert.match(
    source,
    /    secrets:\n      NOCOBASE_APP_PRIVATE_KEY:\n        required: true\n(?:      #.*\n)?      RELEASE_RESULT_FEISHU_WEBHOOK_URL:\n        required: false/u,
  );
  for (const name of ['v3-release-beta.yml', 'v3-release-stable.yml']) {
    const caller = readFileSync(
      fileURLToPath(
        new URL(`../../.github/workflows/${name}`, import.meta.url),
      ),
      'utf8',
    )
      .split('\n  github-release:')[1]
      .split(/\n  [a-z][\w-]*:/u)[0];
    assert.match(
      caller,
      /RELEASE_RESULT_FEISHU_WEBHOOK_URL: \$\{\{ secrets\.RELEASE_RESULT_FEISHU_WEBHOOK_URL \}\}/u,
      name,
    );
  }
});

test('drops the author credits older sections carry after each pull request link', () => {
  const pr = (number) =>
    `([#${number}](https://github.com/nocobase/nocobase/pull/${number}))`;
  assert.equal(
    stripAuthorCredits(
      [
        '### 🎉 New Features',
        '',
        `- **[Agents]** Show quota windows ${pr(11483)} by @2013xile`,
        '- **[Projects]**',
        `  - Faster reminders ${pr(11502)} by @chenos, @2013xile and [@mytharcher](https://github.com/mytharcher)`,
        `  - Studio change ${pr(11503)} by @app/nocobase-studio`,
        `- **[文件]** 支持附件上限。 ${pr(11460)} by @a、@b`,
        `- **[Users]** Already clean ${pr(11495)}`,
        '- Mentions stay in text: ask @chenos by email',
      ].join('\n'),
    ),
    [
      '### 🎉 New Features',
      '',
      `- **[Agents]** Show quota windows ${pr(11483)}`,
      '- **[Projects]**',
      `  - Faster reminders ${pr(11502)}`,
      `  - Studio change ${pr(11503)}`,
      `- **[文件]** 支持附件上限。 ${pr(11460)}`,
      `- **[Users]** Already clean ${pr(11495)}`,
      '- Mentions stay in text: ask @chenos by email',
    ].join('\n'),
  );

  const tag = 'nocobase-v3-beta/2026-11-11.1';
  const line = `- **[Agents]** Quota ${pr(11483)} by @2013xile`;
  assert.deepEqual(
    collectNotes(
      {
        en: changelog('Changelog', [[tag, line]]),
        zh: changelog('更新日志', [[tag, line.replace('Quota', '额度')]]),
        ja: changelog('変更履歴', [[tag, line.replace('Quota', 'クォータ')]]),
      },
      tag,
    ),
    {
      en: `- **[Agents]** Quota ${pr(11483)}`,
      'zh-CN': `- **[Agents]** 额度 ${pr(11483)}`,
      'ja-JP': `- **[Agents]** クォータ ${pr(11483)}`,
    },
  );
});
