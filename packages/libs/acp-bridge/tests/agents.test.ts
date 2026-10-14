import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AGENTS,
  findProgram,
  resolveAgent,
  variable,
  type AgentSpec,
} from '../src/agents.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'acp-agents-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function file(name: string, mode = 0o755): Promise<string> {
  const full = path.join(root, name);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, '');
  await chmod(full, mode);
  return full;
}

const ADAPTER: AgentSpec = {
  id: 'adapter',
  name: 'Adapter',
  launchers: [
    { command: 'adapter-acp', args: [] },
    { command: 'npx', args: ['--yes', 'adapter@1'], requires: 'agent' },
  ],
  signIn: 'agent login',
};

describe('findProgram', () => {
  it('finds an executable in the directories given, then on PATH', async () => {
    const first = await file('first/tool');
    await file('second/tool');
    const env = { PATH: [path.join(root, 'second')].join(path.delimiter) };
    await expect(
      findProgram('tool', [path.join(root, 'first')], env, 'linux'),
    ).resolves.toBe(first);
    await expect(findProgram('tool', [], env, 'linux')).resolves.toBe(
      path.join(root, 'second', 'tool'),
    );
  });

  it('skips a file that is not executable', async () => {
    await file('bin/tool', 0o644);
    await expect(
      findProgram('tool', [], { PATH: path.join(root, 'bin') }, 'linux'),
    ).resolves.toBeUndefined();
  });

  it('on Windows, finds a program by PATHEXT’s extensions on a PATH of any case', async () => {
    // Windows paths cannot be opened here, so the PATH entry is relative and the file is named as Windows joins it.
    await file('bin\\tool.cmd', 0o644);
    const cwd = process.cwd();
    process.chdir(root);
    try {
      const env = { Path: 'C:\\nowhere;bin' };
      await expect(findProgram('tool', [], env, 'win32')).resolves.toBe(
        'bin\\tool.cmd',
      );
      await expect(
        findProgram('tool', [], { ...env, PATHEXT: '.EXE;.COM' }, 'win32'),
      ).resolves.toBeUndefined();
    } finally {
      process.chdir(cwd);
    }
  });
});

describe('variable', () => {
  it('reads a variable by its name, of any case only on Windows', () => {
    expect(variable({ Path: 'a' }, 'PATH', 'win32')).toBe('a');
    expect(variable({ Path: 'a' }, 'PATH', 'darwin')).toBeUndefined();
    expect(variable({ PATH: 'b' }, 'PATH', 'linux')).toBe('b');
  });
});

describe('resolveAgent', () => {
  it('prefers the agent’s own ACP program', async () => {
    const own = await file('bin/adapter-acp');
    await file('bin/npx');
    await file('bin/agent');
    await expect(
      resolveAgent(ADAPTER, { PATH: path.join(root, 'bin') }, 'linux'),
    ).resolves.toEqual({ spec: ADAPTER, command: own, args: [] });
  });

  it('fetches the adapter only for people who installed the agent itself', async () => {
    const npx = await file('bin/npx');
    const env = { PATH: path.join(root, 'bin') };
    await expect(resolveAgent(ADAPTER, env, 'linux')).resolves.toBeUndefined();
    await file('bin/agent');
    await expect(resolveAgent(ADAPTER, env, 'linux')).resolves.toEqual({
      spec: ADAPTER,
      command: npx,
      args: ['--yes', 'adapter@1'],
    });
  });

  it('knows every agent by an id the application accepts, with a way to sign in', () => {
    const ids = AGENTS.map((spec) => spec.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const spec of AGENTS) {
      expect(spec.id).toMatch(/^[a-z0-9][a-z0-9-]{0,39}$/u);
      expect(spec.launchers.length).toBeGreaterThan(0);
      expect(spec.signIn).not.toBe('');
      // Full access comes from a mode the agent offers, or from the bridge allowing what it asks.
      expect(Boolean(spec.modes?.length) || spec.allowAll === true).toBe(true);
    }
  });
});
