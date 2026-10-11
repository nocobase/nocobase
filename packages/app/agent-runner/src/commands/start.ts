import { Flags, type Interfaces } from '@oclif/core';
import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';

import { loadAdapters } from '../agent/adapters/registry.ts';
import { RunnerCommand, UsageError } from '../lib/command.ts';
import { readConnections, readSettings } from '../lib/config.ts';
import { ensureHome } from '../lib/home.ts';
import { detectInstallation } from '../lib/install.ts';
import { delay } from '../lib/http.ts';
import { selfCommand } from '../lib/self.ts';
import { passEnvFlag, rememberPassEnv } from '../lib/pass-env.ts';
import { parseSlotsFlag } from '../lib/slots.ts';
import { runnerCommandLine } from '../host.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { readDaemonPid, RunnerDaemon } from '../core/loop.ts';
import { killLeftovers } from '../core/process-tree.ts';
import { SERVICE_ENV } from '../core/service.ts';
import type { Timings } from '../core/supervisor.ts';

/** `NOCOBASE_RUNNER_TIMINGS`, a JSON object of `Timings`, tunes the intervals; tests use it to run fast. */
function timingsFromEnv(): Timings {
  const raw = process.env.NOCOBASE_RUNNER_TIMINGS;
  if (raw === undefined || raw === '') return {};
  return JSON.parse(raw) as Timings;
}

export default class Start extends RunnerCommand {
  static override summary: string = 'Start the runner daemon.';
  static override description: string =
    'Without --foreground the daemon starts in the background, writing to ~/.nocobase-runner/logs/runner.log; ' +
    `\`${runnerCommandLine('stop')}\` stops it. One daemon serves every application this runner is registered with.`;
  static override flags: {
    foreground: Interfaces.BooleanFlag<boolean>;
    slots: Interfaces.OptionFlag<string | undefined>;
    'pass-env': Interfaces.OptionFlag<string[] | undefined>;
  } = {
    foreground: Flags.boolean({
      description: 'Run in this terminal until interrupted.',
    }),
    slots: Flags.string({
      description:
        'How many runs at once, for this start: a total (3), limits per coding tool (claude=2,codex=1), or both. Defaults to the registered ones.',
    }),
    'pass-env': passEnvFlag,
  };

  /**
   * Ends the foreground daemon's process: whatever is still running below it is stopped first, so nothing it started
   * outlives it, and the process exits even when a handle would keep it alive, so a service sees it stop and starts it
   * again when it should.
   */
  private async exitProcess(
    code: number,
    log: (message: string) => void,
  ): Promise<never> {
    const left = await killLeftovers(process.pid, { graceMs: 3_000 });
    if (left.processes > 0 || left.groups > 0)
      log(
        `stopped ${left.processes} process(es) and ${left.groups} process group(s) left behind`,
      );
    log(`runner exiting (${code})`);
    process.exit(code);
  }

  async run(): Promise<{ pid: number }> {
    const { flags } = await this.parse(Start);
    const slotsFlag =
      flags.slots === undefined ? {} : parseSlotsFlag(flags.slots);
    const paths = this.paths;
    const connections = await readConnections(paths);
    if (connections.length === 0) {
      throw new UsageError(
        `This runner is not registered. Run \`${runnerCommandLine('register')}\` first.`,
        EXIT_CODES.auth,
      );
    }
    let settings = await readSettings(paths);
    settings = await rememberPassEnv(settings, flags['pass-env'], paths);
    const running = await readDaemonPid(paths);
    if (running !== undefined) {
      throw new UsageError(
        `The runner is already running (pid ${running.pid}).`,
        EXIT_CODES.conflict,
      );
    }

    if (!flags.foreground) {
      await ensureHome(paths);
      mkdirSync(path.dirname(paths.daemonLog), {
        recursive: true,
        mode: 0o700,
      });
      const fd = openSync(paths.daemonLog, 'a', 0o600);
      const [command = process.execPath, ...args] = selfCommand();
      const child = spawn(
        command,
        [
          ...args,
          'start',
          '--foreground',
          ...(flags.slots === undefined ? [] : ['--slots', flags.slots]),
        ],
        { detached: true, stdio: ['ignore', fd, fd], env: process.env },
      );
      closeSync(fd);
      child.unref();
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        const started = await readDaemonPid(paths);
        if (started !== undefined) {
          this.log(
            `Runner ${settings.name} started (pid ${started.pid}). Logs: ${paths.daemonLog}`,
          );
          return { pid: started.pid };
        }
        if (child.exitCode !== null) break;
        await delay(100);
      }
      throw new UsageError(
        `The runner did not start; see ${paths.daemonLog}.`,
        EXIT_CODES.general,
      );
    }

    const log = (message: string): void => {
      process.stdout.write(`${new Date().toISOString()} ${message}\n`);
    };
    // Only a daemon its service supervises updates itself: it stops after an update, and the service starts the new
    // version. Anywhere else an update would leave nothing running.
    const installation = detectInstallation();
    const selfUpdate =
      installation !== undefined &&
      settings.autoUpdate &&
      process.env[SERVICE_ENV] === '1'
        ? { installation }
        : undefined;
    const daemon = new RunnerDaemon({
      paths,
      settings,
      connections,
      adapters: loadAdapters(process.env, settings.passEnv),
      adaptersFor: loadAdapters,
      ...(slotsFlag.slots === undefined ? {} : { slots: slotsFlag.slots }),
      ...(slotsFlag.toolSlots === undefined
        ? {}
        : { toolSlots: slotsFlag.toolSlots }),
      timings: timingsFromEnv(),
      log,
      ...(selfUpdate === undefined ? {} : { selfUpdate }),
    });
    const stop = (signal: string): void => void daemon.stop(signal);
    process.on('SIGTERM', () => stop('SIGTERM'));
    process.on('SIGINT', () => stop('SIGINT'));
    await daemon.start();
    await daemon.wait();
    return this.exitProcess(daemon.exitCode, log);
  }
}
