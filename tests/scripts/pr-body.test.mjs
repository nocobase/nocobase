import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  LANGUAGES,
  moduleOf,
  parsePullRequest,
  parseTitle,
  resolveScope,
} from '../../scripts/pr-body.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const template = readFileSync(
  path.join(root, '.github/pull_request_template.md'),
  'utf8',
);
const script = fileURLToPath(
  new URL('../../scripts/check-pr-body.mjs', import.meta.url),
);

function fill(type, en, zh, ja, body = template) {
  return body
    .replace(`- [ ] ${type}`, `- [x] ${type}`)
    .replace(/\| 🇺🇸 English +\|[^\n]*\|/u, `| 🇺🇸 English | ${en} |`)
    .replace(/\| 🇨🇳 Chinese +\|[^\n]*\|/u, `| 🇨🇳 Chinese | ${zh} |`)
    .replace(/\| 🇯🇵 Japanese +\|[^\n]*\|/u, `| 🇯🇵 Japanese | ${ja} |`);
}

const bugFix = fill(
  'Bug fix',
  'Keep demo sign-in sessions inside iframes.',
  '在 iframe 中保留演示环境的登录状态。',
  'iframe 内でもデモ環境のログイン状態を保持します。',
);

test('the template has a row for every changelog language', () => {
  for (const { label } of LANGUAGES)
    assert.match(template, new RegExp(`^\\| \\S+ ${label} +\\| +\\|$`, 'mu'));
});

test('reads the type, module and all changelog sentences from the template', () => {
  const result = parsePullRequest({
    title: 'fix(demo-mode): keep iframe sessions',
    body: bugFix,
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.type, 'Bug fix');
  assert.equal(result.scope, 'demo-mode');
  assert.deepEqual(result.changelog, {
    en: 'Keep demo sign-in sessions inside iframes.',
    zh: '在 iframe 中保留演示环境的登录状态。',
    ja: 'iframe 内でもデモ環境のログイン状態を保持します。',
  });
  assert.deepEqual(moduleOf(result.scope), {
    en: 'Demo mode',
    zh: '演示模式',
    ja: 'デモモード',
  });
});

test('the untouched template fails: no type is checked', () => {
  const result = parsePullRequest({ title: 'fix(db): x', body: template });
  assert.equal(result.type, null);
  assert.match(result.errors.join('\n'), /No type is checked/u);
});

test('Others needs no changelog', () => {
  const result = parsePullRequest({
    title: 'ci: retry flaky uploads',
    body: template.replace('- [ ] Others', '- [x] Others'),
  });
  assert.equal(result.type, 'Others');
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('a user-visible type needs all three sentences, and placeholders do not count', () => {
  const result = parsePullRequest({
    title: 'feat(knowledge): x',
    body: fill('New feature', 'TODO', '', 'なし'),
  });
  assert.equal(result.type, 'New feature');
  assert.match(
    result.errors.join('\n'),
    /English changelog "TODO" is a placeholder/u,
  );
  assert.match(result.errors.join('\n'), /Chinese changelog is empty/u);
  assert.match(
    result.errors.join('\n'),
    /Japanese changelog "なし" is a placeholder/u,
  );
  const noJapanese = parsePullRequest({
    title: 'feat(knowledge): x',
    body: fill('New feature', 'Add a thing.', '新增一项。', ''),
  });
  assert.deepEqual(noJapanese.errors, [
    'The Japanese changelog is empty: write one user-facing sentence, or check Others.',
  ]);
});

test('only the required languages are checked, and no scope map skips the module warnings', () => {
  const body = fill('New feature', 'Add a thing.', '新增一项。', '');
  const result = parsePullRequest(
    { title: 'feat: x', body },
    { languages: ['en', 'zh'], scopes: null },
  );
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('checking several types is an error', () => {
  const body = bugFix.replace('- [ ] Improvement', '- [x] Improvement');
  const result = parsePullRequest({ title: 'fix(db): x', body });
  assert.equal(result.type, null);
  assert.match(result.errors.join('\n'), /2 types are checked/u);
});

test('boxes, tables and headings outside their sections or inside code blocks are ignored', () => {
  const body = [
    '```md',
    '### Changelog',
    '| 🇺🇸 English | Not this one. |',
    '```',
    '- [x] Others',
    bugFix,
    '### Checklists',
    '- [x] All changes have been self-tested',
  ].join('\n');
  const result = parsePullRequest({ title: 'fix(db): x', body });
  assert.equal(result.type, 'Bug fix');
  assert.equal(
    result.changelog.en,
    'Keep demo sign-in sessions inside iframes.',
  );
});

test('accepts the v2 template GitHub offers from the default branch', () => {
  const v2 = `<!--
First of all, thank you for your contribution!
-->

### This is a ...
- [ ] New feature
- [x] Improvement
- [ ] Bug fix
- [ ] Others

### Motivation

### Changelog

| Language   | Changelog |
| ---------- | --------- |
| 🇺🇸 English | Show the package versions of a release. |
| 🇨🇳 Chinese | 显示发布的包版本。 |

### Docs

| Language   | Link |
| ---------- | --------- |
| 🇺🇸 English |  <!-- [Title](link) -->    |
| 🇨🇳 Chinese |  <!-- [标题](link) -->  |

### Checklists
- [x] All changes have been self-tested and work as expected
`;
  const result = parsePullRequest({ title: 'feat(releases): x', body: v2 });
  assert.deepEqual(result.errors, [
    'The Japanese changelog is empty: write one user-facing sentence, or check Others.',
  ]);
  assert.equal(result.type, 'Improvement');
  assert.equal(result.changelog.zh, '显示发布的包版本。');
  const withJapanese = parsePullRequest({
    title: 'feat(releases): x',
    body: v2.replace(
      '| 🇨🇳 Chinese | 显示发布的包版本。 |',
      '| 🇨🇳 Chinese | 显示发布的包版本。 |\n| 🇯🇵 Japanese | リリースのパッケージバージョンを表示します。 |',
    ),
  });
  assert.deepEqual(withJapanese.errors, []);
});

test('titles without a known scope list the entry under General with a warning', () => {
  assert.deepEqual(parseTitle('fix(db,agents): x'), {
    conventional: true,
    scope: 'db',
  });
  assert.deepEqual(parseTitle('Fix things'), {
    conventional: false,
    scope: null,
  });
  const unknown = parsePullRequest({
    title: 'fix(notificatons): x',
    body: bugFix,
  });
  assert.deepEqual(unknown.errors, []);
  assert.match(
    unknown.warnings[0],
    /"notificatons" is not in scripts\/changelog-scopes\.json.*Did you mean "notifications"\?/u,
  );
  assert.deepEqual(moduleOf('notificatons'), {
    en: 'General',
    zh: '通用',
    ja: '全般',
  });
  assert.match(
    parsePullRequest({ title: 'fix: x', body: bugFix }).warnings[0],
    /no scope/u,
  );
});

test('package directory and package names resolve to the short scope', () => {
  assert.equal(resolveScope('app-plugin-demo-mode'), 'demo-mode');
  assert.equal(resolveScope('@nocobase/app-plugin-knowledge'), 'knowledge');
  assert.equal(resolveScope('@nocobase/db-postgres'), 'db-postgres');
  assert.equal(resolveScope('unknown'), null);
});

test('every scope names its module in every language', () => {
  const scopes = JSON.parse(
    readFileSync(path.join(root, 'scripts/changelog-scopes.json'), 'utf8'),
  );
  for (const [scope, names] of Object.entries(scopes)) {
    assert.match(scope, /^[a-z0-9-]+$/u, scope);
    for (const { key } of LANGUAGES) assert.ok(names[key], `${scope} ${key}`);
  }
});

test('check-pr-body reports errors as annotations and writes the job summary', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'check-pr-body-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const run = (pullRequest, env = {}, args = []) => {
    const file = path.join(
      directory,
      `${Math.random().toString(36).slice(2)}.json`,
    );
    writeFileSync(file, JSON.stringify(pullRequest));
    const { GITHUB_STEP_SUMMARY: _, ...rest } = process.env;
    return spawnSync(process.execPath, [script, ...args, file], {
      encoding: 'utf8',
      env: { ...rest, ...env },
    });
  };

  const summary = path.join(directory, 'summary.md');
  const ok = run(
    { title: 'fix(demo-mode): x', body: bugFix },
    { GITHUB_STEP_SUMMARY: summary },
  );
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.match(ok.stdout, /PR description ok: Bug fix, Demo mode\./u);
  assert.match(
    readFileSync(summary, 'utf8'),
    /Module: Demo mode \/ 演示模式 \/ デモモード/u,
  );
  assert.match(readFileSync(summary, 'utf8'), /🇯🇵 iframe 内でも/u);

  const noModule = run({ title: 'feat(multi-portal): x', body: bugFix }, {});
  assert.equal(noModule.status, 0, noModule.stdout + noModule.stderr);
  assert.match(noModule.stdout, /::warning::The scope "multi-portal"/u);
  const pro = run({ title: 'feat(multi-portal): x', body: bugFix }, {}, [
    '--no-module',
  ]);
  assert.equal(pro.status, 0, pro.stdout + pro.stderr);
  assert.doesNotMatch(pro.stdout, /::warning::/u);
  assert.match(pro.stdout, /PR description ok: Bug fix\./u);

  const failed = run({ title: 'fix(db): x', body: 'Fixes a thing.' });
  assert.equal(failed.status, 1);
  assert.match(
    failed.stdout,
    /^::error::The description has no "### This is a \.\.\." section/mu,
  );
  assert.match(
    failed.stdout,
    /^::error::This pull request description does not follow the v3 PR template/mu,
  );

  const usage = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(usage.status, 2);
});
