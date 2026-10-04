import { ApiClientError } from '@nocobase/app-client';
import type { ReactElement } from 'react';

import type { Translate } from '../i18n.js';
import { Alert, AlertDescription } from './ui/alert.js';

export function ErrorBox({ value }: { value: string }): ReactElement {
  return (
    <Alert className='border-destructive/30 bg-destructive/5'>
      <AlertDescription className='text-destructive'>{value}</AlertDescription>
    </Alert>
  );
}

/**
 * What a failure tells the user. A server's `message` is for developers and never shown; an error raised in the
 * browser, such as an incomplete form, already carries translated text.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function errorMessage(t: Translate, error: unknown): string {
  if (error instanceof ApiClientError) return t('errors.requestFailed');
  return error instanceof Error ? error.message : t('errors.requestFailed');
}
