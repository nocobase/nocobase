import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve(
  import.meta.dirname,
  '../../scripts/validate-changesets.mjs',
);

// Builds a repository with one package at `version` and one pending changeset giving it `bump`, then runs the
// validator from its root the way CI does.
async function validate(t, { version, bump, preMode = 'pre', inPre = false }) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'validate-changesets-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const packageDir = path.join(root, 'packages', 'plugins', 'app-plugin-x');
  await mkdir(packageDir, { recursive: true });
  await writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name: '@nocobase/app-plugin-x', version }),
  );

  await mkdir(path.join(root, '.changeset', 'pre'), { recursive: true });
  if (preMode) {
    await writeFile(
      path.join(root, '.changeset', 'pre.json'),
      JSON.stringify({ mode: preMode, tag: 'beta' }),
    );
  }
  await writeFile(
    path.join(root, '.changeset', inPre ? 'pre' : '', 'change.md'),
    `---\n'@nocobase/app-plugin-x': ${bump}\n---\n\nChange the routes.\n`,
  );

  return spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
}

test('rejects a major bump of an X.0.0 prerelease in prerelease mode', async (t) => {
  const result = await validate(t, { version: '1.0.0-beta.3', bump: 'major' });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /@nocobase\/app-plugin-x" is at 1\.0\.0-beta\.3/u,
  );
  assert.match(
    result.stderr,
    /version to 2\.0\.0-beta and add a "## 2\.0\.0-beta" heading/u,
  );
  assert.match(result.stderr, /releases it as 2\.0\.0-beta\.0/u);
  assert.match(result.stderr, /patch entry/u);
});

test('accepts a major bump that leaves a 0.x prerelease', async (t) => {
  const result = await validate(t, { version: '0.2.0-beta.3', bump: 'major' });

  assert.equal(result.status, 0, result.stderr);
});

// A version without a prerelease number starts the next line and is what the error tells the author to write.
test('accepts a major bump of a prerelease line that has not been released yet', async (t) => {
  const result = await validate(t, { version: '2.0.0-beta', bump: 'major' });

  assert.equal(result.status, 0, result.stderr);
});

test('accepts a minor or patch bump of an X.0.0 prerelease', async (t) => {
  for (const bump of ['minor', 'patch']) {
    const result = await validate(t, { version: '1.0.0-beta.3', bump });

    assert.equal(result.status, 0, `${bump}: ${result.stderr}`);
  }
});

test('accepts a major bump outside prerelease mode', async (t) => {
  for (const preMode of [null, 'exit']) {
    const result = await validate(t, {
      version: '1.0.0-beta.3',
      bump: 'major',
      preMode,
    });

    assert.equal(result.status, 0, `${preMode}: ${result.stderr}`);
  }
});

// Changesets already consumed into .changeset/pre/ were released under the version they produced; they cannot be
// corrected and must not block every later pull request.
test('ignores major bumps in changesets already released', async (t) => {
  const result = await validate(t, {
    version: '1.0.0-beta.3',
    bump: 'major',
    inPre: true,
  });

  assert.equal(result.status, 0, result.stderr);
});
