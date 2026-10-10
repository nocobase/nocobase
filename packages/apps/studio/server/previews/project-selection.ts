/** Repository membership and visibility shared by the project list, navigation and cleanup. */
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseConnection, Row } from '@nocobase/db';
import { linksOfPullRequest } from '../git/store.js';
import type { IssueAccess } from './access.js';
import { findIssues, type IssueRecord } from './sources.js';
import { decodePreview, type PreviewRecord } from './store.js';

/** Match the current binding identity, independently of the preview's original working directory. */
export async function projectPreviewRecords(
  conn: DatabaseConnection,
  projectId: string,
  includeDestroyed = false,
): Promise<PreviewRecord[]> {
  let query = conn.query
    .selectFrom('studioPreviews as preview')
    .innerJoin('studioPullRequests as pr', 'pr.id', 'preview.pullRequestId')
    .innerJoin('studioGitRepos as repo', 'repo.id', 'pr.repoId')
    .innerJoin('pmProjectResources as resource', (join) =>
      join
        .onRef('resource.bindingProvider', '=', 'repo.provider')
        .onRef('resource.bindingConnectionId', '=', 'repo.connectionId')
        .onRef('resource.bindingRepoId', '=', 'repo.externalId'),
    )
    .selectAll('preview')
    .where('resource.projectId', '=', projectId)
    .where('resource.type', '=', 'gitRepo')
    .distinct();
  if (!includeDestroyed)
    query = query.where('preview.status', '!=', 'destroyed');
  return (
    await query
      .orderBy('preview.createdAt')
      .orderBy('preview.id')
      .execute<Row>()
  ).map(decodePreview);
}

/** Deleted or missing issues do not authorize a preview or keep it in the linked group. */
export async function previewIssues(
  conn: DatabaseConnection,
  preview: PreviewRecord,
): Promise<IssueRecord[]> {
  const links = await linksOfPullRequest(conn, preview.pullRequestId);
  return (
    await findIssues(
      conn,
      links.map((link) => link.issueId),
    )
  ).filter((issue) => !issue.deleted);
}

export async function visiblePreviewIssue(
  issues: IssueAccess,
  viewer: Viewer,
  linked: readonly IssueRecord[],
): Promise<IssueRecord | null> {
  for (const issue of linked)
    if (await issues.canView(viewer, issue.id)) return issue;
  return null;
}
