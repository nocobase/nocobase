/**
 * Route `/my-issues`: the issues the viewer owns or executes, with tabs that are child routes — `owned` (owner = me)
 * and `executing` (executor = me). The bare URL redirects to `owned`, keeping the query string. The list is the
 * default view here, since people execute most of these issues; the Agent queue and the board are a switch away.
 */
import { canCreateIssues } from '@nocobase/app-plugin-projects/client/issues';
import {
  NewIssueButton,
  PmShortcuts,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Navigate, Outlet, useLocation, useMatch } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteTabs } from '@/components/route-tabs';

export default function MyIssuesPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const atRoot = useMatch('/my-issues') !== null;
  const canCreate = canCreateIssues(useViewer());
  if (atRoot)
    return (
      <Navigate replace to={{ pathname: 'owned', search: location.search }} />
    );
  return (
    <PageContainer className='flex h-full min-h-0 flex-col gap-6 space-y-0'>
      <PageHeader
        title={t('issuesPage.myTitle')}
        description={t('issuesPage.myDescription')}
        actions={
          <>
            <PmShortcuts showTrigger canCreate={canCreate} />
            <NewIssueButton absolute canCreate={canCreate} />
          </>
        }
      />
      <RouteTabs
        label={t('issuesPage.myTabsLabel')}
        tabs={[
          { path: 'owned', label: t('issuesPage.myTabs.owned') },
          { path: 'executing', label: t('issuesPage.myTabs.executing') },
        ]}
      />
      <div className='min-h-0 flex-1'>
        <Outlet />
      </div>
    </PageContainer>
  );
}
