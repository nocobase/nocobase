import type {
  SendingProviderErrorCategory,
  SendingProviderSendError,
  ProviderSendResult,
} from './types.js';

import { providerErrorCode, sanitizeProviderErrorMessage } from './error.js';

export async function postJson(
  url: string,
  body: object,
  input: { readonly signal: AbortSignal },
  options: {
    readonly headers?: Readonly<Record<string, string>>;
    readonly evaluateSuccess?: (
      response: Response,
    ) => Promise<ProviderSendResult>;
  } = {},
): Promise<ProviderSendResult> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...options.headers },
      body: JSON.stringify(body),
      signal: input.signal,
      redirect: 'manual',
    });
    if (response.ok) {
      if (!options.evaluateSuccess) return { status: 'accepted' };
      try {
        return await options.evaluateSuccess(response);
      } catch (error) {
        return {
          status: 'failed',
          disposition: 'never',
          error: {
            code: 'INVALID_PROVIDER_RESPONSE',
            category: 'provider',
            message: sanitizeProviderErrorMessage(
              error,
              'Provider returned an invalid response.',
            ),
          },
        };
      }
    }
    await response.body?.cancel().catch(() => undefined);
    const error: SendingProviderSendError = {
      code: String(response.status),
      category: httpCategory(response.status),
      message: `Provider request failed with HTTP ${response.status}.`,
    };
    if (response.status === 429)
      return {
        status: 'failed',
        error,
        disposition: 'same_provider',
        retryAfterMs: parseRetryAfter(response.headers.get('retry-after')),
      };
    if (response.status >= 500)
      return {
        status: 'submission_unknown',
        error,
      };
    return { status: 'failed', error, disposition: 'never' };
  } catch (error) {
    const message = sanitizeProviderErrorMessage(
      error,
      'Provider network request failed.',
    );
    if (input.signal.aborted)
      return {
        status: 'submission_unknown',
        error: { code: 'HTTP_ABORTED', category: 'timeout', message },
      };
    const code = providerErrorCode(error);
    if (isPreSubmissionNetworkError(code))
      return {
        status: 'failed',
        disposition: 'same_provider',
        error: { code, category: 'network', message },
      };
    return {
      status: 'submission_unknown',
      error: { code, category: 'network', message },
    };
  }
}

export function validateHttpUrl(
  url: string,
  options: {
    readonly allowedHosts?: readonly string[];
  } = {},
): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:')
    throw new Error('Provider URL must use HTTPS.');
  if (parsed.username || parsed.password)
    throw new Error('Provider URL must not contain embedded credentials.');
  if (
    options.allowedHosts &&
    !options.allowedHosts.some(
      (host) =>
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    )
  )
    throw new Error(`Provider URL host "${parsed.hostname}" is not allowed.`);
}

function httpCategory(status: number): SendingProviderErrorCategory {
  if (status === 401 || status === 403) return 'authentication';
  if (status === 404) return 'configuration';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'provider';
  return 'content';
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}

const PRE_SUBMISSION_NETWORK_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'UND_ERR_CONNECT_TIMEOUT',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

function isPreSubmissionNetworkError(code: string | undefined): boolean {
  return Boolean(
    code &&
    (PRE_SUBMISSION_NETWORK_ERROR_CODES.has(code) ||
      code.startsWith('ERR_TLS_') ||
      code.startsWith('ERR_SSL_')),
  );
}
