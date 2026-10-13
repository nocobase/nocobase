/**
 * Personal tasks keep their owned/executing child scopes and full detail routes inside one following workspace.
 * The bare URL redirects to owned without discarding its query or fragment; view defaults belong to the shared tab.
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

import { IssueDraftProvider } from '../../follow-ups/drafts.js';
import { PersonalTaskWorkspace } from '../../follow-ups/workspace.js';
import { PhoneBar } from '../../layouts/components/phone-bar.js';

export default function MyIssuesPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const atRoot = useMatch('/my-issues') !== null;
  const viewer = useViewer();
  const canCreate = canCreateIssues(viewer);
  if (atRoot)
    return (
      <Navigate
        replace
        to={{ pathname: 'owned', search: location.search, hash: location.hash }}
      />
    );
  return (
    <IssueDraftProvider key={viewer?.userId ?? 'signed-out'}>
      <PageContainer className='flex h-full min-h-0 flex-col gap-4 space-y-0 max-md:p-4'>
        <PhoneBar>
          <h1 className='truncate font-heading text-xl font-semibold'>
            {t('issuesPage.myTitle')}
          </h1>
          <NewIssueButton absolute canCreate={canCreate} />
        </PhoneBar>
        <div className='max-md:hidden'>
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
        </div>
        <RouteTabs
          keepHash
          label={t('issuesPage.myTabsLabel')}
          tabs={[
            { path: 'owned', label: t('issuesPage.myTabs.owned') },
            { path: 'executing', label: t('issuesPage.myTabs.executing') },
          ]}
        />
        <div className='min-h-0 flex-1'>
          <PersonalTaskWorkspace>
            <Outlet />
          </PersonalTaskWorkspace>
        </div>
      </PageContainer>
    </IssueDraftProvider>
  );
}
