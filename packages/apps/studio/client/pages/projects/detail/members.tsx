import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { ProjectMembers } from '../../../projects/detail/members.js';

/** Tab `/projects/:projectId/members`, hosting the New issue dialog (`new-issue`). */
export default function ProjectMembersTab(): ReactElement {
  return (
    <>
      <ProjectMembers />
      <Outlet />
    </>
  );
}
