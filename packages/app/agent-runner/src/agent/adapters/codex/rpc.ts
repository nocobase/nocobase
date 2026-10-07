/**
 * JSON-RPC over the stdio of a `codex app-server` process: one JSON object
 * per line, no `jsonrpc` member. Requests flow both ways; the server sends
 * approvals as requests the client must answer.
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

import type { RequestId, RpcErrorBody, RpcMessage } from './protocol.ts';

/** The app-server process as the adapter sees it; replaced in tests. */
export interface CodexProcess {
  /** Writes one message line. */
  send(line: string): void;
  onLine(listener: (line: string) => void): void;
  onStderr(listener: (line: string) => void): void;
  /** Called once, when the process is gone (or failed to start). */
  onExit(listener: (exit: CodexExit) => void): void;
  /** Ends stdin; the app-server exits when its input closes. */
  end(): void;
  /** Signals the process group, including commands left behind. */
  kill(signal: 'SIGTERM' | 'SIGKILL'): void;
}

export interface CodexExit {
  code: number | null;
  signal: string | null;
  /** Set when the process could not be started. */
  error?: Error;
}

export interface SpawnOptions {
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
}

export type SpawnCodex = (options: SpawnOptions) => CodexProcess;

/**
 * Starts the app-server in its own process group, so stopping it also ends
 * the commands it runs.
 */
export const spawnCodexProcess: SpawnCodex = (options) => {
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  const exitListeners: ((exit: CodexExit) => void)[] = [];
  let exit: CodexExit | undefined;
  const finish = (value: CodexExit) => {
    if (exit) return;
    exit = value;
    for (const listener of exitListeners.splice(0)) listener(value);
  };
  child.on('error', (error) => finish({ code: null, signal: null, error }));
  child.on('exit', (code, signal) => finish({ code, signal }));
  child.stdin.on('error', () => {
    // The process went away; its exit is reported separately.
  });
  const stdout = createInterface({ input: child.stdout });
  const stderr = createInterface({ input: child.stderr });
  return {
    send(line) {
      if (child.stdin.writable) child.stdin.write(`${line}\n`);
    },
    onLine(listener) {
      stdout.on('line', listener);
    },
    onStderr(listener) {
      stderr.on('line', listener);
    },
    onExit(listener) {
      if (exit) listener(exit);
      else exitListeners.push(listener);
    },
    end() {
      child.stdin.end();
    },
    kill(signal) {
      if (child.pid === undefined) return;
      try {
        // The group outlives its leader while commands it started still run.
        if (process.platform === 'win32') child.kill(signal);
        else process.kill(-child.pid, signal);
      } catch {
        if (!exit) child.kill(signal);
      }
    },
  };
};

export class RpcError extends Error {
  readonly code: number;
  readonly data: unknown;

  constructor(method: string, body: RpcErrorBody) {
    super(`${method}: ${body.message}`);
    this.name = 'RpcError';
    this.code = body.code;
    this.data = body.data;
  }
}

export interface RpcHandlers {
  notification(method: string, params: unknown): void;
  /** Answers a server request; a thrown error becomes an error response. */
  request(method: string, params: unknown): Promise<unknown>;
}

export class RpcConnection {
  private nextId = 1;
  private readonly pending = new Map<
    RequestId,
    {
      method: string;
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  private closedError?: Error;
  private readonly proc: CodexProcess;
  private readonly handlers: RpcHandlers;

  constructor(proc: CodexProcess, handlers: RpcHandlers) {
    this.proc = proc;
    this.handlers = handlers;
    proc.onLine((line) => this.receive(line));
  }

  request<T>(method: string, params: unknown): Promise<T> {
    if (this.closedError) return Promise.reject(this.closedError);
    const id = this.nextId;
    this.nextId += 1;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        method,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.write({ id, method, params });
    });
  }

  notify(method: string, params?: unknown): void {
    if (this.closedError) return;
    this.write(params === undefined ? { method } : { method, params });
  }

  /** Rejects every pending request; later calls fail immediately. */
  close(error: Error): void {
    if (this.closedError) return;
    this.closedError = error;
    for (const entry of this.pending.values()) entry.reject(error);
    this.pending.clear();
  }

  private write(message: RpcMessage): void {
    this.proc.send(JSON.stringify(message));
  }

  private receive(line: string): void {
    const text = line.trim();
    if (!text) return;
    let message: RpcMessage;
    try {
      message = JSON.parse(text) as RpcMessage;
    } catch {
      return;
    }
    if (typeof message !== 'object' || message === null) return;
    if (message.method !== undefined && message.id !== undefined) {
      void this.answer(message.id, message.method, message.params);
    } else if (message.method !== undefined) {
      this.handlers.notification(message.method, message.params);
    } else if (message.id !== undefined) {
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.error)
        entry.reject(new RpcError(entry.method, message.error));
      else entry.resolve(message.result);
    }
  }

  private async answer(
    id: RequestId,
    method: string,
    params: unknown,
  ): Promise<void> {
    try {
      const result = await this.handlers.request(method, params);
      if (!this.closedError) this.write({ id, result });
    } catch (error) {
      if (!this.closedError)
        this.write({
          id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error),
          },
        });
    }
  }
}
