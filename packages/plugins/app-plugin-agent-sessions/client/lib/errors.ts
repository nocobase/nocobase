import { ApiClientError } from '@nocobase/app-client';

/** What to tell the person about a failed request: the server's translated message when it sent one, else `fallback`. */
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    const payload = error.payload as
      { error?: { localizedMessage?: { message?: unknown } } } | undefined;
    const message = payload?.error?.localizedMessage?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
