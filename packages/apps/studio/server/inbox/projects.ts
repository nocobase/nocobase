/**
 * The projects plugin's notices (`projectsNoticesToken`) through Studio's inbox port, as source `projects`: every
 * notice is about its issue (subject `issue`, labelled with the identifier), carries the plugin's `params` as its data,
 * and an approval request's decision is keyed by the request's id, which is how the plugin resolves it. Deciding stays
 * with the plugin's own API (`/api/projects/approvals/{approvalId}/approve` and `/reject`); the browser renders these items with the `projects`
 * entry of the inbox registry (`client/inbox/contributions/projects.ts`).
 */
import type {
  ProjectNotice,
  ProjectsNotices,
} from '@nocobase/app-plugin-projects/server/tokens';

import type { StudioInboxPort, InboxSend } from './port.js';

/** The projects plugin's source in the inbox. */
export const PROJECTS_SOURCE = 'projects';

/** The issue subject's type. */
export const ISSUE_SUBJECT = 'issue';

export function projectNoticeToInbox(notice: ProjectNotice): InboxSend {
  const decision = notice.kind === 'decision';
  return {
    key: notice.key,
    source: PROJECTS_SOURCE,
    kind: notice.kind,
    type: notice.type,
    userIds: notice.userIds,
    title: notice.title,
    body: notice.body,
    path: notice.path,
    subject: {
      type: ISSUE_SUBJECT,
      id: notice.issue.id,
      label: notice.issue.identifier,
    },
    // A decision of another kind is keyed by its notice: nothing resolves it but the port's callers.
    decisionKey: decision ? (notice.approvalRequestId ?? notice.key) : null,
    group: notice.group ?? null,
    actor: notice.actor ?? null,
    data: {
      ...notice.params,
      // What an outcome notice (`approval_decided`) is about.
      ...(!decision && notice.approvalRequestId
        ? { approvalRequestId: notice.approvalRequestId }
        : {}),
    },
  };
}

export function createProjectsNotices(
  port: () => StudioInboxPort,
): ProjectsNotices {
  return {
    send: (notice) => port().send(projectNoticeToInbox(notice)),
    resolve: ({ approvalRequestId, outcome }) =>
      port().resolve({
        source: PROJECTS_SOURCE,
        decisionKey: approvalRequestId,
        outcome,
      }),
  };
}
