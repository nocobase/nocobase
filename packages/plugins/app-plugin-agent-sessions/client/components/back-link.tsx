import { useTranslation } from '@nocobase/i18n/client';
import { ChevronLeftIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

/** Back to the session list, on a phone, where the list and a session take turns. */
export function BackLink(): ReactElement {
  const { t } = useTranslation();
  return (
    <Link
      to='/agent-sessions'
      aria-label={t('list.back')}
      className='text-muted-foreground hover:bg-muted hover:text-foreground -ml-2 inline-flex size-9 shrink-0 items-center justify-center rounded-md md:hidden'
    >
      <ChevronLeftIcon className='size-5' />
    </Link>
  );
}
