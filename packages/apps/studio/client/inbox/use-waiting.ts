/** The decisions about one issue still waiting on the viewer, as "Waiting for you" and the issue page read them. */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { UseQueryResult } from '@tanstack/react-query';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

import { useWaitingAbout } from './source.js';

export function useWaiting(
  issue: IssueDetail,
): UseQueryResult<readonly InboxEntry[]> {
  return useWaitingAbout(`issue:${issue.id}`);
}
