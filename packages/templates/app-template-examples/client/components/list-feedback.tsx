import type { ListState } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlert,
  Inbox,
  LoaderCircle,
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '#components/ui/empty';

const feedback = {
  loading: ['listFeedback.loading', 'Loading', LoaderCircle],
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
}

export interface ListFeedbackActionsProps {
  readonly state: ListState;
  readonly onClear?: () => void;
  readonly onRetry?: () => void;
  readonly busy?: boolean;
}

/** Render state-appropriate recovery controls inside the host's existing toolbar. */
export function ListFeedbackActions({
  state,
  onClear,
  onRetry,
  busy = false,
}: ListFeedbackActionsProps): ReactElement | null {
  const { t } = useTranslation();

  if (state === 'no-results' && onClear) {
    return (
      <Button variant='outline' onClick={onClear}>
        <X aria-hidden='true' />
        {t('listFeedback.clear', { defaultValue: 'Clear filters' })}
      </Button>
    );
  }

  if ((state === 'failed' || state === 'refresh-failed') && onRetry) {
    return (
      <Button variant='outline' disabled={busy} onClick={onRetry}>
        {busy ? (
          <LoaderCircle
            aria-hidden='true'
            className='motion-safe:animate-spin'
          />
        ) : (
          <RefreshCw aria-hidden='true' />
        )}
        {busy
          ? t('listFeedback.retrying', { defaultValue: 'Retrying…' })
          : t('listFeedback.retry', { defaultValue: 'Retry' })}
      </Button>
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

  return null;
}

/** Shared by tables and card lists. Authorization is decided by the host. */
export function ListFeedback({
  state,
  children,
  empty,
  emptyAction,
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
        aria-busy={state === 'loading'}
      >
        <EmptyMedia className='mb-0 size-4 text-muted-foreground'>
          <Icon
            aria-hidden='true'
            className={
              state === 'loading' ? 'size-4 motion-safe:animate-spin' : 'size-4'
            }
          />
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
