/**
 * The deployment demo (`deploy-data.ts`), built after the demo of `build.ts` as the sample `studio/demo-deploy`, so an
 * installation that already has the demo can add it with `pnpm nocobase db sample`. It goes through Studio's own
 * services and stores where it can, and never calls a code host or runs an App:
 *
 * - **Real**: the demo connection (`GitConnections.createDemo`, a token connection marked `demo`, whose host Studio
 *   never calls), the projects, working directories, issues and the agent's CI issue (projects plugin), the preview
 *   CI choices (`studioRepoCi`), the repository and environment variables, the Apps and their releases (release
 *   management; a release is an image that names a registry nobody asks, so no archive is stored), the previews as CI
 *   makes them (`app ensure`'s label, then `PreviewPort.claim`) and the deployment request waiting for approval.
 * - **Display-only**: pull requests, builds, deployments and deployment marks are written as the services would record
 *   them, since recording them for real means asking GitHub or running the App. The deployments are `succeeded` but
 *   their Apps stay stopped; a deployment of these releases is refused, as an image does not run on the local App Host,
 *   and refreshing a pull request answers `GIT_CONNECTION_DEMO`.
 *
 * Every object is found before it is made, so a run that failed half way runs again without duplicating anything.
 */
import { createHash, randomUUID } from 'node:crypto';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  ProjectsAccess,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Priority } from '@nocobase/app-plugin-projects/shared/common';
import type { Executor } from '@nocobase/app-plugin-projects/shared/issues';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import {
  ReleasesError,
  SYSTEM_CALLER,
  type Caller,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import type { UserManagementService } from '@nocobase/app-plugin-users/server/tokens';
import type { SecretsService } from '@nocobase/app-server/secrets';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';

import { APPROVER_ADMINS, APPROVER_LEAD } from '../../shared/releases.js';
import { ciWorkflowPathOf } from '../../shared/ci-modes.js';
import { RELEASE_LABELS } from '../../shared/previews.js';
import { AGENT_KIND } from '../agents/tx.js';
import {
  DEFAULT_CI_TARGET,
  ciTaskBrief,
  standardCiWorkflow,
} from '../builds/ci-modes.js';
import { writeCiRun } from '../builds/ci-run-store.js';
import { findBuild, insertBuild } from '../builds/store.js';
import type { GitConnections } from '../git/connections.js';
import type { StudioGit } from '../git/service.js';
import {
  insertLink,
  PULL_REQUESTS,
  upsertPullRequest,
  type RepoRow,
} from '../git/store.js';
import type { PreviewService } from '../previews/service.js';
import { updatePreview } from '../previews/store.js';
import { recordCiChoice, updateRepoCi } from '../releases/ci.js';
import { recordRepositoryApp } from '../releases/links.js';
import { PREVIEW_ENVIRONMENT_ID } from '../releases/provider.js';
import type { DemoSummary } from './build.js';
import {
  DEMO_CI_PULL_REQUEST,
  DEMO_CI_TASK_TITLE,
  DEMO_CI_URL,
  DEMO_CONNECTION,
  DEMO_DEPLOY_ISSUES,
  DEMO_DEPLOY_PROJECTS,
  DEMO_ENVIRONMENT_VARIABLE,
  DEMO_ENVIRONMENTS,
  DEMO_IMAGE,
  DEMO_MISSING_VARIABLE,
  DEMO_PREVIEW_APP_VARIABLES,
  DEMO_RELEASES,
  DEMO_REPOSITORIES,
  DEMO_RUNNER_DIRECTORY,
  DEMO_SHAS,
  type DemoDeployIssue,
  type DemoRepository,
} from './deploy-data.js';

export interface DeployDemoDependencies {
  readonly users: UserManagementService;
  readonly projects: Projects;
  readonly access: Pick<ProjectsAccess, 'permissionsOfUser'>;
  readonly connections: GitConnections;
  readonly git: Pick<StudioGit, 'repoOfResource'>;
  readonly database: Pick<DatabaseManager, 'connection'>;
  /** Release management; without it there are no Apps, previews or deployments. */
  readonly releases: Releases | null;
  readonly previews: Pick<PreviewService, 'claim'> | null;
  /** Seals the ready preview's first administrator as release management does. */
  readonly secrets: Pick<SecretsService, 'seal'> | null;
  readonly agents: Agents | null;
  /** The initial administrator, who builds the structure. */
  readonly adminId: string;
  /** Studio's public address for the CI brief; empty when unknown. */
  readonly studioUrl: string;
  readonly now?: () => Date;
  readonly onWarning?: (message: string, error: unknown) => void;
}

/** Release management's purpose for a deployment's first administrator (`@nocobase/app-plugin-releases`). */
const INITIAL_ADMIN_PURPOSE = '@nocobase/app-plugin-releases/initial-admin';

/** Issues created directly in a status no workflow accepts on creation start here and are then moved. */
const CREATE_STATUS: Readonly<Record<string, string>> = {
  done: 'todo',
  in_review: 'in_progress',
};

const digestOf = (seed: string): string =>
  `sha256:${createHash('sha256').update(seed).digest('hex')}`;

const runUrl = (repo: string, run: number): string =>
  `${DEMO_CI_URL}/${repo}/actions/runs/${run}`;

export async function buildDeployDemo(
  deps: DeployDemoDependencies,
): Promise<DemoSummary> {
  const now = deps.now ?? (() => new Date());
  const summary: DemoSummary = {};
  const created = (kind: string) => {
    summary[kind] = (summary[kind] ?? 0) + 1;
  };
  const warn =
    deps.onWarning ??
    ((message: string, error: unknown) => console.warn(message, error));
  const { projects } = deps;
  const conn = (): DatabaseConnection => deps.database.connection();
  const minutesAgo = (minutes: number): Date =>
    new Date(now().getTime() - minutes * 60_000);

  // People: the demo's, made by `build.ts`.
  const userIds = new Map<string, string>([['admin', deps.adminId]]);
  for (const key of ['alex', 'lisa', 'leo', 'chloe', 'zach']) {
    const found = (
      await deps.users.list({ search: key, pageSize: 20 })
    ).items.find((user) => user.username?.toLowerCase() === key);
    if (!found)
      throw new Error(
        `The deployment demo needs the demo's people (no "${key}"): build the demo (studio/demo) first.`,
      );
    userIds.set(key, found.id);
  }
  const viewers = new Map<string, Viewer>();
  async function viewerOf(key: string): Promise<Viewer> {
    const known = viewers.get(key);
    if (known) return known;
    const userId = userIds.get(key)!;
    await projects.members.ensure(userId);
    const viewer: Viewer = {
      userId,
      actor: { type: 'user', id: userId },
      permissions: await deps.access.permissionsOfUser!(userId),
    };
    viewers.set(key, viewer);
    return viewer;
  }
  const admin = await viewerOf('admin');

  // The connection.
  const connection = await deps.connections.createDemo(deps.adminId, {
    ...DEMO_CONNECTION,
  });
  created('connections');

  // Projects: the demo's by name, and those this demo adds.
  const projectIds = new Map<string, string>();
  const findProject = async (name: string): Promise<string | null> => {
    const row = await conn()
      .query.selectFrom('pmProjects')
      .select('id')
      .where('name', '=', name)
      .orderBy('createdAt')
      .executeTakeFirst<Row>();
    return row ? String(row.id) : null;
  };
  for (const name of new Set(DEMO_REPOSITORIES.map((repo) => repo.project))) {
    const id = await findProject(name);
    if (id) projectIds.set(name, id);
  }
  for (const spec of DEMO_DEPLOY_PROJECTS) {
    if (projectIds.has(spec.name)) continue;
    const row = await projects.projects.create(admin, {
      name: spec.name,
      description: spec.description,
      visibility: 'everyone',
      status: 'in_progress',
      priority: 'high',
      leadUserId: userIds.get(spec.lead) ?? null,
      workflowId: null,
    });
    projectIds.set(spec.name, row.id);
    created('projects');
    const members = new Set(row.members.map((member) => member.id));
    for (const key of spec.members) {
      const userId = userIds.get(key);
      if (!userId || members.has(userId)) continue;
      await projects.projects.addMember(admin, row.id, { userId });
      members.add(userId);
    }
  }

  // Working directories bound to the connection, and their repositories' rows.
  const resources = new Map<string, ProjectResource>();
  const repos = new Map<string, RepoRow>();
  for (const spec of DEMO_REPOSITORIES) {
    const projectId = projectIds.get(spec.project);
    if (!projectId) {
      warn(
        `The demo project ${spec.project} is missing: ${spec.fullName} was not added`,
        null,
      );
      continue;
    }
    const project = await projects.projects.get(admin, projectId);
    const resource =
      project.resources.find(
        (item) => item.binding?.fullName === spec.fullName,
      ) ??
      (await projects.projects.addResource(admin, projectId, {
        type: 'gitRepo',
        url: `${DEMO_CONNECTION.webUrl}/${spec.fullName}.git`,
        defaultRef: 'main',
        binding: {
          provider: 'github',
          connectionId: connection.id,
          repoId: spec.externalId,
          fullName: spec.fullName,
        },
      }));
    resources.set(spec.key, resource);
    created('working directories');
    const repo = await deps.git.repoOfResource(conn(), resource);
    if (repo) repos.set(spec.key, repo);
  }
  const runnerProject = projectIds.get(DEMO_RUNNER_DIRECTORY.project);
  if (runnerProject) {
    const project = await projects.projects.get(admin, runnerProject);
    if (
      !project.resources.some(
        (item) =>
          item.type === 'directory' && item.path === DEMO_RUNNER_DIRECTORY.path,
      )
    ) {
      await projects.projects.addResource(admin, runnerProject, {
        type: 'directory',
        runnerId: DEMO_RUNNER_DIRECTORY.runnerId,
        path: DEMO_RUNNER_DIRECTORY.path,
        label: DEMO_RUNNER_DIRECTORY.label,
        initPrompt: DEMO_RUNNER_DIRECTORY.initPrompt,
      });
      created('working directories');
    }
  }

  // Issues of the CRM project, and the agent's CI issue of the platform.
  const issueIds = new Map<string, { id: string; projectId: string }>();
  const crmProject = projectIds.get('CRM System');
  async function ensureIssue(
    projectId: string,
    spec: Pick<
      DemoDeployIssue,
      'title' | 'description' | 'status' | 'priority' | 'owner'
    > & { readonly executor: Executor | null },
  ): Promise<{ id: string; identifier: string }> {
    const existing = await conn()
      .query.selectFrom('pmIssues')
      .select(['id', 'identifier'])
      .where('projectId', '=', projectId)
      .where('title', '=', spec.title)
      .executeTakeFirst<Row>();
    if (existing)
      return {
        id: String(existing.id),
        identifier: String(existing.identifier),
      };
    let issue = await projects.issues.create(admin, {
      title: spec.title,
      description: spec.description,
      statusKey: CREATE_STATUS[spec.status] ?? spec.status,
      priority: spec.priority as Priority,
      ownerUserId: userIds.get(spec.owner),
      executor: spec.executor,
      // An agent executor waits: no demo runtime is online.
      start: false,
      projectId,
    });
    if (issue.statusKey !== spec.status)
      issue = await projects.issues.update(admin, issue.id, {
        revision: issue.revision,
        statusKey: spec.status,
      });
    created('issues');
    return { id: issue.id, identifier: issue.identifier };
  }
  if (crmProject)
    for (const spec of DEMO_DEPLOY_ISSUES) {
      try {
        const issue = await ensureIssue(crmProject, {
          ...spec,
          executor: { type: 'user', id: userIds.get(spec.executor)! },
        });
        issueIds.set(spec.key, { id: issue.id, projectId: crmProject });
      } catch (error) {
        warn(`Demo issue "${spec.title}" was not created`, error);
      }
    }

  // Preview CI in each state.
  for (const spec of DEMO_REPOSITORIES) {
    const resource = resources.get(spec.key);
    if (!resource) continue;
    try {
      await connectCi(spec, resource);
      created('CI setups');
    } catch (error) {
      warn(`The demo CI of ${spec.fullName} was not recorded`, error);
    }
  }

  /**
   * What a "Configure CI" run leaves (`ci-setup.ts`): the CRM repository's workflows on its default branch, whose
   * reports are the builds below; the website's pull request waiting; the platform's agent's issue under way; nothing
   * for the dashboard, which waits for its first report.
   */
  async function connectCi(
    spec: DemoRepository,
    resource: ProjectResource,
  ): Promise<void> {
    const at = now();
    await recordCiChoice(conn(), {
      resourceId: resource.id,
      auto: spec.ci !== 'none',
      userId: deps.adminId,
      now: at,
    });
    // Pull requests of each application, and (the CRM's) a branch to staging and tags to production.
    const paths = [
      ...spec.apps.map((app) =>
        ciWorkflowPathOf({
          appId: app.appId,
          trigger: 'pullRequest',
          environmentId: PREVIEW_ENVIRONMENT_ID,
        }),
      ),
      ...(spec.key === 'crm'
        ? (['staging', 'production'] as const).map((role) =>
            ciWorkflowPathOf({
              appId: DEMO_RELEASES[role].appId,
              trigger: role === 'staging' ? 'branch' : 'tag',
              environmentId: DEMO_ENVIRONMENTS[role].id,
              environmentName: DEMO_ENVIRONMENTS[role].name,
            }),
          )
        : []),
    ];
    if (spec.ci === 'none') return;
    if (spec.ci === 'connected') {
      await updateRepoCi(
        conn(),
        resource.id,
        {
          state: 'configured',
          workflowPaths: paths,
          workflowSha: DEMO_SHAS.staging,
          lastError: null,
        },
        at,
      );
      return;
    }
    if (spec.ci === 'pr-open') {
      await updateRepoCi(
        conn(),
        resource.id,
        {
          state: 'pr-open',
          workflowPaths: paths,
          pullRequestNumber: DEMO_CI_PULL_REQUEST,
          pullRequestUrl: `${DEMO_CONNECTION.webUrl}/${spec.fullName}/pull/${DEMO_CI_PULL_REQUEST}`,
          lastError: null,
        },
        at,
      );
      return;
    }
    // `task`: an agent's issue connects it.
    const agentId = deps.agents
      ? ((await deps.agents.agents.list()).find(
          (agent) => agent.name === 'Frontend Developer',
        )?.id ??
        (await deps.agents.agents.list())[0]?.id ??
        null)
      : null;
    const app = spec.apps[0];
    const files = [
      standardCiWorkflow({
        studioUrl: deps.studioUrl,
        defaultBranch: 'main',
        app,
        target: DEFAULT_CI_TARGET,
        managed: true,
      }),
    ];
    const task = await ensureIssue(resource.projectId, {
      title: DEMO_CI_TASK_TITLE,
      description: ciTaskBrief({
        studioUrl: deps.studioUrl,
        repo: spec.fullName,
        defaultBranch: 'main',
        app,
        target: DEFAULT_CI_TARGET,
        files,
        secretName: 'NB_STUDIO_API_KEY',
      }),
      status: 'in_progress',
      priority: 'medium',
      owner: 'admin',
      executor: agentId ? { type: AGENT_KIND, id: agentId } : null,
    });
    await writeCiRun(
      conn(),
      resource.id,
      { taskIssueId: task.id, taskIdentifier: task.identifier },
      at,
    );
    await updateRepoCi(
      conn(),
      resource.id,
      { state: 'configured', lastError: null },
      at,
    );
  }

  const crm = resources.get('crm');
  const crmRepo = repos.get('crm');
  if (!crm || !crmRepo || !crmProject) {
    warn(
      'The CRM repository is missing: no pull requests or deployments',
      null,
    );
    return summary;
  }

  // Pull requests, linked to their issues.
  const pullRequestIds = new Map<number, string>();
  for (const spec of DEMO_DEPLOY_ISSUES) {
    const pr = spec.pullRequest;
    const merged = pr.state === 'merged';
    const at = minutesAgo(merged ? 60 * 24 * 3 : 90);
    const { pr: row } = await upsertPullRequest(
      conn(),
      crmRepo.id,
      {
        repo: crmRepo.repo,
        number: pr.number,
        url: `${DEMO_CONNECTION.webUrl}/${crmRepo.repo}/pull/${pr.number}`,
        title: pr.title,
        body: null,
        state: pr.state,
        draft: false,
        headRef: pr.branch,
        baseRef: 'main',
        headSha: pr.headSha,
        authorLogin: pr.author,
        mergeableState: merged ? null : 'clean',
        mergedAt: merged ? at.toISOString() : null,
        mergedByLogin: merged ? 'alex' : null,
        mergeCommitSha: pr.mergeCommitSha ?? null,
        closedAt: merged ? at.toISOString() : null,
      },
      {
        ciState: pr.ciState,
        checks: [
          {
            kind: 'check',
            name: 'studio-crm-preview / build',
            status: pr.ciState === 'pending' ? 'in_progress' : 'completed',
            conclusion:
              pr.ciState === 'pending'
                ? null
                : pr.ciState === 'failure'
                  ? 'failure'
                  : 'success',
            url: runUrl(crmRepo.repo, 2000 + pr.number),
          },
        ],
      },
    );
    pullRequestIds.set(pr.number, row.id);
    // Studio first saw it when it was opened: one has waited for review for days.
    if (pr.openedDaysAgo)
      await conn()
        .query.updateTable(PULL_REQUESTS)
        .set({ createdAt: minutesAgo(pr.openedDaysAgo * 24 * 60) })
        .where('id', '=', row.id)
        .execute();
    const issue = issueIds.get(spec.key);
    if (
      issue &&
      (await insertLink(conn(), {
        issueId: issue.id,
        pullRequestId: row.id,
        linkedByType: 'user',
        linkedById: userIds.get(pr.author) ?? null,
      }))
    )
      created('pull requests');
  }

  // Preview variables: one on the Preview environment, which every preview takes, and each preview App's own.
  const releases = deps.releases;
  if (!releases) {
    warn('Release management is not installed: no Apps or previews', null);
    return summary;
  }
  const preview = await releases.environments.find(PREVIEW_ENVIRONMENT_ID);
  if (preview) {
    const variables = await releases.environments
      .listVariables(SYSTEM_CALLER, PREVIEW_ENVIRONMENT_ID)
      .catch(() => null);
    if (
      !variables?.some((item) => item.name === DEMO_ENVIRONMENT_VARIABLE.name)
    )
      await releases.environments.setVariable(
        SYSTEM_CALLER,
        PREVIEW_ENVIRONMENT_ID,
        DEMO_ENVIRONMENT_VARIABLE.name,
        {
          value: DEMO_ENVIRONMENT_VARIABLE.value,
          description: DEMO_ENVIRONMENT_VARIABLE.description,
        },
      );
  }

  const caller: Caller = await releases.callerForUser(deps.adminId, 'human');

  async function ensureApp(input: {
    readonly id: string;
    readonly name: string;
    readonly environmentId: string;
  }): Promise<void> {
    if (await releases!.releases.findApp(input.id)) return;
    // As `nb-studio app ensure` makes it: the working directory it is for.
    await releases!.releases.createApp(caller, {
      ...input,
      labels: { [RELEASE_LABELS.ensured]: crm!.id },
    });
    created('apps');
  }

  async function imageRelease(
    appId: string,
    input: {
      readonly version: string;
      readonly sha: string;
      readonly ref: string | null;
      readonly buildId: string;
      readonly run: number;
      readonly variables?: Parameters<
        Releases['releases']['registerImageRelease']
      >[2]['variables'];
    },
  ): Promise<string> {
    const release = await releases!.releases.registerImageRelease(
      caller,
      appId,
      {
        version: input.version,
        ref: DEMO_IMAGE,
        digest: digestOf(`${appId}@${input.version}@${input.sha}`),
        sourceCommit: input.sha,
        build: runUrl(crmRepo!.repo, input.run),
        labels: {
          [RELEASE_LABELS.sha]: input.sha,
          [RELEASE_LABELS.build]: input.buildId,
          ...(input.ref ? { [RELEASE_LABELS.ref]: input.ref } : {}),
        },
        ...(input.variables ? { variables: input.variables } : {}),
      },
    );
    return release.id;
  }

  /** A build as CI reports it; the existing one of that App and commit when there is one. */
  async function build(input: {
    readonly appId: string;
    readonly sha: string;
    readonly ref: string | null;
    readonly pullRequestId: string | null;
    readonly state: 'building' | 'failed' | 'succeeded';
    readonly run: number;
    readonly message?: string;
    readonly minutesAgo: number;
  }): Promise<string> {
    const existing = await findBuild(conn(), input);
    if (existing) return existing.id;
    const id = randomUUID();
    const at = minutesAgo(input.minutesAgo);
    await insertBuild(conn(), {
      id,
      appId: input.appId,
      resourceId: crm!.id,
      sha: input.sha,
      ref: input.ref,
      pullRequestId: input.pullRequestId,
      state: input.state,
      logsUrl: runUrl(crmRepo!.repo, input.run),
      message: input.message ?? null,
      superseded: false,
      releaseId: null,
      releaseAppId: null,
      reportedBy: deps.adminId,
      verifiedAt: at,
      uploadedAt: null,
      createdAt: at,
      updatedAt: at,
    });
    created('builds');
    return id;
  }

  async function uploaded(buildId: string, appId: string, releaseId: string) {
    await conn()
      .query.updateTable('studioBuilds')
      .set({ releaseId, releaseAppId: appId, uploadedAt: now() })
      .where('id', '=', buildId)
      .execute();
  }

  /**
   * A deployment of the release recorded as succeeded, without running anything: the App stays stopped. With an
   * administrator, the first one the deployment generated, sealed as release management seals it.
   */
  async function deployed(
    appId: string,
    releaseId: string,
    input: {
      readonly actorId: string;
      readonly minutesAgo: number;
      readonly admin?: { username: string; email: string; password: string };
    },
  ): Promise<string> {
    const app = await releases!.releases.findApp(appId);
    if (app?.currentDeploymentId) return app.currentDeploymentId;
    const id = randomUUID();
    const at = minutesAgo(input.minutesAgo);
    const initialAdmin =
      input.admin && deps.secrets
        ? deps.secrets.seal(JSON.stringify(input.admin), {
            purpose: INITIAL_ADMIN_PURPOSE,
            aad: [id],
          })
        : null;
    await conn()
      .query.insertInto('relDeployments')
      .values({
        id,
        appId,
        releaseId,
        kind: 'deploy',
        rollbackTargetDeploymentId: null,
        previousDeploymentId: null,
        status: 'succeeded',
        phase: 'completed',
        configMode: 'external',
        configPath: null,
        error: null,
        actorId: input.actorId,
        actorKind: 'human',
        requestId: null,
        artifactKind: null,
        imageRef: null,
        imageDigest: null,
        imagePlatform: null,
        env: null,
        variablesFingerprint: null,
        initialAdmin,
        // Kept until someone saves it, as a preview's is: the demo's must not vanish after a day.
        initialAdminExpiresAt: null,
        initialAdminSavedBy: null,
        initialAdminSavedAt: null,
        createdAt: at,
        startedAt: at,
        finishedAt: new Date(at.getTime() + 90_000),
      })
      .execute();
    await conn()
      .query.updateTable('relApps')
      .set({ currentDeploymentId: id, updatedAt: now() })
      .where('id', '=', appId)
      .execute();
    created('deployments');
    return id;
  }

  // Staging and production: environments on the local App Host, their Apps recorded for the repository.
  const deploymentOf = new Map<
    'staging' | 'production',
    {
      deploymentId: string;
      releaseId: string;
      version: string;
      environmentId: string;
      appId: string;
    }
  >();
  if (releases.drivers.get('host')) {
    try {
      for (const role of ['staging', 'production'] as const) {
        const environment = DEMO_ENVIRONMENTS[role];
        if (!(await releases.environments.find(environment.id)))
          await releases.environments.create(SYSTEM_CALLER, {
            id: environment.id,
            name: environment.name,
            driver: 'host',
            config: { backend: 'in-process' },
            publicUrl: '/{appId}/',
            protected: role === 'production',
            approvers:
              role === 'production' ? [APPROVER_ADMINS, APPROVER_LEAD] : [],
          });
        const spec = DEMO_RELEASES[role];
        await ensureApp({
          id: spec.appId,
          name: spec.name,
          environmentId: environment.id,
        });
        await recordRepositoryApp(conn(), {
          resourceId: crm.id,
          appId: spec.appId,
          role,
          environmentId: environment.id,
          by: deps.adminId,
          newId: randomUUID,
        });
        const buildId = await build({
          appId: spec.appId,
          sha: spec.sha,
          ref: spec.ref,
          pullRequestId: null,
          state: 'succeeded',
          run: role === 'staging' ? 3101 : 3001,
          minutesAgo: role === 'staging' ? 240 : 60 * 24 * 2,
        });
        const releaseId = await imageRelease(spec.appId, {
          version: spec.version,
          sha: spec.sha,
          ref: spec.ref,
          buildId,
          run: role === 'staging' ? 3101 : 3001,
        });
        await uploaded(buildId, spec.appId, releaseId);
        const deploymentId = await deployed(spec.appId, releaseId, {
          actorId: userIds.get('alex')!,
          minutesAgo: role === 'staging' ? 235 : 60 * 24 * 2 - 10,
        });
        deploymentOf.set(role, {
          deploymentId,
          releaseId,
          version: spec.version,
          environmentId: environment.id,
          appId: spec.appId,
        });
      }

      // What staging runs, built for production and waiting for an approver.
      const pending = DEMO_RELEASES.pending;
      const production = DEMO_RELEASES.production;
      const buildId = await build({
        appId: production.appId,
        sha: pending.sha,
        ref: pending.ref,
        pullRequestId: null,
        state: 'succeeded',
        run: 3102,
        minutesAgo: 30,
      });
      const releaseId = await imageRelease(production.appId, {
        version: pending.version,
        sha: pending.sha,
        ref: pending.ref,
        buildId,
        run: 3102,
      });
      await uploaded(buildId, production.appId, releaseId);
      const waiting = await releases.requests.list(SYSTEM_CALLER, {
        appId: production.appId,
        status: 'pending',
        pageSize: 1,
      });
      if (waiting.items.length === 0) {
        const note =
          '1.4.1: fixes the time zone on the customer details page; verified on Staging.';
        try {
          await releases.requests.create(
            await releases.callerForUser(userIds.get('alex')!, 'human'),
            production.appId,
            { releaseId, note },
          );
        } catch (error) {
          if (!(error instanceof ReleasesError)) throw error;
          // The lead may not deploy there: the administrator asks, and the lead approves.
          await releases.requests.create(caller, production.appId, {
            releaseId,
            note,
          });
        }
        created('deployment requests');
      }
    } catch (error) {
      warn('The demo staging and production were not all recorded', error);
    }
  } else
    warn('The App Host is not available: no staging or production Apps', null);

  // Deployment marks: the issues whose merged change each environment runs.
  for (const spec of DEMO_DEPLOY_ISSUES) {
    const issue = issueIds.get(spec.key);
    const sha = spec.pullRequest.mergeCommitSha;
    if (!issue || !sha) continue;
    for (const role of spec.deployed ?? []) {
      const deployment = deploymentOf.get(role);
      if (!deployment) continue;
      const exists = await conn()
        .query.selectFrom('studioDeployMarks')
        .select('id')
        .where('issueId', '=', issue.id)
        .where('appId', '=', deployment.appId)
        .executeTakeFirst();
      if (exists) continue;
      const at = minutesAgo(role === 'staging' ? 235 : 60 * 24 * 2 - 10);
      await conn()
        .query.insertInto('studioDeployMarks')
        .values({
          id: randomUUID(),
          issueId: issue.id,
          projectId: issue.projectId,
          appId: deployment.appId,
          environmentId: deployment.environmentId,
          role,
          status: 'deployed',
          sha,
          deploymentId: deployment.deploymentId,
          releaseId: deployment.releaseId,
          version: deployment.version,
          checkId: null,
          withdrawnByDeploymentId: null,
          withdrawnVersion: null,
          deployedAt: at,
          createdAt: at,
          updatedAt: at,
        })
        .execute();
      created('deployment marks');
    }
  }

  // Previews, as CI makes them: `app ensure` in the Preview environment, then the pull request becomes the source.
  if (!preview || !deps.previews) {
    warn('There is no Preview environment: no previews', null);
    return summary;
  }
  for (const spec of DEMO_DEPLOY_ISSUES) {
    if (!spec.preview) continue;
    const pr = spec.pullRequest;
    const pullRequestId = pullRequestIds.get(pr.number);
    if (!pullRequestId) continue;
    try {
      await previewOf(spec, pr.number, pullRequestId);
      created('previews');
    } catch (error) {
      warn(`The demo preview of #${pr.number} was not recorded`, error);
    }
  }

  async function previewOf(
    spec: DemoDeployIssue,
    number: number,
    pullRequestId: string,
  ): Promise<void> {
    const appId = `crm-pr-${number}`;
    const sha = spec.pullRequest.headSha;
    await ensureApp({
      id: appId,
      name: appId,
      environmentId: PREVIEW_ENVIRONMENT_ID,
    });
    for (const variable of DEMO_PREVIEW_APP_VARIABLES)
      await releases!.releases.setAppVariable(caller, appId, variable.name, {
        value: variable.value,
        secret: variable.secret,
      });
    const record = await deps.previews!.claim({
      resourceId: crm!.id,
      pullRequestId,
      appId,
      environmentId: PREVIEW_ENVIRONMENT_ID,
      createdBy: deps.adminId,
    });
    if (!record) return;
    const run = 2000 + number;
    if (spec.preview === 'building') {
      const buildId = await build({
        appId,
        sha,
        ref: null,
        pullRequestId,
        state: 'building',
        run,
        minutesAgo: 3,
      });
      await updatePreview(conn(), record.id, {
        status: 'waiting',
        sha,
        buildId,
      });
      return;
    }
    const buildId = await build({
      appId,
      sha,
      ref: null,
      pullRequestId,
      state: 'succeeded',
      run,
      minutesAgo: spec.preview === 'ready' ? 50 : 20,
    });
    const releaseId = await imageRelease(appId, {
      version: `0.0.0-pr${number}.${sha.slice(0, 7)}`,
      sha,
      ref: null,
      buildId,
      run,
      ...(spec.preview === 'blocked'
        ? {
            variables: {
              schemaVersion: 1,
              variables: [
                {
                  name: DEMO_MISSING_VARIABLE.name,
                  description: DEMO_MISSING_VARIABLE.description,
                  secret: true,
                  required: true,
                  firstStartOnly: false,
                  generate: null,
                },
              ],
            },
          }
        : {}),
    });
    if (spec.preview === 'blocked') {
      // The release stays off its build: Studio's hourly reconciliation would otherwise deploy it again, and an image
      // never runs on the local App Host, so the preview would turn failed instead of waiting for its variable.
      // The admin build of the same head failed, which is why its checks are red.
      await build({
        appId: `crm-admin-pr-${number}`,
        sha,
        ref: null,
        pullRequestId,
        state: 'failed',
        run: run + 500,
        message:
          'pnpm build failed: apps/admin/src/kanban.tsx(42,7): Type error',
        minutesAgo: 18,
      });
      await updatePreview(conn(), record.id, {
        status: 'blocked',
        sha,
        buildId,
        releaseId,
        error: `${DEMO_MISSING_VARIABLE.name} is required and nothing sets it.`,
      });
      return;
    }
    await uploaded(buildId, appId, releaseId);
    const deploymentId = await deployed(appId, releaseId, {
      actorId: deps.adminId,
      minutesAgo: 45,
      admin: {
        username: 'nocobase',
        email: 'admin@example.com',
        password: 'demo-preview-password',
      },
    });
    await updatePreview(conn(), record.id, {
      status: 'ready',
      sha,
      deployedSha: sha,
      buildId,
      releaseId,
      deploymentId,
      error: null,
    });
  }

  return summary;
}
