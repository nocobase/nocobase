import type { ReactElement } from 'react';
import { useLocation } from 'react-router';

import { IssueParentOutlet } from '../../../issues/detail/issue-parent-outlet.js';
import { useReturnLocations } from '../../../layouts/return-locations.js';
import { useProjectPage } from '../../../projects/detail/context.js';
import { useProjectPageWording } from '../../../projects/detail/labels.js';
import { ProjectIssues } from '../../../projects/detail/issues.js';

/**
 * Tab `/projects/:projectId/issues`, hosting the New issue dialog (`new-issue`) and the issue opened from the tab
 * (`:issueId`), whose trail starts with the project's: `Projects › <project>`, the project leading back to this tab as
 * it was left.
 */
export default function ProjectIssuesTab(): ReactElement {
  const { project } = useProjectPage();
  const { t } = useProjectPageWording();
  const { projectsList } = useReturnLocations();
  const { search } = useLocation();
  const path = `/projects/${encodeURIComponent(project.id)}/issues`;
  return (
    <>
      <ProjectIssues />
      <IssueParentOutlet
        parent={{
          levels: [
            { label: t('projects.title'), to: projectsList },
            { label: project.name, to: { pathname: path, search } },
          ],
          path,
          search,
        }}
      />
    </>
  );
}
