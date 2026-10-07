import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '../..');
const platforms = [
  'darwin-arm64',
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'linuxmusl-arm64',
  'linuxmusl-x64',
  'win32-arm64',
  'win32-x64',
];

for (const [target, binary] of [
  ['linux-x64', 'linux-x64.node'],
  ['linux-arm64', 'linux-arm64.node'],
  ['linux-x64-musl', 'linuxmusl-x64.node'],
  ['linux-arm64-musl', 'linuxmusl-arm64.node'],
]) {
  test(`preserves the bundled binary for ${target}`, async (t) => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), 'nocobase-native-target-'),
    );
    t.after(() => rm(directory, { recursive: true, force: true }));
    const scripts = path.join(directory, 'scripts/utils');
    const packageDir = path.join(directory, 'dist/node_modules/bundled-driver');
    const prebuilds = path.join(packageDir, 'prebuilds');
    await mkdir(scripts, { recursive: true });
    await mkdir(prebuilds, { recursive: true });
    for (const script of ['retarget-native.mjs', 'server-deps.mjs']) {
      await copyFile(
        path.join(
          repoRoot,
          'packages/app/app-cli/src/tools/scripts/utils',
          script,
        ),
        path.join(scripts, script),
      );
    }
    // better-sqlite3 13 ships these platform filenames together, including distinct glibc and musl builds.
    await writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify({ name: 'bundled-driver', version: '1.0.0' }),
    );
    for (const platform of platforms) {
      await writeFile(path.join(prebuilds, `${platform}.node`), platform);
    }

    const result = spawnSync(
      process.execPath,
      [
        path.join(scripts, 'retarget-native.mjs'),
        '--target',
        target,
        '--node-version',
        '24',
      ],
      { encoding: 'utf8', cwd: directory },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(await readdir(prebuilds), [binary]);
  });
}

/**
 * A fixture with sqlite-vec's darwin-arm64 build installed, and a fake `npm` on PATH whose `pack` publishes only the
 * names given.
 */
async function platformSetFixture(t, published) {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), 'nocobase-native-set-'),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const scripts = path.join(directory, 'scripts/utils');
  const modules = path.join(directory, 'dist/node_modules');
  const bin = path.join(directory, 'bin');
  await mkdir(scripts, { recursive: true });
  await mkdir(path.join(modules, 'sqlite-vec'), { recursive: true });
  await mkdir(path.join(modules, 'sqlite-vec-darwin-arm64'), {
    recursive: true,
  });
  await mkdir(bin, { recursive: true });
  for (const script of ['retarget-native.mjs', 'server-deps.mjs']) {
    await copyFile(
      path.join(
        repoRoot,
        'packages/app/app-cli/src/tools/scripts/utils',
        script,
      ),
      path.join(scripts, script),
    );
  }
  await writeFile(
    path.join(modules, 'sqlite-vec/package.json'),
    JSON.stringify({
      name: 'sqlite-vec',
      version: '0.1.9',
      optionalDependencies: {
        'sqlite-vec-darwin-arm64': '0.1.9',
        'sqlite-vec-linux-x64': '0.1.9',
        'sqlite-vec-windows-x64': '0.1.9',
      },
    }),
  );
  await writeFile(
    path.join(modules, 'sqlite-vec-darwin-arm64/package.json'),
    JSON.stringify({
      name: 'sqlite-vec-darwin-arm64',
      version: '0.1.9',
      os: ['darwin'],
      cpu: ['arm64'],
    }),
  );
  await writeFile(path.join(modules, 'sqlite-vec-darwin-arm64/vec0.dylib'), '');
  const npm = path.join(bin, 'npm');
  await writeFile(
    npm,
    `#!${process.execPath}
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const name = process.argv[3];
if (!${JSON.stringify(published)}.includes(name)) {
  process.stderr.write('npm error code E404\\n');
  process.exit(1);
}
fs.mkdirSync('package');
fs.writeFileSync('package/package.json', JSON.stringify({ name }));
execFileSync('tar', ['-czf', name + '.tgz', 'package']);
fs.rmSync('package', { recursive: true });
`,
  );
  await chmod(npm, 0o755);
  return {
    modules,
    run: (target) =>
      spawnSync(
        process.execPath,
        [
          path.join(scripts, 'retarget-native.mjs'),
          '--target',
          target,
          '--node-version',
          '24',
        ],
        {
          encoding: 'utf8',
          cwd: directory,
          env: {
            ...process.env,
            PATH: `${bin}${path.delimiter}${process.env.PATH}`,
          },
        },
      ),
  };
}

test('swaps a platform package published under its platform and architecture only', async (t) => {
  const fixture = await platformSetFixture(t, ['sqlite-vec-linux-x64']);
  const result = fixture.run('linux-x64');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual((await readdir(fixture.modules)).sort(), [
    'sqlite-vec',
    'sqlite-vec-linux-x64',
  ]);
});

test('drops a platform package whose set publishes nothing for the target', async (t) => {
  const fixture = await platformSetFixture(t, ['sqlite-vec-linux-x64']);
  const result = fixture.run('linux-x64-musl');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /publishes no build for linux-x64-musl/u);
  assert.deepEqual(await readdir(fixture.modules), ['sqlite-vec']);
});
