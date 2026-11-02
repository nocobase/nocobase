import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { Button } from './ui/button.js';
import { Spinner } from './ui/spinner.js';

/** Retrying a status read is available to readers and does not reindex a document. */
export function IndexRefreshError({
  fetching,
  onRetry,
}: {
  readonly fetching: boolean;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <span className='inline-flex flex-wrap items-center gap-2 text-sm'>
      <span role='alert' className='text-destructive'>
        {t('knowledge.index.refreshFailed')}
      </span>
      <Button variant='ghost' size='sm' disabled={fetching} onClick={onRetry}>
        {fetching ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <RefreshCwIcon data-icon='inline-start' />
        )}
        {t('knowledge.index.retryRefresh')}
      </Button>
    </span>
  );
}
