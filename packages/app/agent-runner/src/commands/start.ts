import { Flags, type Interfaces } from '@oclif/core';
import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';

import { loadAdapters } from '../agent/adapters/registry.ts';
import { RunnerCommand, UsageError } from '../lib/command.ts';
import {
  readConnections,
  readSettings,
  writeSettings,
  type AgentHome,
} from '../lib/config.ts';
import { ensureHome } from '../lib/home.ts';
import { detectInstallation } from '../lib/install.ts';
import { delay } from '../lib/http.ts';
import { selfCommand } from '../lib/self.ts';
import { runnerCommandLine } from '../host.ts';
import { EXIT_CODES } from '../protocol/index.ts';
import { readDaemonPid, RunnerDaemon } from '../core/loop.ts';
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
    slots: Interfaces.OptionFlag<number | undefined>;
    'agent-home': Interfaces.OptionFlag<string | undefined>;
  } = {
    foreground: Flags.boolean({
      description: 'Run in this terminal until interrupted.',
    }),
    slots: Flags.integer({
      description: 'How many runs at once. Defaults to the registered number.',
      min: 1,
      max: 32,
    }),
    'agent-home': Flags.string({
      description:
        "The home directory agents' tools get: isolated (a home per workspace, linking only what the tools need) or " +
        'real (the runner user’s own). Remembered for later starts.',
      options: ['isolated', 'real'],
    }),
  };

  async run(): Promise<{ pid: number }> {
    const { flags } = await this.parse(Start);
    const paths = this.paths;
    const connections = await readConnections(paths);
    if (connections.length === 0) {
      throw new UsageError(
        `This runner is not registered. Run \`${runnerCommandLine('register')}\` first.`,
        EXIT_CODES.auth,
      );
    }
    const settings = await readSettings(paths);
    if (flags['agent-home'] !== undefined) {
      settings.agentHome = flags['agent-home'] as AgentHome;
      await writeSettings(settings, paths);
    }
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
          ...(flags.slots === undefined
            ? []
            : ['--slots', String(flags.slots)]),
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
      adapters: loadAdapters(),
      ...(flags.slots === undefined ? {} : { slots: flags.slots }),
      timings: timingsFromEnv(),
      log,
      ...(selfUpdate === undefined ? {} : { selfUpdate }),
    });
    const stop = (signal: string): void => void daemon.stop(signal);
    process.on('SIGTERM', () => stop('SIGTERM'));
    process.on('SIGINT', () => stop('SIGINT'));
    await daemon.start();
    await daemon.wait();
    return { pid: process.pid };
  }
}
