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
import { detectExec } from './detect-exec.ts';
import type { ClaudeFailureSignal } from './classify.ts';
import { permissionInputSummary } from './input-summary.ts';
import type { PermissionInputSummary } from './input-summary.ts';
import { denialMessage } from './policy-denial.ts';
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
export const DEFAULT_MIN_CLAUDE_VERSION = '2.1.284';

const EFFORTS = new Set(TOOL_EFFORTS.claude);
const STOP_GRACE_MS = 5000;
const STDERR_KEEP_LINES = 40;
const PERMISSION_TIMEOUT_MS = 5000;

export interface ExecResult {
  code: number;
  stdout: string;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

export interface ClaudeAdapterOptions {
  minVersion?: string;
  /** PATH searched for `claude`; defaults to the PATH of `env`. */
  searchPath?: string;
  /** What detection runs with (`detectionEnv`); the runner's own environment when absent. */
  env?: Record<string, string>;
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

export { denialMessage } from './policy-denial.ts';

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClaudeAdapter implements AgentAdapter {
  readonly kind = 'claude' as const;
  private readonly options: Required<
    Omit<ClaudeAdapterOptions, 'searchPath' | 'env'>
  > & { searchPath: string };
  private detection?: Promise<{
    detection: ToolDetection;
    executable: ResolvedExecutable | undefined;
  }>;

  constructor(options: ClaudeAdapterOptions = {}) {
    this.options = {
      minVersion: options.minVersion ?? DEFAULT_MIN_CLAUDE_VERSION,
      exec: options.exec ?? detectExec(options.env),
      searchPath: options.searchPath ?? (options.env ?? process.env).PATH ?? '',
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
    const { exec, minVersion, searchPath } = this.options;
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
        ...(version !== undefined && !usable
          ? { reason: 'versionTooOld' as const, minVersion }
          : {}),
      },
      executable: usable ? { path: found, version } : undefined,
    };
  }

  start(session: AdapterSession): AdapterHandle {
    return new ClaudeRun(
      session,
      () => this.resolveExecutable(),
      () => this.detect(),
    ).handle();
  }
}

/** Why there is no `claude` to run, in words that say what to do about it. */
export function claudeUnavailableMessage(detection: ToolDetection): string {
  if (detection.reason === 'versionTooOld')
    return `Claude Code ${detection.version ?? 'on this runner'} is too old; ${detection.minVersion ?? DEFAULT_MIN_CLAUDE_VERSION} or later is required. Run \`claude update\` on the runner's host, then restart the runner.`;
  if (detection.path)
    return `Claude Code at ${detection.path} did not report its version; ${detection.minVersion ?? DEFAULT_MIN_CLAUDE_VERSION} or later is required.`;
  return `Claude Code ${DEFAULT_MIN_CLAUDE_VERSION} or later is not installed on this runner (no \`claude\` on its PATH).`;
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
  /** Permission events already emitted, by `<toolUseId>:<source>:<decision>`. */
  private readonly reported = new Set<string>();
  private readonly toolInputs = new Map<string, unknown>();
  /** Summaries of the tool inputs, taken before they were capped for the transcript. */
  private readonly toolSummaries = new Map<
    string,
    PermissionInputSummary | undefined
  >();
  private readonly backgroundTasks = new Set<string>();
  private awaitingIdle = false;
  private permissionChannelFailure?: string;
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
  private readonly detect: () => Promise<ToolDetection>;

  constructor(
    session: AdapterSession,
    resolveExecutable: () => Promise<ResolvedExecutable | undefined>,
    detect: () => Promise<ToolDetection>,
  ) {
    this.session = session;
    this.resolveExecutable = resolveExecutable;
    this.detect = detect;
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
    signal: AbortSignal,
  ): Promise<{ allow: boolean; reason?: string }> {
    const cached = toolUseId ? this.decisions.get(toolUseId) : undefined;
    if (cached) return cached;
    let decision: { allow: boolean; reason?: string };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: (() => void) | undefined;
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Policy decision timed out after ${PERMISSION_TIMEOUT_MS}ms`,
              ),
            ),
          PERMISSION_TIMEOUT_MS,
        );
        onAbort = () =>
          reject(
            new Error(
              'Policy decision cancelled by the permission control channel',
            ),
          );
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
      });
      decision = normalizeDecision(
        await Promise.race([
          deadline,
          Promise.resolve().then(() => this.session.permission(tool, input)),
        ]),
      );
    } catch (error) {
      decision = {
        allow: false,
        reason: `Policy error: ${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      clearTimeout(timer);
      if (onAbort) signal.removeEventListener('abort', onAbort);
    }
    if (toolUseId) this.decisions.set(toolUseId, decision);
    return decision;
  }

  /**
   * Emits one permission event per call, source and decision. `runner` is the runner's policy; `cli` a denial Claude
   * Code decided itself (its own rules or mode); `diagnostic` a refusal no runner denial explains. A runner denial
   * and a CLI denial of the same call are both kept, so neither reason hides the other.
   */
  private report(
    tool: string,
    input: unknown,
    toolUseId: string | undefined,
    decision: { allow: boolean; reason?: string },
    source: 'runner' | 'cli' | 'diagnostic',
    summary: PermissionInputSummary | undefined = decision.allow
      ? undefined
      : permissionInputSummary(input),
  ) {
    if (toolUseId) {
      const key = `${toolUseId}:${source}:${decision.allow ? 'allow' : 'deny'}`;
      if (this.reported.has(key)) return;
      this.reported.add(key);
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
        source,
        ...(summary ? { inputSummary: summary } : {}),
        ...(capped.truncated ? { truncated: true } : {}),
      },
    });
  }

  /** Whether the runner's own policy denied the call: its decision, never what was reported about it. */
  private runnerDenied(toolUseId: string): boolean {
    return this.decisions.get(toolUseId)?.allow === false;
  }

  /**
   * Runs before Claude Code's own permission rules, so a policy denial
   * cannot be bypassed by allow rules in project settings. Deny here so
   * permissionDecisionReason reaches the model directly; routing through
   * 'ask' and canUseTool can replace it with Claude Code's user-stop text.
   */
  private readonly preToolUse: HookCallback = async (
    hookInput,
    _id,
    { signal },
  ) => {
    if (hookInput.hook_event_name !== 'PreToolUse') return {};
    const input = (hookInput.tool_input ?? {}) as Record<string, unknown>;
    const decision = await this.decide(
      hookInput.tool_name,
      input,
      hookInput.tool_use_id,
      signal,
    );
    this.report(
      hookInput.tool_name,
      input,
      hookInput.tool_use_id,
      decision,
      'runner',
    );
    if (decision.allow) return {};
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: denialMessage(decision.reason),
      },
    };
  };

  private readonly canUseTool: CanUseTool = async (
    tool,
    input,
    { toolUseID, signal },
  ): Promise<PermissionResult> => {
    const decision = await this.decide(tool, input, toolUseID, signal);
    this.report(tool, input, toolUseID, decision, 'runner');
    return decision.allow
      ? { behavior: 'allow', updatedInput: input }
      : { behavior: 'deny', message: denialMessage(decision.reason) };
  };

  // -- the run --------------------------------------------------------------

  private async unavailable(): Promise<string> {
    return claudeUnavailableMessage(
      await this.detect().catch((): ToolDetection => ({
        installed: false,
        authenticated: false,
      })),
    );
  }

  private async buildOptions(): Promise<Options> {
    const executable = await this.resolveExecutable();
    if (!executable) throw new Error(await this.unavailable());
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
      permissionPrompts: 'host',
      canUseTool: this.canUseTool,
      hooks: { PreToolUse: [{ hooks: [this.preToolUse] }] },
      // Without state events, a result can be mistaken for the end of background continuations.
      env: { ...session.env, CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS: '1' },
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
    if (this.permissionChannelFailure)
      return {
        ...base,
        exit: 'error',
        error: {
          reason: 'toolProcess',
          message: this.permissionChannelFailure,
        },
      };
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
            this.toolInputs.set(block.id, capped.input);
            this.toolSummaries.set(
              block.id,
              permissionInputSummary(block.input),
            );
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
          if (
            block.is_error &&
            /The user doesn't want to take this action right now|Tool permission request failed.*(?:Stream closed|AbortError)/s.test(
              capped.text,
            ) &&
            !this.runnerDenied(block.tool_use_id)
          ) {
            // Claude Code's user-stop text for a call the runner did not deny: its own rules refused it, or the
            // permission control channel is gone. Either way the work cannot go on as if it had been answered.
            const reason = `Claude Code refused the tool without a runner denial. The permission control channel may be unavailable or native CLI rules may have denied it; this is not a user instruction to stop. CLI feedback: ${capped.text.slice(0, 1024)}`;
            this.permissionChannelFailure = reason;
            this.report(
              this.toolNames.get(block.tool_use_id) ?? 'unknown',
              this.toolInputs.get(block.tool_use_id),
              block.tool_use_id,
              { allow: false, reason },
              'diagnostic',
              this.toolSummaries.get(block.tool_use_id),
            );
          }
          if (!block.is_error && this.decisions.get(block.tool_use_id)?.allow)
            this.permissionChannelFailure = undefined;
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
        // Denials Claude Code decided itself (deny rules, mode); the runner's own are reported already.
        if (this.runnerDenied(message.tool_use_id)) return;
        this.report(
          this.toolNames.get(message.tool_use_id) ?? message.tool_name,
          this.toolInputs.get(message.tool_use_id),
          message.tool_use_id,
          {
            allow: false,
            reason: message.decision_reason ?? message.message,
          },
          'cli',
          this.toolSummaries.get(message.tool_use_id),
        );
        return;
      case 'background_tasks_changed':
        this.backgroundTasks.clear();
        for (const task of message.tasks)
          if (!task.ambient) this.backgroundTasks.add(task.task_id);
        return;
      case 'session_state_changed':
        if (message.state === 'idle' && this.awaitingIdle)
          this.closeInputIfDone();
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
    // The result list also covers SDK denials that emitted no permission_denied frame.
    for (const denial of message.permission_denials ?? []) {
      if (this.runnerDenied(denial.tool_use_id)) continue;
      this.report(
        denial.tool_name,
        denial.tool_input,
        denial.tool_use_id,
        {
          allow: false,
          reason:
            'Claude Code denied this call outside the runner policy callback; consult the CLI permission rules and control-channel diagnostics.',
        },
        'cli',
      );
    }
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

    // result ends a turn, not the process: EOF here also kills the permission
    // control channel needed by background tasks and their continuation turns.
    this.awaitingIdle = true;
    if (message.subtype !== 'success' || message.is_error) this.input.close();
  }

  private closeInputIfDone(): void {
    if (
      this.backgroundTasks.size === 0 &&
      this.pendingSteers.size === 0 &&
      !(
        this.lastResult?.queued_turn_count &&
        this.lastResult.queued_turn_count > 0
      )
    )
      this.input.close();
    this.awaitingIdle = false;
  }
}

export function createClaudeAdapter(
  options?: ClaudeAdapterOptions,
): ClaudeAdapter {
  return new ClaudeAdapter(options);
}
