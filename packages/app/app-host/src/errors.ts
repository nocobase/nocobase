/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class AppRegistryError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    options: { status: number; code: string; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.status = options.status;
    this.code = options.code;
  }
}

export class ArtifactReadTimeoutError extends Error {
  readonly code = 'ARTIFACT_READ_TIMEOUT';
  constructor(
    readonly kind: 'idle' | 'total',
    readonly timeoutMs: number,
  ) {
    super(
      kind === 'idle'
        ? `Reading the release package timed out: no data received for ${timeoutMs} ms. Deploy the release again.`
        : `Reading the release package timed out: the attempt exceeded ${timeoutMs} ms. Deploy the release again.`,
    );
  }
}

/**
 * The message of the error itself, wrappers included.
 *
 * Prefer this over {@link rootErrorMessage} for anything an operator reads. The errors raised while installing an
 * artifact or activating an app already fold their cause into their own message, so this returns the reason *and*
 * the context around it — which phase failed, which app, what had already succeeded. Digging out the innermost
 * cause discards exactly that context, which is why reporting a failed deployment used to name a missing package
 * without saying whether it was missing during install or at startup.
 */
export function fullErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * The message of the innermost cause, with every wrapper discarded.
 *
 * This is for the narrow case of matching or classifying an underlying failure. It is the wrong choice for
 * anything displayed, because the wrappers carry the context that makes the message actionable.
 */
export function rootErrorMessage(error: unknown): string {
  let current = error;
  const visited = new Set<unknown>();

  while (
    current instanceof Error &&
    current.cause !== undefined &&
    !visited.has(current)
  ) {
    visited.add(current);
    current = current.cause;
  }

  return current instanceof Error ? current.message : String(current);
}

export class InvalidAppIdError extends AppRegistryError {
  constructor(id: string) {
    super(
      `Invalid app id "${id}". Use letters, numbers, underscores, or hyphens.`,
      {
        status: 400,
        code: 'APP_INVALID_ID',
      },
    );
  }
}

export class AppAlreadyExistsError extends AppRegistryError {
  constructor(id: string) {
    super(`App "${id}" already exists`, {
      status: 409,
      code: 'APP_ALREADY_EXISTS',
    });
  }
}

export class AppNotFoundError extends AppRegistryError {
  constructor(id: string) {
    super(`App "${id}" does not exist`, {
      status: 404,
      code: 'APP_NOT_FOUND',
    });
  }
}

export class AppCreateFailedError extends AppRegistryError {
  constructor(id: string, cause: unknown) {
    // The cause is folded into the message rather than left on `cause` alone. This error crosses the Hub IPC
    // boundary, which serialises an error to its message and reconstructs it on the other side, so anything not in
    // the message is lost before an operator ever sees it — leaving "failed to initialize" as the whole diagnosis.
    super(`App "${id}" failed to initialize: ${describeCause(cause, id)}`, {
      status: 500,
      code: 'APP_CREATE_FAILED',
      cause,
    });
  }
}

export class AppReloadFailedError extends AppRegistryError {
  constructor(id: string, cause: unknown) {
    super(`App "${id}" failed to reload: ${describeCause(cause, id)}`, {
      status: 500,
      code: 'APP_RELOAD_FAILED',
      cause,
    });
  }
}

export class AppCapacityExceededError extends AppRegistryError {
  /** The configured limit, `Number.MAX_SAFE_INTEGER` when none is set; kept for diagnostics and logs. */
  readonly maxActiveApps: number;

  constructor(
    maxActiveApps: number,
    reason: string = 'Active app capacity exceeded and no idle app can be evicted.',
  ) {
    // The message reaches users through deployment results; an unset limit is an internal sentinel, not a number to show.
    super(
      maxActiveApps < Number.MAX_SAFE_INTEGER
        ? `${reason} maxActiveApps=${maxActiveApps}`
        : reason,
      {
        status: 503,
        code: 'APP_CAPACITY_EXCEEDED',
      },
    );
    this.maxActiveApps = maxActiveApps;
  }
}

/**
 * The message of whatever went wrong, for folding into an error about `id` that has to survive serialisation.
 *
 * An `AggregateError` is unfolded because its own message says only that several things failed. The replacement
 * path throws one holding both the activation failure and the restore failure, and those two messages are the
 * diagnosis; reporting the summary alone would keep the exact defect this folding exists to remove.
 *
 * Every layer of these errors names the app it is about, so folding one into another would repeat that name at
 * each colon. The subject is stated once by the outermost message and stripped from what it wraps, leaving the
 * verbs to chain: `App "crm" failed to reload: failed to initialize: ...`.
 */
function describeCause(cause: unknown, id: string): string {
  if (cause instanceof AggregateError && cause.errors.length > 0) {
    const reasons = cause.errors.map((error) => describeCause(error, id));
    return `${withoutAppPrefix(cause.message, id)} (${reasons.join('; ')})`;
  }

  return withoutAppPrefix(fullErrorMessage(cause), id);
}

function withoutAppPrefix(message: string, id: string): string {
  const prefix = `App "${id}" `;
  return message.startsWith(prefix) ? message.slice(prefix.length) : message;
}

/** Finds a stable deployment error code through activation/rollback wrappers. */
export function deploymentErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  if (error instanceof AppCapacityExceededError) return error.code;
  if (error instanceof AggregateError) {
    for (const cause of error.errors) {
      const code = deploymentErrorCode(cause);
      if (code === 'APP_CAPACITY_EXCEEDED') return code;
    }
  }
  const nested = deploymentErrorCode(error.cause);
  return nested ?? (error as Error & { code?: string }).code;
}
