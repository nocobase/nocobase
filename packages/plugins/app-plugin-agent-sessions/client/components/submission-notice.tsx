import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from './ui/button.js';

export function SubmissionNotice({
  pending,
  sending,
  retry,
  edit,
}: {
  readonly pending: boolean;
  readonly sending: boolean;
  readonly retry: () => Promise<void>;
  readonly edit: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!pending || sending) return null;
  return (
    <div
      role='status'
      className='text-muted-foreground flex flex-wrap items-center gap-2 p-3 text-sm'
    >
      <span>{t('composer.unconfirmed')}</span>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          void retry().catch(() => undefined);
        }}
      >
        {t('composer.retrySubmission')}
      </Button>
      <Button variant='ghost' size='sm' onClick={edit}>
        {t('composer.editAsNew')}
      </Button>
    </div>
  );
}
