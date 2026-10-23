/**
 * One agent process speaking ACP over its standard input and output, with the bridge as its client. Stopping it also
 * stops the shells and servers it started: it runs in a process group of its own, which is signalled, or on Windows its
 * process tree is ended with `taskkill`.
 */
import {
  execFile,
  spawn,
  type ChildProcess,
  type ChildProcessByStdio,
} from 'node:child_process';
import { once } from 'node:events';
import { Readable, Writable } from 'node:stream';

import * as acp from '@agentclientprotocol/sdk';

import type { ResolvedAgent } from './agents.js';

export interface AgentClientHandlers {
  readonly update: (notification: acp.SessionNotification) => void;
  readonly permission: (
    request: acp.RequestPermissionRequest,
    signal: AbortSignal,
  ) => Promise<acp.RequestPermissionResponse>;
}

export interface AgentProcessOptions {
  readonly signal?: AbortSignal | undefined;
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly client: acp.Implementation;
  readonly handlers: AgentClientHandlers;
  readonly initializeTimeoutMs?: number;
  /** False for an inspection that must not grant full-access environment defaults. */
  readonly permissionDefaults?: boolean;
}

/** Long enough for an adapter that npx fetches on first use, when no managed one can run. */
const INITIALIZE_TIMEOUT_MS = 120_000;
const STOP_GRACE_MS = 3_000;
const STDERR_TAIL = 4_000;

export class AgentProcess {
  readonly initialize: acp.InitializeResponse;
  readonly #child: ChildProcess;
  readonly #connection: acp.ClientConnection;
  readonly #stderr: { text: string };
  readonly #handlers: { current: AgentClientHandlers };
  readonly #removeAbort: () => void;

  private constructor(
    child: ChildProcess,
    connection: acp.ClientConnection,
    stderr: { text: string },
    handlers: { current: AgentClientHandlers },
    initialize: acp.InitializeResponse,
    removeAbort: () => void,
  ) {
    this.#child = child;
    this.#connection = connection;
    this.#stderr = stderr;
    this.#handlers = handlers;
    this.initialize = initialize;
    this.#removeAbort = removeAbort;
  }

  /** Starts the agent and runs ACP `initialize`; throws with what the agent printed when it does not answer. */
  static async start(
    agent: ResolvedAgent,
    options: AgentProcessOptions,
  ): Promise<AgentProcess> {
    options.signal?.throwIfAborted();
    const child = startProgram(agent, options);
    const stderr = { text: '' };
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr.text = (stderr.text + chunk).slice(-STDERR_TAIL);
    });
    const spawned = new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    const stream = acp.ndJsonStream(
      Writable.toWeb(child.stdin),
      Readable.toWeb(child.stdout),
    );
    // Read on every message, so a process handed to another owner (`handOver`) answers to it from then on.
    const handlers = { current: options.handlers };
    const connection = acp
      .client({ name: options.client.name })
      .onNotification(acp.methods.client.session.update, (context) =>
        handlers.current.update(context.params),
      )
      .onRequest(acp.methods.client.session.requestPermission, (context) =>
        handlers.current.permission(context.params, context.signal),
      )
      .connect(stream);
    const abort = (): void => {
      connection.close();
      void stopProcess(child);
    };
    options.signal?.addEventListener('abort', abort, { once: true });
    const removeAbort = (): void =>
      options.signal?.removeEventListener('abort', abort);
    try {
      await spawned;
      options.signal?.throwIfAborted();
      // Writing to an agent that has exited fails with EPIPE; the exit itself is what the session reports.
      child.on('error', ignore);
      child.stdin.on('error', ignore);
      const timeoutMs = options.initializeTimeoutMs ?? INITIALIZE_TIMEOUT_MS;
      let cleanup = () => {};
      const initialize = await new Promise<acp.InitializeResponse>(
        (resolve, reject) => {
          const onExit = () =>
            reject(new Error('The agent exited before it answered.'));
          const timer = setTimeout(
            () =>
              reject(
                new Error(
                  `The agent did not answer within ${timeoutMs / 1000} seconds.`,
                ),
              ),
            timeoutMs,
          );
          const onAbort = () => reject(new Error('Agent detection cancelled.'));
          cleanup = () => {
            clearTimeout(timer);
            child.off('exit', onExit);
            options.signal?.removeEventListener('abort', onAbort);
          };
          options.signal?.addEventListener('abort', onAbort, { once: true });
          if (options.signal?.aborted) onAbort();
          child.once('exit', onExit);
          connection.agent
            .request(acp.methods.agent.initialize, {
              protocolVersion: acp.PROTOCOL_VERSION,
              clientCapabilities: {},
              clientInfo: options.client,
            })
            .then(resolve, reject)
            .finally(cleanup);
        },
      ).finally(() => cleanup());
      if (initialize.protocolVersion !== acp.PROTOCOL_VERSION)
        throw new Error(
          `ACP protocol incompatibility: the agent selected ${initialize.protocolVersion}; this host supports ACP ${acp.PROTOCOL_VERSION}. Reported tool release: ${initialize.agentInfo?.version ?? 'unknown'}. Minimum supported tool release: unknown. Upgrade the tool and its ACP adapter to their latest releases, then refresh detection; consult their compatibility documentation if the mismatch persists.`,
        );
      return new AgentProcess(
        child,
        connection,
        stderr,
        handlers,
        initialize,
        removeAbort,
      );
    } catch (error) {
      removeAbort();
      connection.close();
      await stopProcess(child);
      throw new Error(withOutput(errorMessage(error), stderr.text), {
        cause: error,
      });
    }
  }

  get agent(): acp.ClientContext {
    return this.#connection.agent;
  }

  /** Whether the process is still running and connected. */
  get alive(): boolean {
    return (
      this.#child.exitCode === null &&
      this.#child.signalCode === null &&
      !this.#connection.signal.aborted
    );
  }

  /** The agent's name and version, as it reported them. */
  get description(): string {
    const info = this.initialize.agentInfo;
    return info ? `${info.title ?? info.name} ${info.version}` : 'ACP agent';
  }

  /** `error` with the last lines the agent printed, when the error itself says little. */
  explain(error: unknown): string {
    return withOutput(errorMessage(error), this.alive ? '' : this.#stderr.text);
  }

  /**
   * Gives the running process to another owner: its session updates and permission requests go to `handlers` from now
   * on, and the signal it was started with no longer stops it.
   */
  handOver(handlers: AgentClientHandlers): void {
    this.#removeAbort();
    this.#handlers.current = handlers;
  }

  async stop(): Promise<void> {
    this.#removeAbort();
    this.#connection.close();
    await stopProcess(this.#child);
  }
}

/** An error's message, with the details an ACP error carries. */
export function errorMessage(error: unknown): string {
  if (error instanceof acp.RequestError) {
    const data = error.data as
      { message?: unknown; details?: unknown } | string | undefined;
    const detail =
      typeof data === 'string'
        ? data
        : typeof data?.message === 'string'
          ? data.message
          : data?.details;
    return typeof detail === 'string' &&
      detail &&
      !error.message.includes(detail)
      ? `${error.message}: ${detail}`
      : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

/** Whether `error` is ACP's "authentication required". */
export function isAuthRequired(error: unknown): boolean {
  return (
    (error instanceof acp.RequestError && error.code === -32000) ||
    (error instanceof Error &&
      error.cause !== undefined &&
      error.cause !== error &&
      isAuthRequired(error.cause))
  );
}

function withOutput(message: string, output: string): string {
  const tail = output.trim().split('\n').slice(-5).join('\n');
  return tail ? `${message}\n${tail}` : message;
}

function ignore(): void {}

const windows = process.platform === 'win32';

function startProgram(
  agent: ResolvedAgent,
  options: AgentProcessOptions,
): ChildProcessByStdio<Writable, Readable, Readable> {
  const common = {
    cwd: options.cwd,
    env: {
      ...options.env,
      ...agent.spec.env,
      ...(options.permissionDefaults === false ? {} : agent.spec.permissionEnv),
      ...agent.env,
    },
    stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
  };
  if (!windows)
    return spawn(agent.command, [...agent.args], { ...common, detached: true });
  // A batch file, as npm installs `npx` and agents' commands, runs only through cmd.exe, given one command line.
  return /\.(?:cmd|bat)$/iu.test(agent.command)
    ? spawn([agent.command, ...agent.args].map(quoteForCmd).join(' '), {
        ...common,
        shell: true,
        windowsHide: true,
      })
    : spawn(agent.command, [...agent.args], { ...common, windowsHide: true });
}

/** `value` as one argument of a cmd.exe command line. */
function quoteForCmd(value: string): string {
  return /^[\w@+=:,./\\-]+$/u.test(value)
    ? value
    : `"${value.replace(/"/gu, '""')}"`;
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.pid === undefined) return;
  const exited =
    child.exitCode !== null || child.signalCode !== null
      ? Promise.resolve()
      : once(child, 'exit');
  if (windows) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    endTree(child.pid);
    await exited;
    return;
  }
  signalGroup(child.pid, 'SIGTERM');
  let timer: NodeJS.Timeout | undefined;
  const forced = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      signalGroup(child.pid!, 'SIGKILL');
      resolve();
    }, STOP_GRACE_MS);
  });
  await exited;
  // A launcher can exit while its descendants still hold this isolated group.
  // Keep the force deadline even when the direct child exited before stop was called.
  if (groupExists(child.pid)) await forced;
  clearTimeout(timer);
}

function groupExists(pid: number): boolean {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Ends the process `pid` and every process it started, on Windows. */
function endTree(pid: number): void {
  execFile(
    'taskkill',
    ['/pid', String(pid), '/T', '/F'],
    { windowsHide: true },
    ignore,
  );
}

function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    // Already gone.
  }
}
