import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  utimes,
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
import { installAdapter } from '../src/managed-adapters.js';

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

  describe('with a managed adapter', () => {
    const PACKAGE = {
      name: '@scope/adapter',
      version: '1.0.0',
      bin: 'adapter-acp',
    };
    const MANAGED: AgentSpec = {
      ...ADAPTER,
      launchers: [
        {
          command: 'adapter-acp',
          args: [],
          requires: 'agent',
          managed: {
            package: PACKAGE.name,
            version: PACKAGE.version,
            variable: 'AGENT_PATH',
            minVersion: '2.1.0',
          },
        },
        ADAPTER.launchers[0]!,
      ],
    };
    let adapters: string;
    let npmLog: string;
    let env: Record<string, string>;
    beforeEach(async () => {
      adapters = path.join(root, 'adapters');
      npmLog = path.join(root, 'npm.log');
      env = { PATH: path.join(root, 'bin'), NPM_LOG: npmLog };
      await npm();
    });

    /** npm as the bridge runs it: it installs the package it is given into `--prefix`, or fails as `NPM_FAIL` says. */
    function npm(): Promise<string> {
      return file(
        'bin/npm',
        0o755,
        [
          '#!/bin/sh',
          'echo "$@" >> "$NPM_LOG"',
          'if [ -n "$NPM_FAIL" ]; then echo "npm error $NPM_FAIL" >&2; exit 1; fi',
          'if [ -n "$NPM_WAIT_OUTPUT" ]; then echo "$NPM_WAIT_OUTPUT" >&2; fi',
          'if [ -n "$NPM_SLEEP" ]; then /bin/sleep "$NPM_SLEEP"; fi',
          'prefix=""; spec=""',
          'while [ $# -gt 0 ]; do',
          '  case "$1" in --prefix) prefix="$2"; shift ;; -*) ;; *) spec="$1" ;; esac',
          '  shift',
          'done',
          'install() {',
          '  dir="$1/node_modules/${spec%@*}"',
          '  /bin/mkdir -p "$dir/dist"',
          `  printf '{"name":"%s","version":"%s","bin":{"adapter-acp":"dist/index.js"}}' "\${spec%@*}" "\${spec##*@}" > "$dir/package.json"`,
          `  printf "import './required.js'; import 'fixture-dependency';" > "$dir/dist/index.js"`,
          '  : > "$dir/dist/required.js"',
          '  /bin/mkdir -p "$1/node_modules/fixture-dependency"',
          `  printf '{"name":"fixture-dependency","main":"index.js"}' > "$1/node_modules/fixture-dependency/package.json"`,
          '  : > "$1/node_modules/fixture-dependency/index.js"',
          '}',
          // Another bridge finishes installing the same version first.
          'if [ -n "$NPM_RACE" ]; then',
          '  install "$NPM_RACE"',
          '  /bin/cp "$NPM_RACE_INVENTORY" "$NPM_RACE/bridge-files.json"',
          '  : > "$NPM_RACE/winner"',
          'fi',
          'install "$prefix"',
          '',
        ].join('\n'),
      );
    }

    async function npmRuns(): Promise<string[]> {
      try {
        return (await readFile(npmLog, 'utf8')).trim().split('\n');
      } catch {
        return [];
      }
    }

    const entry = (): string =>
      path.join(
        adapters,
        '@scope/adapter@1.0.0',
        'node_modules/@scope/adapter/dist/index.js',
      );

    it('installs it once, without optional dependencies, and runs it with Node.js against the agent installed here', async () => {
      const installed = await agent('bin/agent', '2.1.3');
      const log: string[] = [];
      const options = {
        adapters,
        node: '/opt/node',
        waitForInstall: true,
        log: (line: string) => log.push(line),
      };
      const expected = {
        spec: MANAGED,
        command: '/opt/node',
        args: [entry()],
        env: { AGENT_PATH: installed },
        managed: true,
      };
      await expect(
        resolveAgent(MANAGED, env, 'linux', options),
      ).resolves.toEqual(expected);
      await expect(
        resolveAgent(MANAGED, env, 'linux', options),
      ).resolves.toEqual(expected);
      const runs = await npmRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0]!.split(' ')).toEqual([
        'install',
        '--prefix',
        expect.stringContaining(
          path.join(adapters, '@scope', '.adapter@1.0.0-'),
        ),
        '--omit=optional',
        '--no-audit',
        '--no-fund',
        '--no-save',
        '--ignore-scripts',
        '--cache',
        path.join(adapters, 'npm-cache'),
        '--prefer-offline',
        '--loglevel=error',
        '@scope/adapter@1.0.0',
      ]);
      expect(await readdir(path.join(adapters, '@scope'))).toEqual([
        'adapter@1.0.0',
      ]);
      expect(log[0]).toContain(
        'Installing the ACP adapter @scope/adapter@1.0.0',
      );
    });

    it('installs before resolving even without a wait option', async () => {
      await agent('bin/agent', '2.1.3');
      await file('bin/npx');
      await expect(
        resolveAgent(MANAGED, env, 'linux', { adapters }),
      ).resolves.toMatchObject({
        command: process.execPath,
        args: [entry()],
        managed: true,
      });
      expect(await npmRuns()).toHaveLength(1);
    });

    it('reports background installation while the initial connection proceeds and joins that install', async () => {
      await agent('bin/agent', '2.1.3');
      await expect(
        resolveAgent(MANAGED, env, 'linux', {
          adapters,
          waitForInstall: false,
        }),
      ).rejects.toThrow('installation is in progress');
      await expect(
        resolveAgent(MANAGED, env, 'linux', { adapters, waitForInstall: true }),
      ).resolves.toMatchObject({ args: [entry()] });
      expect(await npmRuns()).toHaveLength(1);
    });

    it('runs a non-executable entry and repairs deleted files and wrong versions on the next resolution', async () => {
      await agent('bin/agent', '2.1.3');
      const resolve = () => resolveAgent(MANAGED, env, 'linux', { adapters });
      await resolve();
      await chmod(entry(), 0o644);
      await expect(resolve()).resolves.toMatchObject({ args: [entry()] });
      await expect(
        promisify(execFile)(process.execPath, [entry()]),
      ).resolves.toMatchObject({ stderr: '' });
      expect(await npmRuns()).toHaveLength(1);
      await rm(entry());
      await expect(resolve()).resolves.toMatchObject({ args: [entry()] });
      const manifest = path.join(
        path.dirname(path.dirname(entry())),
        'package.json',
      );
      const original = JSON.parse(await readFile(manifest, 'utf8'));
      await writeFile(
        manifest,
        JSON.stringify({ ...original, version: '0.0.1' }),
      );
      await expect(resolve()).resolves.toMatchObject({ args: [entry()] });
      await rm(path.join(adapters, '@scope'), { recursive: true });
      await expect(resolve()).resolves.toMatchObject({ args: [entry()] });
      expect(await npmRuns()).toHaveLength(4);
    });

    it('installs it once for sessions waiting for it at the same time', async () => {
      await agent('bin/agent', '2.1.3');
      const options = { adapters, waitForInstall: true };
      const resolved = await Promise.all(
        [1, 2, 3].map(() => resolveAgent(MANAGED, env, 'linux', options)),
      );
      expect(resolved.map((one) => one?.args)).toEqual([
        [entry()],
        [entry()],
        [entry()],
      ]);
      expect(await npmRuns()).toHaveLength(1);
    });

    it.each([
      'node_modules/@scope/adapter/dist/required.js',
      'node_modules/fixture-dependency/index.js',
      'node_modules/fixture-dependency',
      'bridge-files.json',
    ])(
      'repairs a deleted installation file or dependency: %s',
      async (relative) => {
        await agent('bin/agent', '2.1.3');
        const resolve = () => resolveAgent(MANAGED, env, 'linux', { adapters });
        await resolve();
        const target = path.join(adapters, '@scope/adapter@1.0.0');
        await rm(path.join(target, relative), { recursive: true });
        await expect(resolve()).resolves.toMatchObject({ args: [entry()] });
        await expect(
          promisify(execFile)(process.execPath, [entry()]),
        ).resolves.toMatchObject({ stderr: '' });
        expect(await npmRuns()).toHaveLength(2);
      },
    );

    it('does not reinstall a complete adapter whose process fails for another reason', async () => {
      await agent('bin/agent', '2.1.3');
      const resolve = () => resolveAgent(MANAGED, env, 'linux', { adapters });
      await resolve();
      await writeFile(
        entry(),
        'process.stderr.write("authentication unavailable"); process.exit(1);',
      );
      await expect(
        promisify(execFile)(process.execPath, [entry()]),
      ).rejects.toMatchObject({ stderr: 'authentication unavailable' });
      await resolve();
      expect(await npmRuns()).toHaveLength(1);
    });

    it('uses the installation another bridge finished first and discards its own', async () => {
      await agent('bin/agent', '2.1.3');
      const target = path.join(adapters, '@scope', 'adapter@1.0.0');
      const raceInventory = await file(
        'race-files.json',
        0o644,
        JSON.stringify(
          [
            'node_modules/@scope/adapter/package.json',
            'node_modules/@scope/adapter/dist/index.js',
            'node_modules/@scope/adapter/dist/required.js',
            'node_modules/fixture-dependency/package.json',
            'node_modules/fixture-dependency/index.js',
          ].map((path) => ({ path, link: false })),
        ),
      );
      await expect(
        resolveAgent(
          MANAGED,
          { ...env, NPM_RACE: target, NPM_RACE_INVENTORY: raceInventory },
          'linux',
          {
            adapters,
            waitForInstall: true,
          },
        ),
      ).resolves.toMatchObject({ args: [entry()] });
      expect(await readdir(path.join(adapters, '@scope'))).toEqual([
        'adapter@1.0.0',
      ]);
      expect(await readFile(path.join(target, 'winner'), 'utf8')).toBe('');
    });

    it('removes what an unfinished install left behind', async () => {
      await agent('bin/agent', '2.1.3');
      const left = path.join(adapters, '@scope', '.adapter@1.0.0-left');
      await mkdir(left, { recursive: true });
      const old = new Date(Date.now() - 2 * 60 * 60_000);
      await utimes(left, old, old);
      await resolveAgent(MANAGED, env, 'linux', {
        adapters,
        waitForInstall: true,
      });
      expect(await readdir(path.join(adapters, '@scope'))).toEqual([
        'adapter@1.0.0',
      ]);
    });

    it('reports an installation failure with its command and stderr and retries next time', async () => {
      await agent('bin/agent', '2.1.3');
      const failing = { ...env, NPM_FAIL: '404 Not Found' };
      await expect(
        resolveAgent(MANAGED, failing, 'linux', { adapters }),
      ).rejects.toThrow(/Command: .*npm install.*\n.*npm error 404 Not Found/u);
      await expect(
        resolveAgent(MANAGED, env, 'linux', { adapters }),
      ).resolves.toMatchObject({ args: [entry()] });
      expect(await npmRuns()).toHaveLength(2);
    });

    it('reports missing npm instead of fetching with npx', async () => {
      await agent('bin/agent', '2.1.3');
      await rm(path.join(root, 'bin', 'npm'));
      await file('bin/npx');
      await expect(
        resolveAgent(MANAGED, env, 'linux', { adapters }),
      ).rejects.toThrow('npm was not found on PATH');
    });

    it('gives up on an install that takes too long', async () => {
      await expect(
        installAdapter(PACKAGE, {
          dir: adapters,
          env: {
            ...env,
            NPM_SLEEP: '5',
            NPM_WAIT_OUTPUT: 'last download error',
          },
          platform: 'linux',
          timeoutMs: 200,
        }),
      ).rejects.toThrow('npm did not finish within 0.2s\nlast download error');
      await expect(readdir(path.join(adapters, '@scope'))).resolves.toEqual([]);
      await expect(
        installAdapter(PACKAGE, {
          dir: adapters,
          env,
          platform: 'linux',
        }),
      ).resolves.toBe(entry());
      expect(await npmRuns()).toHaveLength(2);
    });

    it('reports the minimum agent version when the managed adapter cannot drive it', async () => {
      await agent('bin/agent', '2.0.9');
      await file('bin/npx');
      await expect(
        resolveAgent(MANAGED, env, 'linux', { adapters }),
      ).rejects.toThrow('needs 2.1.0 or newer');
      expect(await npmRuns()).toEqual([]);
    });

    it('is not used without a directory to install it in', async () => {
      await agent('bin/agent', '2.1.3');
      await file('bin/npx');
      await expect(
        resolveAgent(MANAGED, env, 'linux', { waitForInstall: true }),
      ).resolves.toBeUndefined();
      expect(await npmRuns()).toEqual([]);
    });

    it('always prefers an installed adapter without installing a managed copy', async () => {
      await agent('bin/agent', '2.1.3');
      await file('bin/npx');
      const preferring = env;
      const options = { adapters, node: '/opt/node', waitForInstall: true };
      const own = await file('bin/adapter-acp');
      await expect(
        resolveAgent(MANAGED, preferring, 'linux', options),
      ).resolves.toMatchObject({ command: own });
      expect(await npmRuns()).toEqual([]);
    });

    it('on Windows, passes over it for an agent that is a batch file it cannot start', async () => {
      // Windows paths cannot be opened here, so the PATH entry is relative and the files are named as Windows joins them.
      await file('bin\\agent.cmd', 0o644);
      await file('bin\\npx.cmd', 0o644);
      const cwd = process.cwd();
      process.chdir(root);
      try {
        await expect(
          resolveAgent(MANAGED, { Path: 'bin' }, 'win32', {
            adapters,
            waitForInstall: true,
          }),
        ).rejects.toThrow('cannot start the batch file');
      } finally {
        process.chdir(cwd);
      }
    });
  });

  it('never falls back to npx for Codex or Claude', () => {
    for (const id of ['codex', 'claude']) {
      const spec = AGENTS.find((candidate) => candidate.id === id)!;
      expect(spec.launchers.some((launcher) => launcher.managed)).toBe(true);
      expect(
        spec.launchers.some((launcher) => launcher.command === 'npx'),
      ).toBe(false);
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
