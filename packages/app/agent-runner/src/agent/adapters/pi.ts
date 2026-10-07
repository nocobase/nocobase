/**
 * Pi adapter: drives the machine's installed `pi` (@earendil-works/pi-coding-agent,
 * formerly @mariozechner/pi-coding-agent) in RPC mode, one JSON record per LF
 * line on stdin and stdout.
 *
 * - RPC rather than the in-process SDK, so the runner uses the tool the
 *   machine has installed and configured, as it does for the other tools.
 * - The brief is appended to Pi's system prompt (`--append-system-prompt`
 *   with a temporary file); the prompt is sent with the `prompt` command.
 * - Permissions: Pi has no approval prompt. The adapter loads its own
 *   extension (see ./pi/extension.ts) whose `tool_call` handler asks the
 *   runner's policy about every tool call over the extension UI subprotocol
 *   and blocks what the policy denies. The run refuses to start when the
 *   extension did not load. Other extensions' dialogs are cancelled.
 * - `steer()` sends Pi's `steer` command; Pi delivers it after the current
 *   assistant turn's tool calls, before the next model call. Steers the
 *   agent had not picked up when it settled are sent as a new prompt.
 * - `maxTurns` is enforced here (Pi has no limit): the run is aborted when
 *   the agent starts one turn more than allowed.
 * - Stop: `abort`, close stdin, SIGTERM after 2 s, SIGKILL after 4.5 s.
 */
import { execFile, spawn as nodeSpawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';

import { TOOL_EFFORTS } from '@nocobase/agent-protocol';

import {
  PERMISSION_COMMAND,
  PERMISSION_DIALOG_TITLE,
  PERMISSION_EXTENSION_FILE,
  PERMISSION_EXTENSION_SOURCE,
  parsePermissionRequest,
} from './pi/extension.ts';
import type { PermissionAnswer } from './pi/extension.ts';
import { classifyPiFailure, contentText } from './pi/protocol.ts';
import type {
  PiMessage,
  PiRecord,
  PiResponse,
  PiUiRequest,
} from './pi/protocol.ts';
import {
  Channel,
  JsonlSplitter,
  capInput,
  capText,
  compareVersions,
  findOnPath,
  parseVersion,
} from './pi/util.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AdapterSession,
  AgentAdapter,
  FailureReason,
  PermissionDecision,
  RunnerFeature,
  ToolDetection,
  Usage,
} from './types.ts';

/**
 * Oldest Pi the adapter drives: 0.80.4 added the `agent_settled` event the
 * adapter waits for. The scoped package was renamed at 0.74.0, so any
 * `@mariozechner/pi-coding-agent` install (frozen at 0.73.1) is too old.
 */
export const DEFAULT_MIN_PI_VERSION = '0.80.4';

const THINKING_LEVELS = new Set(TOOL_EFFORTS.pi);
/** Pi tools that only read; their allowed calls are not reported. */
const READ_ONLY_TOOLS = new Set(['read', 'grep', 'find', 'ls']);
/** Pi tool names the runner policy knows under another name. */
const POLICY_TOOL_NAMES: Readonly<Record<string, string>> = {
  ls: 'list',
  find: 'glob',
  powershell: 'shell',
};
const TERM_AFTER_MS = 2000;
const KILL_AFTER_MS = 4500;
const STDERR_KEEP_LINES = 40;

// ---------------------------------------------------------------------------
// Process and detection seams (replaceable in tests)
// ---------------------------------------------------------------------------

export interface PiProcess {
  stdin: Writable;
  stdout: Readable;
  stderr: Readable;
  kill(signal?: NodeJS.Signals): boolean;
  /** After the process exited and its stdio closed. */
  on(event: 'close', listener: (code: number | null) => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
}

export type SpawnFn = (
  file: string,
  args: string[],
  options: { cwd: string; env: Record<string, string> },
) => PiProcess;

export interface ExecResult {
  code: number;
  stdout: string;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

export interface PiAdapterOptions {
  minVersion?: string;
  /** PATH searched for `pi`; defaults to the runner's PATH. */
  searchPath?: string;
  exec?: ExecFn;
  spawn?: SpawnFn;
}

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

const defaultSpawn: SpawnFn = (file, args, options) =>
  nodeSpawn(file, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** `pi --list-models` prints a table headed `provider  model …` when any model has credentials. */
function hasAvailableModels(stdout: string): boolean {
  const lines = stdout.split('\n').filter((line) => line.trim());
  return lines.length > 1 && /^provider\s+model\b/.test(lines[0]);
}

export function normalizeDecision(decision: PermissionDecision): {
  allow: boolean;
  reason?: string;
} {
  if (decision === 'allow') return { allow: true };
  if (decision === 'deny')
    return { allow: false, reason: 'Denied by the runner policy' };
  return { allow: false, reason: decision.deny };
}

/** What the model reads when the policy denies a tool call. */
export function denialMessage(reason: string | undefined): string {
  return `The runner policy denied this tool call${reason ? `: ${reason}` : ''}. This decision is final and nobody can grant it during this run, so do not ask for permission. Continue the task without this call, or use an allowed alternative.`;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class PiAdapter implements AgentAdapter {
  readonly kind = 'pi' as const;
  private readonly minVersion: string;
  private readonly searchPath?: string;
  private readonly exec: ExecFn;
  private readonly spawn: SpawnFn;
  private detection?: Promise<ToolDetection>;

  constructor(options: PiAdapterOptions = {}) {
    this.minVersion = options.minVersion ?? DEFAULT_MIN_PI_VERSION;
    this.searchPath = options.searchPath;
    this.exec = options.exec ?? defaultExec;
    this.spawn = options.spawn ?? defaultSpawn;
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
    const piPath = await findOnPath('pi', searchPath);
    if (!piPath) return { installed: false, authenticated: false };
    const v = await this.exec(piPath, ['--version']);
    const version = v.code === 0 ? parseVersion(v.stdout) : undefined;
    if (!version) return { installed: false, authenticated: false };
    const models = await this.exec(piPath, ['--offline', '--list-models']);
    return {
      installed: true,
      version,
      path: piPath,
      authenticated: models.code === 0 && hasAvailableModels(models.stdout),
    };
  }

  start(session: AdapterSession): AdapterHandle {
    return new PiRun(session, {
      detect: () => this.detect(),
      spawn: this.spawn,
      minVersion: this.minVersion,
    }).handle();
  }
}

interface RunDeps {
  detect: () => Promise<ToolDetection>;
  spawn: SpawnFn;
  minVersion: string;
}

interface PendingSteer {
  text: string;
  inputId?: string;
}

class SetupError extends Error {
  readonly reason: FailureReason;
  constructor(reason: FailureReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

class PiRun {
  private readonly events = new Channel<AdapterEvent>();
  private readonly session: AdapterSession;
  private readonly deps: RunDeps;
  private readonly done: Promise<AdapterResult>;
  private child?: PiProcess;
  private exited?: Promise<void>;
  private tempDir?: string;
  private piPath?: string;
  private piVersion?: string;
  private nextId = 0;
  private readonly requests = new Map<string, (r: PiResponse) => void>();
  private readonly stderrLines: string[] = [];
  private readonly toolNames = new Map<string, string>();
  private readonly usageByModel = new Map<string, Usage>();
  /** Steers accepted by Pi that the agent has not picked up yet. */
  private pendingSteers: PendingSteer[] = [];
  /** Steers re-sent as a prompt after the agent settled without them. */
  private resentSteers?: { text: string; steers: PendingSteer[] };
  private sessionId?: string;
  private lastAssistant?: PiMessage;
  private lastRetryError?: string;
  private turns = 0;
  private maxTurnsHit = false;
  /** Resolves true once Pi accepted the first prompt, false if it never will. */
  private readonly ready: Promise<boolean>;
  private markReady!: (ready: boolean) => void;
  /** Between `agent_settled` and the decision to finish or re-prompt. */
  private settling = false;
  private stopping = false;
  private finished = false;
  private outcome?: AdapterResult;

  constructor(session: AdapterSession, deps: RunDeps) {
    this.session = session;
    this.deps = deps;
    if (session.abort.aborted) this.stopping = true;
    session.abort.addEventListener('abort', () => void this.stop(), {
      once: true,
    });
    this.ready = new Promise((resolve) => {
      this.markReady = resolve;
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

  // -- wire ------------------------------------------------------------------

  private send(record: Record<string, unknown>): void {
    const stdin = this.child?.stdin;
    if (!stdin || stdin.destroyed || stdin.writableEnded) return;
    stdin.write(`${JSON.stringify(record)}\n`);
  }

  /** Sends a command and waits for its response (undefined if Pi exits first). */
  private request(
    type: string,
    fields: Record<string, unknown> = {},
  ): Promise<PiResponse | undefined> {
    if (!this.child || this.finished) return Promise.resolve(undefined);
    this.nextId += 1;
    const id = `runner-${this.nextId}`;
    return new Promise((resolve) => {
      this.requests.set(id, resolve);
      this.send({ id, type, ...fields });
    });
  }

  private onLine(line: string): void {
    let record: PiRecord;
    try {
      record = JSON.parse(line) as PiRecord;
    } catch {
      return;
    }
    if (!record || typeof record !== 'object') return;
    if (record.type === 'response') {
      const response = record as unknown as PiResponse;
      const resolve = response.id ? this.requests.get(response.id) : undefined;
      if (resolve) {
        this.requests.delete(response.id!);
        resolve(response);
      }
      return;
    }
    if (record.type === 'extension_ui_request') {
      void this.onUiRequest(record as unknown as PiUiRequest);
      return;
    }
    this.onEvent(record);
  }

  // -- lifecycle -------------------------------------------------------------

  private async run(): Promise<AdapterResult> {
    try {
      if (this.stopping)
        throw new SetupError('cancelled', 'aborted before start');
      const args = await this.prepare();
      if (this.stopping)
        throw new SetupError('cancelled', 'aborted before start');
      this.launch(args);
      await this.handshake();
      if (!this.stopping) await this.sendPrompt();
    } catch (error) {
      if (!this.outcome && !this.stopping) {
        this.outcome = this.failure(
          error instanceof SetupError
            ? { reason: error.reason, message: error.message }
            : classifyPiFailure({
                message: error instanceof Error ? error.message : String(error),
              }),
        );
      }
      this.closeInput();
      void this.reap();
    }
    this.markReady(false);
    if (this.exited) await this.exited;
    this.finished = true;
    for (const resolve of this.requests.values()) resolve(undefined as never);
    this.requests.clear();
    if (this.tempDir)
      await rm(this.tempDir, { recursive: true, force: true }).catch(() => {});

    const result = this.result();
    if (result.error)
      this.emit({
        type: 'error',
        content: result.error.message,
        meta: { reason: result.error.reason },
      });
    this.events.close();
    return result;
  }

  private async prepare(): Promise<string[]> {
    const detection = await this.deps.detect();
    if (!detection.installed || !detection.path) {
      throw new SetupError(
        'toolProcess',
        'Pi is not installed on this host (no `pi` on PATH); install @earendil-works/pi-coding-agent',
      );
    }
    if (compareVersions(detection.version!, this.deps.minVersion) < 0) {
      throw new SetupError(
        'toolProcess',
        `Pi ${detection.version} is older than ${this.deps.minVersion}, the oldest version the runner drives; update @earendil-works/pi-coding-agent`,
      );
    }
    this.piPath = detection.path;
    this.piVersion = detection.version;

    this.tempDir = await mkdtemp(path.join(tmpdir(), 'nocobase-runner-pi-'));
    const extension = path.join(this.tempDir, PERMISSION_EXTENSION_FILE);
    await writeFile(extension, PERMISSION_EXTENSION_SOURCE);
    const args = ['--mode', 'rpc', '--extension', extension];
    if (this.session.systemPrompt) {
      const brief = path.join(this.tempDir, 'brief.md');
      await writeFile(brief, this.session.systemPrompt);
      args.push('--append-system-prompt', brief);
    }
    if (this.session.model) args.push('--model', this.session.model);
    if (this.session.effort && THINKING_LEVELS.has(this.session.effort))
      args.push('--thinking', this.session.effort);
    if (this.session.resumeSessionId)
      args.push('--session-id', this.session.resumeSessionId);
    // One `--skill <dir>` per skill of the run (repeatable, additive to Pi's own discovery:
    // https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/cli/args.ts).
    for (const slug of this.session.skills?.slugs ?? [])
      args.push('--skill', path.join(this.session.skills!.dir, slug));
    return args;
  }

  private launch(args: string[]): void {
    const child = this.deps.spawn(this.piPath!, args, {
      cwd: this.session.workDir,
      env: { ...this.session.env },
    });
    this.child = child;
    const splitter = new JsonlSplitter((line) => this.onLine(line));
    child.stdout.on('data', (chunk: Buffer) => splitter.write(chunk));
    child.stdout.on('end', () => splitter.end());
    child.stderr.on('data', (chunk: Buffer) => {
      this.stderrLines.push(...String(chunk).split('\n').filter(Boolean));
      this.stderrLines.splice(
        0,
        Math.max(0, this.stderrLines.length - STDERR_KEEP_LINES),
      );
    });
    child.stdin.on('error', () => {
      // Pi exited; the exit handler reports it.
    });
    this.exited = new Promise((resolve) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        if (error && !this.outcome && !this.stopping) {
          this.outcome = this.failure({
            reason: 'toolProcess',
            message: `Failed to start pi: ${error.message}`,
          });
        }
        this.finished = true;
        for (const resolveRequest of this.requests.values())
          resolveRequest(undefined as never);
        this.requests.clear();
        resolve();
      };
      child.on('close', () => finish());
      child.on('error', (error) => finish(error));
    });
  }

  /** Confirms the permission bridge loaded and learns the session id. */
  private async handshake(): Promise<void> {
    const commands = await this.request('get_commands');
    if (!commands) throw this.exitError('before it answered get_commands');
    const list = (commands.data?.commands ?? []) as { name?: string }[];
    if (!commands.success || !list.some((c) => c.name === PERMISSION_COMMAND)) {
      throw new SetupError(
        'setupFailed',
        'The runner permission extension did not load into Pi, so tool calls could not be checked; the run was not started',
      );
    }
    const state = await this.request('get_state');
    if (!state) throw this.exitError('before it answered get_state');
    const data = state.data ?? {};
    if (typeof data.sessionId === 'string') this.sessionId = data.sessionId;
    const model = data.model as { id?: string; provider?: string } | undefined;
    this.emit({
      type: 'status',
      content: 'started',
      meta: {
        ...(this.sessionId ? { sessionId: this.sessionId } : {}),
        ...(model?.id ? { model: model.id } : {}),
        ...(model?.provider ? { provider: model.provider } : {}),
        ...(typeof data.thinkingLevel === 'string'
          ? { thinkingLevel: data.thinkingLevel }
          : {}),
        piVersion: this.piVersion,
      },
    });
  }

  private async sendPrompt(): Promise<void> {
    const response = await this.request('prompt', {
      message: this.session.prompt,
    });
    if (!response) throw this.exitError('before it accepted the prompt');
    if (!response.success) {
      throw new Error(response.error ?? 'Pi rejected the prompt');
    }
    this.markReady(true);
    // An extension command consumed the prompt; no run follows.
    if (response.data?.disposition === 'handled') this.complete();
  }

  private exitError(when: string): Error {
    const stderr = this.stderrLines.slice(-5).join('\n');
    return new Error(`pi process exited ${when}${stderr ? `: ${stderr}` : ''}`);
  }

  private closeInput(): void {
    const stdin = this.child?.stdin;
    if (stdin && !stdin.destroyed && !stdin.writableEnded) stdin.end();
  }

  /** The agent settled with nothing queued: record the outcome and let Pi exit. */
  private complete(): void {
    if (this.outcome || this.stopping) return;
    this.outcome = this.settledOutcome();
    this.closeInput();
    void this.reap();
  }

  /** Ends the process if it does not exit by itself after stdin closed. */
  private async reap(): Promise<void> {
    const exited = this.exited;
    if (!exited) return;
    const wait = (ms: number) =>
      new Promise<'timeout'>((resolve) =>
        setTimeout(() => resolve('timeout'), ms).unref(),
      );
    if ((await Promise.race([exited, wait(TERM_AFTER_MS)])) !== 'timeout')
      return;
    this.child?.kill('SIGTERM');
    if (
      (await Promise.race([exited, wait(KILL_AFTER_MS - TERM_AFTER_MS)])) !==
      'timeout'
    )
      return;
    this.child?.kill('SIGKILL');
  }

  private async stop(): Promise<void> {
    if (!this.stopping && !this.outcome) {
      this.stopping = true;
      if (this.child && !this.finished) {
        this.send({ type: 'clear_queue' });
        this.send({ type: 'abort' });
        this.closeInput();
        void this.reap();
      }
    }
    await this.done;
  }

  /** Waits for the first prompt to be accepted, then queues the steer in Pi. */
  private async steer(text: string, inputId?: string): Promise<boolean> {
    if (!(await this.ready)) return false;
    if (this.finished || this.stopping || this.settling || this.outcome)
      return false;
    const steer: PendingSteer = { text, ...(inputId ? { inputId } : {}) };
    this.pendingSteers.push(steer);
    const response = await this.request('steer', { message: text });
    if (!response?.success) {
      this.pendingSteers = this.pendingSteers.filter((s) => s !== steer);
      return false;
    }
    if (response.data?.disposition === 'handled') {
      this.pendingSteers = this.pendingSteers.filter((s) => s !== steer);
      this.acknowledge([steer]);
    }
    return true;
  }

  private acknowledge(steers: readonly PendingSteer[]): void {
    for (const steer of steers) {
      const capped = capText(steer.text);
      this.emit({
        type: 'input',
        content: capped.text,
        meta: {
          ...(steer.inputId ? { inputId: steer.inputId } : {}),
          ...(capped.truncated ? { truncated: true } : {}),
        },
      });
    }
  }

  // -- permissions -----------------------------------------------------------

  private async onUiRequest(request: PiUiRequest): Promise<void> {
    const dialog = ['select', 'confirm', 'input', 'editor'].includes(
      request.method,
    );
    if (
      request.method === 'input' &&
      request.title === PERMISSION_DIALOG_TITLE
    ) {
      const call = parsePermissionRequest(request.placeholder);
      let answer: PermissionAnswer = {
        allow: false,
        message: denialMessage('the call could not be read'),
      };
      if (call) {
        const decision = await this.decide(call.toolName, call.input);
        this.report(call.toolName, call.input, call.toolCallId, decision);
        answer = decision.allow
          ? { allow: true }
          : { allow: false, message: denialMessage(decision.reason) };
      }
      this.send({
        type: 'extension_ui_response',
        id: request.id,
        value: JSON.stringify(answer),
      });
      return;
    }
    if (dialog) {
      // Nobody can answer another extension's dialog during a run.
      this.send({
        type: 'extension_ui_response',
        id: request.id,
        cancelled: true,
      });
      this.emit({
        type: 'status',
        content: 'dialogCancelled',
        meta: { method: request.method, title: request.title },
      });
      return;
    }
    if (request.method === 'notify' && request.notifyType === 'error') {
      this.emit({
        type: 'status',
        content: 'extensionNotice',
        meta: { message: request.message },
      });
    }
  }

  private async decide(
    tool: string,
    input: Record<string, unknown>,
  ): Promise<{ allow: boolean; reason?: string }> {
    try {
      return normalizeDecision(
        await this.session.permission(POLICY_TOOL_NAMES[tool] ?? tool, input),
      );
    } catch (error) {
      return {
        allow: false,
        reason: `Policy error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private report(
    tool: string,
    input: unknown,
    toolUseId: string,
    decision: { allow: boolean; reason?: string },
  ): void {
    if (decision.allow && READ_ONLY_TOOLS.has(tool)) return;
    const capped = capInput(input);
    this.emit({
      type: 'permission',
      tool,
      input: capped.input,
      meta: {
        decision: decision.allow ? 'allow' : 'deny',
        ...(decision.reason ? { reason: decision.reason } : {}),
        ...(toolUseId ? { toolUseId } : {}),
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
  }

  // -- events ----------------------------------------------------------------

  private onEvent(record: PiRecord): void {
    switch (record.type) {
      case 'turn_start':
        this.turns += 1;
        if (
          this.session.maxTurns &&
          this.turns > this.session.maxTurns &&
          !this.maxTurnsHit
        ) {
          this.maxTurnsHit = true;
          this.send({ type: 'clear_queue' });
          this.send({ type: 'abort' });
        }
        return;
      case 'message_end':
        this.onMessageEnd(record.message as PiMessage | undefined);
        return;
      case 'tool_execution_start': {
        const id = str(record.toolCallId);
        const tool = str(record.toolName);
        this.toolNames.set(id, tool);
        const capped = capInput(record.args ?? {});
        this.emit({
          type: 'toolUse',
          tool,
          input: capped.input,
          meta: {
            toolUseId: id,
            ...(typeof record.parentToolCallId === 'string'
              ? { parentToolUseId: record.parentToolCallId }
              : {}),
            ...(capped.truncated ? { truncated: true } : {}),
          },
        });
        return;
      }
      case 'tool_execution_end': {
        const id = str(record.toolCallId);
        const result = record.result as PiMessage | undefined;
        const capped = capText(contentText(result?.content));
        this.emit({
          type: 'toolResult',
          tool: this.toolNames.get(id) ?? str(record.toolName),
          output: capped.text,
          meta: {
            toolUseId: id,
            isError: Boolean(record.isError),
            ...(typeof record.parentToolCallId === 'string'
              ? { parentToolUseId: record.parentToolCallId }
              : {}),
            ...(capped.truncated ? { truncated: true } : {}),
          },
        });
        return;
      }
      case 'agent_end':
        this.emit({
          type: 'status',
          content: 'turnCompleted',
          meta: {
            turns: this.turns,
            willRetry: Boolean(record.willRetry),
            ...(this.lastAssistant?.stopReason
              ? { stopReason: this.lastAssistant.stopReason }
              : {}),
          },
        });
        this.emit({ type: 'usage', meta: { usage: this.usage() } });
        return;
      case 'agent_settled':
        void this.onSettled();
        return;
      case 'auto_retry_start':
        this.lastRetryError =
          typeof record.errorMessage === 'string'
            ? record.errorMessage
            : undefined;
        this.emit({
          type: 'status',
          content: 'retrying',
          meta: {
            attempt: record.attempt,
            maxRetries: record.maxAttempts,
            delayMs: record.delayMs,
            error: record.errorMessage,
          },
        });
        return;
      case 'auto_retry_end':
        if (record.success === false && typeof record.finalError === 'string')
          this.lastRetryError = record.finalError;
        return;
      case 'compaction_start':
        this.emit({
          type: 'status',
          content: 'compacting',
          meta: { reason: record.reason },
        });
        return;
      case 'compaction_end':
        this.emit({
          type: 'status',
          content: 'compacted',
          meta: {
            reason: record.reason,
            ...(record.aborted ? { aborted: true } : {}),
            ...(typeof record.errorMessage === 'string'
              ? { error: record.errorMessage }
              : {}),
          },
        });
        return;
      case 'extension_error':
        this.emit({
          type: 'status',
          content: 'extensionError',
          meta: {
            extensionPath: record.extensionPath,
            event: record.event,
            error: record.error,
          },
        });
        return;
      default:
        return;
    }
  }

  private onMessageEnd(message: PiMessage | undefined): void {
    if (!message) return;
    if (message.role === 'user') {
      this.onUserMessage(contentText(message.content));
      return;
    }
    if (message.role !== 'assistant') return;
    this.lastAssistant = message;
    this.addUsage(message);
    if (!Array.isArray(message.content)) return;
    for (const block of message.content) {
      if (block.type === 'text' && block.text) {
        const capped = capText(block.text);
        this.emit({
          type: 'text',
          content: capped.text,
          meta: capped.truncated ? { truncated: true } : {},
        });
      } else if (block.type === 'thinking' && block.thinking) {
        const capped = capText(block.thinking);
        this.emit({
          type: 'thinking',
          content: capped.text,
          meta: capped.truncated ? { truncated: true } : {},
        });
      }
    }
  }

  private onUserMessage(text: string): void {
    if (this.resentSteers && text === this.resentSteers.text) {
      const { steers } = this.resentSteers;
      this.resentSteers = undefined;
      this.acknowledge(steers);
      return;
    }
    const index = this.pendingSteers.findIndex((s) => s.text === text);
    if (index === -1) return;
    const [steer] = this.pendingSteers.splice(index, 1);
    this.acknowledge([steer]);
  }

  private async onSettled(): Promise<void> {
    if (this.stopping || this.outcome) return;
    if (this.maxTurnsHit || this.pendingSteers.length === 0) {
      this.complete();
      return;
    }
    // Steers Pi accepted but the agent never picked up: start another run with them.
    this.settling = true;
    const steers = this.pendingSteers;
    this.pendingSteers = [];
    const cleared = await this.request('clear_queue');
    const queued = (cleared?.data?.steering ?? []) as unknown[];
    if (this.stopping || this.outcome) return;
    if (!cleared || queued.length === 0) {
      // Pi delivered them in a form the adapter did not recognize.
      this.acknowledge(steers);
      this.settling = false;
      this.complete();
      return;
    }
    const text = steers.map((s) => s.text).join('\n\n');
    this.resentSteers = { text, steers };
    const response = await this.request('prompt', { message: text });
    this.settling = false;
    if (!response?.success) {
      this.resentSteers = undefined;
      this.complete();
    }
  }

  // -- outcome ---------------------------------------------------------------

  private addUsage(message: PiMessage): void {
    const u = message.usage;
    if (!u) return;
    const model = message.model ?? 'unknown';
    const total = this.usageByModel.get(model) ?? {
      tool: 'pi',
      model,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
    total.inputTokens += u.input ?? 0;
    total.outputTokens += u.output ?? 0;
    total.cacheReadTokens = (total.cacheReadTokens ?? 0) + (u.cacheRead ?? 0);
    total.cacheWriteTokens =
      (total.cacheWriteTokens ?? 0) + (u.cacheWrite ?? 0);
    if (u.reasoning !== undefined)
      total.reasoningTokens = (total.reasoningTokens ?? 0) + u.reasoning;
    this.usageByModel.set(model, total);
  }

  private usage(): Usage[] {
    return [...this.usageByModel.values()].map((u) => ({ ...u }));
  }

  private base(): Pick<AdapterResult, 'usage' | 'sessionId'> {
    return {
      usage: this.usage(),
      ...(this.sessionId ? { sessionId: this.sessionId } : {}),
    };
  }

  private failure(error: {
    reason: FailureReason;
    message: string;
  }): AdapterResult {
    return { ...this.base(), exit: 'error', error };
  }

  private settledOutcome(): AdapterResult {
    const last = this.lastAssistant;
    if (this.maxTurnsHit) {
      return this.failure({
        reason: 'unknown',
        message: `Reached the turn limit (${this.session.maxTurns})`,
      });
    }
    if (last?.stopReason === 'error') {
      return this.failure(
        classifyPiFailure({
          message:
            last.errorMessage ?? this.lastRetryError ?? 'Pi model call failed',
        }),
      );
    }
    if (last?.stopReason === 'aborted') {
      return this.failure({
        reason: 'unknown',
        message: last.errorMessage ?? 'The Pi run was aborted',
      });
    }
    const summary = last ? contentText(last.content) : '';
    return {
      ...this.base(),
      exit: 'completed',
      ...(summary ? { summary } : {}),
    };
  }

  private result(): AdapterResult {
    if (this.stopping && !this.outcome) {
      return {
        ...this.base(),
        exit: 'aborted',
        error: { reason: 'cancelled', message: 'Stopped by the runner' },
      };
    }
    if (this.outcome) return { ...this.outcome, ...this.base() };
    const stderr = this.stderrLines.slice(-5).join('\n');
    return this.failure(
      classifyPiFailure({
        message: `pi process exited before the run settled${stderr ? `: ${stderr}` : ''}`,
      }),
    );
  }
}

export function createPiAdapter(options?: PiAdapterOptions): PiAdapter {
  return new PiAdapter(options);
}
