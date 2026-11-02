import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('published application Skill examples match the compiled and tested Examples source', () => {
  const result = execFileSync(
    process.execPath,
    ['scripts/sync-app-skill-examples.mjs', '--check'],
    { cwd: new URL('../../', import.meta.url), encoding: 'utf8' },
  );
  assert.match(result, /Checked \d+ executable Skill example files/u);
});

test('runnable scenario entries resolve to the exact published source set', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const source = path.join(root, 'packages/templates/app-template-examples');
  const skill = path.join(
    root,
    'packages/app/app-skills/skills/nocobase-app-development',
  );
  const read = (file) => readFileSync(file, 'utf8');
  const index = JSON.parse(
    read(path.join(source, 'docs/business-examples/index.json')),
  );
  assert.equal(
    read(path.join(source, 'docs/business-examples/index.json')),
    read(path.join(skill, 'assets/business-examples/index.json')),
  );
  for (const scenario of index.filter((entry) => entry.status === 'runnable')) {
    const destination = path.join(skill, scenario.destination);
    assert.deepEqual(
      readdirSync(destination, { recursive: true })
        .filter((file) => path.extname(file))
        .sort(),
      [...scenario.sources].sort(),
    );
    for (const file of scenario.sources)
      assert.equal(
        read(path.join(source, file)),
        read(path.join(destination, file)),
        file,
      );
  }
  const heldOut = index.find((entry) => entry.id === 'expenses');
  assert.equal(heldOut.status, 'held-out');
  assert.deepEqual(heldOut.sources, []);
  assert.equal(heldOut.destination, null);
});
