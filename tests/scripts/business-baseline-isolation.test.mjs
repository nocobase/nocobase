import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assertPrivateBoundary,
  copyEntry,
  isolatedEnvironment,
  preparePrivateRuntime,
} from '../../dev/business-baseline/isolation.mjs';

async function fixture(run) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'baseline-isolation-'),
  );
  try {
    const source = path.join(directory, 'source');
    const target = path.join(directory, 'private');
    await mkdir(source);
    await mkdir(target);
    await run({ directory, source, target });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('dependency copies have independent inodes and mutations cannot reach the original', async () => {
  await fixture(async ({ source, target }) => {
    await writeFile(path.join(source, 'runtime.js'), 'frozen bytes');
    const expected = createHash('sha256').update('frozen bytes').digest('hex');
    await copyEntry(source, target, 'runtime.js', expected);
    const original = await lstat(path.join(source, 'runtime.js'));
    const copy = await lstat(path.join(target, 'runtime.js'));
    assert.notEqual(copy.ino, original.ino);
    assert.equal(copy.nlink, 1);
    await writeFile(path.join(target, 'runtime.js'), 'private edit');
    assert.equal(
      await readFile(path.join(source, 'runtime.js'), 'utf8'),
      'frozen bytes',
    );
  });
});

test('private recovery copies only frozen dependency entries and preserves the original profile bytes', async () => {
  await fixture(async ({ source }) => {
    const git = (args) =>
      execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim();
    git(['init', '--quiet']);
    await writeFile(
      path.join(source, 'package.json'),
      JSON.stringify({ dependencies: { tool: '*' } }),
    );
    const provider = 'packages/example/source/credentials/provider.ts';
    await mkdir(path.dirname(path.join(source, provider)), { recursive: true });
    await writeFile(
      path.join(source, provider),
      'export const provider = true;',
    );
    git(['add', 'package.json', provider]);
    git([
      '-c',
      'user.name=Test',
      '-c',
      'user.email=test@example.test',
      'commit',
      '--quiet',
      '-m',
      'fixture',
    ]);
    const sourceCommit = git(['rev-parse', 'HEAD']);
    const dependency = 'tool/node_modules/tool/index.js';
    await mkdir(
      path.join(source, 'node_modules/.pnpm/tool/node_modules/tool'),
      { recursive: true },
    );
    await mkdir(path.join(source, 'node_modules/.bin'));
    await writeFile(
      path.join(source, 'node_modules/.pnpm', dependency),
      'frozen',
    );
    await writeFile(
      path.join(
        source,
        'node_modules/.pnpm/tool/node_modules/tool/added-after-freeze.js',
      ),
      'omit',
    );
    await symlink(
      '.pnpm/tool/node_modules/tool',
      path.join(source, 'node_modules/tool'),
    );
    await mkdir(path.join(source, '.business-baseline'));
    const profileBytes = Buffer.from(
      JSON.stringify({
        round: 'before',
        runtime: {
          sourceCommit,
          artifacts: {
            external: {
              [dependency]: createHash('sha256').update('frozen').digest('hex'),
            },
          },
        },
      }) + '\n',
    );
    const targetRoot = path.join(source, '.business-baseline/private-fixture');
    const receipt = await preparePrivateRuntime({
      sourceRoot: source,
      targetRoot,
      sourceCommit,
      profileBytes,
    });
    assert.equal(
      await readFile(path.join(targetRoot, provider), 'utf8'),
      'export const provider = true;',
    );
    assert.equal(receipt.artifactFiles, 1);
    assert.deepEqual(
      await readFile(
        path.join(targetRoot, '.business-baseline/runtime-before.json'),
      ),
      profileBytes,
    );
    await assert.rejects(
      lstat(
        path.join(
          targetRoot,
          'node_modules/.pnpm/tool/node_modules/tool/added-after-freeze.js',
        ),
      ),
      { code: 'ENOENT' },
    );
    assert.equal(
      await readFile(
        path.join(
          source,
          'node_modules/.pnpm/tool/node_modules/tool/added-after-freeze.js',
        ),
        'utf8',
      ),
      'omit',
    );
    await assert.rejects(
      preparePrivateRuntime({
        sourceRoot: source,
        targetRoot,
        sourceCommit,
        profileBytes,
      }),
      /already exists/,
    );
  });
});

test('copy refuses credentials, traversal, absolute links and changed frozen bytes', async () => {
  await fixture(async ({ source, target }) => {
    await writeFile(path.join(source, 'changed.js'), 'different');
    await assert.rejects(
      copyEntry(source, target, 'changed.js', '0'.repeat(64)),
      /Frozen dependency bytes/,
    );
    for (const name of [
      '.npmrc',
      '.env',
      '.env.local',
      'config.yml',
      '../escape',
    ])
      await assert.rejects(copyEntry(source, target, name));
    await symlink(
      path.join(source, 'changed.js'),
      path.join(source, 'absolute'),
    );
    await assert.rejects(
      copyEntry(source, target, 'absolute'),
      /Absolute dependency link/,
    );
    await symlink('../escape', path.join(source, 'relative'));
    await assert.rejects(
      copyEntry(source, target, 'relative'),
      /Escaping dependency link/,
    );
  });
});

test('boundary detects redirected roots, transitive links and hard-linked private files', async () => {
  await fixture(async ({ directory, source, target }) => {
    const redirectedRoot = path.join(directory, 'redirected-root');
    await symlink('private', redirectedRoot);
    await assert.rejects(
      assertPrivateBoundary(redirectedRoot),
      /Private root must not redirect/,
    );
    await writeFile(path.join(target, 'original'), 'private');
    await symlink('original', path.join(target, 'valid'));
    assert.equal((await assertPrivateBoundary(target)).links, 1);
    await symlink('../source', path.join(target, 'outside'));
    await assert.rejects(assertPrivateBoundary(target), /Private link escapes/);
    await rm(path.join(target, 'outside'));
    await writeFile(path.join(source, 'fixture'), 'test-only hard link');
    await link(
      path.join(source, 'fixture'),
      path.join(target, 'hard-link-fixture'),
    );
    await assert.rejects(
      assertPrivateBoundary(target),
      /Hard-linked private file/,
    );
  });
});

test('copy checks destination ancestors before writing through a redirected directory', async () => {
  await fixture(async ({ source, target }) => {
    await mkdir(path.join(source, 'folder'));
    await writeFile(path.join(source, 'folder/new.js'), 'frozen');
    await symlink('../source', path.join(target, 'folder'));
    await assert.rejects(
      copyEntry(source, target, 'folder/new.js'),
      /Escaping destination parent/,
    );
    await assert.rejects(lstat(path.join(source, 'new.js')), {
      code: 'ENOENT',
    });
  });
});

test('private command environment disables workspace builds and inherited module fallbacks', async () => {
  await fixture(async ({ source, target }) => {
    const moduleName = 'outside-baseline-module';
    await mkdir(path.join(source, moduleName));
    await writeFile(
      path.join(source, moduleName, 'index.js'),
      'module.exports = true;',
    );
    const env = isolatedEnvironment(
      {
        ...process.env,
        PATH: `${source}/node_modules/.bin${path.delimiter}${process.env.PATH}`,
        NODE_PATH: source,
        NODE_OPTIONS: '--trace-warnings',
        NOCOBASE_TOOL_ROOT: source,
      },
      source + path.sep,
    );
    assert.equal(env.NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD, '1');
    assert(!env.PATH.includes(source));
    assert.equal(env.NOCOBASE_TOOL_ROOT, undefined);
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `try { require(${JSON.stringify(moduleName)}); process.exitCode = 1; } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }`,
      ],
      { cwd: target, env: { ...env, NODE_PATH: source }, encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.stderr);
  });
});
