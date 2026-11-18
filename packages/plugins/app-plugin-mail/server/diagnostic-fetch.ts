import type { MailProviderError } from '../shared/mail.js';
import {
  errorRecord,
  logMailFailure,
  type MailFailureContext,
} from './connection-diagnostics.js';

export type MailFetch = (
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
) => Promise<Response>;

/** Classify bounded failure responses without logging HTTP bodies, URLs, headers or OAuth payloads. */
export async function diagnosticFetch(
  fetcher: MailFetch,
  input: Parameters<typeof fetch>[0],
  init: RequestInit | undefined,
  context: Omit<MailFailureContext, 'event' | 'startedAt' | 'protocol'> & {
    readonly classifyResponse?: (
      response: Response,
    ) => Promise<MailProviderError>;
  },
): Promise<Response> {
  const startedAt = Date.now();
  const details = (): MailFailureContext => {
    const headers = new Headers(init?.headers);
    const authorization = headers.get('authorization');
    const secrets = [
      ...(context.secrets ?? []),
      ...(authorization
        ? [authorization, authorization.replace(/^\S+\s+/, '')]
        : []),
      ...(init?.body instanceof URLSearchParams ? [...init.body.values()] : []),
    ];
    return {
      ...context,
      secrets,
      startedAt,
      protocol: 'https',
      event: `mail.${context.provider}.${context.stage}_failed`,
    };
  };
  try {
    const response = await fetcher(input, init);
    if (!response.ok) {
      let classified: MailProviderError = {
        code: `HTTP_${response.status}`,
        message: `Mail provider returned HTTP ${response.status}.`,
        category:
          response.status === 401 || response.status === 403
            ? ('authentication' as const)
            : response.status === 429
              ? ('rate_limit' as const)
              : ('provider' as const),
        retryable: response.status === 429 || response.status >= 500,
      };
      if (context.classifyResponse) {
        try {
          classified = await context.classifyResponse(response.clone());
        } catch {
          /* Diagnostics must not change the original response or failure. */
        }
      }
      logMailFailure(
        {
          responseCode: response.status,
          message: `Mail provider returned HTTP ${response.status}.`,
        },
        classified,
        details(),
      );
    }
    return response;
  } catch (error) {
    const value = errorRecord(error);
    const cause = errorRecord(value.cause);
    const underlying = { ...cause, ...value, message: value.message };
    const timedOut =
      value.name === 'TimeoutError' || cause.code === 'UND_ERR_CONNECT_TIMEOUT';
    logMailFailure(
      underlying,
      {
        code: timedOut ? 'ETIMEDOUT' : 'HTTP_REQUEST_FAILED',
        message: 'Mail provider request failed.',
        category: timedOut ? 'timeout' : 'network',
        retryable: true,
      },
      details(),
    );
    throw error;
  }
}
