/**
 * The Runs tab: the runs of every Schedule, newest planned time first, filtered by Schedule, result and time range
 * (the last 30 days by default), page by page. Schedules removed from code keep their history here. A row opens the
 * run's sheet.
 */
import { useMemo, useState, type ReactElement } from 'react';

import {
  usePagedOccurrences,
  useSchedulerApi,
  type Occurrence,
  type Schedule,
} from '../../lib/api.js';
import { RESULT_GROUPS, type ResultGroup } from '../../lib/schedule-state.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { OccurrenceList } from './occurrence-list.js';
import { LoadError, Notes } from './parts.js';
import { Chip } from './tasks-tab.js';

const RANGES = { day: 1, week: 7, month: 30, quarter: 90 } as const;
type Range = keyof typeof RANGES;
const DAY_MS = 24 * 60 * 60 * 1000;

const SELECT =
  'h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

export function RunsTab({
  schedules,
  now,
  onOpen,
}: {
  readonly schedules: readonly Schedule[];
  readonly now: number;
  readonly onOpen: (occurrence: Occurrence) => void;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const api = useSchedulerApi();
  const [scheduleId, setScheduleId] = useState('');
  const [group, setGroup] = useState<ResultGroup>('all');
  // The range starts when it is chosen, so paging does not shift it as time passes.
  const [range, setRange] = useState<{ name: Range; from: string }>(() => ({
    name: 'month',
    from: new Date(Date.now() - RANGES.month * DAY_MS).toISOString(),
  }));
  const titles = useMemo(
    () => new Map(schedules.map((schedule) => [schedule.id, schedule.title])),
    [schedules],
  );
  const filters = {
    ...(scheduleId ? { scheduleId } : {}),
    statuses: RESULT_GROUPS[group],
    from: range.from,
  };
  const runs = usePagedOccurrences(
    (pageToken) => api.listOccurrences(filters, pageToken),
    JSON.stringify(filters),
  );
  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <select
            className={SELECT}
            value={scheduleId}
            aria-label={t('runs.columns.task')}
            onChange={(event) => setScheduleId(event.target.value)}
          >
            <option value=''>{t('runs.allTasks')}</option>
            {schedules.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.title}
              </option>
            ))}
          </select>
          {(Object.keys(RESULT_GROUPS) as ResultGroup[]).map((name) => (
            <Chip
              key={name}
              active={group === name}
              onClick={() => setGroup(name)}
            >
              {t(`runs.groups.${name}`)}
            </Chip>
          ))}
        </div>
        <select
          className={SELECT}
          value={range.name}
          aria-label={t('runs.columns.planned')}
          onChange={(event) => {
            const name = event.target.value as Range;
            setRange({
              name,
              from: new Date(Date.now() - RANGES[name] * DAY_MS).toISOString(),
            });
          }}
        >
          {(Object.keys(RANGES) as Range[]).map((name) => (
            <option key={name} value={name}>
              {t(`runs.ranges.${name}`)}
            </option>
          ))}
        </select>
      </div>
      {runs.error ? (
        <LoadError
          title={t('page.loadFailed')}
          error={runs.error}
          onRetry={runs.reload}
        />
      ) : null}
      <OccurrenceList
        items={runs.items}
        loading={runs.loading}
        hasMore={runs.hasMore}
        onMore={runs.more}
        onOpen={onOpen}
        now={now}
        emptyText={t('runs.noRuns')}
        titleOf={(occurrence) =>
          titles.get(occurrence.scheduleId) ?? occurrence.scheduleId
        }
      />
      <Notes items={[t('runs.notes.order'), t('runs.notes.removed')]} />
    </div>
  );
}
