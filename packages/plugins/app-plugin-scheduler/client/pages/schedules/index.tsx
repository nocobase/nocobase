/**
 * Route `/settings/automation/schedules`: the Schedules plugins and the application define in code. Three tabs, kept
 * in `?tab=`: Tasks (`tasks-tab.tsx`), Runs (`runs-tab.tsx`) and Configuration (`config-tab.tsx`). `?schedule=<id>`
 * opens one Schedule's detail in place of the tabs; a run opens in a side sheet over either.
 *
 * The route stands behind `scheduler.schedules` read. The switch that pauses and resumes appears only for who also
 * has `manage`; the API checks both again.
 */
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useState, type ReactElement } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs.js';
import {
  useLoad,
  useSchedulerApi,
  type Occurrence,
  type Schedule,
} from '../../lib/api.js';
import { SCHEDULER_SETTINGS } from '../../routes.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { ConfigTab } from './config-tab.js';
import { LoadError } from './parts.js';
import { RunSheet, type OpenRun } from './run-sheet.js';
import { RunsTab } from './runs-tab.js';
import { ScheduleDetail } from './schedule-detail.js';
import { TasksTab } from './tasks-tab.js';
import { useNow } from './use-now.js';
import { useSearchParam } from './use-search-param.js';

const TABS = ['tasks', 'runs', 'config'] as const;
type Tab = (typeof TABS)[number];

export default function SchedulesPage(): ReactElement {
  const { t } = useSchedulerTranslation();
  const api = useSchedulerApi();
  const now = useNow();
  const [tabParam, setTab] = useSearchParam('tab');
  const tab: Tab = TABS.find((item) => item === tabParam) ?? 'tasks';
  const [scheduleId, setScheduleId] = useSearchParam('schedule');
  const [run, setRun] = useState<OpenRun>();
  const canManage = useCan({
    resource: { type: 'settings', id: SCHEDULER_SETTINGS },
    action: 'manage',
  }).can;
  const list = useLoad(() => api.listSchedules(), 'schedules');
  const schedules = list.data?.schedules ?? [];
  const openRun = (occurrence: Occurrence, schedule?: Schedule) => {
    const owner =
      schedule ?? schedules.find((item) => item.id === occurrence.scheduleId);
    setRun({
      occurrence,
      title: owner?.title ?? occurrence.scheduleId,
      ...(owner ? { targetLabel: owner.targetSummary.targetLabel } : {}),
    });
  };
  return (
    <section className='w-full space-y-6 p-4 sm:p-6 md:p-8'>
      <header>
        <h1 className='font-heading text-2xl font-semibold tracking-tight'>
          {t('page.title')}
        </h1>
        <p className='mt-1.5 max-w-3xl text-sm text-muted-foreground'>
          {t('page.description')}
        </p>
      </header>
      {list.error && !list.data ? (
        <LoadError
          title={t('page.loadFailed')}
          error={list.error}
          onRetry={list.reload}
        />
      ) : scheduleId ? (
        <ScheduleDetail
          id={scheduleId}
          now={now}
          canManage={canManage}
          onBack={() => setScheduleId(undefined)}
          onOpenRun={openRun}
          onChanged={list.reload}
        />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value: Tab) =>
            setTab(value === 'tasks' ? undefined : value, true)
          }
        >
          <TabsList variant='line' className='w-full justify-start border-b'>
            <TabsTrigger value='tasks' className='flex-none'>
              {t('page.tabs.tasks')}
              {list.data ? (
                <span className='text-xs text-muted-foreground'>
                  {schedules.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value='runs' className='flex-none'>
              {t('page.tabs.runs')}
            </TabsTrigger>
            <TabsTrigger value='config' className='flex-none'>
              {t('page.tabs.config')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='tasks' className='pt-4'>
            {list.data ? (
              <TasksTab
                schedules={schedules}
                now={now}
                canManage={canManage}
                onOpen={(id) => setScheduleId(id)}
                onChanged={list.reload}
              />
            ) : (
              <p className='text-sm text-muted-foreground'>…</p>
            )}
          </TabsContent>
          <TabsContent value='runs' className='pt-4'>
            {tab === 'runs' ? (
              <RunsTab
                schedules={schedules}
                now={now}
                onOpen={(occurrence) => openRun(occurrence)}
              />
            ) : null}
          </TabsContent>
          <TabsContent value='config' className='pt-4'>
            {list.data ? <ConfigTab jobs={list.data.jobs} /> : null}
          </TabsContent>
        </Tabs>
      )}
      <RunSheet run={run} onClose={() => setRun(undefined)} />
    </section>
  );
}
