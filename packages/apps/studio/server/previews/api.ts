/**
 * Previews as people and agents use them, through the issues their pull requests are linked to (`access.ts`): what
 * the issue page, the HTTP routes (`routes.ts`) and the CLI share. An issue shows the previews of its linked pull
 * requests, so a pull request linked to several issues shows (and destroys) the same previews on each. Errors are
 * Studio's access errors (404 for an issue the caller may not see, 403 for one they may not edit).
 */
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { DatabaseManager, Row } from '@nocobase/db';

import type {
  IssuePreviews,
  PreviewBlocker,
  PreviewListItem,
  PreviewVariableScope,
  PreviewView,
} from '../../shared/previews.js';
import { forbidden, invalid, notFound } from '../access/errors.js';
import { buildView, findBuild } from '../builds/store.js';
import {
  findPullRequestById,
  linksOfPullRequest,
  pullRequestsOfIssue,
} from '../git/store.js';
import type { IssueAccess } from './access.js';
import type { PreviewService } from './service.js';
import { findIssue, findIssues, type IssueRecord } from './sources.js';
import {
  livePreviews,
  previewsOfPullRequests,
  previewView,
  type PreviewRecord,
} from './store.js';

export interface PreviewApi {
  read(viewer: Viewer, issue: string): Promise<IssuePreviews>;
  /** Destroys the previews of the issue's pull requests, or the one `appId` names. */
  down(viewer: Viewer, issue: string, appId?: string): Promise<IssuePreviews>;
  /** Deploys the head's build of one preview again. */
  retry(viewer: Viewer, issue: string, appId: string): Promise<IssuePreviews>;
  /** Saves what a blocked preview misses, to its own App or its environment, and deploys it. */
  setVariables(
    viewer: Viewer,
    issue: string,
    appId: string,
    scope: PreviewVariableScope,
    values: Readonly<Record<string, string>>,
  ): Promise<IssuePreviews>;
  /** The live previews the viewer sees through an issue, of one project when `projectId` is given. */
  list(
    viewer: Viewer,
    filter?: { readonly projectId?: string },
  ): Promise<PreviewListItem[]>;
}

/**
 * The previews `appId` names among an issue's: its own App's, else the ones of the App it previews (a preview of the
 * repository itself has none).
 */
export function previewsNamed(
  previews: readonly PreviewView[],
  appId: string,
): PreviewView[] {
  const own = previews.filter((preview) => preview.appId === appId);
  return own.length > 0
    ? own
    : previews.filter((preview) => preview.targetAppId === appId);
}

export function createPreviewApi(deps: {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly previews: () => PreviewService;
  readonly issues: IssueAccess;
  /** A release management App's name, for the linked App a preview previews. */
  readonly appName: (appId: string) => Promise<string | null>;
  /** Whether the person may manage release environments, and so save a variable for every preview there. */
  readonly canManageEnvironments: (userId: string) => Promise<boolean>;
}): PreviewApi {
  const conn = () => deps.database.connection();

  async function visible(viewer: Viewer, key: string): Promise<IssueRecord> {
    const issue = await findIssue(conn(), key);
    if (
      !issue ||
      issue.deleted ||
      !(await deps.issues.canView(viewer, issue.id))
    )
      throw notFound('Issue');
    return issue;
  }

  async function editable(viewer: Viewer, key: string): Promise<IssueRecord> {
    const issue = await visible(viewer, key);
    if (!(await deps.issues.canEdit(viewer, issue.id)))
      throw forbidden('Only someone who may edit the issue may do this.');
    return issue;
  }

  async function view(
    preview: PreviewRecord,
    canEdit: boolean,
  ): Promise<PreviewView> {
    const service = deps.previews();
    const pr = await findPullRequestById(conn(), preview.pullRequestId);
    const build = preview.sha
      ? await findBuild(conn(), {
          appId: preview.appId,
          sha: preview.sha,
        })
      : null;
    return previewView(preview, {
      app: await service.appOf(preview),
      targetAppName: preview.targetAppId
        ? await deps.appName(preview.targetAppId)
        : null,
      pullRequest: pr
        ? {
            repo: pr.repo,
            number: pr.number,
            url: pr.url,
            title: pr.title,
            state: pr.state,
          }
        : null,
      build: build ? buildView(build) : null,
      admin: canEdit ? await service.adminOf(preview) : null,
      missingVariables: await service.missingOf(preview),
    });
  }

  /** The previews of the pull requests linked to the issue. */
  async function recordsOf(issueId: string): Promise<PreviewRecord[]> {
    const linked = await pullRequestsOfIssue(conn(), issueId);
    return previewsOfPullRequests(
      conn(),
      linked.map(({ pr }) => pr.id),
    );
  }

  /** Why the issue can have no preview: no repository on a git host, whose CI would deploy one. */
  async function blockerOf(issue: IssueRecord): Promise<PreviewBlocker | null> {
    if (!issue.projectId) return 'noRepository';
    const resource = await conn()
      .query.selectFrom('pmProjectResources')
      .select('id')
      .where('projectId', '=', issue.projectId)
      .where('type', '=', 'gitRepo')
      .where('bindingFullName', 'is not', null)
      .executeTakeFirst<Row>();
    return resource ? null : 'noRepository';
  }

  async function read(viewer: Viewer, key: string): Promise<IssuePreviews> {
    const issue = await visible(viewer, key);
    const canEdit = await deps.issues.canEdit(viewer, issue.id);
    const records = await recordsOf(issue.id);
    const previews: PreviewView[] = [];
    for (const record of records) previews.push(await view(record, canEdit));
    return {
      issueId: issue.id,
      identifier: issue.identifier,
      previews,
      blocker: records.length > 0 ? null : await blockerOf(issue),
      canEdit,
      canSetEnvironmentVariables:
        canEdit && (await deps.canManageEnvironments(viewer.userId)),
    };
  }

  /** The one live preview `appId` names among the issue's. */
  async function one(issue: IssueRecord, appId: string): Promise<string> {
    const records = await recordsOf(issue.id);
    const named = records.filter(
      (record) =>
        record.appId === appId ||
        (record.targetAppId === appId && record.status !== 'destroyed'),
    );
    const found =
      named.find((record) => record.appId === appId) ??
      (named.length === 1 ? named[0] : undefined);
    if (!found) throw notFound('Preview');
    return found.id;
  }

  return {
    read,
    async down(viewer, key, appId) {
      const issue = await editable(viewer, key);
      for (const record of await recordsOf(issue.id)) {
        if (record.status === 'destroyed') continue;
        if (appId && record.appId !== appId && record.targetAppId !== appId)
          continue;
        await deps.previews().down(record.id, viewer.userId);
      }
      return read(viewer, issue.id);
    },
    async retry(viewer, key, appId) {
      const issue = await editable(viewer, key);
      const preview = await deps.previews().retry(await one(issue, appId));
      if (!preview) throw notFound('Preview');
      return read(viewer, issue.id);
    },
    async setVariables(viewer, key, appId, scope, values) {
      const issue = await editable(viewer, key);
      if (Object.keys(values).length === 0)
        throw invalid('VARIABLES_REQUIRED', 'Give at least one value.');
      if (
        scope === 'environment' &&
        !(await deps.canManageEnvironments(viewer.userId))
      )
        throw forbidden(
          'Only someone who may manage release environments saves a value for every preview.',
        );
      const preview = await deps
        .previews()
        .setVariables(await one(issue, appId), scope, values, viewer.userId);
      if (!preview) throw notFound('Preview');
      return read(viewer, issue.id);
    },
    async list(viewer, filter = {}) {
      const previews = await livePreviews(conn());
      const items: PreviewListItem[] = [];
      for (const preview of previews) {
        if (filter.projectId) {
          const resource = await conn()
            .query.selectFrom('pmProjectResources')
            .select('projectId')
            .where('id', '=', preview.resourceId)
            .executeTakeFirst<Row>();
          if (resource?.projectId !== filter.projectId) continue;
        }
        const links = await linksOfPullRequest(conn(), preview.pullRequestId);
        const issues = await findIssues(
          conn(),
          links.map((link) => link.issueId),
        );
        let shown: IssueRecord | null = null;
        for (const issue of issues)
          if (!issue.deleted && (await deps.issues.canView(viewer, issue.id))) {
            shown = issue;
            break;
          }
        if (!shown) continue;
        items.push({
          ...(await view(preview, false)),
          issueId: shown.id,
          identifier: shown.identifier,
          title: shown.title,
        });
      }
      return items;
    },
  };
}
