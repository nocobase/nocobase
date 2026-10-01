// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { c as createArchive } from 'tar';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildArguments,
  describeTarget,
  readArchiveTarget,
  runBuild,
  sameTarget,
} from '../src/build.ts';
import type { BuildTarget } from '../src/hub-client.ts';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'hub-build-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const linux: BuildTarget = {
  platform: 'linux',
  arch: 'x64',
  libc: 'glibc',
  nodeAbi: 137,
  nodeMajor: 24,
};

describe('building for the Hub', () => {
  it.each([
    [linux, 'linux-x64'],
    [{ ...linux, libc: 'musl' as const, arch: 'arm64' }, 'linux-arm64-musl'],
    [{ ...linux, platform: 'darwin', libc: null }, 'darwin-x64'],
  ])('passes nocobase build the target and Node major', (target, name) => {
    expect(buildArguments(target)).toEqual([
      '--target',
      name,
      '--node-version',
      '24',
      '--tar',
    ]);
    expect(describeTarget(target)).toBe(`${name} Node 24`);
  });

  it('refuses a platform nocobase build cannot target', () => {
    expect(() => buildArguments({ ...linux, platform: 'freebsd' })).toThrow(
      expect.objectContaining({ code: 'BUILD_TARGET_UNSUPPORTED' }),
    );
  });

  it('compares the C library on Linux only, reading a missing one as glibc', () => {
    expect(sameTarget({ ...linux, libc: null }, linux)).toBe(true);
    expect(sameTarget({ ...linux, libc: 'musl' }, linux)).toBe(false);
    expect(sameTarget({ ...linux, nodeMajor: 22 }, linux)).toBe(false);
    expect(sameTarget({ ...linux, arch: 'arm64' }, linux)).toBe(false);
    const mac = { ...linux, platform: 'darwin', libc: null };
    expect(sameTarget({ ...mac, libc: 'musl' }, mac)).toBe(true);
  });

  it('fails with the exit code when the build fails, and succeeds quietly otherwise', async () => {
    await expect(
      runBuild(
        { command: process.execPath, args: ['-e', 'process.exit(0)'] },
        root,
      ),
    ).resolves.toBeUndefined();
    await expect(
      runBuild(
        { command: process.execPath, args: ['-e', 'process.exit(7)'] },
        root,
      ),
    ).rejects.toMatchObject({
      code: 'BUILD_FAILED',
      exitCode: 1,
      message: expect.stringContaining('exit code 7'),
    });
    await expect(
      runBuild({ command: path.join(root, 'missing'), args: [] }, root),
    ).rejects.toMatchObject({ code: 'BUILD_FAILED' });
  });
});

describe("an archive's recorded target", () => {
  async function archive(
    manifest: object | string | undefined,
  ): Promise<string> {
    const dist = path.join(root, 'dist');
    await mkdir(path.join(dist, 'server'), { recursive: true });
    await writeFile(path.join(dist, 'server', 'index.js'), 'export {};');
    if (manifest !== undefined)
      await writeFile(
        path.join(dist, 'package.json'),
        typeof manifest === 'string' ? manifest : JSON.stringify(manifest),
      );
    const file = path.join(root, 'dist.tar.gz');
    await createArchive({ gzip: true, file, cwd: root }, ['dist']);
    return file;
  }

  it('is read from dist/package.json', async () => {
    const file = await archive({ nocobase: { buildTarget: linux } });
    expect(await readArchiveTarget(file)).toEqual(linux);
  });

  it.each([undefined, '{}', 'not json', { nocobase: { buildTarget: 'x' } }])(
    'is undefined when the archive records none (%j)',
    async (manifest) => {
      expect(await readArchiveTarget(await archive(manifest))).toBeUndefined();
    },
  );

  it('is undefined for a file that is not an archive', async () => {
    const file = path.join(root, 'plain.tar.gz');
    await writeFile(file, 'not an archive');
    expect(await readArchiveTarget(file)).toBeUndefined();
  });
});
