// @vitest-environment node

import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(
  new URL('../../src/tools/scripts/dev/index.mjs', import.meta.url),
  'utf8',
);
// Exercise the hook runner without launching the long-running development servers.
const preflight = source.slice(
  source.indexOf('const runDevHook ='),
  source.indexOf('const pluginWatchIncludes ='),
);

function runPreflight(result: { status?: number | null; error?: Error }) {
  const sync = vi.fn(() => result);
  const exit = vi.fn();
  const log = vi.fn();
  const env = { APP_SERVER_PORT: '13000' };
  const hook = {
    label: 'Build plugin artifacts',
    command: ['pnpm', 'nocobase', 'demo', 'build'],
  };
  runInNewContext(preflight, {
    progress: vi.fn(),
    shuttingDown: false,
    spawn: { sync },
    console: { log },
    rootDir: '/app',
    nextEnv: env,
    process: { exit },
    readCliHooks: () => ({ dev: { beforeDev: [hook] } }),
    runHookStage: (
      hooks: Record<string, unknown[]>,
      stage: string,
      run: (label: string, command: string, args: string[]) => void,
    ) => {
      for (const entry of (hooks[stage] ?? []) as (typeof hook)[]) {
        run(entry.label, entry.command[0], entry.command.slice(1));
      }
    },
  });
  return { sync, exit, log, env };
}

/**
 * A hook produces something the application is about to read, so a failure has to stop the dev run rather than be
 * reported and stepped over. Starting anyway gives a running application that is quietly wrong — which is the state
 * these assertions exist to keep unreachable.
 */
describe('development hook preflight', () => {
  it('runs a registered hook through the application CLI', () => {
    const { sync, exit, env } = runPreflight({ status: 0 });
    expect(sync).toHaveBeenCalledWith('pnpm', ['nocobase', 'demo', 'build'], {
      cwd: '/app',
      env,
      stdio: 'inherit',
    });
    expect(exit).not.toHaveBeenCalled();
  });

  it('names the step it is running', () => {
    expect(runPreflight({ status: 0 }).log).toHaveBeenCalledWith(
      '\n> Build plugin artifacts',
    );
  });

  it('preserves a failed hook exit status', () => {
    expect(runPreflight({ status: 2 }).exit).toHaveBeenCalledWith(2);
  });

  it('treats a terminated hook as a failure', () => {
    expect(runPreflight({ status: null }).exit).toHaveBeenCalledWith(1);
  });

  it('propagates command launch errors', () => {
    const error = new Error('command could not start');
    expect(() => runPreflight({ error })).toThrow(error);
  });
});
