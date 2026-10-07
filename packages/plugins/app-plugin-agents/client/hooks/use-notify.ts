import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

export interface Notify {
  success(title: string): void;
  /** A failed request, in words: a 403 as "not allowed", a known reason by its translation, else `fallback`. */
  error(error: unknown, fallback?: string): void;
}

/** Toasts through the application's toaster, with one reading of API errors for every page. */
export function useNotify(): Notify {
  const toaster = useToaster();
  const { t } = useTranslation();
  return useMemo(
    () => ({
      success: (title) => void toaster.show({ type: 'success', title }),
      error: (error, fallback) =>
        void toaster.show({
          type: 'error',
          title: errorText(t, error, fallback ?? t('common.requestFailed')),
        }),
    }),
    [toaster, t],
  );
}

export function errorText(
  t: (key: string, options?: Record<string, unknown>) => string,
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiClientError)) return fallback;
  if (error.status === 403) return t('common.forbidden');
  if (error.reason)
    return t(`errors.${error.reason}`, {
      defaultValue: error.message || fallback,
    });
  return error.message || fallback;
}
