import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CommandFailedError,
  runCommand,
  type RunCommand,
} from './run-command.ts';

export interface Pm2Process {
  name: string;
  pid: number;
  status: string;
  restarts: number;
  /** The directory pm2 started the process in; for an application this installer started, the installation root. */
  cwd?: string;
}

/** pm2 prints daemon notices such as "[PM2] Spawning PM2 daemon" before the JSON; the array is the last line that parses. */
export function parseJlist(stdout: string): Pm2Process[] {
  const lines = stdout.trim().split('\n').reverse();
  for (const line of lines) {
    if (!line.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(line) as {
        name: string;
        pid: number;
        pm2_env?: { status?: string; restart_time?: number; pm_cwd?: string };
      }[];
      return parsed.map((entry) => ({
        name: entry.name,
        pid: entry.pid,
        status: entry.pm2_env?.status ?? 'unknown',
        restarts: entry.pm2_env?.restart_time ?? 0,
        ...(entry.pm2_env?.pm_cwd ? { cwd: entry.pm2_env.pm_cwd } : {}),
      }));
    } catch {
      // A notice line that happens to start with "[".
    }
  }
  return [];
}

/**
 * Whether pm2's daemon is running, read from its pid file. Any pm2 command, `jlist` included, starts the daemon when
 * it is not running, so a read-only question has to be answered without asking pm2.
 */
export function isDaemonRunning(env: NodeJS.ProcessEnv = process.env): boolean {
  const home = env.PM2_HOME || path.join(os.homedir(), '.pm2');
  let pid: number;
  try {
    pid = Number.parseInt(readFileSync(path.join(home, 'pm2.pid'), 'utf8'), 10);
  } catch {
    return false;
  }
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export interface Pm2 {
  version(): Promise<string>;
  start(ecosystemFile: string, cwd: string): Promise<void>;
  stop(name: string): Promise<void>;
  /** Removes the process entry; a name pm2 does not know is not an error. */
  remove(name: string): Promise<void>;
  save(): Promise<void>;
  /** The process registered under `name`, without starting the daemon when it is not running. */
  describe(name: string): Promise<Pm2Process | undefined>;
}

export function createPm2(
  bin = 'pm2',
  run: RunCommand = runCommand,
  daemonRunning: () => boolean = isDaemonRunning,
): Pm2 {
  return {
    async version() {
      const { stdout } = await run(bin, ['--version']);
      // pm2 may print daemon notices around the version, so take the line that is one.
      const lines = stdout
        .trim()
        .split('\n')
        .map((line) => line.trim());
      return (
        [...lines].reverse().find((line) => /^\d+\.\d+\.\d+/u.test(line)) ??
        lines.at(-1) ??
        ''
      );
    },
    async start(ecosystemFile, cwd) {
      await run(bin, ['start', ecosystemFile], { cwd });
    },
    async stop(name) {
      await run(bin, ['stop', name]);
    },
    async remove(name) {
      try {
        await run(bin, ['delete', name]);
      } catch (error) {
        if (
          error instanceof CommandFailedError &&
          /not found/iu.test(`${error.stdout}\n${error.stderr}`)
        ) {
          return;
        }
        throw error;
      }
    },
    async save() {
      await run(bin, ['save']);
    },
    async describe(name) {
      if (!daemonRunning()) return undefined;
      const { stdout } = await run(bin, ['jlist']);
      return parseJlist(stdout).find((entry) => entry.name === name);
    },
  };
}
