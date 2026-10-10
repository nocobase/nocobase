/**
 * Errors: every failed request answers the application's standard error body,
 * `{ error: { code, status, reason, domain, message, requestId?, metadata?, fieldViolations? } }`. Each code below is a
 * `reason` of domain `agents`; `ERROR_API_STATUS` gives its canonical status and `ERROR_STATUS` its HTTP status. The CLI
 * exits with the code `exitCodeFor` gives a reason.
 */
import { z } from 'zod';

/** The canonical error statuses an `/api` response reports (Google's AIP-193 names). */
export const API_STATUSES = [
  'INVALID_ARGUMENT',
  'FAILED_PRECONDITION',
  'UNAUTHENTICATED',
  'PERMISSION_DENIED',
  'NOT_FOUND',
  'ALREADY_EXISTS',
  'ABORTED',
  'RESOURCE_EXHAUSTED',
  'INTERNAL',
  'UNAVAILABLE',
] as const;

export type ApiStatus = (typeof API_STATUSES)[number];

/** The HTTP status of each canonical status. */
export const API_STATUS_HTTP: Readonly<Record<ApiStatus, number>> = {
  INVALID_ARGUMENT: 400,
  FAILED_PRECONDITION: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  ABORTED: 409,
  RESOURCE_EXHAUSTED: 429,
  INTERNAL: 500,
  UNAVAILABLE: 503,
};

/** The domain of every reason this protocol and the agents plugin define. */
export const AGENTS_ERROR_DOMAIN = 'agents';

export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'RUNNER_KEY_INVALID'
  | 'RUNNER_REVOKED'
  | 'RUNNER_OWNER_DISABLED'
  | 'REGISTRATION_TOKEN_INVALID'
  | 'DOWNLOAD_TOKEN_INVALID'
  | 'RUN_TOKEN_INVALID'
  | 'FORBIDDEN'
  | 'SCOPED_KEY_FORBIDDEN'
  | 'RUN_NOT_OWNED'
  | 'COMMAND_FORBIDDEN'
  | 'NOT_FOUND'
  | 'AGENT_NOT_FOUND'
  | 'RUN_NOT_FOUND'
  | 'RUN_CONTEXT_NOT_FOUND'
  | 'BRIEF_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'SKILL_NOT_FOUND'
  | 'SKILL_VERSION_NOT_FOUND'
  | 'SKILL_FILE_NOT_FOUND'
  | 'MOUNT_NOT_FOUND'
  | 'VARIABLE_NOT_FOUND'
  | 'RUNNER_NOT_FOUND'
  | 'JOB_NOT_FOUND'
  | 'MODEL_SERVICE_NOT_FOUND'
  | 'SCOPE_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'DIST_FILE_NOT_FOUND'
  | 'RUN_REQUEST_NOT_FOUND'
  | 'COMMAND_UNKNOWN'
  | 'PLATFORM_UNSUPPORTED'
  | 'CONFLICT'
  | 'LEASE_LOST'
  | 'REVISION_CONFLICT'
  | 'MANIFEST_STALE'
  | 'RUN_NOT_ACTIVE'
  | 'RUN_INPUT_PENDING'
  | 'RUN_CANCEL_REQUESTED'
  | 'RUN_NOT_RETRYABLE'
  | 'AGENT_ARCHIVED'
  | 'AGENT_NOT_ARCHIVED'
  | 'AGENT_HAS_ACTIVE_RUNS'
  | 'AGENT_BUSY'
  | 'RUN_REQUEST_SETTLED'
  | 'NO_RUNNER_AVAILABLE'
  | 'RUNNER_NOT_REVOKED'
  | 'SKILL_VERSION_CURRENT'
  | 'CONVERSATION_CONFLICT'
  | 'PLAN_REQUIRED'
  | 'FEATURE_REQUIRED'
  | 'PROTOCOL_UNSUPPORTED'
  | 'UPLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'SECRETS_KEY_MISSING';

/** Each code (the error's `reason`) with its canonical status. */
export const ERROR_API_STATUS: Readonly<Record<ErrorCode, ApiStatus>> = {
  /** The request is malformed or names something that does not exist. */
  INVALID_REQUEST: 'INVALID_ARGUMENT',
  UNAUTHORIZED: 'UNAUTHENTICATED',
  RUNNER_KEY_INVALID: 'UNAUTHENTICATED',
  RUNNER_REVOKED: 'UNAUTHENTICATED',
  /** The runner's owner can no longer act (their account was disabled or deleted), so neither can the runner. */
  RUNNER_OWNER_DISABLED: 'UNAUTHENTICATED',
  REGISTRATION_TOKEN_INVALID: 'UNAUTHENTICATED',
  /** Unknown, expired or spent, or presented for another platform than the one it first downloaded. */
  DOWNLOAD_TOKEN_INVALID: 'UNAUTHENTICATED',
  RUN_TOKEN_INVALID: 'UNAUTHENTICATED',
  FORBIDDEN: 'PERMISSION_DENIED',
  /** A scoped API key asks for something outside its scope. */
  SCOPED_KEY_FORBIDDEN: 'PERMISSION_DENIED',
  RUN_NOT_OWNED: 'PERMISSION_DENIED',
  COMMAND_FORBIDDEN: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  AGENT_NOT_FOUND: 'NOT_FOUND',
  RUN_NOT_FOUND: 'NOT_FOUND',
  RUN_CONTEXT_NOT_FOUND: 'NOT_FOUND',
  BRIEF_NOT_FOUND: 'NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'NOT_FOUND',
  SKILL_NOT_FOUND: 'NOT_FOUND',
  SKILL_VERSION_NOT_FOUND: 'NOT_FOUND',
  SKILL_FILE_NOT_FOUND: 'NOT_FOUND',
  MOUNT_NOT_FOUND: 'NOT_FOUND',
  VARIABLE_NOT_FOUND: 'NOT_FOUND',
  RUNNER_NOT_FOUND: 'NOT_FOUND',
  JOB_NOT_FOUND: 'NOT_FOUND',
  MODEL_SERVICE_NOT_FOUND: 'NOT_FOUND',
  SCOPE_NOT_FOUND: 'NOT_FOUND',
  PRODUCT_NOT_FOUND: 'NOT_FOUND',
  DIST_FILE_NOT_FOUND: 'NOT_FOUND',
  /** A run request (work someone asked of an agent another person answers for) that does not exist, or that the caller may not see. */
  RUN_REQUEST_NOT_FOUND: 'NOT_FOUND',
  COMMAND_UNKNOWN: 'NOT_FOUND',
  /** The application serves no build of this product for the asking platform; `metadata.targets` lists those it has. */
  PLATFORM_UNSUPPORTED: 'NOT_FOUND',
  /** A concurrent change won; read again and retry. */
  CONFLICT: 'ABORTED',
  LEASE_LOST: 'ABORTED',
  /** The object changed since the revision the edit was made against; `metadata.revision` is the current one. */
  REVISION_CONFLICT: 'ABORTED',
  /** `metadata.etag` is the current manifest's etag. */
  MANIFEST_STALE: 'ABORTED',
  RUN_NOT_ACTIVE: 'FAILED_PRECONDITION',
  RUN_INPUT_PENDING: 'FAILED_PRECONDITION',
  RUN_CANCEL_REQUESTED: 'FAILED_PRECONDITION',
  RUN_NOT_RETRYABLE: 'FAILED_PRECONDITION',
  AGENT_ARCHIVED: 'FAILED_PRECONDITION',
  AGENT_NOT_ARCHIVED: 'FAILED_PRECONDITION',
  AGENT_HAS_ACTIVE_RUNS: 'FAILED_PRECONDITION',
  /** The agent already works on the same subject; `metadata.runId` is that run. */
  AGENT_BUSY: 'FAILED_PRECONDITION',
  /** The run request was already confirmed, rejected, withdrawn, superseded or expired; `metadata.status` says which. */
  RUN_REQUEST_SETTLED: 'FAILED_PRECONDITION',
  /** No runner the person may use can run the agent now, so work run as them would only wait; nothing was queued. */
  NO_RUNNER_AVAILABLE: 'FAILED_PRECONDITION',
  RUNNER_NOT_REVOKED: 'FAILED_PRECONDITION',
  SKILL_VERSION_CURRENT: 'FAILED_PRECONDITION',
  /** The conversation's state forbids this; `metadata.reason` says which (`ConversationConflict`). */
  CONVERSATION_CONFLICT: 'FAILED_PRECONDITION',
  /**
   * The change needs a person's confirmation: propose it as an operation plan instead of writing it directly.
   * `metadata.reasons` says why (an agent in a conversation, beyond its direct-write quota).
   */
  PLAN_REQUIRED: 'FAILED_PRECONDITION',
  /** The runner lacks a feature the run needs. */
  FEATURE_REQUIRED: 'FAILED_PRECONDITION',
  /** The runner speaks a protocol version the application no longer serves. */
  PROTOCOL_UNSUPPORTED: 'FAILED_PRECONDITION',
  /** Answered with HTTP 413. */
  UPLOAD_TOO_LARGE: 'INVALID_ARGUMENT',
  INTERNAL_ERROR: 'INTERNAL',
  /** The server cannot do this yet, such as storing an upload when no file storage is available. */
  NOT_IMPLEMENTED: 'UNAVAILABLE',
  /** Secrets cannot be stored or read: the application has no key configured for them. */
  SECRETS_KEY_MISSING: 'UNAVAILABLE',
};

export const ERROR_CODES: readonly ErrorCode[] = Object.keys(
  ERROR_API_STATUS,
) as ErrorCode[];

/** HTTP statuses outside the canonical mapping. */
const HTTP_OVERRIDES: Partial<Readonly<Record<ErrorCode, number>>> = {
  UPLOAD_TOO_LARGE: 413,
};

/** Each code with its HTTP status. */
export const ERROR_STATUS: Readonly<Record<ErrorCode, number>> =
  Object.fromEntries(
    ERROR_CODES.map((code) => [
      code,
      HTTP_OVERRIDES[code] ?? API_STATUS_HTTP[ERROR_API_STATUS[code]],
    ]),
  ) as Record<ErrorCode, number>;

/** One invalid field of a request. */
export interface ErrorFieldViolation {
  readonly field: string;
  readonly description: string;
  readonly reason?: string;
}

/** What a failed response's `error` carries. */
export interface ErrorPayload {
  /** The HTTP status. */
  readonly code: number;
  readonly status: string;
  readonly reason: string;
  readonly domain: string;
  readonly message: string;
  readonly requestId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly fieldViolations?: readonly ErrorFieldViolation[];
}

/** The body of every failed response. */
export interface ErrorBody {
  readonly error: ErrorPayload;
}

export const ErrorPayloadSchema: z.ZodType<ErrorPayload> = z.object({
  code: z.number(),
  status: z.string(),
  reason: z.string(),
  domain: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  fieldViolations: z
    .array(
      z.object({
        field: z.string(),
        description: z.string(),
        reason: z.string().optional(),
      }),
    )
    .optional(),
});

export const ErrorBodySchema: z.ZodType<ErrorBody> = z.object({
  error: ErrorPayloadSchema,
});

/** The error in a failed response's body, or undefined when it is not the standard error body. */
export function readErrorBody(body: unknown): ErrorPayload | undefined {
  const parsed = ErrorBodySchema.safeParse(body);
  return parsed.success ? parsed.data.error : undefined;
}

/** The CLI's exit codes. */
export const EXIT_CODES = {
  ok: 0,
  general: 1,
  network: 2,
  auth: 3,
  notFound: 4,
  validation: 5,
  conflict: 6,
  /** `PLAN_REQUIRED`: propose the change as an operation plan instead. */
  planRequired: 7,
} as const;

export type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

const EXIT_BY_REASON: Readonly<Record<string, ExitCode>> = {
  PLAN_REQUIRED: EXIT_CODES.planRequired,
  FEATURE_REQUIRED: EXIT_CODES.validation,
  PROTOCOL_UNSUPPORTED: EXIT_CODES.auth,
};

const EXIT_BY_STATUS: Readonly<Record<string, ExitCode>> = {
  INVALID_ARGUMENT: EXIT_CODES.validation,
  FAILED_PRECONDITION: EXIT_CODES.conflict,
  UNAUTHENTICATED: EXIT_CODES.auth,
  PERMISSION_DENIED: EXIT_CODES.auth,
  NOT_FOUND: EXIT_CODES.notFound,
  ALREADY_EXISTS: EXIT_CODES.conflict,
  ABORTED: EXIT_CODES.conflict,
};

/**
 * The exit code for an error's `reason`. A reason this protocol does not define (another domain's) falls back to the
 * canonical `status` when given; anything else is a general failure.
 */
export function exitCodeFor(reason: string, status?: string): ExitCode {
  const byReason = EXIT_BY_REASON[reason];
  if (byReason !== undefined) return byReason;
  const known = (ERROR_API_STATUS as Readonly<Record<string, string>>)[reason];
  return EXIT_BY_STATUS[known ?? status ?? ''] ?? EXIT_CODES.general;
}

export interface ProtocolErrorOptions {
  /** Who defined the reason: `agents` unless another plugin's reason passes through. */
  readonly domain?: string;
}

/** An error answer, as either side handles it. Its `code` is the answer's `reason`, its `details` the `metadata`. */
export class ProtocolError extends Error {
  public readonly code: string;
  /** The HTTP status. */
  public readonly status: number;
  /** The canonical status. */
  public readonly apiStatus: ApiStatus;
  public readonly domain: string;
  public readonly details?: Readonly<Record<string, unknown>>;

  public constructor(
    code: ErrorCode,
    message: string,
    details?: Readonly<Record<string, unknown>>,
    options?: ProtocolErrorOptions,
  ) {
    super(message);
    this.name = 'ProtocolError';
    this.code = code;
    this.apiStatus = ERROR_API_STATUS[code];
    this.status = ERROR_STATUS[code];
    this.domain = options?.domain ?? AGENTS_ERROR_DOMAIN;
    if (details) this.details = details;
  }
}
