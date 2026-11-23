/**
 * The Tasks tab: what needs attention, four totals, filters by state and a search, and every Schedule with its rule,
 * next and last run, totals, state and switch. A row opens the Schedule's detail.
 */
import { useLocale } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { CalendarClockIcon, SearchIcon, TriangleAlertIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty.js';
import { Input } from '../../components/ui/input.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import type { Schedule } from '../../lib/api.js';
import { useCronDescriber } from '../../lib/cron.js';
import {
  describeCron,
  formatFullTime,
  formatTime,
  isCommonCron,
} from '../../lib/format.js';
import {
  attentionOf,
  scheduleState,
  type Attention,
} from '../../lib/schedule-state.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { Code, Notes, Rich, StateTag, StatusTag } from './parts.js';
import { ScheduleSwitch } from './schedule-switch.js';

const FILTERS = ['all', 'running', 'attention', 'paused', 'removed'] as const;
type Filter = (typeof FILTERS)[number];

export interface TasksTabProps {
  readonly schedules: readonly Schedule[];
  readonly now: number;
  readonly canManage: boolean;
  readonly onOpen: (id: string) => void;
  readonly onChanged: (schedule: Schedule) => void;
}

export function TasksTab({
  schedules,
  now,
  canManage,
  onOpen,
  onChanged,
}: TasksTabProps): ReactElement {
  const { t } = useSchedulerTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const attention = useMemo(
    () =>
      schedules
        .map((schedule) => attentionOf(schedule, now))
        .filter((item): item is Attention => item !== undefined),
    [schedules, now],
  );
  const needing = useMemo(
    () => new Set(attention.map((item) => item.schedule.id)),
    [attention],
  );
  const matches = (schedule: Schedule, which: Filter): boolean => {
    const state = scheduleState(schedule);
    switch (which) {
      case 'all':
        return true;
      case 'attention':
        return needing.has(schedule.id);
      case 'running':
        return state === 'running';
      case 'paused':
        return state === 'paused';
      case 'removed':
        return state === 'removed';
    }
  };
  if (schedules.length === 0) return <EmptySchedules />;
  const query = search.trim().toLowerCase();
  const shown = schedules.filter(
    (schedule) =>
      matches(schedule, filter) &&
      (!query ||
        schedule.title.toLowerCase().includes(query) ||
        schedule.key.toLowerCase().includes(query)),
  );
  const running = schedules.filter((item) => scheduleState(item) === 'running');
  const next = running
    .filter((item) => item.nextRunAt !== undefined)
    .sort((a, b) => Date.parse(a.nextRunAt!) - Date.parse(b.nextRunAt!))[0];
  return (
    <div className='space-y-4'>
      {attention.length > 0 ? <AttentionAlert items={attention} /> : null}
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Stat value={String(schedules.length)} label={t('tasks.stats.total')} />
        <Stat value={String(running.length)} label={t('tasks.stats.running')} />
        <Stat
          value={String(attention.length)}
          label={t('tasks.stats.attention')}
          danger={attention.length > 0}
        />
        <NextRun schedule={next} now={now} />
      </div>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-wrap gap-2' role='group'>
          {FILTERS.map((which) => {
            const count = schedules.filter((item) =>
              matches(item, which),
            ).length;
            if (which !== 'all' && count === 0) return null;
            return (
              <Chip
                key={which}
                active={filter === which}
                onClick={() => setFilter(which)}
              >
                {t(`tasks.filters.${which}`)} {count}
              </Chip>
            );
          })}
        </div>
        <div className='relative md:w-64'>
          <SearchIcon className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('tasks.filters.search')}
            aria-label={t('tasks.filters.search')}
            className='pl-8'
          />
        </div>
      </div>
      {shown.length === 0 ? (
        <p className='rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground'>
          {t('tasks.noMatch')}
        </p>
      ) : (
        <ScheduleList
          schedules={shown}
          now={now}
          canManage={canManage}
          onOpen={onOpen}
          onChanged={onChanged}
        />
      )}
      {canManage ? null : (
        <p className='text-xs text-muted-foreground'>{t('tasks.readOnly')}</p>
      )}
      <Notes
        items={[
          t('tasks.notes.running'),
          t('tasks.notes.pause'),
          t('tasks.notes.removed'),
          t('tasks.notes.internal'),
        ]}
      />
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): ReactElement {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-7 rounded-full border px-3 text-xs transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Stat({
  value,
  label,
  danger = false,
}: {
  readonly value: string;
  readonly label: string;
  readonly danger?: boolean;
}): ReactElement {
  return (
    <div className='rounded-xl border bg-card px-4 py-3'>
      <div
        className={cn(
          'text-2xl font-semibold tabular-nums',
          danger && 'text-destructive',
        )}
      >
        {value}
      </div>
      <div className='mt-1 truncate text-xs text-muted-foreground'>{label}</div>
    </div>
  );
}

function NextRun({
  schedule,
  now,
}: {
  readonly schedule: Schedule | undefined;
  readonly now: number;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  return (
    <Stat
      value={
        formatTime(schedule?.nextRunAt, locale, new Date(now)) ?? t('page.none')
      }
      label={
        schedule
          ? t('tasks.stats.nextOf', { title: schedule.title })
          : t('tasks.stats.next')
      }
    />
  );
}

function AttentionAlert({
  items,
}: {
  readonly items: readonly Attention[];
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  return (
    <Alert className='border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200'>
      <TriangleAlertIcon />
      <AlertTitle>
        {t('tasks.attention.title', { count: items.length })}
      </AlertTitle>
      <AlertDescription className='text-amber-900/90 dark:text-amber-200/90'>
        <ul className='space-y-0.5'>
          {items.map(({ kind, schedule }) => (
            <li key={schedule.id}>
              <Rich
                text={
                  kind === 'target'
                    ? t('tasks.attention.target', {
                        title: schedule.title,
                        target: `\`${schedule.targetType}\``,
                        state: t(`targetState.${schedule.targetState}`),
                      })
                    : kind === 'waiting'
                      ? t('tasks.attention.waiting', {
                          title: schedule.title,
                          time: formatTime(schedule.lastRunAt, locale),
                        })
                      : t('tasks.attention.failed', {
                          title: schedule.title,
                          status: t(`status.${schedule.lastRun?.status}`),
                        })
                }
              />
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

function EmptySchedules(): ReactElement {
  const { t } = useSchedulerTranslation();
  return (
    <Empty className='border'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <CalendarClockIcon />
        </EmptyMedia>
        <EmptyTitle>{t('empty.title')}</EmptyTitle>
        <EmptyDescription>
          <Rich text={t('empty.description')} />
        </EmptyDescription>
        <EmptyDescription className='text-xs'>
          {t('empty.internal')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** The rule as a sentence, then the cron expression and its time zone. */
export function Rule({
  schedule,
}: {
  readonly schedule: Pick<Schedule, 'cron' | 'timezone'>;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const describer = useCronDescriber(!isCommonCron(schedule.cron));
  const sentence = describeCron(schedule.cron, t, locale, describer);
  return (
    <div className='min-w-0'>
      {sentence === schedule.cron ? null : <div>{sentence}</div>}
      <div className='mt-0.5 text-xs text-muted-foreground'>
        <Code>{schedule.cron}</Code> · {schedule.timezone}
      </div>
    </div>
  );
}

function LastRun({
  schedule,
  now,
}: {
  readonly schedule: Schedule;
  readonly now: number;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const when = formatTime(schedule.lastRunAt, locale, new Date(now));
  if (!when)
    return <span className='text-muted-foreground'>{t('page.none')}</span>;
  return (
    <span
      className='inline-flex flex-wrap items-center gap-1.5'
      title={formatFullTime(schedule.lastRunAt, locale)}
    >
      {when}
      {schedule.lastRun ? <StatusTag status={schedule.lastRun.status} /> : null}
    </span>
  );
}

function Totals({ schedule }: { readonly schedule: Schedule }): ReactElement {
  const { t } = useSchedulerTranslation();
  return (
    <span className='text-xs text-muted-foreground'>
      {t('tasks.totals', {
        runs: schedule.runCount,
        succeeded: schedule.completedCount,
      })}
    </span>
  );
}

function ScheduleList({
  schedules,
  now,
  canManage,
  onOpen,
  onChanged,
}: Omit<TasksTabProps, 'schedules'> & {
  readonly schedules: readonly Schedule[];
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const next = (schedule: Schedule) =>
    scheduleState(schedule) === 'removed' || !schedule.enabled
      ? undefined
      : formatTime(schedule.nextRunAt, locale, new Date(now));
  return (
    <>
      <div className='hidden overflow-hidden rounded-xl border md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='pl-4'>{t('tasks.columns.task')}</TableHead>
              <TableHead>{t('tasks.columns.rule')}</TableHead>
              <TableHead>{t('tasks.columns.next')}</TableHead>
              <TableHead>{t('tasks.columns.last')}</TableHead>
              <TableHead>{t('tasks.columns.totals')}</TableHead>
              <TableHead>{t('tasks.columns.state')}</TableHead>
              {canManage ? (
                <TableHead className='pr-4'>
                  {t('tasks.columns.enabled')}
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow
                key={schedule.id}
                className='cursor-pointer'
                onClick={() => onOpen(schedule.id)}
              >
                <TableCell className='pl-4 whitespace-normal'>
                  <TaskName schedule={schedule} />
                </TableCell>
                <TableCell className='whitespace-normal'>
                  <Rule schedule={schedule} />
                </TableCell>
                <TableCell>{next(schedule) ?? t('page.none')}</TableCell>
                <TableCell>
                  <LastRun schedule={schedule} now={now} />
                </TableCell>
                <TableCell>
                  <Totals schedule={schedule} />
                </TableCell>
                <TableCell>
                  <StateTag schedule={schedule} />
                </TableCell>
                {canManage ? (
                  <TableCell
                    className='pr-4'
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ScheduleSwitch schedule={schedule} onChanged={onChanged} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className='space-y-3 md:hidden'>
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className='cursor-pointer rounded-xl border bg-card p-4'
            onClick={() => onOpen(schedule.id)}
          >
            <div className='flex items-start justify-between gap-3'>
              <TaskName schedule={schedule} />
              {canManage ? (
                <div onClick={(event) => event.stopPropagation()}>
                  <ScheduleSwitch schedule={schedule} onChanged={onChanged} />
                </div>
              ) : null}
            </div>
            <div className='mt-3 text-sm'>
              <Rule schedule={schedule} />
            </div>
            <dl className='mt-3 grid grid-cols-2 gap-2 text-sm'>
              <div>
                <dt className='text-xs text-muted-foreground'>
                  {t('tasks.columns.next')}
                </dt>
                <dd>{next(schedule) ?? t('page.none')}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>
                  {t('tasks.columns.last')}
                </dt>
                <dd>
                  <LastRun schedule={schedule} now={now} />
                </dd>
              </div>
            </dl>
            <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
              <StateTag schedule={schedule} />
              <Totals schedule={schedule} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function TaskName({ schedule }: { readonly schedule: Schedule }): ReactElement {
  return (
    <div className='min-w-0'>
      <div className='font-medium'>{schedule.title}</div>
      <Code className='mt-0.5 inline-block'>{schedule.key}</Code>
    </div>
  );
}
