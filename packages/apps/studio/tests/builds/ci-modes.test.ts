// @vitest-environment node
/**
 * "Configure CI" runs (`server/builds/ci-modes.ts`, the runs of `ci-setup.ts`) and where a repository's CI stands from
 * what CI reported (`ci-reports.ts`), over a real database and the GitHub stand-in (nothing reaches the network), the
 * organization's keys a stand-in:
 *
 * - a run is checked: a way Studio carries out, one application with a relative directory and an App ID, a target
 *   (pull requests, a branch or a tag pattern, and an environment), a workflow file that parses as YAML, a Git
 *   connection; then its target: the environment exists, a branch or tag's App runs there and may be configured, or
 *   may be made;
 * - `direct` proposes the standard workflow of the application and target, each later run's file joining the pull
 *   request still open; `template` writes the edited file as it is, committed to a repository Studio created once it is
 *   initialized;
 * - an App a branch or tag deploys to that exists and is not the repository's yet is recorded for it, so the key
 *   reaches it;
 * - `agent` makes the key and gives the agent an issue whose brief has the file and commands but never the key; the
 *   issue shows until it is finished;
 * - neither the way nor the application is stored, and what older versions stored is not read;
 * - each App is connected only by its own reports, listed in the environment it runs in with its last build and
 *   deploy; one removed from the list stays away until CI reports it again.
 */
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type { Row } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import { AGENT_KIND } from '../../server/agents/tx.js';
import { AccessError } from '../../server/access/errors.js';
import {
  CI_TASK_TITLE,
  parseCiRun,
  standardCiWorkflow,
} from '../../server/builds/ci-modes.js';
import { releasesForCi } from '../../server/builds/ci-provider.js';
import {
  CI_SETUP_BRANCH,
  createCiSetup,
  type CiKeys,
  type CiSetup,
} from '../../server/builds/ci-setup.js';
import { insertBuild } from '../../server/builds/store.js';
import {
  createProjectInits,
  type ProjectInits,
} from '../../server/projects-init/service.js';
import {
  recordRepositoryApp,
  repositoryApps,
} from '../../server/releases/links.js';
import {
  ciWorkflowProblems,
  type CiRunRequest,
} from '../../shared/ci-modes.js';
import type { GitConnection } from '../../shared/git.js';
import type { NewProjectRequest } from '../../shared/project-init.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

const STUDIO = 'https://studio.example.com';

let h: BridgeHarness;
let inits: ProjectInits;
let ci: CiSetup;
let connection: GitConnection;
let agentId: string;
let secrets: string[];
let created: { userId: string; appIds: readonly string[] }[];
let finished: Set<string>;
let scoped: (readonly string[])[];

const alice = () => h.viewer('alice');

function fakeKeys(): CiKeys {
  return {
    create(userId, input) {
      const secret = `fk_secret_${secrets.length + 1}`;
      secrets.push(secret);
      created.push({ userId, appIds: input.appIds });
      return Promise.resolve({ id: `key-${secrets.length}`, secret });
    },
    setApps: (_userId, _id, appIds) => {
      scoped.push(appIds);
      return Promise.resolve();
    },
    rotate() {
      const secret = `fk_secret_${secrets.length + 1}`;
      secrets.push(secret);
      return Promise.resolve({ secret });
    },
    find: (id) =>
      Promise.resolve({
        id,
        name: 'acme/shop CI',
        expiresAt: null,
        lastUsedAt: null,
        status: 'active',
        appIds: 'all',
      }),
  };
}

beforeEach(async () => {
  secrets = [];
  created = [];
  scoped = [];
  finished = new Set();
  h = await createBridgeHarness({ releases: true });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  h.roles.set('root', 'owner');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  agentId = await h.createAgent({ name: 'Coder' });
  h.github.app.installations.set('acme', '77');
  connection = await h.gitConnections.create('alice', {
    kind: 'app',
    name: 'Acme app',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    account: 'acme',
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: 'a-webhook-secret-long-enough',
  });
  for (const [id, name] of [
    ['preview', 'Preview'],
    ['staging', 'Staging'],
    ['production', 'Production'],
  ])
    await h.releases!.environments.create(SYSTEM_CALLER, {
      driver: 'fake',
      id,
      name,
      ...(id === 'production' ? { protected: true } : {}),
    });
  ci = createCiSetup({
    database: h.database,
    releases: () => releasesForCi(() => h.releases!),
    connections: () => h.gitConnections,
    keys: fakeKeys,
    inbox: () => undefined,
    administrators: () => Promise.resolve(['root']),
    studioUrl: () => STUDIO,
    tasks: () => ({
      async create(userId, input) {
        const issue = await h.projects.issues.create(h.viewer(userId), {
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          executor: { type: AGENT_KIND, id: input.agentId },
        });
        return { id: issue.id, identifier: issue.identifier };
      },
      finished: (issueId) => Promise.resolve(finished.has(issueId)),
    }),
    onError: () => undefined,
  });
  let next = 0;
  inits = createProjectInits({
    database: h.database,
    projects: () => h.projects,
    agents: () => h.agents,
    connections: () => h.gitConnections,
    git: () => h.git,
    ci: () => ci,
    viewerOf: (userId) => Promise.resolve(h.viewer(userId)),
    newId: () => `init-${(next += 1)}`,
    onError: () => undefined,
  });
});

afterEach(async () => {
  await inits.settled();
  await h.close();
});

function existingShop(ci?: CiRunRequest): NewProjectRequest {
  const repo = h.github.repos.get('acme/shop') ?? h.github.addRepo('acme/shop');
  return {
    name: 'Shop',
    codeLocation: 'existingRepo',
    existingRepo: {
      connectionId: connection.id,
      repoId: String(repo.id),
      fullName: 'acme/shop',
      cloneUrl: 'https://github.com/acme/shop.git',
      defaultBranch: 'main',
    },
    ...(ci ? { ci } : {}),
  };
}

const fileOn = (branch: string, path: string) =>
  h.github.files.get(`acme/shop@${branch}:${path}`)?.content;

const refused = (run: () => unknown, code: string) => {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(AccessError);
    expect((error as AccessError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}.`);
};

/** What `studioRepoCi.setups` holds, parsed. */
async function storedSetups(resourceId: string): Promise<unknown> {
  const row = await h.database
    .connection()
    .query.selectFrom('studioRepoCi')
    .select(['setups'])
    .where('resourceId', '=', resourceId)
    .executeTakeFirst<Row>();
  return typeof row?.setups === 'string'
    ? (JSON.parse(row.setups) as unknown)
    : row?.setups;
}

let builds = 0;
/** A build as CI reports it, `minutesAgo` minutes ago, uploaded `deployedMinutesAgo` ago when given. */
async function reportBuild(
  resourceId: string,
  input: {
    readonly appId: string;
    readonly pullRequest?: boolean;
    readonly state: 'building' | 'failed' | 'succeeded';
    readonly minutesAgo: number;
    readonly deployedMinutesAgo?: number;
  },
): Promise<void> {
  builds += 1;
  const at = new Date(Date.now() - input.minutesAgo * 60_000);
  await insertBuild(h.database.connection(), {
    id: `build-${builds}`,
    appId: input.appId,
    resourceId,
    sha: String(builds).padStart(40, 'a'),
    ref: input.pullRequest ? null : 'main',
    pullRequestId: input.pullRequest ? `pr-${builds}` : null,
    state: input.state,
    logsUrl: null,
    message: null,
    superseded: false,
    releaseId: null,
    releaseAppId: null,
    reportedBy: 'alice',
    verifiedAt: at,
    uploadedAt:
      input.deployedMinutesAgo === undefined
        ? null
        : new Date(Date.now() - input.deployedMinutesAgo * 60_000),
    createdAt: at,
    updatedAt: at,
  });
}

/** An App in release management, made by someone who may. */
async function createApp(id: string, environmentId: string): Promise<void> {
  await h.releases!.releases.createApp(
    { userId: 'root', kind: 'rule', permissions: allPermissions() },
    { id, name: id, environmentId },
  );
}

describe('a run', () => {
  it('takes one application and a target, pull requests to the Preview environment when it names none', () => {
    expect(parseCiRun({ method: 'direct' }, 'Shop.Web')).toEqual({
      method: 'direct',
      app: { directory: '.', appId: 'shop-web' },
      target: { trigger: 'pullRequest', ref: null, environmentId: 'preview' },
    });
    expect(
      parseCiRun(
        {
          method: 'direct',
          app: { directory: './apps/shop/', appId: 'shop-staging' },
          target: { trigger: 'branch', environmentId: 'staging' },
        },
        'shop',
        'trunk',
      ),
    ).toEqual({
      method: 'direct',
      app: { directory: 'apps/shop', appId: 'shop-staging' },
      // A branch target left without a branch builds the default branch, a tag target `v*`.
      target: { trigger: 'branch', ref: 'trunk', environmentId: 'staging' },
    });
    expect(
      parseCiRun(
        {
          method: 'direct',
          target: { trigger: 'tag', environmentId: 'production' },
        },
        'shop',
      ).target,
    ).toEqual({ trigger: 'tag', ref: 'v*', environmentId: 'production' });
    for (const directory of ['../shop', '/srv/shop', 'apps\\shop', 'a//b', ''])
      refused(
        () =>
          parseCiRun(
            { method: 'direct', app: { directory, appId: 'shop' } },
            'shop',
          ),
        'INVALID_CI_APP',
      );
    refused(
      () =>
        parseCiRun(
          { method: 'direct', app: { directory: '.', appId: 'Shop App' } },
          'shop',
        ),
      'INVALID_CI_APP',
    );
    for (const target of [
      { trigger: 'nightly', environmentId: 'preview' },
      { trigger: 'branch', ref: 'feature branch', environmentId: 'staging' },
      { trigger: 'tag', ref: "v'*", environmentId: 'production' },
      { trigger: 'pullRequest', environmentId: 'Bad Env' },
    ])
      refused(
        () => parseCiRun({ method: 'direct', target }, 'shop'),
        'INVALID_CI_TARGET',
      );
    refused(() => parseCiRun({ method: 'agent' }, 'shop'), 'AGENT_REQUIRED');
  });

  it('carries out only the ways Studio does: the ones done by hand are sent nowhere', () => {
    for (const method of ['manual', 'ownAgent', undefined, 'staging'])
      refused(() => parseCiRun({ method }, 'shop'), 'INVALID_CI_METHOD');
  });

  it('refuses an edited file that is not YAML, or more than one, and finds one that never signs in', () => {
    const file = (content: string) => ({
      path: '.github/workflows/nb-studio-shop-preview.yml',
      content,
    });
    for (const workflowFiles of [
      [file('on: [push\n')],
      undefined,
      [file('name: A\n'), { ...file('name: B\n'), path: '.github/x.yml' }],
    ])
      refused(
        () => parseCiRun({ method: 'template', workflowFiles }, 'shop'),
        'INVALID_CI_WORKFLOW',
      );
    expect(
      ciWorkflowProblems([
        { path: '.github/workflows/x.yml', content: 'name: X\non: push\n' },
      ]),
    ).toEqual([
      { path: '.github/workflows/x.yml', problem: 'secret' },
      { path: '.github/workflows/x.yml', problem: 'studio' },
    ]);
  });

  it('generates the workflow of each trigger, working in the application’s directory', () => {
    const generate = (
      target: Parameters<typeof standardCiWorkflow>[0]['target'],
      appId: string,
    ) =>
      standardCiWorkflow({
        studioUrl: STUDIO,
        defaultBranch: 'main',
        app: { directory: 'apps/admin', appId },
        target,
      });
    const pull = generate(
      { trigger: 'pullRequest', environmentId: 'preview' },
      'admin',
    );
    expect(pull.path).toBe('.github/workflows/nb-studio-admin-preview.yml');
    expect(pull.content).toContain('pull_request:');
    expect(pull.content).toContain("      - 'apps/admin/**'");
    expect(pull.content).not.toContain('REPOSITORY');
    expect(pull.content).toContain("working-directory: 'apps/admin'");
    expect(pull.content).toContain("# Store the repository's CI key");
    const branch = generate(
      { trigger: 'branch', ref: 'release', environmentId: 'staging' },
      'admin-staging',
    );
    expect(branch.path).toBe('.github/workflows/nb-studio-admin-staging.yml');
    expect(branch.content).toContain("branches: ['release']");
    expect(branch.content).not.toContain('paths:');
    const tag = generate(
      { trigger: 'tag', ref: 'v*', environmentId: 'production' },
      'admin',
    );
    expect(tag.path).toBe('.github/workflows/nb-studio-admin-production.yml');
    expect(tag.content).toContain("tags: ['v*']");
    expect(tag.content).toContain("APP_ID: 'admin'");
    expect(tag.content).toContain("ENVIRONMENT: 'production'");
  });

  it('needs a Git connection', async () => {
    const project = await inits.newProject(alice(), {
      name: 'Shop',
      codeLocation: 'existingRepo',
      existingRepo: {
        cloneUrl: 'https://example.com/acme/shop.git',
        defaultBranch: 'main',
      },
    });
    await expect(
      ci.configure('alice', project.resourceId!, { method: 'direct' }),
    ).rejects.toMatchObject({ code: 'CI_NEEDS_CONNECTION' });
    expect(await ci.connection(project.resourceId!, true)).toMatchObject({
      auto: false,
      connection: 'none',
      connected: false,
      reported: false,
      apps: [],
      environments: [],
    });
    expect(secrets).toEqual([]);
  });

  it('refuses a target it cannot deploy to before recording anything', async () => {
    const project = await inits.newProject(alice(), existingShop());
    const resourceId = project.resourceId!;
    await createApp('shop-live', 'production');
    await createApp('shop-qa', 'staging');
    const run = (target: unknown, app?: unknown) => ({
      method: 'direct',
      ...(app ? { app } : {}),
      target,
    });
    await expect(
      ci.configure(
        'alice',
        resourceId,
        run({ trigger: 'pullRequest', environmentId: 'nowhere' }),
      ),
    ).rejects.toMatchObject({ code: 'UNKNOWN_ENVIRONMENT' });
    // The App runs elsewhere.
    await expect(
      ci.configure(
        'alice',
        resourceId,
        run(
          { trigger: 'branch', environmentId: 'staging' },
          { directory: '.', appId: 'shop-live' },
        ),
      ),
    ).rejects.toMatchObject({ code: 'APP_IN_OTHER_ENVIRONMENT' });
    // Someone who may not have Apps set up: neither pull requests' Apps nor a missing one.
    await expect(
      ci.configure(
        'bob',
        resourceId,
        run({ trigger: 'pullRequest', environmentId: 'preview' }),
      ),
    ).rejects.toMatchObject({ code: 'APPS_NOT_CREATABLE' });
    await expect(
      ci.configure(
        'bob',
        resourceId,
        run(
          { trigger: 'branch', environmentId: 'staging' },
          { directory: '.', appId: 'shop-new' },
        ),
      ),
    ).rejects.toMatchObject({ code: 'APPS_NOT_CREATABLE' });
    // Nor an existing App they may not configure.
    await expect(
      ci.configure(
        'bob',
        resourceId,
        run(
          { trigger: 'branch', environmentId: 'staging' },
          { directory: '.', appId: 'shop-qa' },
        ),
      ),
    ).rejects.toMatchObject({ code: 'APP_NOT_CONFIGURABLE' });
    expect(secrets).toEqual([]);
    expect(await repositoryApps(h.database.connection(), resourceId)).toEqual(
      [],
    );
    expect(await ci.connection(resourceId, true)).toMatchObject({
      auto: false,
      lastError: null,
      lastFailure: null,
    });
  });
});

describe('Studio writing the workflows', () => {
  it('proposes the file of the application and target in a pull request, a later run’s file joining it (direct)', async () => {
    const project = await inits.newProject(
      alice(),
      existingShop({
        method: 'direct',
        app: { directory: '.', appId: 'shop' },
      }),
    );
    const resourceId = project.resourceId!;
    // The key starts with no App; the Apps CI's builds record widen it.
    expect(created).toEqual([{ userId: 'alice', appIds: [] }]);
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      secrets[0],
    );
    expect(
      fileOn(CI_SETUP_BRANCH, '.github/workflows/nb-studio-shop-preview.yml'),
    ).toContain('# Studio keeps the repository secret');
    expect(h.github.pull('acme/shop', 1)).toMatchObject({
      title: 'Add Studio CI workflows',
    });
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'pr-open',
      pullRequest: { number: 1 },
      reported: false,
      apps: [],
    });
    // A branch to staging, its App made by `app ensure`: its file joins the open pull request.
    await ci.configure('alice', resourceId, {
      method: 'direct',
      app: { directory: '.', appId: 'shop-staging' },
      target: { trigger: 'branch', environmentId: 'staging' },
    });
    expect(
      fileOn(CI_SETUP_BRANCH, '.github/workflows/nb-studio-shop-staging.yml'),
    ).toContain("branches: ['main']");
    expect(
      fileOn(CI_SETUP_BRANCH, '.github/workflows/nb-studio-shop-preview.yml'),
    ).toContain('pull_request:');
    expect(() => h.github.pull('acme/shop', 2)).toThrow();
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'pr-open',
      pullRequest: { number: 1 },
      workflowPaths: [
        '.github/workflows/nb-studio-shop-preview.yml',
        '.github/workflows/nb-studio-shop-staging.yml',
      ],
    });
    expect(await storedSetups(resourceId)).toEqual({
      preview: { taskIssueId: null, taskIdentifier: null, pendingFiles: null },
    });
    // Merged: the run's outcome is settled, and the CI waits for its first report.
    h.github.merge('acme/shop', 1, 'alice-gh');
    expect(await ci.connection(resourceId, true)).toMatchObject({
      state: 'configured',
      connection: 'none',
    });
    await reportBuild(resourceId, {
      appId: 'shop-pr-2',
      pullRequest: true,
      state: 'succeeded',
      minutesAgo: 5,
    });
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'connected',
      reported: true,
    });
  });

  it('records an App a tag deploys to as the repository’s, so the key reaches it', async () => {
    await createApp('shop-prod', 'production');
    const project = await inits.newProject(
      alice(),
      existingShop({
        method: 'direct',
        app: { directory: '.', appId: 'shop-prod' },
        target: { trigger: 'tag', environmentId: 'production' },
      }),
    );
    const resourceId = project.resourceId!;
    expect(
      fileOn(CI_SETUP_BRANCH, '.github/workflows/nb-studio-shop-prod.yml'),
    ).toBeUndefined();
    const file = fileOn(
      CI_SETUP_BRANCH,
      '.github/workflows/nb-studio-shop-prod-production.yml',
    );
    expect(file).toContain("tags: ['v*']");
    expect(file).toContain("APP_ID: 'shop-prod'");
    expect(
      (await repositoryApps(h.database.connection(), resourceId)).map(
        (link) => [link.appId, link.role, link.environmentId],
      ),
    ).toEqual([['shop-prod', 'production', 'production']]);
    // Made with the App: the key reaches it at once.
    expect(created).toEqual([{ userId: 'alice', appIds: ['shop-prod'] }]);
    const view = await ci.connection(resourceId, true);
    expect(view.apps).toEqual([
      {
        environmentId: 'production',
        appId: 'shop-prod',
        pullRequests: false,
        lastBuildAt: null,
        lastBuildState: null,
        lastDeployAt: null,
        connected: false,
      },
    ]);
    expect(view.environments).toEqual([
      {
        id: 'production',
        name: 'Production',
        protected: true,
      },
    ]);
  });

  it('writes the edited file as it is (template)', async () => {
    const edited =
      'name: Shop preview\non:\n  pull_request:\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo build\n';
    const project = await inits.newProject(
      alice(),
      existingShop({
        method: 'template',
        workflowFiles: [
          {
            path: '.github/workflows/nb-studio-shop-preview.yml',
            content: edited,
          },
        ],
      }),
    );
    expect(
      fileOn(CI_SETUP_BRANCH, '.github/workflows/nb-studio-shop-preview.yml'),
    ).toBe(edited);
    expect(await ci.connection(project.resourceId!, true)).toMatchObject({
      connection: 'pr-open',
    });
  });

  it('commits the edited file to a repository Studio created once it is initialized (template)', async () => {
    const edited =
      'name: Shop preview\non:\n  pull_request:\nenv:\n  KEY: ${{ secrets.NB_STUDIO_API_KEY }}\n  REPO: acme/shop\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - run: nb-studio build status\n';
    const project = await inits.newProject(alice(), {
      name: 'Shop',
      initAgentId: agentId,
      codeLocation: 'newRepo',
      newRepo: {
        connectionId: connection.id,
        name: 'shop',
        private: true,
        init: { method: 'prompt', prompt: 'A shop.' },
      },
      ci: {
        method: 'template',
        workflowFiles: [
          {
            path: '.github/workflows/nb-studio-shop-preview.yml',
            content: edited,
          },
        ],
      },
    });
    const resourceId = project.resourceId!;
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'pending',
      key: null,
    });
    // A second run waits with the first.
    await ci.configure('alice', resourceId, {
      method: 'direct',
      app: { directory: '.', appId: 'shop-staging' },
      target: { trigger: 'branch', environmentId: 'staging' },
    });
    const payload = await h.claimOne();
    h.github.repos.get('acme/shop')!.empty = false;
    await inits.repoEvent({
      type: 'push',
      repoId: 'r',
      repo: 'acme/shop',
      branch: 'main',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
    });
    await inits.runChanged(payload.run.id as string, 'completed');
    await inits.settled();
    // Edited before the repository existed, it is committed as it was.
    expect(fileOn('main', '.github/workflows/nb-studio-shop-preview.yml')).toBe(
      edited,
    );
    expect(
      fileOn('main', '.github/workflows/nb-studio-shop-staging.yml'),
    ).toContain('nb-studio deploy --app "$APP_ID" --file');
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      secrets[0],
    );
    expect(await ci.connection(resourceId, true)).toMatchObject({
      state: 'configured',
      connection: 'none',
    });
    expect(await storedSetups(resourceId)).toMatchObject({
      preview: { pendingFiles: null },
    });
  });

  it('connects a NocoBase application’s preview CI with it, committed before its branch is protected', async () => {
    const project = await inits.newProject(alice(), {
      name: 'Shop',
      initAgentId: agentId,
      codeLocation: 'newRepo',
      newRepo: {
        connectionId: connection.id,
        name: 'shop',
        private: true,
        init: { method: 'nocobase', template: 'default' },
      },
    });
    const resourceId = project.resourceId!;
    // The standard workflow of the root application, pull requests to Preview, waits for the first commit.
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'pending',
    });
    expect(h.github.repos.get('acme/shop')?.protected).toBe(false);
    const payload = await h.claimOne();
    h.github.repos.get('acme/shop')!.empty = false;
    await inits.repoEvent({
      type: 'push',
      repoId: 'r',
      repo: 'acme/shop',
      branch: 'main',
      created: true,
      before: '0'.repeat(40),
      after: 'abc',
    });
    await inits.runChanged(payload.run.id as string, 'completed');
    await inits.settled();
    const file = fileOn('main', '.github/workflows/nb-studio-shop-preview.yml');
    expect(file).toContain('pull_request');
    expect(file).not.toContain(resourceId);
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      secrets[0],
    );
    expect(h.github.repos.get('acme/shop')?.protected).toBe(true);
    expect(await inits.view(alice(), project.projectId)).toMatchObject({
      state: 'done',
      branchProtected: true,
    });
  });

  it('names each file for its target, another target of the same name taking its trigger', async () => {
    const project = await inits.newProject(alice(), existingShop());
    const resourceId = project.resourceId!;
    const run = (trigger: 'branch' | 'tag') =>
      ci.configure('alice', resourceId, {
        method: 'direct',
        app: { directory: '.', appId: 'shop-production' },
        target: { trigger, environmentId: 'production' },
      });
    await run('tag');
    // The App ID's environment and the environment's name meet once.
    const tagFile = fileOn(
      CI_SETUP_BRANCH,
      '.github/workflows/nb-studio-shop-production.yml',
    );
    expect(tagFile).toContain("tags: ['v*']");
    await run('branch');
    expect(
      fileOn(
        CI_SETUP_BRANCH,
        '.github/workflows/nb-studio-shop-production-branch.yml',
      ),
    ).toContain("branches: ['main']");
    // Again for the tag: its own file, replaced in place.
    await run('tag');
    expect((await ci.connection(resourceId, true)).workflowPaths).toEqual([
      '.github/workflows/nb-studio-shop-production.yml',
      '.github/workflows/nb-studio-shop-production-branch.yml',
    ]);
    expect(
      fileOn(
        CI_SETUP_BRANCH,
        '.github/workflows/nb-studio-shop-production.yml',
      ),
    ).toContain("tags: ['v*']");
  });

  it('keeps acting as whoever first set the repository’s CI up', async () => {
    const project = await inits.newProject(
      alice(),
      existingShop({ method: 'direct' }),
    );
    const resourceId = project.resourceId!;
    h.roles.set('bob', 'admin');
    await ci.configure('bob', resourceId, {
      method: 'direct',
      app: { directory: '.', appId: 'shop-staging' },
      target: { trigger: 'branch', environmentId: 'staging' },
    });
    const row = await h.database
      .connection()
      .query.selectFrom('studioRepoCi')
      .select(['createdBy'])
      .where('resourceId', '=', resourceId)
      .executeTakeFirst<Row>();
    expect(row?.createdBy).toBe('alice');
  });

  it('records a refusal on a new project’s repository rather than losing it', async () => {
    await createApp('shop-live', 'production');
    const project = await inits.newProject(
      alice(),
      existingShop({
        method: 'direct',
        app: { directory: '.', appId: 'shop-live' },
        target: { trigger: 'branch', environmentId: 'staging' },
      }),
    );
    expect(await ci.connection(project.resourceId!, true)).toMatchObject({
      state: 'manual',
      lastError: 'shop-live runs in production, not staging.',
      lastFailure: {
        reason: 'appInOtherEnvironment',
        params: {
          appId: 'shop-live',
          environmentId: 'staging',
          actualEnvironmentId: 'production',
        },
      },
    });
    expect(secrets).toEqual([]);
  });
});

describe('an agent connecting the CI', () => {
  it('gets an issue whose brief has the file and commands but never the key, shown until it is finished', async () => {
    const project = await inits.newProject(
      alice(),
      existingShop({ method: 'agent', agentId }),
    );
    const resourceId = project.resourceId!;
    const view = await ci.connection(resourceId, true);
    expect(view).toMatchObject({
      state: 'configured',
      connection: 'task',
      task: { issueId: expect.any(String) },
    });
    // The key is the repository's secret; nothing is written to the repository.
    expect(h.github.openSecret('acme/shop', 'NB_STUDIO_API_KEY')).toBe(
      secrets[0],
    );
    expect(h.github.files.size).toBe(0);
    const issue = await h.projects.issueQueries.detail(
      alice(),
      view.task!.issueId,
    );
    expect(issue).toMatchObject({
      title: `${CI_TASK_TITLE}: acme/shop`,
      executor: { type: AGENT_KIND, id: agentId },
    });
    expect(view.task!.identifier).toBe(issue.identifier);
    const brief = issue.description ?? '';
    expect(brief).toContain('.github/workflows/nb-studio-shop-preview.yml');
    expect(brief).toContain(
      'nb-studio app ensure "shop-pr-$PR" --environment preview\n',
    );
    expect(brief).toContain(
      'nb-studio deploy --app "shop-pr-$PR" --file storage/exports/dist.tar.gz',
    );
    // Nothing names the repository by its ID in Studio.
    expect(brief).not.toContain(resourceId);
    expect(brief).toContain('`NB_STUDIO_API_KEY` already holds');
    for (const secret of secrets) expect(brief).not.toContain(secret);
    // Finished: nothing is awaited any more.
    finished.add(view.task!.issueId);
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'none',
      task: null,
    });
  });

  it('is told the branch, environment and App of a branch target', async () => {
    const project = await inits.newProject(alice(), existingShop());
    const resourceId = project.resourceId!;
    await ci.configure('alice', resourceId, {
      method: 'agent',
      agentId,
      app: { directory: 'apps/web', appId: 'web-staging' },
      target: { trigger: 'branch', ref: 'develop', environmentId: 'staging' },
    });
    const view = await ci.connection(resourceId, true);
    const brief =
      (await h.projects.issueQueries.detail(alice(), view.task!.issueId))
        .description ?? '';
    expect(brief).toContain('for the branch `develop`');
    expect(brief).toContain('environment `staging`');
    expect(brief).toContain('- Directory: `apps/web`');
    expect(brief).toContain('.github/workflows/nb-studio-web-staging.yml');
    expect(brief).toContain(
      'nb-studio app ensure web-staging --environment staging\n',
    );
  });

  it('gives way to a later run’s outcome', async () => {
    const project = await inits.newProject(
      alice(),
      existingShop({ method: 'agent', agentId }),
    );
    const resourceId = project.resourceId!;
    await ci.configure('alice', resourceId, { method: 'direct' });
    expect(await ci.connection(resourceId, true)).toMatchObject({
      connection: 'pr-open',
      task: null,
    });
  });
});

describe('where the CI stands', () => {
  it('lists each App in the environment it runs in, connected only by its own reports', async () => {
    const project = await inits.newProject(alice(), existingShop());
    const resourceId = project.resourceId!;
    const conn = h.database.connection();
    await createApp('crm-staging', 'staging');
    await createApp('crm', 'production');
    // Named without a `-staging` suffix, it still runs in staging.
    await createApp('crm-qa', 'staging');
    // Recorded for the repository in a role, by CI or by hand: crm was never reported.
    for (const [appId, role] of [
      ['crm-staging', 'staging'],
      ['crm', 'production'],
    ] as const)
      await recordRepositoryApp(conn, {
        resourceId,
        appId,
        role,
        environmentId: role,
        by: 'alice',
        newId: () => `link-${appId}`,
      });
    await reportBuild(resourceId, {
      appId: 'crm-pr-12',
      pullRequest: true,
      state: 'succeeded',
      minutesAgo: 30,
      deployedMinutesAgo: 25,
    });
    await reportBuild(resourceId, {
      appId: 'crm-pr-15',
      pullRequest: true,
      state: 'failed',
      minutesAgo: 10,
    });
    await reportBuild(resourceId, {
      appId: 'crm-qa',
      state: 'building',
      minutesAgo: 20,
    });
    await reportBuild(resourceId, {
      appId: 'crm-staging',
      state: 'succeeded',
      minutesAgo: 60,
      deployedMinutesAgo: 55,
    });
    const view = await ci.connection(resourceId, true);
    expect(view.connection).toBe('connected');
    expect(view.apps).toEqual([
      {
        environmentId: 'preview',
        appId: 'crm',
        pullRequests: true,
        lastBuildAt: expect.any(String),
        lastBuildState: 'failed',
        lastDeployAt: expect.any(String),
        connected: true,
      },
      {
        environmentId: 'staging',
        appId: 'crm-qa',
        pullRequests: false,
        lastBuildAt: expect.any(String),
        lastBuildState: 'building',
        lastDeployAt: null,
        connected: true,
      },
      {
        environmentId: 'staging',
        appId: 'crm-staging',
        pullRequests: false,
        lastBuildAt: expect.any(String),
        lastBuildState: 'succeeded',
        lastDeployAt: expect.any(String),
        connected: true,
      },
      {
        environmentId: 'production',
        appId: 'crm',
        pullRequests: false,
        lastBuildAt: null,
        lastBuildState: null,
        lastDeployAt: null,
        connected: false,
      },
    ]);
    // The pull requests' last build is the newest of theirs, their deploy the last upload of any.
    const pulls = view.apps[0]!;
    expect(Date.parse(pulls.lastBuildAt!)).toBeGreaterThan(
      Date.parse(pulls.lastDeployAt!),
    );
    expect(
      view.environments.map((environment) => environment.id).sort(),
    ).toEqual(['preview', 'production', 'staging']);
  });

  it('takes an App off the list until CI reports it again, narrowing the key', async () => {
    const project = await inits.newProject(
      alice(),
      existingShop({ method: 'direct' }),
    );
    const resourceId = project.resourceId!;
    const conn = h.database.connection();
    await createApp('crm-staging', 'staging');
    await recordRepositoryApp(conn, {
      resourceId,
      appId: 'crm-staging',
      role: 'staging',
      environmentId: 'staging',
      by: 'alice',
      newId: () => 'link-crm-staging',
    });
    await reportBuild(resourceId, {
      appId: 'crm-staging',
      state: 'succeeded',
      minutesAgo: 60,
    });
    await reportBuild(resourceId, {
      appId: 'crm-pr-12',
      pullRequest: true,
      state: 'succeeded',
      minutesAgo: 30,
    });
    const listed = async () =>
      (await ci.connection(resourceId, true)).apps.map((app) => [
        app.environmentId,
        app.appId,
        app.pullRequests,
      ]);
    expect(await listed()).toEqual([
      ['preview', 'crm', true],
      ['staging', 'crm-staging', false],
    ]);
    expect(
      await ci.removeApp('alice', resourceId, {
        environmentId: 'staging',
        appId: 'crm-staging',
        pullRequests: false,
      }),
    ).toBe(true);
    expect(
      await ci.removeApp('alice', resourceId, {
        environmentId: 'preview',
        appId: 'crm',
        pullRequests: true,
      }),
    ).toBe(true);
    // Not listed (any more): nothing to remove.
    expect(
      await ci.removeApp('alice', resourceId, {
        environmentId: 'staging',
        appId: 'crm-staging',
        pullRequests: false,
      }),
    ).toBe(false);
    expect(await listed()).toEqual([]);
    // The link is gone, and the key reaches only the Apps left.
    expect(await repositoryApps(conn, resourceId)).toEqual([]);
    expect(scoped.at(-1)).toEqual([]);
    // CI reports them again: they come back.
    await reportBuild(resourceId, {
      appId: 'crm-staging',
      state: 'building',
      minutesAgo: -1,
    });
    await reportBuild(resourceId, {
      appId: 'crm-pr-13',
      pullRequest: true,
      state: 'building',
      minutesAgo: -1,
    });
    expect(await listed()).toEqual([
      ['preview', 'crm', true],
      ['staging', 'crm-staging', false],
    ]);
  });

  it('reads nothing of what older versions stored, and the next run drops it', async () => {
    const project = await inits.newProject(alice(), existingShop());
    const resourceId = project.resourceId!;
    await h.database
      .connection()
      .query.insertInto('studioRepoCi')
      .values({
        resourceId,
        auto: false,
        state: 'disabled',
        setups: JSON.stringify({
          preview: {
            mode: 'direct',
            apps: [{ directory: '.', appId: 'shop', mode: 'manual' }],
            workflowFiles: null,
            agentId: null,
            taskIssueId: null,
            taskIdentifier: null,
            proposedFiles: [],
          },
        }),
        createdBy: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const view = await ci.connection(resourceId, true);
    expect(view).toMatchObject({ connection: 'none', apps: [], task: null });
    expect(view).not.toHaveProperty('mode');
    await ci.configure('alice', resourceId, { method: 'direct' });
    expect(await storedSetups(resourceId)).toEqual({
      preview: { taskIssueId: null, taskIdentifier: null, pendingFiles: null },
    });
  });
});
