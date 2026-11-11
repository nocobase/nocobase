import { randomBytes } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { identityProviderServiceToken } from '@nocobase/app-plugin-identity-provider/server';
import { releasesToken } from '@nocobase/app-plugin-releases/server';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'https://platform.example' },
    auth: { trustedOrigins: ['https://platform.example'] },
    secrets: {
      keys: [{ version: 1, key: randomBytes(32).toString('base64') }],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
    releases: { host: { enabled: false } },
  },
});
test('workbench checks membership and excludes stopped, pending and archived instances', async ({
  app,
  testApp,
  request,
  connection,
}) => {
  expect((await request('/workbench/apps')).status).toBe(401);
  expect((await request('/multiApp/myApps')).status).toBe(401);
  expect(
    (await request('/multiApp/instances/running/deployments')).status,
  ).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    identity = app.container.resolve(identityProviderServiceToken);
  const now = new Date().toISOString();
  await connection.repository('mamTemplates').createOne({
    values: {
      id: 'test-template',
      name: 'Reagents',
      description: '',
      sourceAppId: 'test-source',
      environmentId: 'test-env',
      createdBy: admin.user.id,
      createdAt: now,
      updatedAt: now,
    },
  });
  await connection.repository('mamTemplateVersions').createOne({
    values: {
      id: 'test-version',
      templateId: 'test-template',
      version: '1.0.0',
      releaseId: 'test-release',
      checksum: 'test-checksum',
      manifest: { name: 'app-template-reagents' },
      createdBy: admin.user.id,
      createdAt: now,
    },
  });
  for (const id of [
    'running',
    'stopped',
    'pending',
    'archived',
    'unassigned',
  ]) {
    await identity.ensureClient(
      id,
      id,
      'https://platform.example/' + id,
      admin.user.id,
    );
    if (id !== 'unassigned')
      await identity.setMember(id, admin.user.id, 'reader');
    await connection.repository('mamInstances').createOne({
      values: {
        id,
        name: id,
        templateId: 'test-template',
        desiredVersionId: 'test-version',
        currentVersionId: 'test-version',
        environmentId: 'test-env',
        status: id === 'archived' ? 'archived' : 'active',
        operationId: id === 'pending' ? 'op' : null,
        createdBy: admin.user.id,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  const getApp = vi
    .spyOn(app.container.resolve(releasesToken).releases, 'getApp')
    .mockImplementation(async (_caller, id) => ({
      app: {
        id,
        environmentId: 'test-env',
        name: id,
        description: null,
        currentDeploymentId: null,
        enabled: true,
        activation: 'eager',
        idleStopMinutes: null,
        dormantAfterHours: null,
        previewOf: null,
        createdVia: 'human',
        createdBy: admin.user.id,
        createdAt: now,
        updatedAt: now,
        labels: {},
      },
      environment: {
        id: 'test-env',
        name: 'Test',
        protected: false,
        runsImages: false,
      },
      runtime: {
        available: true,
        state: id === 'stopped' ? 'stopped' : 'running',
        version: '1.0.0',
        startedAt: null,
        error: null,
        lastAccessedAt: null,
      },
      url: 'https://platform.example/' + id,
      currentVersion: '1.0.0',
      hasReleases: true,
      hasPendingDeployment: false,
    }));
  try {
    const deployments = vi
      .spyOn(app.container.resolve(releasesToken).releases, 'listDeployments')
      .mockResolvedValue({ items: [], page: 2, pageSize: 10, total: 0 });
    expect(
      (await admin.fetch('/multiApp/instances/running/deployments?page=0'))
        .status,
    ).toBe(400);
    expect(
      (await admin.fetch('/multiApp/instances/missing/deployments')).status,
    ).toBe(404);
    const history = await admin.fetch(
      '/multiApp/instances/running/deployments?page=2',
    );
    expect(history.status).toBe(200);
    expect(await history.json()).toEqual({
      data: [],
      meta: { page: 2, pageSize: 10, total: 0 },
    });
    expect(deployments).toHaveBeenCalledWith(
      expect.objectContaining({ userId: admin.user.id }),
      'running',
      { page: 2, pageSize: 10 },
    );
    deployments.mockRestore();
    expect(await identity.access('archived', admin.user.id)).toBeNull();
    expect(await identity.access('running', admin.user.id)).not.toBeNull();
    const response = await admin.fetch('/multiApp/myApps?appId=unassigned');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [
        {
          id: 'running',
          kind: 'managed',
          authMode: 'platform',
          entryUrl:
            'https://platform.example/running/login?auth=platform&redirect=%2F',
          name: 'running',
          url: 'https://platform.example/running',
          template: 'reagents',
          templateName: 'Reagents',
        },
      ],
    });
    expect(getApp.mock.calls.map(([, id]) => id)).not.toContain('unassigned');
    await identity.setMember('running', admin.user.id, null);
    expect(await (await admin.fetch('/workbench/apps')).json()).toEqual({
      data: [],
    });
  } finally {
    getApp.mockRestore();
  }
});
