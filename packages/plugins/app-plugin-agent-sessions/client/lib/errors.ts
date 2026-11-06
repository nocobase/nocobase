import type { ToastOptions } from '@nocobase/app-client';
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

/** A setup suggestion within the application; external and protocol-relative locations are never actions. */
export function suggestionAction(
  error: unknown,
  label: string,
  navigate: (href: string) => void,
): Pick<ToastOptions, 'action'> {
  if (!(error instanceof ApiClientError)) return {};
  const payload = error.payload as
    | { error?: { metadata?: { suggestions?: { href?: unknown }[] } } }
    | undefined;
  const href = payload?.error?.metadata?.suggestions?.[0]?.href;
  if (
    typeof href !== 'string' ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.includes('\\')
  )
    return {};
  return { action: { label, onClick: () => void navigate(href) } };
}
