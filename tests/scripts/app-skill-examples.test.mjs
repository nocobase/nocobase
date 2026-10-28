import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('published application Skill examples match the compiled and tested Examples source', () => {
  const result = execFileSync(
    process.execPath,
    ['scripts/sync-app-skill-examples.mjs', '--check'],
    { cwd: new URL('../../', import.meta.url), encoding: 'utf8' },
  );
  assert.match(result, /Checked \d+ executable Skill example files/u);
});
