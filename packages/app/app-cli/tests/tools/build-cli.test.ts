// @vitest-environment node

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'nocobase-build-cli-'));
  temporaryDirectories.push(root);
  mkdirSync(path.join(root, 'scripts', 'utils'), { recursive: true });
  mkdirSync(path.join(root, 'dist', 'node_modules'), { recursive: true });
  return root;
}

function copyScript(root: string, relativePath: string) {
  copyFileSync(
    path.resolve(import.meta.dirname, '../../src/tools/scripts', relativePath),
    path.join(root, 'scripts', relativePath),
  );
}

describe('build command help', () => {
  it.each(['--help', '-h'])(
    '%s exits without dependencies, hooks, or changing dist',
    (flag) => {
      const root = createFixture();
      copyScript(root, 'build.mjs');
      const sentinel = path.join(root, 'dist', 'keep.txt');
      writeFileSync(sentinel, 'existing build');
      // Only the entry script is copied: loading build helpers or dependencies would fail.
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'scripts', 'build.mjs'), flag, '--tar'],
        { cwd: root, encoding: 'utf8', timeout: 10_000 },
      );

      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Usage: pnpm build [options]');
      for (const option of [
        '--target',
        '--node-version',
        '--tar',
        'nocobase.buildTarget',
      ]) {
        expect(result.stdout).toContain(option);
      }
      expect(readFileSync(sentinel, 'utf8')).toBe('existing build');
      expect(() =>
        readFileSync(path.join(root, 'storage', 'exports', 'dist.tar.gz')),
      ).toThrow();
    },
  );
});

describe('deployment target metadata', () => {
  function retarget(args: string[], hostShim?: string) {
    const root = createFixture();
    copyScript(root, 'utils/retarget-native.mjs');
    copyScript(root, 'utils/server-deps.mjs');
    const manifestPath = path.join(root, 'dist', 'package.json');
    writeFileSync(
      manifestPath,
      JSON.stringify({
        name: 'fixture-app',
        engines: { node: '>=24.0.0' },
        nocobase: {
          templateKind: 'fixture',
          buildTarget: { platform: 'stale' },
        },
      }),
    );
    const nodeArgs: string[] = [];
    if (hostShim) {
      const shimPath = path.join(root, 'host.mjs');
      writeFileSync(shimPath, hostShim);
      nodeArgs.push('--import', shimPath);
    }
    const result = spawnSync(
      process.execPath,
      [
        ...nodeArgs,
        path.join(root, 'scripts', 'utils', 'retarget-native.mjs'),
        ...args,
      ],
      { cwd: root, encoding: 'utf8', timeout: 10_000 },
    );
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const manifest: {
      name: string;
      engines: { node: string };
      nocobase: {
        templateKind: string;
        buildTarget: {
          platform: string;
          arch: string;
          libc: string;
          nodeMajor: number;
          nodeAbi: number;
        };
      };
    } = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.name).toBe('fixture-app');
    expect(manifest.engines.node).toBe('>=24.0.0');
    expect(manifest.nocobase.templateKind).toBe('fixture');
    return manifest.nocobase.buildTarget;
  }

  it('records an explicit target even when no native modules are installed', () => {
    expect(retarget(['--target', 'linux-x64', '--node-version', '24'])).toEqual(
      {
        platform: 'linux',
        arch: 'x64',
        libc: 'glibc',
        nodeMajor: 24,
        nodeAbi: 137,
      },
    );
  });

  it('records the requested musl target and Node ABI with equals syntax', () => {
    expect(
      retarget(['--target=linux-arm64-musl', '--node-version=26']),
    ).toEqual({
      platform: 'linux',
      arch: 'arm64',
      libc: 'musl',
      nodeMajor: 26,
      nodeAbi: 147,
    });
  });

  it('records the running platform and Node version by default', () => {
    expect(retarget([])).toMatchObject({
      platform: process.platform,
      arch: process.arch,
      nodeMajor: Number(process.versions.node.split('.')[0]),
      nodeAbi: Number(process.versions.modules),
    });
  });

  it.each([
    ['{}', 'musl'],
    ['{ glibcVersionRuntime: "2.36" }', 'glibc'],
  ])(
    'detects the current Linux libc from runtime header %s',
    (header, libc) => {
      const target = retarget(
        [],
        `Object.defineProperty(process, 'platform', { value: 'linux' });
process.report.getReport = () => ({ header: ${header} });`,
      );
      expect(target.platform).toBe('linux');
      expect(target.libc).toBe(libc);
    },
  );
});

describe('native module retargeting', () => {
  type FixturePackage = {
    name: string;
    scripts?: Record<string, string>;
    binaries?: string[];
  };

  function retargetPackages(packages: FixturePackage[], skipped: string[]) {
    const root = createFixture();
    copyScript(root, 'utils/retarget-native.mjs');
    copyScript(root, 'utils/server-deps.mjs');
    const nodeModules = path.join(root, 'dist', 'node_modules');
    for (const fixture of packages) {
      const packageDir = path.join(nodeModules, fixture.name);
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        path.join(packageDir, 'package.json'),
        JSON.stringify({
          name: fixture.name,
          version: '1.0.0',
          scripts: fixture.scripts,
        }),
      );
      for (const binary of fixture.binaries ?? []) {
        mkdirSync(path.dirname(path.join(packageDir, binary)), {
          recursive: true,
        });
        writeFileSync(path.join(packageDir, binary), 'binary');
      }
    }
    writeFileSync(
      path.join(root, 'dist', 'pnpm-workspace.yaml'),
      [
        'nodeLinker: hoisted',
        'allowBuilds:',
        '  # comment',
        ...skipped.map((name) => `  '${name}': false`),
        '  oracledb: true',
        '',
      ].join('\n'),
    );
    // Stands in for `npx prebuild-install`, recording which package it was asked to fetch for.
    const binDir = path.join(root, 'bin');
    const npxLog = path.join(root, 'npx.log');
    mkdirSync(binDir);
    writeFileSync(
      path.join(binDir, 'npx'),
      `#!/bin/sh\necho "$(basename "$PWD") $*" >> "${npxLog}"\n`,
      { mode: 0o755 },
    );
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'scripts', 'utils', 'retarget-native.mjs'),
        '--target',
        'linux-arm64',
        '--node-version',
        '24',
      ],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 10_000,
        env: {
          ...process.env,
          PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
        },
      },
    );
    const npxCalls = existsSync(npxLog)
      ? readFileSync(npxLog, 'utf8').trim().split('\n')
      : [];
    return { result, nodeModules, npxCalls };
  }

  it('leaves a package whose build allowBuilds skips and that ships no binary as installed', () => {
    const { result, nodeModules, npxCalls } = retargetPackages(
      [
        {
          name: 'cpu-features',
          scripts: {
            install: 'node buildcheck.js > buildcheck.gypi && node-gyp rebuild',
          },
        },
      ],
      ['cpu-features'],
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('cpu-features: build skipped');
    expect(npxCalls).toEqual([]);
    expect(() =>
      readFileSync(path.join(nodeModules, 'cpu-features', 'package.json')),
    ).not.toThrow();
  });

  it('still trims better-sqlite3 to the target binary when its build is skipped', () => {
    const { result, nodeModules } = retargetPackages(
      [
        {
          name: 'better-sqlite3',
          binaries: [
            'prebuilds/darwin-arm64.node',
            'prebuilds/linux-arm64.node',
            'prebuilds/linux-x64.node',
            'prebuilds/linuxmusl-arm64.node',
          ],
        },
      ],
      ['better-sqlite3'],
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const prebuilds = path.join(nodeModules, 'better-sqlite3', 'prebuilds');
    expect(() =>
      readFileSync(path.join(prebuilds, 'linux-arm64.node')),
    ).not.toThrow();
    for (const removed of [
      'darwin-arm64.node',
      'linux-x64.node',
      'linuxmusl-arm64.node',
    ]) {
      expect(() => readFileSync(path.join(prebuilds, removed))).toThrow();
    }
  });

  it('classifies a skipped package with an install script by the binaries it ships', () => {
    const { result, nodeModules, npxCalls } = retargetPackages(
      [
        {
          name: 'better-sqlite3',
          scripts: {
            install: 'prebuild-install || node-gyp rebuild --release',
          },
          binaries: [
            'prebuilds/darwin-arm64.node',
            'prebuilds/linux-arm64.node',
          ],
        },
      ],
      ['better-sqlite3'],
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(npxCalls).toEqual([]);
    const prebuilds = path.join(nodeModules, 'better-sqlite3', 'prebuilds');
    expect(() =>
      readFileSync(path.join(prebuilds, 'linux-arm64.node')),
    ).not.toThrow();
    expect(() =>
      readFileSync(path.join(prebuilds, 'darwin-arm64.node')),
    ).toThrow();
  });

  it('still fetches the target binary for a native package whose build runs', () => {
    const { result, npxCalls } = retargetPackages(
      [
        {
          name: 'native-driver',
          scripts: { install: 'prebuild-install || node-gyp rebuild' },
          binaries: ['build/Release/driver.node'],
        },
        {
          name: 'cpu-features',
          scripts: { install: 'node-gyp rebuild' },
        },
      ],
      ['cpu-features'],
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(npxCalls).toEqual([
      'native-driver --yes prebuild-install --platform linux --arch arm64 --target 24.0.0',
    ]);
  });
});
