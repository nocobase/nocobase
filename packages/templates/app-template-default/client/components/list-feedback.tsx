import type { ListState } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '#components/ui/button';

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
  if (state === 'ready' || state === 'refresh-failed')
    return (
      <>
        {state === 'refresh-failed' ? (
          <div
            role='alert'
            className='flex flex-wrap items-center gap-3 rounded-lg border p-4'
          >
            <span>
              {t('listFeedback.refreshFailed', {
                defaultValue: 'Refresh failed. Showing previously loaded data.',
              })}
            </span>
            {onRetry && (
              <Button variant='outline' disabled={busy} onClick={onRetry}>
                {busy
                  ? t('listFeedback.retrying', { defaultValue: 'Retrying…' })
                  : t('listFeedback.retry', { defaultValue: 'Retry' })}
              </Button>
            )}
          </div>
        ) : null}
        {children}
      </>
    );
  const messages = {
    loading: ['listFeedback.loading', 'Loading…'],
    empty: ['listFeedback.empty', 'No data yet.'],
    'no-results': ['listFeedback.noResults', 'No matching results.'],
    forbidden: [
      'listFeedback.forbidden',
      'You do not have permission to view this list.',
    ],
    unauthenticated: [
      'listFeedback.unauthenticated',
      'Your session has expired. Sign in again.',
    ],
    failed: ['listFeedback.failed', 'Unable to load this list.'],
  } as const;
  const [key, fallback] = messages[state];
  return (
    <div
      role={
        state === 'failed' ||
        state === 'forbidden' ||
        state === 'unauthenticated'
          ? 'alert'
          : 'status'
      }
      className='space-y-3 rounded-lg border p-8 text-center'
      aria-busy={state === 'loading'}
    >
      {state === 'empty' && empty !== undefined ? (
        empty
      ) : (
        <p>{t(key, { defaultValue: fallback })}</p>
      )}
      {state === 'empty' && emptyAction}
      {state === 'no-results' && onClear && (
        <Button variant='outline' onClick={onClear}>
          {t('listFeedback.clear', { defaultValue: 'Clear filters' })}
        </Button>
      )}
      {state === 'failed' && onRetry && (
        <Button variant='outline' disabled={busy} onClick={onRetry}>
          {busy
            ? t('listFeedback.retrying', { defaultValue: 'Retrying…' })
            : t('listFeedback.retry', { defaultValue: 'Retry' })}
        </Button>
      )}
      {state === 'unauthenticated' && (
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/login' />}
        >
          {t('listFeedback.signIn', { defaultValue: 'Sign in again' })}
        </Button>
      )}
    </div>
  );
}
