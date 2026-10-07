import { useTranslation } from '@nocobase/i18n/client';
import { useCallback } from 'react';

import enUS from '../locales/en-US.js';
import type { AuthenticationActionError } from './types.js';

/** The authentication plugin's locale namespace (`client/locales/`). */
export const AUTHENTICATION_NAMESPACE = '@nocobase/app-plugin-authentication';

type ErrorKey = keyof typeof enUS.errors;

const KNOWN_CODES = new Set<string>(
  Object.keys(enUS.errors).filter((key) => /^[A-Z_]+$/u.test(key)),
);

export type TranslateAuthenticationError = (
  key: ErrorKey,
  defaultValue: string,
) => string;

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * What a failed request said: the error code in its JSON body and its HTTP status. Better Auth's client throws a
 * `BetterFetchError` holding the body in `error` and the status in `status`; without `throw` it returns the body itself
 * with `status` added. A plain `Error` with neither is a request that never got an answer.
 */
function describe(error: unknown): { code?: string; status?: number } {
  const outer = record(error);
  if (!outer) return {};
  const body = record(outer.error) ?? outer;
  const code = typeof body.code === 'string' ? body.code : undefined;
  const status =
    typeof outer.status === 'number'
      ? outer.status
      : typeof body.status === 'number'
        ? body.status
        : undefined;
  return { code, status };
}

/**
 * Turns a failed authentication request into a message for the person: the localized message for the server's error
 * code, a rate-limit message for 429, or a generic one. Never the response's status text or the server's English
 * message, which are not written for the person and not in their language.
 */
export function resolveAuthenticationActionError(
  error: unknown,
  translate: TranslateAuthenticationError = (_key, defaultValue) =>
    defaultValue,
): AuthenticationActionError | undefined {
  if (!error) return undefined;
  const { code, status } = describe(error);
  const message = (key: ErrorKey) => translate(key, enUS.errors[key]);
  if (code && KNOWN_CODES.has(code))
    return { code, message: message(code as ErrorKey) };
  if (status === 429)
    return { code: code ?? 'RATE_LIMITED', message: message('rateLimited') };
  if (status === undefined && error instanceof TypeError)
    return { code: 'NETWORK_ERROR', message: message('network') };
  return { ...(code ? { code } : {}), message: message('generic') };
}

/** `resolveAuthenticationActionError` with the messages in the language the person is using. */
export function useAuthenticationErrorResolver(): (
  error: unknown,
) => AuthenticationActionError | undefined {
  const { t } = useTranslation(AUTHENTICATION_NAMESPACE);
  return useCallback(
    (error: unknown) =>
      resolveAuthenticationActionError(error, (key, defaultValue) =>
        t(`errors.${key}`, { defaultValue }),
      ),
    [t],
  );
}
