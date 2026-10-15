/**
 * One tab of `/my-issues`: the issues view with the viewer fixed as owner or executor (`myIssueFilters`); that filter
 * is hidden from the toolbar, the others stay in the query string. The split view is the default here, and its follow
 * group holds every task the viewer follows, whoever owns or executes it. An issue opens over the tab
 * (`/my-issues/<tab>/:issueId`), its trail starting with `My issues`, which leads back to the tab as it was left.
 */
import {
  myIssueFilters,
  canCreateIssues,
  type MyIssuesRole,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmListSkeleton,
  NewIssueButton,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';

import { IssueParentOutlet } from '../../issues/detail/issue-parent-outlet.js';
import { IssuesView } from '../../issues/issues-view.js';
import { MyIssuesRoleTabs } from './role-tabs.js';
import { STUDIO_ISSUE_VIEWS } from '../../issues/views.js';

export function MyIssuesTab({
  role,
}: {
  readonly role: MyIssuesRole;
}): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const { search } = useLocation();
  const path = `/my-issues/${role}`;
  const filters = viewer ? myIssueFilters(role, viewer.userId) : null;
  return (
    <>
      {filters ? (
        <IssuesView
          fixedFilters={filters.fixedFilters}
          hiddenFilters={filters.hiddenFilters}
          viewKey='my-issues'
          views={STUDIO_ISSUE_VIEWS}
          defaultView='split'
          mineToggle={false}
          follow='all'
          toolbarStart={<MyIssuesRoleTabs />}
          empty={{
            title: t(`issuesPage.myEmpty.${role}`),
            description: t('issuesPage.emptyDescription'),
            action: (
              <NewIssueButton absolute canCreate={canCreateIssues(viewer)} />
            ),
          }}
        />
      ) : (
        <PmListSkeleton />
      )}
      <IssueParentOutlet
        parent={{
          levels: [
            { label: t('navigation.myIssues'), to: { pathname: path, search } },
          ],
          path,
          search,
        }}
      />
    </>
  );
}
