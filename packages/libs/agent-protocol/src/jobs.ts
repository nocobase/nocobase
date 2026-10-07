/**
 * Jobs: deterministic steps a runner executes without a model, beside agent runs. A job is not a run: it has no agent,
 * no prompt, no brief, no run token and no CLI, it never wakes an agent, and it is not counted in an agent's metrics.
 * It shares a run's mechanics: one long-poll claim hands out both (`ClaimResponse.jobs`), a claimed job is held under
 * a lease the runner renews, events stream in idempotent batches numbered from `job.firstSeq`, and a job ends with
 * `complete`, `fail` or `cancelAck` (`RUNNER_ROUTES.job*`).
 *
 * Lifecycle: `queued → dispatched → running → completed | failed | cancelled`, as a run's (`RUN_STATUSES`).
 *
 * What a job does is its `kind`, and a runner announces each kind it executes as the feature `jobs.<kind>`
 * (`jobFeature`); a server hands a job only to a runner with that feature, whose owner let it take jobs. There is one
 * kind:
 *
 * - `build`: check out a commit, run a command an administrator configured, and stream named output files to the
 *   URLs given (with the headers given, such as a one-time ticket). The command runs with only the variables the job
 *   names and a minimal environment: none of the runner's own variables, keys or home directory.
 *
 * Nothing here names an application concept: what a job is for is the application's, which reads the result.
 */
import { z } from 'zod';

import { FAILURE_REASONS, type FailureReason } from './events.js';
import {
  RunAppSchema,
  RunStatusSchema,
  type RunApp,
  type RunStatus,
} from './run.js';
import type { RunnerFeature } from './version.js';

export const JOB_KINDS = ['build'] as const;

export type JobKind = (typeof JOB_KINDS)[number];

export const JobKindSchema: z.ZodType<JobKind> = z.enum(JOB_KINDS);

/** The runner feature that announces a job kind: `jobs.build`. */
export function jobFeature<K extends JobKind>(kind: K): `jobs.${K}` {
  return `jobs.${kind}`;
}

/** A job's statuses are a run's. */
export type JobStatus = RunStatus;

export const JobStatusSchema: z.ZodType<JobStatus> = RunStatusSchema;

/**
 * Why a job ended without a result, besides the reasons a run can fail for (`FAILURE_REASONS`, of which jobs use the
 * runner-side ones: `runnerOffline`, `leaseExpired`, `startTimeout`, `cancelled`, `checkoutFailed`, `unknown`).
 *
 * - `jobTimeout`: the job ran longer than its `timeoutSec` and was stopped.
 * - `commandFailed`: the command exited with a non-zero code (`JobFailRequest.exitCode`).
 * - `outputMissing`: the command succeeded but an output file is missing or too large.
 * - `uploadFailed`: an output could not be uploaded (`JobFailRequest.detail` says what the upload answered).
 * - `jobUnsupported`: the runner cannot execute the job as given.
 */
export const JOB_ONLY_FAILURE_REASONS = [
  'jobTimeout',
  'commandFailed',
  'outputMissing',
  'uploadFailed',
  'jobUnsupported',
] as const;

export type JobFailureReason =
  FailureReason | (typeof JOB_ONLY_FAILURE_REASONS)[number];

export const JOB_FAILURE_REASONS: readonly JobFailureReason[] = [
  ...FAILURE_REASONS,
  ...JOB_ONLY_FAILURE_REASONS,
];

export const JobFailureReasonSchema: z.ZodType<JobFailureReason> = z.enum([
  ...FAILURE_REASONS,
  ...JOB_ONLY_FAILURE_REASONS,
]);

/** Failures worth another attempt: the job goes back to the queue while attempts remain. */
export const RETRYABLE_JOB_FAILURES: readonly JobFailureReason[] = [
  'runnerOffline',
  'policyRefused',
  'leaseExpired',
  'startTimeout',
  'checkoutFailed',
];

export function isRetryableJobFailure(reason: JobFailureReason): boolean {
  return RETRYABLE_JOB_FAILURES.includes(reason);
}

const relativePath = z
  .string()
  .min(1)
  .max(1024)
  .refine(
    (value) =>
      !value.startsWith('/') &&
      !/^[A-Za-z]:/u.test(value) &&
      !value.split(/[\\/]/u).some((part) => part === '..' || part === ''),
    'must be a relative path inside the checkout',
  );

const sha = z.string().regex(/^[0-9a-f]{7,64}$/u, 'must be a commit hash');

const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;

/**
 * The repository a job works on. The runner fetches it into its bare cache with its own git credentials, or with
 * `auth` when given (an HTTPS token, sent only to git for this fetch); the job's command never sees either.
 */
export interface JobRepo {
  readonly url: string;
  /** A branch or tag to resolve when `sha` is absent; with `sha`, the ref is only fetched to find the commit. */
  readonly ref?: string;
  /** The commit to check out; the job fails `checkoutFailed` when the repository does not have it. */
  readonly sha?: string;
  readonly auth?: { readonly username?: string; readonly token: string };
}

const repoObject = z.object({
  url: z.string().min(1).max(2000),
  ref: z.string().min(1).max(255).optional(),
  sha: sha.optional(),
  auth: z
    .object({
      username: z.string().min(1).max(200).optional(),
      token: z.string().min(1).max(10_000),
    })
    .optional(),
});

export const JobRepoSchema: z.ZodType<JobRepo> = repoObject.refine(
  (repo) => repo.ref !== undefined || repo.sha !== undefined,
  'needs a ref or a sha',
);

/** A variable of the job's command. `secret` values are masked in the job's log. */
export interface JobEnvVar {
  readonly name: string;
  readonly value: string;
  readonly secret?: boolean;
}

export const JobEnvVarSchema: z.ZodType<JobEnvVar> = z.object({
  name: z.string().regex(ENV_NAME).max(200),
  value: z.string().max(100_000),
  secret: z.boolean().optional(),
});

/**
 * What a build runs, set by an administrator and never by an agent: an argument vector executed directly, or a shell
 * script run by `/bin/sh -c`.
 */
export type JobCommand =
  { readonly argv: readonly string[] } | { readonly shell: string };

export const JobCommandSchema: z.ZodType<JobCommand> = z.union([
  z.object({ argv: z.array(z.string().max(10_000)).min(1).max(200) }),
  z.object({ shell: z.string().min(1).max(100_000) }),
]);

/**
 * Where an output goes: the runner streams the file as the request body, with exactly these headers (a one-time
 * ticket, say), and reports the answer. A `url` without a scheme is a path on the application the job came from.
 * Header values are never written to the job's log.
 */
export interface JobUpload {
  readonly url: string;
  readonly method: 'POST' | 'PUT';
  readonly headers: Readonly<Record<string, string>>;
  /** `application/octet-stream` when absent. */
  readonly contentType?: string;
}

export const JobUploadSchema: z.ZodType<JobUpload> = z.object({
  url: z.string().min(1).max(4000),
  method: z.enum(['POST', 'PUT']),
  headers: z.record(z.string(), z.string().max(10_000)),
  contentType: z.string().min(1).max(200).optional(),
});

/** A file the build produces, relative to its `workdir`, and where to upload it. */
export interface BuildOutput {
  readonly path: string;
  readonly upload: JobUpload;
  /** The job fails `outputMissing` when the file is larger. */
  readonly maxBytes?: number;
}

export const BuildOutputSchema: z.ZodType<BuildOutput> = z.object({
  path: relativePath,
  upload: JobUploadSchema,
  maxBytes: z.number().int().positive().optional(),
});

/** The longest a job may run. */
export const MAX_JOB_TIMEOUT_SEC: number = 6 * 60 * 60;

/** `build`: check out a commit, run a command, upload its outputs. */
export interface BuildJobSpec {
  readonly repo: JobRepo;
  /** Where the command runs, relative to the checkout; the checkout itself when absent. Outputs are relative to it. */
  readonly workdir?: string;
  readonly command: JobCommand;
  /** The command's variables, besides `PATH`, `LANG` and the runner's private `HOME` and `TMPDIR`. */
  readonly env: readonly JobEnvVar[];
  readonly outputs: readonly BuildOutput[];
  readonly timeoutSec: number;
}

export const BuildJobSpecSchema: z.ZodType<BuildJobSpec> = z.object({
  repo: JobRepoSchema,
  workdir: relativePath.optional(),
  command: JobCommandSchema,
  env: z.array(JobEnvVarSchema).max(200),
  outputs: z.array(BuildOutputSchema).max(20),
  timeoutSec: z.number().int().positive().max(MAX_JOB_TIMEOUT_SEC),
});

/** What a completed build reports. */
export interface BuildJobResult {
  readonly kind: 'build';
  /** The commit that was built. */
  readonly sha: string;
  readonly exitCode: number;
  readonly durationMs: number;
  readonly outputs: readonly {
    readonly path: string;
    readonly sha256: string;
    readonly size: number;
    /** The upload's HTTP status and its body (JSON when it was JSON, else text cut to 10 000 characters). */
    readonly upload: { readonly status: number; readonly body?: unknown };
  }[];
}

const buildResultObject = z.object({
  kind: z.literal('build'),
  sha,
  exitCode: z.number().int(),
  durationMs: z.number().int().nonnegative(),
  outputs: z.array(
    z.object({
      path: z.string(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/u),
      size: z.number().int().nonnegative(),
      upload: z.object({ status: z.number().int(), body: z.unknown() }),
    }),
  ),
});

export const BuildJobResultSchema: z.ZodType<BuildJobResult> =
  buildResultObject;

export interface JobSpecs {
  readonly build: BuildJobSpec;
}

export interface JobResults {
  readonly build: BuildJobResult;
}

export type JobResult = JobResults[JobKind];

export const JobResultSchema: z.ZodType<JobResult> = z.discriminatedUnion(
  'kind',
  [buildResultObject],
);

/** The schema of each kind's spec, for a server validating what an application enqueues. */
export const JOB_SPEC_SCHEMAS: {
  readonly [K in JobKind]: z.ZodType<JobSpecs[K]>;
} = {
  build: BuildJobSpecSchema,
};

interface JobHeaderFields {
  readonly id: string;
  /** From 1; grows each time the job goes back to the queue. */
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly createdAt: string;
  readonly leaseExpiresAt: string;
  /** The `seq` this attempt's first event takes, as for a run (`RunHeader.firstSeq`). */
  readonly firstSeq: number;
  readonly requires: readonly RunnerFeature[];
}

/** The job: its header, its kind and that kind's spec. */
export type JobHeader = {
  readonly [K in JobKind]: JobHeaderFields & {
    readonly kind: K;
    readonly spec: JobSpecs[K];
  };
}[JobKind];

/**
 * What a claim hands a runner for a job. Secrets the job needs (`spec.env` values marked `secret`, `repo.auth`) appear
 * only here and only once.
 */
export interface JobPayload {
  readonly job: JobHeader;
  readonly app: RunApp;
  /** For the runner's log only, such as `Build FG-12`. */
  readonly title?: string;
}

const headerFields = {
  id: z.string().min(1),
  attempt: z.number().int().positive(),
  maxAttempts: z.number().int().positive(),
  createdAt: z.string(),
  leaseExpiresAt: z.string(),
  firstSeq: z.number().int().positive(),
  // A feature this receiver does not know is kept as a string: it only matters to the server that matched it.
  requires: z.array(z.string()) as unknown as z.ZodType<RunnerFeature[]>,
};

export const JobHeaderSchema: z.ZodType<JobHeader> = z.discriminatedUnion(
  'kind',
  [
    z.object({
      ...headerFields,
      kind: z.literal('build'),
      spec: BuildJobSpecSchema,
    }),
  ],
);

export const JobPayloadSchema: z.ZodType<JobPayload> = z.object({
  job: JobHeaderSchema,
  app: RunAppSchema,
  title: z.string().max(500).optional(),
});

/**
 * What a job reports while it works:
 *
 * - `log`: a line of output (`content`), with `stream` `stdout` or `stderr` for the command's own and `runner` for
 *   the runner's notes;
 * - `phase`: a step started (`phase`: `checkout`, `command`, `upload`);
 * - `error`: what went wrong, before the job fails.
 */
export const JOB_EVENT_TYPES = ['log', 'phase', 'error'] as const;

export type JobEventType = (typeof JOB_EVENT_TYPES)[number];

export interface JobEvent {
  readonly seq: number;
  /** ISO 8601. */
  readonly at: string;
  readonly type: JobEventType;
  readonly stream?: 'stdout' | 'stderr' | 'runner';
  readonly phase?: string;
  readonly content?: string;
  readonly truncated?: boolean;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export const JobEventSchema: z.ZodType<JobEvent> = z.object({
  seq: z.number().int().positive(),
  at: z.string().min(1),
  type: z.enum(JOB_EVENT_TYPES),
  stream: z.enum(['stdout', 'stderr', 'runner']).optional(),
  phase: z.string().max(64).optional(),
  content: z.string().optional(),
  truncated: z.boolean().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

/** A job held by a runner, as its heartbeat reports it. */
export interface ActiveJob {
  readonly jobId: string;
  readonly pid?: number;
  readonly startedAt?: string;
}

export const ActiveJobSchema: z.ZodType<ActiveJob> = z.object({
  jobId: z.string(),
  pid: z.number().int().optional(),
  startedAt: z.string().optional(),
});

/** The answer to a job's `lease` and `start`. */
export interface JobLeaseResponse {
  readonly status: JobStatus;
  readonly leaseExpiresAt: string;
  readonly cancelRequested: boolean;
}

export const JobLeaseResponseSchema: z.ZodType<JobLeaseResponse> = z.object({
  status: JobStatusSchema,
  leaseExpiresAt: z.string(),
  cancelRequested: z.boolean(),
});

export interface JobStartRequest {
  /** Where the runner checked the job out, for people diagnosing it. */
  readonly workDir?: string;
}

export const JobStartRequestSchema: z.ZodType<JobStartRequest> = z.object({
  workDir: z.string().max(1024).optional(),
});

export interface JobEventsRequest {
  readonly events: readonly JobEvent[];
}

export const JobEventsRequestSchema: z.ZodType<JobEventsRequest> = z.object({
  events: z.array(JobEventSchema).max(200),
});

export interface JobStatusResponse {
  readonly status: JobStatus;
  readonly cancelRequested: boolean;
  readonly leaseExpiresAt: string | null;
}

export const JobStatusResponseSchema: z.ZodType<JobStatusResponse> = z.object({
  status: JobStatusSchema,
  cancelRequested: z.boolean(),
  leaseExpiresAt: z.string().nullable(),
});

export interface JobCompleteRequest {
  readonly result: JobResult;
}

export const JobCompleteRequestSchema: z.ZodType<JobCompleteRequest> = z.object(
  { result: JobResultSchema },
);

export interface JobFailRequest {
  readonly reason: JobFailureReason;
  readonly detail?: string;
  /** For `commandFailed`. */
  readonly exitCode?: number;
  /** The commit, when the checkout got that far. */
  readonly sha?: string;
}

export const JobFailRequestSchema: z.ZodType<JobFailRequest> = z.object({
  reason: JobFailureReasonSchema,
  detail: z.string().max(10_000).optional(),
  exitCode: z.number().int().optional(),
  sha: z.string().max(64).optional(),
});

export type JobCancelAckRequest = Readonly<Record<string, never>>;

export const JobCancelAckRequestSchema: z.ZodType<JobCancelAckRequest> =
  z.object({});

/** The answer to a job's `complete`, `fail` and `cancelAck`. */
export interface JobFinishResponse {
  readonly status: JobStatus;
  /** Set when a failed attempt went back to the queue. */
  readonly retryAt?: string;
}

export const JobFinishResponseSchema: z.ZodType<JobFinishResponse> = z.object({
  status: JobStatusSchema,
  retryAt: z.string().optional(),
});

/**
 * The secret values a job carries, to keep out of what is reported about it: its repository token, its variables
 * marked `secret`, and its upload headers (and the credential alone of one such as `Bearer <ticket>`).
 */
export function jobSecrets(payload: Pick<JobPayload, 'job'>): string[] {
  const { job } = payload;
  const secrets: string[] = [];
  if (job.spec.repo.auth) secrets.push(job.spec.repo.auth.token);
  if (job.kind === 'build') {
    for (const variable of job.spec.env)
      if (variable.secret === true) secrets.push(variable.value);
    for (const output of job.spec.outputs)
      for (const value of Object.values(output.upload.headers)) {
        secrets.push(value);
        const credential = /^\S+\s+(\S+)$/u.exec(value)?.[1];
        if (credential !== undefined) secrets.push(credential);
      }
  }
  return secrets;
}
