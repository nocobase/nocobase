// @vitest-environment node

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

interface Hook {
  label: string;
  command: string[];
}
type HookStages = Record<string, Hook[]>;
type StepRunner = (label: string, command: string, args: string[]) => void;
interface CliHooksModule {
  CLI_HOOKS_ENV: string;
  readCliHooks: (env?: NodeJS.ProcessEnv) => {
    build: HookStages;
    dev: HookStages;
  };
  runHookStage: (hooks: HookStages, stage: string, run: StepRunner) => void;
}

const { CLI_HOOKS_ENV, readCliHooks, runHookStage } = (await import(
  new URL('../../src/tools/scripts/utils/cli-hooks.mjs', import.meta.url).href
)) as CliHooksModule;

describe('plugin CLI hook reading', () => {
  it('reads the hooks the command handed over and fills in every stage', () => {
    const hooks = readCliHooks({
      [CLI_HOOKS_ENV]: JSON.stringify({
        build: {
          afterServerBuild: [
            { label: 'Compile workflows', command: ['pnpm', 'wf', 'build'] },
          ],
        },
      }),
    });

    expect(hooks).toEqual({
      build: {
        beforeBuild: [],
        afterClientBuild: [],
        afterServerBuild: [
          { label: 'Compile workflows', command: ['pnpm', 'wf', 'build'] },
        ],
        afterBuild: [],
      },
      dev: { beforeDev: [] },
    });
  });

  it('fails rather than skipping hooks when the script was not started by the CLI', () => {
    expect(() => readCliHooks({})).toThrow(
      `${CLI_HOOKS_ENV} is not set. Run this through \`nocobase build\` or \`nocobase dev\``,
    );
  });

  it('fails when the handed-over hooks are not JSON', () => {
    expect(() => readCliHooks({ [CLI_HOOKS_ENV]: 'not json' })).toThrow(
      `${CLI_HOOKS_ENV} does not hold JSON.`,
    );
  });

  it('runs one stage in declaration order through the caller step runner', () => {
    const run = vi.fn<StepRunner>();
    const hooks: HookStages = {
      afterBuild: [
        { label: 'First', command: ['pnpm', 'one', '--flag'] },
        { label: 'Second', command: ['node', 'two.mjs'] },
      ],
    };

    runHookStage(hooks, 'afterBuild', run);
    runHookStage(hooks, 'beforeBuild', run);

    expect(run.mock.calls).toEqual([
      ['First', 'pnpm', ['one', '--flag']],
      ['Second', 'node', ['two.mjs']],
    ]);
  });
});

/**
 * The real build pipeline, with `pnpm` and `node` replaced on PATH by shims that record what was asked of them.
 *
 * The build itself is spawned by absolute path, so only the steps it delegates go through the shims. That makes the
 * whole step sequence observable — including where each hook stage sits relative to the steps around it — without
 * compiling anything.
 */
function withoutVariable(
  env: NodeJS.ProcessEnv,
  name: string,
): NodeJS.ProcessEnv {
  const copy = { ...env };
  delete copy[name];
  return copy;
}

describe('build pipeline hook stages', () => {
  const buildScript = path.resolve(
    import.meta.dirname,
    '../../src/tools/scripts/build.mjs',
  );
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  const hookStages = {
    build: {
      beforeBuild: [
        { label: 'Before build hook', command: ['pnpm', 'demo', 'before'] },
      ],
      afterClientBuild: [
        {
          label: 'After client hook',
          command: ['pnpm', 'demo', 'after-client'],
        },
      ],
      afterServerBuild: [
        {
          label: 'After server hook',
          command: ['node', 'after-server.mjs'],
        },
      ],
      afterBuild: [
        { label: 'After build hook', command: ['pnpm', 'demo', 'after-build'] },
      ],
    },
  };

  function runBuild(
    args: string[],
    options: {
      withoutHooks?: boolean;
      failOn?: string;
      failStatus?: number;
      env?: NodeJS.ProcessEnv;
    } = {},
  ) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'nocobase-build-hooks-'));
    temporaryDirectories.push(root);
    const shimDir = path.join(root, 'shims');
    const log = path.join(root, 'commands.log');
    mkdirSync(shimDir, { recursive: true });
    writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify({ name: 'fixture-app' }),
    );
    mkdirSync(path.join(root, 'dist'), { recursive: true });
    const sentinel = path.join(root, 'dist', 'stale.txt');
    writeFileSync(sentinel, 'previous build');

    const pnpmShim = [
      '#!/bin/sh',
      // A real `pnpm exec tsc` is what first recreates dist after the build clears it; the install step then runs
      // inside it, so a shim that never creates it fails that step on a missing working directory.
      'mkdir -p "$NOCOBASE_TOOL_ROOT/dist"',
      'printf "pnpm %s\\n" "$*" >> "$HOOK_LOG"',
      'if [ -n "$FAIL_ON" ] && [ "$*" = "$FAIL_ON" ]; then exit "${FAIL_STATUS:-1}"; fi',
      'exit 0',
      '',
    ].join('\n');
    // Steps hand `node` an absolute path into this package; only the script name is recorded. The server package step
    // writes the manifest the build then adds its deployment metadata to.
    const nodeShim = [
      '#!/bin/sh',
      'if [ "$(basename "$1")" = build-server-dist-package.mjs ]; then printf \'{"name":"fixture-app","nocobase":{"templateKind":"default"}}\' > "$NOCOBASE_TOOL_ROOT/dist/package.json"; fi',
      'printf "node %s" "$(basename "$1")" >> "$HOOK_LOG"',
      'shift',
      'if [ $# -gt 0 ]; then printf " %s" "$*" >> "$HOOK_LOG"; fi',
      'printf "\\n" >> "$HOOK_LOG"',
      'exit 0',
      '',
    ].join('\n');
    for (const [name, content] of [
      ['pnpm', pnpmShim],
      ['node', nodeShim],
    ] as const) {
      const shimPath = path.join(shimDir, name);
      writeFileSync(shimPath, content);
      chmodSync(shimPath, 0o755);
    }

    const result = spawnSync(process.execPath, [buildScript, ...args], {
      cwd: root,
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        ...withoutVariable(process.env, CLI_HOOKS_ENV),
        PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}`,
        NOCOBASE_TOOL_ROOT: root,
        NOCOBASE_SKIP_WORKSPACE_DEPENDENCY_BUILD: '0',
        HOOK_LOG: log,
        ...(options.withoutHooks
          ? {}
          : { [CLI_HOOKS_ENV]: JSON.stringify(hookStages) }),
        FAIL_ON: options.failOn ?? '',
        FAIL_STATUS: String(options.failStatus ?? 1),
        ...options.env,
      },
    });
    const commands = existsSync(log)
      ? readFileSync(log, 'utf8').trimEnd().split('\n')
      : [];
    const readDistPackage = (): {
      nocobase?: Record<string, unknown>;
    } =>
      JSON.parse(
        readFileSync(path.join(root, 'dist', 'package.json'), 'utf8'),
      ) as { nocobase?: Record<string, unknown> };
    return { result, commands, sentinel, readDistPackage };
  }

  it.skipIf(process.platform === 'win32')(
    'runs each hook stage at its place in the pipeline and packs last with --tar',
    () => {
      const { result, commands, sentinel } = runBuild(['--tar']);

      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      expect(commands).toEqual([
        'pnpm demo before',
        'pnpm exec tsc',
        'pnpm exec tsc -p tsconfig.node.json',
        'pnpm exec refine build',
        'pnpm demo after-client',
        'pnpm --filter fixture-app^... build',
        'pnpm exec tsc -p tsconfig.server.json',
        'pnpm exec tsc-alias -p tsconfig.server.json',
        'node copy-ai-skills.mjs',
        'node after-server.mjs',
        'pnpm exec nocobase config variables --out dist/variables.json',
        'node build-server-dist-package.mjs',
        'pnpm install --prod --no-lockfile',
        'node clean-dist-bin.mjs',
        'node retarget-native.mjs --tar',
        'node prune-dist-artifacts.mjs',
        'node verify-server-deps.mjs',
        'pnpm demo after-build',
        'node pack-dist.mjs',
      ]);
      for (const label of [
        'Before build hook',
        'After client hook',
        'After server hook',
        'After build hook',
        'Pack deployment archive',
      ]) {
        expect(result.stdout).toContain(`\n> ${label}`);
      }
      expect(result.stdout).toContain('Build complete');
      // Cleared after the hooks were read and before the first hook ran, so a hook may write into it.
      expect(existsSync(sentinel)).toBe(false);
      // The entry a deployment runs its commands through, which the application no longer writes itself.
      expect(
        readFileSync(
          path.join(path.dirname(sentinel), 'cli', 'index.js'),
          'utf8',
        ),
      ).toContain(
        "await runAppCli({ root: path.resolve(import.meta.dirname, '..') });",
      );
    },
  );

  it.skipIf(process.platform === 'win32')(
    'skips the archive without --tar and forwards target flags to the retarget step',
    () => {
      const { result, commands } = runBuild([
        '--target',
        'linux-x64',
        '--node-version',
        '24',
      ]);

      expect(result.status).toBe(0);
      expect(commands).toContain(
        'node retarget-native.mjs --target linux-x64 --node-version 24',
      );
      expect(commands.at(-1)).toBe('pnpm demo after-build');
      expect(commands).not.toContain('node pack-dist.mjs');
    },
  );

  it.skipIf(process.platform === 'win32')(
    'records a relocatable client and the build time beside what the manifest already holds',
    () => {
      const before = Date.now();
      const { result, readDistPackage } = runBuild([], {
        env: { APP_BASE_PATH: '/crm/' },
      });

      expect(result.status).toBe(0);
      const recorded = readDistPackage().nocobase ?? {};
      expect(recorded).toMatchObject({
        templateKind: 'default',
        relocatable: true,
      });
      // The mount path is the deployment's to choose, whatever the build machine had set.
      expect(recorded).not.toHaveProperty('basePath');
      expect(Date.parse(String(recorded.builtAt))).toBeGreaterThanOrEqual(
        before - 1000,
      );
    },
  );

  it.skipIf(process.platform === 'win32')(
    'stops before clearing dist when it was not started through the CLI',
    () => {
      const { result, commands, sentinel } = runBuild([], {
        withoutHooks: true,
      });

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`${CLI_HOOKS_ENV} is not set.`);
      expect(commands).toEqual([]);
      expect(readFileSync(sentinel, 'utf8')).toBe('previous build');
    },
  );

  it.skipIf(process.platform === 'win32')(
    'exits with a failed hook status and runs nothing after it',
    () => {
      const { result, commands } = runBuild([], {
        failOn: 'demo after-client',
        failStatus: 4,
      });

      expect(result.status).toBe(4);
      expect(commands.at(-1)).toBe('pnpm demo after-client');
      expect(commands).not.toContain('pnpm exec tsc -p tsconfig.server.json');
    },
  );
});
