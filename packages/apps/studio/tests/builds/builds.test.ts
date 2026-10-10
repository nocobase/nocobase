// @vitest-environment node
/**
 * CI builds and the Apps they deploy to, over a real database, release management on an in-memory driver and the
 * GitHub stand-in (nothing reaches the network). A deployment does not know what it is for: CI reports a build of an
 * App at a commit (`build status`), makes sure of the App in its environment (`app ensure`) and uploads and deploys the
 * archive in one (`deploy --file`), or deploys a release by its id (`deploy --release`). Studio verifies that each
 * commit belongs to the repository, keeps one build per App and commit (a second upload answers the same release),
 * supersedes the builds of a pull request's older heads, promotes what another App of the repository already holds
 * of the same bytes, records the Apps it deploys as the repository's in the role their environment gives them, and
 * makes an App `app ensure` made whose first deployment is an open pull request's head that pull request's preview,
 * removed once it is merged or closed. The preview workflows Studio writes are generated per application.
 */
import { createDistRoutes } from '@nocobase/app-plugin-agents/testing';
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import type { Caller } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  ciWorkflow,
  cliResolvePath,
  ciWorkflowFile,
} from '../../server/builds/ci-workflow.js';
import type { InboxSend } from '../../server/inbox/port.js';
import { findRepo } from '../../server/git/store.js';
import { previewsOfPullRequests } from '../../server/previews/store.js';
import {
  bindReleasesInbox,
  releaseFacts,
} from '../../server/releases/inbox.js';
import type { RepositoryAppLink } from '../../shared/releases.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API, bindingOf, tokenConnection } from '../git/helpers.js';
import { createArtifact } from '../releases/fixtures.js';

const REPO = 'acme/shop';

const declared = (
  name: string,
  rest: Record<string, unknown> = {},
): Record<string, unknown> => ({
  name,
  secret: false,
  required: false,
  firstStartOnly: false,
  generate: null,
  ...rest,
});
/** A build that lets a deployment generate its first administrator. */
const ADMIN_MANIFEST = {
  schemaVersion: 1,
  variables: [
    declared('INITIAL_ADMIN_PASSWORD', {
      path: 'users.initialAdmin.password',
      secret: true,
      firstStartOnly: true,
      generate: 'password',
    }),
  ],
};
/** One that also needs a password nothing sets. */
const SMTP_MANIFEST = {
  schemaVersion: 1,
  variables: [
    ...ADMIN_MANIFEST.variables,
    declared('SMTP_PASSWORD', {
      path: 'notification.smtp.password',
      secret: true,
      required: true,
      description: 'The SMTP password.',
    }),
  ],
};
const HEAD1 = 'a1'.repeat(20);
const HEAD2 = 'b2'.repeat(20);
const MAIN = 'c3'.repeat(20);
const TAGGED = 'd4'.repeat(20);
const STRAY = 'e5'.repeat(20);
const FEATURE = 'f6'.repeat(20);
const MAIN2 = 'c7'.repeat(20);
const MAIN3 = 'c8'.repeat(20);

let h: BridgeHarness;
let dir: string;
let projectId: string;
let resourceId: string;

const alice = () => h.viewer('alice');
const person = (userId: string): Caller => ({
  userId,
  kind: 'human',
  permissions: allPermissions(),
});
/** The CI's credential: an API key of an administrator, as release management sees it. */
const ci = () => h.releases!.callerForUser('ci', 'key');

async function waitFor<T>(
  read: () => Promise<T>,
  ok: (value: T) => boolean,
  what: string,
): Promise<T> {
  const deadline = Date.now() + 5000;
  for (;;) {
    const value = await read();
    if (ok(value)) return value;
    if (Date.now() > deadline)
      throw new Error(
        `Timed out waiting for ${what}: ${JSON.stringify(value)}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** One poll of the repository, as the poller makes it. */
async function poll(): Promise<void> {
  await h.git.syncRepos();
  await h.git.pollRepo((await findRepo(h.database.connection(), API, REPO))!);
}

/** The previews of the pull request numbered `number`. */
async function prPreviews(number: number) {
  const conn = h.database.connection();
  const prs = await conn.query
    .selectFrom('studioPullRequests')
    .select('id')
    .where('number', '=', number)
    .execute();
  return previewsOfPullRequests(
    conn,
    prs.map((row) => String(row.id)),
  );
}

async function saveLinks(apps: readonly RepositoryAppLink[]) {
  return h.links!.save(
    { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
    resourceId,
    { apps },
  );
}

async function readLinks() {
  return h.links!.read(
    { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
    resourceId,
  );
}

/** `nb-studio build status`. */
async function report(
  appId: string,
  sha: string,
  state = 'building',
  extra: { readonly logsUrl?: string; readonly message?: string } = {},
) {
  return h.builds!.report(await ci(), {
    appId,
    sha,
    state,
    repository: REPO,
    ...extra,
  });
}

/** `nb-studio app ensure`. */
async function ensure(appId: string, environmentId: string) {
  return h.builds!.ensure(await ci(), appId, {
    environmentId,
    repository: REPO,
  });
}

/** Streams an archive to a ticket, as the CLI does. */
async function stream(
  ticket: {
    readonly url: string;
    readonly headers: Readonly<Record<string, string>>;
  },
  version: string,
  archive?: Uint8Array,
) {
  const bytes = archive ?? (await createArtifact(dir, version)).bytes;
  const buildId = /\/api\/builds\/([^/]+)\/uploadArtifact$/u.exec(
    ticket.url,
  )![1]!;
  const token = ticket.headers.authorization!.replace(/^Bearer /u, '');
  return h.builds!.receive(
    decodeURIComponent(buildId),
    token,
    (async function* () {
      yield new Uint8Array(bytes);
    })(),
  );
}

/** `nb-studio deploy --app --sha --file`: a ticket, the archive streamed to it, and the release deployed. */
async function deployFile(
  appId: string,
  sha: string,
  version: string,
  archive?: Uint8Array,
) {
  const answer = await h.builds!.deploy(
    await ci(),
    { appId, sha, file: 'dist.tar.gz', repository: REPO },
    '',
  );
  if (!('ticket' in answer)) throw new Error('No upload ticket.');
  return stream(answer.ticket, version, archive);
}

/** `nb-studio release upload`: the archive uploaded alone. */
async function uploadOnly(
  appId: string,
  sha: string,
  version: string,
  archive?: Uint8Array,
) {
  const { ticket } = await h.builds!.ticket(
    await ci(),
    { appId, sha, repository: REPO },
    '',
  );
  return stream(ticket, version, archive);
}

/** `nb-studio deploy --app --release`. */
async function deployRelease(appId: string, releaseId: string) {
  const answer = await h.builds!.deploy(await ci(), { appId, releaseId }, '');
  if (!('outcome' in answer)) throw new Error('No outcome.');
  return answer.outcome;
}

/** An issue whose open pull request, on its agent branch, has `sha` as its head. */
async function issueWithPull(title: string, number: number, sha: string) {
  const issue = await h.projects.issues.create(alice(), { title, projectId });
  h.github.addPull(REPO, {
    number,
    title,
    head: { ref: `agent/${issue.identifier}`, sha },
    base: { ref: 'main' },
  });
  return issue;
}

async function move(issue: Issue, statusKey: string): Promise<void> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'studio-builds-'));
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'bob', 'ci']) await h.addUser(id);
  h.roles.set('ci', 'admin');
  const releases = h.releases!;
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'preview',
    name: 'Preview',
    driver: 'fake',
    config: {},
    maxApps: 10,
    defaultIdleStopMinutes: 10,
    defaultDormantAfterHours: 24,
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'staging',
    name: 'Staging',
    driver: 'fake',
    config: {},
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'production',
    name: 'Production',
    driver: 'fake',
    config: {},
    protected: true,
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'sandbox',
    name: 'Sandbox',
    driver: 'fake',
    config: {},
  });
  for (const [id, environmentId] of [
    ['web', 'staging'],
    ['api', 'staging'],
    ['web-prod', 'production'],
  ] as const)
    await releases.releases.createApp(person('alice'), {
      id,
      name: id.toUpperCase(),
      environmentId,
    });
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  h.roles.set('alice', 'admin');
  const software = (await h.projects.workflows.list(alice())).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(alice(), software.id);
  const project = await h.projects.projects.create(alice(), {
    name: 'Shop',
    visibility: 'members',
  });
  projectId = project.id;
  const connection = await tokenConnection(h);
  const repo = await h.projects.projects.addResource(alice(), projectId, {
    type: 'gitRepo',
    url: `https://github.com/${REPO}.git`,
    defaultRef: 'main',
    binding: bindingOf(connection, REPO),
  } as never);
  resourceId = repo.id;
  h.github.addRepo(REPO);
  h.github.pushCommits(REPO, 'main', MAIN);
  h.github.tag(REPO, 'v1.0.0', TAGGED);
  await saveLinks([
    { appId: 'web', role: 'staging', previewEnvironmentId: 'preview' },
    { appId: 'api', role: null, previewEnvironmentId: 'preview' },
    { appId: 'web-prod', role: 'production', previewEnvironmentId: null },
  ]);
});

afterEach(async () => {
  await h.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('linking Apps to a repository', () => {
  it('links only existing Apps and preview environments', async () => {
    await expect(
      saveLinks([{ appId: 'web', role: null, previewEnvironmentId: 'nope' }]),
    ).rejects.toMatchObject({ code: 'UNKNOWN_ENVIRONMENT' });
    await expect(
      saveLinks([{ appId: 'nope', role: null, previewEnvironmentId: null }]),
    ).rejects.toMatchObject({ code: 'UNKNOWN_APP' });
    const read = await h.links!.read(
      { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
      resourceId,
    );
    expect(read).toMatchObject({
      repo: REPO,
      defaultBranch: 'main',
      apps: [
        { appId: 'web', role: 'staging' },
        { appId: 'api', role: null, previewEnvironmentId: 'preview' },
        { appId: 'web-prod', role: 'production' },
      ],
    });
  });

  it('creates no App for previews when only previews are asked for: CI deploys them', async () => {
    const before = (
      await h.releases!.releases.listApps(person('alice'), { pageSize: 100 })
    ).items.map((item) => item.app.id);
    const saved = await h.links!.save(
      { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
      resourceId,
      {
        apps: [],
        plan: {
          previewEnvironmentId: 'preview',
          stagingEnvironmentId: null,
          productionEnvironmentId: null,
          configureCi: false,
        },
      },
    );
    expect(saved.apps).toEqual([]);
    expect(
      (
        await h.releases!.releases.listApps(person('alice'), { pageSize: 100 })
      ).items.map((item) => item.app.id),
    ).toEqual(before);
  });
});

describe('the CI workflows', () => {
  const base = {
    studioUrl: 'https://studio.example.com',
    repositoryName: 'shop',
    defaultBranch: 'main',
  };

  it('writes one preview workflow for a single application at the root: build status, app ensure, deploy', () => {
    const workflow = ciWorkflow(base);
    expect(workflow.secret).toBe('NB_STUDIO_API_KEY');
    expect(workflow.files.map((file) => file.path)).toEqual([
      '.github/workflows/nb-studio-shop-preview.yml',
    ]);
    const yaml = workflow.files[0]!.content;
    // Previews only: no push, no tags, and no paths filter for the root application.
    expect(yaml).toContain(
      'on:\n  pull_request:\n    types: [opened, synchronize, reopened]\npermissions:',
    );
    expect(yaml).not.toContain('push:');
    expect(yaml).not.toContain('paths:');
    expect(yaml).not.toContain('--purpose');
    expect(yaml).not.toContain('--pr ');
    expect(yaml).not.toContain('release upload');
    // Neither the repository nor the commit: the CLI reads them from the run.
    expect(yaml).not.toContain('REPOSITORY');
    expect(yaml).not.toContain('--sha');
    expect(yaml).not.toContain('SHA:');
    // The pull request's own App, in the preview environment.
    expect(yaml).toContain(
      "APP_ID: 'shop-pr-${{ github.event.pull_request.number }}'",
    );
    expect(yaml).toContain("ENVIRONMENT: 'preview'");
    // The pull request's head is checked out, not GitHub's merge commit.
    expect(yaml).toContain(
      '      - uses: actions/checkout@v4\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}',
    );
    const named = '--app "$APP_ID"';
    const steps = [
      `nb-studio build status ${named} --state building --logs "$LOGS"`,
      'pnpm build --target linux-x64 --tar',
      'nb-studio app ensure "$APP_ID" --environment "$ENVIRONMENT"',
      `nb-studio deploy ${named} --file storage/exports/dist.tar.gz`,
      `nb-studio build status ${named} --state failed --logs "$LOGS"`,
    ];
    // In this order.
    const at = steps.map((step) => yaml.indexOf(step));
    expect(at.every((index) => index > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(yaml).toContain(
      'group: nb-studio-shop-preview-${{ github.event.pull_request.number }}',
    );
    expect(yaml).toContain('${{ secrets.NB_STUDIO_API_KEY }}');
    expect(yaml).toContain("NB_STUDIO_URL: 'https://studio.example.com'");
    expect(yaml).not.toContain('working-directory');
  });

  it('writes a workflow per application, each previewing only the pull requests that touch it', () => {
    const workflow = ciWorkflow({
      ...base,
      apps: [
        { directory: './apps/web/', appId: 'web' },
        { directory: 'apps/admin', appId: 'admin' },
      ],
    });
    expect(workflow.files.map((file) => file.path)).toEqual([
      '.github/workflows/nb-studio-web-preview.yml',
      '.github/workflows/nb-studio-admin-preview.yml',
    ]);
    const [web, admin] = workflow.files.map((file) => file.content);
    // GitHub's own paths filter: the application's directory, the files every application shares, the workflow.
    expect(web).toContain(
      [
        '  pull_request:',
        '    types: [opened, synchronize, reopened]',
        '    paths:',
        "      - 'apps/web/**'",
        "      - 'pnpm-lock.yaml'",
        "      - 'pnpm-workspace.yaml'",
        "      - 'package.json'",
        "      - '.github/workflows/nb-studio-web-preview.yml'",
      ].join('\n'),
    );
    expect(admin).toContain("      - 'apps/admin/**'");
    expect(admin).not.toContain('apps/web/**');
    // Each builds in its own directory and deploys its own pull request App.
    expect(web).toContain("        working-directory: 'apps/web'");
    expect(web).toContain(
      "APP_ID: 'web-pr-${{ github.event.pull_request.number }}'",
    );
    expect(admin).toContain("        working-directory: 'apps/admin'");
    expect(admin).toContain(
      "APP_ID: 'admin-pr-${{ github.event.pull_request.number }}'",
    );
    expect(admin).toContain("package_json_file: 'apps/admin/package.json'");
    expect(web).not.toContain('push:');
  });

  it('writes a branch or a tag target with the same three commands, to the App and environment named', () => {
    const app = { directory: 'apps/web', appId: 'web-staging' };
    const staging = ciWorkflowFile({
      ...base,
      app,
      target: { trigger: 'branch', ref: 'develop', environmentId: 'staging' },
    });
    // The App ID already ends with its environment: the file is named once.
    expect(staging.path).toBe('.github/workflows/nb-studio-web-staging.yml');
    const production = ciWorkflowFile({
      ...base,
      app: { directory: 'apps/web', appId: 'web' },
      target: { trigger: 'tag', ref: 'release-*', environmentId: 'live' },
    });
    expect(production.path).toBe('.github/workflows/nb-studio-web-live.yml');
    // Every push to the branch and every matching tag builds: no paths filter.
    expect(staging.content).toContain(
      "on:\n  push:\n    branches: ['develop']\npermissions:",
    );
    expect(production.content).toContain(
      "on:\n  push:\n    tags: ['release-*']\npermissions:",
    );
    expect(staging.content).not.toContain('paths:');
    expect(staging.content).not.toContain('pull_request');
    expect(staging.content).toContain("APP_ID: 'web-staging'");
    expect(staging.content).toContain("ENVIRONMENT: 'staging'");
    // A push checks out what it pushed.
    expect(staging.content).toContain(
      '      - uses: actions/checkout@v4\n      - name: Install the nb-studio CLI',
    );
    expect(staging.content).toContain('cancel-in-progress: false');
    expect(production.content).toContain("APP_ID: 'web'");
    expect(production.content).toContain("ENVIRONMENT: 'live'");
    for (const file of [staging, production]) {
      expect(file.content).toContain("        working-directory: 'apps/web'");
      expect(file.content).toContain(
        'nb-studio app ensure "$APP_ID" --environment "$ENVIRONMENT"\n',
      );
      expect(file.content).toContain(
        'nb-studio deploy --app "$APP_ID" --file storage/exports/dist.tar.gz',
      );
    }
    // Left out, a branch target builds the default branch and a tag target `v*`.
    expect(
      ciWorkflowFile({
        ...base,
        defaultBranch: 'trunk',
        app,
        target: { trigger: 'branch', environmentId: 'staging' },
      }).content,
    ).toContain("branches: ['trunk']");
    expect(
      ciWorkflowFile({
        ...base,
        app,
        target: { trigger: 'tag', environmentId: 'staging' },
      }).content,
    ).toContain("tags: ['v*']");
  });

  it('deploys pull requests to the environment chosen, filtered by the application’s paths', () => {
    const file = ciWorkflowFile({
      ...base,
      app: { directory: 'apps/admin', appId: 'admin' },
      target: { trigger: 'pullRequest', environmentId: 'review' },
    });
    expect(file.path).toBe('.github/workflows/nb-studio-admin-preview.yml');
    expect(file.content).toContain("ENVIRONMENT: 'review'");
    expect(file.content).toContain(
      "APP_ID: 'admin-pr-${{ github.event.pull_request.number }}'",
    );
    expect(file.content).toContain(
      "      - 'apps/admin/**'\n      - 'pnpm-lock.yaml'\n      - 'pnpm-workspace.yaml'\n      - 'package.json'\n      - '.github/workflows/nb-studio-admin-preview.yml'",
    );
  });

  it('installs the CLI from the route the agents plugin serves its tarballs on', async () => {
    const workflow = ciWorkflow({
      ...base,
      studioUrl: 'https://studio.example.com/main',
      cli: 'nb-studio',
    });
    const resolve = cliResolvePath('nb-studio');
    expect(workflow.files[0]!.content).toContain(
      `"$NB_STUDIO_URL${resolve}?format=env"`,
    );
    // The path reaches the plugin's resolve route: it asks for a credential rather than answering 404.
    const api = new Hono();
    api.route('/api/agents/dist', createDistRoutes(h.agents));
    const routes = api.routes.map((route) => `${route.method} ${route.path}`);
    expect(routes).toContain(
      'GET /api/agents/dist/products/:product/targets/:target',
    );
    expect((await api.request(`${resolve}?format=env`)).status).toBe(401);
    expect(
      (await api.request('/api/runners/dist/resolve/studio/linux-x64')).status,
    ).toBe(404);
  });
});

describe('verifying what CI reports', () => {
  it('records a build only for a commit of the repository, wherever it is', async () => {
    const issue = await issueWithPull('Checkout', 7, HEAD1);
    h.github.pushCommits(REPO, 'feature/spike', FEATURE);
    // Not a commit of the repository.
    await expect(report('web', STRAY)).rejects.toMatchObject({
      code: 'COMMIT_NOT_VERIFIED',
      details: { reason: 'notInRepository' },
    });
    await expect(report('web', 'a1b2c3d')).rejects.toMatchObject({
      code: 'INVALID_SHA',
    });
    // An open pull request's head, the default branch, a tag, another branch's head: all the repository's.
    expect(await report('web', MAIN)).toMatchObject({
      state: 'building',
      ref: 'main',
      pullRequest: false,
    });
    expect(await report('web-prod', TAGGED, 'queued')).toMatchObject({
      state: 'queued',
      ref: 'v1.0.0',
    });
    expect(await report('api', FEATURE)).toMatchObject({
      ref: 'feature/spike',
    });
    // A credential without upload on the App.
    await expect(
      h.builds!.report(
        {
          userId: 'bob',
          kind: 'key',
          permissions: { ...allPermissions(), scopes: {} },
        } as never,
        { appId: 'web', sha: HEAD1, state: 'building' },
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      ci().then((caller) =>
        h.builds!.report(caller, {
          appId: 'web',
          sha: MAIN,
          state: 'not-a-state',
        }),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_STATE' });

    // CI reports the pull request's App before `app ensure` makes it: shown on the issue as soon as it is made.
    const failed = await report('shop-pr-7', HEAD1, 'failed', {
      logsUrl: 'https://github.com/acme/shop/actions/runs/1',
      message: 'Type errors.',
    });
    expect(failed).toMatchObject({
      appId: 'shop-pr-7',
      state: 'failed',
      pullRequest: true,
      superseded: false,
    });
    expect((await h.previewApi!.read(alice(), issue.id)).previews).toEqual([]);
    expect(await ensure('shop-pr-7', 'preview')).toEqual({
      appId: 'shop-pr-7',
      environmentId: 'preview',
      created: true,
    });
    const view = await h.previewApi!.read(alice(), issue.id);
    expect(
      view.previews.map((preview) => [
        preview.appId,
        preview.status,
        preview.build?.state ?? null,
      ]),
    ).toEqual([['shop-pr-7', 'waiting', 'failed']]);
    expect(view.previews[0]).toMatchObject({
      sha: HEAD1,
      pullRequest: { repo: REPO, number: 7, title: 'Checkout' },
      build: {
        logsUrl: 'https://github.com/acme/shop/actions/runs/1',
        message: 'Type errors.',
      },
    });
  });
});

describe('making sure of an App', () => {
  it('makes a missing App in the environment, and is a no-op once it is there', async () => {
    expect(await ensure('shop-staging', 'staging')).toEqual({
      appId: 'shop-staging',
      environmentId: 'staging',
      created: true,
    });
    expect(await h.releases!.releases.findApp('shop-staging')).toMatchObject({
      environmentId: 'staging',
      labels: { studioEnsured: resourceId },
    });
    expect(await ensure('shop-staging', 'staging')).toMatchObject({
      created: false,
    });
    // An App that runs elsewhere is refused, and nothing moves.
    await expect(ensure('shop-staging', 'sandbox')).rejects.toMatchObject({
      code: 'APP_IN_OTHER_ENVIRONMENT',
    });
    await expect(ensure('web', 'sandbox')).rejects.toMatchObject({
      code: 'APP_IN_OTHER_ENVIRONMENT',
    });
    expect(await ensure('web', 'staging')).toMatchObject({ created: false });
    await expect(ensure('shop-x', 'nowhere')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('makes one only for a credential that may create Apps, or the repository’s CI key as whoever set it up', async () => {
    // A key limited to some Apps never creates one.
    const limited = {
      ...(await ci()),
      keyScope: {
        keyId: 'k',
        allows: () => true,
        objects: () => ['web'],
        permissions: null,
      },
    } as never;
    await expect(
      h.builds!.ensure(limited, 'shop-live', {
        environmentId: 'staging',
        repository: REPO,
      }),
    ).rejects.toMatchObject({ code: 'APPS_NOT_CREATABLE' });
    expect(await h.releases!.releases.findApp('shop-live')).toBeNull();
    // An App the credential may not see is not found, there or not.
    const nobody = {
      userId: 'bob',
      kind: 'key',
      permissions: { ...allPermissions(), scopes: {} },
    } as never;
    await expect(
      h.builds!.ensure(nobody, 'web', { environmentId: 'staging' }),
    ).rejects.toMatchObject({ status: 404 });
    // The repository's CI key makes it as the person who set the CI up.
    await h.database
      .connection()
      .query.insertInto('studioRepoCi')
      .values({
        resourceId,
        auto: true,
        state: 'configured',
        keyIdentityId: 'bob',
        secretName: 'NB_STUDIO_API_KEY',
        createdBy: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    expect(
      await h.builds!.ensure(nobody, 'shop-live', { environmentId: 'staging' }),
    ).toMatchObject({ created: true });
    expect(await h.releases!.releases.findApp('shop-live')).toMatchObject({
      createdBy: 'alice',
      createdVia: 'rule',
    });
    // Without --repository, a credential that is no repository's CI key names none.
    await expect(
      h.builds!.ensure(await ci(), 'shop-other', {
        environmentId: 'staging',
      }),
    ).rejects.toMatchObject({ code: 'REPOSITORY_REQUIRED' });
  });
});

describe('naming the repository', () => {
  /** Another project working in `repo`, through the same connection; answers its working directory. */
  async function anotherProjectIn(repo: string, name: string) {
    const row = await h.database
      .connection()
      .query.selectFrom('pmProjectResources')
      .select('bindingConnectionId')
      .where('id', '=', resourceId)
      .executeTakeFirstOrThrow();
    const project = await h.projects.projects.create(alice(), {
      name,
      visibility: 'members',
    });
    const resource = await h.projects.projects.addResource(
      alice(),
      project.id,
      {
        type: 'gitRepo',
        url: `https://github.com/${repo}.git`,
        defaultRef: 'main',
        binding: {
          provider: 'github',
          connectionId: String(row.bindingConnectionId),
          repoId: `${name}-1`,
          fullName: repo,
        },
      } as never,
    );
    return resource.id;
  }

  /** The repository's CI key: `bob`, set up by alice. */
  async function ciKeyOf(resource: string) {
    await h.database
      .connection()
      .query.insertInto('studioRepoCi')
      .values({
        resourceId: resource,
        auto: true,
        state: 'configured',
        keyIdentityId: 'bob',
        secretName: 'NB_STUDIO_API_KEY',
        createdBy: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    return {
      userId: 'bob',
      kind: 'key',
      permissions: { ...allPermissions(), scopes: {} },
    } as never;
  }

  it('finds the working directory by owner/repo, whatever its case, and refuses an unknown or malformed name', async () => {
    expect(
      await h.builds!.ensure(await ci(), 'shop-named', {
        environmentId: 'staging',
        repository: 'ACME/Shop',
      }),
    ).toMatchObject({ created: true });
    expect(await h.releases!.releases.findApp('shop-named')).toMatchObject({
      labels: { studioEnsured: resourceId },
    });
    await expect(
      h.builds!.ensure(await ci(), 'shop-nowhere', {
        environmentId: 'staging',
        repository: 'acme/nothing',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'REPOSITORY_NOT_FOUND' });
    await expect(
      h.builds!.ensure(await ci(), 'shop-nowhere', {
        environmentId: 'staging',
        repository: '390675522650122',
      }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_REPOSITORY' });
  });

  it('asks which project when several work in the repository, unless the App or the CI key tells', async () => {
    const other = await anotherProjectIn(REPO, 'Shop fork');
    await expect(
      h.builds!.ensure(await ci(), 'shop-which', {
        environmentId: 'staging',
        repository: REPO,
      }),
    ).rejects.toMatchObject({ status: 400, code: 'REPOSITORY_AMBIGUOUS' });
    // `web` is recorded for the first one.
    expect(
      await h.builds!.report(await ci(), {
        appId: 'web',
        sha: MAIN,
        state: 'building',
        repository: REPO,
      }),
    ).toMatchObject({ appId: 'web', state: 'building' });
    // The second one's CI key names its own.
    const key = await ciKeyOf(other);
    expect(
      await h.builds!.ensure(key, 'fork-staging', {
        environmentId: 'staging',
        repository: REPO,
      }),
    ).toMatchObject({ created: true });
    expect(await h.releases!.releases.findApp('fork-staging')).toMatchObject({
      labels: { studioEnsured: other },
    });
  });

  it('refuses a CI key that names another repository, and uses its own when none is named', async () => {
    await anotherProjectIn('acme/other', 'Other');
    const key = await ciKeyOf(resourceId);
    await expect(
      h.builds!.ensure(key, 'shop-elsewhere', {
        environmentId: 'staging',
        repository: 'acme/other',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'REPOSITORY_MISMATCH' });
    expect(await h.releases!.releases.findApp('shop-elsewhere')).toBeNull();
    await expect(
      h.builds!.report(key, {
        appId: 'web',
        sha: MAIN,
        state: 'building',
        repository: 'acme/other',
      }),
    ).rejects.toMatchObject({ code: 'REPOSITORY_MISMATCH' });
    expect(
      await h.builds!.ensure(key, 'shop-own', { environmentId: 'staging' }),
    ).toMatchObject({ created: true });
    expect(await h.releases!.releases.findApp('shop-own')).toMatchObject({
      labels: { studioEnsured: resourceId },
    });
  });
});

describe('deploying', () => {
  it('uploads and deploys an archive in one, records the App as the repository’s and redeploys a release by its id', async () => {
    await ensure('shop-staging', 'staging');
    const first = await deployFile('shop-staging', MAIN, '6.0.0');
    expect(first.release).toMatchObject({
      appId: 'shop-staging',
      labels: { sha: MAIN, ref: 'main', studioBuild: first.build.id },
    });
    expect(first.release!.labels).not.toHaveProperty('purpose');
    expect(first.deployed).toMatchObject({
      appId: 'shop-staging',
      environmentId: 'staging',
      releaseId: first.release!.id,
      request: null,
      preview: null,
    });
    await h.releases!.releases.waitForDeployment(
      first.deployed!.deployment!.id,
    );
    // Recorded for the repository, in the role its environment gives it.
    expect(
      (await readLinks()).apps.find((app) => app.appId === 'shop-staging'),
    ).toMatchObject({ role: 'staging' });
    // A second commit.
    h.github.pushCommits(REPO, 'main', MAIN2);
    const second = await deployFile('shop-staging', MAIN2, '6.1.0');
    await h.releases!.releases.waitForDeployment(
      second.deployed!.deployment!.id,
    );
    expect(
      (await h.releases!.releases.getApp(person('alice'), 'shop-staging'))
        .currentVersion,
    ).toBe('6.1.0');
    // A rollback: the first release by its id. In CI the commit and the repository come along from the environment,
    // and a release ignores the commit.
    const answer = await h.builds!.deploy(
      await ci(),
      {
        appId: 'shop-staging',
        releaseId: first.release!.id,
        sha: MAIN2,
        repository: REPO,
      },
      '',
    );
    if (!('outcome' in answer)) throw new Error('No outcome.');
    const rolledBack = answer.outcome;
    expect(rolledBack).toMatchObject({
      appId: 'shop-staging',
      releaseId: first.release!.id,
    });
    await h.releases!.releases.waitForDeployment(rolledBack.deployment!.id);
    expect(
      (await h.releases!.releases.getApp(person('alice'), 'shop-staging'))
        .currentVersion,
    ).toBe('6.0.0');
    // An upload alone deploys nothing.
    h.github.pushCommits(REPO, 'main', MAIN3);
    const uploaded = await uploadOnly('shop-staging', MAIN3, '6.2.0');
    expect(uploaded.deployed).toBeNull();
    expect(
      (await h.releases!.releases.getApp(person('alice'), 'shop-staging'))
        .currentVersion,
    ).toBe('6.0.0');
    // Neither an archive nor a release, or both.
    await expect(
      h.builds!.deploy(await ci(), { appId: 'shop-staging' }, ''),
    ).rejects.toMatchObject({ code: 'INVALID_DEPLOY' });
    await expect(
      h.builds!.deploy(
        await ci(),
        {
          appId: 'shop-staging',
          sha: MAIN,
          file: 'dist.tar.gz',
          releaseId: 'x',
        },
        '',
      ),
    ).rejects.toMatchObject({ code: 'INVALID_DEPLOY' });
    // An App not made yet takes `app ensure` first.
    await expect(
      deployFile('shop-missing', MAIN, '6.0.0'),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      deployRelease('shop-staging', 'missing'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('refuses a commit that does not belong to the repository, and asks for approval on a protected environment', async () => {
    await expect(deployFile('web', STRAY, '1.0.0')).rejects.toMatchObject({
      code: 'COMMIT_NOT_VERIFIED',
    });
    expect(await h.builds!.find('web', STRAY)).toBeNull();
    // CI never deploys to a protected environment: its deployment becomes a request waiting for approval.
    const uploaded = await deployFile('web-prod', TAGGED, '2.0.0');
    expect(uploaded.deployed).toMatchObject({
      deployment: null,
      request: {
        status: 'pending',
        url: expect.stringMatching(
          /^https:\/\/studio\.test\/releases\/web-prod\/requests\//,
        ),
      },
    });
    expect(await h.builds!.find('web-prod', TAGGED)).toMatchObject({
      state: 'succeeded',
    });
  });

  it('promotes what another App of the repository runs instead of storing the same archive again', async () => {
    await h.releases!.environments.update(SYSTEM_CALLER, 'production', {
      protected: false,
    });
    const { bytes } = await createArtifact(dir, '3.0.0');
    const staged = await deployFile('web', MAIN, '3.0.0', bytes);
    const settle = (received: {
      deployed: { deployment: { id: string } | null } | null;
    }) =>
      h.releases!.releases.waitForDeployment(received.deployed!.deployment!.id);
    await settle(staged);
    // The default branch's commit is tagged: production deploys the same commit, and CI's archive is the same.
    h.github.tag(REPO, 'v3.0.0', MAIN);
    const released = await deployFile('web-prod', MAIN, '3.0.0', bytes);
    expect(released.release).toMatchObject({
      appId: 'web-prod',
      checksum: staged.release!.checksum,
      sourceReleaseId: staged.release!.id,
      labels: {
        sha: MAIN,
        studioBuild: released.build.id,
        promotedBuild: staged.build.id,
      },
    });
    expect(
      (await readLinks()).apps.find((app) => app.appId === 'web-prod'),
    ).toMatchObject({ role: 'production' });
    await settle(released);
    // Another archive of a commit is a release of its own.
    const other = await deployFile('web-prod', TAGGED, '3.0.1');
    await settle(other);
    expect(other.release).toMatchObject({ sourceReleaseId: null });
    expect(other.release!.labels).not.toHaveProperty('promotedBuild');
    // A release of another App of the repository, deployed by its id: promoted into the App.
    const promoted = await deployRelease('web-prod', staged.release!.id);
    expect(promoted.releaseId).not.toBe(staged.release!.id);
    await expect(
      h.releases!.releases.waitForDeployment(promoted.deployment!.id),
    ).resolves.toMatchObject({ status: 'succeeded' });
  });

  it('asks the approvers for a production deployment in their inbox, and deploys exactly that release when approved', async () => {
    const releases = h.releases!;
    await releases.environments.update(SYSTEM_CALLER, 'production', {
      approvers: ['alice'],
    });
    const cards: InboxSend[] = [];
    const stop = bindReleasesInbox({
      events: releases.events,
      port: () => ({
        send: (notice) => {
          cards.push(notice);
          return Promise.resolve();
        },
        resolve: () => Promise.resolve(),
        withdraw: () => Promise.resolve(),
        settle: () => Promise.resolve(),
      }),
      lookup: {
        userName: (id) => Promise.resolve(id === 'ci' ? 'GitHub Actions' : id),
        environmentName: async (id) =>
          (await releases.environments.find(id))?.name ?? null,
        release: async (appId, releaseId) =>
          releaseFacts(
            await releases.releases.getRelease(SYSTEM_CALLER, appId, releaseId),
            h.database.connection(),
          ),
        requester: async (id) =>
          (await releases.requests.get(SYSTEM_CALLER, id)).requestedBy,
      },
    });
    try {
      const uploaded = await deployFile('web-prod', TAGGED, '2.1.0');
      expect(uploaded.deployed).toMatchObject({
        deployment: null,
        request: { status: 'pending' },
      });
      const card = cards.find(
        (notice) => notice.type === 'deployment_requested',
      );
      expect(card).toMatchObject({
        kind: 'decision',
        userIds: ['alice'],
        data: {
          appId: 'web-prod',
          environmentName: 'Production',
          releaseId: uploaded.release!.id,
          releaseVersion: '2.1.0',
          sha: TAGGED,
          ref: 'v1.0.0',
          requesterName: 'GitHub Actions',
          requestedVia: 'key',
        },
      });
      const approved = await releases.requests.approve(
        person('alice'),
        uploaded.deployed!.request!.id,
        undefined,
        'web-prod',
      );
      await expect(
        releases.releases.waitForDeployment(approved.deploymentId!),
      ).resolves.toMatchObject({
        releaseId: uploaded.release!.id,
        status: 'succeeded',
      });
      // The project shows what runs where, at which commit, and who approved it.
      const environments = await h.deploys!.environments(alice(), projectId);
      expect(environments.items[0]).toMatchObject({
        appId: 'web-prod',
        role: 'production',
        environmentName: 'Production',
        current: {
          releaseId: uploaded.release!.id,
          sha: TAGGED,
          deployedBy: 'ci',
          approvedBy: 'alice',
        },
      });
      // A person's deployment there, of the same release, waits for an approver too.
      const asked = await h.builds!.deploy(
        await releases.callerForUser('alice', 'human'),
        { appId: 'web-prod', releaseId: uploaded.release!.id },
        '',
      );
      expect('outcome' in asked && asked.outcome).toMatchObject({
        deployment: null,
        request: { status: 'pending' },
      });
    } finally {
      stop();
    }
  });

  it('refuses to deploy a release missing a variable, saying where to set it', async () => {
    const staged = await uploadOnly(
      'web',
      MAIN,
      '4.0.0',
      (await createArtifact(dir, '4.0.0', { variables: SMTP_MANIFEST })).bytes,
    );
    const refused = await deployRelease('web', staged.release!.id).catch(
      (error: unknown) => error as Error & { metadata?: unknown },
    );
    expect(refused).toMatchObject({
      reason: 'VARIABLES_MISSING',
      metadata: {
        environmentId: 'staging',
        url: 'https://studio.test/releases/web?tab=variables',
        environmentUrl:
          'https://studio.test/environments/staging?tab=variables',
        variables: [{ name: 'SMTP_PASSWORD' }],
      },
    });
    // What `nb-studio deploy` prints: the names and both places to set them.
    expect(refused.message).toContain('SMTP_PASSWORD');
    expect(refused.message).toContain(
      'on the environment staging at https://studio.test/environments/staging?tab=variables (every App there), or on this App at https://studio.test/releases/web?tab=variables, then deploy again.',
    );
    await h.releases!.releases.setAppVariable(
      person('alice'),
      'web',
      'SMTP_PASSWORD',
      { value: 'smtp-secret' },
    );
    expect(
      (await deployRelease('web', staged.release!.id)).deployment,
    ).not.toBeNull();
  });
});

describe('pull request previews', () => {
  it('makes an App `app ensure` made the pull request’s preview on its first deployment, and removes it when merged', async () => {
    const issue = await issueWithPull('Cart', 8, HEAD1);
    await ensure('web-pr-8', 'preview');
    // Nothing yet: the pull request becomes its source when it is deployed.
    expect(await prPreviews(8)).toEqual([]);
    const first = await deployFile(
      'web-pr-8',
      HEAD1,
      '1.0.0',
      (await createArtifact(dir, '1.0.0', { variables: ADMIN_MANIFEST })).bytes,
    );
    expect(first).toMatchObject({
      reused: false,
      superseded: false,
      build: { state: 'succeeded', appId: 'web-pr-8', pullRequest: true },
      deployed: { appId: 'web-pr-8', request: null },
    });
    expect(first.deployed!.preview).not.toBeNull();
    const ready = await waitFor(
      () => prPreviews(8),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview',
    );
    expect(ready[0]).toMatchObject({
      appId: 'web-pr-8',
      environmentId: 'preview',
      sha: HEAD1,
      deployedSha: HEAD1,
    });
    // The pull request's App: named after it, started on demand, never recorded for the repository.
    expect(await h.releases!.releases.findApp('web-pr-8')).toMatchObject({
      name: `${REPO}#8`,
      activation: 'onDemand',
      labels: { studio: 'preview', pr: '8', studioEnsured: resourceId },
    });
    expect((await readLinks()).apps.map((app) => app.appId)).not.toContain(
      'web-pr-8',
    );

    // Deploying the same build again answers its release; nothing else is stored.
    const again = await deployFile('web-pr-8', HEAD1, '1.0.0-other-bytes');
    expect(again).toMatchObject({ reused: true });
    expect(again.release?.id).toBe(first.release?.id);

    // What the issue page shows: the address and the administrator for an editor.
    const shown = (await h.previewApi!.read(alice(), issue.identifier))
      .previews[0]!;
    expect(shown).toMatchObject({
      status: 'ready',
      url: 'https://web-pr-8.fake.test/',
      build: { state: 'succeeded', releaseId: first.release?.id },
    });
    expect(shown.admin).toMatchObject({
      username: 'nocobase',
      password: expect.stringMatching(/^[A-Za-z0-9]{16}$/u),
    });
    await expect(
      h.previewApi!.read(h.viewer('bob'), issue.identifier),
    ).rejects.toMatchObject({ status: 404 });
    expect(h.notices).toContainEqual(
      expect.objectContaining({
        source: 'previews',
        type: 'preview_ready',
        userIds: ['alice'],
      }),
    );

    // The issue being done changes nothing: previews follow the pull request.
    await move(issue, 'done');
    expect(await prPreviews(8)).toMatchObject([{ status: 'ready' }]);

    // Merged: the preview goes, with its App.
    h.github.merge(REPO, 8, 'bob');
    await poll();
    await waitFor(
      () => prPreviews(8),
      (rows) => rows.every((row) => row.status === 'destroyed'),
      'the preview to be destroyed',
    );
    expect(await h.releases!.releases.findApp('web-pr-8')).toBeNull();
  });

  it('never makes an App that existed before a preview, nor deletes it', async () => {
    await issueWithPull('Hotfix', 11, HEAD1);
    // `api` existed before: deploying a pull request's head to it makes no preview.
    const deployed = await deployFile('api', HEAD1, '1.0.0');
    expect(deployed.deployed).toMatchObject({ preview: null });
    expect(await prPreviews(11)).toEqual([]);
    // An App `app ensure` made whose first deployment was the default branch is no preview either.
    await ensure('shop-staging', 'staging');
    await deployFile('shop-staging', MAIN, '1.0.0');
    h.github.addPull(REPO, {
      number: 12,
      title: 'Later',
      head: { ref: 'feature/later', sha: HEAD2 },
      base: { ref: 'main' },
    });
    expect(
      (await deployFile('shop-staging', HEAD2, '1.0.1')).deployed,
    ).toMatchObject({ preview: null });
    expect(await prPreviews(12)).toEqual([]);
    // Closing the pull requests deletes neither.
    h.github.pull(REPO, 11).state = 'closed';
    h.github.pull(REPO, 12).state = 'closed';
    await poll();
    expect(await h.releases!.releases.findApp('api')).not.toBeNull();
    expect(await h.releases!.releases.findApp('shop-staging')).not.toBeNull();
  });

  it('removes the preview of a pull request closed without merging, which the reconciliation also catches', async () => {
    h.github.addPull(REPO, {
      number: 41,
      title: 'Abandoned',
      head: { ref: 'feature/abandoned', sha: HEAD1 },
      base: { ref: 'main' },
    });
    await ensure('web-pr-41', 'preview');
    await deployFile('web-pr-41', HEAD1, '1.0.0');
    await waitFor(
      () => prPreviews(41),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview',
    );
    h.github.pull(REPO, 41).state = 'closed';
    await poll();
    await waitFor(
      () => prPreviews(41),
      (rows) => rows.every((row) => row.status === 'destroyed'),
      'the preview to be destroyed',
    );
    expect(await h.releases!.releases.findApp('web-pr-41')).toBeNull();
    expect(await h.previews!.reconcile()).toMatchObject({ destroyed: 0 });
  });

  it('follows only the newest head: an older build is superseded, and its late deployment is dropped', async () => {
    await issueWithPull('Search', 9, HEAD1);
    await report('web-pr-9', HEAD1);
    await ensure('web-pr-9', 'preview');
    // A new push: the pull request's head moves, and CI starts on it.
    const pull = h.github.pull(REPO, 9);
    pull.head = { ...pull.head, sha: HEAD2 };
    pull.updated_at = new Date(Date.now() + 1000).toISOString();
    expect(await report('web-pr-9', HEAD2)).toMatchObject({
      superseded: false,
    });
    expect(await h.builds!.find('web-pr-9', HEAD1)).toMatchObject({
      superseded: true,
      state: 'failed',
    });
    await waitFor(
      () => prPreviews(9),
      (rows) => rows[0]?.sha === HEAD2,
      'the preview to follow the new head',
    );
    // The older build's archive arrives late: dropped, nothing deployed.
    const late = await deployFile('web-pr-9', HEAD1, '1.0.0');
    expect(late).toMatchObject({
      superseded: true,
      release: null,
      deployed: null,
    });
    expect(await prPreviews(9)).toMatchObject([
      { status: 'waiting', deploymentId: null },
    ]);
    // The newest head's build deploys.
    await deployFile('web-pr-9', HEAD2, '1.0.1');
    await waitFor(
      () => prPreviews(9),
      (rows) => rows[0]?.deployedSha === HEAD2,
      'the newest head deployed',
    );
  });

  it('supersedes completed builds without changing their state or allowing late uploads to deploy them', async () => {
    await issueWithPull('Completed heads', 33, HEAD1);
    await ensure('web', 'staging');
    await uploadOnly('web', HEAD1, '1.0.0');
    const pull = h.github.pull(REPO, 33);
    pull.head = { ...pull.head, sha: HEAD2 };
    pull.updated_at = new Date(Date.now() + 1000).toISOString();
    await report('web', HEAD2, 'failed', { message: 'Compile error.' });

    pull.head = { ...pull.head, sha: MAIN3 };
    pull.updated_at = new Date(Date.now() + 1000).toISOString();
    await report('web', MAIN3, 'building');

    expect(await h.builds!.find('web', HEAD1)).toMatchObject({
      state: 'succeeded',
      superseded: true,
    });
    expect(await h.builds!.find('web', HEAD2)).toMatchObject({
      state: 'failed',
      message: 'Compile error.',
      superseded: true,
    });
    expect(await deployFile('web', HEAD1, '1.0.1')).toMatchObject({
      superseded: true,
      release: null,
      deployed: null,
    });
    expect(await deployFile('web', HEAD2, '1.0.2')).toMatchObject({
      superseded: true,
      release: null,
      deployed: null,
    });
  });

  it.each([
    ['queued', 'Queued old head', 34, HEAD1, HEAD2],
    ['building', 'Building old head', 35, MAIN2, MAIN3],
  ] as const)(
    'keeps a superseded %s build terminal after a late report',
    async (oldState, title, number, oldSha, newSha) => {
      await issueWithPull(title, number, oldSha);
      await report(`web-pr-${number}`, oldSha, oldState);
      const pull = h.github.pull(REPO, number);
      pull.head = { ...pull.head, sha: newSha };
      pull.updated_at = new Date(Date.now() + 1000).toISOString();
      await report(`web-pr-${number}`, newSha, 'building');

      expect(await h.builds!.find(`web-pr-${number}`, oldSha)).toMatchObject({
        state: 'failed',
        superseded: true,
      });
      await report(`web-pr-${number}`, oldSha, 'queued');
      expect(await h.builds!.find(`web-pr-${number}`, oldSha)).toMatchObject({
        state: 'failed',
        superseded: true,
      });
      await report(`web-pr-${number}`, oldSha, 'building');
      expect(await h.builds!.find(`web-pr-${number}`, oldSha)).toMatchObject({
        state: 'failed',
        superseded: true,
      });
    },
  );

  it('fails only builds that have been building without a CI update for two hours', async () => {
    await issueWithPull('Timed out', 21, HEAD1);
    await issueWithPull('Still building', 22, HEAD2);
    await issueWithPull('Already finished', 23, MAIN);
    await issueWithPull('Already failed', 24, FEATURE);
    await report('web-pr-21', HEAD1, 'building');
    await report('web-pr-22', HEAD2, 'building');
    await report('web-pr-23', MAIN, 'succeeded');
    await report('web-pr-24', FEATURE, 'failed', { message: 'Compile error.' });
    const finishedPull = h.github.pull(REPO, 23);
    finishedPull.head = { ...finishedPull.head, sha: STRAY };
    finishedPull.updated_at = new Date(Date.now() + 1000).toISOString();
    await report('web-pr-23', STRAY, 'building');

    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const conn = h.database.connection();
    await conn.query
      .updateTable('studioBuilds')
      .set({ updatedAt: new Date(cutoff.getTime() - 1) })
      .where('appId', '=', 'web-pr-21')
      .where('sha', '=', HEAD1)
      .execute();
    await conn.query
      .updateTable('studioBuilds')
      .set({ updatedAt: new Date(cutoff.getTime() + 1) })
      .where('appId', '=', 'web-pr-22')
      .where('sha', '=', HEAD2)
      .execute();
    await conn.query
      .updateTable('studioBuilds')
      .set({ updatedAt: new Date(cutoff.getTime() - 1) })
      .where('appId', '=', 'web-pr-23')
      .where('sha', '=', MAIN)
      .execute();
    await conn.query
      .updateTable('studioBuilds')
      .set({ updatedAt: new Date(cutoff.getTime() - 1) })
      .where('appId', '=', 'web-pr-24')
      .where('sha', '=', FEATURE)
      .execute();

    expect(await h.builds!.expireStale(cutoff)).toBe(1);
    expect(await h.builds!.find('web-pr-21', HEAD1)).toMatchObject({
      state: 'failed',
      message: 'Build timed out after two hours without a CI update.',
    });
    expect(await h.builds!.find('web-pr-22', HEAD2)).toMatchObject({
      state: 'building',
    });
    expect(await h.builds!.find('web-pr-23', MAIN)).toMatchObject({
      state: 'succeeded',
      superseded: true,
    });
    expect(await h.builds!.find('web-pr-24', FEATURE)).toMatchObject({
      state: 'failed',
      message: 'Compile error.',
    });
  });

  it('lists builds by when CI reported them: superseding an older head leaves its time and place', async () => {
    await issueWithPull('Sorting', 11, HEAD1);
    await report('web-pr-11', HEAD1);
    const first = (await h.builds!.find('web-pr-11', HEAD1))!;
    await new Promise((resolve) => setTimeout(resolve, 20));
    const pull = h.github.pull(REPO, 11);
    pull.head = { ...pull.head, sha: HEAD2 };
    pull.updated_at = new Date(Date.now() + 1000).toISOString();
    await report('web-pr-11', HEAD2);
    const older = (await h.builds!.find('web-pr-11', HEAD1))!;
    // Superseding updates the older build, but not the time CI reported it.
    expect(older.superseded).toBe(true);
    expect(older.updatedAt > first.updatedAt).toBe(true);
    expect(older.reportedAt).toBe(first.reportedAt);
    const recent = await h.builds!.recent(resourceId, {
      page: 1,
      pageSize: 10,
    });
    expect(recent.items.map((build) => build.sha)).toEqual([HEAD2, HEAD1]);
    expect(recent.items[1]!.reportedAt).toBe(first.reportedAt);
    expect(recent.items[0]!.reportedAt > first.reportedAt).toBe(true);
  });

  it('brings a destroyed preview back when CI makes its App again', async () => {
    const issue = await issueWithPull('Filters', 10, HEAD1);
    await ensure('web-pr-10', 'preview');
    await deployFile('web-pr-10', HEAD1, '1.0.0');
    await waitFor(
      () => prPreviews(10),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview',
    );
    await h.previewApi!.down(alice(), issue.id, 'web-pr-10');
    expect(await prPreviews(10)).toMatchObject([{ status: 'destroyed' }]);
    expect(await h.releases!.releases.findApp('web-pr-10')).toBeNull();
    // The next push: CI makes the App again and deploys the new head.
    const pull = h.github.pull(REPO, 10);
    pull.head = { ...pull.head, sha: HEAD2 };
    await ensure('web-pr-10', 'preview');
    await deployFile('web-pr-10', HEAD2, '1.0.1');
    await waitFor(
      () => prPreviews(10),
      (rows) => rows[0]?.status === 'ready' && rows[0].deployedSha === HEAD2,
      'the preview back',
    );
  });

  it('deploys a preview with its environment’s values, its own App’s winning', async () => {
    await h.releases!.environments.setVariable(
      person('alice'),
      'preview',
      'SMTP_PASSWORD',
      { value: 'environment-secret' },
    );
    await issueWithPull('Solo', 50, HEAD1);
    await issueWithPull('Duo', 51, HEAD2);
    await ensure('admin-pr-50', 'preview');
    await ensure('admin-pr-51', 'preview');
    // One preview sets its own value on its App's Variables page.
    await h.releases!.releases.setAppVariable(
      person('alice'),
      'admin-pr-51',
      'SMTP_PASSWORD',
      { value: 'own-secret' },
    );
    for (const [appId, sha, version] of [
      ['admin-pr-50', HEAD1, '5.0.0'],
      ['admin-pr-51', HEAD2, '5.1.0'],
    ] as const)
      await deployFile(
        appId,
        sha,
        version,
        (await createArtifact(dir, version, { variables: SMTP_MANIFEST }))
          .bytes,
      );
    for (const number of [50, 51])
      await waitFor(
        () => prPreviews(number),
        (rows) => rows.some((row) => row.status === 'ready'),
        'the preview',
      );
    const envOf = (appId: string) =>
      h.driver!.applied.find((applied) => applied.appId === appId)?.env;
    expect(envOf('admin-pr-50')?.SMTP_PASSWORD).toBe('environment-secret');
    expect(envOf('admin-pr-51')?.SMTP_PASSWORD).toBe('own-secret');
    // Nothing is written to a preview App on its behalf.
    expect(
      (
        await h.releases!.releases.listAppVariables(
          person('alice'),
          'admin-pr-50',
        )
      ).items.find((item) => item.name === 'SMTP_PASSWORD'),
    ).toMatchObject({ source: 'environment', app: null });
  });
});

describe('preview variables', () => {
  it('blocks a preview whose build needs a variable, and deploys it once the issue page saves one', async () => {
    const issue = await issueWithPull('Mail', 31, HEAD1);
    await ensure('web-pr-31', 'preview');
    const blockedDeploy = await deployFile(
      'web-pr-31',
      HEAD1,
      '2.0.0',
      (await createArtifact(dir, '2.0.0', { variables: SMTP_MANIFEST })).bytes,
    );
    // A brand new preview's first deployment from CI: what `nb-studio deploy` answers names the variable and both places.
    expect(blockedDeploy.deployed?.preview).toMatchObject({
      status: 'blocked',
      error: expect.stringContaining(
        'SMTP_PASSWORD. Set it on the environment preview at https://studio.test/environments/preview?tab=variables (every App there), or on this App at https://studio.test/releases/web-pr-31?tab=variables, then deploy again.',
      ),
    });
    // The owner's inbox card carries what is missing and where the preview runs.
    expect(
      h.notices.find(
        (notice) =>
          notice.type === 'preview_failed' &&
          notice.data?.appId === 'web-pr-31',
      )?.data,
    ).toMatchObject({
      environmentId: 'preview',
      missingVariables: 'SMTP_PASSWORD',
    });
    const blocked = await h.previewApi!.read(alice(), issue.identifier);
    const shown = blocked.previews[0]!;
    expect(shown).toMatchObject({
      appId: 'web-pr-31',
      status: 'blocked',
      missingVariables: [
        {
          name: 'SMTP_PASSWORD',
          description: 'The SMTP password.',
          secret: true,
        },
      ],
    });
    expect(blocked.canSetEnvironmentVariables).toBe(true);
    await h.previewApi!.setVariables(
      alice(),
      issue.identifier,
      shown.appId,
      'preview',
      { SMTP_PASSWORD: 'smtp-secret' },
    );
    await waitFor(
      () => prPreviews(31),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview to deploy',
    );
    const ran = h.driver!.applied.at(-1)!;
    expect(ran.appId).toBe(shown.appId);
    expect(ran.env?.SMTP_PASSWORD).toBe('smtp-secret');
    expect(
      await h.releases!.environments.listVariables(person('alice'), 'preview'),
    ).toEqual([]);
  });

  it('saves to the Preview environment only for someone who manages environments', async () => {
    const issue = await issueWithPull('Mail too', 32, HEAD1);
    await ensure('web-pr-32', 'preview');
    await deployFile(
      'web-pr-32',
      HEAD1,
      '2.0.1',
      (await createArtifact(dir, '2.0.1', { variables: SMTP_MANIFEST })).bytes,
    );
    const [blocked] = await waitFor(
      () => prPreviews(32),
      (rows) => rows.some((row) => row.status === 'blocked'),
      'the preview to be blocked',
    );
    await expect(
      h.previews!.setVariables(
        blocked!.id,
        'environment',
        { SMTP_PASSWORD: 'x' },
        'bob',
      ),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await h.previewApi!.setVariables(
      alice(),
      issue.identifier,
      'web-pr-32',
      'environment',
      { SMTP_PASSWORD: 'shared-secret' },
    );
    expect(
      await h.releases!.environments.listVariables(person('alice'), 'preview'),
    ).toMatchObject([{ name: 'SMTP_PASSWORD', secret: true, value: null }]);
    await waitFor(
      () => prPreviews(32),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview to deploy',
    );
  });

  it('notes the variables a pull request’s build adds, on the build and in the pull request an agent opened', async () => {
    const issue = await issueWithPull('Mailer', 33, HEAD1);
    // The agent opened it: Studio keeps its section of the body.
    h.github.pull(REPO, 33).body = 'What it does.';
    await h.git.link(alice(), issue.id, `https://github.com/${REPO}/pull/33`, {
      type: 'agent',
      id: 'agent-1',
    });
    await ensure('web-pr-33', 'preview');
    // The App runs a release that declares the administrator only.
    await deployFile(
      'web-pr-33',
      HEAD1,
      '3.0.0',
      (await createArtifact(dir, '3.0.0', { variables: ADMIN_MANIFEST })).bytes,
    );
    await waitFor(
      () => prPreviews(33),
      (rows) => rows.some((row) => row.status === 'ready'),
      'the preview',
    );
    const pull = h.github.pull(REPO, 33);
    pull.head = { ...pull.head, sha: HEAD2 };
    await deployFile(
      'web-pr-33',
      HEAD2,
      '3.1.0',
      (await createArtifact(dir, '3.1.0', { variables: SMTP_MANIFEST })).bytes,
    );
    expect((await h.builds!.find('web-pr-33', HEAD2))?.newVariables).toEqual({
      added: [
        {
          name: 'SMTP_PASSWORD',
          description: 'The SMTP password.',
          required: true,
          secret: true,
        },
      ],
      removed: [],
    });
    const body = h.github.pull(REPO, 33).body ?? '';
    expect(body).toMatch(/^What it does\.\n\n<!-- studio:variables -->/u);
    expect(body).toContain(
      '- New: `SMTP_PASSWORD` (required, secret) — The SMTP password.',
    );
  });
});
