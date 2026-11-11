import type { ListState } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlert,
  Inbox,
  LockKeyhole,
  LogIn,
  RefreshCw,
  SearchX,
  X,
} from 'lucide-react';
import { Fragment, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';
import { Alert } from '#components/ui/alert';
import { Loading } from '#components/loading';
import { PendingButton } from '#components/pending-button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';

const feedback = {
  empty: ['listFeedback.empty', 'No data yet', Inbox],
  'no-results': ['listFeedback.noResults', 'No results', SearchX],
  forbidden: ['listFeedback.forbidden', 'Access denied', LockKeyhole],
  unauthenticated: ['listFeedback.unauthenticated', 'Session expired', LogIn],
  failed: ['listFeedback.failed', 'Unable to load list', CircleAlert],
} as const;

export interface ListFeedbackProps {
  readonly state: ListState;
  readonly children?: ReactNode;
  /** Business empty content applies only after a successful unfiltered read. */
  readonly empty?: ReactNode;
  /** Optional business-specific action; the standard create action belongs in the page header. */
  readonly emptyAction?: ReactNode;
  /**
   * The current query's stable identity, such as its request path. A new
   * query restarts the display delay without remounting the list.
   */
  readonly identity?: unknown;
}

export interface ListFeedbackActionsProps {
  readonly state: ListState;
  readonly onClear?: () => void;
  /**
   * The host's search or filters are applied. "Clear filters" then shows with
   * the rows too, not only when nothing matched, so a phone user can clear
   * them without reopening the filter sheet (mobile.md M4.2).
   */
  readonly filtered?: boolean;
  readonly onRetry?: () => void;
  readonly busy?: boolean;
}

/** Render state-appropriate recovery controls inside the host's existing toolbar. */
export function ListFeedbackActions({
  state,
  onClear,
  filtered = false,
  onRetry,
  busy = false,
}: ListFeedbackActionsProps): ReactElement | null {
  const { t } = useTranslation();

  const clear =
    onClear &&
    (state === 'no-results' ||
      (filtered && state !== 'forbidden' && state !== 'unauthenticated')) ? (
      <Button variant='outline' onClick={onClear}>
        <X aria-hidden='true' />
        {t('listFeedback.clear', { defaultValue: 'Clear filters' })}
      </Button>
    ) : null;

  if ((state === 'failed' || state === 'refresh-failed') && onRetry) {
    return (
      <>
        {clear}
        <PendingButton
          variant='outline'
          busy={busy}
          pendingLabel={t('listFeedback.retrying', {
            defaultValue: 'Retrying…',
          })}
          onClick={onRetry}
        >
          <RefreshCw aria-hidden='true' />
          {t('listFeedback.retry', { defaultValue: 'Retry' })}
        </PendingButton>
      </>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <Button
        variant='outline'
        nativeButton={false}
        render={<Link to='/login' />}
      >
        <LogIn aria-hidden='true' />
        {t('listFeedback.signIn', { defaultValue: 'Sign in' })}
      </Button>
    );
  }

  return clear;
}

/** Shared by tables and card lists. Authorization is decided by the host. */
export function ListFeedback({
  state,
  children,
  empty,
  emptyAction,
  identity,
}: ListFeedbackProps): ReactElement {
  const { t } = useTranslation();

  if (state === 'ready') {
    return <Fragment key='list-feedback-content'>{children}</Fragment>;
  }

  if (state === 'refresh-failed') {
    return (
      <>
        <Alert
          className='flex min-w-0 items-center gap-2 border-border px-3 py-2 text-sm'
          role='alert'
        >
          <CircleAlert
            aria-hidden='true'
            className='size-4 shrink-0 text-destructive'
          />
          <p className='min-w-0 flex-1 wrap-anywhere'>
            {t('listFeedback.refreshFailed', {
              defaultValue: 'Refresh failed; showing previous data',
            })}
          </p>
        </Alert>
        <Fragment key='list-feedback-content'>{children}</Fragment>
      </>
    );
  }

  if (state === 'loading') {
    // The body keeps its footprint at once; the indicator and one status follow the shared display delay.
    return (
      <Loading
        identity={identity}
        label={t('listFeedback.loading', { defaultValue: 'Loading' })}
        className='min-h-24 px-4 py-4'
      />
    );
  }

  const [key, fallback, Icon] = feedback[state];
  const isError =
    state === 'failed' || state === 'forbidden' || state === 'unauthenticated';
  const showCustomEmpty =
    state === 'empty' && (empty !== undefined || emptyAction !== undefined);

  return (
    <>
      <Empty
        role={isError ? 'alert' : 'status'}
        className='min-h-24 flex-row flex-none gap-2 rounded-none border-0 px-4 py-6 text-pretty text-card-foreground'
      >
        <EmptyMedia className='mb-0 size-4 text-muted-foreground'>
          <Icon aria-hidden='true' className='size-4' />
        </EmptyMedia>
        <EmptyTitle className='text-sm font-medium text-muted-foreground'>
          {t(key, { defaultValue: fallback })}
        </EmptyTitle>
      </Empty>
      {showCustomEmpty ? (
        <EmptyContent className='max-w-full px-4 pb-4 text-center'>
          {empty !== undefined ? (
            <EmptyDescription className='max-w-md wrap-anywhere'>
              {empty}
            </EmptyDescription>
          ) : null}
          {emptyAction}
        </EmptyContent>
      ) : null}
    </>
  );
}
