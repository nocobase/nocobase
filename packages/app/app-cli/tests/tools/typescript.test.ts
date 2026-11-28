import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveTypeScript } from '../../src/tools/scripts/utils/typescript.mjs';

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), 'nocobase-compiler-'));
  await writeFile(path.join(rootDir, 'package.json'), '{}');
  vi.stubEnv('NOCOBASE_TSC', undefined);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(rootDir, { recursive: true, force: true });
});

async function installCompiler(): Promise<string> {
  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ devDependencies: { '@nocobase/typescript7': '*' } }),
  );
  const wrapper = path.join(rootDir, 'node_modules/@nocobase/typescript7');
  const compiler = path.join(wrapper, 'node_modules/typescript7');
  const bin = path.join(compiler, 'bin', 'tsc');
  await mkdir(path.dirname(bin), { recursive: true });
  await writeFile(path.join(wrapper, 'package.json'), '{}');
  await writeFile(path.join(compiler, 'package.json'), '{}');
  await writeFile(bin, '');
  return bin;
}

describe('application compiler selection', () => {
  it('runs the native compiler installed through the application with one checker', async () => {
    const compiler = await installCompiler();

    expect(resolveTypeScript(rootDir)).toMatchObject({
      command: process.execPath,
      args: [compiler, '--checkers', '1'],
    });
  });

  it('uses the existing tsc command when no native compiler package is installed', () => {
    expect(resolveTypeScript(rootDir)).toMatchObject({
      command: 'pnpm',
      args: ['exec', 'tsc'],
    });
  });

  it('uses the existing tsc command when explicitly requested', async () => {
    await installCompiler();
    vi.stubEnv('NOCOBASE_TSC', 'tsc');

    expect(resolveTypeScript(rootDir)).toMatchObject({
      command: 'pnpm',
      args: ['exec', 'tsc'],
    });
  });
});
