import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

// The command-authoring guidance lives once, in the App Skill. The plugin Skill ships beside it in
// `.agents/skills/` and links to it instead of carrying a copy that could drift.
const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const home =
  'packages/app/app-skills/skills/nocobase-app-development/references/commands.md';
const plugin =
  'packages/app/app-skills/skills/nocobase-app-plugin-development/references/cli.md';
const START = '<!-- command-authoring:start -->';
const END = '<!-- command-authoring:end -->';

const read = (file) => readFile(path.join(repoRoot, file), 'utf8');

test('the App Skill holds exactly one command-authoring block', async () => {
  const text = await read(home);
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  assert.ok(
    start !== -1 && end > start,
    `${home} has no ${START} … ${END} block`,
  );
  assert.equal(
    text.indexOf(START, start + 1),
    -1,
    `${home} has more than one block`,
  );
});

test('the plugin Skill links to the App Skill instead of copying the block', async () => {
  const text = await read(plugin);
  assert.ok(
    !text.includes(START) && !text.includes(END),
    `${plugin} must not carry a copy of the command-authoring block; link to ${home} instead`,
  );
  assert.match(
    text,
    /\]\(\.\.\/\.\.\/nocobase-app-development\/references\/commands\.md(?:#[^)]*)?\)/u,
    `${plugin} must link to ../../nocobase-app-development/references/commands.md`,
  );
});
