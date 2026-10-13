import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { ProjectSettings } from '../../../projects/settings/page.js';

/** Tab `/projects/:projectId/settings` (`?section=…&repo=…`), hosting the New issue dialog (`new-issue`). */
export default function ProjectSettingsTab(): ReactElement {
  return (
    <>
      <ProjectSettings />
      <Outlet />
    </>
  );
}
