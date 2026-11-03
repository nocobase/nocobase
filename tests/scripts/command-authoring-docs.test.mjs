import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

// Command guidance is intentionally self-contained in both App and plugin Skills. Both ship with app-skills,
// but an agent loads only the relevant guide. Keep their shared contract identical; task-specific testing
// guidance follows the markers.
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const copies = [
  'packages/app/app-skills/skills/nocobase-app-development/references/commands.md',
  'packages/app/app-skills/skills/nocobase-app-plugin-development/references/cli.md',
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
