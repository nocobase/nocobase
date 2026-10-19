import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from './ui/button.js';
import { errorMessage } from '../lib/api.js';
import { NAMESPACE } from '../lib/format.js';

export function RefreshNotice({
  error,
  retry,
}: {
  readonly error: unknown;
  readonly retry: () => void;
}): ReactElement | null {
  const { t } = useTranslation(NAMESPACE);
  if (error === undefined) return null;
  return (
    <div
      role='alert'
      className='flex items-center gap-3 text-sm text-destructive'
    >
      <span>{errorMessage(error)}</span>
      <Button size='sm' variant='outline' onClick={retry}>
        {t('lifecycle.retry')}
      </Button>
    </div>
  );
}
