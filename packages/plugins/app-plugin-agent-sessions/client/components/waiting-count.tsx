import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

/** "Needs you 2": how many records tied to a session wait for the viewer, beside its bar. */
export function WaitingCount({
  count,
}: {
  readonly count: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <span
      className='inline-flex h-5 shrink-0 items-center rounded bg-amber-500/15 px-1.5 text-xs font-medium whitespace-nowrap text-amber-800 dark:bg-amber-400/15 dark:text-amber-300'
      data-testid='links-waiting'
    >
      {t('links.waiting', { count })}
    </span>
  );
}
