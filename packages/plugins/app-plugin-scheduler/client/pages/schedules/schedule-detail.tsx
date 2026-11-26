/**
 * One Schedule: its key, rule, next three runs, window and run limit, target and its state, totals, where it is defined,
 * and its runs page by page. Its rule lives in code, so nothing here changes it; who may manage Schedules can pause
 * or resume it.
 */
import { useLocale } from '@nocobase/i18n/client';
import { ArrowLeftIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '../../components/ui/button.js';
import {
  useLoad,
  usePagedOccurrences,
  useSchedulerApi,
  type Occurrence,
  type Schedule,
  type ScheduleDetail as Detail,
} from '../../lib/api.js';
import { formatFullTime } from '../../lib/format.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { OccurrenceList } from './occurrence-list.js';
import { Code, Field, LoadError, Rich, StateTag, Tag } from './parts.js';
import { ScheduleSwitch } from './schedule-switch.js';
import { Rule } from './tasks-tab.js';

export interface ScheduleDetailProps {
  readonly id: string;
  readonly now: number;
  readonly canManage: boolean;
  readonly onBack: () => void;
  readonly onOpenRun: (occurrence: Occurrence, schedule: Schedule) => void;
  readonly onChanged: (schedule: Schedule) => void;
}

export function ScheduleDetail({
  id,
  now,
  canManage,
  onBack,
  onOpenRun,
  onChanged,
}: ScheduleDetailProps): ReactElement {
  const { t } = useSchedulerTranslation();
  const api = useSchedulerApi();
  const detail = useLoad(() => api.getSchedule(id), id);
  const runs = usePagedOccurrences(
    (pageToken) => api.listScheduleOccurrences(id, pageToken),
    id,
  );
  const back = (
    <Button variant='ghost' size='sm' className='-ml-2' onClick={onBack}>
      <ArrowLeftIcon />
      {t('detail.back')}
    </Button>
  );
  if (detail.error && !detail.data)
    return (
      <div className='space-y-4'>
        {back}
        <LoadError
          title={t('detail.notFound')}
          error={detail.error}
          onRetry={detail.reload}
        />
      </div>
    );
  const schedule = detail.data;
  if (!schedule)
    return (
      <div className='space-y-4'>
        {back}
        <p className='text-sm text-muted-foreground'>…</p>
      </div>
    );
  return (
    <div className='space-y-6'>
      <div className='space-y-3'>
        {back}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0 space-y-1'>
            <h2 className='text-xl font-semibold'>{schedule.title}</h2>
            {schedule.description ? (
              <p className='text-sm text-muted-foreground'>
                {schedule.description}
              </p>
            ) : null}
            <StateTag schedule={schedule} />
          </div>
          {canManage ? (
            <ScheduleSwitch
              schedule={schedule}
              onChanged={(changed) => {
                onChanged(changed);
                detail.reload();
              }}
            />
          ) : null}
        </div>
      </div>
      <Facts schedule={schedule} />
      <section className='space-y-3'>
        <h3 className='text-base font-semibold'>{t('detail.runs')}</h3>
        <OccurrenceList
          items={runs.items}
          loading={runs.loading}
          hasMore={runs.hasMore}
          onMore={runs.more}
          onOpen={(occurrence) => onOpenRun(occurrence, schedule)}
          now={now}
          emptyText={t('detail.noRuns')}
        />
        {runs.error ? (
          <LoadError
            title={t('page.loadFailed')}
            error={runs.error}
            onRetry={runs.reload}
          />
        ) : null}
        <p className='text-xs text-muted-foreground'>{t('detail.runsNote')}</p>
      </section>
    </div>
  );
}

function Facts({ schedule }: { readonly schedule: Detail }): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const window = [
    schedule.from
      ? t('detail.windowFrom', { time: formatFullTime(schedule.from, locale) })
      : undefined,
    schedule.to
      ? t('detail.windowTo', { time: formatFullTime(schedule.to, locale) })
      : undefined,
    schedule.limit !== undefined
      ? t('detail.limit', { count: schedule.limit })
      : undefined,
  ].filter(Boolean);
  return (
    <dl className='divide-y rounded-xl border px-4'>
      <Field label={t('detail.key')}>
        <Code>{schedule.key}</Code>
      </Field>
      <Field label={t('detail.rule')}>
        <Rule schedule={schedule} />
      </Field>
      <Field label={t('detail.upcoming')}>
        {schedule.upcomingRuns.length > 0 ? (
          <ul className='space-y-0.5'>
            {schedule.upcomingRuns.map((run) => (
              <li key={run}>{formatFullTime(run, locale)}</li>
            ))}
          </ul>
        ) : (
          <span className='text-muted-foreground'>
            {t('detail.noUpcoming')}
          </span>
        )}
      </Field>
      <Field label={t('detail.window')}>
        {window.length > 0 ? window.join(' · ') : t('detail.unlimited')}
      </Field>
      <Field label={t('detail.target')}>
        <span className='inline-flex flex-wrap items-center gap-1.5'>
          {schedule.targetSummary.href ? (
            <a
              href={schedule.targetSummary.href}
              className='underline underline-offset-4'
            >
              {schedule.targetSummary.targetLabel}
            </a>
          ) : (
            <span>{schedule.targetSummary.targetLabel}</span>
          )}
          <Code>{schedule.targetType}</Code>
          <Tag tone={schedule.targetState === 'ready' ? 'success' : 'danger'}>
            {t(`targetState.${schedule.targetState}`)}
          </Tag>
        </span>
        {schedule.targetSummary.description ? (
          <p className='mt-1 text-xs text-muted-foreground'>
            {schedule.targetSummary.description}
          </p>
        ) : null}
      </Field>
      <Field label={t('detail.totals')}>
        {t('tasks.totals', {
          runs: schedule.runCount,
          succeeded: schedule.completedCount,
        })}
      </Field>
      <Field label={t('detail.source')}>
        <Rich text={t('detail.sourceCode')} />
      </Field>
    </dl>
  );
}
