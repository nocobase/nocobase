import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AGENTS,
  compareVersions,
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

async function file(name: string, mode = 0o755, content = ''): Promise<string> {
  const full = path.join(root, name);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
  await chmod(full, mode);
  return full;
}

/** An agent that prints `version` for `--version`, as Claude Code and Codex do. */
function agent(name: string, version: string): Promise<string> {
  return file(name, 0o755, `#!/bin/sh\necho "${version} (Agent)"\n`);
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

  describe('with a bundled adapter', () => {
    const BUNDLED: AgentSpec = {
      ...ADAPTER,
      launchers: [
        {
          command: 'adapter.mjs',
          args: [],
          requires: 'agent',
          bundled: { variable: 'AGENT_PATH', minVersion: '2.1.0' },
        },
        ...ADAPTER.launchers,
      ],
    };

    it('runs it with Node.js against the agent installed here', async () => {
      const adapter = await file('adapters/adapter.mjs', 0o644);
      const installed = await agent('bin/agent', '2.1.3');
      await file('bin/adapter-acp');
      await expect(
        resolveAgent(BUNDLED, { PATH: path.join(root, 'bin') }, 'linux', {
          adapters: path.join(root, 'adapters'),
          node: '/opt/node',
        }),
      ).resolves.toEqual({
        spec: BUNDLED,
        command: '/opt/node',
        args: [adapter],
        env: { AGENT_PATH: installed },
      });
    });

    it('passes over it for an agent older than it needs, saying so once', async () => {
      await file('adapters/adapter.mjs', 0o644);
      await agent('bin/agent', '2.0.9');
      const npx = await file('bin/npx');
      const log: string[] = [];
      const options = {
        adapters: path.join(root, 'adapters'),
        log: (line: string) => log.push(line),
      };
      const env = { PATH: path.join(root, 'bin') };
      for (let round = 0; round < 2; round += 1)
        await expect(
          resolveAgent(BUNDLED, env, 'linux', options),
        ).resolves.toEqual({
          spec: BUNDLED,
          command: npx,
          args: ['--yes', 'adapter@1'],
        });
      expect(log).toHaveLength(1);
      expect(log[0]).toContain('is version 2.0.9');
    });

    it('passes over it when it was not built', async () => {
      await agent('bin/agent', '2.1.3');
      const npx = await file('bin/npx');
      await expect(
        resolveAgent(BUNDLED, { PATH: path.join(root, 'bin') }, 'linux', {
          adapters: path.join(root, 'adapters'),
        }),
      ).resolves.toMatchObject({ command: npx });
    });

    it('comes after an installed adapter when the person prefers theirs, and before npx', async () => {
      await file('adapters/adapter.mjs', 0o644);
      await agent('bin/agent', '2.1.3');
      await file('bin/npx');
      const env = {
        PATH: path.join(root, 'bin'),
        NOCOBASE_ACP_ADAPTERS: 'installed',
      };
      const options = {
        adapters: path.join(root, 'adapters'),
        node: '/opt/node',
      };
      await expect(
        resolveAgent(BUNDLED, env, 'linux', options),
      ).resolves.toMatchObject({
        command: '/opt/node',
      });
      const own = await file('bin/adapter-acp');
      await expect(
        resolveAgent(BUNDLED, env, 'linux', options),
      ).resolves.toMatchObject({
        command: own,
      });
    });

    it('on Windows, passes over it for an agent that is a batch file it cannot start', async () => {
      await file('adapters/adapter.mjs', 0o644);
      // Windows paths cannot be opened here, so the PATH entry is relative and the files are named as Windows joins them.
      await file('bin\\agent.cmd', 0o644);
      await file('bin\\npx.cmd', 0o644);
      const cwd = process.cwd();
      process.chdir(root);
      try {
        await expect(
          resolveAgent(BUNDLED, { Path: 'bin' }, 'win32', {
            adapters: path.join(root, 'adapters'),
          }),
        ).resolves.toMatchObject({ command: 'bin\\npx.cmd' });
      } finally {
        process.chdir(cwd);
      }
    });
  });

  it('bundles the same adapter versions that npx fetches when the bundled ones cannot run', async () => {
    const manifest = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { devDependencies: Record<string, string> };
    for (const spec of AGENTS) {
      if (!spec.launchers.some((launcher) => launcher.bundled)) continue;
      const fetched = spec.launchers
        .find((launcher) => launcher.command === 'npx')
        ?.args.at(-1);
      expect(fetched).toBeDefined();
      const at = fetched!.lastIndexOf('@');
      expect(manifest.devDependencies[fetched!.slice(0, at)]).toBe(
        fetched!.slice(at + 1),
      );
    }
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

describe('compareVersions', () => {
  it('orders versions by their numbers', () => {
    expect(compareVersions('2.1.200', '2.1.200')).toBe(0);
    expect(compareVersions('2.1.99', '2.1.200')).toBeLessThan(0);
    expect(compareVersions('0.162.1', '0.160.1')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '0.999.999')).toBeGreaterThan(0);
  });
});
