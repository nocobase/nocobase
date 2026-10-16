// The service owns this process; the daemon owns its workers. Keep retries in memory and pipe all daemon output
// through one bounded log writer, so rotation never leaves a service writing to an old inode.
import { spawn, type ChildProcess } from 'node:child_process';
import {
  appendFileSync,
  openSync,
  closeSync,
  readSync,
  writeFileSync,
  chmodSync,
  mkdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { EXIT_CODES } from '../protocol/index.ts';
import { RESTART_EXIT_CODE } from './update.ts';

export class RotatingLog {
  private size: number;
  readonly file: string;
  readonly maxBytes: number;

  constructor(file: string, maxBytes: number = 5 * 1024 * 1024) {
    this.file = file;
    this.maxBytes = maxBytes;
    mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    appendFileSync(file, '', { mode: 0o600 });
    chmodSync(file, 0o600);
    this.size = statSync(file).size;
    // An older installation may already have an oversized log. Retain only its bounded tail once on upgrade.
    if (this.size > maxBytes) {
      const fd = openSync(file, 'r');
      const tail = Buffer.alloc(maxBytes);
      try {
        readSync(fd, tail, 0, maxBytes, this.size - maxBytes);
      } finally {
        closeSync(fd);
      }
      writeFileSync(file, tail, { mode: 0o600 });
      this.size = maxBytes;
    }
  }

  write(data: Buffer | string): void {
    let buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    while (buffer.length > 0) {
      if (this.size >= this.maxBytes) {
        rmSync(`${this.file}.2`, { force: true });
        try {
          renameSync(`${this.file}.1`, `${this.file}.2`);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
        renameSync(this.file, `${this.file}.1`);
        this.size = 0;
      }
      const length = Math.min(buffer.length, this.maxBytes - this.size);
      appendFileSync(this.file, buffer.subarray(0, length), { mode: 0o600 });
      this.size += length;
      buffer = buffer.subarray(length);
    }
  }
}

export interface ServiceRunnerOptions {
  command: string[];
  log: RotatingLog;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  /** Injectable time and retry waits for deterministic policy tests. */
  now?: () => number;
  wait?: (ms: number, signal: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
}

/** Only macOS needs authentication translated to a successful service exit. */
export function serviceExitCode(
  code: number,
  platform: NodeJS.Platform,
): number {
  return code === EXIT_CODES.auth && platform === 'darwin' ? 0 : code;
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
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  options.signal?.addEventListener('abort', stop);
  if (options.signal?.aborted) stop();
  const message = (text: string): void =>
    log.write(`${new Date().toISOString()} ${text}\n`);
  let failures = 0;
  try {
    while (!stopping.signal.aborted) {
      const started = now();
      const code = await new Promise<number>((resolve) => {
        const [command = '', ...args] = options.command;
        child = spawn(command, args, {
          env: options.env ?? process.env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        child.stdout?.on('data', (chunk: Buffer) => log.write(chunk));
        child.stderr?.on('data', (chunk: Buffer) => log.write(chunk));
        let spawnFailed = false;
        child.on('error', (error) => {
          spawnFailed = true;
          message(`Cannot start runner: ${error.message}`);
        });
        child.on('close', (exit, signal) => {
          child = undefined;
          if (signal !== null) message(`Runner ended with signal ${signal}.`);
          resolve(
            spawnFailed ? EXIT_CODES.general : (exit ?? EXIT_CODES.general),
          );
        });
      });
      if (stopping.signal.aborted) return 0;
      if (code === 0 || code === EXIT_CODES.auth || code === RESTART_EXIT_CODE)
        return serviceExitCode(code, options.platform ?? process.platform);
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
    process.off('SIGTERM', stop);
    process.off('SIGINT', stop);
    options.signal?.removeEventListener('abort', stop);
  }
}
