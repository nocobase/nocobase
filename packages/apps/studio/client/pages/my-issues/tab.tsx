/**
 * One tab of `/my-issues`: the issues view with the viewer fixed as owner or executor (`myIssueFilters`); that filter
 * is hidden from the toolbar, the others stay in the query string. An issue opens over the tab
 * (`/my-issues/<tab>/:issueId`), its trail starting with `My issues`, which leads back to the tab as it was left.
 */
import {
  myIssueFilters,
  type MyIssuesRole,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmListSkeleton,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';

import { IssueParentOutlet } from '../../issues/detail/issue-parent-outlet.js';
import { IssuesView } from '../../issues/issues-view.js';

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
          views={['board', 'list', 'agent']}
          defaultView='board'
          mineToggle={false}
          empty={{
            title: t(`issuesPage.myEmpty.${role}`),
            description: t('issuesPage.emptyDescription'),
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
