/** Outcomes as toasts through the application's toaster, with failures in the reader's language. */
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';

export interface Notify {
  success(title: string): void;
  /** A failed request, in words: a 403 as "not allowed", a known reason by its translation (`errors.<REASON>`). */
  error(error: unknown, fallback?: string): void;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function errorText(
  t: Translate,
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiClientError)) return fallback;
  if (error.status === 403) return t('common.forbidden');
  if (error.reason)
    return t(`errors.${error.reason}`, {
      defaultValue: error.message || fallback,
    });
  return fallback;
}

export function useNotify(): Notify {
  const toaster = useToaster();
  const { t } = useTranslation(ACCESS_NAMESPACE);
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
