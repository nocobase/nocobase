/**
 * What Studio's pull requests add to the projects plugin's statuses: the status event `studio.merged`
 * (`projectsStatusEventsToken`), fired once every counted pull request of an issue is merged (`flow.ts`), which moves
 * an issue in progress, blocked or in review to done.
 */
import type { StatusEventTypes } from '@nocobase/app-plugin-projects/server/tokens';
import {
  BLOCKED_STATUS,
  DONE_STATUS,
  IN_PROGRESS_STATUS,
  IN_REVIEW_STATUS,
} from '@nocobase/app-plugin-projects/shared/statuses';

import { MERGED_EVENT } from '../../shared/git.js';

/** Registers the event; returns what removes it. */
export function registerGitWorkflow(deps: {
  readonly events?: StatusEventTypes;
}): () => void {
  if (!deps.events) return () => undefined;
  return deps.events.add({
    key: MERGED_EVENT,
    from: [IN_PROGRESS_STATUS, BLOCKED_STATUS, IN_REVIEW_STATUS],
    to: DONE_STATUS,
  });
}
