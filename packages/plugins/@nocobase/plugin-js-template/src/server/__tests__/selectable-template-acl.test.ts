/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';

import PluginJsTemplateServer from '../plugin';
import { getServiceContext, type JsTemplateResourceContext } from '../resources/resourceAction';

describe('selectable template catalog ACL', () => {
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
        PluginJsTemplateServer,
      ],
    });
    rootAgent = await app.agent().login(await app.db.getRepository('users').findOne());
    await seedCatalog(app);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('returns templates without project labels when the role only has listSelectable', async () => {
    const agent = await createRoleAgent('selectableOnly', 'catalog-selectable-only');
    await grantSelectable('selectableOnly');

    const response = await agent.resource('jsTemplates').listSelectable();
    const projects = await agent.resource('jsTemplateProjects').list();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          projectId: expect.any(String),
          kind: 'js-block',
          settingsSchema: expect.any(Object),
        }),
      ]),
    );
    expect(response.body.data[0]).not.toHaveProperty('projectName');
    expect(response.body.data[0]).not.toHaveProperty('projectTitle');
    expect(projects.status).toBe(403);
  });

  it('rejects the catalog when listSelectable itself is not granted', async () => {
    const agent = await createRoleAgent('projectListOnly', 'catalog-project-list-only');
    await grantProjectList('projectListOnly', { fields: ['id', 'name', 'title'] });

    const response = await agent.resource('jsTemplates').listSelectable();

    expect(response.status).toBe(403);
  });

  it('denies host-create-only callers without leaking selectable metadata', async () => {
    const agent = await createRoleAgent('hostCreateOnly', 'catalog-host-create-only');
    await rootAgent.resource('roles.resources', 'hostCreateOnly').create({
      values: {
        name: 'jsTemplates',
        usingActionsConfig: true,
        actions: [{ name: 'saveAsJsTemplate' }],
      },
    });

    const response = await agent.resource('jsTemplates').listSelectable({ values: { kind: 'js-block' } });

    expect(response.status).toBe(403);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain('visible-project');
    expect(body).not.toContain('jtp_visible');
    expect(body).not.toContain('jtt_jtp_visible');
    expect(body).not.toContain('settingsSchema');
  });

  it('does not fetch or return project labels hidden by field permissions', async () => {
    const agent = await createRoleAgent('hiddenLabels', 'catalog-hidden-labels');
    await grantSelectable('hiddenLabels');
    await grantProjectList('hiddenLabels', { fields: ['id'] });

    const response = await agent.resource('jsTemplates').listSelectable();

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((template: Record<string, unknown>) => !('projectName' in template))).toBe(true);
    expect(response.body.data.every((template: Record<string, unknown>) => !('projectTitle' in template))).toBe(true);
  });

  it('returns labels only for projects admitted by a static ACL row filter', async () => {
    const agent = await createRoleAgent('staticFilter', 'catalog-static-filter');
    await grantSelectable('staticFilter');
    await grantProjectList('staticFilter', {
      fields: ['id', 'name', 'title'],
      scope: { id: 'jtp_visible' },
    });

    const response = await agent.resource('jsTemplates').listSelectable();
    const visible = response.body.data.find((template: { projectId: string }) => template.projectId === 'jtp_visible');
    const hidden = response.body.data.find((template: { projectId: string }) => template.projectId === 'jtp_hidden');

    expect(visible).toMatchObject({ projectName: 'visible-project', projectTitle: 'Visible title' });
    expect(hidden).not.toHaveProperty('projectName');
    expect(hidden).not.toHaveProperty('projectTitle');
  });

  it.each([
    ['user provider', '{{$user.nickname}}'],
    ['request state', '{{ctx.state.currentUser.nickname}}'],
  ])('parses the %s ACL row filter before loading labels', async (_label, value) => {
    const roleName = `dynamicFilter${String(value).includes('$user') ? 'User' : 'State'}`;
    const agent = await createRoleAgent(roleName, 'visible-project');
    await grantSelectable(roleName);
    await grantProjectList(roleName, {
      fields: ['id', 'name', 'title'],
      scope: { name: value },
    });

    const response = await agent.resource('jsTemplates').listSelectable();
    const visible = response.body.data.find((template: { projectId: string }) => template.projectId === 'jtp_visible');
    const hidden = response.body.data.find((template: { projectId: string }) => template.projectId === 'jtp_hidden');

    expect(visible).toMatchObject({ projectName: 'visible-project', projectTitle: 'Visible title' });
    expect(hidden).not.toHaveProperty('projectName');
  });

  it('passes state, current user, and timezone into the service context', () => {
    const currentUser = { id: 7 };
    const state = { currentRole: 'member', currentUser };

    expect(
      getServiceContext({
        auth: { user: currentUser },
        state,
        timezone: 'Asia/Shanghai',
      } as JsTemplateResourceContext),
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
        name: 'jsTemplates',
        usingActionsConfig: true,
        actions: [{ name: 'listSelectable' }],
      },
    });
  }

  async function grantProjectList(roleName: string, options: { fields: string[]; scope?: Record<string, unknown> }) {
    let scope: string | undefined;
    if (options.scope) {
      const created = await rootAgent.resource('dataSourcesRolesResourcesScopes').create({
        values: {
          resourceName: 'jsTemplateProjects',
          name: `${roleName}-project-list`,
          scope: options.scope,
        },
      });
      scope = created.body.data.id;
    }
    await rootAgent.resource('roles.resources', roleName).create({
      values: {
        name: 'jsTemplateProjects',
        usingActionsConfig: true,
        actions: [{ name: 'list', fields: options.fields, ...(scope ? { scope } : {}) }],
      },
    });
  }
});

async function seedCatalog(app: MockServer) {
  const projects = [
    { id: 'jtp_visible', name: 'visible-project', title: 'Visible title' },
    { id: 'jtp_hidden', name: 'hidden-project', title: 'Hidden title' },
  ];
  for (const project of projects) {
    await app.db.getRepository('jsTemplateProjects').create({
      values: {
        ...project,
        vscRepoId: `vsc_${project.id}`,
        normalizedName: project.name,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: `commit_${project.id}`,
      },
    });
    await app.db.getRepository('jsTemplates').create({
      values: {
        id: `jtt_${project.id}`,
        projectId: project.id,
        target: 'client',
        kind: 'js-block',
        templateName: `${project.name}-template`,
        entryPath: `src/client/js-blocks/${project.name}/index.tsx`,
        descriptorPath: `src/client/js-blocks/${project.name}/entry.json`,
        settingsSchema: null,
        settingsSchemaHash: null,
        compiledCommitId: `commit_${project.id}`,
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        runtimeCodeHash: `runtime_${project.id}`,
        artifactHash: 'a'.repeat(64),
        filesHash: `files_${project.id}`,
        settingsDefaultsHash: null,
        compiledAt: new Date(),
        healthStatus: 'ready',
      },
    });
  }
}
