/**
 * The coding-agent adapter contract (frozen, v1).
 *
 * The runner drives every coding tool (Claude Code, Codex, OpenCode, Pi)
 * through this interface. Changes after the freeze go through a pull request
 * that updates every adapter and the runner's fake adapter together.
 *
 * The protocol types come from `@nocobase/agent-protocol`; `Usage` stays a mutable local copy because adapters
 * accumulate it.
 */

import type {
  AgentTool,
  FailureReason,
  RunEventType,
  RunnerFeature,
} from '../../protocol/index.ts';

export type { FailureReason, RunEventType, RunnerFeature };

export type ToolKind = AgentTool;

export interface Usage {
  tool: ToolKind;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reasoningTokens?: number;
}

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

/**
 * Where the runner placed the run's skills (src/agent/skills.ts). `root` is a Claude Code plugin directory and an
 * OpenCode config directory (`.claude-plugin/plugin.json`, `skills/`); `dir` is `root/skills`, one directory per skill.
 */
export interface SkillsPlacement {
  root: string;
  dir: string;
  slugs: string[];
}

/** Event types an adapter emits; `checkout` belongs to the runner. */
export type AdapterEventType = Exclude<RunEventType, 'checkout'>;

/**
 * One transcript event. The runner assigns `seq` and sends it as a protocol
 * `RunEvent`. `content` and `output` are already capped at
 * {@link MAX_EVENT_TEXT_BYTES}; `meta.truncated` is true when they were cut.
 *
 * Meaning of the fields per type:
 * - text / thinking: `content` is the text.
 * - toolUse: `tool`, `input`, `meta.toolUseId`.
 * - toolResult: `tool`, `output`, `meta.toolUseId`, `meta.isError`.
 * - permission: `tool`, `input`, `meta.decision` ('allow' | 'deny'),
 *   `meta.reason`. The adapter emits these itself; the permission callback
 *   must not emit its own.
 * - input: a steered input reached the agent; `content` is its text,
 *   `meta.inputId` the id given to `steer()`.
 * - status: lifecycle notes (`content` is a short code such as 'started',
 *   'turnCompleted', 'retrying', 'compacting'); details in `meta`.
 * - error: a non-fatal or fatal error; `content` is the message,
 *   `meta.reason` a {@link FailureReason}.
 * - usage: `meta.usage` is the run's {@link Usage}[] so far (cumulative).
 */
export interface AdapterEvent {
  type: AdapterEventType;
  at: string;
  tool?: string;
  content?: string;
  input?: unknown;
  output?: string;
  meta?: Record<string, unknown>;
}

export const MAX_EVENT_TEXT_BYTES: number = 64 * 1024;

/** What the runner's policy returns for one tool call. */
export type PermissionDecision = 'allow' | 'deny' | { deny: string };

export type PermissionCheck = (
  tool: string,
  input: Record<string, unknown>,
) => Promise<PermissionDecision>;

export interface ToolDetection {
  installed: boolean;
  version?: string;
  path?: string;
  authenticated: boolean;
}

export interface AdapterSession {
  /** Absolute path the agent works in (the checked-out worktree). */
  workDir: string;
  /** The first user message of the run. */
  prompt: string;
  /** The rendered brief (system, task, context, agent layers joined). */
  systemPrompt: string;
  model?: string;
  /** Reasoning effort; adapters ignore values their tool does not know. */
  effort?: string;
  /** Resume this tool session instead of starting a fresh one. */
  resumeSessionId?: string;
  /**
   * The complete environment of the tool process (already whitelisted by
   * the runner). The adapter adds nothing from its own process environment.
   */
  env: Record<string, string>;
  /** The run's skills, for the adapter to register the way its tool finds skills; none without skills. */
  skills?: SkillsPlacement;
  /** The runner's tool policy; consulted for every tool call the agent makes. */
  permission: PermissionCheck;
  maxTurns?: number;
  /** Aborting it has the same effect as `handle.stop()`. */
  abort: AbortSignal;
}

export interface AdapterResult {
  sessionId?: string;
  /** Cumulative for this run, one entry per model. */
  usage: Usage[];
  exit: 'completed' | 'aborted' | 'error';
  error?: { reason: FailureReason; message: string };
  /** The agent's final message, when the tool reports one. */
  summary?: string;
}

export interface AdapterHandle {
  /** Ends after the run ends; never throws (failures arrive in `result`). */
  events: AsyncIterable<AdapterEvent>;
  /**
   * Deliver an input while the agent runs. Resolves true when the input was
   * queued into the live session (an `input` event follows once the agent
   * picks it up), false when it cannot be delivered (unsupported, or the
   * session already finished), in which case the runner carries the input
   * over to the next turn.
   */
  steer(input: string, inputId?: string): Promise<boolean>;
  /** Terminate the agent; resolves once the tool process is gone. */
  stop(): Promise<void>;
  /** Never rejects. */
  result: Promise<AdapterResult>;
}

export interface AgentAdapter {
  kind: ToolKind;
  detect(): Promise<ToolDetection>;
  features(): RunnerFeature[];
  start(session: AdapterSession): AdapterHandle;
}
