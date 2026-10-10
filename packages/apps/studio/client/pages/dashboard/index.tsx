/**
 * Route `/dashboard`, behind the `reports` page grant, which the reports API checks too. A lead's dashboard (UI
 * guidelines T5), answering three questions over the period chosen in the header (7, 30 or 90 days, each against the
 * period before), top to bottom:
 *
 * - How delivery goes (`headline.tsx`): issues completed, median cycle time, the share completed by agents, the cost
 *   per completed issue.
 * - How the agents perform (`agents.tsx`): run success, rework, runs per issue, human intervention, queue wait, and the
 *   runs each day by outcome.
 * - What is stuck (`attention.tsx`), now rather than over the period: blocked and overdue issues, pull requests waiting
 *   for review, runs that just failed.
 * - By project (`projects.tsx`): progress and delivery of each project the viewer may see.
 *
 * Personal to-dos (decisions, reviews, runtimes) belong to the home page, the inbox and the runtimes page, not here.
 * Nothing on the page updates on its own, so the header's Refresh reads it all again.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RefreshButton } from '@/components/refresh-button';
import { useRefreshQueries } from '@/components/use-refresh-queries';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import {
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from '../../../shared/reports.js';
import { AgentPerformance } from './agents.js';
import { dashboardKeys, useDashboardApi } from './api.js';
import { NeedsAttention } from './attention.js';
import { HeadlineFigures } from './headline.js';
import { ByProject } from './projects.js';

export default function DashboardPage(): ReactElement {
  const { t } = useTranslation();
  const [days, setDays] = useState<DashboardPeriod>(30);
  const api = useDashboardApi();
  const report = useQuery({
    queryKey: dashboardKeys.report(days),
    queryFn: () => api.report(days),
    placeholderData: keepPreviousData,
  });
  const attention = useQuery({
    queryKey: dashboardKeys.attention,
    queryFn: () => api.attention(),
  });
  const refresh = useRefreshQueries([dashboardKeys.all]);
  return (
    <PageContainer>
      <PageHeader
        title={t('navigation.dashboard')}
        description={t('dashboard.description')}
        actions={
          <>
            <ToggleGroup
              aria-label={t('dashboard.period')}
              size='sm'
              variant='outline'
              value={[String(days)]}
              onValueChange={(value: readonly string[]) => {
                const next = Number(value[0]);
                if ((DASHBOARD_PERIODS as readonly number[]).includes(next))
                  setDays(next as DashboardPeriod);
              }}
            >
              {DASHBOARD_PERIODS.map((period) => (
                <ToggleGroupItem
                  key={period}
                  value={String(period)}
                  className='px-2.5 text-xs'
                >
                  {t('dashboard.days', { count: period })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <RefreshButton onRefresh={refresh} />
          </>
        }
      />
      <div className='flex flex-col gap-8'>
        <HeadlineFigures report={report} />
        <AgentPerformance report={report} />
        <NeedsAttention attention={attention} />
        <ByProject report={report} />
      </div>
    </PageContainer>
  );
}
