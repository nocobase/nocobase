// The Node a universal version (a tarball without bin/node) runs on: what an update leaves in `<prefix>/node`, so that a
// runner's user service, whose PATH usually has no `node`, keeps starting after it moves from a version that bundles
// Node to one that does not.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { applyUpdate, pinNode, pruneVersions } from '../src/install.ts';
import { removeDir, tempDir } from './helpers.ts';

const scratch = tempDir('app-cli-client-node-');
afterAll(() => removeDir(scratch));

/** A tarball of `acme` `version`, with a bundled `bin/node` when `bundled`. */
function tarball(version: string, bundled: boolean): Uint8Array {
  const staging = path.join(scratch, `staging-${version}`);
  mkdirSync(path.join(staging, 'acme', 'bin'), { recursive: true });
  writeFileSync(path.join(staging, 'acme', 'bin', 'acme'), '#!/bin/sh\n');
  chmodSync(path.join(staging, 'acme', 'bin', 'acme'), 0o755);
  if (bundled) {
    writeFileSync(path.join(staging, 'acme', 'bin', 'node'), 'node\n');
    chmodSync(path.join(staging, 'acme', 'bin', 'node'), 0o755);
  }
  const file = path.join(staging, 'out.tar.gz');
  execFileSync('tar', ['-czf', file, '-C', staging, 'acme']);
  return new Uint8Array(readFileSync(file));
}

/** An installation of `version`, which bundles Node, as the install script leaves it. */
function installed(name: string, version: string): string {
  const prefix = path.join(scratch, name);
  const bin = path.join(prefix, 'versions', version, 'bin');
  mkdirSync(bin, { recursive: true });
  writeFileSync(path.join(bin, 'acme'), '#!/bin/sh\n');
  writeFileSync(path.join(bin, 'node'), `node of ${version}\n`);
  chmodSync(path.join(bin, 'node'), 0o755);
  symlinkSync(path.join('versions', version), path.join(prefix, 'current'));
  return prefix;
}

async function update(
  prefix: string,
  version: string,
  bundled: boolean,
): Promise<string[]> {
  const bytes = tarball(version, bundled);
  const lines: string[] = [];
  await applyUpdate({
    installation: { prefix, current: path.join(prefix, 'current') },
    bin: 'acme',
    client: { download: async () => bytes },
    update: {
      version,
      url: `/files/${version}`,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    log: (line) => lines.push(line),
  });
  return lines;
}

describe("a universal version's Node", () => {
  it('is the Node the update ran on, linked when it is the machine’s own', async () => {
    const prefix = installed('linked', '1.0.0');
    const lines = await update(prefix, '2.0.0', false);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/2.0.0');
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
    expect(lines.join('\n')).toContain(
      `runs on ${path.join(prefix, 'node')} (linked from ${process.execPath})`,
    );
    // A Node already there is kept: the install script linked the one it checked.
    await expect(pinNode({ prefix }, '/elsewhere/node')).resolves.toBe('kept');
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
  });

  it('is copied when it is the one a version bundles, so removing that version leaves it', async () => {
    const prefix = installed('copied', '1.0.0');
    const bundled = path.join(prefix, 'versions', '1.0.0', 'bin', 'node');
    await expect(pinNode({ prefix }, bundled)).resolves.toBe('copied');
    await pruneVersions({ prefix }, ['2.0.0']);
    expect(existsSync(bundled)).toBe(false);
    const pinned = path.join(prefix, 'node');
    expect(lstatSync(pinned).isSymbolicLink()).toBe(false);
    expect(readFileSync(pinned, 'utf8')).toBe('node of 1.0.0\n');
    expect(lstatSync(pinned).mode & 0o111).not.toBe(0);
  });

  it('is replaced when the link points at a Node that is gone', async () => {
    const prefix = installed('stale', '1.0.0');
    symlinkSync('/nowhere/node', path.join(prefix, 'node'));
    await expect(pinNode({ prefix })).resolves.toBe('linked');
    expect(readlinkSync(path.join(prefix, 'node'))).toBe(process.execPath);
  });

  it('is not set up by an update to a version that bundles its Node', async () => {
    const prefix = installed('bundled', '1.0.0');
    await update(prefix, '2.0.0', true);
    expect(readlinkSync(path.join(prefix, 'current'))).toBe('versions/2.0.0');
    expect(existsSync(path.join(prefix, 'node'))).toBe(false);
  });
});
