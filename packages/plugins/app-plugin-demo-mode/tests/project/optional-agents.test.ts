import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('loads the integration without Agents installed and does not hide a broken installed package', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'demo-without-agents-'));
  try {
    const source = await readFile(
      new URL('../../server/integrations/agents.ts', import.meta.url),
      'utf8',
    );
    await writeFile(
      path.join(directory, 'agents.mjs'),
      stripTypeScriptTypes(source),
    );
    await writeFile(
      path.join(directory, 'check.mjs'),
      `
      import { resolveDemoAgents } from './agents.mjs';
      import assert from 'node:assert/strict';
      assert.equal(await resolveDemoAgents({ has: () => false }), undefined);
    `,
    );
    const run = () =>
      promisify(execFile)(process.execPath, ['check.mjs'], {
        cwd: directory,
        env: { ...process.env, NODE_PATH: '' },
      });
    await expect(run()).resolves.toMatchObject({ stdout: '' });
    const optional = path.join(
      directory,
      'node_modules/@nocobase/app-plugin-agents',
    );
    await mkdir(optional, { recursive: true });
    await writeFile(
      path.join(optional, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-plugin-agents',
        type: 'module',
        exports: {
          './package.json': './package.json',
          './server/tokens': './tokens.js',
        },
      }),
    );
    await writeFile(
      path.join(optional, 'tokens.js'),
      'throw new Error("broken installed Agents integration");',
    );
    await expect(run()).rejects.toThrow('broken installed Agents integration');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
