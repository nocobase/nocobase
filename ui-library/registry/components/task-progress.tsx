import { Progress } from '@base-ui/react/progress';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { cn } from 'cn';

export type TaskProgressStatus =
  'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export interface TaskProgressProps {
  /** The task's real lifecycle status, from the server's task record. */
  readonly status: TaskProgressStatus;
  /** What the task is, such as "Customer export". */
  readonly label: string;
  /** The application's own word for the status; defaults to the standard copy. */
  readonly statusLabel?: string;
  /** Units actually processed, as reported by the task. */
  readonly processed?: number;
  /** The real total; leave it out or pass null while it is unknown. */
  readonly total?: number | null;
  /** For tasks that report only a percentage (0–100) instead of counts. */
  readonly percent?: number | null;
  /** Show that the task keeps running after the user leaves the page. */
  readonly continuesInBackground?: boolean;
  /** Caller-owned detail: a failure reason, or where the result is. */
  readonly message?: ReactNode;
  /** Real actions only: download, retry, or a cancel the server supports. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

/**
 * One long-running task record. A known total shows a determinate bar and
 * count; an unknown total shows an indeterminate bar without a percentage.
 * Status changes are announced once; percentage updates are not.
 */
export function TaskProgress({
  status,
  label,
  statusLabel,
  processed,
  total,
  percent: reportedPercent,
  continuesInBackground = false,
  message,
  actions,
  className,
}: TaskProgressProps): ReactElement {
  const { t } = useTranslation();
  const active = status === 'queued' || status === 'running';
  const counted = total !== undefined && total !== null && total > 0;
  const done = processed ?? 0;
  const known =
    counted || (reportedPercent !== undefined && reportedPercent !== null);
  const percent = counted
    ? Math.min(100, Math.floor((done / total) * 100))
    : Math.min(100, Math.max(0, Math.floor(reportedPercent ?? 0)));
  const statusText =
    statusLabel ??
    {
      queued: t('taskProgress.queued', { defaultValue: 'Waiting to start' }),
      running: t('taskProgress.running', { defaultValue: 'In progress' }),
      completed: t('taskProgress.completed', { defaultValue: 'Completed' }),
      failed: t('taskProgress.failed', { defaultValue: 'Failed' }),
      canceled: t('taskProgress.canceled', { defaultValue: 'Canceled' }),
    }[status];
  const countText = counted
    ? t('taskProgress.count', {
        defaultValue: '{{processed}} of {{total}}',
        processed: done,
        total,
      })
    : processed
      ? t('taskProgress.processed', {
          defaultValue: '{{processed}} processed',
          processed: done,
        })
      : undefined;
  return (
    <div
      data-slot='task-progress'
      data-status={status}
      className={cn('flex flex-col gap-2', className)}
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <span className='min-w-0 text-sm font-medium wrap-anywhere'>
          {label}
        </span>
        <span
          className={cn(
            'text-sm',
            status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {statusText}
        </span>
      </div>
      {active ? (
        <Progress.Root
          value={known ? percent : null}
          aria-label={label}
          getAriaValueText={() =>
            [statusText, countText, known ? `${percent}%` : undefined]
              .filter(Boolean)
              .join(', ')
          }
          className='flex flex-col gap-1.5'
        >
          <Progress.Track className='relative h-1.5 w-full overflow-hidden rounded-full bg-muted'>
            {/* An unknown amount fills the whole track faintly, so no segment can be read as a fraction done. */}
            <Progress.Indicator
              data-slot='task-progress-indicator'
              className={
                known
                  ? 'h-full bg-primary motion-safe:transition-[width] motion-safe:duration-500'
                  : 'h-full w-full bg-primary/25 motion-safe:animate-pulse'
              }
            />
          </Progress.Track>
          {countText || known ? (
            <span className='text-xs text-muted-foreground tabular-nums'>
              {[countText, known ? `${percent}%` : undefined]
                .filter(Boolean)
                .join(' · ')}
            </span>
          ) : null}
        </Progress.Root>
      ) : countText && status !== 'completed' ? (
        <span className='text-xs text-muted-foreground tabular-nums'>
          {countText}
        </span>
      ) : null}
      {active && continuesInBackground ? (
        <p className='text-xs text-muted-foreground'>
          {t('taskProgress.background', {
            defaultValue: 'It keeps running if you leave this page.',
          })}
        </p>
      ) : null}
      {message ? (
        <div
          className={cn(
            'text-sm',
            status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {message}
        </div>
      ) : null}
      {actions ? <div className='flex flex-wrap gap-2'>{actions}</div> : null}
      <span role='status' aria-live='polite' className='sr-only'>
        {`${label}: ${statusText}`}
      </span>
    </div>
  );
}
