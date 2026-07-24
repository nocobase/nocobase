/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';

import PluginLightExtensionServer from '../plugin';
import { getServiceContext, type LightExtensionResourceContext } from '../resources/resourceAction';

describe('selectable entry catalog ACL', () => {
  let app: MockServer;
  let rootAgent: ReturnType<MockServer['agent']>;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'acl',
        'auth',
        'data-source-manager',
        'system-settings',
        'ui-schema-storage',
        PluginLightExtensionServer,
      ],
    });
    rootAgent = await app.agent().login(await app.db.getRepository('users').findOne());
    await seedCatalog(app);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('returns entries without repo labels when the role only has listSelectable', async () => {
    const agent = await createRoleAgent('selectableOnly', 'catalog-selectable-only');
    await grantSelectable('selectableOnly');

    const response = await agent.resource('lightExtensionEntries').listSelectable();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0]).not.toHaveProperty('repoName');
    expect(response.body.data[0]).not.toHaveProperty('repoTitle');
  });

  it('rejects the catalog when listSelectable itself is not granted', async () => {
    const agent = await createRoleAgent('repoListOnly', 'catalog-repo-list-only');
    await grantRepoList('repoListOnly', { fields: ['id', 'name', 'title'] });

    const response = await agent.resource('lightExtensionEntries').listSelectable();

    expect(response.status).toBe(403);
  });

  it('does not fetch or return repo labels hidden by field permissions', async () => {
    const agent = await createRoleAgent('hiddenLabels', 'catalog-hidden-labels');
    await grantSelectable('hiddenLabels');
    await grantRepoList('hiddenLabels', { fields: ['id'] });

    const response = await agent.resource('lightExtensionEntries').listSelectable();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((entry: Record<string, unknown>) => !('repoName' in entry))).toBe(true);
    expect(response.body.data.every((entry: Record<string, unknown>) => !('repoTitle' in entry))).toBe(true);
  });

  it('returns labels only for repos admitted by a static ACL row filter', async () => {
    const agent = await createRoleAgent('staticFilter', 'catalog-static-filter');
    await grantSelectable('staticFilter');
    await grantRepoList('staticFilter', {
      fields: ['id', 'name', 'title'],
      scope: { id: 'ler_visible' },
    });

    const response = await agent.resource('lightExtensionEntries').listSelectable();
    const visible = response.body.data.find((entry: { repoId: string }) => entry.repoId === 'ler_visible');
    const hidden = response.body.data.find((entry: { repoId: string }) => entry.repoId === 'ler_hidden');

    expect(visible).toMatchObject({ repoName: 'visible-repo', repoTitle: 'Visible title' });
    expect(hidden).not.toHaveProperty('repoName');
    expect(hidden).not.toHaveProperty('repoTitle');
  });

  it.each([
    ['user provider', '{{$user.nickname}}'],
    ['request state', '{{ctx.state.currentUser.nickname}}'],
  ])('parses the %s ACL row filter before loading labels', async (_label, value) => {
    const roleName = `dynamicFilter${String(value).includes('$user') ? 'User' : 'State'}`;
    const agent = await createRoleAgent(roleName, 'visible-repo');
    await grantSelectable(roleName);
    await grantRepoList(roleName, {
      fields: ['id', 'name', 'title'],
      scope: { name: value },
    });

    const response = await agent.resource('lightExtensionEntries').listSelectable();
    const visible = response.body.data.find((entry: { repoId: string }) => entry.repoId === 'ler_visible');
    const hidden = response.body.data.find((entry: { repoId: string }) => entry.repoId === 'ler_hidden');

    expect(visible).toMatchObject({ repoName: 'visible-repo', repoTitle: 'Visible title' });
    expect(hidden).not.toHaveProperty('repoName');
  });

  it('passes state, current user, and timezone into the service context', () => {
    const currentUser = { id: 7 };
    const state = { currentRole: 'member', currentUser };

    expect(
      getServiceContext({
        auth: { user: currentUser },
        state,
        timezone: 'Asia/Shanghai',
      } as LightExtensionResourceContext),
    ).toMatchObject({ currentUser, state, timezone: 'Asia/Shanghai' });
  });

  async function createRoleAgent(roleName: string, nickname: string) {
    await app.db.getRepository('roles').create({ values: { name: roleName } });
    const user = await app.db.getRepository('users').create({
      values: { nickname, roles: [roleName] },
    });
    return (await app.agent().login(user)).set('x-role', roleName).set('x-timezone', 'Asia/Shanghai');
  }

  async function grantSelectable(roleName: string) {
    await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'lightExtensionEntries',
        usingActionsConfig: true,
        actions: [{ name: 'listSelectable' }],
      },
    });
  }

  async function grantRepoList(roleName: string, options: { fields: string[]; scope?: Record<string, unknown> }) {
    let scope: string | undefined;
    if (options.scope) {
      const created = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
        values: {
          resourceName: 'lightExtensionRepos',
          name: `${roleName}-repo-list`,
          scope: options.scope,
        },
      });
      scope = created.body.data.id;
    }
    await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'lightExtensionRepos',
        usingActionsConfig: true,
        actions: [{ name: 'list', fields: options.fields, ...(scope ? { scope } : {}) }],
      },
    });
  }
});

async function seedCatalog(app: MockServer) {
  const repos = [
    { id: 'ler_visible', name: 'visible-repo', title: 'Visible title' },
    { id: 'ler_hidden', name: 'hidden-repo', title: 'Hidden title' },
  ];
  for (const repo of repos) {
    await app.db.getRepository('lightExtensionRepos').create({
      values: {
        ...repo,
        vscRepoId: `vsc_${repo.id}`,
        normalizedName: repo.name,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: `commit_${repo.id}`,
      },
    });
    await app.db.getRepository('lightExtensionEntries').create({
      values: {
        id: `entry_${repo.id}`,
        repoId: repo.id,
        target: 'client',
        kind: 'js-block',
        entryName: `${repo.name}-entry`,
        entryPath: `src/client/js-blocks/${repo.name}/index.tsx`,
        descriptorPath: `src/client/js-blocks/${repo.name}/entry.json`,
        settingsSchema: null,
        settingsSchemaHash: null,
        compiledCommitId: `commit_${repo.id}`,
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        runtimeCodeHash: `runtime_${repo.id}`,
        artifactHash: 'a'.repeat(64),
        filesHash: `files_${repo.id}`,
        settingsDefaultsHash: null,
        compiledAt: new Date(),
        healthStatus: 'ready',
      },
    });
  }
}
