/**
 * The bridge makes this computer a place where its owner's agent sessions run. Signed in as that person, it registers
 * the computer with the application, long-polls for commands, runs each session's agent and reports what happens,
 * until `signal` aborts or the application refuses it (`BridgeStopped`).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { AgentProcess } from './agent-process.js';
import {
  AGENTS,
  resolveAgent,
  type AgentSpec,
  type ResolvedAgent,
} from './agents.js';
import {
  BRIDGE_PROTOCOL_VERSION,
  BRIDGE_ROUTES,
  coalesce,
  MAX_EVENTS_PER_REPORT,
  POLL_WAIT_MS,
  type AgentInfo,
  type BridgeCommand,
  type BridgeEvent,
  type ComputerInfo,
  type PollResponse,
  type RegisterRequest,
  type RegisterResponse,
  type ReplyRequest,
  type ReportRequest,
  type ReportResponse,
} from './protocol.js';
import { listFolders } from './folders.js';
import { BridgeSession } from './session.js';

export interface BridgeOptions {
  /** The application's address as the command line knows it, with any base path: `https://host/app`. */
  readonly server: string;
  /** The headers that authenticate the person. */
  readonly headers: Readonly<Record<string, string>>;
  /** The program running the bridge, for the computer record and ACP's `clientInfo`. */
  readonly client: { readonly name: string; readonly version: string };
  /** Where the bridge keeps this computer's id for the server; written on registration. */
  readonly stateFile: string;
  /** The computer's name; its host name by default. */
  readonly name?: string;
  /** The directories sessions may work in; the home directory by default. */
  readonly roots?: readonly string[];
  readonly env?: NodeJS.ProcessEnv;
  readonly signal: AbortSignal;
  readonly log: (message: string) => void;
}

/** The application refused the bridge: it cannot go on until the person acts. */
export class BridgeStopped extends Error {
  override readonly name: string = 'BridgeStopped';
}

/** An answer other than 2xx from the application. */
export class BridgeHttpError extends Error {
  override readonly name: string = 'BridgeHttpError';
  readonly status: number;
  readonly reason: string | undefined;

  constructor(status: number, reason: string | undefined, message: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

/** How long reported events wait for more before they are sent together. */
const REPORT_DELAY_MS = 150;
const MAX_BACKOFF_MS = 30_000;

export async function runBridge(options: BridgeOptions): Promise<void> {
  const { signal, log } = options;
  const env = options.env ?? process.env;
  const roots = (options.roots ?? [os.homedir()]).map((root) =>
    path.resolve(root),
  );
  const post = createPost(options.server, options.headers, signal);
  const startedAt = new Date().toISOString();

  const found = new Map<string, ResolvedAgent | undefined>();
  for (const spec of AGENTS) found.set(spec.id, await resolveAgent(spec, env));
  const computer = (agents: readonly AgentInfo[]): ComputerInfo => ({
    name: options.name ?? os.hostname(),
    platform: process.platform,
    arch: process.arch,
    host: `${options.client.name} ${options.client.version}`,
    home: os.homedir(),
    roots,
    agents,
  });
  const register = async (agents: readonly AgentInfo[]): Promise<string> => {
    const request: RegisterRequest = {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: await readComputerId(options.stateFile),
      computer: computer(agents),
    };
    const { computerId } = await post<RegisterResponse>(
      BRIDGE_ROUTES.register,
      request,
    ).catch((error: unknown) => {
      throw refusal(error) ?? error;
    });
    await writeComputerId(options.stateFile, computerId);
    return computerId;
  };

  const computerId = await register(
    AGENTS.map((spec) => ({
      ...agentInfo(spec),
      ...(found.get(spec.id) ? {} : { problem: 'notInstalled' as const }),
    })),
  );
  log(
    `This computer is connected to ${options.server} as "${computer([]).name}".`,
  );
  void probeAgents(found, env, options.client).then(
    (agents) => register(agents),
    (error: unknown) => log(`Could not check the agents: ${message(error)}`),
  );

  const sessions = new Map<string, BridgeSession>();
  const reporter = new Reporter({
    send: (request) => post<ReportResponse>(BRIDGE_ROUTES.report, request),
    computerId,
    startedAt,
    stateOf: (sessionId) => sessions.get(sessionId)?.state ?? null,
    closed: (sessionId) => void closeSession(sessionId),
    log,
  });
  const closeSession = async (sessionId: string): Promise<void> => {
    const session = sessions.get(sessionId);
    sessions.delete(sessionId);
    await session?.close();
  };
  const answer = async (
    command: Extract<BridgeCommand, { type: 'listFolders' }>,
  ): Promise<void> => {
    const reply = await listFolders(roots, command.path).then(
      (listing): ReplyRequest => ({
        computerId,
        requestId: command.requestId,
        listing,
        error: null,
      }),
      (error: unknown): ReplyRequest => ({
        computerId,
        requestId: command.requestId,
        listing: null,
        error: message(error),
      }),
    );
    await post(BRIDGE_ROUTES.reply, reply).catch((error: unknown) =>
      log(`Could not answer the application: ${message(error)}`),
    );
  };
  const dispatch = (command: BridgeCommand): void => {
    if (command.type === 'close') {
      void closeSession(command.sessionId);
      return;
    }
    if (command.type === 'listFolders') {
      void answer(command);
      return;
    }
    const sessionId = command.session.id;
    let session = sessions.get(sessionId);
    if (!session) {
      session = new BridgeSession(command.session, {
        client: options.client,
        server: options.server,
        env,
        roots,
        resolve: async (agentId) => {
          const spec = AGENTS.find((candidate) => candidate.id === agentId);
          if (!spec)
            throw new Error(
              `This version of ${options.client.name} cannot run the agent "${agentId}".`,
            );
          const resolved =
            found.get(agentId) ?? (await resolveAgent(spec, env));
          if (!resolved)
            throw new Error(`${spec.name} is not installed on this computer.`);
          found.set(agentId, resolved);
          return resolved;
        },
        emit: (event) => reporter.add(sessionId, event),
        stateChanged: () => reporter.touch(sessionId),
      });
      sessions.set(sessionId, session);
    }
    session.handle(command);
  };

  let failures = 0;
  try {
    while (!signal.aborted) {
      let commands: readonly BridgeCommand[];
      try {
        const answer = await post<PollResponse>(
          BRIDGE_ROUTES.poll,
          { computerId, wait: true },
          AbortSignal.any([signal, AbortSignal.timeout(POLL_WAIT_MS + 30_000)]),
        );
        commands = answer.commands;
        if (failures > 0) log('Connected again.');
        failures = 0;
      } catch (error) {
        if (signal.aborted) break;
        const stopped = refusal(error);
        if (stopped) throw stopped;
        failures += 1;
        if (failures === 1)
          log(`Lost the connection (${message(error)}); trying again.`);
        await sleep(backoff(failures), signal);
        continue;
      }
      for (const command of commands) dispatch(command);
    }
  } finally {
    await Promise.all([...sessions.keys()].map(closeSession));
    await reporter.drain();
  }
}

/** What the application learns of an agent before the bridge has started it. */
function agentInfo(spec: AgentSpec): AgentInfo {
  return {
    id: spec.id,
    name: spec.name,
    version: null,
    ...(spec.mode ? { mode: spec.mode } : {}),
  };
}

/** Starts every agent found once, to learn its version and whether it speaks ACP. */
async function probeAgents(
  found: ReadonlyMap<string, ResolvedAgent | undefined>,
  env: NodeJS.ProcessEnv,
  client: { readonly name: string; readonly version: string },
): Promise<AgentInfo[]> {
  return Promise.all(
    AGENTS.map(async (spec): Promise<AgentInfo> => {
      const resolved = found.get(spec.id);
      const info = agentInfo(spec);
      if (!resolved) return { ...info, problem: 'notInstalled' };
      try {
        const agent = await AgentProcess.start(resolved, {
          cwd: os.tmpdir(),
          env,
          client,
          handlers: {
            update: () => undefined,
            permission: () =>
              Promise.resolve({ outcome: { outcome: 'cancelled' } }),
          },
        });
        const version = agent.initialize.agentInfo?.version ?? null;
        await agent.stop();
        return { ...info, version };
      } catch (error) {
        return {
          ...info,
          problem: 'failed',
          detail: message(error).slice(0, 2000),
        };
      }
    }),
  );
}

interface ReporterOptions {
  readonly send: (request: ReportRequest) => Promise<ReportResponse>;
  readonly computerId: string;
  readonly startedAt: string;
  readonly stateOf: (sessionId: string) => ReportRequest['state'];
  readonly closed: (sessionId: string) => void;
  readonly log: (message: string) => void;
}

interface Pending {
  events: BridgeEvent[];
  state: boolean;
  batch: number;
  timer: NodeJS.Timeout | undefined;
  sending: Promise<void> | undefined;
}

/**
 * Sends each session's events in order, a little behind so that streamed text goes out in fewer, larger updates. A
 * report that fails is sent again with the same batch number, so the application never stores it twice.
 */
class Reporter {
  readonly #options: ReporterOptions;
  readonly #pending = new Map<string, Pending>();

  constructor(options: ReporterOptions) {
    this.#options = options;
  }

  add(sessionId: string, event: BridgeEvent): void {
    this.#entry(sessionId).events.push(event);
    this.#schedule(sessionId);
  }

  touch(sessionId: string): void {
    this.#entry(sessionId).state = true;
    this.#schedule(sessionId);
  }

  /** Sends what is left, giving up on a session the application does not answer for. */
  async drain(): Promise<void> {
    await Promise.all(
      [...this.#pending.keys()].map((sessionId) =>
        Promise.race([
          this.#send(sessionId),
          new Promise((resolve) => setTimeout(resolve, 5_000).unref()),
        ]),
      ),
    );
  }

  #entry(sessionId: string): Pending {
    let entry = this.#pending.get(sessionId);
    if (!entry) {
      entry = {
        events: [],
        state: false,
        batch: 0,
        timer: undefined,
        sending: undefined,
      };
      this.#pending.set(sessionId, entry);
    }
    return entry;
  }

  #schedule(sessionId: string): void {
    const entry = this.#entry(sessionId);
    if (entry.timer || entry.sending) return;
    entry.timer = setTimeout(() => void this.#send(sessionId), REPORT_DELAY_MS);
  }

  #send(sessionId: string): Promise<void> {
    const entry = this.#entry(sessionId);
    clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.sending ??= this.#sendAll(sessionId, entry).finally(() => {
      entry.sending = undefined;
    });
    return entry.sending;
  }

  async #sendAll(sessionId: string, entry: Pending): Promise<void> {
    while (entry.events.length > 0 || entry.state) {
      const events = coalesce(entry.events.splice(0, MAX_EVENTS_PER_REPORT));
      const state = entry.state ? this.#options.stateOf(sessionId) : null;
      entry.state = false;
      entry.batch += 1;
      const request: ReportRequest = {
        computerId: this.#options.computerId,
        sessionId,
        batch: entry.batch,
        bridgeStartedAt: this.#options.startedAt,
        events,
        state,
      };
      for (let attempt = 1; ; attempt += 1) {
        try {
          const answer = await this.#options.send(request);
          if (!answer.open) this.#options.closed(sessionId);
          break;
        } catch (error) {
          if (
            error instanceof BridgeHttpError &&
            error.status < 500 &&
            error.status !== 429
          ) {
            this.#options.log(
              `The application refused a report of session ${sessionId}: ${error.message}`,
            );
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, backoff(attempt)));
        }
      }
    }
  }
}

function createPost(
  server: string,
  headers: Readonly<Record<string, string>>,
  stop: AbortSignal,
): <T>(route: string, body: unknown, signal?: AbortSignal) => Promise<T> {
  const base = server.replace(/\/+$/u, '');
  return async <T>(
    route: string,
    body: unknown,
    signal: AbortSignal = stop,
  ): Promise<T> => {
    const response = await fetch(`${base}${route}`, {
      method: 'POST',
      headers: {
        ...headers,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });
    const text = await response.text();
    let parsed: {
      data?: unknown;
      error?: { reason?: string; message?: string };
    } = {};
    try {
      parsed = text ? (JSON.parse(text) as typeof parsed) : {};
    } catch {
      // Not JSON, such as a proxy's error page; the status says enough.
    }
    if (!response.ok) {
      throw new BridgeHttpError(
        response.status,
        parsed.error?.reason,
        parsed.error?.message ?? `${response.status} ${response.statusText}`,
      );
    }
    return parsed.data as T;
  };
}

/** What the person has to act on before the bridge can go on, or undefined for a failure worth trying again. */
function refusal(error: unknown): BridgeStopped | undefined {
  if (!(error instanceof BridgeHttpError)) return undefined;
  if (error.status === 401)
    return new BridgeStopped(
      'The sign-in has expired. Sign in again, then start the bridge.',
    );
  if (error.status === 403)
    return new BridgeStopped(
      `The application does not let you connect a computer: ${error.message}`,
    );
  if (error.reason === 'AGENT_SESSIONS_COMPUTER_NOT_FOUND') {
    return new BridgeStopped(
      'This computer was removed in the application. Start the bridge again to connect it anew.',
    );
  }
  if (error.reason === 'AGENT_SESSIONS_UPGRADE_REQUIRED') {
    return new BridgeStopped(
      `The application needs a newer command line: ${error.message}`,
    );
  }
  if (error.status === 404)
    return new BridgeStopped('The application does not offer agent sessions.');
  return undefined;
}

async function readComputerId(file: string): Promise<string | null> {
  try {
    const saved = JSON.parse(await readFile(file, 'utf8')) as {
      computerId?: unknown;
    };
    return typeof saved.computerId === 'string' ? saved.computerId : null;
  } catch {
    return null;
  }
}

async function writeComputerId(
  file: string,
  computerId: string,
): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, `${JSON.stringify({ computerId }, null, 2)}\n`, {
    mode: 0o600,
  });
}

function backoff(attempt: number): number {
  return Math.min(1_000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done(): void {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
