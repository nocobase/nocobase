/**
 * The projects plugin's notices (`projectsNoticesToken`) through Studio's inbox port, as source `projects`: every
 * notice is about its issue (subject `issue`, labelled with the identifier) and carries the plugin's `params` as its
 * data; the browser renders these items with the `projects` entry of the inbox registry
 * (`client/inbox/contributions/projects.ts`).
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
    // A decision is keyed by its notice: nothing resolves it but the port's callers.
    decisionKey: decision ? notice.key : null,
    group: notice.group ?? null,
    actor: notice.actor ?? null,
    data: { ...notice.params },
  };
}

export function createProjectsNotices(
  port: () => StudioInboxPort,
  afterSend?: (notice: ProjectNotice) => Promise<void>,
  onError: (error: unknown) => void = (error) =>
    console.error('Studio could not reconcile a delivered notice.', error),
): ProjectsNotices {
  return {
    send: async (notice) => {
      await port().send(projectNoticeToInbox(notice));
      try {
        await afterSend?.(notice);
      } catch (error) {
        onError(error);
      }
    },
  };
}
