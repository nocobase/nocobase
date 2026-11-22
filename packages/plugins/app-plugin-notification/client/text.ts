import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import type { NotificationTemplateText } from '../shared/templates.js';

export const NOTIFICATION_NAMESPACE = '@nocobase/app-plugin-notification';

export type ResolveText = (text: NotificationTemplateText) => string;
export type Translate = (key: string, options?: Record<string, unknown>) => string;

/** The plugin's translations, and registrant text resolved in the interface language. */
export function useNotificationText(): {
  readonly t: Translate;
  readonly text: ResolveText;
  readonly language: string;
} {
  const { t, i18n } = useTranslation(NOTIFICATION_NAMESPACE);
  const translate = t as unknown as Translate;
  const text: ResolveText = (value) =>
    typeof value === 'string'
      ? value
      : translate(value.key, { ns: value.ns, defaultValue: value.defaultValue });
  return { t: translate, text, language: i18n.language };
}

/** What went wrong with a request, for the plugin's `errors.*` messages. */
export function requestFailure(
  cause: unknown,
): 'forbidden' | 'notFound' | 'failed' {
  if (cause instanceof ApiClientError && cause.status === 403)
    return 'forbidden';
  if (cause instanceof ApiClientError && cause.status === 404)
    return 'notFound';
  return 'failed';
}

/** The server's message for a failed request, else `fallback`. */
export function failureMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiClientError && cause.message
    ? cause.message
    : fallback;
}

/** A date and time in the interface language. */
export function formatTime(value: string | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(locale || 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
}
