/**
 * OpenCode adapter, built on the `opencode serve` HTTP API of OpenCode 2.x.
 *
 * - Each run starts its own server (127.0.0.1, an OS-picked port, a random
 *   basic-auth password) in the work directory, subscribes to its event
 *   stream, creates (or resumes) a session and prompts it. The server is shut
 *   down when the run ends.
 * - The brief is attached as a session instruction entry; if the server
 *   refuses that (the endpoint is experimental), it is prepended to the
 *   first prompt instead.
 * - Permissions: the session's ruleset is `* * ask`, so OpenCode asks before
 *   every tool call (reads included). Each request is answered by the
 *   runner's policy, with the tool's own name and input when the call has
 *   been announced, and each file or command the request names is checked
 *   as well. A denial is answered `reject` with a message for the model.
 * - `steer()` admits the input with `delivery: 'steer'`: OpenCode hands it
 *   to the agent at the next step boundary of the running turn
 *   (`session.inbox.delivered`), or starts a new turn when idle.
 * - The run ends when the session's execution settles and no steered input
 *   is still waiting.
 */
import { execFile } from 'node:child_process';
import { existsSync, constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import { OpencodeClient, OpencodeHttpError } from './opencode/client.ts';
import type {
  FetchFn,
  ModelRef,
  OpencodeEvent,
  PermissionRule,
} from './opencode/client.ts';
import { classifyOpencodeFailure } from './opencode/classify.ts';
import type { OpencodeFailureSignal } from './opencode/classify.ts';
import { launchServer } from './opencode/server.ts';
import type { LaunchFn, ServerHandle } from './opencode/server.ts';
import {
  Channel,
  capInput,
  capText,
  deferred,
  delay,
  denialMessage,
  isRecord,
  messageOf,
  normalizeDecision,
  num,
  str,
} from './opencode/util.ts';
import type { Decision } from './opencode/util.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AdapterSession,
  AgentAdapter,
  RunnerFeature,
  ToolDetection,
  Usage,
} from './types.ts';

export { classifyOpencodeFailure } from './opencode/classify.ts';
export { launchServer } from './opencode/server.ts';
export type { LaunchFn, ServerHandle } from './opencode/server.ts';

/** The adapter speaks the 2.x server API (`/api/...`). */
export const MIN_OPENCODE_VERSION = '2.0.0';

/** The person's own OpenCode configuration file under `configHome`, if there is one. */
export function globalOpencodeConfig(configHome: string): string | undefined {
  return ['opencode.json', 'opencode.jsonc', 'config.json']
    .map((name) => path.join(configHome, 'opencode', name))
    .find((file) => existsSync(file));
}

/**
 * The server's environment. The run's skills folder is OpenCode's extra config directory (`OPENCODE_CONFIG_DIR`,
 * searched like `.opencode/`, whose `skills/` holds skills: https://opencode.ai/docs/config/,
 * https://opencode.ai/docs/skills/), so its skills load next to the repository's and the person's without either
 * being written to. OpenCode 2.x then no longer reads the person's global `opencode.json` (its providers and models
 * are gone, and a run naming one fails "Model unavailable"), so that file is named again as `OPENCODE_CONFIG`.
 */
export function opencodeEnv(session: AdapterSession): Record<string, string> {
  if (!session.skills) return { ...session.env };
  const configHome =
    session.env.XDG_CONFIG_HOME ??
    (session.env.HOME ? path.join(session.env.HOME, '.config') : undefined);
  const global =
    session.env.OPENCODE_CONFIG === undefined && configHome !== undefined
      ? globalOpencodeConfig(configHome)
      : undefined;
  return {
    ...session.env,
    OPENCODE_CONFIG_DIR: session.skills.root,
    ...(global === undefined ? {} : { OPENCODE_CONFIG: global }),
  };
}

/** Asks before every tool call, so each one reaches the runner's policy. */
export const ASK_EVERYTHING: readonly PermissionRule[] = [
  { action: '*', resource: '*', effect: 'ask' },
];

export const INSTRUCTION_KEY = 'nocobase-runner-brief';

/** stop(): interrupt, then SIGTERM, then SIGKILL; well under 5 s in total. */
const INTERRUPT_TIMEOUT_MS = 1000;
const CLOSE_GRACE_MS = 2500;

export interface ExecResult {
  code: number;
  stdout: string;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

export interface OpencodeAdapterOptions {
  /** PATH searched for `opencode`; defaults to the runner's PATH. */
  searchPath?: string;
  /** Extra places to look when it is not on PATH (the installer's default). */
  fallbackPaths?: string[];
  /** Runs a command for detection; replaceable in tests. */
  exec?: ExecFn;
  /** Starts the server; replaceable in tests. */
  launch?: LaunchFn;
  /** HTTP client used to talk to the server; replaceable in tests. */
  fetch?: FetchFn;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

const defaultExec: ExecFn = (file, args) =>
  new Promise((resolve) => {
    execFile(
      file,
      args,
      { timeout: 15_000, maxBuffer: 1024 * 1024 },
      (error, stdout) => {
        const code = error
          ? typeof error.code === 'number'
            ? error.code
            : 1
          : 0;
        resolve({ code, stdout: String(stdout ?? '') });
      },
    );
  });

function parseVersion(text: string): string | undefined {
  return /(\d+\.\d+\.\d+)/.exec(text)?.[1];
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

async function executable(file: string): Promise<boolean> {
  try {
    await access(file, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function findOpencode(
  searchPath: string,
  fallbacks: readonly string[],
): Promise<string | undefined> {
  for (const dir of searchPath.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, 'opencode');
    if (await executable(candidate)) return candidate;
  }
  for (const candidate of fallbacks) {
    if (await executable(candidate)) return candidate;
  }
  return undefined;
}

/** `opencode auth list` prints one line per credential (stored or from the environment). */
function hasCredentials(output: string): boolean {
  return /\b(stored|environment|oauth|api key)\b/i.test(output);
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class OpencodeAdapter implements AgentAdapter {
  readonly kind = 'opencode' as const;
  private readonly exec: ExecFn;
  private readonly launch: LaunchFn;
  private readonly fetchFn?: FetchFn;
  private readonly searchPath?: string;
  private readonly fallbackPaths?: string[];
  private detection?: Promise<ToolDetection>;

  constructor(options: OpencodeAdapterOptions = {}) {
    this.exec = options.exec ?? defaultExec;
    this.launch = options.launch ?? launchServer;
    this.fetchFn = options.fetch;
    this.searchPath = options.searchPath;
    this.fallbackPaths = options.fallbackPaths;
  }

  features(): RunnerFeature[] {
    return ['steer'];
  }

  detect(): Promise<ToolDetection> {
    this.detection ??= this.runDetection();
    return this.detection;
  }

  private async runDetection(): Promise<ToolDetection> {
    const searchPath = this.searchPath ?? process.env.PATH ?? '';
    const home = process.env.HOME;
    const fallbacks =
      this.fallbackPaths ??
      (home ? [path.join(home, '.opencode', 'bin', 'opencode')] : []);
    const found = await findOpencode(searchPath, fallbacks);
    if (!found) return { installed: false, authenticated: false };
    const v = await this.exec(found, ['--version']);
    const version = v.code === 0 ? parseVersion(v.stdout) : undefined;
    // 1.x serves a different API; treat it as not installed for this adapter.
    const installed = Boolean(
      version && compareVersions(version, MIN_OPENCODE_VERSION) >= 0,
    );
    let authenticated = false;
    if (installed) {
      const auth = await this.exec(found, ['auth', 'list']);
      authenticated = auth.code === 0 && hasCredentials(auth.stdout);
    }
    return {
      installed,
      ...(version ? { version } : {}),
      ...(installed ? { path: found } : {}),
      authenticated,
    };
  }

  start(session: AdapterSession): AdapterHandle {
    return new OpencodeRun(session, {
      detect: () => this.detect(),
      launch: this.launch,
      fetch: this.fetchFn,
    }).handle();
  }
}

interface RunDeps {
  detect: () => Promise<ToolDetection>;
  launch: LaunchFn;
  fetch?: FetchFn;
}

interface ToolCall {
  name?: string;
  input?: Record<string, unknown>;
}

interface PendingSteer {
  text: string;
  inputId?: string;
}

type Ending =
  | { kind: 'settled' }
  | { kind: 'stopped' }
  | { kind: 'crashed'; message: string };

/** Splits `provider/model`; the model part may itself contain slashes. */
export function parseModel(model: string): ModelRef | undefined {
  const slash = model.indexOf('/');
  if (slash <= 0 || slash === model.length - 1) return undefined;
  return { providerID: model.slice(0, slash), id: model.slice(slash + 1) };
}

class OpencodeRun {
  private readonly events = new Channel<AdapterEvent>();
  private readonly session: AdapterSession;
  private readonly deps: RunDeps;
  private readonly ending = deferred<Ending>();
  private readonly done: Promise<AdapterResult>;
  private readonly streamAbort = new AbortController();
  private readonly launchAbort = new AbortController();
  private launching?: Promise<ServerHandle>;
  /** Requests sent without waiting (interrupts, form cancels, replies). */
  private readonly background = new Set<Promise<unknown>>();

  private server?: ServerHandle;
  private client?: OpencodeClient;
  private sessionId?: string;
  /** The run's session and the subagent sessions it spawned. */
  private readonly sessions = new Set<string>();
  private readonly toolCalls = new Map<string, ToolCall>();
  private readonly stepModels = new Map<string, string>();
  private readonly usageByModel = new Map<string, Usage>();
  private readonly answeredPermissions = new Set<string>();
  private readonly pendingSteers = new Map<string, PendingSteer>();
  private readonly deliveredInbox = new Set<string>();
  private steersInFlight = 0;
  private rootIdle = false;
  private steps = 0;
  private maxTurnsHit = false;
  private lastText?: { messageId: string; texts: string[] };
  private summary?: string;
  private failure?: OpencodeFailureSignal;
  private stopping = false;
  private finished = false;

  constructor(session: AdapterSession, deps: RunDeps) {
    this.session = session;
    this.deps = deps;
    if (session.abort.aborted) this.stopping = true;
    session.abort.addEventListener('abort', () => void this.stop(), {
      once: true,
    });
    this.done = this.run();
  }

  handle(): AdapterHandle {
    return {
      events: this.events,
      steer: (text, inputId) => this.steer(text, inputId),
      stop: () => this.stop(),
      result: this.done,
    };
  }

  private emit(event: Omit<AdapterEvent, 'at'>): void {
    this.events.push({ at: new Date().toISOString(), ...event });
  }

  // -- control --------------------------------------------------------------

  private async steer(text: string, inputId?: string): Promise<boolean> {
    if (this.finished || this.stopping || !this.client || !this.sessionId)
      return false;
    this.steersInFlight += 1;
    try {
      const inboxId = await this.client.prompt(this.sessionId, text, 'steer');
      if (!inboxId) return false;
      if (this.deliveredInbox.has(inboxId)) this.acknowledge(text, inputId);
      else this.pendingSteers.set(inboxId, { text, inputId });
      return true;
    } catch {
      return false;
    } finally {
      this.steersInFlight -= 1;
      this.maybeSettle();
    }
  }

  private async stop(): Promise<void> {
    if (!this.finished && !this.stopping) {
      this.stopping = true;
      this.ending.resolve({ kind: 'stopped' });
    }
    await this.done;
  }

  private maybeSettle(): void {
    if (
      this.rootIdle &&
      this.pendingSteers.size === 0 &&
      this.steersInFlight === 0
    )
      this.ending.resolve({ kind: 'settled' });
  }

  // -- the run --------------------------------------------------------------

  private async run(): Promise<AdapterResult> {
    let thrown: unknown;
    let ending: Ending = { kind: 'stopped' };
    try {
      if (this.stopping) throw new Error('aborted before start');
      ending = await Promise.race([this.begin(), this.ending.promise]);
    } catch (error) {
      thrown = error;
    }
    this.finished = true;
    await this.shutdown();
    const result = this.outcome(ending, thrown);
    if (result.error)
      this.emit({
        type: 'error',
        content: result.error.message,
        meta: { reason: result.error.reason },
      });
    this.events.close();
    return result;
  }

  /** Starts the server and the session; resolves with the run's ending. */
  private async begin(): Promise<Ending> {
    const { session } = this;
    const detection = await this.deps.detect();
    if (!detection.installed || !detection.path) {
      throw new Error(
        detection.version
          ? `OpenCode ${detection.version} is too old; the adapter needs ${MIN_OPENCODE_VERSION} or newer (spawn refused)`
          : 'OpenCode executable not found (ENOENT)',
      );
    }
    this.launching = this.deps.launch({
      binary: detection.path,
      cwd: session.workDir,
      env: opencodeEnv(session),
      signal: this.launchAbort.signal,
    });
    this.server = await this.launching;
    if (this.stopping) return { kind: 'stopped' };
    void this.server.exited.then(({ code, signal }) =>
      this.ending.resolve({
        kind: 'crashed',
        message: `OpenCode server exited unexpectedly (${signal ? `killed by signal ${signal}` : `exited with code ${code}`})`,
      }),
    );
    const client = new OpencodeClient({
      baseUrl: this.server.baseUrl,
      username: this.server.username,
      password: this.server.password,
      fetch: this.deps.fetch,
    });
    this.client = client;

    const stream = await client.events(this.streamAbort.signal);
    void this.consume(stream);

    const model = await this.resolveModel(client);
    let sessionId: string;
    if (session.resumeSessionId) {
      sessionId = (await client.getSession(session.resumeSessionId)).id;
      await client.updateSession(sessionId, {
        permissions: [...ASK_EVERYTHING],
      });
      if (model) await client.switchModel(sessionId, model);
    } else {
      sessionId = (
        await client.createSession({
          title: 'Agent run',
          location: { directory: session.workDir },
          permissions: [...ASK_EVERYTHING],
          ...(model ? { model } : {}),
        })
      ).id;
    }
    this.sessionId = sessionId;
    this.sessions.add(sessionId);

    let prompt = session.prompt;
    if (session.systemPrompt) {
      try {
        await client.putInstruction(
          sessionId,
          INSTRUCTION_KEY,
          session.systemPrompt,
        );
      } catch {
        prompt = `<instructions>\n${session.systemPrompt}\n</instructions>\n\n${session.prompt}`;
      }
    }
    this.emit({
      type: 'status',
      content: 'started',
      meta: {
        sessionId,
        ...(model ? { model: `${model.providerID}/${model.id}` } : {}),
        ...(detection.version ? { opencodeVersion: detection.version } : {}),
        ...(session.resumeSessionId ? { resumed: true } : {}),
      },
    });
    if (this.stopping) return { kind: 'stopped' };
    this.rootIdle = false;
    await client.prompt(sessionId, prompt);
    return this.ending.promise;
  }

  private async resolveModel(
    client: OpencodeClient,
  ): Promise<ModelRef | undefined> {
    const { model, effort } = this.session;
    if (!model) return undefined;
    let ref = parseModel(model);
    if (!ref || effort) {
      try {
        const models = await client.listModels();
        const match = models.find(
          (m) =>
            (ref &&
              m.providerID === ref.providerID &&
              (m.modelID === ref.id || m.id === ref.id)) ||
            (!ref &&
              (m.modelID === model ||
                m.id === model ||
                `${m.providerID}/${m.modelID ?? m.id}` === model)),
        );
        if (match) {
          ref = { providerID: match.providerID, id: match.modelID ?? match.id };
          if (effort && match.variants?.some((v) => v.id === effort))
            ref.variant = effort;
        }
      } catch {
        // keep what the name says
      }
    }
    return ref;
  }

  private async consume(stream: AsyncIterable<OpencodeEvent>): Promise<void> {
    try {
      for await (const event of stream) this.onEvent(event);
    } catch {
      // the stream ends with an error when the run aborts it
    }
    if (!this.finished)
      this.ending.resolve({
        kind: 'crashed',
        message: 'The OpenCode event stream ended unexpectedly',
      });
  }

  private track(task: Promise<unknown>): void {
    const settled = task.catch(() => {});
    this.background.add(settled);
    void settled.then(() => this.background.delete(settled));
  }

  private async shutdown(): Promise<void> {
    const { client, sessionId, server } = this;
    if (!this.stopping && this.background.size > 0)
      await Promise.race([
        Promise.all(this.background),
        delay(INTERRUPT_TIMEOUT_MS),
      ]);
    if (this.stopping && client && sessionId) {
      await client.interrupt(sessionId, INTERRUPT_TIMEOUT_MS).catch(() => {});
    }
    this.streamAbort.abort();
    this.launchAbort.abort();
    // A server still starting is killed by the abort; one that just came up
    // is closed like any other.
    const started = server ?? (await this.launching?.catch(() => undefined));
    if (started) await started.close(CLOSE_GRACE_MS).catch(() => {});
  }

  private outcome(ending: Ending, thrown: unknown): AdapterResult {
    const base = {
      usage: this.usage(),
      ...(this.sessionId ? { sessionId: this.sessionId } : {}),
    };
    if (this.stopping) {
      return {
        ...base,
        exit: 'aborted',
        error: { reason: 'cancelled', message: 'Stopped by the runner' },
      };
    }
    if (this.maxTurnsHit) {
      return {
        ...base,
        exit: 'error',
        error: {
          reason: 'unknown',
          message: `Reached the maximum number of turns (${this.session.maxTurns})`,
        },
      };
    }
    const stderr = this.server?.stderr().slice(-5) ?? [];
    let signal: OpencodeFailureSignal | undefined;
    if (thrown !== undefined) {
      signal = {
        error: thrown,
        ...(thrown instanceof OpencodeHttpError
          ? { status: thrown.status }
          : {}),
        details: stderr,
      };
    } else if (ending.kind === 'crashed') {
      signal = { error: ending.message, details: stderr };
    } else if (this.failure) {
      signal = this.failure;
    }
    if (!signal) {
      return {
        ...base,
        exit: 'completed',
        ...(this.summary !== undefined ? { summary: this.summary } : {}),
      };
    }
    const error = classifyOpencodeFailure(signal);
    // A crash or a thrown error that names no cause is the tool process failing.
    if (
      error.reason === 'unknown' &&
      (thrown !== undefined || ending.kind === 'crashed')
    )
      error.reason = 'toolProcess';
    return { ...base, exit: 'error', error };
  }

  private usage(): Usage[] {
    return [...this.usageByModel.values()].map((u) => ({ ...u }));
  }

  private addUsage(model: string | undefined, tokens: unknown): void {
    if (!isRecord(tokens)) return;
    const key = model ?? '';
    const cache = isRecord(tokens.cache) ? tokens.cache : {};
    const prev = this.usageByModel.get(key) ?? {
      tool: 'opencode',
      ...(model ? { model } : {}),
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
    };
    this.usageByModel.set(key, {
      ...prev,
      inputTokens: prev.inputTokens + num(tokens.input),
      // OpenCode counts reasoning apart from output (and charges it at the output rate); Usage's output includes it.
      outputTokens:
        prev.outputTokens + num(tokens.output) + num(tokens.reasoning),
      cacheReadTokens: (prev.cacheReadTokens ?? 0) + num(cache.read),
      cacheWriteTokens: (prev.cacheWriteTokens ?? 0) + num(cache.write),
      reasoningTokens: (prev.reasoningTokens ?? 0) + num(tokens.reasoning),
    });
  }

  // -- events ---------------------------------------------------------------

  private acknowledge(text: string, inputId: string | undefined): void {
    const capped = capText(text);
    this.emit({
      type: 'input',
      content: capped.text,
      meta: {
        ...(inputId ? { inputId } : {}),
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
  }

  private onEvent(event: OpencodeEvent): void {
    const { data } = event;
    if (event.type === 'session.created') {
      const parent = str(data.parentID);
      const id = str(data.sessionID);
      if (id && parent && this.sessions.has(parent)) this.sessions.add(id);
      return;
    }
    if (event.type === 'permission.asked') {
      this.track(this.onPermission(data));
      return;
    }
    if (event.type === 'form.created') {
      const form = isRecord(data.form) ? data.form : {};
      const formId = str(form.id);
      const sid = str(form.sessionID);
      if (formId && sid && this.sessions.has(sid)) {
        this.emit({
          type: 'status',
          content: 'formCancelled',
          meta: { formId, title: str(form.title) },
        });
        if (this.client) this.track(this.client.cancelForm(sid, formId));
      }
      return;
    }
    const sid = str(data.sessionID);
    if (!sid || !this.sessions.has(sid)) return;
    const root = sid === this.sessionId;
    const child = root ? {} : { childSessionId: sid };

    switch (event.type) {
      case 'session.inbox.delivered': {
        const inboxId = str(data.inboxID);
        if (!inboxId || !root) return;
        this.deliveredInbox.add(inboxId);
        const steer = this.pendingSteers.get(inboxId);
        if (!steer) return;
        this.pendingSteers.delete(inboxId);
        this.acknowledge(steer.text, steer.inputId);
        return;
      }
      case 'session.execution.started':
        if (root) this.rootIdle = false;
        return;
      case 'session.step.started': {
        const messageId = str(data.assistantMessageID);
        const model = isRecord(data.model) ? data.model : undefined;
        if (messageId && model)
          this.stepModels.set(
            messageId,
            `${str(model.providerID) ?? ''}/${str(model.id) ?? ''}`,
          );
        if (root) {
          this.steps += 1;
          const max = this.session.maxTurns;
          if (max && this.steps > max && !this.maxTurnsHit) {
            this.maxTurnsHit = true;
            if (this.client)
              this.track(this.client.interrupt(sid, INTERRUPT_TIMEOUT_MS));
          }
        }
        return;
      }
      case 'session.text.ended': {
        const text = str(data.text) ?? '';
        const messageId = str(data.assistantMessageID) ?? '';
        const capped = capText(text);
        this.emit({
          type: 'text',
          content: capped.text,
          meta: { ...child, ...(capped.truncated ? { truncated: true } : {}) },
        });
        if (root) {
          if (this.lastText?.messageId === messageId)
            this.lastText.texts.push(text);
          else this.lastText = { messageId, texts: [text] };
        }
        return;
      }
      case 'session.reasoning.ended': {
        const capped = capText(str(data.text) ?? '');
        if (!capped.text) return;
        this.emit({
          type: 'thinking',
          content: capped.text,
          meta: { ...child, ...(capped.truncated ? { truncated: true } : {}) },
        });
        return;
      }
      case 'session.tool.input.started': {
        const id = str(data.id);
        if (id)
          this.toolCalls.set(id, {
            ...this.toolCalls.get(id),
            name: str(data.name),
          });
        return;
      }
      case 'session.tool.called': {
        const id = str(data.id);
        if (!id) return;
        const input = isRecord(data.input) ? data.input : {};
        const call = { ...this.toolCalls.get(id), input };
        this.toolCalls.set(id, call);
        const capped = capInput(input);
        this.emit({
          type: 'toolUse',
          tool: call.name ?? str(data.name),
          input: capped.input,
          meta: {
            toolUseId: id,
            ...child,
            ...(capped.truncated ? { truncated: true } : {}),
          },
        });
        return;
      }
      case 'session.tool.success':
      case 'session.tool.failed': {
        const id = str(data.id);
        if (!id) return;
        const failed = event.type === 'session.tool.failed';
        const error = isRecord(data.error) ? data.error : undefined;
        const text = [
          ...(failed && error ? [str(error.message) ?? ''] : []),
          toolContentText(data.content),
        ]
          .filter(Boolean)
          .join('\n');
        const capped = capText(text);
        this.emit({
          type: 'toolResult',
          tool: this.toolCalls.get(id)?.name,
          output: capped.text,
          meta: {
            toolUseId: id,
            isError: failed,
            ...child,
            ...(capped.truncated ? { truncated: true } : {}),
          },
        });
        return;
      }
      case 'session.step.ended':
      case 'session.step.failed': {
        const messageId = str(data.assistantMessageID);
        this.addUsage(
          messageId ? this.stepModels.get(messageId) : undefined,
          data.tokens,
        );
        if (event.type === 'session.step.failed' && root)
          this.failure = structuredFailure(data.error);
        return;
      }
      case 'session.compaction.started':
        this.emit({
          type: 'status',
          content: 'compacting',
          meta: { ...child, reason: str(data.reason) },
        });
        return;
      case 'session.compaction.ended': {
        const model = isRecord(data.model) ? data.model : undefined;
        this.addUsage(
          model
            ? `${str(model.providerID) ?? ''}/${str(model.id) ?? ''}`
            : undefined,
          data.tokens,
        );
        this.emit({ type: 'status', content: 'compacted', meta: child });
        return;
      }
      case 'session.compaction.failed': {
        const failure = structuredFailure(data.error);
        this.emit({
          type: 'error',
          content: messageOf(failure.error) || 'Compaction failed',
          meta: {
            reason: classifyOpencodeFailure(failure).reason,
            ...child,
          },
        });
        return;
      }
      case 'session.retry.scheduled': {
        const error = isRecord(data.error) ? data.error : {};
        this.emit({
          type: 'status',
          content: 'retrying',
          meta: {
            ...child,
            attempt: data.attempt,
            at: data.at,
            errorType: str(error.type),
            error: str(error.message),
            ...(typeof error.status === 'number'
              ? { errorStatus: error.status }
              : {}),
          },
        });
        return;
      }
      case 'session.execution.succeeded':
      case 'session.execution.failed':
      case 'session.execution.interrupted':
        if (root) this.onSettled(event);
        return;
      default:
        return;
    }
  }

  private onSettled(event: OpencodeEvent): void {
    const { data } = event;
    const outcome = event.type.slice('session.execution.'.length);
    if (outcome === 'failed') this.failure = structuredFailure(data.error);
    else if (outcome === 'interrupted' && !this.stopping && !this.maxTurnsHit)
      this.failure = {
        error: `OpenCode interrupted the session (${str(data.reason) ?? 'unknown'})`,
      };
    else if (outcome === 'succeeded') {
      this.failure = undefined;
      if (this.lastText) this.summary = this.lastText.texts.join('\n');
    }
    this.emit({
      type: 'status',
      content: 'turnCompleted',
      meta: {
        outcome,
        steps: this.steps,
        ...(isRecord(data.error) ? { error: data.error } : {}),
        ...(str(data.reason) ? { reason: str(data.reason) } : {}),
      },
    });
    this.emit({ type: 'usage', meta: { usage: this.usage() } });
    this.rootIdle = true;
    // A failed or interrupted turn ends the run; a steer waits for its turn.
    if (outcome !== 'succeeded') this.ending.resolve({ kind: 'settled' });
    else this.maybeSettle();
  }

  // -- permissions ----------------------------------------------------------

  private async onPermission(data: Record<string, unknown>): Promise<void> {
    const requestId = str(data.id);
    const sid = str(data.sessionID);
    if (!requestId || !sid || !this.sessions.has(sid)) return;
    if (this.answeredPermissions.has(requestId)) return;
    this.answeredPermissions.add(requestId);

    const action = str(data.action) ?? 'unknown';
    const resources = Array.isArray(data.resources)
      ? data.resources.filter((r): r is string => typeof r === 'string')
      : [];
    const source = isRecord(data.source) ? data.source : {};
    const toolUseId = str(source.id);
    const call = toolUseId ? this.toolCalls.get(toolUseId) : undefined;
    const tool = call?.name ?? action;
    const input = call?.input ?? fallbackInput(action, resources);

    const decision = await this.decide(tool, input, action, resources);
    if (this.finished || this.stopping) return;
    const capped = capInput(input);
    this.emit({
      type: 'permission',
      tool,
      input: capped.input,
      meta: {
        decision: decision.allow ? 'allow' : 'deny',
        ...(decision.reason ? { reason: decision.reason } : {}),
        ...(toolUseId ? { toolUseId } : {}),
        action,
        ...(resources.length ? { resources } : {}),
        ...(sid !== this.sessionId ? { childSessionId: sid } : {}),
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
    try {
      if (decision.allow)
        await this.client?.replyPermission(sid, requestId, 'once');
      else
        await this.client?.replyPermission(
          sid,
          requestId,
          'reject',
          denialMessage(decision.reason),
        );
    } catch (error) {
      if (!this.finished && !this.stopping)
        this.emit({
          type: 'error',
          content: `Could not answer an OpenCode permission request: ${messageOf(error)}`,
          meta: { reason: 'toolProcess', requestId },
        });
    }
  }

  /**
   * The tool call itself, then every file or command the request names
   * (a patch can touch files its input does not spell out as a path).
   */
  private async decide(
    tool: string,
    input: Record<string, unknown>,
    action: string,
    resources: readonly string[],
  ): Promise<Decision> {
    const checks: [string, Record<string, unknown>][] = [[tool, input]];
    if (action === 'read' || action === 'edit') {
      for (const resource of resources)
        if (resource && resource !== '*')
          checks.push([action, { path: resource }]);
    } else if (action === 'shell' && tool !== 'shell') {
      for (const resource of resources)
        checks.push(['shell', { command: resource }]);
    }
    for (const [name, value] of checks) {
      let decision: Decision;
      try {
        decision = normalizeDecision(
          await this.session.permission(name, value),
        );
      } catch (error) {
        decision = {
          allow: false,
          reason: `Policy error: ${messageOf(error)}`,
        };
      }
      if (!decision.allow) return decision;
    }
    return { allow: true };
  }
}

function fallbackInput(
  action: string,
  resources: readonly string[],
): Record<string, unknown> {
  if (action === 'shell') return { command: resources.join('\n') };
  if ((action === 'read' || action === 'edit') && resources.length === 1)
    return { path: resources[0] };
  return { resources: [...resources] };
}

function structuredFailure(error: unknown): OpencodeFailureSignal {
  if (!isRecord(error)) return { error: 'OpenCode run failed' };
  return {
    error: str(error.message) ?? '',
    errorType: str(error.type),
    ...(typeof error.status === 'number' ? { status: error.status } : {}),
  };
}

function toolContentText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((item: unknown) => {
      if (!isRecord(item)) return '';
      if (item.type === 'text') return str(item.text) ?? '';
      return `[${str(item.type) ?? 'content'}]`;
    })
    .filter(Boolean)
    .join('\n');
}

/** The longest stop() waits for OpenCode before killing it. */
export const STOP_BUDGET_MS: number = INTERRUPT_TIMEOUT_MS + CLOSE_GRACE_MS;

export function createOpencodeAdapter(
  options?: OpencodeAdapterOptions,
): OpencodeAdapter {
  return new OpencodeAdapter(options);
}
