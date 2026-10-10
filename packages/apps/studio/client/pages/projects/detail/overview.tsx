import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { ProjectOverview } from '../../../projects/detail/overview.js';

/** Tab `/projects/:projectId/overview`, hosting the New issue dialog (`new-issue`). */
export default function ProjectOverviewTab(): ReactElement {
  return (
    <>
      <ProjectOverview />
      <Outlet />
    </>
  );
}
