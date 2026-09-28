import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  EXIT_INVALID,
  InstallerError,
  type CommandLine,
  type Suggestion,
} from './errors.ts';
import { checkHealth, pm2StartFailed, waitForHealthy } from './health.ts';
import { interruptError, takeInterrupt } from './interrupt.ts';
import type { Layout } from './layout.ts';
import type { Pm2 } from './pm2.ts';
import type { FetchLike } from './registry.ts';
import { tail } from './run-command.ts';

export interface ServiceOptions {
  layout: Layout;
  pm2: Pm2;
  name: string;
  healthUrl: string;
  fetchImpl?: FetchLike;
}

function sameDirectory(a: string, b: string): boolean {
  const real = (dir: string) => {
    try {
      return realpathSync(dir);
    } catch {
      return path.resolve(dir);
    }
  };
  return real(a) === real(b);
}

/**
 * The pm2 process under the installation's name must be this installation's. Otherwise stopping it would stop another
 * application, and `pm2 start` on the taken name would restart that process with this one's configuration.
 */
export async function checkPm2Ownership(
  options: ServiceOptions,
): Promise<void> {
  const known = await options.pm2.describe(options.name);
  if (known?.cwd && !sameDirectory(known.cwd, options.layout.root)) {
    throw new InstallerError(
      'PM2_NAME_IN_USE',
      `The pm2 process ${options.name} runs from ${known.cwd}, not from ${options.layout.root}.`,
      {
        exitCode: EXIT_INVALID,
        suggestions: [
          {
            message: `Stop that process or rename it; installer.json names ${options.name} for this installation.`,
          },
        ],
      },
    );
  }
}

/**
 * Stops the application and waits until its health route stops answering. pm2 sends SIGINT and allows `kill_timeout`
 * for it to finish what it is doing. An application pm2 does not know, such as one installed with `--no-start`, is
 * simply not running.
 */
export async function stopApp(options: ServiceOptions): Promise<void> {
  const known = await options.pm2.describe(options.name);
  if (known) await options.pm2.stop(options.name);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (takeInterrupt()) throw interruptError();
    if (!(await checkHealth(options.healthUrl, options.fetchImpl))) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(
    `${options.healthUrl} still answers after stopping ${options.name}; another process may be serving the application's port.`,
  );
}

/**
 * Starts whatever `current` points at and waits for it to be healthy. The process entry is deleted and registered again
 * rather than restarted, so pm2's restart count starts from zero — the crash detection reads it — and a changed
 * `ecosystem.config.cjs` is read again. A process pm2 reports as crashed ends the wait early.
 */
export async function startApp(
  options: ServiceOptions & { timeoutMs: number },
): Promise<boolean> {
  await options.pm2.remove(options.name);
  await options.pm2.start(options.layout.ecosystemFile, options.layout.root);
  const healthy = await waitForHealthy(options.healthUrl, {
    timeoutMs: options.timeoutMs,
    fetchImpl: options.fetchImpl,
    failed: pm2StartFailed(options.pm2, options.name),
  });
  if (healthy) {
    await options.pm2.save();
  } else {
    // A release that cannot start would otherwise be restarted by pm2 until it gives up.
    await options.pm2.remove(options.name).catch(() => undefined);
  }
  return healthy;
}

export async function errorLogTail(layout: Layout): Promise<string> {
  const text = await readFile(layout.errorLog, 'utf8').catch(() => '');
  return tail(text, 30);
}

/** The command that shows more of the error log than `details.log` carries. */
export function errorLogCommandLine(layout: Layout): CommandLine {
  return { command: 'tail', args: ['-n', '100', layout.errorLog] };
}

/**
 * How to start the installation by hand once the cause is fixed. Two steps, since a suggestion runs one command: pm2
 * starts it, then saves the process list so that `pm2 startup` brings it back after a reboot.
 */
export function startAdvice(layout: Layout, message: string): Suggestion[] {
  return [
    {
      message,
      run: { command: 'pm2', args: ['start', layout.ecosystemFile] },
    },
    {
      message: 'Then save the process list, so pm2 restores it after a reboot:',
      run: { command: 'pm2', args: ['save'] },
    },
  ];
}
