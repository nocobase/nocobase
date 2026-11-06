// @vitest-environment node

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { list } from 'tar';
import { afterEach, describe, expect, it } from 'vitest';

// Run in place rather than copied: the script imports `tar`, which resolves from this package's own node_modules.
// The application root is selected through NOCOBASE_TOOL_ROOT, exactly as `runAppTool` passes it.
const scriptPath = path.resolve(
  import.meta.dirname,
  '../../src/tools/scripts/utils/pack-dist.mjs',
);
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'nocobase-pack-dist-'));
  temporaryDirectories.push(root);
  return root;
}

function pack(root: string) {
  return spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, NOCOBASE_TOOL_ROOT: root },
    timeout: 20_000,
  });
}

function archiveEntries(archivePath: string): string[] {
  const entries: string[] = [];
  list({
    file: archivePath,
    sync: true,
    onReadEntry: (entry) => {
      entries.push(entry.path);
    },
  });
  return entries;
}

describe('deployment archive', () => {
  it('packs dist/ and config.example.yml and nothing else from the application root', () => {
    const root = createRoot();
    mkdirSync(path.join(root, 'dist', 'server'), { recursive: true });
    mkdirSync(path.join(root, 'dist', 'node_modules', 'demo'), {
      recursive: true,
    });
    writeFileSync(path.join(root, 'dist', 'server', 'standalone.js'), '');
    writeFileSync(path.join(root, 'dist', 'package.json'), '{}');
    writeFileSync(
      path.join(root, 'dist', 'node_modules', 'demo', 'index.js'),
      '',
    );
    writeFileSync(path.join(root, 'config.example.yml'), 'db: {}\n');
    // Everything below is what a deployment must never receive from the build machine.
    writeFileSync(path.join(root, 'config.yml'), 'auth:\n  secret: real\n');
    writeFileSync(path.join(root, '.env'), 'DB_PASSWORD=real\n');
    mkdirSync(path.join(root, 'storage', 'uploads'), { recursive: true });
    writeFileSync(path.join(root, 'storage', 'uploads', 'file.bin'), 'data');
    mkdirSync(path.join(root, 'server'), { recursive: true });
    writeFileSync(path.join(root, 'server', 'index.ts'), '');

    const result = pack(root);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^Packed storage\/exports\/dist\.tar\.gz \(.* MB\)\.\n$/,
    );

    const archivePath = path.join(root, 'storage', 'exports', 'dist.tar.gz');
    const entries = archiveEntries(archivePath);
    expect(entries).toContain('config.example.yml');
    expect(entries).toContain('dist/server/standalone.js');
    expect(entries).toContain('dist/node_modules/demo/index.js');
    // `dist` is a directory entry, so extracting anywhere produces `dist/` beside `config.example.yml`.
    expect(entries.some((entry) => /^dist\/?$/.test(entry))).toBe(true);
    expect(
      entries.every(
        (entry) => entry === 'config.example.yml' || entry.startsWith('dist'),
      ),
    ).toBe(true);
    expect(entries).not.toContain('config.yml');
    expect(entries).not.toContain('.env');
    expect(entries.some((entry) => entry.startsWith('storage'))).toBe(false);
  });

  it('packs the Dockerfile and its .dockerignore when the application has them', () => {
    const root = createRoot();
    mkdirSync(path.join(root, 'dist'), { recursive: true });
    writeFileSync(path.join(root, 'dist', 'package.json'), '{}');
    writeFileSync(path.join(root, 'config.example.yml'), '');
    writeFileSync(path.join(root, 'Dockerfile'), 'FROM node:24\n');
    writeFileSync(path.join(root, 'Dockerfile.dockerignore'), '**/storage\n');

    const result = pack(root);

    expect(result.status).toBe(0);
    const entries = archiveEntries(
      path.join(root, 'storage', 'exports', 'dist.tar.gz'),
    );
    expect(entries).toContain('Dockerfile');
    expect(entries).toContain('Dockerfile.dockerignore');
    expect(entries).toContain('config.example.yml');
  });

  it('leaves executable shim directories out and replaces a stale archive', () => {
    const root = createRoot();
    const bin = path.join(root, 'dist', 'node_modules', '.bin');
    const nestedBin = path.join(
      root,
      'dist',
      'node_modules',
      'nested',
      'node_modules',
      '.bin',
    );
    mkdirSync(bin, { recursive: true });
    mkdirSync(nestedBin, { recursive: true });
    writeFileSync(path.join(bin, 'tsc'), '#!/bin/sh\n');
    writeFileSync(path.join(nestedBin, 'demo'), '#!/bin/sh\n');
    writeFileSync(path.join(root, 'dist', 'keep.js'), '');
    writeFileSync(path.join(root, 'config.example.yml'), '');
    const archivePath = path.join(root, 'storage', 'exports', 'dist.tar.gz');
    mkdirSync(path.dirname(archivePath), { recursive: true });
    writeFileSync(archivePath, 'not an archive');

    const result = pack(root);

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    const entries = archiveEntries(archivePath);
    expect(entries).toContain('dist/keep.js');
    expect(entries.some((entry) => entry.includes('.bin'))).toBe(false);
  });

  it('fails before writing anything when dist is missing', () => {
    const root = createRoot();
    writeFileSync(path.join(root, 'config.example.yml'), '');

    const result = pack(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing dist. Run pnpm build first.');
    expect(() =>
      archiveEntries(path.join(root, 'storage', 'exports', 'dist.tar.gz')),
    ).toThrow();
  });

  it('names config.example.yml when only it is missing', () => {
    const root = createRoot();
    mkdirSync(path.join(root, 'dist'), { recursive: true });

    const result = pack(root);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Missing config.example.yml in the application root.',
    );
  });
});
