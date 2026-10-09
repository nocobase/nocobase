/**
 * The runner's side of the protocol (`RUNNER_ROUTES`): registering, staying connected, claiming runs and reporting on
 * them.
 */
import { z } from 'zod';

import {
  FailureReasonSchema,
  MAX_EVENTS_PER_BATCH,
  RunEventSchema,
  UsageSchema,
  type FailureReason,
  type RunEvent,
  type Usage,
} from './events.js';
import {
  ActiveJobSchema,
  JobPayloadSchema,
  type ActiveJob,
  type JobPayload,
} from './jobs.js';
import { DIST_PRODUCT_PATTERN } from './dist.js';
import { RunnerPolicySchema, type RunnerPolicy } from './policy.js';
import {
  RunAppSchema,
  RunInputSchema,
  RunPayloadSchema,
  RunStatusSchema,
  type RunApp,
  type RunInput,
  type RunPayload,
  type RunStatus,
} from './run.js';
import {
  AgentToolSchema,
  RunnerFeatureSchema,
  type AgentTool,
  type RunnerFeature,
} from './version.js';

/** A coding tool found on the runner's host. */
export interface ToolInfo {
  readonly kind: AgentTool;
  readonly version?: string;
  readonly path?: string;
  readonly authenticated: boolean;
}

export const ToolInfoSchema: z.ZodType<ToolInfo> = z.object({
  kind: AgentToolSchema,
  version: z.string().optional(),
  path: z.string().optional(),
  authenticated: z.boolean(),
});

/**
 * How many runs of each coding tool a runner may hold at once, beside its total slots: `{ claude: 2, codex: 1 }`. A tool
 * left out has no limit of its own and is bounded by the total only; a limit above the total is bounded by the total.
 * Jobs use no coding tool and count against the total only.
 */
export type ToolSlots = Readonly<Partial<Record<AgentTool, number>>>;

export const ToolSlotsSchema: z.ZodType<ToolSlots> = z.partialRecord(
  AgentToolSchema,
  z.number().int().positive().max(64),
);

/** How many runs of one coding tool a runner holds at most (`slots`) and could take now (`free`). */
export interface ToolLoad {
  readonly slots: number;
  readonly free: number;
}

export const ToolLoadSchema: z.ZodType<ToolLoad> = z.object({
  slots: z.number().int().nonnegative(),
  free: z.number().int().nonnegative(),
});

/**
 * A runner does not choose its trust level: the person who created the registration token did (`team` or
 * `ownerOnly`, with the token's creator as the runner's owner), and people change it on the server afterwards. What a
 * runner offers is reported, never configured: its system, its features and its coding tools with whether each is
 * signed in.
 */
export interface RegisterRequest {
  /** The one-time token from "Add runner"; it decides the runner's trust level and owner. */
  readonly registrationToken: string;
  readonly name: string;
  readonly hostname: string;
  readonly os: string;
  readonly arch: string;
  /** The runner's own version, shown to people; never compared. */
  readonly version: string;
  /**
   * The product the runner runs as and updates itself to (`DIST_ROUTES.resolve`): `RUNNER_PRODUCT`, or the CLI that
   * carries it. Runners from before it was reported leave it out and are offered no update.
   */
  readonly product?: string;
  readonly protocolVersion: number;
  readonly features: readonly RunnerFeature[];
  readonly tools: readonly ToolInfo[];
  /** How many runs it may hold at once; absent to take its registration token's (else 1). */
  readonly slots?: number;
  /** Its own limits per coding tool (`ToolSlots`); absent to take its registration token's (else none). */
  readonly toolSlots?: ToolSlots;
  /** What its owner's local policy lets it take (protocol 7); absent for anything. */
  readonly policy?: RunnerPolicy;
}

export const RegisterRequestSchema: z.ZodType<RegisterRequest> = z.object({
  registrationToken: z.string().min(1),
  name: z.string().min(1).max(200),
  hostname: z.string().max(255),
  os: z.string().max(64),
  arch: z.string().max(64),
  version: z.string().max(64),
  product: z.string().regex(DIST_PRODUCT_PATTERN).optional(),
  protocolVersion: z.number().int(),
  features: z.array(RunnerFeatureSchema),
  tools: z.array(ToolInfoSchema),
  slots: z.number().int().positive().max(64).optional(),
  toolSlots: ToolSlotsSchema.optional(),
  policy: RunnerPolicySchema.optional(),
});

export interface RegisterResponse {
  /** The application the runner registered with; a runner keeps one registration per application `id`. */
  readonly app?: RunApp;
  readonly runnerId: string;
  /** Shown only here; the server keeps a hash. */
  readonly runnerKey: string;
  readonly heartbeatIntervalMs: number;
  readonly pollTimeoutMs: number;
  readonly leaseRenewMs: number;
  /** ISO 8601, for the runner to notice clock skew. */
  readonly serverTime: string;
  /** The slots the application gave it: its own `slots` when it sent them, else its registration token's, else 1. */
  readonly slots?: number;
  /** The limits per coding tool the application gave it: its own when it sent them, else its registration token's. */
  readonly toolSlots?: ToolSlots;
}

export const RegisterResponseSchema: z.ZodType<RegisterResponse> = z.object({
  app: RunAppSchema.optional(),
  runnerId: z.string(),
  runnerKey: z.string(),
  heartbeatIntervalMs: z.number().int().positive(),
  pollTimeoutMs: z.number().int().positive(),
  leaseRenewMs: z.number().int().positive(),
  serverTime: z.string(),
  slots: z.number().int().positive().optional(),
  toolSlots: ToolSlotsSchema.optional(),
});

export interface ActiveRun {
  readonly runId: string;
  readonly pid?: number;
  readonly startedAt?: string;
}

export const ActiveRunSchema: z.ZodType<ActiveRun> = z.object({
  runId: z.string(),
  pid: z.number().int().optional(),
  startedAt: z.string().optional(),
});

/** What a runner reports every `heartbeatIntervalMs`: what it offers now, and the runs and jobs it holds. */
export interface HeartbeatRequest {
  readonly version: string;
  /** As in `RegisterRequest`: the product the runner runs as. */
  readonly product?: string;
  readonly features: readonly RunnerFeature[];
  readonly tools: readonly ToolInfo[];
  /** The runs the runner is holding. */
  readonly active: readonly ActiveRun[];
  /** The jobs the runner is holding (protocol 4); a runner that takes none leaves it out. */
  readonly jobs?: readonly ActiveJob[];
  /**
   * Slots are shared by runs and jobs. `tools` holds, for each coding tool it has a limit for, how many runs of it the
   * runner holds at most and could take now, across every application it serves; absent from runners that keep no
   * limits per tool.
   */
  readonly load: {
    readonly slots: number;
    readonly free: number;
    readonly tools?: Readonly<Partial<Record<AgentTool, ToolLoad>>>;
  };
  /** What its owner's local policy lets it take now (protocol 7); absent for anything. */
  readonly policy?: RunnerPolicy;
}

export const HeartbeatRequestSchema: z.ZodType<HeartbeatRequest> = z.object({
  version: z.string().max(64),
  product: z.string().regex(DIST_PRODUCT_PATTERN).optional(),
  features: z.array(RunnerFeatureSchema),
  tools: z.array(ToolInfoSchema),
  active: z.array(ActiveRunSchema),
  jobs: z.array(ActiveJobSchema).optional(),
  load: z.object({
    slots: z.number().int().nonnegative(),
    free: z.number().int().nonnegative(),
    tools: z.partialRecord(AgentToolSchema, ToolLoadSchema).optional(),
  }),
  policy: RunnerPolicySchema.optional(),
});

/**
 * A newer runner the application serves for this runner's target. A runner installed from the application's tarballs
 * downloads `downloadUrl` (with its key), checks `sha256`, and restarts on it between runs.
 */
export interface UpgradeNotice {
  readonly minVersion: string;
  readonly latestVersion: string;
  readonly downloadUrl: string;
  readonly reason: string;
  readonly sha256?: string;
  readonly channel?: string;
}

/**
 * The server cannot work with a runner speaking this protocol. It keeps the runner connected and shows it as needing
 * an upgrade, answers its claims with no work and releases what it holds; the runner stays up, keeps sending
 * heartbeats and stops claiming until an answer comes without it (it was upgraded, or the server was).
 */
export interface UpgradeRequired {
  readonly status: 'upgradeRequired';
  /** The protocol the runner speaks, as the server read it. */
  readonly runnerProtocolVersion: number;
  /** The protocols the server serves. */
  readonly minProtocolVersion: number;
  readonly protocolVersion: number;
  readonly message: string;
}

export const UpgradeRequiredSchema: z.ZodType<UpgradeRequired> = z.object({
  status: z.literal('upgradeRequired'),
  runnerProtocolVersion: z.number().int(),
  minProtocolVersion: z.number().int(),
  protocolVersion: z.number().int(),
  message: z.string(),
});

export interface HeartbeatResponse {
  readonly ok: true;
  readonly serverTime: string;
  readonly upgrade?: UpgradeNotice;
  /** Present when the server cannot work with the runner's protocol: claim nothing until it is gone. */
  readonly compatibility?: UpgradeRequired;
  /** Runs among `active` whose cancellation was requested: stop them and acknowledge (`cancelAck`). */
  readonly cancelRequested: readonly string[];
  /** Runs among `active` this runner no longer holds (finished, or given back to the queue): stop them, report nothing. */
  readonly release: readonly string[];
  /** The same for the jobs the heartbeat reported (`HeartbeatRequest.jobs`); absent when it reported none. */
  readonly jobs?: {
    readonly cancelRequested: readonly string[];
    readonly release: readonly string[];
  };
}

export const HeartbeatResponseSchema: z.ZodType<HeartbeatResponse> = z.object({
  ok: z.literal(true),
  serverTime: z.string(),
  upgrade: z
    .object({
      minVersion: z.string(),
      latestVersion: z.string(),
      downloadUrl: z.string(),
      reason: z.string(),
      sha256: z
        .string()
        .regex(/^[0-9a-f]{64}$/u)
        .optional(),
      channel: z.string().optional(),
    })
    .optional(),
  compatibility: UpgradeRequiredSchema.optional(),
  cancelRequested: z.array(z.string()),
  release: z.array(z.string()),
  jobs: z
    .object({
      cancelRequested: z.array(z.string()),
      release: z.array(z.string()),
    })
    .optional(),
});

export interface ClaimRequest {
  /** How many runs and jobs together the runner can take now. */
  readonly free: number;
  /**
   * How many runs of each coding tool it can take now, for the tools it keeps a limit for; a tool left out is bounded
   * by `free` only. Absent from runners that keep no limits per tool.
   */
  readonly tools?: Readonly<Partial<Record<AgentTool, number>>>;
}

export const ClaimRequestSchema: z.ZodType<ClaimRequest> = z.object({
  free: z.number().int().nonnegative().max(64),
  tools: z
    .partialRecord(AgentToolSchema, z.number().int().nonnegative().max(64))
    .optional(),
});

/**
 * An empty `runs` (and no `jobs`) means the wait ended without work; claim again. Together they hold at most `free`
 * items. `jobs` (protocol 4) only ever holds jobs of kinds the runner announced (`jobs.<kind>` features).
 */
export interface ClaimResponse {
  readonly runs: readonly RunPayload[];
  readonly jobs?: readonly JobPayload[];
}

export const ClaimResponseSchema: z.ZodType<ClaimResponse> = z.object({
  runs: z.array(RunPayloadSchema),
  jobs: z.array(JobPayloadSchema).optional(),
});

export type LeaseRequest = Readonly<Record<string, never>>;

export const LeaseRequestSchema: z.ZodType<LeaseRequest> = z.object({});

export interface LeaseResponse {
  readonly leaseExpiresAt: string;
  readonly cancelRequested: boolean;
  /** Input not yet reported as handled, including what was given at claim time. */
  readonly inputs: readonly RunInput[];
}

export const LeaseResponseSchema: z.ZodType<LeaseResponse> = z.object({
  leaseExpiresAt: z.string(),
  cancelRequested: z.boolean(),
  inputs: z.array(RunInputSchema),
});

export interface StartRequest {
  readonly workDir: string;
  readonly adapter: { readonly kind: AgentTool; readonly version?: string };
  /** Whether the agent takes input while running; if not, input waits for the next run. */
  readonly acceptsInput: boolean;
  readonly sessionId?: string | null;
}

export const StartRequestSchema: z.ZodType<StartRequest> = z.object({
  workDir: z.string().max(1024),
  adapter: z.object({
    kind: AgentToolSchema,
    version: z.string().max(64).optional(),
  }),
  acceptsInput: z.boolean(),
  sessionId: z.string().max(200).nullable().optional(),
});

export interface StartResponse {
  readonly status: RunStatus;
  readonly leaseExpiresAt: string;
  readonly cancelRequested: boolean;
  readonly inputs: readonly RunInput[];
}

export const StartResponseSchema: z.ZodType<StartResponse> = z.object({
  status: RunStatusSchema,
  leaseExpiresAt: z.string(),
  cancelRequested: z.boolean(),
  inputs: z.array(RunInputSchema),
});

export interface EventsRequest {
  readonly events: readonly RunEvent[];
}

export const EventsRequestSchema: z.ZodType<EventsRequest> = z.object({
  events: z.array(RunEventSchema).max(MAX_EVENTS_PER_BATCH),
});

export interface EventsResponse {
  /** Events stored by this request. */
  readonly accepted: number;
  /** Events already stored by an earlier request. */
  readonly duplicates: number;
  readonly cancelRequested: boolean;
}

export const EventsResponseSchema: z.ZodType<EventsResponse> = z.object({
  accepted: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  cancelRequested: z.boolean(),
});

export interface StatusResponse {
  readonly status: RunStatus;
  readonly cancelRequested: boolean;
  readonly inputs: readonly RunInput[];
  readonly leaseExpiresAt: string | null;
}

export const StatusResponseSchema: z.ZodType<StatusResponse> = z.object({
  status: RunStatusSchema,
  cancelRequested: z.boolean(),
  inputs: z.array(RunInputSchema),
  leaseExpiresAt: z.string().nullable(),
});

export interface RepoReport {
  readonly url: string;
  readonly branch: string;
  readonly pushed: boolean;
  readonly headSha?: string;
}

export const RepoReportSchema: z.ZodType<RepoReport> = z.object({
  url: z.string().min(1),
  branch: z.string().min(1),
  pushed: z.boolean(),
  headSha: z.string().max(64).optional(),
});

export interface CompleteRequest {
  readonly summary: string;
  /**
   * Must cover every input the run was given, or the server answers `RUN_INPUT_PENDING` with the rest
   * (`details.inputIds`, `details.inputs`). An input counts as handled once it was delivered to the agent (the runner
   * reports an `input` event for it); input that arrived after the agent's last turn must be delivered in another turn
   * before the run completes.
   */
  readonly handledInputIds: readonly string[];
  readonly usage?: readonly Usage[];
  readonly sessionId?: string;
  readonly repos?: readonly RepoReport[];
}

export const CompleteRequestSchema: z.ZodType<CompleteRequest> = z.object({
  summary: z.string().max(100_000),
  handledInputIds: z.array(z.string()),
  usage: z.array(UsageSchema).optional(),
  sessionId: z.string().max(200).optional(),
  repos: z.array(RepoReportSchema).optional(),
});

export interface FailRequest {
  readonly reason: FailureReason;
  readonly detail?: string;
  readonly handledInputIds?: readonly string[];
  readonly usage?: readonly Usage[];
  readonly sessionId?: string;
  readonly repos?: readonly RepoReport[];
}

export const FailRequestSchema: z.ZodType<FailRequest> = z.object({
  reason: FailureReasonSchema,
  detail: z.string().max(10_000).optional(),
  handledInputIds: z.array(z.string()).optional(),
  usage: z.array(UsageSchema).optional(),
  sessionId: z.string().max(200).optional(),
  repos: z.array(RepoReportSchema).optional(),
});

export interface CancelAckRequest {
  readonly handledInputIds?: readonly string[];
  readonly usage?: readonly Usage[];
}

export const CancelAckRequestSchema: z.ZodType<CancelAckRequest> = z.object({
  handledInputIds: z.array(z.string()).optional(),
  usage: z.array(UsageSchema).optional(),
});

/** The answer to `complete`, `fail` and `cancelAck`. */
export interface FinishResponse {
  readonly status: RunStatus;
  /** Set when a failed attempt went back to the queue: when the next attempt may start. */
  readonly retryAt?: string;
}

export const FinishResponseSchema: z.ZodType<FinishResponse> = z.object({
  status: RunStatusSchema,
  retryAt: z.string().optional(),
});
