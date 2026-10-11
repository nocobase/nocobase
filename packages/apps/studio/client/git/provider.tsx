/**
 * Studio's pull requests in the projects plugin's workflow editor, added to what the slots already hold (the agents'
 * rules, provided further out in `react-providers.ts`): the `studio.merged` event and `prMerged` condition. The issue
 * page's Pull requests section, the pull request mark on issues and a working directory's GitHub settings are Studio's
 * own pages' (`pages/issues`, `pages/projects`).
 */
import {
  StatusRuleTypesContext,
  WorkflowEventsContext,
} from '@nocobase/app-plugin-projects/client/kit';
import { useContext, useMemo, type ReactElement, type ReactNode } from 'react';

import { GIT_RULE_TYPES, GIT_WORKFLOW_EVENTS } from './workflow.js';

/** `outer` and then `own`, the same array while `outer` does not change. */
function useJoined<T>(outer: readonly T[], own: readonly T[]): readonly T[] {
  return useMemo(() => [...outer, ...own], [outer, own]);
}

export function StudioGitContributions({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const rules = useJoined(useContext(StatusRuleTypesContext), GIT_RULE_TYPES);
  const events = useJoined(
    useContext(WorkflowEventsContext),
    GIT_WORKFLOW_EVENTS,
  );
  return (
    <StatusRuleTypesContext.Provider value={rules}>
      <WorkflowEventsContext.Provider value={events}>
        {children}
      </WorkflowEventsContext.Provider>
    </StatusRuleTypesContext.Provider>
  );
}
