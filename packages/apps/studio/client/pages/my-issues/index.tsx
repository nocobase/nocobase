/**
 * Route `/my-issues`: the issues the viewer owns or executes, with tabs that are child routes — `owned` (owner = me)
 * and `executing` (executor = me), drawn at the start of each tab's toolbar (`role-tabs.tsx`) so the tasks get the
 * height. The bare URL redirects to `owned`, keeping the query string. The split view is the default here.
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
import {
  TableCreateStateContext,
  useTableCreateState,
} from '../../issues/table-create-state.js';

export default function MyIssuesPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const atRoot = useMatch('/my-issues') !== null;
  const canCreate = canCreateIssues(useViewer());
  const createState = useTableCreateState();
  if (atRoot)
    return (
      <Navigate
        replace
        to={{ pathname: 'owned', search: location.search, hash: location.hash }}
      />
    );
  return (
    <TableCreateStateContext.Provider value={createState.report}>
      <PageContainer className='flex h-full min-h-0 flex-col gap-4 space-y-0'>
        <PageHeader
          title={t('issuesPage.myTitle')}
          description={t('issuesPage.myDescription')}
          actions={
            <>
              {/* ⌘K still opens the search; the toolbar's box searches the list. */}
              <PmShortcuts canCreate={canCreate} />
              {createState.visible ? (
                <NewIssueButton absolute canCreate={canCreate} />
              ) : null}
            </>
          }
        />
        <div className='min-h-0 flex-1'>
          <Outlet />
        </div>
      </PageContainer>
    </TableCreateStateContext.Provider>
  );
}
