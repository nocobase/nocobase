/**
 * CI builds, pull request previews and deployment marks in Studio (`../builds/service.ts`, `service.ts`,
 * `../deploys/service.ts`), joining the projects plugin (issues, workflows, plans), Studio's pull requests (verifying
 * commits and what a deployed one contains, pull request events), the agents plugin (CLI commands; build jobs only
 * with the disabled runner build method) and release management (Apps, releases, deployments and their events); none
 * of them knows the others.
 *
 * - register: the services;
 * - boot: the job kind `studio.preview-build` with the disabled runner build method (`studio.builds.method: runner`),
 *   preview Apps as release management's "related" Apps (`access.ts`), and listeners: pull requests stored (opened, a
 *   new head, merged, closed) and linked, runner build endings, status changes (the unreleased reminder) and release
 *   management's events;
 * - start: the reconciliation, now and hourly (`PreviewService.reconcile`).
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  releasesEventsToken,
  releasesToken,
} from '@nocobase/app-plugin-releases/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { normalizeBasePath } from '@nocobase/app-server/support';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { createDeployMarks } from '../deploys/service.js';
import { studioDeploysToken } from '../deploys/token.js';
import { studioInboxPortToken } from '../inbox/port.js';
import { studioInboxToken } from '../inbox/token.js';
import { findPullRequestById } from '../git/store.js';
import { repoCiOfKey } from '../releases/ci.js';
import { studioRepositoryLinksToken } from '../releases/provider.js';
import { variablesPages } from '../releases/variables-pages.js';
import { createIssueAccess, previewAppSource } from './access.js';
import { ciBuildMethod, type StudioBuildsConfig } from '../builds/method.js';
import {
  PREVIEW_BUILD_JOB,
  previewBuildJob,
  runnerBuildMethod,
  uploadedRelease,
} from '../builds/runner.js';
import { createBuilds } from '../builds/service.js';
import { studioBuildsToken, studioCiSetupToken } from '../builds/token.js';
import { studioGitToken } from '../git/token.js';
import { createPreviewApi } from './api.js';
import { uploadTicketKey } from './secrets.js';
import { createPreviewService } from './service.js';
import { studioPreviewApiToken, studioPreviewsToken } from './token.js';

const RECONCILE_MS = 60 * 60 * 1000;
const FIRST_RECONCILE_MS = 60 * 1000;

export default class StudioPreviewsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/previews';
  private releases: (() => void)[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  private buildsConfig(): StudioBuildsConfig {
    return (
      this.app.config.get<{ builds?: StudioBuildsConfig }>('studio')?.builds ??
      {}
    );
  }

  private assembled(): boolean {
    const { container } = this.app;
    return (
      container.has(releasesToken) &&
      container.has(agentsToken) &&
      container.has(projectsToken)
    );
  }

  private onError = (message: string, error: unknown): void => {
    const { container } = this.app;
    if (container.has(loggingToken))
      container
        .resolve(loggingToken)
        .getLogger('previews')
        .error({ err: error }, message);
    else console.error(message, error);
  };

  public override register(): void {
    if (!this.assembled()) return;
    const { container, config } = this.app;
    const secrets = container.has(secretsServiceToken)
      ? container.resolve(secretsServiceToken)
      : undefined;
    const publicOrigin = config.get<string>('app.publicOrigin');
    const access = () =>
      container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken)
        : undefined;
    const inbox = () =>
      container.has(studioInboxPortToken)
        ? container.resolve(studioInboxPortToken)
        : undefined;
    const builds = this.buildsConfig();
    // Where a refused deployment's missing variables are set, as Studio's pages.
    const pages = variablesPages(
      publicOrigin,
      normalizeBasePath(config.get<string>('app.publicBasePath') ?? ''),
    );
    container.singleton(studioPreviewsToken, (resolver) =>
      createPreviewService({
        database: resolver.resolve(databaseManagerToken),
        releases: () => resolver.resolve(releasesToken),
        inbox,
        // CI builds by default; the runner method is a disabled alternative (`../builds/method.ts`).
        buildMethod: () =>
          builds.method === 'runner' && builds.runner
            ? runnerBuildMethod({
                runners: () => resolver.resolve(agentsToken),
                config: builds.runner,
              })
            : ciBuildMethod,
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        studioOrigin: publicOrigin ? new URL(publicOrigin).origin : null,
        variablesPages: pages,
        onError: this.onError,
      }),
    );
    container.singleton(studioBuildsToken, (resolver) =>
      createBuilds({
        database: resolver.resolve(databaseManagerToken),
        releases: () => resolver.resolve(releasesToken),
        verify: (resourceId, sha) =>
          resolver.resolve(studioGitToken).git().verifyCommit(resourceId, sha),
        // The API key Studio keeps for a repository's CI (`../builds/ci-setup.ts`) builds that repository.
        ciRepositoryOf: async (userId) => {
          const row = await repoCiOfKey(
            resolver.resolve(databaseManagerToken).connection(),
            userId,
          );
          return row
            ? { resourceId: row.resourceId, setUpBy: row.createdBy }
            : null;
        },
        appsRecorded: (resourceId) =>
          resolver.has(studioCiSetupToken)
            ? resolver.resolve(studioCiSetupToken).appsChanged(resourceId)
            : Promise.resolve(),
        previews: () => resolver.resolve(studioPreviewsToken),
        git: () =>
          resolver.has(studioGitToken)
            ? resolver.resolve(studioGitToken).git()
            : undefined,
        variablesPages: pages,
        requestPage: (appId, requestId) =>
          publicOrigin
            ? `${new URL(publicOrigin).origin}${normalizeBasePath(config.get<string>('app.publicBasePath') ?? '')}/releases/${encodeURIComponent(appId)}/requests/${encodeURIComponent(requestId)}`
            : null,
        secret: uploadTicketKey(secrets, config.get<string>('auth.secret')),
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        onError: this.onError,
      }),
    );
    container.singleton(studioPreviewApiToken, (resolver) =>
      createPreviewApi({
        syncPreviewLabels: (issueId) =>
          resolver.resolve(studioGitToken).git().syncPreviewLabels(issueId),
        database: resolver.resolve(databaseManagerToken),
        previews: () => resolver.resolve(studioPreviewsToken),
        issues: createIssueAccess({
          projects: () => resolver.resolve(projectsToken),
          access,
        }),
        appName: async (appId) =>
          (await resolver.resolve(releasesToken).releases.findApp(appId))
            ?.name ?? null,
        async canManageEnvironments(userId) {
          const releases = resolver.resolve(releasesToken);
          return releases.guard.hasSetting(
            await releases.callerForUser(userId, 'human'),
            'rel.environments',
            'manage',
          );
        },
      }),
    );
    container.singleton(studioDeploysToken, (resolver) =>
      createDeployMarks({
        database: resolver.resolve(databaseManagerToken),
        projects: () => resolver.resolve(projectsToken),
        // Without Studio's git nothing can say what a deployment contains: its marks stay as they were.
        contains: (resourceId, head, shas) =>
          resolver.has(studioGitToken)
            ? resolver
                .resolve(studioGitToken)
                .git()
                .commitsContained(resourceId, head, shas)
            : Promise.resolve(null),
        releases: () => resolver.resolve(releasesToken),
        inbox,
        decisionOf: (userId, ref) =>
          resolver.has(studioInboxToken)
            ? resolver.resolve(studioInboxToken).decision(userId, ref)
            : Promise.resolve(null),
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        onError: this.onError,
      }),
    );
  }

  public override boot(): Promise<void> {
    if (this.releases.length > 0) return Promise.resolve();
    const { container } = this.app;
    if (!this.assembled()) return Promise.resolve();
    const projects = container.resolve(projectsToken);
    const previews = () => container.resolve(studioPreviewsToken);
    const deploys = container.resolve(studioDeploysToken);
    const database = container.resolve(databaseManagerToken);
    const access = () =>
      container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken)
        : undefined;
    const keep = (release: () => void) => this.releases.push(release);
    const background = (message: string, work: Promise<unknown>) => {
      void work.catch((error: unknown) => this.onError(message, error));
    };

    const runner = this.buildsConfig().method === 'runner';
    if (runner) {
      const agents = container.resolve(agentsToken);
      agents.jobs.register(
        PREVIEW_BUILD_JOB,
        previewBuildJob({ releases: () => container.resolve(releasesToken) }),
      );
      keep(
        agents.events.on('job.changed', (event) => {
          if (event.status === 'completed')
            background(
              'Could not follow a runner build.',
              this.runnerBuilt(event.jobId),
            );
        }),
      );
    }
    if (container.has(studioRepositoryLinksToken))
      keep(
        container.resolve(studioRepositoryLinksToken).addSource(
          previewAppSource({
            database,
            issues: createIssueAccess({
              projects: () => projects,
              access,
            }),
          }),
        ),
      );

    keep(
      projects.events.on('issue.updated', (event) => {
        const status = event.changes.status;
        if (status)
          background(
            'Could not remind the release owner of a finished issue.',
            deploys.issueMoved(event.issueId, status.to),
          );
      }),
    );
    // Previews follow pull requests by identity: one opened (or its new head) makes or moves them and supersedes the
    // builds of older heads, one merged or closed removes them. One unlinked from an issue takes the issue's deployment
    // marks of its commits with it.
    if (container.has(studioGitToken)) {
      const builds = container.resolve(studioBuildsToken);
      keep(
        container
          .resolve(studioGitToken)
          .events()
          .on(async (event) => {
            if (event.type === 'unlinked') {
              await deploys.pullRequestUnlinked(
                event.issueId,
                event.pullRequestId,
              );
              return;
            }
            const pr = await findPullRequestById(
              database.connection(),
              event.pullRequestId,
            );
            if (!pr) return;
            if (pr.state === 'open' && pr.headSha)
              await builds.headMoved(pr.id, pr.headSha);
            await previews().pullRequestChanged(pr.id);
          }),
      );
    }
    keep(
      container.resolve(releasesEventsToken).subscribe(async (event) => {
        await previews().releasesEvent(event);
        await deploys.releasesEvent(event);
      }),
    );
    return Promise.resolve();
  }

  /** A runner build of a preview finished (the disabled runner method): its uploaded release deploys. */
  private async runnerBuilt(jobId: string): Promise<void> {
    const job = await this.app.container.resolve(agentsToken).jobs.get(jobId);
    if (job.kind !== PREVIEW_BUILD_JOB) return;
    // The runner method names the preview as the job's subject.
    const previewId = job.subject?.kind === 'preview' ? job.subject.id : null;
    const uploaded = uploadedRelease(job.result);
    if (!previewId || !uploaded) return;
    await this.app.container
      .resolve(studioPreviewsToken)
      .runnerBuilt(previewId, uploaded.releaseId, uploaded.sha);
  }

  public override start(): Promise<void> {
    if (!this.assembled() || this.timers.length > 0) return Promise.resolve();
    const reconcile = () => {
      void this.app.container
        .resolve(studioPreviewsToken)
        .reconcile()
        .catch((error: unknown) =>
          this.onError('Could not reconcile previews.', error),
        );
    };
    const first = setTimeout(reconcile, FIRST_RECONCILE_MS);
    const every = setInterval(reconcile, RECONCILE_MS);
    first.unref?.();
    every.unref?.();
    this.timers.push(first, every);
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    for (const timer of this.timers.splice(0)) clearTimeout(timer);
    for (const release of this.releases.splice(0).reverse()) release();
    return Promise.resolve();
  }
}
