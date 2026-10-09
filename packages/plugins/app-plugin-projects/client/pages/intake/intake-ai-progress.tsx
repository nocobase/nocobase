import { useTranslation } from '@nocobase/i18n/client';
import { SparklesIcon, XIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import type { IntakeAiJob } from '../../../shared/intake-ai.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useIntakeWaitFormat } from '../../lib/intake-wait.js';

function elapsed(since: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(since)) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * A running request to AI: what it does (split, revise, break down), who works on it, how long it has run, and the
 * newest thing it reported, or why it still waits; with "Cancel".
 */
export function IntakeAiProgress({
  job,
  cancelling,
  onCancel,
}: {
  readonly job: IntakeAiJob;
  readonly cancelling: boolean;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  const progress = job.progress;
  const by = progress?.by ?? null;
  const waiting = progress?.phase !== 'working';
  const wait = progress?.waitReason ?? null;
  // Words for the reason the application gives (`IntakeWaitFormatContext`); this plugin knows no reason.
  const format = useIntakeWaitFormat();
  return (
    <section
      className='flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground'
      aria-live='polite'
      data-testid='intake-ai-progress'
    >
      <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <SparklesIcon className='size-4' aria-hidden='true' />
      </span>
      <div className='min-w-0 flex-1 space-y-1'>
        <p className='flex items-center gap-2 text-sm font-medium'>
          <Spinner className='size-3.5' />
          {job.mode === 'breakdown'
            ? t('intakeAi.progress.breakdown', {
                issue: job.issue?.identifier ?? '',
              })
            : t(`intakeAi.progress.${job.mode}`)}
          <span className='text-xs font-normal text-muted-foreground tabular-nums'>
            {elapsed(job.createdAt, now)}
          </span>
        </p>
        <p className='text-xs text-muted-foreground'>
          {waiting
            ? wait
              ? (format?.({
                  reason: wait,
                  ...(progress?.waitParams
                    ? { params: progress.waitParams }
                    : {}),
                }) ?? t('intakeAi.wait.reason', { reason: wait }))
              : t('intakeAi.wait.queued')
            : by
              ? t('intakeAi.working', { name: by })
              : t('intakeAi.workingAnonymous')}
        </p>
        {!waiting && progress?.activity ? (
          <p
            className='truncate text-xs text-muted-foreground'
            title={progress.activity}
          >
            {t('intakeAi.lastActivity', { text: progress.activity })}
          </p>
        ) : null}
      </div>
      <Button
        variant='ghost'
        size='sm'
        disabled={cancelling}
        onClick={onCancel}
        data-testid='intake-ai-cancel'
      >
        {cancelling ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <XIcon data-icon='inline-start' />
        )}
        {t('intakeAi.cancel')}
      </Button>
    </section>
  );
}
