// `@nocobase/studio-cli` publishes nb-studio on its own, while Studio's `nocobase.cli` and `ai/skills/nb-studio-cli` are
// what `nocobase cli build` packs from Studio. Until one points at the other, the two copies must not drift.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const studio = path.join(root, 'packages/apps/studio');
const cli = path.join(root, 'packages/tools/studio-cli');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

async function filesUnder(dir) {
  const out = {};
  for (const entry of await readdir(dir, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    out[path.relative(dir, file)] = await readFile(file, 'utf8');
  }
  return out;
}

test("the CLI package carries Studio's brand, without what only packaging uses", async () => {
  const { skills, version, ...brand } = (
    await readJson(path.join(studio, 'package.json'))
  ).nocobase.cli;
  assert.deepEqual(skills, ['ai/skills/nb-studio-cli']);
  assert.equal(version, undefined);
  const pkg = await readJson(path.join(cli, 'package.json'));
  assert.deepEqual(pkg.nocobase.cli, brand);
  assert.deepEqual(pkg.bin, { [brand.bin]: './bin/run.js' });
});

test("the CLI package ships Studio's nb-studio Skill unchanged", async () => {
  assert.deepEqual(
    await filesUnder(path.join(cli, 'skills/nb-studio-cli')),
    await filesUnder(path.join(studio, 'ai/skills/nb-studio-cli')),
  );
});
