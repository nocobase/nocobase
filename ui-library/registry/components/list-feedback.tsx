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
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';
import { Alert } from '#components/ui/alert';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';

export interface ListFeedbackProps {
  readonly state: ListState;
  readonly children?: ReactNode;
  /** Business empty content applies only after a successful unfiltered read. */
  readonly empty?: ReactNode;
  readonly emptyAction?: ReactNode;
  readonly onClear?: () => void;
  readonly onRetry?: () => void;
  readonly busy?: boolean;
}

/** Shared by tables and card lists. Authorization is decided by the host. */
export function ListFeedback({
  state,
  children,
  empty,
  emptyAction,
  onClear,
  onRetry,
  busy,
}: ListFeedbackProps): ReactElement {
  const { t } = useTranslation();
  const renderRetry = () =>
    onRetry && (
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

  if (state === 'ready' || state === 'refresh-failed')
    return (
      <>
        {state === 'refresh-failed' ? (
          <Alert className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-border px-3 py-2'>
            <span className='flex size-4 shrink-0 items-center justify-center text-destructive'>
              <CircleAlert aria-hidden='true' className='size-4' />
            </span>
            <p className='min-w-0 flex-1 wrap-anywhere'>
              {t('listFeedback.refreshFailed', {
                defaultValue: 'Refresh failed. Previous data remains visible.',
              })}
            </p>
            {renderRetry()}
          </Alert>
        ) : null}
        {children}
      </>
    );

  const messages = {
    loading: ['listFeedback.loading', 'Loading…', LoaderCircle],
    empty: ['listFeedback.empty', 'No data yet.', Inbox],
    'no-results': ['listFeedback.noResults', 'No matching results.', SearchX],
    forbidden: ['listFeedback.forbidden', 'Access denied.', LockKeyhole],
    unauthenticated: [
      'listFeedback.unauthenticated',
      'Session expired.',
      LogIn,
    ],
    failed: ['listFeedback.failed', 'Unable to load list.', CircleAlert],
  } as const;
  const [key, fallback, Icon] = messages[state];
  const isError =
    state === 'failed' || state === 'forbidden' || state === 'unauthenticated';
  const hasAction =
    (state === 'empty' && emptyAction) ||
    (state === 'no-results' && onClear) ||
    (state === 'failed' && onRetry) ||
    state === 'unauthenticated';
  const content = (
    <>
      <EmptyHeader className='w-full gap-2'>
        <EmptyMedia className='mb-0 size-4 text-muted-foreground'>
          <Icon
            aria-hidden='true'
            className={
              state === 'loading' ? 'size-4 motion-safe:animate-spin' : 'size-4'
            }
          />
        </EmptyMedia>
        <EmptyTitle className='text-sm font-medium text-foreground wrap-anywhere'>
          {t(key, { defaultValue: fallback })}
        </EmptyTitle>
        {state === 'empty' && empty !== undefined ? (
          <EmptyDescription className='max-w-md wrap-anywhere'>
            {empty}
          </EmptyDescription>
        ) : null}
      </EmptyHeader>
      {hasAction ? (
        <EmptyContent className='w-auto max-w-full flex-row flex-wrap justify-center gap-2'>
          {state === 'empty' && emptyAction}
          {state === 'no-results' && onClear && (
            <Button variant='outline' onClick={onClear}>
              <X aria-hidden='true' />
              {t('listFeedback.clear', { defaultValue: 'Clear filters' })}
            </Button>
          )}
          {state === 'failed' && renderRetry()}
          {state === 'unauthenticated' && (
            <Button
              variant='outline'
              nativeButton={false}
              render={<Link to='/login' />}
            >
              <LogIn aria-hidden='true' />
              {t('listFeedback.signIn', { defaultValue: 'Sign in' })}
            </Button>
          )}
        </EmptyContent>
      ) : null}
    </>
  );
  const panelClass =
    'flex min-h-40 w-full min-w-0 flex-none flex-col items-center justify-center gap-3 border-0 bg-transparent px-4 py-8 text-center text-card-foreground';
  return (
    <Empty
      role={isError ? 'alert' : 'status'}
      className={panelClass}
      aria-busy={state === 'loading'}
    >
      {content}
    </Empty>
  );
}
