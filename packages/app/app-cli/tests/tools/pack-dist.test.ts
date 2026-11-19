// @vitest-environment node

import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { list, extract } from 'tar';
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

function pack(root: string, preload?: string) {
  return spawnSync(
    process.execPath,
    [...(preload ? ['--import', preload] : []), scriptPath],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, NOCOBASE_TOOL_ROOT: root },
      timeout: 20_000,
    },
  );
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

  it('excludes application runtime files while retaining dependency resources and external runtime configuration', () => {
    const root = createRoot();
    const files = {
      'config.example.yml': 'server: {}\n',
      'dist/.env': 'APP_SERVER_PORT=15150\n',
      'dist/.env.local': 'DB_PASSWORD=fixture-secret\n',
      'dist/.env.production': 'APP_SERVER_HOST=192.0.2.1\n',
      'dist/config.yml': 'secret: fixture-secret\n',
      'dist/config.yaml': 'secret: fixture-secret\n',
      'dist/storage/uploads/file.bin': 'instance data',
      'dist/node_modules/demo/config.yml': 'required package resource',
      'dist/node_modules/demo/.env.example': 'package example',
      'dist/node_modules/demo/storage/schema.json': '{}',
      'dist/variables.json': '{"variables":[]}',
      'dist/server/standalone.cjs': `const fs = require('node:fs');
const path = require('node:path');
console.log(JSON.stringify({
  port: process.env.APP_SERVER_PORT,
  config: fs.readFileSync(process.env.APP_CONFIG_PATH, 'utf8'),
  resource: fs.readFileSync(path.join(__dirname, '../node_modules/demo/config.yml'), 'utf8'),
}));`,
    };
    for (const [name, content] of Object.entries(files)) {
      const file = path.join(root, name);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    const result = pack(root);
    expect(result.status).toBe(0);
    const archive = path.join(root, 'storage/exports/dist.tar.gz');
    const entries = archiveEntries(archive);
    for (const name of [
      'dist/.env',
      'dist/.env.local',
      'dist/.env.production',
      'dist/config.yml',
      'dist/config.yaml',
      'dist/storage/uploads/file.bin',
    ]) {
      expect(entries).not.toContain(name);
      expect(readFileSync(path.join(root, name), 'utf8')).toBe(
        files[name as keyof typeof files],
      );
    }
    for (const name of [
      'dist/node_modules/demo/config.yml',
      'dist/node_modules/demo/.env.example',
      'dist/node_modules/demo/storage/schema.json',
      'dist/variables.json',
    ]) {
      expect(entries).toContain(name);
    }
    const destination = createRoot();
    extract({ file: archive, cwd: destination, sync: true, strict: true });
    const configPath = path.join(destination, 'config.yml');
    writeFileSync(configPath, 'deployment settings');
    const run = spawnSync(
      process.execPath,
      [path.join(destination, 'dist/server/standalone.cjs')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          APP_SERVER_PORT: '18080',
          APP_CONFIG_PATH: configPath,
        },
      },
    );
    expect(run.status).toBe(0);
    expect(JSON.parse(run.stdout)).toEqual({
      port: '18080',
      config: 'deployment settings',
      resource: 'required package resource',
    });
  });

  it('preserves the previous archive and cleans temporary output when packing fails after it begins', () => {
    const root = createRoot();
    mkdirSync(path.join(root, 'dist'), { recursive: true });
    writeFileSync(path.join(root, 'config.example.yml'), '');
    writeFileSync(path.join(root, 'dist/keep.js'), 'previous build');
    expect(pack(root).status).toBe(0);
    const exportsDir = path.join(root, 'storage/exports');
    const archive = path.join(exportsDir, 'dist.tar.gz');
    const previous = readFileSync(archive);
    // Inject a read failure after tar has opened its temporary output, independent of user privileges and OS ACLs.
    const preload = path.join(root, 'fail-read.mjs');
    writeFileSync(
      preload,
      `import fs from 'node:fs';
const open = fs.openSync;
fs.openSync = function(file, ...args) {
  if (String(file).endsWith('keep.js')) throw new Error('fixture read failure');
  return open.call(this, file, ...args);
};`,
    );
    const result = pack(root, preload);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('fixture read failure');
    expect(readFileSync(archive)).toEqual(previous);
    expect(archiveEntries(archive)).toContain('dist/keep.js');
    expect(readdirSync(exportsDir)).toEqual(['dist.tar.gz']);
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
