import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  checkAgentsMd,
  findLinks,
  linkPath,
  MAX_BYTES,
} from '../../scripts/check-agents-md.mjs';

const script = path.resolve(
  import.meta.dirname,
  '../../scripts/check-agents-md.mjs',
);

function fixture(files) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'check-agents-md-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const file = path.join(root, relativePath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return root;
}

async function check(files, options = {}) {
  const root = fixture(files);
  try {
    return await checkAgentsMd({ repositoryRoot: root, ...options });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const TEMPLATE = 'packages/templates/app-template-default';

test('passes small entry files whose links resolve and reports their sizes', async () => {
  const { problems, sizes } = await check({
    'AGENTS.md':
      '# Root\n\nSee [the rules](.agents/rules/testing.md#layout).\n',
    '.agents/rules/testing.md': 'Back to [the index](../../AGENTS.md).\n',
    [`${TEMPLATE}/AGENTS.md`]:
      '# App\n\nSee [deployment](.agents/rules/deploy.md).\n',
    [`${TEMPLATE}/.agents/rules/deploy.md`]: 'Done.\n',
  });
  assert.deepEqual(problems, []);
  assert.deepEqual(
    sizes.map((size) => size.file),
    ['AGENTS.md', `${TEMPLATE}/AGENTS.md`],
  );
});

test('fails an entry file over the size limit and says where the guidance goes', async () => {
  const { problems } = await check({
    [`${TEMPLATE}/AGENTS.md`]: 'x'.repeat(MAX_BYTES + 1),
  });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].file, `${TEMPLATE}/AGENTS.md`);
  assert.match(problems[0].message, new RegExp(`is ${MAX_BYTES + 1} bytes`));
  assert.match(
    problems[0].message,
    new RegExp(`${TEMPLATE}/\\.agents/rules/<topic>\\.md`),
  );
  assert.match(problems[0].message, /always-on rules and the index/);
});

test('fails a broken link in the entry file and in a nested rules file', async () => {
  const { problems } = await check({
    [`${TEMPLATE}/AGENTS.md`]:
      '# App\n\nSee [missing](.agents/rules/missing.md).\n',
    [`${TEMPLATE}/.agents/rules/frontend/ui.md`]:
      'Intro.\n\nSee [theme](theme.md) and [ok](../../../AGENTS.md).\n',
  });
  assert.deepEqual(
    problems.map((problem) => [problem.file, problem.line]),
    [
      [`${TEMPLATE}/AGENTS.md`, 3],
      [`${TEMPLATE}/.agents/rules/frontend/ui.md`, 3],
    ],
  );
  assert.match(
    problems[0].message,
    /links to \.agents\/rules\/missing\.md, which does not exist/,
  );
  assert.match(problems[1].message, /links to theme\.md/);
});

test('checks links into a template .agents/skills against the Skill source', async () => {
  const { problems, skipped } = await check({
    [`${TEMPLATE}/AGENTS.md`]: [
      '[app skill](.agents/skills/nocobase-app-development/references/http-api.md)',
      '[plugin skill](.agents/skills/nocobase-app-plugin-file/SKILL.md)',
      '[broken](.agents/skills/nocobase-app-development/references/missing.md)',
      '[unknown](.agents/skills/somebody-else/SKILL.md)',
      '',
    ].join('\n'),
    'packages/app/app-skills/skills/nocobase-app-development/references/http-api.md':
      'API\n',
    'packages/plugins/app-plugin-file/skills/nocobase-app-plugin-file/SKILL.md':
      'File\n',
  });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].line, 3);
  assert.match(
    problems[0].message,
    /source packages\/app\/app-skills\/skills\/nocobase-app-development\/references\/missing\.md does not exist/,
  );
  assert.deepEqual(
    skipped.map((link) => link.target),
    ['.agents/skills/somebody-else/SKILL.md'],
  );
});

test('maps the repository root .agents/skills to skills/', async () => {
  const { problems } = await check({
    'AGENTS.md':
      '[ok](.agents/skills/nocobase-create-app/SKILL.md) [broken](.agents/skills/nocobase-create-app/x.md)\n',
    'skills/nocobase-create-app/SKILL.md': 'Create\n',
  });
  assert.equal(problems.length, 1);
  assert.match(
    problems[0].message,
    /source skills\/nocobase-create-app\/x\.md does not exist/,
  );
});

test('ignores links in fenced code blocks, inline code, URLs and anchors', async () => {
  const source = [
    '```md',
    '[fenced](missing-1.md)',
    '```',
    '~~~',
    '[tilde](missing-2.md)',
    '~~~',
    'Write `[inline](missing-3.md)` or ``[double](missing-4.md)``.',
    '[web](https://example.com/x.md) [mail](mailto:a@b.c) [anchor](#section)',
    '[real](missing-5.md)',
    '',
  ].join('\n');
  assert.deepEqual(findLinks(source), [
    { target: 'https://example.com/x.md', line: 8 },
    { target: 'mailto:a@b.c', line: 8 },
    { target: '#section', line: 8 },
    { target: 'missing-5.md', line: 9 },
  ]);
  const { problems } = await check({ 'AGENTS.md': source });
  assert.deepEqual(
    problems.map((problem) => problem.line),
    [9],
  );
});

test('linkPath strips anchors and queries and decodes the path', () => {
  assert.equal(linkPath('docs/a%20b.md#part'), 'docs/a b.md');
  assert.equal(linkPath('file.md?plain=1'), 'file.md');
  assert.equal(linkPath('#only'), null);
  assert.equal(linkPath('HTTPS://example.com'), null);
});

test('the command exits 1 with the problems and 0 with a size summary', () => {
  const broken = fixture({ 'AGENTS.md': '[x](nowhere.md)\n' });
  const valid = fixture({ 'AGENTS.md': '# Root\n' });
  try {
    const failure = spawnSync(process.execPath, [script, '--root', broken], {
      encoding: 'utf8',
    });
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /AGENTS\.md:1 links to nowhere\.md/);
    const success = spawnSync(process.execPath, [script, '--root', valid], {
      encoding: 'utf8',
    });
    assert.equal(success.status, 0, success.stderr);
    assert.match(success.stdout, /AGENTS\.md {2}0\.0 KB/);
  } finally {
    rmSync(broken, { recursive: true, force: true });
    rmSync(valid, { recursive: true, force: true });
  }
});
