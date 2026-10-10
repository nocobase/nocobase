/**
 * An App a repository builds, deleted in release management:
 *
 * - **Before**: `usage` says what deleting it stops, for the Delete App confirmation (Studio's
 *   `ReleasesDeleteAppImpactContext`, `client/releases/delete-app-impact.tsx`): the repositories it is recorded for
 *   that the caller can see, with its role and whether pull request previews of it live there, and how many such
 *   previews run.
 * - **After** (`releasesEvent`, on release management's `app.removed`): what CI recorded of it is removed
 *   (`studioRepoApps`), which turns its role off; the CI key narrows to the Apps left (`../builds/ci-setup.ts`
 *   `appsChanged`); the pull request previews of it (their Apps name it in `previewOf`) are removed
 *   with their Apps; the project's lead hears it in the inbox (`repository_app_removed`, the `ci` renderer).
 *   Deployment marks of the App stay, as history. Nothing offers to recreate it: CI is the source of truth, and its
 *   next deploy naming the App creates it again.
 */
import type { ReleasesEvent } from '@nocobase/app-plugin-releases/server/tokens';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import { PREVIEW_LABEL, RELEASE_LABELS } from '../../shared/previews.js';
import {
  repositoryFullName,
  type AppUsage,
  type AppUsageRepository,
} from '../../shared/releases.js';
import { CI_SOURCE, type CiSetup } from '../builds/ci-setup.js';
import type { StudioInboxPort } from '../inbox/port.js';
import {
  decodeRepositoryApp,
  type LinkViewer,
  type RepositoryLinks,
} from './links.js';

/** The inbox type of the lead's notice (source `ci`). */
export const REPOSITORY_APP_REMOVED = 'repository_app_removed';

/** What the removal asks of release management. */
export interface RemovalReleases {
  /** The pull request previews of the App (`previewOf`), which go with it. */
  previewApps(
    appId: string,
  ): Promise<
    readonly { readonly id: string; readonly createdBy: string | null }[]
  >;
  /** Deletes a preview App as Studio, for the person who created it. */
  deleteApp(appId: string, createdBy: string | null): Promise<void>;
}

export interface AppRemovalDeps {
  readonly database: Pick<DatabaseManager, 'connection' | 'transaction'>;
  readonly links: () => RepositoryLinks;
  readonly releases: () => RemovalReleases;
  readonly ciSetup: () => CiSetup | undefined;
  readonly inbox: () => StudioInboxPort | undefined;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

export interface AppRemoval {
  usage(viewer: LinkViewer, appId: string): Promise<AppUsage>;
  /** Release management's events: `app.removed` of an App a repository builds. Never throws. */
  releasesEvent(event: ReleasesEvent): Promise<void>;
}

export const studioAppRemovalToken: ServiceToken<AppRemoval> =
  createServiceToken<AppRemoval>('studio/releases/app-removal');

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

/** Whether live pull request previews of the App belong to the working directory. */
async function previewsOf(
  conn: DatabaseConnection,
  resourceId: string,
  appId: string,
): Promise<boolean> {
  return Boolean(
    await conn.query
      .selectFrom('studioPreviews')
      .select('id')
      .where('resourceId', '=', resourceId)
      .where('targetAppId', '=', appId)
      .where('status', '!=', 'destroyed')
      .executeTakeFirst(),
  );
}

export function createAppRemoval(deps: AppRemovalDeps): AppRemoval {
  const conn = () => deps.database.connection();
  const now = deps.now ?? (() => new Date());
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));

  /** The repositories linked to the App, with their projects. */
  async function linkedRepositories(appId: string) {
    const rows = await conn()
      .query.selectFrom('studioRepoApps as link')
      .innerJoin(
        'pmProjectResources as resource',
        'resource.id',
        'link.resourceId',
      )
      .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
      .selectAll('link')
      .select([
        'project.id as projectId',
        'project.name as projectName',
        'project.leadUserId as leadUserId',
        'resource.bindingFullName as repo',
        'resource.url as url',
      ])
      .where('link.appId', '=', appId)
      .orderBy('project.name')
      .execute<Row>();
    return rows.map((row) => ({
      link: decodeRepositoryApp(row),
      projectId: String(row.projectId),
      projectName: String(row.projectName),
      leadUserId: textOf(row.leadUserId),
      // A repository is named `owner/name`, from its URL when it is not linked through a host.
      repo:
        textOf(row.repo) ??
        (textOf(row.url) ? repositoryFullName({ url: textOf(row.url) }) : null),
    }));
  }

  async function removed(
    event: Extract<ReleasesEvent, { type: 'app.removed' }>,
  ) {
    const { app } = event;
    const repositories = await linkedRepositories(app.id);
    const at = now();
    if (repositories.length > 0)
      await conn()
        .query.deleteFrom('studioRepoApps')
        .where('appId', '=', app.id)
        .execute();
    for (const repository of repositories) {
      await deps.ciSetup()?.appsChanged(repository.link.resourceId);
      await notify(repository, app, event.actor.userId, at).catch(
        (error: unknown) =>
          onError('Could not tell a project’s lead an App was deleted.', error),
      );
    }
    // Its pull request previews have nothing left to preview.
    const releases = deps.releases();
    for (const preview of await releases.previewApps(app.id))
      await releases
        .deleteApp(preview.id, preview.createdBy)
        .catch((error: unknown) =>
          onError('Could not remove a deleted App’s preview.', error),
        );
  }

  async function notify(
    repository: Awaited<ReturnType<typeof linkedRepositories>>[number],
    app: { readonly id: string; readonly name: string },
    actorId: string | null,
    at: Date,
  ): Promise<void> {
    const inbox = deps.inbox();
    const lead = repository.leadUserId;
    if (!inbox || !lead || lead === actorId) return;
    const { link } = repository;
    const repo = repository.repo ?? repository.projectName;
    await inbox.send({
      key: `ci:app-removed:${link.resourceId}:${app.id}:${at.getTime()}`,
      source: CI_SOURCE,
      kind: 'info',
      type: REPOSITORY_APP_REMOVED,
      userIds: [lead],
      title: `${app.name}, built by ${repo}, was deleted`,
      body: 'Its role in the repository was turned off. CI creates it again on its next deploy that names it; its variables are not restored.',
      // The repository's Deployment in its project's settings.
      path: `/projects/${encodeURIComponent(repository.projectId)}/settings?section=ci&repo=${encodeURIComponent(link.resourceId)}`,
      subject: { type: 'repository', id: link.resourceId, label: repo },
      actor: actorId ? { type: 'user', id: actorId, name: null } : null,
      data: {
        resourceId: link.resourceId,
        projectId: repository.projectId,
        projectName: repository.projectName,
        repo: repository.repo,
        appId: app.id,
        appName: app.name,
        role: link.role,
        previews: await previewsOf(conn(), link.resourceId, app.id),
      },
    });
  }

  return {
    async usage(viewer, appId) {
      const repositories: AppUsageRepository[] = [];
      for (const repository of await linkedRepositories(appId)) {
        const visible = await deps
          .links()
          .read(viewer, repository.link.resourceId)
          .then(
            () => true,
            () => false,
          );
        if (!visible) continue;
        repositories.push({
          resourceId: repository.link.resourceId,
          projectId: repository.projectId,
          projectName: repository.projectName,
          repo: repository.repo,
          role: repository.link.role,
          previews: await previewsOf(conn(), repository.link.resourceId, appId),
        });
      }
      return {
        appId,
        repositories,
        runningPreviews:
          repositories.length > 0
            ? (await deps.releases().previewApps(appId)).length
            : 0,
      };
    },

    async releasesEvent(event) {
      if (event.type !== 'app.removed') return;
      // A pull request's preview App is the previews' own (`../previews/service.ts`).
      if (event.app.labels[RELEASE_LABELS.kind] === PREVIEW_LABEL) return;
      try {
        await removed(event);
      } catch (error) {
        onError('Could not clean up after a deleted App.', error);
      }
    },
  };
}
