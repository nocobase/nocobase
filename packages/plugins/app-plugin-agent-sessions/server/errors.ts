import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import {
  ApiError,
  apiErrorHandler,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import {
  getRequestLocale,
  TRANSLATOR_CONTEXT_KEY,
  type Translator,
} from '@nocobase/i18n/server';
import type { Context, ErrorHandler } from 'hono';

import enUS from './locales/en-US.js';
import type { Viewer } from './service.js';

export const AGENT_SESSIONS_DOMAIN = 'agentSessions';
export const AGENT_SESSIONS_NAMESPACE = '@nocobase/app-plugin-agent-sessions';

export type AgentSessionsErrorKey = keyof (typeof enUS)['errors'];

const STATUS: Readonly<Record<AgentSessionsErrorKey, ApiErrorStatus>> = {
  authenticationRequired: 'UNAUTHENTICATED',
  computerNotFound: 'NOT_FOUND',
  sessionNotFound: 'NOT_FOUND',
  computerOffline: 'FAILED_PRECONDITION',
  agentUnavailable: 'INVALID_ARGUMENT',
  directoryNotAllowed: 'INVALID_ARGUMENT',
  sessionArchived: 'FAILED_PRECONDITION',
  permissionRequestNotFound: 'NOT_FOUND',
  choiceNotFound: 'INVALID_ARGUMENT',
  linkNotFound: 'INVALID_ARGUMENT',
  invalidPageToken: 'INVALID_ARGUMENT',
  upgradeRequired: 'FAILED_PRECONDITION',
  computerNotAnswering: 'DEADLINE_EXCEEDED',
  folderUnavailable: 'FAILED_PRECONDITION',
  projectNotFound: 'INVALID_ARGUMENT',
  referenceNotFound: 'INVALID_ARGUMENT',
  computerKeyInvalid: 'UNAUTHENTICATED',
  imageNotFound: 'NOT_FOUND',
};

/** A failure the API answers in the standard error body, its reason `AGENT_SESSIONS_<KEY>`. */
export class AgentSessionsError extends Error {
  override readonly name: string = 'AgentSessionsError';
  readonly key: AgentSessionsErrorKey;
  readonly field: string | undefined;

  constructor(key: AgentSessionsErrorKey, field?: string) {
    super(enUS.errors[key]);
    this.key = key;
    this.field = field;
  }
}

/** The signed-in person's id; `auth.required()` runs first, so nobody signed in is an error of the setup. */
export function signedInUser(context: {
  readonly var: AuthEnv['Variables'];
}): string {
  const userId = context.var.auth?.user.id;
  if (!userId) throw new AgentSessionsError('authenticationRequired');
  return userId;
}

/** The signed-in person, and the language they read in. */
export function viewerOf<P extends string, I extends object>(
  context: Context<AuthEnv, P, I>,
): Viewer {
  return { userId: signedInUser(context), locale: getRequestLocale(context) };
}

/** The routers' `onError`: this plugin's errors in the standard body, translated; everything else to the framework. */
export const agentSessionsErrorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(
    error instanceof AgentSessionsError ? toApiError(error, context) : error,
    context,
  );

function toApiError(error: AgentSessionsError, context: Context): ApiError {
  const locale = getRequestLocale(context);
  // Read rather than `getRequestTranslator()`, which throws without the i18n middleware: an error must still render.
  const translate = context.get(TRANSLATOR_CONTEXT_KEY) as
    Translator | undefined;
  const localized =
    locale && translate
      ? translate(`errors.${error.key}`, {
          ns: AGENT_SESSIONS_NAMESPACE,
          defaultValue: error.message,
        })
      : undefined;
  return new ApiError({
    status: STATUS[error.key],
    reason: `AGENT_SESSIONS_${error.key.replace(/[A-Z]/gu, (letter) => `_${letter}`).toUpperCase()}`,
    domain: AGENT_SESSIONS_DOMAIN,
    message: error.message,
    ...(locale && localized
      ? { localizedMessage: { locale, message: localized } }
      : {}),
    ...(error.field
      ? {
          fieldViolations: [
            { field: error.field, description: localized ?? error.message },
          ],
        }
      : {}),
  });
}
