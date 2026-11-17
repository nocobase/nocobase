import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlert,
  DatabaseZap,
  Inbox,
  LockKeyhole,
  LogIn,
  RefreshCw,
  SearchX,
  Unplug,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Loading } from '#components/loading';
import { Button, buttonVariants } from '#components/ui/button';
import { canRetry, type Failure } from './read.js';

export type Notice =
  Failure | 'noConnections' | 'noTables' | 'noFields' | 'noResults';

const notices: Record<Notice, readonly [LucideIcon, boolean]> = {
  unauthenticated: [LogIn, true],
  forbidden: [LockKeyhole, true],
  connectionNotFound: [Unplug, true],
  tableNotFound: [SearchX, true],
  unavailable: [DatabaseZap, true],
  failed: [CircleAlert, true],
  noConnections: [Inbox, false],
  noTables: [Inbox, false],
  noFields: [Inbox, false],
  noResults: [SearchX, false],
};

/** One short status line with its icon; failures are announced as alerts, empty states as statuses. */
export function StatusLine({ notice }: { notice: Notice }): ReactElement {
  const { t } = useTranslation();
  const [Icon, isError] = notices[notice];
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className='flex min-h-24 items-center justify-center gap-2 px-4 py-6 text-center text-sm font-medium text-muted-foreground'
    >
      <Icon aria-hidden='true' className='size-4 shrink-0' />
      <p className='min-w-0 wrap-anywhere'>
        {t(`databaseExplorer.notice.${notice}`)}
      </p>
    </div>
  );
}

export function LoadingLine({
  label,
  identity,
}: {
  label?: string;
  identity?: unknown;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Loading
      identity={identity}
      label={label ?? t('databaseExplorer.loading')}
      className='min-h-24 px-4 py-4'
    />
  );
}

/** The recovery a failure offers: sign in again, or retry when retrying can help. */
export function Recovery({
  failure,
  onRetry,
}: {
  failure: Failure;
  onRetry: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (failure === 'unauthenticated')
    return (
      <Link to='/login' className={buttonVariants({ variant: 'outline' })}>
        <LogIn aria-hidden='true' />
        {t('databaseExplorer.signIn')}
      </Link>
    );
  if (!canRetry(failure)) return null;
  return (
    <Button variant='outline' onClick={onRetry}>
      <RefreshCw aria-hidden='true' />
      {t('databaseExplorer.retry')}
    </Button>
  );
}
