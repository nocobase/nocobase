/**
 * Starts one `opencode serve` per run: bound to 127.0.0.1, on a port the
 * operating system picks (`--port 0`, read back from the "listening on" line,
 * so there is no window in which another process can take it), protected by
 * a random basic-auth password. The server runs in its own process group so
 * that closing it also ends the shell commands and helpers it started.
 */
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';

import { delay } from './util.ts';

export const SERVER_USERNAME = 'opencode';
const STDERR_KEEP_LINES = 40;
const DEFAULT_START_TIMEOUT_MS = 30_000;

export interface LaunchOptions {
  /** The opencode executable. */
  binary: string;
  /** The server's working directory; it becomes the sessions' location. */
  cwd: string;
  /** The complete environment of the server (the password is added). */
  env: Record<string, string>;
  startTimeoutMs?: number;
  /** Aborting it kills a server that is still starting. */
  signal?: AbortSignal;
}

export interface ServerHandle {
  baseUrl: string;
  username: string;
  password: string;
  /** Resolves when the server process has exited. */
  exited: Promise<{ code: number | null; signal: string | null }>;
  /** The last lines the server wrote to stderr. */
  stderr(): string[];
  /** SIGTERM, then SIGKILL after `graceMs`; resolves once the process is gone. */
  close(graceMs: number): Promise<void>;
}

export type LaunchFn = (options: LaunchOptions) => Promise<ServerHandle>;

export class ServerStartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServerStartError';
  }
}

function killGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // already gone
    }
  }
}

export const launchServer: LaunchFn = async (options) => {
  const password = randomBytes(24).toString('base64url');
  const child = spawn(
    options.binary,
    ['serve', '--hostname', '127.0.0.1', '--port', '0'],
    {
      cwd: options.cwd,
      env: {
        ...options.env,
        OPENCODE_SERVER_USERNAME: SERVER_USERNAME,
        OPENCODE_SERVER_PASSWORD: password,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    },
  );

  const stderrLines: string[] = [];
  const keep = (text: string) => {
    stderrLines.push(...text.split('\n').filter(Boolean));
    stderrLines.splice(0, Math.max(0, stderrLines.length - STDERR_KEEP_LINES));
  };
  child.stderr?.setEncoding('utf8').on('data', keep);

  let exitedState: { code: number | null; signal: string | null } | undefined;
  const exited = new Promise<{ code: number | null; signal: string | null }>(
    (resolve) => {
      child.once('exit', (code, signal) => {
        exitedState = { code, signal };
        resolve(exitedState);
      });
      child.once('error', (error) => {
        keep(error.message);
        exitedState = { code: null, signal: null };
        resolve(exitedState);
      });
    },
  );
  // A runner that exits must not leave the server behind.
  const onProcessExit = () => killGroup(child, 'SIGKILL');
  process.once('exit', onProcessExit);
  void exited.then(() => process.removeListener('exit', onProcessExit));

  const close = async (graceMs: number) => {
    if (exitedState) return;
    killGroup(child, 'SIGTERM');
    const result = await Promise.race([exited, delay(graceMs)]);
    if (!result) {
      killGroup(child, 'SIGKILL');
      await exited;
    }
  };

  const baseUrl = await new Promise<string>((resolve, reject) => {
    let stdout = '';
    const timer = setTimeout(
      () =>
        reject(
          new ServerStartError(
            `opencode serve did not report its address within ${options.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS} ms`,
          ),
        ),
      options.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS,
    );
    timer.unref();
    const onAbort = () =>
      reject(new ServerStartError('opencode serve start aborted'));
    if (options.signal?.aborted) onAbort();
    options.signal?.addEventListener('abort', onAbort, { once: true });
    child.stdout?.setEncoding('utf8').on('data', (text: string) => {
      stdout = (stdout + text).slice(-4096);
      const match = /listening on (https?:\/\/[^\s/]+)/.exec(stdout);
      if (!match) return;
      clearTimeout(timer);
      const url = new URL(match[1]);
      if (url.hostname !== '127.0.0.1') {
        reject(
          new ServerStartError(
            `opencode serve listens on ${url.hostname}, not 127.0.0.1`,
          ),
        );
        return;
      }
      resolve(url.origin);
    });
    void exited.then(({ code, signal }) => {
      clearTimeout(timer);
      const tail = stderrLines.slice(-5).join('\n');
      reject(
        new ServerStartError(
          `opencode serve exited before listening (${signal ? `killed by signal ${signal}` : `exited with code ${code}`})${tail ? `: ${tail}` : ''}`,
        ),
      );
    });
  }).catch(async (error: unknown) => {
    await close(1000);
    throw error;
  });
  // Keep draining stdout so the server never blocks on a full pipe.
  child.stdout?.resume();

  return {
    baseUrl,
    username: SERVER_USERNAME,
    password,
    exited,
    stderr: () => [...stderrLines],
    close,
  };
};
