/**
 * Who may do what with a preview: it follows the issues its pull request is linked to. Whoever may see one of them sees
 * the preview (its address, its status, its build and App logs); whoever may edit one rebuilds and destroys it, and
 * sees its first administrator. In release management the preview App is "related" the same way (`RelatedAppSource`):
 * `view` and `read-logs` to those issues' viewers, the other App actions to their editors, so the App page and its
 * logs open for them without a release role reaching further. The App is the project lead's (its creator): a preview
 * of a pull request linked to no issue is theirs and release management's administrators' alone.
 */
import type {
  Projects,
  ProjectsAccess,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { AppAction } from '@nocobase/app-plugin-releases/shared/access';
import type { DatabaseManager } from '@nocobase/db';

import { linksOfPullRequest } from '../git/store.js';
import type { RelatedAppSource } from '../releases/links.js';
import { livePreviews, previewWhere, type PreviewRecord } from './store.js';

const SEEING: readonly AppAction[] = ['view', 'read-logs'];

export interface IssueAccess {
  /** The issue as the viewer sees it, or null when they may not. */
  canView(viewer: Viewer, issueId: string): Promise<boolean>;
  canEdit(viewer: Viewer, issueId: string): Promise<boolean>;
  viewerOf(userId: string): Promise<Viewer>;
}

export function createIssueAccess(deps: {
  readonly projects: () => Pick<Projects, 'issueQueries'>;
  readonly access: () => Pick<ProjectsAccess, 'permissionsOfUser'> | undefined;
}): IssueAccess {
  async function canView(viewer: Viewer, issueId: string): Promise<boolean> {
    try {
      await deps.projects().issueQueries.detail(viewer, issueId);
      return true;
    } catch {
      return false;
    }
  }
  return {
    canView,
    async canEdit(viewer, issueId) {
      if (viewer.permissions.scopes['pm.issues/edit'] === 'none') return false;
      return canView(viewer, issueId);
    },
    async viewerOf(userId) {
      const of = deps.access()?.permissionsOfUser;
      if (!of)
        throw new Error('Studio cannot tell what people may do without roles.');
      return {
        userId,
        actor: { type: 'user', id: userId },
        permissions: await of(userId),
      };
    },
  };
}

/** Preview Apps as release management's "related" Apps: by the permissions of their pull requests' issues. */
export function previewAppSource(deps: {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly issues: IssueAccess;
}): RelatedAppSource {
  async function allowed(
    preview: PreviewRecord,
    userId: string,
    action: AppAction,
  ): Promise<boolean> {
    const links = await linksOfPullRequest(
      deps.database.connection(),
      preview.pullRequestId,
    );
    if (links.length === 0) return false;
    const viewer = await deps.issues.viewerOf(userId);
    for (const link of links)
      if (
        SEEING.includes(action)
          ? await deps.issues.canView(viewer, link.issueId)
          : await deps.issues.canEdit(viewer, link.issueId)
      )
        return true;
    return false;
  }
  return {
    async appIds(userId, action) {
      const ids: string[] = [];
      for (const preview of await livePreviews(deps.database.connection()))
        if (await allowed(preview, userId, action)) ids.push(preview.appId);
      return ids;
    },
    async isRelated(appId, userId, action) {
      const preview = await previewWhere(
        deps.database.connection(),
        'appId',
        appId,
      );
      if (!preview || preview.status === 'destroyed') return false;
      return allowed(preview, userId, action);
    },
  };
}
