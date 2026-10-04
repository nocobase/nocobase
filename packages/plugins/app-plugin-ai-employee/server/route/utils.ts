import { AgentServiceError } from '../agent/types.js';
import { DomainError } from '../types.js';
import type { AuthEnv, AuthSession } from '@nocobase/app-plugin-authentication';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type { Logger } from '@nocobase/logging';
import type { Actor } from '../types.js';
import type {
  Context as HonoContext,
  ErrorHandler,
  MiddlewareHandler,
} from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { SSEStreamTarget, sseResponseHeaders } from './sse.js';

declare module 'hono' {
  interface ContextVariableMap {
    currentUser: Actor;
  }
}

/** The `domain` of every error the AI employee routes report, whether about employees or any other AI resource. */
export const AI_EMPLOYEE_ERROR_DOMAIN = 'aiEmployees';

/** The largest JSON body an AI route accepts: settings, prompts and tool arguments are far below it. */
export const AI_JSON_BODY_MAX_BYTES: number = 1024 * 1024;

/**
 * The largest body a run (`send`, `resend`, `resumeToolCall`) accepts. Larger than other JSON routes because a run
 * carries the page's work context and frontend tool schemas besides its messages; attachments are uploaded separately.
 */
export const AI_RUN_BODY_MAX_BYTES: number = 5 * 1024 * 1024;

/** The largest file `POST /aiEmployee/files` accepts, including the multipart framing around it. */
export const AI_FILE_UPLOAD_MAX_BYTES: number = 20 * 1024 * 1024;

/**
 * Refuses a body larger than `maxSize` with a 413 in the standard body. Each route names it after its access guard,
 * so a caller who may not call the route is refused before the size of what it sent matters.
 */
export function aiBodyLimit(maxSize: number): MiddlewareHandler {
  return bodyLimit({
    maxSize,
    onError: (context) =>
      apiErrorHandler(
        new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'BODY_TOO_LARGE',
          domain: AI_EMPLOYEE_ERROR_DOMAIN,
          message: `The request body exceeds ${maxSize} bytes.`,
          httpStatus: 413,
        }),
        context,
      ),
  });
}

/** The body limit of an ordinary JSON route. */
export const jsonBody: MiddlewareHandler = aiBodyLimit(AI_JSON_BODY_MAX_BYTES);

/** The body limit of a run, which streams its answer. */
export const runBody: MiddlewareHandler = aiBodyLimit(AI_RUN_BODY_MAX_BYTES);

/** A bounded list, read whole rather than paged: its rows and how many there are. */
export function boundedList<T>(data: readonly T[]): {
  data: readonly T[];
  meta: { total: number };
} {
  return { data, meta: { total: data.length } };
}

export interface AIRequestMiddlewareOptions {
  readonly ready: () => Promise<void>;
  readonly logger: Logger;
}

/** Runs after `authentication.required()`, which has already set the session. */
export function createAIActorMiddleware(): MiddlewareHandler<AuthEnv> {
  return async (context, next) => {
    context.set(
      'currentUser',
      actorFromSession(context.var.auth, context.req.raw),
    );
    await next();
  };
}

export function createAIRequestMiddleware(
  options: AIRequestMiddlewareOptions,
): MiddlewareHandler {
  return async (context, next) => {
    const action = `${context.req.method} ${context.req.path}`;
    try {
      await options.ready();
    } catch (error: unknown) {
      options.logger.error?.({ action, error }, 'AI local action failed');
      throw error;
    }
    options.logger.info?.(
      { action, userId: context.var.currentUser.id },
      'AI local action',
    );
    await next();
    context.header('x-local-ai', '1');
  };
}

/**
 * The `ApiError` a domain error from the AI services answers with. An unexpected failure, including a domain error
 * that reports an internal fault, is not one: the application answers it with a 500 that reveals nothing.
 */
export function toAIEmployeeApiError(error: unknown): ApiError | undefined {
  if (!(error instanceof DomainError) || error.apiStatus === 'INTERNAL')
    return undefined;
  return new ApiError({
    status: error.apiStatus,
    reason: error.reason,
    domain: AI_EMPLOYEE_ERROR_DOMAIN,
    message: error.message,
    ...(error.fieldViolations?.length
      ? { fieldViolations: error.fieldViolations }
      : {}),
    cause: error,
  });
}

/**
 * Translates the AI services' own domain errors into the standard body, and leaves everything else to the framework,
 * which answers the errors it recognizes and passes the rest on to the application's handler.
 */
export const aiEmployeeErrorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(toAIEmployeeApiError(error) ?? error, context);

export function createAISSEStreamResponse(
  context: HonoContext,
  _action: string,
  handler: (target: SSEStreamTarget) => unknown | Promise<unknown>,
): Response {
  const target = new SSEStreamTarget();
  const request = context.req.raw;

  void runSSEAction(target, () => handler(target));
  request.signal.addEventListener('abort', () => target.end(), { once: true });

  return new Response(target.stream, { headers: sseResponseHeaders() });
}

async function runSSEAction(
  target: SSEStreamTarget,
  handler: () => unknown | Promise<unknown>,
): Promise<void> {
  try {
    await handler();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code = agentErrorCode(error);
    target.write(
      `data: ${JSON.stringify({ type: 'error', body: message, ...(code ? { code } : {}) })}\n\n`,
    );
  } finally {
    target.end();
  }
}

// The agent failure behind an error, if there is one: the stream always
// answers 200, so its error event is where a caller tells failures apart.
function agentErrorCode(error: unknown): string | undefined {
  if (error instanceof AgentServiceError) return error.code;
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  return cause instanceof AgentServiceError ? cause.code : undefined;
}

function actorFromSession(session: AuthSession, request: Request): Actor {
  const user = session?.user;
  // Unreachable once `required()` runs first; fail closed if it ever does not.
  if (!user?.id) throw new Error('AI actions require an authenticated session');
  const profile = user as typeof user & Record<string, unknown>;
  const roles = Array.isArray(profile.roles)
    ? profile.roles.filter((role): role is string => typeof role === 'string')
    : [];
  return {
    id: user.id,
    roles: roles.length ? roles : ['member'],
    isRoot:
      typeof profile.isRoot === 'boolean'
        ? profile.isRoot
        : roles.includes('root'),
    locale:
      typeof profile.locale === 'string'
        ? profile.locale
        : (request.headers.get('x-locale') ?? undefined),
  };
}
