/** Outcomes as toasts through the application's toaster, with failures worded by `lib/errors.ts`. */
import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { errorText } from '../lib/errors.js';

export interface Notify {
  success(title: string, description?: string): void;
  /** A failed request or step, in the reader's language. */
  error(error: unknown): void;
}

export function useNotify(): Notify {
  const toaster = useToaster();
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useMemo(
    () => ({
      success: (title, description) =>
        void toaster.show({
          type: 'success',
          title,
          ...(description ? { description } : {}),
        }),
      error: (error) =>
        void toaster.show({
          type: 'error',
          title: errorText(t, error, t('ui.errors.requestFailed')),
        }),
    }),
    [toaster, t],
  );
}
