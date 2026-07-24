/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

import { LIGHT_EXTENSION_ACL_SNIPPET } from '../../constants';
import PluginLightExtensionServer from '../plugin';

describe('selectable light extension entry ACL', () => {
  let app: MockServer;
  let repoId: string;
  let entryId: string;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: [
        'field-sort',
        'users',
        'auth',
        'acl',
        'data-source-manager',
        'system-settings',
        PluginLightExtensionServer,
      ],
    });
    const admin = await createRoleAgent(app, 'selectableAdmin', {
      snippets: [LIGHT_EXTENSION_ACL_SNIPPET],
    });
    const created = await admin.resource('lightExtensionRepos').create({ values: { name: 'Selectable source' } });
    expect(created.status).toBe(200);
    repoId = String(created.body.data.id);
    const selectable = await admin.resource('lightExtensionEntries').listSelectable({ values: { kind: 'js-block' } });
    expect(selectable.status).toBe(200);
    const welcomeEntry = (
      selectable.body.data as Array<{
        id: string;
        entryName: string;
      }>
    ).find((entry) => entry.entryName === 'welcome-card');
    expect(welcomeEntry).toBeDefined();
    entryId = String(welcomeEntry?.id);
  });

  afterEach(async () => {
    await app?.destroy();
  });

  it('denies host-create-only callers without leaking selectable metadata', async () => {
    const agent = await createRoleAgent(app, 'hostCreateOnly', {
      resources: [{ name: 'lightExtensions', actions: [{ name: 'moveSource' }] }],
    });

    const response = await agent.resource('lightExtensionEntries').listSelectable({ values: { kind: 'js-block' } });

    expect(response.status).toBe(403);
    const body = JSON.stringify(response.body);
    expect(body).not.toContain('Selectable source');
    expect(body).not.toContain(repoId);
    expect(body).not.toContain(entryId);
    expect(body).not.toContain('welcome-card');
    expect(body).not.toContain('settingsSchema');
  });

  it('allows listSelectable without granting lightExtensionRepos:list', async () => {
    const agent = await createRoleAgent(app, 'selectableOnly', {
      resources: [{ name: 'lightExtensionEntries', actions: [{ name: 'listSelectable' }] }],
    });

    const selectable = await agent.resource('lightExtensionEntries').listSelectable({ values: { kind: 'js-block' } });
    const repos = await agent.resource('lightExtensionRepos').list();

    expect(selectable.status).toBe(200);
    expect(selectable.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          repoId: expect.any(String),
          entryName: 'welcome-card',
          kind: 'js-block',
          settingsSchema: expect.any(Object),
        }),
      ]),
    );
    expect(selectable.body.data[0]).not.toHaveProperty('repoTitle');
    expect(selectable.body.data[0]).not.toHaveProperty('repoLabel');
    expect(repos.status).toBe(403);
  });
});

async function createRoleAgent(
  app: MockServer,
  roleName: string,
  permissions: {
    snippets?: string[];
    resources?: Array<{ name: string; usingActionsConfig?: boolean; actions: Array<{ name: string }> }>;
  },
) {
  await app.db.getRepository('roles').create({
    values: {
      name: roleName,
      snippets: permissions.snippets || [],
      resources: permissions.resources?.map((resource) => ({ usingActionsConfig: true, ...resource })) || [],
    },
  });
  const user = await app.db.getRepository('users').create({
    values: {
      nickname: roleName,
      roles: [roleName],
    },
  });
  return (await app.agent().login(user)).set('x-role', roleName);
}
