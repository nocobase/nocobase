/**
 * Previews as people and agents use them, through the issues their pull requests are linked to (`access.ts`): what
 * the issue page, the HTTP routes (`routes.ts`) and the CLI share. An issue shows the previews of its linked pull
 * requests, so a pull request linked to several issues shows (and destroys) the same previews on each. Errors are
 * Studio's access errors (404 for an issue the caller may not see, 403 for one they may not edit).
 */
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { Releases } from '@nocobase/app-plugin-releases/server';
import type { DatabaseManager, Row } from '@nocobase/db';

import type {
  IssuePreviews,
  PreviewBlocker,
  PreviewListItem,
  PreviewVariableScope,
  PreviewView,
} from '../../shared/previews.js';
import { conflict, forbidden, invalid, notFound } from '../access/errors.js';
import { buildView, findBuild } from '../builds/store.js';
import { findPullRequestById, pullRequestsOfIssue } from '../git/store.js';
import type { IssueAccess } from './access.js';
import {
  projectPreviewRecords,
  previewIssues,
  visiblePreviewIssue,
} from './project-selection.js';
import type { PreviewService } from './service.js';
import { findIssue, type IssueRecord } from './sources.js';
import {
  livePreviews,
  previewsOfPullRequests,
  previewView,
  type PreviewRecord,
} from './store.js';

export interface PreviewApi {
  /** Existence only; unlinked Apps are considered only after the route admits the actual credential. */
  hasProjectPreviews(
    viewer: Viewer,
    projectId: string,
    allowUnlinked?: boolean,
  ): Promise<boolean>;
  /** The route admits sessions/unrestricted personal keys before this project and App authorization. */
  downProject(
    viewer: Viewer,
    projectId: string,
    previewId: string,
  ): Promise<void>;
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
  /** Live issue previews globally, or visible previews of the project’s current repository bindings. */
  list(
    viewer: Viewer,
    filter?: { readonly projectId?: string; readonly allowUnlinked?: boolean },
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
  readonly projects: () => Pick<Projects, 'issueQueries'>;
  readonly releases: () => Releases;
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

  async function visibleProject(
    viewer: Viewer,
    projectId: string,
  ): Promise<void> {
    if (viewer.permissions.scopes['pm.issues/view'] === 'none')
      throw forbidden('Viewing issues is required.');
    await deps.projects().issueQueries.statuses(viewer, projectId);
  }

  async function canApp(
    viewer: Viewer,
    record: PreviewRecord,
    action: 'view' | 'delete',
  ): Promise<boolean> {
    const releases = deps.releases();
    const app = await releases.releases.findApp(record.appId);
    const ownership =
      app ??
      (record.status === 'destroyed'
        ? { id: record.appId, createdBy: record.createdBy }
        : null);
    return (
      !!ownership &&
      releases.guard.canApp(
        await releases.callerForUser(viewer.userId, 'human'),
        action,
        ownership,
      )
    );
  }

  async function selection(
    viewer: Viewer,
    record: PreviewRecord,
    allowUnlinked: boolean,
  ): Promise<{ issue: IssueRecord | null } | null> {
    const linked = await previewIssues(conn(), record);
    const issue = await visiblePreviewIssue(deps.issues, viewer, linked);
    if (issue) return { issue };
    // A hidden association must never fall through to App permissions.
    if (
      linked.length > 0 ||
      !allowUnlinked ||
      !(await canApp(viewer, record, 'view'))
    )
      return null;
    return { issue: null };
  }

  return {
    read,
    async hasProjectPreviews(viewer, projectId, allowUnlinked = false) {
      await visibleProject(viewer, projectId);
      for (const record of await projectPreviewRecords(conn(), projectId))
        if (await selection(viewer, record, allowUnlinked)) return true;
      return false;
    },
    async downProject(viewer, projectId, previewId) {
      await visibleProject(viewer, projectId);
      const record = (
        await projectPreviewRecords(conn(), projectId, true)
      ).find((item) => item.id === previewId);
      if (!record) throw notFound('Preview');
      if ((await previewIssues(conn(), record)).length > 0)
        throw conflict(
          'PREVIEW_LINKED',
          'The pull request is now linked to an issue. Refresh and use the issue preview.',
        );
      if (!(await canApp(viewer, record, 'delete'))) {
        throw forbidden('Deleting this preview App is not allowed.');
      }
      if (record.status !== 'destroyed') {
        // Permission resolution is asynchronous: an association created during it changes the authorized entry point.
        if ((await previewIssues(conn(), record)).length > 0)
          throw conflict(
            'PREVIEW_LINKED',
            'The pull request is now linked to an issue. Refresh and use the issue preview.',
          );
        await deps
          .previews()
          .down(record.id, viewer.userId, async (current) => {
            const belongs = (
              await projectPreviewRecords(conn(), projectId)
            ).some((item) => item.id === current.id);
            if (!belongs) throw notFound('Preview');
            if (!(await canApp(viewer, current, 'delete')))
              throw forbidden('Deleting this preview App is not allowed.');
            if ((await previewIssues(conn(), current)).length > 0)
              throw conflict(
                'PREVIEW_LINKED',
                'The pull request is now linked to an issue. Refresh and use the issue preview.',
              );
          });
      }
    },
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
      if (filter.projectId) await visibleProject(viewer, filter.projectId);
      const records = filter.projectId
        ? await projectPreviewRecords(conn(), filter.projectId)
        : await livePreviews(conn());
      const items: PreviewListItem[] = [];
      for (const record of records) {
        const selected = await selection(
          viewer,
          record,
          !!filter.projectId && filter.allowUnlinked === true,
        );
        if (!selected) continue;
        const shown = selected.issue;
        items.push({
          ...(await view(record, false)),
          repo: record.repo,
          number: record.number,
          issueId: shown?.id ?? null,
          identifier: shown?.identifier ?? null,
          title: shown?.title ?? null,
          canDestroy: shown
            ? await deps.issues.canEdit(viewer, shown.id)
            : await canApp(viewer, record, 'delete'),
        });
      }
      return items;
    },
  };
}
