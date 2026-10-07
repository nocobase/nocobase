/**
 * What a run reports while it works (events), what it cost (usage) and why it stopped (failure reasons).
 */
import { z } from 'zod';

import { AgentToolSchema, type AgentTool } from './version.js';

export const RUN_EVENT_TYPES = [
  'text',
  'thinking',
  'toolUse',
  'toolResult',
  /** A tool call the runner's policy decided: `meta.decision` is `allow` or `deny`, `meta.reason` says why. */
  'permission',
  /** Input was delivered to the agent: `meta.inputIds`. */
  'input',
  'checkout',
  'status',
  'error',
  'usage',
] as const;

export type RunEventType = (typeof RUN_EVENT_TYPES)[number];

/** At most this many events in one `EventsRequest`. */
export const MAX_EVENTS_PER_BATCH = 200;
/** `content` and `output` are cut to this many bytes, and `truncated` set. */
export const MAX_EVENT_CONTENT_BYTES = 65_536;

/**
 * One thing that happened in a run. `seq` is the runner's counter for the run, from 1; the server stores each
 * `(runId, seq)` once, so a batch can be resent safely.
 */
export interface RunEvent {
  readonly seq: number;
  /** ISO 8601. */
  readonly at: string;
  readonly type: RunEventType;
  readonly tool?: string;
  readonly content?: string;
  readonly input?: unknown;
  readonly output?: string;
  readonly truncated?: boolean;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export const RunEventSchema: z.ZodType<RunEvent> = z.object({
  seq: z.number().int().positive(),
  at: z.string().min(1),
  type: z.enum(RUN_EVENT_TYPES),
  tool: z.string().max(200).optional(),
  content: z.string().optional(),
  input: z.unknown().optional(),
  output: z.string().optional(),
  truncated: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Tokens one model used; the columns match the platform's AI usage records. The counts do not overlap, so each is
 * priced at its own rate: `inputTokens` excludes cached input (`cacheReadTokens`) and cache writes
 * (`cacheWriteTokens`), and `outputTokens` includes the reasoning tokens, which `reasoningTokens` reports again for
 * information only.
 */
export interface Usage {
  readonly tool: AgentTool;
  readonly model?: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
  readonly cacheWriteTokens?: number;
  readonly reasoningTokens?: number;
}

const tokens = z.number().int().nonnegative();

export const UsageSchema: z.ZodType<Usage> = z.object({
  tool: AgentToolSchema,
  model: z.string().max(200).optional(),
  inputTokens: tokens,
  outputTokens: tokens,
  cacheReadTokens: tokens.optional(),
  cacheWriteTokens: tokens.optional(),
  reasoningTokens: tokens.optional(),
});

export const FAILURE_REASONS = [
  'runnerOffline',
  'leaseExpired',
  'startTimeout',
  'cancelled',
  'idleTimeout',
  'setupFailed',
  'checkoutFailed',
  /** The application's CLI (`RunPayload.cli`) could not be installed or found. */
  'cliUnavailable',
  'toolAuth',
  'toolQuota',
  'toolRateLimit',
  'toolNetwork',
  'toolProcess',
  'contextOverflow',
  /** Never claimed: the run waited in the queue longer than its subject allows (the server's sweeper decides). */
  'queuedExpired',
  /**
   * The run's model is not available: on a runner, the coding tool does not know it or its account may not use it
   * (`RunTool.model`); in an online run (on the server, no runner), the model service or model is gone, disabled or
   * unknown to its provider. `toolAuth`, `toolQuota`, `toolRateLimit`, `toolNetwork` and `contextOverflow` name the model service's
   * failures of those kinds too.
   */
  'modelUnavailable',
  /** An online run called tools for more model steps than a run may take, without answering. */
  'stepLimit',
  /**
   * The runner's local policy (`RunnerPolicy`) does not let it take this work (protocol 7). Retried: the server, told
   * the policy, gives it to another runner.
   */
  'policyRefused',
  'unknown',
] as const;

export type FailureReason = (typeof FAILURE_REASONS)[number];

export const FailureReasonSchema: z.ZodType<FailureReason> =
  z.enum(FAILURE_REASONS);

/** Failures worth another attempt: the run goes back to the queue while attempts remain. */
export const RETRYABLE_FAILURES: readonly FailureReason[] = [
  'runnerOffline',
  'policyRefused',
  'leaseExpired',
  'startTimeout',
  'cliUnavailable',
  'toolNetwork',
  'toolRateLimit',
];

export function isRetryable(reason: FailureReason): boolean {
  return RETRYABLE_FAILURES.includes(reason);
}
