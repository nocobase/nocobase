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
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly client: acp.Implementation;
  readonly handlers: AgentClientHandlers;
}

/** Long enough for an adapter that npx fetches on first use. */
const INITIALIZE_TIMEOUT_MS = 120_000;
const STOP_GRACE_MS = 3_000;
const STDERR_TAIL = 4_000;

export class AgentProcess {
  readonly initialize: acp.InitializeResponse;
  readonly #child: ChildProcess;
  readonly #connection: acp.ClientConnection;
  readonly #stderr: { text: string };

  private constructor(
    child: ChildProcess,
    connection: acp.ClientConnection,
    stderr: { text: string },
    initialize: acp.InitializeResponse,
  ) {
    this.#child = child;
    this.#connection = connection;
    this.#stderr = stderr;
    this.initialize = initialize;
  }

  /** Starts the agent and runs ACP `initialize`; throws with what the agent printed when it does not answer. */
  static async start(
    agent: ResolvedAgent,
    options: AgentProcessOptions,
  ): Promise<AgentProcess> {
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
    const connection = acp
      .client({ name: options.client.name })
      .onNotification(acp.methods.client.session.update, (context) =>
        options.handlers.update(context.params),
      )
      .onRequest(acp.methods.client.session.requestPermission, (context) =>
        options.handlers.permission(context.params, context.signal),
      )
      .connect(stream);
    try {
      await spawned;
      // Writing to an agent that has exited fails with EPIPE; the exit itself is what the session reports.
      child.on('error', ignore);
      child.stdin.on('error', ignore);
      const initialize = await new Promise<acp.InitializeResponse>(
        (resolve, reject) => {
          const onExit = () =>
            reject(new Error('The agent exited before it answered.'));
          const timer = setTimeout(
            () =>
              reject(
                new Error(
                  `The agent did not answer within ${INITIALIZE_TIMEOUT_MS / 1000} seconds.`,
                ),
              ),
            INITIALIZE_TIMEOUT_MS,
          );
          child.once('exit', onExit);
          connection.agent
            .request(acp.methods.agent.initialize, {
              protocolVersion: acp.PROTOCOL_VERSION,
              clientCapabilities: {},
              clientInfo: options.client,
            })
            .then(resolve, reject)
            .finally(() => {
              clearTimeout(timer);
              child.off('exit', onExit);
            });
        },
      );
      return new AgentProcess(child, connection, stderr, initialize);
    } catch (error) {
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

  async stop(): Promise<void> {
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
  return error instanceof acp.RequestError && error.code === -32000;
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
    env: { ...options.env, ...agent.spec.env },
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
  if (
    child.exitCode !== null ||
    child.signalCode !== null ||
    child.pid === undefined
  )
    return;
  const exited = once(child, 'exit');
  if (windows) {
    endTree(child.pid);
    await exited;
    return;
  }
  signalGroup(child.pid, 'SIGTERM');
  const timer = setTimeout(
    () => signalGroup(child.pid!, 'SIGKILL'),
    STOP_GRACE_MS,
  );
  await exited;
  clearTimeout(timer);
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
