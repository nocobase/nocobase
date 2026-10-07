/**
 * Claude Code adapter, built on the Claude Agent SDK.
 *
 * - The prompt is a streaming input, so `steer()` pushes another user
 *   message into the live session; Claude Code folds it into the running
 *   turn between tool rounds, or runs it as the next turn.
 * - The brief is appended to the `claude_code` system prompt preset; only
 *   project settings (the repository's .claude/) are loaded.
 * - The run's skills come as a local plugin (`plugins: [{ type: 'local' }]`,
 *   https://code.claude.com/docs/en/agent-sdk/plugins).
 * - Permissions: `acceptEdits`, and the runner's policy is consulted twice
 *   over: a PreToolUse hook enforces its denials for every tool call (so
 *   allow rules in project settings cannot widen it), and `canUseTool`
 *   answers the calls Claude Code would otherwise prompt for.
 * - The executable is the `claude` on the runner's PATH, resolved to an
 *   absolute path and passed as `pathToClaudeCodeExecutable`. The SDK's
 *   bundled binary is never installed (its platform packages are left out),
 *   so a runner without a recent enough `claude` reports Claude Code
 *   unavailable and is offered no Claude runs.
 */
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import { TOOL_EFFORTS } from '@nocobase/agent-protocol';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  CanUseTool,
  HookCallback,
  Options,
  PermissionResult,
  SDKMessage,
  SDKResultMessage,
  SDKUserMessage,
} from '@anthropic-ai/claude-agent-sdk';

import { classifyClaudeFailure } from './classify.ts';
import type { ClaudeFailureSignal } from './classify.ts';
import { MAX_EVENT_TEXT_BYTES } from './types.ts';
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
 * Oldest Claude Code the adapter drives; an older `claude` counts as not
 * installed. Raise it when the adapter starts to rely on a newer CLI feature.
 */
export const DEFAULT_MIN_CLAUDE_VERSION = '2.1.200';

const EFFORTS = new Set(TOOL_EFFORTS.claude);
const STOP_GRACE_MS = 5000;
const STDERR_KEEP_LINES = 40;

export interface ExecResult {
  code: number;
  stdout: string;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

export interface ClaudeAdapterOptions {
  minVersion?: string;
  /** PATH searched for `claude`; defaults to the runner's PATH. */
  searchPath?: string;
  /** Runs a command for detection; replaceable in tests. */
  exec?: ExecFn;
}

/** The `claude` a run uses. */
export interface ResolvedExecutable {
  /** Absolute; passed as `pathToClaudeCodeExecutable`. */
  path: string;
  version: string;
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

async function findOnPath(
  name: string,
  searchPath: string,
): Promise<string | undefined> {
  for (const dir of searchPath.split(path.delimiter)) {
    // Only absolute entries: the path is handed to the SDK, which runs it from the run's working directory.
    if (!dir || !path.isAbsolute(dir)) continue;
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

// ---------------------------------------------------------------------------
// Small async plumbing
// ---------------------------------------------------------------------------

/** An unbounded async queue that one consumer iterates. */
class Channel<T> implements AsyncIterable<T> {
  private items: T[] = [];
  private waiters: ((r: IteratorResult<T>) => void)[] = [];
  private closed = false;

  get isClosed(): boolean {
    return this.closed;
  }

  push(item: T): boolean {
    if (this.closed) return false;
    const waiter = this.waiters.shift();
    if (waiter) waiter({ value: item, done: false });
    else this.items.push(item);
    return true;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const waiter of this.waiters.splice(0))
      waiter({ value: undefined, done: true });
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        if (this.items.length > 0)
          return Promise.resolve({ value: this.items.shift()!, done: false });
        if (this.closed)
          return Promise.resolve({ value: undefined, done: true });
        return new Promise((resolve) => this.waiters.push(resolve));
      },
      return: () => {
        this.close();
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }
}

function capText(text: string): { text: string; truncated: boolean } {
  if (Buffer.byteLength(text, 'utf8') <= MAX_EVENT_TEXT_BYTES)
    return { text, truncated: false };
  return {
    text: Buffer.from(text, 'utf8')
      .subarray(0, MAX_EVENT_TEXT_BYTES)
      .toString('utf8'),
    truncated: true,
  };
}

function capInput(input: unknown): { input: unknown; truncated: boolean } {
  let json: string;
  try {
    json = JSON.stringify(input) ?? '';
  } catch {
    return { input: String(input), truncated: false };
  }
  if (Buffer.byteLength(json, 'utf8') <= MAX_EVENT_TEXT_BYTES)
    return { input, truncated: false };
  return { input: { preview: capText(json).text }, truncated: true };
}

function toolResultText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content))
    return content === undefined ? '' : JSON.stringify(content);
  return content
    .map((block: { type?: string; text?: string }) =>
      block?.type === 'text'
        ? (block.text ?? '')
        : `[${block?.type ?? 'content'}]`,
    )
    .join('\n');
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

/** What the model reads when the policy denies a tool call. */
export function denialMessage(reason: string | undefined): string {
  return `The runner policy denied this tool call${reason ? `: ${reason}` : ''}. This decision is final and nobody can grant it during this run, so do not ask for permission. Continue the task without this call, or use an allowed alternative.`;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClaudeAdapter implements AgentAdapter {
  readonly kind = 'claude' as const;
  private readonly options: Required<
    Omit<ClaudeAdapterOptions, 'searchPath'>
  > & { searchPath?: string };
  private detection?: Promise<{
    detection: ToolDetection;
    executable: ResolvedExecutable | undefined;
  }>;

  constructor(options: ClaudeAdapterOptions = {}) {
    this.options = {
      minVersion: options.minVersion ?? DEFAULT_MIN_CLAUDE_VERSION,
      exec: options.exec ?? defaultExec,
      searchPath: options.searchPath,
    };
  }

  features(): RunnerFeature[] {
    return ['steer'];
  }

  async detect(): Promise<ToolDetection> {
    return (await this.inspect()).detection;
  }

  /** The `claude` `start()` runs; undefined when there is none recent enough. */
  async resolveExecutable(): Promise<ResolvedExecutable | undefined> {
    return (await this.inspect()).executable;
  }

  private inspect(): Promise<{
    detection: ToolDetection;
    executable: ResolvedExecutable | undefined;
  }> {
    this.detection ??= this.runDetection();
    return this.detection;
  }

  private async runDetection(): Promise<{
    detection: ToolDetection;
    executable: ResolvedExecutable | undefined;
  }> {
    const { exec, minVersion } = this.options;
    const searchPath = this.options.searchPath ?? process.env.PATH ?? '';
    const found = await findOnPath('claude', searchPath);
    if (!found)
      return {
        detection: { installed: false, authenticated: false },
        executable: undefined,
      };
    const v = await exec(found, ['--version']);
    const version = v.code === 0 ? parseVersion(v.stdout) : undefined;
    const auth = await exec(found, ['auth', 'status', '--json']);
    let authenticated: boolean;
    try {
      authenticated = Boolean(
        (JSON.parse(auth.stdout) as { loggedIn?: boolean }).loggedIn,
      );
    } catch {
      authenticated = false;
    }
    // Too old (or not answering `--version`): reported with what was found, but not installed for the runner.
    const usable =
      version !== undefined && compareVersions(version, minVersion) >= 0;
    return {
      detection: {
        installed: usable,
        ...(version ? { version } : {}),
        path: found,
        authenticated,
      },
      executable: usable ? { path: found, version } : undefined,
    };
  }

  start(session: AdapterSession): AdapterHandle {
    return new ClaudeRun(session, () => this.resolveExecutable()).handle();
  }
}

class ClaudeRun {
  private readonly events = new Channel<AdapterEvent>();
  private readonly input = new Channel<SDKUserMessage>();
  private readonly abortController = new AbortController();
  /** Steered inputs not yet seen by the agent, by message uuid. */
  private readonly pendingSteers = new Map<
    string,
    { text: string; inputId?: string }
  >();
  private readonly toolNames = new Map<string, string>();
  private readonly decisions = new Map<
    string,
    { allow: boolean; reason?: string }
  >();
  private readonly reportedDecisions = new Set<string>();
  private readonly stderrLines: string[] = [];
  private sessionId?: string;
  private model?: string;
  private lastResult?: SDKResultMessage;
  private lastAssistantError?: string;
  private turnUsage: Usage = {
    tool: 'claude',
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };
  private stopping = false;
  private finished = false;
  private closeQuery?: () => void;
  private readonly done: Promise<AdapterResult>;
  private readonly session: AdapterSession;
  private readonly resolveExecutable: () => Promise<
    ResolvedExecutable | undefined
  >;

  constructor(
    session: AdapterSession,
    resolveExecutable: () => Promise<ResolvedExecutable | undefined>,
  ) {
    this.session = session;
    this.resolveExecutable = resolveExecutable;
    if (session.abort.aborted) this.stopping = true;
    session.abort.addEventListener('abort', () => void this.stop(), {
      once: true,
    });
    this.input.push(this.userMessage(session.prompt));
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

  private userMessage(text: string): SDKUserMessage {
    return {
      type: 'user',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
      uuid: randomUUID(),
    };
  }

  private steer(text: string, inputId?: string): Promise<boolean> {
    if (this.finished || this.stopping || this.input.isClosed)
      return Promise.resolve(false);
    const message = this.userMessage(text);
    this.pendingSteers.set(message.uuid!, { text, inputId });
    return Promise.resolve(this.input.push(message));
  }

  private async stop(): Promise<void> {
    if (!this.finished && !this.stopping) {
      this.stopping = true;
      this.input.close();
      this.abortController.abort();
      const timer = new Promise<'timeout'>((resolve) =>
        setTimeout(() => resolve('timeout'), STOP_GRACE_MS).unref(),
      );
      if ((await Promise.race([this.done, timer])) === 'timeout')
        this.closeQuery?.();
    }
    await this.done;
  }

  // -- permissions ----------------------------------------------------------

  private async decide(
    tool: string,
    input: Record<string, unknown>,
    toolUseId: string | undefined,
  ): Promise<{ allow: boolean; reason?: string }> {
    const cached = toolUseId ? this.decisions.get(toolUseId) : undefined;
    if (cached) return cached;
    let decision: { allow: boolean; reason?: string };
    try {
      decision = normalizeDecision(await this.session.permission(tool, input));
    } catch (error) {
      decision = {
        allow: false,
        reason: `Policy error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    if (toolUseId) this.decisions.set(toolUseId, decision);
    return decision;
  }

  private report(
    tool: string,
    input: unknown,
    toolUseId: string | undefined,
    decision: { allow: boolean; reason?: string },
  ) {
    if (toolUseId) {
      if (this.reportedDecisions.has(toolUseId)) return;
      this.reportedDecisions.add(toolUseId);
    }
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

  /**
   * Runs before Claude Code's own permission rules, so a policy denial
   * cannot be bypassed by allow rules in project settings. A denial is
   * answered with 'ask', which hands the call to canUseTool: that path
   * returns the reason to the model as a plain permission denial (a hook
   * 'deny' reaches the model as a "hook error", which models read as a
   * request to ask for permission and stop).
   */
  private readonly preToolUse: HookCallback = async (hookInput) => {
    if (hookInput.hook_event_name !== 'PreToolUse') return {};
    const input = (hookInput.tool_input ?? {}) as Record<string, unknown>;
    const decision = await this.decide(
      hookInput.tool_name,
      input,
      hookInput.tool_use_id,
    );
    if (decision.allow) return {};
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: decision.reason,
      },
    };
  };

  private readonly canUseTool: CanUseTool = async (
    tool,
    input,
    { toolUseID },
  ): Promise<PermissionResult> => {
    const decision = await this.decide(tool, input, toolUseID);
    this.report(tool, input, toolUseID, decision);
    return decision.allow
      ? { behavior: 'allow', updatedInput: input }
      : { behavior: 'deny', message: denialMessage(decision.reason) };
  };

  // -- the run --------------------------------------------------------------

  private async buildOptions(): Promise<Options> {
    const executable = await this.resolveExecutable();
    if (!executable)
      throw new Error(
        `Claude Code ${DEFAULT_MIN_CLAUDE_VERSION} or later is not installed on this runner (no \`claude\` on its PATH).`,
      );
    const { session } = this;
    return {
      cwd: session.workDir,
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: session.systemPrompt,
      },
      settingSources: ['project'],
      permissionMode: 'acceptEdits',
      canUseTool: this.canUseTool,
      hooks: { PreToolUse: [{ hooks: [this.preToolUse] }] },
      env: { ...session.env },
      abortController: this.abortController,
      includePartialMessages: false,
      stderr: (data: string) => {
        this.stderrLines.push(...data.split('\n').filter(Boolean));
        this.stderrLines.splice(
          0,
          Math.max(0, this.stderrLines.length - STDERR_KEEP_LINES),
        );
      },
      pathToClaudeCodeExecutable: executable.path,
      ...(session.model ? { model: session.model } : {}),
      ...(session.effort && EFFORTS.has(session.effort)
        ? { effort: session.effort as Options['effort'] }
        : {}),
      ...(session.resumeSessionId ? { resume: session.resumeSessionId } : {}),
      ...(session.maxTurns ? { maxTurns: session.maxTurns } : {}),
      // The run's skills folder is a local plugin (`.claude-plugin/plugin.json` and `skills/`): its skills load as
      // `nocobase-runner:<slug>` without touching the repository's or the person's own `.claude/`.
      ...(session.skills
        ? { plugins: [{ type: 'local', path: session.skills.root }] }
        : {}),
    };
  }

  private async run(): Promise<AdapterResult> {
    let thrown: unknown;
    try {
      if (this.stopping) throw new Error('aborted before start');
      const options = await this.buildOptions();
      const q = query({ prompt: this.input, options });
      this.closeQuery = () => q.close();
      for await (const message of q) this.onMessage(message);
    } catch (error) {
      thrown = error;
    } finally {
      this.finished = true;
      this.input.close();
    }
    const result = this.outcome(thrown);
    if (result.error)
      this.emit({
        type: 'error',
        content: result.error.message,
        meta: { reason: result.error.reason },
      });
    this.events.close();
    return result;
  }

  private outcome(thrown: unknown): AdapterResult {
    const usage = this.usage();
    const base = {
      usage,
      ...(this.sessionId ? { sessionId: this.sessionId } : {}),
    };
    if (this.stopping) {
      return {
        ...base,
        exit: 'aborted',
        error: { reason: 'cancelled', message: 'Stopped by the runner' },
      };
    }
    const r = this.lastResult;
    const signal: ClaudeFailureSignal = {
      assistantError: this.lastAssistantError,
    };
    if (thrown !== undefined) {
      const stderr = this.stderrLines.slice(-5).join('\n');
      signal.error = thrown;
      if (stderr) signal.resultErrors = [stderr];
    } else if (!r) {
      signal.error = new Error('Claude Code process exited without a result');
    } else if (r.subtype !== 'success') {
      Object.assign(signal, {
        resultSubtype: r.subtype,
        resultErrors: r.errors,
        terminalReason: r.terminal_reason,
        startupFailureReason: r.startup_failure_reason,
      });
    } else if (r.is_error) {
      Object.assign(signal, {
        resultErrors: [r.result],
        terminalReason: r.terminal_reason,
        apiErrorStatus: r.api_error_status,
      });
    } else {
      return { ...base, exit: 'completed', summary: r.result };
    }
    return { ...base, exit: 'error', error: classifyClaudeFailure(signal) };
  }

  /**
   * Run usage. modelUsage is cumulative per query() call and covers
   * subagents, so it is exact for a fresh session; a resumed session's
   * modelUsage also carries the earlier runs, so there the main-loop usage
   * of each turn is summed instead.
   */
  private usage(): Usage[] {
    if (this.session.resumeSessionId) {
      return this.turnUsage.inputTokens || this.turnUsage.outputTokens
        ? [{ ...this.turnUsage, ...(this.model ? { model: this.model } : {}) }]
        : [];
    }
    const modelUsage = this.lastResult?.modelUsage ?? {};
    return Object.entries(modelUsage).map(([model, u]) => ({
      tool: 'claude',
      model,
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      cacheReadTokens: u.cacheReadInputTokens,
      cacheWriteTokens: u.cacheCreationInputTokens,
      ...(u.thinkingTokens !== undefined
        ? { reasoningTokens: u.thinkingTokens }
        : {}),
    }));
  }

  private acknowledge(uuids: readonly string[] | undefined): void {
    for (const uuid of uuids ?? []) {
      const steer = this.pendingSteers.get(uuid);
      if (!steer) continue;
      this.pendingSteers.delete(uuid);
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

  private onMessage(message: SDKMessage): void {
    switch (message.type) {
      case 'system':
        this.onSystem(message);
        return;
      case 'assistant': {
        if (message.error) this.lastAssistantError = message.error;
        this.acknowledge(
          message.user_message_uuids ??
            (message.user_message_uuid ? [message.user_message_uuid] : []),
        );
        const parent = message.parent_tool_use_id
          ? { parentToolUseId: message.parent_tool_use_id }
          : {};
        for (const block of message.message.content) {
          if (block.type === 'text') {
            const capped = capText(block.text);
            this.emit({
              type: 'text',
              content: capped.text,
              meta: {
                ...parent,
                ...(capped.truncated ? { truncated: true } : {}),
              },
            });
          } else if (block.type === 'thinking') {
            const capped = capText(block.thinking);
            this.emit({
              type: 'thinking',
              content: capped.text,
              meta: {
                ...parent,
                ...(capped.truncated ? { truncated: true } : {}),
              },
            });
          } else if (
            block.type === 'tool_use' ||
            block.type === 'server_tool_use' ||
            block.type === 'mcp_tool_use'
          ) {
            this.toolNames.set(block.id, block.name);
            const capped = capInput(block.input);
            this.emit({
              type: 'toolUse',
              tool: block.name,
              input: capped.input,
              meta: {
                toolUseId: block.id,
                ...parent,
                ...(capped.truncated ? { truncated: true } : {}),
              },
            });
          }
        }
        return;
      }
      case 'user': {
        const content = message.message.content;
        if (!Array.isArray(content)) return;
        const parent = message.parent_tool_use_id
          ? { parentToolUseId: message.parent_tool_use_id }
          : {};
        for (const block of content) {
          if (block.type !== 'tool_result') continue;
          const capped = capText(toolResultText(block.content));
          this.emit({
            type: 'toolResult',
            tool: this.toolNames.get(block.tool_use_id),
            output: capped.text,
            meta: {
              toolUseId: block.tool_use_id,
              isError: Boolean(block.is_error),
              ...parent,
              ...(capped.truncated ? { truncated: true } : {}),
            },
          });
        }
        return;
      }
      case 'result':
        this.onResult(message);
        return;
      case 'auth_status':
        if (message.error)
          this.emit({
            type: 'status',
            content: 'authError',
            meta: { message: message.error },
          });
        return;
      case 'rate_limit_event':
        if (message.rate_limit_info.status !== 'allowed') {
          this.emit({
            type: 'status',
            content: 'rateLimit',
            meta: { ...message.rate_limit_info },
          });
        }
        return;
      default:
        return;
    }
  }

  private onSystem(message: Extract<SDKMessage, { type: 'system' }>): void {
    switch (message.subtype) {
      case 'init':
        this.sessionId = message.session_id;
        this.model = message.model;
        this.emit({
          type: 'status',
          content: 'started',
          meta: {
            sessionId: message.session_id,
            model: message.model,
            claudeCodeVersion: message.claude_code_version,
            permissionMode: message.permissionMode,
          },
        });
        return;
      case 'api_retry':
        this.lastAssistantError = message.error;
        this.emit({
          type: 'status',
          content: 'retrying',
          meta: {
            attempt: message.attempt,
            maxRetries: message.max_retries,
            delayMs: message.retry_delay_ms,
            errorStatus: message.error_status,
            error: message.error,
          },
        });
        return;
      case 'permission_denied':
        // Denials Claude Code decided itself (deny rules, mode); ours are reported already.
        this.report(
          this.toolNames.get(message.tool_use_id) ?? message.tool_name,
          undefined,
          message.tool_use_id,
          {
            allow: false,
            reason: message.decision_reason ?? message.message,
          },
        );
        return;
      case 'status':
        if (message.status === 'compacting')
          this.emit({ type: 'status', content: 'compacting' });
        return;
      case 'compact_boundary':
        this.emit({ type: 'status', content: 'compacted' });
        return;
      default:
        return;
    }
  }

  private onResult(message: SDKResultMessage): void {
    this.lastResult = message;
    this.sessionId = message.session_id;
    this.acknowledge(
      message.user_message_uuids ??
        (message.user_message_uuid ? [message.user_message_uuid] : []),
    );
    const u = message.usage;
    this.turnUsage = {
      ...this.turnUsage,
      inputTokens: this.turnUsage.inputTokens + (u.input_tokens ?? 0),
      outputTokens: this.turnUsage.outputTokens + (u.output_tokens ?? 0),
      cacheReadTokens:
        (this.turnUsage.cacheReadTokens ?? 0) +
        (u.cache_read_input_tokens ?? 0),
      cacheWriteTokens:
        (this.turnUsage.cacheWriteTokens ?? 0) +
        (u.cache_creation_input_tokens ?? 0),
    };
    this.emit({
      type: 'status',
      content: 'turnCompleted',
      meta: {
        subtype: message.subtype,
        isError: message.is_error,
        numTurns: message.num_turns,
        durationMs: message.duration_ms,
        costUsd: message.total_cost_usd,
        ...(message.terminal_reason
          ? { terminalReason: message.terminal_reason }
          : {}),
      },
    });
    this.emit({ type: 'usage', meta: { usage: this.usage() } });

    // End the session once nothing more is queued: no steer awaiting the
    // agent and no further turn announced. Otherwise wait for the next result.
    const failed = message.subtype !== 'success' || message.is_error;
    if (
      failed ||
      (this.pendingSteers.size === 0 &&
        !(message.queued_turn_count && message.queued_turn_count > 0))
    ) {
      this.input.close();
    }
  }
}

export function createClaudeAdapter(
  options?: ClaudeAdapterOptions,
): ClaudeAdapter {
  return new ClaudeAdapter(options);
}
