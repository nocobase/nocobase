import {
  myIssueFilters,
  canCreateIssues,
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
import { STUDIO_ISSUE_VIEWS } from '../../issues/views.js';

export function MyIssuesList(): ReactElement {
  const { t } = useTranslation();
  const viewer = useViewer();
  const { search } = useLocation();
  const path = '/my-issues';
  const filters = viewer ? myIssueFilters(viewer.userId) : null;
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
          empty={{
            title: t('issuesPage.myEmpty'),
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
