// The service owns this process; the daemon owns its workers. Keep retries in memory and pipe all daemon output
// through one bounded log writer, so rotation never leaves a service writing to an old inode.
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

import { ensureHome, type RunnerPaths } from '../lib/home.ts';
import { claimLauncher } from './launcher.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { RESTART_EXIT_CODE } from './update.ts';
import { SERVICE_ENV } from './service.ts';

import { RunnerJournal } from '../lib/journal.ts';
export { RunnerJournal } from '../lib/journal.ts';

export interface ServiceRunnerOptions {
  command: string[];
  paths?: RunnerPaths;
  log: RunnerJournal;
  env?: NodeJS.ProcessEnv;
  /** Injectable time and retry waits for deterministic policy tests. */
  now?: () => number;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
}

export async function runService(
  options: ServiceRunnerOptions,
): Promise<number> {
  const { log } = options;
  const now = options.now ?? Date.now;
  const wait =
    options.wait ?? ((ms, signal) => sleep(ms, undefined, { signal }));
  const stopping = new AbortController();
  let child: ChildProcess | undefined;
  const stop = (): void => {
    stopping.abort();
    child?.kill('SIGTERM');
  };
  // The stop command asks the launcher to force its child; abort retries before killing that child.
  const forceStop = (): void => {
    stopping.abort();
    child?.kill('SIGKILL');
  };
  process.on('SIGUSR2', forceStop);
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  options.signal?.addEventListener('abort', stop);
  if (options.signal?.aborted) stop();
  const message = (text: string): void =>
    log.write(`${new Date().toISOString()} ${text}\n`);
  let failures = 0;
  let release: (() => void) | undefined;
  try {
    if (options.paths !== undefined) {
      await ensureHome(options.paths);
      release = await claimLauncher(options.paths);
    }
    while (!stopping.signal.aborted) {
      const started = now();
      const code = await new Promise<number>((resolve) => {
        const [command = '', ...args] = options.command;
        child = spawn(command, args, {
          env: {
            ...(options.env ?? process.env),
            NOCOBASE_RUNNER_LOG_PIPE: '1',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout?.on('data', (chunk: Buffer) => log.write(chunk));
        child.stderr?.on('data', (chunk: Buffer) => log.writeError(chunk));
        let spawnFailed = false;
        child.on('error', (error) => {
          spawnFailed = true;
          message(`Cannot start runner: ${error.message}`);
        });
        child.on('close', (exit, signal) => {
          log.flush();
          child = undefined;
          if (signal !== null) message(`Runner ended with signal ${signal}.`);
          resolve(
            spawnFailed ? EXIT_CODES.general : (exit ?? EXIT_CODES.general),
          );
        });
      });
      if (stopping.signal.aborted) return 0;
      // The manager retries every exit in service mode, including auth failures and clean SIGTERM exits.
      if ((options.env ?? process.env)[SERVICE_ENV] === '1') return code;
      if (code === 0 || code === EXIT_CODES.auth || code === RESTART_EXIT_CODE)
        return code;
      if (now() - started >= 60_000) failures = 0;
      else failures += 1;
      if (failures >= 5) {
        message(
          'Runner stopped after five rapid failures. Fix the startup error, then restart the service or run nocobase-runner start.',
        );
        return 0;
      }
      const ms = 10_000 * 2 ** Math.max(0, failures - 1);
      message(`Runner failed (${code}); retrying in ${ms / 1000} seconds.`);
      try {
        await wait(ms, stopping.signal);
      } catch (error) {
        if (!stopping.signal.aborted) throw error;
      }
    }
    return 0;
  } finally {
    release?.();
    process.off('SIGUSR2', forceStop);
    process.off('SIGTERM', stop);
    process.off('SIGINT', stop);
    options.signal?.removeEventListener('abort', stop);
  }
}
