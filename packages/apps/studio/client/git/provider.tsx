/**
 * Studio's pull requests in the projects plugin's statuses, added to the events the slot already holds: the
 * `studio.merged` event's title. The issue page's Pull requests section, the pull request mark on issues and a working
 * directory's GitHub settings are Studio's own pages' (`pages/issues`, `pages/projects`).
 */
import { StatusEventsContext } from '@nocobase/app-plugin-projects/client/kit';
import { useContext, useMemo, type ReactElement, type ReactNode } from 'react';

import { GIT_STATUS_EVENTS } from './workflow.js';

export function StudioGitContributions({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const outer = useContext(StatusEventsContext);
  const events = useMemo(() => [...outer, ...GIT_STATUS_EVENTS], [outer]);
  return (
    <StatusEventsContext.Provider value={events}>
      {children}
    </StatusEventsContext.Provider>
  );
}
