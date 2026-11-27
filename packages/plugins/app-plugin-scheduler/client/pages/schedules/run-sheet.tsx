/**
 * One run in a side sheet: its result and reason, the timeline (started, accepted by the target, finished), how often it
 * was delivered, the target, the related item the target links to (`target.href`) and the target's receipt. A run
 * waiting for its result says the scheduler sets no timeout of its own.
 */
import { useLocale } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { InfoIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet.js';
import type { Occurrence } from '../../lib/api.js';
import { formatTime } from '../../lib/format.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { reasonText, summaryText } from './occurrence-text.js';
import { Code, Field, StatusTag } from './parts.js';

export interface OpenRun {
  readonly occurrence: Occurrence;
  readonly title: string;
  readonly targetLabel?: string;
}

const UNFINISHED = new Set(['pending', 'running', 'waiting']);

export function RunSheet({
  run,
  onClose,
}: {
  readonly run: OpenRun | undefined;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <Sheet
      open={run !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className='w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg'>
        {run ? <RunContent run={run} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function RunContent({ run }: { readonly run: OpenRun }): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const { occurrence } = run;
  const at = (iso: string | undefined) =>
    formatTime(iso, locale, new Date(), true);
  const planned = occurrence.scheduledAt ?? occurrence.startedAt;
  const reason = reasonText(t, occurrence.reason);
  const summary = summaryText(occurrence.resultSummary);
  const finished = !UNFINISHED.has(occurrence.status);
  const steps = [
    {
      key: 'started',
      label: t('run.started'),
      time: at(occurrence.startedAt),
      done: true,
    },
    ...(occurrence.acceptedAt || occurrence.status === 'waiting'
      ? [
          {
            key: 'accepted',
            label: t('run.accepted'),
            time: at(occurrence.acceptedAt),
            done: occurrence.acceptedAt !== undefined,
          },
        ]
      : []),
    {
      key: 'finished',
      label: t('run.finished'),
      time: finished ? at(occurrence.finishedAt) : t('run.notYet'),
      done: finished,
    },
  ];
  return (
    <>
      <SheetHeader className='border-b pr-12'>
        <SheetTitle>
          {t('run.title', { title: run.title, time: at(planned) })}
        </SheetTitle>
      </SheetHeader>
      <div className='space-y-5 px-4 pb-6'>
        <div className='flex flex-wrap items-center gap-2'>
          <StatusTag status={occurrence.status} />
          {reason ? (
            <span className='text-sm text-muted-foreground'>{reason}</span>
          ) : null}
        </div>
        <section>
          <h3 className='mb-2 text-sm font-medium'>{t('run.timeline')}</h3>
          <ol className='space-y-3'>
            {steps.map((step) => (
              <li key={step.key} className='flex gap-3'>
                <span
                  className={cn(
                    'mt-1.5 size-2.5 shrink-0 rounded-full',
                    step.done ? 'bg-emerald-600' : 'bg-muted-foreground/30',
                  )}
                />
                <div>
                  <div className='text-sm font-medium'>{step.label}</div>
                  <div className='text-xs text-muted-foreground'>
                    {step.time ?? t('page.none')}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <dl className='divide-y'>
          <Field label={t('run.executions')}>{occurrence.executionCount}</Field>
          <Field label={t('run.target')}>
            <span className='inline-flex flex-wrap items-center gap-1.5'>
              {run.targetLabel && run.targetLabel !== occurrence.target.type ? (
                <span>{run.targetLabel}</span>
              ) : null}
              <Code>{occurrence.target.type}</Code>
            </span>
          </Field>
          {occurrence.target.href || occurrence.target.reference ? (
            <Field label={t('run.related')}>
              {occurrence.target.href ? (
                <a
                  href={occurrence.target.href}
                  className='underline underline-offset-4'
                >
                  {occurrence.target.reference
                    ? `${occurrence.target.reference.type} #${occurrence.target.reference.id}`
                    : occurrence.target.href}
                </a>
              ) : (
                `${occurrence.target.reference!.type} #${occurrence.target.reference!.id}`
              )}
            </Field>
          ) : null}
          {occurrence.targetReceipt ? (
            <Field label={t('run.receipt')}>
              <Code>{JSON.stringify(occurrence.targetReceipt)}</Code>
            </Field>
          ) : null}
          {summary ? (
            <Field label={t('run.summary')}>
              <span className='break-words'>{summary}</span>
            </Field>
          ) : null}
        </dl>
        {occurrence.status === 'waiting' ? (
          <div className='flex gap-2 rounded-lg bg-sky-500/10 p-3 text-xs text-sky-900 dark:text-sky-200'>
            <InfoIcon className='mt-0.5 size-4 shrink-0' />
            <p>{t('run.waitingNote')}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
