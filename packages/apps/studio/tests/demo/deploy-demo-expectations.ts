/**
 * What the deployment demo (`server/demo/deploy-build.ts`) leaves on a fresh installation, and that Studio's own
 * background work over it (polling, merge checks, preview reconciliation, the CI settings) asks no code host.
 */
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import { databaseManagerToken, type Row } from '@nocobase/db';
import type { ServiceContainer } from '@nocobase/service-provider';
import { expect } from 'vitest';

import { studioCiSetupToken } from '../../server/builds/token.js';
import { studioDeploysToken } from '../../server/deploys/token.js';
import {
  DEMO_CI_TASK_TITLE,
  DEMO_CONNECTION,
  DEMO_ENVIRONMENT_VARIABLE,
  DEMO_MISSING_VARIABLE,
  DEMO_REPOSITORIES,
} from '../../server/demo/deploy-data.js';
import { studioGitToken } from '../../server/git/token.js';
import { previewWhere } from '../../server/previews/store.js';
import { studioPreviewsToken } from '../../server/previews/token.js';

const DEMO_REFUSED = /demo connection/u;

export async function expectDeployDemo(
  container: ServiceContainer,
): Promise<void> {
  const conn = container.resolve(databaseManagerToken).connection();
  const query = conn.query;
  const git = container.resolve(studioGitToken);
  const connections = git.connections();

  // The connection: stored as a token connection, marked, offering nothing personal.
  const rows = await query
    .selectFrom('studioGitConnections')
    .selectAll()
    .where('demo', '=', true)
    .execute<Row>();
  expect(rows).toHaveLength(1);
  const demo = (await connections.list()).find(
    (item) => item.id === String(rows[0]!.id),
  )!;
  expect(demo).toMatchObject({
    name: DEMO_CONNECTION.name,
    account: 'acme-demo',
    kind: 'token',
    demo: true,
    hasToken: true,
    personalMethods: [],
    missingPermissions: [],
    usedBy: DEMO_REPOSITORIES.length,
  });

  // Working directories bound to it, and the runner directory.
  const resources = await query
    .selectFrom('pmProjectResources')
    .selectAll()
    .execute<Row>();
  const byRepo = new Map(
    resources
      .filter((row) => row.bindingConnectionId === demo.id)
      .map((row) => [String(row.bindingFullName), String(row.id)]),
  );
  expect([...byRepo.keys()].sort()).toEqual(
    DEMO_REPOSITORIES.map((repo) => repo.fullName).sort(),
  );
  expect(
    resources.some(
      (row) => row.type === 'directory' && row.runnerId === 'demo-runner',
    ),
  ).toBe(true);

  // Preview CI in each state, as the settings show it.
  const ci = container.resolve(studioCiSetupToken);
  const views = new Map<string, Awaited<ReturnType<typeof ci.connection>>>();
  for (const [name, resourceId] of byRepo)
    views.set(name, await ci.connection(resourceId, true));
  // What CI reported, App by App, in the environment each runs in: CRM's pull requests of both applications in Preview, its staging and production Apps.
  const crmView = views.get('acme-demo/crm')!;
  expect(crmView).toMatchObject({ connection: 'connected', reported: true });
  expect(
    crmView.apps.map((app) => [app.environmentId, app.appId, app.connected]),
  ).toEqual(
    expect.arrayContaining([
      ['preview', 'crm', true],
      ['preview', 'crm-admin', true],
      ['demo-staging', 'crm-staging', true],
      ['demo-production', 'crm-production', true],
    ]),
  );
  expect(
    crmView.environments.map((environment) => [
      environment.id,
      environment.protected,
    ]),
  ).toEqual(
    expect.arrayContaining([
      ['preview', false],
      ['demo-staging', false],
      ['demo-production', true],
    ]),
  );
  // Its workflows: pull requests of each application, the default branch to staging, tags to production.
  expect([...crmView.workflowPaths].sort()).toEqual([
    '.github/workflows/nb-studio-crm-admin-preview.yml',
    '.github/workflows/nb-studio-crm-preview.yml',
    '.github/workflows/nb-studio-crm-production.yml',
    '.github/workflows/nb-studio-crm-staging.yml',
  ]);
  expect(views.get('acme-demo/website')).toMatchObject({
    connection: 'pr-open',
    pullRequest: { number: 12 },
    apps: [],
  });
  const task = views.get('acme-demo/platform');
  expect(task).toMatchObject({ connection: 'task', apps: [] });
  const taskIssue = await query
    .selectFrom('pmIssues')
    .select('title')
    .where('id', '=', task!.task!.issueId)
    .executeTakeFirst<Row>();
  expect(taskIssue?.title).toBe(DEMO_CI_TASK_TITLE);
  expect(views.get('acme-demo/dashboard')).toMatchObject({
    connection: 'none',
    auto: false,
    apps: [],
  });
  // No way of connecting is stored for any of them.
  for (const resourceId of byRepo.values()) {
    const row = await query
      .selectFrom('studioRepoCi')
      .select('setups')
      .where('resourceId', '=', resourceId)
      .executeTakeFirst<Row>();
    expect(JSON.stringify(row?.setups ?? null)).not.toMatch(/"mode"|"apps"/u);
  }

  // Pull requests linked to the CRM issues, and the builds CI reported.
  const crm = byRepo.get('acme-demo/crm')!;
  const pulls = await query
    .selectFrom('studioPullRequests')
    .select(['number', 'state'])
    .orderBy('number')
    .execute<Row>();
  expect(pulls.map((row) => [Number(row.number), row.state])).toEqual([
    [9, 'merged'],
    [10, 'merged'],
    [12, 'open'],
    [15, 'open'],
    [18, 'open'],
  ]);
  expect(
    await query.selectFrom('studioIssuePullRequests').select('id').execute(),
  ).toHaveLength(5);
  const builds = await query
    .selectFrom('studioBuilds')
    .select(['appId', 'state', 'logsUrl'])
    .where('resourceId', '=', crm)
    .execute<Row>();
  expect(new Set(builds.map((row) => row.state))).toEqual(
    new Set(['succeeded', 'failed', 'building']),
  );
  expect(
    builds.every((row) =>
      String(row.logsUrl).startsWith('https://example.com/'),
    ),
  ).toBe(true);

  // Previews in the Preview environment: ready with its first administrator, blocked on a variable, building.
  const previews = container.resolve(studioPreviewsToken);
  const status = async (appId: string) =>
    (await previewWhere(conn, 'appId', appId))?.status;
  expect(await status('crm-pr-12')).toBe('ready');
  expect(await status('crm-pr-15')).toBe('blocked');
  expect(await status('crm-pr-18')).toBe('waiting');
  const ready = (await previewWhere(conn, 'appId', 'crm-pr-12'))!;
  expect(await previews.adminOf(ready)).toMatchObject({
    username: 'nocobase',
  });
  expect(
    (
      await previews.missingOf(
        (await previewWhere(conn, 'appId', 'crm-pr-15'))!,
      )
    ).map((variable) => variable.name),
  ).toEqual([DEMO_MISSING_VARIABLE.name]);
  const releases = container.resolve(releasesToken);
  const previewApp = await releases.releases.findApp('crm-pr-12');
  expect(previewApp?.labels).toMatchObject({
    studio: 'preview',
    studioEnsured: crm,
    pr: '12',
  });
  // Recorded, never started.
  expect(previewApp?.enabled).toBe(false);

  // The preview App's own variables, and the environment's.
  const own = await releases.releases.listAppVariables(
    releases.system,
    'crm-pr-12',
  );
  expect(
    own.items
      .filter((item) => item.app?.set && !item.app.generated)
      .map((item) => [item.name, item.secret]),
  ).toEqual([
    ['DEMO_BANNER_TEXT', false],
    ['MAP_API_KEY', true],
  ]);
  const environmentVariables = await releases.environments.listVariables(
    releases.system,
    'preview',
  );
  expect(
    environmentVariables.some(
      (item) => item.name === DEMO_ENVIRONMENT_VARIABLE.name,
    ),
  ).toBe(true);

  // Staging and production, their marks and the request waiting for approval.
  const project = await query
    .selectFrom('pmProjectResources')
    .select('projectId')
    .where('id', '=', crm)
    .executeTakeFirstOrThrow<Row>();
  const environments = await container
    .resolve(studioDeploysToken)
    .environments(
      await git.viewerOf(String(rows[0]!.createdById)),
      String(project.projectId),
    );
  expect(
    environments.items.map((item) => ({
      appId: item.appId,
      role: item.role,
      version: item.current?.version,
      pending: item.pending?.version ?? null,
    })),
  ).toEqual([
    {
      appId: 'crm-production',
      role: 'production',
      version: '1.4.0',
      pending: '1.4.1',
    },
    {
      appId: 'crm-staging',
      role: 'staging',
      version: '1.4.1-rc.1',
      pending: null,
    },
  ]);
  const marks = await query
    .selectFrom('studioDeployMarks')
    .select(['role', 'status'])
    .execute<Row>();
  expect(marks.map((row) => row.role).sort()).toEqual([
    'production',
    'staging',
    'staging',
  ]);

  // Studio's background work and the demo connection's routes ask no host: the calls that would are refused.
  await git.poller.pollNow();
  expect(
    await query
      .selectFrom('studioGitRepos')
      .select(['pollError', 'polledAt'])
      .where('connectionId', '=', demo.id)
      .execute<Row>(),
  ).toEqual(DEMO_REPOSITORIES.map(() => ({ pollError: null, polledAt: null })));
  await expect(connections.reach(demo.id)).rejects.toThrow(DEMO_REFUSED);
  await expect(connections.listRepos(demo.id, {})).rejects.toThrow(
    DEMO_REFUSED,
  );
  const repo = await git.git().repoOfResource(conn, {
    binding: {
      provider: 'github',
      connectionId: demo.id,
      repoId: '900001',
      fullName: 'acme-demo/crm',
    },
  });
  await expect(
    connections.actingAuth(repo!, String(rows[0]!.createdById)),
  ).rejects.toThrow(DEMO_REFUSED);
  await expect(
    connections.usePersonalToken(
      String(rows[0]!.createdById),
      demo.id,
      'ghp_test',
    ),
  ).rejects.toThrow(DEMO_REFUSED);
  await previews.reconcile();
  expect(await status('crm-pr-12')).toBe('ready');
  expect(await status('crm-pr-15')).toBe('blocked');
  expect(await status('crm-pr-18')).toBe('waiting');
}
