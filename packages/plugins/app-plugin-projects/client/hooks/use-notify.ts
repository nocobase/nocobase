import type { ToastOptions } from '@nocobase/app-client';
import { useNavigate } from 'react-router';
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';

export interface Notify {
  success(title: string): void;
  /** Something the user should know that is neither a success nor a failure, such as a change waiting for approval. */
  info(title: string, description?: string): void;
  /**
   * A failed request, in words: a 403 as "not allowed", a 404 as "no longer exists", a known reason by its translation
   * (`errors.<REASON>`), else the server's message or `fallback`.
   */
  error(error: unknown, fallback?: string): void;
}

/** Toasts through the application's toaster, with one reading of API errors for every page. */
export function useNotify(): Notify {
  const toaster = useToaster();
  const navigate = useNavigate();
  // Named: the issues hooks the application composes its pages from (`client/issues.ts`) call this in its namespace.
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useMemo(
    () => ({
      success: (title) => void toaster.show({ type: 'success', title }),
      info: (title, description) =>
        void toaster.show({
          type: 'info',
          title,
          ...(description ? { description } : {}),
        }),
      error: (error, fallback) =>
        void toaster.show({
          type: 'error',
          title: errorText(t, error, fallback ?? t('common.requestFailed')),
          ...suggestionAction(error, t, (href) => void navigate(href)),
        }),
    }),
    [toaster, t, navigate],
  );
}

export function errorText(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiClientError)) return fallback;
  if (error.status === 403) return t('common.forbidden');
  if (error.status === 404) return t('common.notFound');
  if (error.reason) {
    const metadata = errorMetadata(error);
    const reason = metadata?.reason;
    const detailed =
      typeof reason === 'string'
        ? t(`errors.${error.reason}.${reason}`, { defaultValue: '' })
        : '';
    const message =
      detailed ||
      t(`errors.${error.reason}`, { defaultValue: error.message || fallback });
    const suggestions = metadata?.suggestions;
    const hint =
      Array.isArray(suggestions) &&
      !suggestions.some(
        (item: unknown) =>
          item &&
          typeof item === 'object' &&
          'href' in item &&
          typeof item.href === 'string',
      )
        ? t(`errors.${error.reason}.suggestion`, { defaultValue: '' })
        : '';
    return hint ? message + ' ' + hint : message;
  }
  return fallback;
}

/** The standard error body's `metadata`: machine-readable facts about the failure, such as a plan's row checks. */
export function errorMetadata(
  error: ApiClientError,
): Readonly<Record<string, unknown>> | undefined {
  const payload = error.payload as
    { readonly error?: { readonly metadata?: unknown } } | undefined;
  const metadata = payload?.error?.metadata;
  return metadata && typeof metadata === 'object'
    ? (metadata as Readonly<Record<string, unknown>>)
    : undefined;
}

/** Only app-relative suggestions may navigate through the host router (which restores its deployment prefix). */
export function suggestionAction(
  error: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
  navigate: (href: string) => void,
): Pick<ToastOptions, 'action'> {
  if (!(error instanceof ApiClientError)) return {};
  const metadata = errorMetadata(error);
  const suggestions = metadata?.suggestions;
  if (!Array.isArray(suggestions)) return {};
  const first = suggestions[0] as
    { href?: unknown; message?: unknown } | undefined;
  const href = first?.href;
  if (
    typeof href !== 'string' ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    href.includes('\\')
  )
    return {};
  return {
    action: {
      label: t('common.configure', { defaultValue: 'Configure' }),
      onClick: () => void navigate(href),
    },
  };
}
