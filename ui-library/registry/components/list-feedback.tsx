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
      <Button
        variant='outline'
        disabled={busy}
        onClick={onRetry}
        className='h-auto min-h-8 max-w-full py-2 whitespace-normal wrap-anywhere'
      >
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
          <Alert
            variant='destructive'
            className='flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground sm:flex-row sm:items-center'
          >
            <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-destructive'>
              <CircleAlert aria-hidden='true' className='size-4' />
            </span>
            <div className='flex min-w-0 flex-1 flex-col gap-1 wrap-anywhere'>
              <p className='text-sm font-medium'>
                {t('listFeedback.refreshTitle', {
                  defaultValue: 'This list could not be refreshed',
                })}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('listFeedback.refreshFailed', {
                  defaultValue:
                    'Refresh failed. Showing previously loaded data.',
                })}
              </p>
            </div>
            {onRetry && (
              <div className='flex shrink-0 flex-wrap gap-2'>
                {renderRetry()}
              </div>
            )}
          </Alert>
        ) : null}
        {children}
      </>
    );
  const messages = {
    loading: [
      'listFeedback.loading',
      'Loading…',
      'listFeedback.loadingDescription',
      'Your records will appear here shortly.',
      LoaderCircle,
    ],
    empty: [
      'listFeedback.empty',
      'No data yet.',
      'listFeedback.emptyDescription',
      'Records will appear here when they are available.',
      Inbox,
    ],
    'no-results': [
      'listFeedback.noResults',
      'No matching results.',
      'listFeedback.noResultsDescription',
      'Try another search or clear your filters to see more records.',
      SearchX,
    ],
    forbidden: [
      'listFeedback.forbidden',
      'You do not have permission to view this list.',
      'listFeedback.forbiddenDescription',
      'Ask your administrator if you need access.',
      LockKeyhole,
    ],
    unauthenticated: [
      'listFeedback.unauthenticated',
      'Your session has expired. Sign in again.',
      'listFeedback.unauthenticatedDescription',
      'Sign in to continue with your current account.',
      LogIn,
    ],
    failed: [
      'listFeedback.failed',
      'Unable to load this list.',
      'listFeedback.failedDescription',
      'Try again. Your current search and filters will be kept.',
      CircleAlert,
    ],
  } as const;
  const [key, fallback, descriptionKey, descriptionFallback, Icon] =
    messages[state];
  const hasAction =
    (state === 'empty' && emptyAction) ||
    (state === 'no-results' && onClear) ||
    (state === 'failed' && onRetry) ||
    state === 'unauthenticated';
  const content = (
    <>
      <EmptyHeader className='w-full max-w-md gap-2'>
        <EmptyMedia
          variant='icon'
          className='mb-3 size-12 rounded-xl ring-1 ring-border/60'
        >
          <Icon
            aria-hidden='true'
            className={
              state === 'loading' ? 'size-6 motion-safe:animate-spin' : 'size-6'
            }
          />
        </EmptyMedia>
        <div className='flex w-full max-w-md min-w-0 flex-col gap-2 wrap-anywhere'>
          <EmptyTitle className='text-base text-foreground text-balance'>
            {t(key, { defaultValue: fallback })}
          </EmptyTitle>
          <EmptyDescription className='text-pretty'>
            {state === 'empty' && empty !== undefined
              ? empty
              : t(descriptionKey, { defaultValue: descriptionFallback })}
          </EmptyDescription>
        </div>
      </EmptyHeader>
      {state === 'loading' && (
        <div
          aria-hidden='true'
          className='flex w-48 max-w-full flex-col items-center gap-2 motion-safe:animate-pulse'
        >
          <span className='h-2 w-full rounded-full bg-muted' />
          <span className='h-2 w-3/4 rounded-full bg-muted' />
        </div>
      )}
      {hasAction ? (
        <EmptyContent className='max-w-md flex-row flex-wrap items-center justify-center gap-2 [&>*]:max-w-full [&_button]:h-auto [&_button]:min-h-8 [&_button]:py-2 [&_button]:whitespace-normal [&_button]:wrap-anywhere'>
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
              {t('listFeedback.signIn', { defaultValue: 'Sign in again' })}
            </Button>
          )}
        </EmptyContent>
      ) : null}
    </>
  );
  const isError =
    state === 'failed' || state === 'forbidden' || state === 'unauthenticated';
  const panelClass =
    'flex min-h-64 w-full min-w-0 flex-col items-center justify-center gap-5 rounded-xl border bg-card px-6 py-8 text-center text-card-foreground sm:py-12';
  return isError ? (
    <Alert variant='destructive' className={panelClass}>
      {content}
    </Alert>
  ) : (
    <Empty role='status' className={panelClass} aria-busy={state === 'loading'}>
      {content}
    </Empty>
  );
}
