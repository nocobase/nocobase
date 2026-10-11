import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { ProjectReleases } from '../../../projects/detail/releases.js';

/** Tab `/projects/:projectId/releases`, hosting the New issue dialog (`new-issue`). */
export default function ProjectReleasesTab(): ReactElement {
  return (
    <>
      <ProjectReleases />
      <Outlet />
    </>
  );
}
