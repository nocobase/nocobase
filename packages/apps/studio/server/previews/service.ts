/**
 * Pull request previews, like review apps, with CI as the source of truth: an App is a preview because CI made it with
 * `nb-studio app ensure` (`<app>-pr-<number>` in the preview environment, by convention) and its first deployment was the
 * head of an open pull request of the repository; Studio then records that pull request as its source (`claim`, from
 * `../builds`), deploys every build CI deploys to it, and deletes it once the pull request is merged or closed
 * (`shared/previews.ts`). Studio decides by identity, explicit events and pinned commits only:
 *
 * | when                                                          | what happens                                       |
 * | ------------------------------------------------------------- | -------------------------------------------------- |
 * | CI deploys an open pull request's head to an App `app ensure` | the pull request becomes its source (`claim`): the |
 * | made and nothing deployed yet (`../builds`)                   | App starts on demand, and the build deploys        |
 * |                                                               | (`built`)                                          |
 * | the pull request gets a new head (`pullRequestChanged`,       | its previews wait for that head's build            |
 * | git's events)                                                 |                                                    |
 * | the pull request is merged or closed, or someone presses      | its preview Apps made by `app ensure` and their    |
 * | Destroy                                                       | data are removed (`down`)                          |
 * | nobody visits it for the environment's idle minutes, then its | the App Host stops it, then removes its unpacked   |
 * | dormancy hours                                                | files; a visit starts or prepares it again         |
 * | Studio's reconciliation (hourly)                               | previews of merged, closed or forgotten pull       |
 * |                                                               | requests and orphan preview Apps removed, uploaded |
 * |                                                               | heads not deployed retried                         |
 *
 * A preview's variables have two layers, like every App's: the Preview environment's, which every preview there
 * gets, and its own, set on its App's Variables page, which win. Release management generates the App's
 * secrets, its origin, its first administrator and, where the environment says so, its sample data. A build that
 * needs a variable nothing sets leaves the preview `blocked`; values saved from the issue page (`setVariables`) deploy
 * it. A build of an older head is never deployed: the builds service supersedes it when a newer head is verified, and
 * a new head moves the pull request's previews to it. Nothing is posted to the pull request: the address is shown in
 * Studio on the issues it is linked to. An App that existed before CI deployed a pull request to it is never a preview,
 * and nothing here deletes it.
 *
 * Studio acts in release management as a rule for a person: whoever made the App.
 */
import {
  ReleasesError,
  type Caller,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import type { ReleasesEvent } from '@nocobase/app-plugin-releases/server/tokens';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type { DatabaseManager, Row } from '@nocobase/db';

import {
  PREVIEW_LABEL,
  RELEASE_LABELS,
  type PreviewAdmin,
  type PreviewMissingVariable,
  type PreviewVariableScope,
} from '../../shared/previews.js';
import type { BuildMethod } from '../builds/method.js';
import type { PreviewPort } from '../builds/service.js';
import {
  buildById,
  findBuild,
  insertBuild,
  updateBuild,
  type BuildRecord,
} from '../builds/store.js';
import {
  findPullRequestById,
  linksOfPullRequest,
  type PullRequestRow,
} from '../git/store.js';
import type { StudioInboxPort } from '../inbox/port.js';
import {
  missingVariableNames,
  withVariablesPages,
  type VariablesPages,
} from '../releases/variables-pages.js';
import { PREVIEW_FAILED, PREVIEW_READY, previewNotice } from './notices.js';
import { findIssues } from './sources.js';
import {
  insertPreview,
  livePreviews,
  previewsOfPullRequests,
  previewWhere,
  updatePreview,
  type PreviewApp,
  type PreviewRecord,
} from './store.js';

export interface PreviewServiceDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly releases: () => Releases;
  readonly inbox: () => StudioInboxPort | undefined;
  /** How builds come to be: CI by default (Studio waits), or the disabled runner method. */
  readonly buildMethod: () => BuildMethod;
  readonly newId: () => string;
  /** Studio's `app.publicOrigin`, for previews served on Studio's own origin. */
  readonly studioOrigin: string | null;
  /** Where a blocked preview's missing variables are set: its environment's Variables page, or its App's. */
  readonly variablesPages?: VariablesPages;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

export interface PreviewService extends PreviewPort {
  /** A pull request was stored: an open one's previews follow its head, a merged or closed one's are removed. */
  pullRequestChanged(pullRequestId: string): Promise<void>;
  /** Removes the preview's App and its data; the row stays, `destroyed`, until the pull request's next head. */
  down(
    previewId: string,
    by: string | null,
    beforeDelete?: (preview: PreviewRecord) => Promise<void>,
  ): Promise<void>;
  /** Deploys the preview's head again from its uploaded build. */
  retry(previewId: string): Promise<PreviewRecord | null>;
  /** A runner build (the disabled runner method) finished with a release in the preview's App. */
  runnerBuilt(
    previewId: string,
    releaseId: string,
    sha: string | null,
  ): Promise<void>;
  /** Release management's events about preview Apps. */
  releasesEvent(event: ReleasesEvent): Promise<void>;
  /** Catches up with what events may have missed; answers what it did. */
  reconcile(): Promise<{
    readonly redeployed: number;
    readonly destroyed: number;
    readonly orphans: number;
  }>;
  /** The preview's App URL and how its runtime stands. */
  appOf(preview: PreviewRecord): Promise<PreviewApp>;
  /** The first administrator its first deployment generated. */
  adminOf(preview: PreviewRecord): Promise<PreviewAdmin | null>;
  /** For a blocked preview: what its build requires and nothing sets. */
  missingOf(preview: PreviewRecord): Promise<PreviewMissingVariable[]>;
  /**
   * Saves values for the preview, to its own App (`preview`) or, as `by`, to its environment (`environment`, which
   * needs that permission), and deploys a blocked preview again.
   */
  setVariables(
    previewId: string,
    scope: PreviewVariableScope,
    values: Readonly<Record<string, string>>,
    by: string,
  ): Promise<PreviewRecord | null>;
}

export function createPreviewService(deps: PreviewServiceDeps): PreviewService {
  const now = deps.now ?? (() => new Date());
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const conn = () => deps.database.connection();
  const locks = new Map<string, Promise<unknown>>();

  /** One operation per preview App at a time. */
  function locked<T>(key: string, run: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) ?? Promise.resolve();
    const next = previous.then(run, run);
    const settled = next.catch(() => undefined);
    locks.set(key, settled);
    void settled.then(() => {
      if (locks.get(key) === settled) locks.delete(key);
    });
    return next;
  }
  const keyOf = (preview: Pick<PreviewRecord, 'appId'>) => preview.appId;

  /** Studio in release management, acting as a rule for `userId`. */
  const ruleCaller = (userId: string | null): Caller => ({
    userId,
    kind: 'rule',
    permissions: allPermissions(),
  });

  function absoluteUrl(url: string | null): string | null {
    if (!url) return null;
    if (/^https?:\/\//iu.test(url)) return url;
    return deps.studioOrigin ? `${deps.studioOrigin}${url}` : url;
  }

  async function appOf(preview: PreviewRecord): Promise<PreviewApp> {
    if (preview.status === 'destroyed') return { url: null, runtime: null };
    try {
      const summary = await deps
        .releases()
        .releases.getApp(ruleCaller(null), preview.appId);
      return {
        url: summary.url,
        runtime: summary.app.currentDeploymentId
          ? {
              state: summary.runtime.available
                ? summary.runtime.state
                : 'unknown',
              lastAccessedAt: summary.runtime.lastAccessedAt,
            }
          : null,
      };
    } catch {
      return { url: null, runtime: null };
    }
  }

  /** Tells the owners of the issues the pull request is linked to; nobody hears of a pull request linked to none. */
  async function notify(
    type: typeof PREVIEW_READY | typeof PREVIEW_FAILED,
    preview: PreviewRecord,
    details: {
      readonly error?: string | null;
      readonly key: string;
      /** A blocked preview's: what its build requires and nothing sets. */
      readonly missingVariables?: readonly string[];
    },
  ): Promise<void> {
    const port = deps.inbox();
    if (!port) return;
    const links = await linksOfPullRequest(conn(), preview.pullRequestId);
    const issues = (
      await findIssues(
        conn(),
        links.map((link) => link.issueId),
      )
    ).filter((issue) => !issue.deleted);
    if (issues.length === 0) return;
    const url = absoluteUrl((await appOf(preview)).url);
    for (const issue of issues)
      try {
        await port.send(
          previewNotice(type, issue, {
            previewId: preview.id,
            appId: preview.appId,
            targetAppId: preview.targetAppId,
            pullRequest: { repo: preview.repo, number: preview.number },
            url,
            sha: preview.deployedSha ?? preview.sha,
            error: details.error ?? null,
            key: details.key,
            environmentId: preview.environmentId,
            ...(details.missingVariables
              ? { missingVariables: details.missingVariables }
              : {}),
          }),
        );
      } catch (error) {
        onError('Could not tell the owner about a preview.', error);
      }
  }

  async function fail(
    preview: PreviewRecord,
    error: string,
    guard: { deploymentId?: string } = {},
    notifyKey?: string,
  ): Promise<void> {
    const changed = await updatePreview(
      conn(),
      preview.id,
      { status: 'failed', error: error.slice(0, 4000) },
      guard,
    );
    if (changed)
      await notify(
        PREVIEW_FAILED,
        { ...preview, status: 'failed', error },
        { error, key: notifyKey ?? `${preview.id}:${now().getTime()}` },
      );
  }

  /** Whether an App is this pull request's preview. */
  const isOurs = (
    labels: Readonly<Record<string, string>>,
    pullRequestId: string,
  ) =>
    labels[RELEASE_LABELS.kind] === PREVIEW_LABEL &&
    labels[RELEASE_LABELS.pullRequest] === pullRequestId;

  /**
   * Makes the pull request's preview follow its head: a live one moves to it (the running App keeps serving the head it
   * has until the new one is deployed), a destroyed one comes back only with a new head.
   */
  async function follow(
    pr: PullRequestRow,
    existing: PreviewRecord,
  ): Promise<PreviewRecord> {
    if (existing.status === 'destroyed' && existing.sha !== pr.headSha)
      await updatePreview(conn(), existing.id, {
        status: 'waiting',
        sha: pr.headSha || null,
        deployedSha: null,
        buildId: null,
        releaseId: null,
        deploymentId: null,
        error: null,
      });
    else if (existing.status !== 'destroyed' && existing.sha !== pr.headSha)
      await updatePreview(conn(), existing.id, {
        sha: pr.headSha || null,
        // Nothing deployed yet, or the last one failed: it waits for the new head.
        ...(existing.status === 'failed' || !existing.deploymentId
          ? { status: 'waiting', error: null }
          : {}),
      });
    return (await previewWhere(conn(), 'id', existing.id))!;
  }

  /**
   * The preview's App made the pull request's: named after it, labelled as its preview and started on demand. One
   * missing (the disabled runner build method, or its row's App removed) is made, as `app ensure` would.
   */
  async function ensureApp(preview: PreviewRecord): Promise<string> {
    const releases = deps.releases();
    const existing = await releases.releases.findApp(preview.appId);
    const pr = await findPullRequestById(conn(), preview.pullRequestId);
    const labels = {
      [RELEASE_LABELS.kind]: PREVIEW_LABEL,
      [RELEASE_LABELS.repository]: preview.resourceId,
      [RELEASE_LABELS.pullRequest]: preview.pullRequestId,
      [RELEASE_LABELS.pullRequestNumber]: String(preview.number),
    };
    if (existing) {
      if (isOurs(existing.labels, preview.pullRequestId)) return existing.id;
      await releases.releases.updateApp(
        ruleCaller(existing.createdBy ?? preview.createdBy),
        existing.id,
        {
          name: `${preview.repo}#${preview.number}`,
          ...(pr?.title ? { description: pr.title.slice(0, 200) } : {}),
          labels: { ...existing.labels, ...labels },
          // Started by its first visit; it stops and sleeps by the environment's defaults, and Studio deletes it when
          // the pull request is merged or closed.
          activation: 'onDemand',
        },
      );
      return existing.id;
    }
    await releases.releases.createApp(ruleCaller(preview.createdBy), {
      id: preview.appId,
      name: `${preview.repo}#${preview.number}`,
      environmentId: preview.environmentId,
      ...(pr?.title ? { description: pr.title.slice(0, 200) } : {}),
      labels: { ...labels, [RELEASE_LABELS.ensured]: preview.resourceId },
      activation: 'onDemand',
    });
    return preview.appId;
  }

  /** The release of a build in the preview's own App: uploaded there, or copied from the App it was uploaded to. */
  async function releaseIn(
    preview: PreviewRecord,
    build: BuildRecord,
  ): Promise<string> {
    if (build.releaseAppId === preview.appId) return build.releaseId!;
    const copied = await deps
      .releases()
      .releases.promoteRelease(
        ruleCaller(null),
        build.releaseAppId!,
        build.releaseId!,
        preview.appId,
      );
    return copied.id;
  }

  async function ready(previewId: string, deploymentId: string) {
    const preview = await previewWhere(conn(), 'id', previewId);
    if (!preview) return;
    const build = preview.buildId
      ? await buildById(conn(), preview.buildId)
      : null;
    const changed = await updatePreview(
      conn(),
      previewId,
      { status: 'ready', error: null, deployedSha: build?.sha ?? preview.sha },
      { deploymentId },
    );
    const updated = await previewWhere(conn(), 'id', previewId);
    if (changed && updated)
      await notify(PREVIEW_READY, updated, { key: deploymentId });
  }

  async function deployBuild(
    preview: PreviewRecord,
    build: BuildRecord,
  ): Promise<void> {
    if (
      preview.status === 'destroyed' ||
      build.superseded ||
      !build.releaseId ||
      !build.releaseAppId ||
      build.sha !== preview.sha
    )
      return;
    // Already running it, or on its way.
    if (
      preview.buildId === build.id &&
      (preview.status === 'ready' || preview.status === 'deploying')
    )
      return;
    let releaseId: string | null = null;
    const releases = deps.releases();
    try {
      await ensureApp(preview);
      releaseId = await releaseIn(preview, build);
      const app = (await releases.releases.findApp(preview.appId))!;
      // Its configuration is the release's template; what differs per preview comes in variables.
      const deployment = await releases.releases.deploy(
        ruleCaller(app.createdBy ?? preview.createdBy),
        app.id,
        { releaseId },
      );
      await updatePreview(conn(), preview.id, {
        status: 'deploying',
        buildId: build.id,
        releaseId,
        deploymentId: deployment.id,
        error: null,
      });
      // A deployment that finished before its id was recorded is caught up here.
      const done = await releases.releases.getDeployment(
        ruleCaller(null),
        app.id,
        deployment.id,
      );
      if (done.status === 'succeeded') await ready(preview.id, deployment.id);
      else if (done.status === 'failed')
        await fail(
          { ...preview, deploymentId: deployment.id },
          done.error ?? 'The deployment failed.',
          { deploymentId: deployment.id },
          deployment.id,
        );
    } catch (error) {
      if (
        error instanceof ReleasesError &&
        error.reason === 'VARIABLES_MISSING' &&
        releaseId
      ) {
        // It waits for the variables; saving them, on its environment or its App, deploys this build.
        const told = withVariablesPages(
          error,
          { id: preview.appId, environmentId: preview.environmentId },
          deps.variablesPages,
        ) as ReleasesError;
        const changed = await updatePreview(conn(), preview.id, {
          status: 'blocked',
          buildId: build.id,
          releaseId,
          error: told.message.slice(0, 4000),
        });
        if (changed && preview.status !== 'blocked')
          await notify(
            PREVIEW_FAILED,
            { ...preview, status: 'blocked', error: told.message },
            {
              error: told.message,
              key: `${preview.id}:blocked:${build.id}`,
              missingVariables: missingVariableNames(error),
            },
          );
        return;
      }
      await fail(
        preview,
        error instanceof ReleasesError && error.reason === 'ENVIRONMENT_FULL'
          ? 'limitReached'
          : `Could not deploy the build: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Deploys the uploaded build of the preview's head, if there is one; asks the build method otherwise. */
  async function catchUp(preview: PreviewRecord): Promise<void> {
    if (!preview.sha || preview.status === 'destroyed') return;
    const build = await findBuild(conn(), {
      appId: preview.appId,
      sha: preview.sha,
    });
    if (build?.releaseId) {
      await deployBuild(preview, build);
      return;
    }
    const method = deps.buildMethod();
    if (method.id === 'ci' || build || !preview.createdBy) return;
    const pr = await findPullRequestById(conn(), preview.pullRequestId);
    const resource = await conn()
      .query.selectFrom('pmProjectResources')
      .select('url')
      .where('id', '=', preview.resourceId)
      .executeTakeFirst<Row>();
    if (!pr || typeof resource?.url !== 'string') return;
    try {
      await ensureApp(preview);
      await method.request({
        previewId: preview.id,
        identifier: `${preview.repo}#${preview.number}`,
        targetAppId: preview.targetAppId,
        previewAppId: preview.appId,
        repoUrl: resource.url,
        branch: pr.headRef || null,
        sha: preview.sha,
        by: preview.createdBy,
      });
    } catch (error) {
      await fail(
        preview,
        `Could not ask for the build: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async function downNow(
    preview: PreviewRecord,
    by: string | null,
    beforeDelete?: (preview: PreviewRecord) => Promise<void>,
  ) {
    if (preview.status === 'destroyed') return;
    const releases = deps.releases();
    const app = await releases.releases.findApp(preview.appId);
    // Recheck caller-specific preconditions after waiting for deployment work and resolving the App.
    await beforeDelete?.(preview);
    // Only an App made for it (`app ensure`, or Studio itself, as previews were before): one that existed before is
    // never deleted.
    if (
      app?.labels[RELEASE_LABELS.ensured] ||
      app?.labels[RELEASE_LABELS.kind] === PREVIEW_LABEL
    )
      await releases.releases.deleteApp(
        ruleCaller(app.createdBy ?? by),
        preview.appId,
      );
    await updatePreview(conn(), preview.id, {
      status: 'destroyed',
      deploymentId: null,
      buildId: null,
      releaseId: null,
      deployedSha: null,
      error: null,
    });
  }

  /** Removes every live preview of the pull request (merged or closed). */
  async function downAll(pullRequestId: string): Promise<number> {
    let count = 0;
    for (const preview of await previewsOfPullRequests(conn(), [
      pullRequestId,
    ])) {
      if (preview.status === 'destroyed') continue;
      await locked(keyOf(preview), async () => {
        const current = await previewWhere(conn(), 'id', preview.id);
        if (current) await downNow(current, null);
      });
      count += 1;
    }
    return count;
  }

  /**
   * The pull request's live previews moved to its head, and deployed when its build is there. Only CI makes a
   * preview, and only CI's next build brings back one someone destroyed.
   */
  async function followPullRequest(pr: PullRequestRow): Promise<void> {
    for (const preview of await previewsOfPullRequests(conn(), [pr.id])) {
      if (preview.status === 'destroyed') continue;
      await locked(keyOf(preview), async () => {
        const followed = await follow(pr, preview);
        await catchUp(followed);
      });
    }
  }

  async function adminOf(preview: PreviewRecord): Promise<PreviewAdmin | null> {
    if (preview.status === 'destroyed') return null;
    try {
      const { username, email, password } = await deps
        .releases()
        .releases.readInitialAdmin(ruleCaller(null), preview.appId);
      return { username, email, password };
    } catch {
      return null;
    }
  }

  async function missingOf(
    preview: PreviewRecord,
  ): Promise<PreviewMissingVariable[]> {
    if (preview.status !== 'blocked' || !preview.releaseId) return [];
    try {
      const { items } = await deps
        .releases()
        .releases.listAppVariables(ruleCaller(null), preview.appId, {
          releaseId: preview.releaseId,
        });
      return items
        .filter((item) => item.missing)
        .map((item) => ({
          name: item.name,
          description: item.description,
          secret: item.secret,
        }));
    } catch {
      return [];
    }
  }

  const service: PreviewService = {
    async pullRequestChanged(pullRequestId) {
      const pr = await findPullRequestById(conn(), pullRequestId);
      if (!pr) return;
      if (pr.state !== 'open') {
        await downAll(pr.id);
        return;
      }
      if (!pr.headSha) return;
      await followPullRequest(pr);
    },

    async claim(input) {
      const pr = await findPullRequestById(conn(), input.pullRequestId);
      if (!pr || pr.state !== 'open') return null;
      return locked(input.appId, async () => {
        const existing = await previewWhere(conn(), 'appId', input.appId);
        if (!existing)
          await insertPreview(conn(), {
            id: deps.newId(),
            resourceId: input.resourceId,
            pullRequestId: pr.id,
            repo: pr.repo,
            number: pr.number,
            targetAppId: null,
            appId: input.appId,
            environmentId: input.environmentId,
            status: 'waiting',
            sha: pr.headSha || null,
            createdBy: input.createdBy,
            createdAt: now(),
            updatedAt: now(),
          });
        // Destroyed with its App, which `app ensure` made again: it comes back for the pull request deployed now.
        else if (existing.status === 'destroyed')
          await updatePreview(conn(), existing.id, {
            status: 'waiting',
            resourceId: input.resourceId,
            pullRequestId: pr.id,
            repo: pr.repo,
            number: pr.number,
            environmentId: input.environmentId,
            sha: pr.headSha || null,
            deployedSha: null,
            buildId: null,
            releaseId: null,
            deploymentId: null,
            error: null,
          });
        const preview = (await previewWhere(conn(), 'appId', input.appId))!;
        if (await deps.releases().releases.findApp(input.appId))
          await ensureApp(preview);
        return preview;
      });
    },

    async built(build) {
      if (build.superseded) return null;
      const preview = await previewWhere(conn(), 'appId', build.appId);
      if (!preview) return null;
      await locked(keyOf(preview), async () => {
        const current = await previewWhere(conn(), 'id', preview.id);
        const latest = await buildById(conn(), build.id);
        if (current && latest) await deployBuild(current, latest);
      });
      return previewWhere(conn(), 'id', preview.id);
    },

    async down(previewId, by, beforeDelete) {
      const preview = await previewWhere(conn(), 'id', previewId);
      if (!preview) return;
      await locked(keyOf(preview), async () => {
        const current = await previewWhere(conn(), 'id', previewId);
        if (current) await downNow(current, by, beforeDelete);
      });
    },

    async retry(previewId) {
      const preview = await previewWhere(conn(), 'id', previewId);
      if (!preview) return null;
      return locked(keyOf(preview), async () => {
        const current = await previewWhere(conn(), 'id', previewId);
        if (!current || current.status === 'destroyed') return current;
        // Deploy again even when the same build ran.
        await updatePreview(conn(), current.id, {
          buildId: null,
          error: null,
        });
        await catchUp((await previewWhere(conn(), 'id', previewId))!);
        return previewWhere(conn(), 'id', previewId);
      });
    },

    async runnerBuilt(previewId, releaseId, sha) {
      const preview = await previewWhere(conn(), 'id', previewId);
      if (!preview || preview.status === 'destroyed') return;
      const commit = sha ?? preview.sha;
      if (!commit) return;
      const key = { appId: preview.appId, sha: commit };
      const existing = await findBuild(conn(), key);
      const at = now();
      if (!existing)
        await insertBuild(conn(), {
          id: deps.newId(),
          appId: preview.appId,
          resourceId: preview.resourceId,
          sha: commit,
          ref: null,
          pullRequestId: preview.pullRequestId,
          state: 'succeeded',
          superseded: commit !== preview.sha,
          releaseId,
          releaseAppId: preview.appId,
          reportedBy: preview.createdBy,
          verifiedAt: at,
          uploadedAt: at,
          createdAt: at,
          updatedAt: at,
        });
      else if (!existing.releaseId)
        await updateBuild(conn(), existing.id, {
          releaseId,
          releaseAppId: preview.appId,
          uploadedAt: at,
          state: 'succeeded',
        });
      const build = await findBuild(conn(), key);
      if (build) await service.built(build);
    },

    async releasesEvent(event) {
      if (event.app.labels[RELEASE_LABELS.kind] !== PREVIEW_LABEL) return;
      if (event.type === 'app.removed') {
        const preview = await previewWhere(conn(), 'appId', event.app.id);
        if (preview && preview.status !== 'destroyed')
          await updatePreview(conn(), preview.id, {
            status: 'destroyed',
            deploymentId: null,
            buildId: null,
            releaseId: null,
            deployedSha: null,
            error: null,
          });
        return;
      }
      if (
        event.type !== 'deployment.succeeded' &&
        event.type !== 'deployment.rolledBack' &&
        event.type !== 'deployment.failed'
      )
        return;
      const preview = await previewWhere(
        conn(),
        'deploymentId',
        event.deployment.id,
      );
      if (!preview) return;
      if (event.type === 'deployment.failed')
        await fail(
          preview,
          event.error,
          { deploymentId: event.deployment.id },
          event.deployment.id,
        );
      else await ready(preview.id, event.deployment.id);
    },

    async reconcile() {
      let redeployed = 0;
      let destroyed = 0;
      let orphans = 0;
      for (const preview of await livePreviews(conn())) {
        try {
          const pr = await findPullRequestById(conn(), preview.pullRequestId);
          if (!pr || pr.state !== 'open') {
            await service.down(preview.id, null);
            destroyed += 1;
            continue;
          }
          if (pr.headSha && pr.headSha !== preview.sha) {
            await followPullRequest(pr);
            continue;
          }
          if (
            preview.status === 'waiting' ||
            // A variable may have been set since, on the environment or the preview's App.
            preview.status === 'blocked' ||
            (preview.status === 'ready' && preview.deployedSha !== preview.sha)
          ) {
            const before = preview.deploymentId;
            await locked(keyOf(preview), () => catchUp(preview));
            const after = await previewWhere(conn(), 'id', preview.id);
            if (after?.deploymentId && after.deploymentId !== before)
              redeployed += 1;
          }
        } catch (error) {
          onError(`Could not reconcile the preview ${preview.appId}.`, error);
        }
      }
      // Preview Apps nobody's row knows: left by a crash, or by a row's App replaced.
      try {
        const releases = deps.releases();
        const page = await releases.releases.listApps(ruleCaller(null), {
          labels: { [RELEASE_LABELS.kind]: PREVIEW_LABEL },
          pageSize: 100,
        });
        const known = new Set(
          (await livePreviews(conn())).map((row) => row.appId),
        );
        for (const item of page.items) {
          if (known.has(item.app.id)) continue;
          // Just created: its row is being written.
          if (now().getTime() - Date.parse(item.app.createdAt) < 10 * 60_000)
            continue;
          await releases.releases.deleteApp(
            ruleCaller(item.app.createdBy),
            item.app.id,
          );
          orphans += 1;
        }
      } catch (error) {
        onError('Could not look for orphan preview Apps.', error);
      }
      return { redeployed, destroyed, orphans };
    },

    async setVariables(previewId, scope, values, by) {
      const preview = await previewWhere(conn(), 'id', previewId);
      if (!preview || preview.status === 'destroyed') return null;
      const releases = deps.releases();
      if (scope === 'environment') {
        // As the person: only someone who may manage environments changes what every preview there gets.
        const caller = await releases.callerForUser(by, 'human');
        for (const [name, value] of Object.entries(values))
          await releases.environments.setVariable(
            caller,
            preview.environmentId,
            name,
            { value },
          );
      } else {
        await locked(keyOf(preview), () => ensureApp(preview));
        for (const [name, value] of Object.entries(values))
          await releases.releases.setAppVariable(
            ruleCaller(by),
            preview.appId,
            name,
            { value },
          );
      }
      return preview.status === 'blocked'
        ? service.retry(previewId)
        : previewWhere(conn(), 'id', previewId);
    },

    appOf,
    adminOf,
    missingOf,
  };
  return service;
}
