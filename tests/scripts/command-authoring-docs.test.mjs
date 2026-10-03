import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

// How to write a command is described twice, on purpose: the application Skill reaches every generated application,
// and the plugin-development Skill can be installed globally, away from this repository. Each has to be complete on its
// own, so the shared part is duplicated between markers and kept identical here. Each Skill's "Test" section sits
// after the block: an application's tests take the command runner from @nocobase/app-testing, while the global
// plugin Skill describes only released packages.
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const copies = [
  'packages/app/app-skills/skills/nocobase-app-development/references/commands.md',
  'skills/nocobase-plugin-development/references/cli.md',
];
const START = '<!-- command-authoring:start -->';
const END = '<!-- command-authoring:end -->';

async function sharedBlock(file) {
  const text = await readFile(path.join(repoRoot, file), 'utf8');
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  assert.ok(
    start !== -1 && end > start,
    `${file} has no ${START} … ${END} block`,
  );
  assert.equal(
    text.indexOf(START, start + 1),
    -1,
    `${file} has more than one shared block`,
  );
  return text.slice(start, end + END.length);
}

test('the command-authoring guidance is identical in both Skills', async () => {
  const [first, ...rest] = await Promise.all(copies.map(sharedBlock));
  for (const [index, block] of rest.entries()) {
    assert.equal(
      block,
      first,
      `The shared command-authoring block in ${copies[index + 1]} differs from ${copies[0]}. Edit both copies together.`,
    );
  }
});

test('the shared block links nowhere, so it reads the same wherever it is installed', async () => {
  const block = await sharedBlock(copies[0]);
  assert.doesNotMatch(
    block,
    /\]\((?!#)[^)]+\)/u,
    'The shared block must not contain Markdown links',
  );
});
