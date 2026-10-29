import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHANGELOG_HEADERS,
  collectEntries,
  extractPullRequestNumbers,
  extractReleaseSection,
  parseChangelogSections,
  pendingBetaPullRequests,
  prependChangelog,
  releaseUrl,
  renderNotes,
  selectPreviousTag,
} from '../../scripts/changelog.mjs';
import { renderChangelogLines } from '../../scripts/release-notes.mjs';

const repo = 'nocobase/nocobase';

function body(type, en = 'An English sentence.', zh = '一句中文。') {
  return `### This is a ...

- [${type === 'New feature' ? 'x' : ' '}] New feature
- [${type === 'Improvement' ? 'x' : ' '}] Improvement
- [${type === 'Bug fix' ? 'x' : ' '}] Bug fix
- [${type === 'Others' ? 'x' : ' '}] Others

### Changelog

| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | ${en} |
| 🇨🇳 Chinese | ${zh} |
`;
}

function pr(number, title, text, headRefName = `fix/v3-${number}`) {
  return {
    number,
    title,
    body: text,
    url: `https://github.com/${repo}/pull/${number}`,
    author: { login: 'someone' },
    headRefName,
  };
}

test('the previous release is the latest earlier batch of the same channel', () => {
  const tags = [
    'release-beta/2026-10-25.4',
    'release-beta/2026-10-26.1',
    'release-beta/2026-10-26.10',
    'release-beta/2026-10-26.2',
    'release/2026-10-26.9',
    'release-beta/2026-10-27.1',
  ];
  assert.equal(
    selectPreviousTag(tags, 'release-beta/2026-10-26.11'),
    'release-beta/2026-10-26.10',
  );
  assert.equal(
    selectPreviousTag(tags, 'release-beta/2026-10-26.3'),
    'release-beta/2026-10-26.2',
  );
  assert.equal(
    selectPreviousTag(tags, 'release-beta/2026-10-26.1'),
    'release-beta/2026-10-25.4',
  );
  assert.equal(
    selectPreviousTag(tags, 'release/2026-10-27.1'),
    'release/2026-10-26.9',
  );
  assert.equal(selectPreviousTag(tags, 'release/2026-10-26.1'), null);
});

test('pull request numbers come from squash and merge commit subjects', () => {
  assert.deepEqual(
    extractPullRequestNumbers([
      'fix(db): x (#11168)',
      'chore: merge release 2026-10-26.2 into v3-develop [skip ci]',
      'Merge pull request #11001 from nocobase/feat/v3-x',
      'feat(agents): y (#11165) (#11168)',
    ]),
    [11168, 11001, 11165],
  );
});

test('entries are grouped by type and module; Others, release and unreadable PRs stay out', () => {
  const collected = collectEntries([
    pr(5, 'fix(demo-mode): b', body('Bug fix', 'Fix B.', '修复 B。')),
    pr(3, 'feat(knowledge): a', body('New feature', 'Add A.', '新增 A。')),
    pr(4, 'fix(demo-mode): c', body('Bug fix', 'Fix C.', '修复 C。')),
    pr(6, 'ci: d', body('Others')),
    pr(7, 'chore: release', body('Bug fix'), 'release-beta/2026-10-26.3'),
    pr(8, 'fix(db): old description', 'Fixes something.'),
  ]);
  assert.deepEqual(
    collected.missing.map(({ number }) => number),
    [8],
  );
  assert.equal(
    renderNotes(collected, 'en'),
    `### 🎉 New Features

- **[Knowledge base]** Add A. ([#3](https://github.com/${repo}/pull/3)) by @someone

### 🐛 Bug Fixes

- **[Demo mode]**
  - Fix C. ([#4](https://github.com/${repo}/pull/4)) by @someone
  - Fix B. ([#5](https://github.com/${repo}/pull/5)) by @someone
`,
  );
  assert.match(
    renderNotes(collected, 'zh'),
    /### 🐛 修复\n\n- \*\*\[演示模式\]\*\*\n {2}- 修复 C。/u,
  );
  assert.equal(renderNotes({ entries: [] }, 'zh'), '没有面向用户的变更。\n');
});

test('sections are prepended below the header once per tag and read back for the GitHub Release', () => {
  const first = prependChangelog(null, {
    tag: 'release-beta/2026-10-26.3',
    repo,
    notes: '### 🐛 Bug Fixes\n\n- **[Database]** Fix A.\n',
    language: 'en',
  });
  assert.ok(first.startsWith(CHANGELOG_HEADERS.en));
  const second = prependChangelog(first, {
    tag: 'release-beta/2026-10-26.4',
    repo,
    notes: 'No user-facing changes.\n',
    language: 'en',
  });
  assert.ok(
    second.indexOf('## [release-beta/2026-10-26.4]') <
      second.indexOf('## [release-beta/2026-10-26.3]'),
  );
  assert.ok(second.startsWith(CHANGELOG_HEADERS.en));
  assert.match(
    second,
    /^## \[release-beta\/2026-10-26\.4\]\(https:\/\/github\.com\/nocobase\/nocobase\/releases\/tag\/release-beta%2F2026-10-26\.4\)$/mu,
  );
  assert.equal(
    prependChangelog(second, {
      tag: 'release-beta/2026-10-26.3',
      repo,
      notes: 'Again.',
      language: 'en',
    }),
    null,
  );
  assert.equal(
    extractReleaseSection(second, 'release-beta/2026-10-26.3'),
    '### 🐛 Bug Fixes\n\n- **[Database]** Fix A.',
  );
  assert.equal(
    extractReleaseSection(second, 'release/2026-10-26.1'),
    undefined,
  );
  assert.equal(
    releaseUrl(repo, 'release/2026-10-26.1'),
    'https://github.com/nocobase/nocobase/releases/tag/release%2F2026-10-26.1',
  );
});

test('a stable release carries the PRs the betas listed that no stable section lists', () => {
  const link = (number) =>
    `([#${number}](https://github.com/${repo}/pull/${number}))`;
  // Sync merges can leave the stable section anywhere relative to later betas.
  const changelog = `${CHANGELOG_HEADERS.en}
## [release-beta/2026-10-28.1](x)

- **[Database]** D ${link(4)} by @a

## [release/2026-10-27.1](x)

- **[Database]** A ${link(1)} by @a
- **[Database]** B ${link(2)} by @a

## [release-beta/2026-10-27.2](x)

- **[Database]** C ${link(3)} by @a
- **[Database]** B ${link(2)} by @a

## [release-beta/2026-10-26.1](x)

- **[Database]**
  - A ${link(1)} by @a
  - E ${link(5)} by @a
`;
  assert.deepEqual(
    parseChangelogSections(changelog).map(({ tag }) => tag),
    [
      'release-beta/2026-10-28.1',
      'release/2026-10-27.1',
      'release-beta/2026-10-27.2',
      'release-beta/2026-10-26.1',
    ],
  );
  assert.deepEqual(pendingBetaPullRequests(changelog), [4, 3, 5]);
  assert.deepEqual(pendingBetaPullRequests(null), []);
});

test('the GitHub Release opens with the changelog section when the tagged commit has one', () => {
  const changelog = prependChangelog(null, {
    tag: 'release/2026-10-26.1',
    repo,
    notes: '### 🚀 Improvements\n\n- **[CLI]** Faster.\n',
    language: 'en',
  });
  assert.deepEqual(renderChangelogLines(changelog, 'release/2026-10-26.1'), [
    '### 🚀 Improvements\n\n- **[CLI]** Faster.',
    '',
    '## Packages',
    '',
  ]);
  assert.deepEqual(renderChangelogLines(changelog, 'release/2026-10-26.2'), []);
  assert.deepEqual(renderChangelogLines(undefined, 'release/2026-10-26.1'), []);
});

test('Beta changelogs continue across old and new aggregate tag names', () => {
  const tags = [
    'release-beta/2026-10-28.2',
    'nocobase-v3-beta/2026-10-28.10',
    'release/2026-10-28.20',
  ];
  assert.equal(
    selectPreviousTag(tags, 'nocobase-v3-beta/2026-10-28.3'),
    'release-beta/2026-10-28.2',
  );
  assert.equal(
    selectPreviousTag(tags, 'nocobase-v3-beta/2026-10-28.11'),
    'nocobase-v3-beta/2026-10-28.10',
  );
  assert.equal(
    selectPreviousTag(tags, 'release-beta/2026-10-29.1'),
    'nocobase-v3-beta/2026-10-28.10',
  );
  assert.equal(
    selectPreviousTag(tags, 'release/2026-10-29.1'),
    'release/2026-10-28.20',
  );
  const changelog = `## [nocobase-v3-beta/2026-10-28.10](x)
- Fix [#2](https://github.com/nocobase/nocobase/pull/2)
## [release-beta/2026-10-28.2](x)
- Fix [#1](https://github.com/nocobase/nocobase/pull/1)
`;
  assert.deepEqual(pendingBetaPullRequests(changelog), [2, 1]);
});

test('renamed historical Beta releases retain their immutable changelog section', () => {
  const changelog =
    '## [release-beta/2026-10-28.2](old-url)\n\nOriginal notes.\n';
  assert.deepEqual(
    renderChangelogLines(changelog, 'nocobase-v3-beta/2026-10-28.2'),
    ['Original notes.', '', '## Packages', ''],
  );
  assert.deepEqual(
    renderChangelogLines(changelog, 'nocobase-v3-beta/2026-10-28.3'),
    [],
  );
  const updated =
    '## [nocobase-v3-beta/2026-10-28.2](new-url)\n\nNew notes.\n' + changelog;
  assert.deepEqual(
    renderChangelogLines(updated, 'nocobase-v3-beta/2026-10-28.2'),
    ['New notes.', '', '## Packages', ''],
  );
});
