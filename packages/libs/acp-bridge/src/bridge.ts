/**
 * The bridge makes this computer a place where its owner's agent sessions run. It registers the computer with the
 * application, signed in as that person the first time and with the computer's own key from then on (`stateFile`), so
 * it keeps running however long the sign-in lasts; it long-polls for commands, runs each session's agent and reports
 * what happens, until `signal` aborts or the application refuses it (`BridgeStopped`). It retries what fails for a
 * while, such as a connection lost while the computer slept, and offers an agent installed while it runs.
 */
import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
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
  BRIDGE_HEADERS,
  BRIDGE_PROTOCOL_VERSION,
  BRIDGE_ROUTES,
  coalesce,
  DISCOVERY_TIMEOUT_MS,
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
  /** The headers that authenticate the person: used when the computer has no key yet, or its key was refused. */
  readonly headers: Readonly<Record<string, string>>;
  /** The program running the bridge, for the computer record and ACP's `clientInfo`. */
  readonly client: { readonly name: string; readonly version: string };
  /** Where the bridge keeps this computer's id and key for the server, readable by its owner only. */
  readonly stateFile: string;
  /**
   * Where the bridge installs the ACP adapters it manages (Codex's and Claude Code's), once for each version:
   * `adapters/` beside `stateFile` by default.
   */
  readonly adapters?: string;
  /** The computer's name; its host name by default. */
  readonly name?: string;
  /** The directories sessions may work in; the home directory by default. */
  readonly roots?: readonly string[];
  readonly env?: NodeJS.ProcessEnv;
  /** Ensures the CLI Skill is available and supplies the selected profile and session, on start and resume. */
  readonly prepareSession?:
    | ((agentId: string, sessionId: string) => Promise<NodeJS.ProcessEnv>)
    | undefined;
  /**
   * Whether a computer whose key the application refuses at start, such as one removed there, connects again as the
   * person, as when they start the bridge themselves (the default); a bridge started at login stops instead.
   */
  readonly reconnect?: boolean;
  readonly signal: AbortSignal;
  readonly log: (message: string) => void;
}

/** The application refused the bridge: it cannot go on until the person acts. */
export class BridgeStopped extends Error {
  override readonly name: string = 'BridgeStopped';
}

/**
 * The application refused the bridge for speaking another protocol (`AGENT_SESSIONS_UPGRADE_REQUIRED`). When the
 * application says which protocol it speaks (`protocol`), a bridge older than that can update itself and start again;
 * one from an application that does not say may be the older side too.
 */
export class BridgeUpgradeRequired extends BridgeStopped {
  override readonly name: string = 'BridgeUpgradeRequired';
  /** The protocol this bridge speaks. */
  readonly bridgeProtocol: number = BRIDGE_PROTOCOL_VERSION;
  /** The protocol the application speaks, when it says. */
  readonly protocol: number | undefined;

  constructor(message: string, protocol: number | undefined) {
    super(message);
    this.protocol = protocol;
  }

  /** Whether an update of this bridge may help: the application speaks a newer protocol, or does not say. */
  get bridgeIsOlder(): boolean {
    return this.protocol === undefined || this.protocol > this.bridgeProtocol;
  }
}

/** An answer other than 2xx from the application. */
export class BridgeHttpError extends Error {
  override readonly name: string = 'BridgeHttpError';
  readonly status: number;
  readonly reason: string | undefined;
  /** The error body's `metadata`, when it has one. */
  readonly metadata: Readonly<Record<string, unknown>> | undefined;

  constructor(
    status: number,
    reason: string | undefined,
    message: string,
    metadata?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.status = status;
    this.reason = reason;
    this.metadata = metadata;
  }
}

/** How long reported events wait for more before they are sent together. */
const REPORT_DELAY_MS = 150;
/** How often the bridge looks for agents installed or removed while it runs. */
const RESCAN_MS = 60_000;
const MAX_BACKOFF_MS = 30_000;

export async function runBridge(options: BridgeOptions): Promise<void> {
  const { log } = options;
  const stopping = new AbortController();
  const signal = AbortSignal.any([options.signal, stopping.signal]);
  const env = options.env ?? process.env;
  const roots = (options.roots ?? [os.homedir()]).map((root) =>
    path.resolve(root),
  );
  const startedAt = new Date().toISOString();
  let state = await readState(options.stateFile);
  const asPerson = createPost(options.server, options.headers, signal);
  let post = state.key
    ? asComputer(options.server, state.key, signal)
    : asPerson;

  const agents = new Map<string, AgentInfo>();
  const found = new Map<string, ResolvedAgent | undefined>();
  const resolveOptions = {
    adapters:
      options.adapters ??
      path.join(path.dirname(options.stateFile), 'adapters'),
    log,
  };
  /**
   * Resolves every agent. A managed adapter not installed yet starts installing, and the agent is found another way
   * meanwhile, unless `waitForInstall`: the scan before the bridge connects does not wait, the later ones do.
   */
  const scan = async (waitForInstall: boolean): Promise<void> => {
    for (const spec of AGENTS) {
      const resolved = await resolveAgent(spec, env, process.platform, {
        ...resolveOptions,
        waitForInstall,
      });
      if (signal.aborted) return;
      found.set(spec.id, resolved);
      agents.set(
        spec.id,
        resolved
          ? agentInfo(spec)
          : { ...agentInfo(spec), problem: 'notInstalled' },
      );
    }
  };
  const computer = (): ComputerInfo => ({
    name: options.name ?? os.hostname(),
    platform: process.platform,
    arch: process.arch,
    host: `${options.client.name} ${options.client.version}`,
    home: os.homedir(),
    roots,
    agents: [...agents.values()],
  });
  /**
   * Registers the computer with its key; signed in as the person when it has none or the application refused it,
   * which gives it a new one.
   */
  const register = async (): Promise<string> => {
    const registerSignal = AbortSignal.any([
      signal,
      AbortSignal.timeout(15_000),
    ]);
    const request = (): RegisterRequest => ({
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: state.computerId,
      bridgeStartedAt: startedAt,
      computer: computer(),
    });
    let answer: RegisterResponse;
    try {
      answer = await post<RegisterResponse>(
        BRIDGE_ROUTES.register,
        request(),
        registerSignal,
      );
    } catch (error) {
      if (post === asPerson || !keyRefused(error)) throw error;
      if (options.reconnect === false) throw removed();
      log(
        "The application no longer accepts this computer's key; connecting it again as you.",
      );
      post = asPerson;
      answer = await post<RegisterResponse>(
        BRIDGE_ROUTES.register,
        request(),
        registerSignal,
      );
    }
    const saved = state;
    state = { computerId: answer.computerId, key: answer.key ?? state.key };
    if (state.computerId !== saved.computerId || state.key !== saved.key)
      await writeState(options.stateFile, state);
    if (answer.key) post = asComputer(options.server, answer.key, signal);
    return answer.computerId;
  };
  /** Registers until the application answers, waiting longer after each failure it may recover from. */
  const connect = async (): Promise<string | undefined> => {
    for (let failures = 1; ; failures += 1) {
      try {
        return await register();
      } catch (error) {
        const stopped = error instanceof BridgeStopped ? error : refusal(error);
        if (stopped) throw stopped;
        if (signal.aborted) return undefined;
        if (failures === 1)
          log(
            `Cannot reach ${options.server} (${message(error)}); trying again.`,
          );
        await sleep(backoff(failures), signal);
      }
    }
  };

  await scan(false);
  const computerId = await connect();
  if (computerId === undefined) return;
  log(
    `This computer is connected to ${options.server} as "${computer().name}".`,
  );
  let probing: Promise<void> | undefined;
  let refused: BridgeUpgradeRequired | undefined;
  const refresh = (): void => {
    if (probing || signal.aborted) return;
    probing = (async () => {
      await scan(true);
      const infos = await probeAgents(
        AGENTS,
        found,
        env,
        options.client,
        signal,
      );
      if (signal.aborted) return;
      for (const info of infos) agents.set(info.id, info);
      // Registration also negotiates protocol upgrades; polls do not carry that handshake.
      await register();
    })()
      .catch((error: unknown) => {
        if (signal.aborted) return;
        // The application was updated under a running bridge: it cannot go on, as when refused at start.
        const stopped = refusal(error);
        if (stopped instanceof BridgeUpgradeRequired) {
          refused = stopped;
          stopping.abort();
          return;
        }
        log(`Could not check the agents: ${message(error)}`);
      })
      .finally(() => {
        probing = undefined;
      });
  };
  refresh();
  const rescan = setInterval(refresh, RESCAN_MS);
  rescan.unref();

  const sessions = new Map<string, BridgeSession>();
  const discoveryShutdown = new AbortController();
  const discoveries = new Set<Promise<void>>();
  const resolve = async (agentId: string): Promise<ResolvedAgent> => {
    const spec = AGENTS.find((candidate) => candidate.id === agentId);
    if (!spec)
      throw new Error(
        `This version of ${options.client.name} cannot run the agent "${agentId}".`,
      );
    // An agent that has a managed adapter but was found another way is resolved again, waiting for its install.
    const known = found.get(agentId);
    const resolved =
      known &&
      (known.managed || !spec.launchers.some((launcher) => launcher.managed))
        ? known
        : await resolveAgent(spec, env, process.platform, {
            ...resolveOptions,
            waitForInstall: true,
          });
    if (!resolved)
      throw new Error(`${spec.name} is not installed on this computer.`);
    found.set(agentId, resolved);
    return resolved;
  };
  const discover = async (
    command: Extract<BridgeCommand, { type: 'discoverChoices' }>,
  ): Promise<void> => {
    const started = Date.now();
    const timing = (phase: string): void => {
      if (env.NOCOBASE_ACP_DIAGNOSTICS === '1')
        log(
          JSON.stringify({
            phase,
            at: Date.now(),
            durationMs: Date.now() - started,
            requestId: command.requestId,
          }),
        );
    };
    timing('discoveryReceived');
    const discoverySignal = AbortSignal.any([
      signal,
      discoveryShutdown.signal,
      AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
    ]);
    const session = new BridgeSession(
      {
        id: command.requestId,
        agentId: command.agentId,
        cwd: command.cwd,
        settings: command.settings,
        acpSessionId: null,
      },
      {
        client: options.client,
        env,
        roots,
        resolve,
        emit: () => undefined,
        stateChanged: () => undefined,
        discoverySignal,
      },
    );
    let reply: ReplyRequest;
    try {
      reply = {
        computerId,
        requestId: command.requestId,
        listing: null,
        discovery: await session.discover(),
        error: null,
      };
    } catch (error) {
      reply = {
        computerId,
        requestId: command.requestId,
        listing: null,
        error: (discoverySignal.aborted
          ? 'Agent settings discovery was stopped or timed out. Retry settings.'
          : message(error)
        ).slice(0, 2000),
      };
    }
    // Start cleanup immediately, but do not hold the answer behind the process-group grace period.
    // This discovery remains tracked until both delivery and cleanup settle, including on shutdown.
    timing('discoveryReady');
    const closing = session.close().catch((error: unknown) => {
      log(`Could not close the discovery process: ${message(error)}`);
    });
    try {
      if (!signal.aborted)
        await post(BRIDGE_ROUTES.reply, reply).catch((error: unknown) =>
          log(`Could not answer the application: ${message(error)}`),
        );
      timing('discoveryReplied');
    } finally {
      await closing;
      timing('discoveryClosed');
    }
  };
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
    if (command.type === 'discoverChoices') {
      const pending = discover(command);
      discoveries.add(pending);
      void pending
        .finally(() => discoveries.delete(pending))
        .catch((error: unknown) =>
          log(`Could not discover agent settings: ${message(error)}`),
        );
      return;
    }
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
      const diagnostics = env.NOCOBASE_ACP_DIAGNOSTICS === '1';
      let promptId: string | undefined;
      let firstToken = false;
      const timing = (phase: string): void => {
        log(JSON.stringify({ phase, at: Date.now(), sessionId, promptId }));
      };
      session = new BridgeSession(command.session, {
        prepareSession: options.prepareSession,
        client: options.client,
        env,
        roots,
        resolve,
        emit: (event) => {
          if (diagnostics) {
            if (event.kind === 'turnStarted') {
              promptId = event.promptId;
              firstToken = false;
              timing('agentPromptStarted');
            } else if (
              event.kind === 'update' &&
              event.update.sessionUpdate === 'agent_message_chunk' &&
              promptId &&
              !firstToken
            ) {
              firstToken = true;
              timing('agentFirstToken');
            } else if (event.kind === 'turnEnded') {
              timing('agentTurnEnded');
              promptId = undefined;
            }
          }
          reporter.add(sessionId, event);
        },
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
        if (keyRefused(error) && post !== asPerson) throw removed();
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
    clearInterval(rescan);
    stopping.abort();
    await probing;
    discoveryShutdown.abort();
    await Promise.all(discoveries);
    await Promise.all([...sessions.keys()].map(closeSession));
    await reporter.drain();
  }
  if (refused && !options.signal.aborted) throw refused;
}

/** What the application learns of an agent before the bridge has started it. */
function agentInfo(spec: AgentSpec): AgentInfo {
  return {
    id: spec.id,
    name: spec.name,
    version: null,
    ...(spec.modes ? { modes: spec.modes } : {}),
  };
}

/** Starts each of `specs` found here once, to learn its version and whether it speaks ACP. */
async function probeAgents(
  specs: readonly AgentSpec[],
  found: ReadonlyMap<string, ResolvedAgent | undefined>,
  env: NodeJS.ProcessEnv,
  client: { readonly name: string; readonly version: string },
  signal: AbortSignal,
): Promise<AgentInfo[]> {
  return Promise.all(
    specs.map(async (spec): Promise<AgentInfo> => {
      const resolved = found.get(spec.id);
      const info = agentInfo(spec);
      if (!resolved) return { ...info, problem: 'notInstalled' };
      try {
        const agent = await AgentProcess.start(resolved, {
          cwd: os.tmpdir(),
          signal,
          initializeTimeoutMs: 30_000,
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
      } catch {
        return {
          ...info,
          problem: 'failed',
          detail: 'Agent initialization failed or timed out.',
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
      error?: {
        reason?: string;
        message?: string;
        metadata?: Record<string, unknown>;
      };
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
        parsed.error?.metadata,
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
    const protocol = error.metadata?.protocol;
    return new BridgeUpgradeRequired(
      `The application refused this bridge's protocol: ${error.message}`,
      typeof protocol === 'number' ? protocol : undefined,
    );
  }
  if (error.status === 404)
    return new BridgeStopped('The application does not offer agent sessions.');
  return undefined;
}

/** What the bridge remembers of this computer: its id and key, readable by its owner only. */
interface BridgeState {
  readonly computerId: string | null;
  readonly key: string | null;
}

async function readState(file: string): Promise<BridgeState> {
  try {
    const saved = JSON.parse(await readFile(file, 'utf8')) as {
      computerId?: unknown;
      key?: unknown;
    };
    return {
      computerId:
        typeof saved.computerId === 'string' ? saved.computerId : null,
      key: typeof saved.key === 'string' ? saved.key : null,
    };
  } catch {
    return { computerId: null, key: null };
  }
}

/** Replaces the state whole, so a bridge stopped while writing it never leaves it empty or half written. */
async function writeState(file: string, state: BridgeState): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const draft = `${file}.${randomUUID()}.tmp`;
  await writeFile(draft, `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(draft, 0o600);
  await rename(draft, file);
}

/** The computer's key was refused: it was removed in the application, or connected again from elsewhere. */
function removed(): BridgeStopped {
  return new BridgeStopped(
    'This computer is no longer connected: it was removed in the application, or connected again from elsewhere. Start the bridge yourself to connect it again.',
  );
}

/** Whether the application refused the computer's key. */
function keyRefused(error: unknown): boolean {
  return error instanceof BridgeHttpError && error.status === 401;
}

function asComputer(
  server: string,
  key: string,
  stop: AbortSignal,
): ReturnType<typeof createPost> {
  return createPost(server, { [BRIDGE_HEADERS.computerKey]: key }, stop);
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
