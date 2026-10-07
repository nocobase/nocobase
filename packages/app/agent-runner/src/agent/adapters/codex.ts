/**
 * Codex adapter, built on `codex app-server` (JSON-RPC over stdio).
 *
 * - One app-server process per run, in its own process group. The run is a
 *   thread (`thread/start`, or `thread/resume` with `resumeSessionId`) and
 *   the prompt its first turn. The brief is passed as developer
 *   instructions, so the repository's AGENTS.md still applies.
 * - `steer()` appends input to the active turn with `turn/steer`. Input that
 *   cannot join the active turn (none is running yet, or it just ended) is
 *   started as the next turn; the run ends when a turn completes with
 *   nothing left to deliver.
 * - Permissions: approval policy `untrusted` with the `workspaceWrite`
 *   sandbox (writable: the work directory; network on, since the agent
 *   reaches its application through the application CLI). Codex then asks
 *   before every command and file change, and each request is answered by
 *   the runner's policy (`shell` with the unwrapped script, `edit` per
 *   file). A command Codex ran without asking (allowed by the machine's own
 *   Codex rules) is still checked when it completes and reported, but it
 *   cannot be undone. Requests to widen the sandbox are always refused.
 * - `stop()` interrupts the turn, then ends the process group: within five
 *   seconds in all.
 */
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import { TOOL_EFFORTS } from '@nocobase/agent-protocol';
import { classifyCodexFailure } from './codex/classify.ts';
import type { CodexFailureSignal } from './codex/classify.ts';
import { OPTED_OUT_NOTIFICATIONS } from './codex/protocol.ts';
import type {
  CommandApprovalParams,
  FileChangeApprovalParams,
  InitializeResponse,
  PermissionsApprovalParams,
  SandboxPolicy,
  ThreadItem,
  ThreadResponse,
  ThreadTokenUsage,
  TokenUsageBreakdown,
  Turn,
  TurnError,
  UserTextInput,
} from './codex/protocol.ts';
import { RpcConnection, spawnCodexProcess } from './codex/rpc.ts';
import type { CodexExit, CodexProcess, SpawnCodex } from './codex/rpc.ts';
import {
  Channel,
  capInput,
  capText,
  compareVersions,
  parseVersion,
  unwrapShell,
} from './codex/util.ts';
import type {
  AdapterEvent,
  AdapterHandle,
  AdapterResult,
  AdapterSession,
  AgentAdapter,
  PermissionDecision,
  RunnerFeature,
  ToolDetection,
  Usage,
} from './types.ts';

/**
 * Oldest Codex CLI the adapter drives (the app-server protocol it was
 * written and recorded against). Older installs are reported as not
 * installed.
 */
export const DEFAULT_MIN_CODEX_VERSION = '0.158.0';

const EFFORTS = new Set(TOOL_EFFORTS.codex);
const EFFORT_ALIASES: Readonly<Record<string, string>> = { max: 'xhigh' };
/** How long a stop waits for the interrupted turn before ending the process. */
const INTERRUPT_GRACE_MS = 1500;
/** Shutdown steps: stdin closed, then SIGTERM, then SIGKILL. */
const EXIT_WAIT_MS = 1000;
const TERM_WAIT_MS = 1500;
const STDERR_KEEP_LINES = 40;
const CLIENT_INFO = {
  name: 'nocobase_runner',
  title: 'NocoBase runner',
  version: '1',
};

export interface ExecResult {
  code: number;
  stdout: string;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

export interface CodexAdapterOptions {
  minVersion?: string;
  /** PATH searched for `codex`; defaults to the runner's PATH. */
  searchPath?: string;
  /** Runs a command for detection; replaceable in tests. */
  exec?: ExecFn;
  /** Starts the app-server; replaceable in tests. */
  spawn?: SpawnCodex;
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

async function findOnPath(
  name: string,
  searchPath: string,
): Promise<string | undefined> {
  for (const dir of searchPath.split(path.delimiter)) {
    if (!dir) continue;
    const candidate = path.join(dir, name);
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // not here
    }
  }
  return undefined;
}

function normalizeDecision(decision: PermissionDecision): {
  allow: boolean;
  reason?: string;
} {
  if (decision === 'allow') return { allow: true };
  if (decision === 'deny')
    return { allow: false, reason: 'Denied by the runner policy' };
  return { allow: false, reason: decision.deny };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function textInput(text: string): UserTextInput {
  return { type: 'text', text, text_elements: [] };
}

function mcpResultText(
  item: Extract<ThreadItem, { type: 'mcpToolCall' }>,
): string {
  if (item.error) return item.error.message;
  return (item.result?.content ?? [])
    .map((block) => {
      const b = block as { type?: string; text?: string };
      return b?.type === 'text' ? (b.text ?? '') : `[${b?.type ?? 'content'}]`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class CodexAdapter implements AgentAdapter {
  readonly kind = 'codex' as const;
  private readonly options: Required<
    Omit<CodexAdapterOptions, 'searchPath'>
  > & {
    searchPath?: string;
  };
  private detection?: Promise<ToolDetection>;

  constructor(options: CodexAdapterOptions = {}) {
    this.options = {
      minVersion: options.minVersion ?? DEFAULT_MIN_CODEX_VERSION,
      exec: options.exec ?? defaultExec,
      spawn: options.spawn ?? spawnCodexProcess,
      searchPath: options.searchPath,
    };
  }

  features(): RunnerFeature[] {
    return ['steer'];
  }

  detect(): Promise<ToolDetection> {
    this.detection ??= this.runDetection();
    return this.detection;
  }

  private async runDetection(): Promise<ToolDetection> {
    const { exec, minVersion } = this.options;
    const searchPath = this.options.searchPath ?? process.env.PATH ?? '';
    const found = await findOnPath('codex', searchPath);
    if (!found) {
      return {
        installed: false,
        authenticated: Boolean(
          process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY,
        ),
      };
    }
    const v = await exec(found, ['--version']);
    const version = v.code === 0 ? parseVersion(v.stdout) : undefined;
    // Exit status 0 means logged in (ChatGPT or API key).
    const auth = await exec(found, ['login', 'status']);
    const installed = Boolean(
      version && compareVersions(version, minVersion) >= 0,
    );
    return {
      installed,
      ...(version ? { version } : {}),
      path: found,
      authenticated: auth.code === 0,
    };
  }

  start(session: AdapterSession): AdapterHandle {
    return new CodexRun(
      session,
      () => this.detect(),
      this.options.spawn,
    ).handle();
  }
}

interface Steer {
  clientId: string;
  text: string;
  inputId?: string;
  /** The run's prompt, which is not reported as an input. */
  prompt?: boolean;
}

class CodexRun {
  private readonly events = new Channel<AdapterEvent>();
  private readonly session: AdapterSession;
  private readonly detect: () => Promise<ToolDetection>;
  private readonly spawn: SpawnCodex;
  private proc?: CodexProcess;
  private rpc?: RpcConnection;
  private exitInfo?: CodexExit;
  private exited?: Promise<CodexExit>;
  private readonly stderrLines: string[] = [];

  private threadId?: string;
  private model?: string;
  private activeTurnId?: string;
  private turnRunning = false;
  private lastTurn?: Turn;
  private lastError?: TurnError;
  private turnSummary?: string;
  private summary?: string;

  /** Delivered to Codex, waiting for the agent to pick them up. */
  private readonly pendingSteers = new Map<string, Steer>();
  /** Not yet delivered; sent to the active turn or started as the next one. */
  private carry: Steer[] = [];
  private steersInFlight = 0;

  private readonly items = new Map<string, ThreadItem>();
  private readonly reviewedItems = new Set<string>();
  private usageBaseline?: TokenUsageBreakdown;
  private usageTotal?: TokenUsageBreakdown;

  private stopping = false;
  private finished = false;
  /** Set once the run is ending; no input is accepted after it. */
  private ending = false;
  private resolveEnded!: () => void;
  private readonly ended = new Promise<void>((resolve) => {
    this.resolveEnded = resolve;
  });
  private readonly done: Promise<AdapterResult>;

  constructor(
    session: AdapterSession,
    detect: () => Promise<ToolDetection>,
    spawn: SpawnCodex,
  ) {
    this.session = session;
    this.detect = detect;
    this.spawn = spawn;
    if (session.abort.aborted) this.stopping = true;
    session.abort.addEventListener('abort', () => void this.stop(), {
      once: true,
    });
    this.done = this.run();
  }

  private endRun(): void {
    this.ending = true;
    this.resolveEnded();
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

  // -- steering -------------------------------------------------------------

  private async steer(text: string, inputId?: string): Promise<boolean> {
    if (this.finished || this.stopping || this.ending) return false;
    const steer: Steer = { clientId: randomUUID(), text, inputId };
    if (!this.turnRunning || !this.activeTurnId || !this.rpc) {
      this.carry.push(steer);
      return true;
    }
    this.steersInFlight += 1;
    this.pendingSteers.set(steer.clientId, steer);
    try {
      await this.rpc.request('turn/steer', {
        threadId: this.threadId,
        input: [textInput(text)],
        clientUserMessageId: steer.clientId,
        expectedTurnId: this.activeTurnId,
      });
      return true;
    } catch {
      // The turn ended (or cannot be steered): deliver it as the next turn.
      this.pendingSteers.delete(steer.clientId);
      if (this.finished || this.stopping || this.ending) return false;
      this.carry.push(steer);
      return true;
    } finally {
      this.steersInFlight -= 1;
      this.afterTurn();
    }
  }

  /** Sends inputs that arrived before the turn had an id. */
  private flushCarry(): void {
    if (!this.activeTurnId || this.carry.length === 0) return;
    const queued = this.carry;
    this.carry = [];
    for (const steer of queued) void this.steer(steer.text, steer.inputId);
  }

  private acknowledge(clientId: string | null | undefined): void {
    if (!clientId) return;
    const steer = this.pendingSteers.get(clientId);
    if (!steer) return;
    this.pendingSteers.delete(clientId);
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

  /**
   * Decides what follows a finished turn, once no steer is in flight: the
   * next turn with the undelivered inputs, or the end of the run.
   */
  private afterTurn(): void {
    if (this.turnRunning || this.steersInFlight > 0 || this.finished) return;
    if (!this.lastTurn) return;
    if (this.stopping || this.lastTurn.status !== 'completed') {
      this.endRun();
      return;
    }
    // Inputs Codex accepted but the turn ended without: deliver them again.
    const next = [...this.pendingSteers.values(), ...this.carry];
    this.pendingSteers.clear();
    this.carry = [];
    if (next.length === 0) {
      this.endRun();
      return;
    }
    void this.startTurn(next).catch((error: unknown) => {
      this.lastError = {
        message: errorMessage(error),
        codexErrorInfo: null,
        additionalDetails: null,
      };
      this.lastTurn = undefined;
      this.endRun();
    });
  }

  private async startTurn(inputs: Steer[]): Promise<void> {
    const { session } = this;
    const first = inputs[0];
    for (const steer of inputs)
      if (!steer.prompt) this.pendingSteers.set(steer.clientId, steer);
    this.turnRunning = true;
    this.turnSummary = undefined;
    const effort = session.effort
      ? (EFFORT_ALIASES[session.effort] ?? session.effort)
      : undefined;
    const sandboxPolicy: SandboxPolicy = {
      type: 'workspaceWrite',
      writableRoots: [session.workDir],
      networkAccess: true,
      excludeTmpdirEnvVar: false,
      excludeSlashTmp: false,
    };
    const response = await this.rpc!.request<{ turn: Turn }>('turn/start', {
      threadId: this.threadId,
      input: inputs.map((steer) => textInput(steer.text)),
      clientUserMessageId: first.clientId,
      approvalPolicy: 'untrusted',
      sandboxPolicy,
      ...(effort && EFFORTS.has(effort) ? { effort } : {}),
    });
    // The first input of a turn is its user message; the rest ride along.
    for (const steer of inputs.slice(1)) this.acknowledge(steer.clientId);
    if (this.turnRunning && !this.activeTurnId) {
      this.activeTurnId = response.turn.id;
      this.flushCarry();
    }
  }

  // -- stopping -------------------------------------------------------------

  private async stop(): Promise<void> {
    if (!this.finished && !this.stopping) {
      this.stopping = true;
      if (this.rpc && this.threadId && this.activeTurnId) {
        this.rpc
          .request('turn/interrupt', {
            threadId: this.threadId,
            turnId: this.activeTurnId,
          })
          .catch(() => {
            // The process may be gone already.
          });
        setTimeout(() => this.endRun(), INTERRUPT_GRACE_MS).unref();
      } else {
        this.endRun();
      }
    }
    await this.done;
  }

  private async shutdown(): Promise<void> {
    const proc = this.proc;
    if (!proc || !this.exited) return;
    const wait = (ms: number) =>
      Promise.race([
        this.exited!.then(() => true),
        new Promise<false>((resolve) =>
          setTimeout(() => resolve(false), ms).unref(),
        ),
      ]);
    proc.end();
    if (!(await wait(EXIT_WAIT_MS))) {
      proc.kill('SIGTERM');
      if (!(await wait(TERM_WAIT_MS))) {
        proc.kill('SIGKILL');
        await wait(EXIT_WAIT_MS);
      }
    }
    // Commands the app-server started may outlive it in its group.
    proc.kill('SIGKILL');
  }

  // -- permissions ----------------------------------------------------------

  private async decide(
    tool: string,
    input: Record<string, unknown>,
  ): Promise<{ allow: boolean; reason?: string }> {
    try {
      return normalizeDecision(await this.session.permission(tool, input));
    } catch (error) {
      return { allow: false, reason: `Policy error: ${errorMessage(error)}` };
    }
  }

  private report(
    tool: string,
    input: unknown,
    toolUseId: string | undefined,
    decision: { allow: boolean; reason?: string },
    extra: Record<string, unknown> = {},
  ): void {
    const capped = capInput(input);
    this.emit({
      type: 'permission',
      tool,
      input: capped.input,
      meta: {
        decision: decision.allow ? 'allow' : 'deny',
        ...(decision.reason ? { reason: decision.reason } : {}),
        ...(toolUseId ? { toolUseId } : {}),
        ...extra,
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
  }

  private commandInput(
    command: string,
    cwd: string | null | undefined,
  ): Record<string, unknown> {
    return { command: unwrapShell(command), ...(cwd ? { cwd } : {}) };
  }

  private async decideChanges(
    changes: { path: string; kind: string }[],
  ): Promise<{ allow: boolean; reason?: string }> {
    if (changes.length === 0)
      return { allow: false, reason: 'File change without a file list' };
    for (const change of changes) {
      const decision = await this.decide('edit', change);
      if (!decision.allow) return decision;
    }
    return { allow: true };
  }

  private changeList(itemId: string): { path: string; kind: string }[] {
    const item = this.items.get(itemId);
    if (item?.type !== 'fileChange' || !('changes' in item)) return [];
    return item.changes.map((change) => ({
      path: change.path,
      kind: change.kind.type,
    }));
  }

  private readonly onRequest = async (
    method: string,
    params: unknown,
  ): Promise<unknown> => {
    // A stopping run starts nothing new.
    if (
      this.stopping &&
      (method === 'item/commandExecution/requestApproval' ||
        method === 'item/fileChange/requestApproval')
    ) {
      this.reviewedItems.add((params as { itemId: string }).itemId);
      return { decision: 'cancel' };
    }
    switch (method) {
      case 'item/commandExecution/requestApproval': {
        const p = params as CommandApprovalParams;
        const item = this.items.get(p.itemId);
        const command =
          p.command ??
          (item?.type === 'commandExecution' && 'command' in item
            ? item.command
            : '');
        const input = this.commandInput(command, p.cwd);
        const decision = await this.decide('shell', input);
        this.reviewedItems.add(p.itemId);
        this.report('shell', input, p.itemId, decision);
        return { decision: decision.allow ? 'accept' : 'decline' };
      }
      case 'item/fileChange/requestApproval': {
        const p = params as FileChangeApprovalParams;
        const changes = this.changeList(p.itemId);
        const decision = p.grantRoot
          ? {
              allow: false,
              reason: 'Agent runs do not widen the writable roots',
            }
          : await this.decideChanges(changes);
        this.reviewedItems.add(p.itemId);
        this.report('edit', { changes }, p.itemId, decision);
        return { decision: decision.allow ? 'accept' : 'decline' };
      }
      case 'item/permissions/requestApproval': {
        const p = params as PermissionsApprovalParams;
        this.report(
          'requestPermissions',
          { permissions: p.permissions, reason: p.reason },
          p.itemId,
          {
            allow: false,
            reason: 'Agent runs do not widen the sandbox',
          },
        );
        return { permissions: {}, scope: 'turn' };
      }
      case 'mcpServer/elicitation/request': {
        const p = params as { serverName?: string; message?: string };
        this.report(
          `mcp__${p.serverName ?? 'unknown'}`,
          { message: p.message },
          undefined,
          {
            allow: false,
            reason: 'MCP elicitations cannot be answered in agent runs',
          },
        );
        return { action: 'decline', content: null, _meta: null };
      }
      case 'item/tool/requestUserInput':
        // Nobody can answer during a run; the agent proceeds without answers.
        return { answers: {} };
      case 'execCommandApproval':
      case 'applyPatchApproval':
        return { decision: 'denied' };
      default:
        throw new Error(`Unsupported request: ${method}`);
    }
  };

  /** A command or file change Codex ran without asking (local Codex rules). */
  private async checkUnreviewed(item: ThreadItem): Promise<void> {
    if (this.reviewedItems.has(item.id)) return;
    this.reviewedItems.add(item.id);
    // Declined calls never ran.
    if ('status' in item && item.status === 'declined') return;
    let tool: string;
    let input: Record<string, unknown>;
    let decision: { allow: boolean; reason?: string };
    if (item.type === 'commandExecution' && 'command' in item) {
      tool = 'shell';
      input = this.commandInput(item.command, item.cwd);
      decision = await this.decide(tool, input);
    } else if (item.type === 'fileChange' && 'changes' in item) {
      tool = 'edit';
      const changes = item.changes.map((c) => ({
        path: c.path,
        kind: c.kind.type,
      }));
      input = { changes };
      decision = await this.decideChanges(changes);
    } else return;
    this.report(tool, input, item.id, decision, { unprompted: true });
    if (!decision.allow) {
      this.emit({
        type: 'error',
        content: `Codex ran a ${tool} call the runner policy denies, without asking: ${decision.reason ?? ''}`,
        meta: { reason: 'unknown', toolUseId: item.id },
      });
    }
  }

  // -- notifications --------------------------------------------------------

  private readonly onNotification = (method: string, params: unknown): void => {
    const p = (params ?? {}) as Record<string, unknown>;
    if (p.threadId && this.threadId && p.threadId !== this.threadId) return;
    switch (method) {
      case 'turn/started': {
        const turn = p.turn as Turn;
        this.turnRunning = true;
        this.activeTurnId = turn.id;
        this.flushCarry();
        return;
      }
      case 'turn/completed':
        this.onTurnCompleted(p.turn as Turn);
        return;
      case 'item/started':
        this.onItemStarted(p.item as ThreadItem);
        return;
      case 'item/completed':
        this.onItemCompleted(p.item as ThreadItem);
        return;
      case 'thread/tokenUsage/updated':
        this.onUsage(
          (p.tokenUsage as ThreadTokenUsage).total,
          (p.tokenUsage as ThreadTokenUsage).last,
        );
        return;
      case 'error': {
        const error = p.error as TurnError;
        if (p.willRetry) {
          this.emit({
            type: 'status',
            content: 'retrying',
            meta: {
              message: error.message,
              ...(error.codexErrorInfo
                ? { codexErrorInfo: error.codexErrorInfo }
                : {}),
            },
          });
        } else {
          this.lastError = error;
        }
        return;
      }
      case 'thread/compacted':
        this.emit({ type: 'status', content: 'compacted' });
        return;
      case 'model/rerouted':
        this.emit({ type: 'status', content: 'modelRerouted', meta: p });
        return;
      default:
        return;
    }
  };

  private onTurnCompleted(turn: Turn): void {
    this.lastTurn = turn;
    this.turnRunning = false;
    this.activeTurnId = undefined;
    if (turn.status === 'completed' && this.turnSummary !== undefined)
      this.summary = this.turnSummary;
    if (turn.error) this.lastError = turn.error;
    this.emit({
      type: 'status',
      content: 'turnCompleted',
      meta: {
        status: turn.status,
        ...(turn.durationMs != null ? { durationMs: turn.durationMs } : {}),
        ...(turn.error ? { error: turn.error.message } : {}),
      },
    });
    this.emit({ type: 'usage', meta: { usage: this.usage() } });
    this.afterTurn();
  }

  private onItemStarted(item: ThreadItem): void {
    this.items.set(item.id, item);
    switch (item.type) {
      case 'userMessage':
        if ('clientId' in item) this.acknowledge(item.clientId);
        return;
      case 'commandExecution':
        if ('command' in item)
          this.toolUse(
            'shell',
            this.commandInput(item.command, item.cwd),
            item.id,
          );
        return;
      case 'fileChange':
        this.toolUse('edit', { changes: this.changeList(item.id) }, item.id);
        return;
      case 'mcpToolCall':
        if ('server' in item)
          this.toolUse(
            `mcp__${item.server}__${item.tool}`,
            item.arguments,
            item.id,
          );
        return;
      case 'dynamicToolCall':
        if ('arguments' in item)
          this.toolUse(item.tool, item.arguments, item.id);
        return;
      case 'collabAgentToolCall':
        if ('prompt' in item)
          this.toolUse(`agent:${item.tool}`, { prompt: item.prompt }, item.id);
        return;
      case 'contextCompaction':
        this.emit({ type: 'status', content: 'compacting' });
        return;
      default:
        return;
    }
  }

  private onItemCompleted(item: ThreadItem): void {
    switch (item.type) {
      case 'userMessage':
        if ('clientId' in item) this.acknowledge(item.clientId);
        break;
      case 'agentMessage':
        if ('text' in item) {
          this.turnSummary = item.text;
          this.text('text', item.text);
        }
        break;
      case 'reasoning':
        if ('summary' in item) {
          const text = [...item.summary, ...item.content].join('\n\n');
          if (text) this.text('thinking', text);
        }
        break;
      case 'commandExecution':
        if ('command' in item) {
          void this.checkUnreviewed(item);
          this.toolResult('shell', item.aggregatedOutput ?? '', item.id, {
            isError: item.status !== 'completed' || (item.exitCode ?? 0) !== 0,
            status: item.status,
            ...(item.exitCode !== null ? { exitCode: item.exitCode } : {}),
          });
        }
        break;
      case 'fileChange':
        if ('changes' in item) {
          this.items.set(item.id, item);
          void this.checkUnreviewed(item);
          this.toolResult(
            'edit',
            item.changes.map((c) => `${c.kind.type} ${c.path}`).join('\n'),
            item.id,
            { isError: item.status !== 'completed', status: item.status },
          );
        }
        break;
      case 'mcpToolCall':
        if ('server' in item)
          this.toolResult(
            `mcp__${item.server}__${item.tool}`,
            mcpResultText(item),
            item.id,
            {
              isError: item.status !== 'completed' || item.error !== null,
            },
          );
        break;
      case 'dynamicToolCall':
        if ('arguments' in item)
          this.toolResult(
            item.tool,
            JSON.stringify(item.contentItems ?? []),
            item.id,
            {
              isError: item.success === false,
            },
          );
        break;
      case 'collabAgentToolCall':
        if ('prompt' in item)
          this.toolResult(`agent:${item.tool}`, item.status, item.id, {
            isError: item.status === 'failed',
          });
        break;
      case 'webSearch':
        if ('query' in item) {
          this.toolUse('webSearch', { query: item.query }, item.id);
          this.toolResult('webSearch', '', item.id, { isError: false });
        }
        break;
      case 'imageView':
        if ('path' in item) {
          this.toolUse('viewImage', { path: item.path }, item.id);
          this.toolResult('viewImage', '', item.id, { isError: false });
        }
        break;
      default:
        break;
    }
    this.items.delete(item.id);
  }

  private text(type: 'text' | 'thinking', content: string): void {
    const capped = capText(content);
    this.emit({
      type,
      content: capped.text,
      ...(capped.truncated ? { meta: { truncated: true } } : {}),
    });
  }

  private toolUse(tool: string, input: unknown, id: string): void {
    const capped = capInput(input);
    this.emit({
      type: 'toolUse',
      tool,
      input: capped.input,
      meta: { toolUseId: id, ...(capped.truncated ? { truncated: true } : {}) },
    });
  }

  private toolResult(
    tool: string,
    output: string,
    id: string,
    meta: Record<string, unknown>,
  ): void {
    const capped = capText(output);
    this.emit({
      type: 'toolResult',
      tool,
      output: capped.text,
      meta: {
        toolUseId: id,
        ...meta,
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
  }

  // -- usage ----------------------------------------------------------------

  /**
   * Thread usage is cumulative over the thread's life, so a resumed thread
   * also carries earlier runs: the total before this run's first model call
   * is the baseline.
   */
  private onUsage(total: TokenUsageBreakdown, last: TokenUsageBreakdown): void {
    this.usageBaseline ??= {
      totalTokens: total.totalTokens - last.totalTokens,
      inputTokens: total.inputTokens - last.inputTokens,
      cachedInputTokens: total.cachedInputTokens - last.cachedInputTokens,
      cacheWriteInputTokens:
        (total.cacheWriteInputTokens ?? 0) - (last.cacheWriteInputTokens ?? 0),
      outputTokens: total.outputTokens - last.outputTokens,
      reasoningOutputTokens:
        total.reasoningOutputTokens - last.reasoningOutputTokens,
    };
    this.usageTotal = total;
  }

  private usage(): Usage[] {
    const total = this.usageTotal;
    const base = this.usageBaseline;
    if (!total || !base) return [];
    const input = total.inputTokens - base.inputTokens;
    const cached = total.cachedInputTokens - base.cachedInputTokens;
    const cacheWrite =
      (total.cacheWriteInputTokens ?? 0) - (base.cacheWriteInputTokens ?? 0);
    return [
      {
        tool: 'codex',
        ...(this.model ? { model: this.model } : {}),
        // OpenAI counts cached input and cache writes inside input tokens; Usage keeps them apart. Its output tokens
        // already include the reasoning tokens.
        inputTokens: Math.max(0, input - cached - Math.max(0, cacheWrite)),
        outputTokens: total.outputTokens - base.outputTokens,
        cacheReadTokens: cached,
        ...(cacheWrite > 0 ? { cacheWriteTokens: cacheWrite } : {}),
        reasoningTokens:
          total.reasoningOutputTokens - base.reasoningOutputTokens,
      },
    ];
  }

  // -- the run --------------------------------------------------------------

  private async run(): Promise<AdapterResult> {
    let thrown: unknown;
    let processFailed = false;
    try {
      if (this.stopping) throw new Error('aborted before start');
      const detection = await this.detect();
      if (!detection.installed) {
        processFailed = true;
        throw new Error(
          detection.version
            ? `Codex ${detection.version} is older than the oldest supported version`
            : 'Codex is not installed (codex executable not found)',
        );
      }
      // A stop or a dead process ends the run even while still connecting.
      const connecting = this.connect(detection.path ?? 'codex');
      connecting.catch(() => {
        // Reported through the race below, or superseded by the stop.
      });
      await Promise.race([connecting, this.ended]);
      await this.ended;
    } catch (error) {
      thrown = error;
    } finally {
      this.finished = true;
      if (this.exitInfo && !this.stopping && !this.lastTurnEnded())
        processFailed = true;
      this.rpc?.close(new Error('run finished'));
      await this.shutdown();
    }
    const result = this.outcome(thrown, processFailed);
    if (result.error)
      this.emit({
        type: 'error',
        content: result.error.message,
        meta: { reason: result.error.reason },
      });
    this.events.close();
    return result;
  }

  private lastTurnEnded(): boolean {
    return Boolean(this.lastTurn && !this.turnRunning);
  }

  /**
   * The run's skills folder as an extra skills root of this app-server process (`skills/extraRoots/set`, not persisted;
   * https://learn.chatgpt.com/docs/app-server). A Codex without the method still finds the skills through the folder
   * the system prompt names, so a refusal is reported and the run goes on.
   */
  private async registerSkills(
    rpc: RpcConnection,
    skillsDir: string,
  ): Promise<void> {
    try {
      await rpc.request('skills/extraRoots/set', { extraRoots: [skillsDir] });
    } catch (error) {
      this.emit({
        type: 'status',
        content: 'skillsNotRegistered',
        meta: {
          reason: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async connect(command: string): Promise<void> {
    const { session } = this;
    const proc = this.spawn({
      command,
      // A login shell would run the system profile (macOS `path_helper`), which puts system directories ahead of the
      // run's PATH: the agent's commands could then find another node than the runner's, or miss the app CLI shim.
      args: [
        '-c',
        'allow_login_shell=false',
        'app-server',
        '--listen',
        'stdio://',
      ],
      cwd: session.workDir,
      env: { ...session.env },
    });
    this.proc = proc;
    this.exited = new Promise((resolve) => proc.onExit(resolve));
    proc.onStderr((line) => {
      this.stderrLines.push(line);
      this.stderrLines.splice(
        0,
        Math.max(0, this.stderrLines.length - STDERR_KEEP_LINES),
      );
    });
    void this.exited.then((exit) => {
      this.exitInfo = exit;
      this.rpc?.close(this.exitError(exit));
      this.endRun();
    });
    const rpc = new RpcConnection(proc, {
      notification: this.onNotification,
      request: this.onRequest,
    });
    this.rpc = rpc;

    await rpc.request<InitializeResponse>('initialize', {
      clientInfo: CLIENT_INFO,
      capabilities: {
        experimentalApi: false,
        requestAttestation: false,
        optOutNotificationMethods: OPTED_OUT_NOTIFICATIONS,
      },
    });
    rpc.notify('initialized');
    if (session.skills) await this.registerSkills(rpc, session.skills.dir);
    const threadParams = {
      cwd: session.workDir,
      approvalPolicy: 'untrusted',
      sandbox: 'workspace-write',
      developerInstructions: session.systemPrompt,
      ...(session.model ? { model: session.model } : {}),
    };
    const thread = session.resumeSessionId
      ? await rpc.request<ThreadResponse>('thread/resume', {
          threadId: session.resumeSessionId,
          ...threadParams,
          excludeTurns: true,
        })
      : await rpc.request<ThreadResponse>('thread/start', {
          ...threadParams,
          serviceName: 'nocobase-runner',
        });
    this.threadId = thread.thread.id;
    this.model = thread.model;
    this.emit({
      type: 'status',
      content: 'started',
      meta: {
        sessionId: thread.thread.id,
        model: thread.model,
        ...(thread.reasoningEffort ? { effort: thread.reasoningEffort } : {}),
        ...(session.resumeSessionId ? { resumed: true } : {}),
      },
    });
    if (this.stopping) return;
    const prompt: Steer = {
      clientId: randomUUID(),
      text: session.prompt,
      prompt: true,
    };
    const early = this.carry;
    this.carry = [];
    await this.startTurn([prompt, ...early]);
  }

  private exitError(exit: CodexExit): Error {
    if (exit.error) return exit.error;
    const stderr = this.stderrLines.slice(-5).join('\n');
    return new Error(
      `codex app-server exited (${exit.signal ? `signal ${exit.signal}` : `code ${exit.code}`})${stderr ? `: ${stderr}` : ''}`,
    );
  }

  private outcome(thrown: unknown, processFailed: boolean): AdapterResult {
    const base = {
      usage: this.usage(),
      ...(this.threadId ? { sessionId: this.threadId } : {}),
    };
    if (this.stopping) {
      return {
        ...base,
        exit: 'aborted',
        error: { reason: 'cancelled', message: 'Stopped by the runner' },
      };
    }
    const turn = this.lastTurn;
    if (
      thrown === undefined &&
      turn?.status === 'completed' &&
      !this.turnRunning
    ) {
      return {
        ...base,
        exit: 'completed',
        ...(this.summary !== undefined ? { summary: this.summary } : {}),
      };
    }
    const signal: CodexFailureSignal = { processFailed };
    if (thrown !== undefined) {
      const stderr = this.stderrLines.slice(-5).join('\n');
      signal.message = [errorMessage(thrown), stderr]
        .filter(Boolean)
        .join('; ');
      signal.codexErrorInfo = this.lastError?.codexErrorInfo;
    } else if (turn && turn.status !== 'completed' && !this.turnRunning) {
      const error = turn.error ?? this.lastError;
      signal.message =
        error?.message ??
        (turn.status === 'interrupted'
          ? 'The Codex turn was interrupted'
          : 'The Codex turn failed');
      signal.codexErrorInfo = error?.codexErrorInfo;
    } else {
      signal.processFailed = true;
      signal.message = this.exitInfo
        ? this.exitError(this.exitInfo).message
        : 'codex app-server ended without completing the turn';
      signal.codexErrorInfo = this.lastError?.codexErrorInfo;
      if (this.lastError)
        signal.message = `${this.lastError.message}; ${signal.message}`;
    }
    return { ...base, exit: 'error', error: classifyCodexFailure(signal) };
  }
}

export function createCodexAdapter(
  options?: CodexAdapterOptions,
): CodexAdapter {
  return new CodexAdapter(options);
}
