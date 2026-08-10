/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createMockServer, type ExtendedAgent, type MockServer } from '@nocobase/test';
import type { Model } from '@nocobase/database';
import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';

const ADMIN_UI_LAYOUT_UID = 'admin-layout-model';
const MOBILE_UI_LAYOUT_UID = 'mobile-layout-model';
const UNION_ROLE_KEY = '__union__';

async function createPortalAccessGateMockServer() {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'error-handler',
      'users',
      'auth',
      'client',
      'field-sort',
      'acl',
      'ui-schema-storage',
      'system-settings',
      'data-source-main',
      'data-source-manager',
      'ui-layout',
      'multi-portal',
    ],
  });
}

describe('Portal access gate for roles:check', () => {
  let app: MockServer;
  let allowedAgent: ExtendedAgent;
  let deniedAgent: ExtendedAgent;
  let unionAgent: ExtendedAgent;
  let rootAgent: ExtendedAgent;
  let switchUser: Model;
  let storagePath: string;
  const originalInitPortalName = process.env.INIT_PORTAL_NAME;
  const originalInitPortalType = process.env.INIT_PORTAL_TYPE;
  const originalStoragePath = process.env.STORAGE_PATH;

  beforeAll(async () => {
    storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-access-gate-'));
    process.env.INIT_PORTAL_NAME = 'admin';
    process.env.INIT_PORTAL_TYPE = 'no-code';
    process.env.STORAGE_PATH = storagePath;
    app = await createPortalAccessGateMockServer();
    await app.db.sync();

    await app.db.getRepository('multiPortals').destroy({ filterByTk: '__default_portal__' });
    const portalRepository = app.db.getRepository('multiPortals');
    await portalRepository.create({
      values: {
        uid: 'portal-access-gate',
        title: 'Portal access gate',
        portalType: 'no-code',
        portalName: 'portal-access-gate',
        routePath: '/portal-access-gate',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_UI_LAYOUT_UID,
      },
    });
    await portalRepository.create({
      values: {
        uid: 'portal-access-disabled',
        title: 'Disabled Portal',
        portalType: 'no-code',
        portalName: 'portal-access-disabled',
        routePath: '/portal-access-disabled',
        authCheck: true,
        enabled: false,
        uiLayoutUid: ADMIN_UI_LAYOUT_UID,
      },
    });
    await portalRepository.create({
      values: {
        uid: 'portal-access-invalid-runtime',
        title: 'Invalid runtime Portal',
        portalType: 'no-code',
        portalName: 'portal-access-invalid-runtime',
        routePath: '/portal-access-invalid-runtime',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'missing-layout',
      },
    });
    const roleRepository = app.db.getRepository('roles');
    await roleRepository.create({ values: { name: 'portal-gate-allowed', allowNewMultiPortal: false } });
    await roleRepository.create({ values: { name: 'portal-gate-union-other', allowNewMultiPortal: false } });
    await roleRepository.create({ values: { name: 'portal-gate-denied', allowNewMultiPortal: false } });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: 'portal-gate-allowed',
        multiPortalUid: 'portal-access-gate',
      },
    });

    const userRepository = app.db.getRepository('users');
    const allowedUser = await userRepository.create({ values: { roles: ['portal-gate-allowed'] } });
    const deniedUser = await userRepository.create({ values: { roles: ['portal-gate-denied'] } });
    const unionUser = await userRepository.create({
      values: { roles: ['portal-gate-allowed', 'portal-gate-union-other'] },
    });
    switchUser = await userRepository.create({
      values: { roles: ['portal-gate-allowed', 'portal-gate-denied'] },
    });
    const rootUser = await userRepository.findOne({ filter: { 'roles.name': 'root' } });

    rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles').setSystemRoleMode({
      values: {
        roleMode: 'allow-use-union',
      },
    });
    const aiPortalResponse = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'portal-access-ai',
        title: 'AI Portal access gate',
        portalType: 'ai',
        portalName: 'portal-access-ai',
        routePath: '/portal-access-ai',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_UI_LAYOUT_UID,
        skipCreatePortalDirectory: true,
      },
    });
    expect(aiPortalResponse.status).toBe(200);
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: 'portal-gate-allowed',
        multiPortalUid: 'portal-access-ai',
      },
    });
    allowedAgent = await app.agent().login(allowedUser, 'portal-gate-allowed');
    deniedAgent = await app.agent().login(deniedUser, 'portal-gate-denied');
    unionAgent = await app.agent().login(unionUser, UNION_ROLE_KEY);
  });

  afterAll(async () => {
    if (app?.name) {
      await AppSupervisor.getInstance().removeAppManifest(app.name, 'multi-portal');
    }
    await app?.destroy();
    await rm(storagePath, { recursive: true, force: true });
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    if (originalInitPortalName === undefined) {
      delete process.env.INIT_PORTAL_NAME;
    } else {
      process.env.INIT_PORTAL_NAME = originalInitPortalName;
    }
    if (originalInitPortalType === undefined) {
      delete process.env.INIT_PORTAL_TYPE;
    } else {
      process.env.INIT_PORTAL_TYPE = originalInitPortalType;
    }
  });

  it('keeps roles:check unchanged when X-Portal is absent', async () => {
    const response = await deniedAgent.get('/roles:check');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      role: 'portal-gate-denied',
      roles: ['portal-gate-denied'],
      roleMode: 'allow-use-union',
    });
    expect(response.body).not.toHaveProperty('errors');
  });

  it('allows a bare Portal name for an explicitly granted role', async () => {
    const response = await allowedAgent.get('/roles:check').set('X-Portal', 'portal-access-gate');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      role: 'portal-gate-allowed',
      roles: ['portal-gate-allowed'],
    });
  });

  it('checks granted Portal access with an existence query', async () => {
    const repository = app.db.getRepository('rolesMultiPortals');
    const findOneSpy = vi.spyOn(repository, 'findOne');
    const countSpy = vi.spyOn(repository, 'count');

    try {
      const response = await allowedAgent.get('/roles:check').set('X-Portal', 'portal-access-gate');

      expect(response.status).toBe(200);
      expect(findOneSpy).toHaveBeenCalledWith({
        fields: ['id'],
        filter: {
          roleName: ['portal-gate-allowed'],
          multiPortalUid: 'portal-access-gate',
        },
      });
      expect(countSpy).not.toHaveBeenCalled();
    } finally {
      findOneSpy.mockRestore();
      countSpy.mockRestore();
    }
  });

  it('applies the same access gate to AI Portals', async () => {
    const [allowedResponse, deniedResponse] = await Promise.all([
      allowedAgent.get('/roles:check').set('X-Portal', 'portal-access-ai'),
      deniedAgent.get('/roles:check').set('X-Portal', 'portal-access-ai'),
    ]);

    expect(allowedResponse.status).toBe(200);
    expect(deniedResponse.status).toBe(403);
    expect(deniedResponse.body.errors).toEqual([
      expect.objectContaining({
        code: 'PORTAL_ACCESS_DENIED',
      }),
    ]);
  });

  it('accepts the legacy /x/ prefix from older AI Portal templates', async () => {
    const [allowedResponse, deniedResponse] = await Promise.all([
      allowedAgent.get('/roles:check').set('X-Portal', '/x/portal-access-ai'),
      deniedAgent.get('/roles:check').set('X-Portal', '/x/portal-access-ai'),
    ]);

    expect(allowedResponse.status).toBe(200);
    expect(deniedResponse.status).toBe(403);
    expect(deniedResponse.body.errors).toEqual([
      expect.objectContaining({
        code: 'PORTAL_ACCESS_DENIED',
      }),
    ]);
    expect(deniedResponse.body.data.portalName).toBe('portal-access-ai');
  });

  it('returns a structured minimal 403 response for a denied role', async () => {
    const baseline = await deniedAgent.get('/roles:check');
    const response = await deniedAgent.get('/roles:check').set('X-Portal', 'portal-access-gate');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      errors: [
        {
          code: 'PORTAL_ACCESS_DENIED',
          message: 'You do not have access to this Portal',
        },
      ],
      data: {
        portalName: 'portal-access-gate',
        role: baseline.body.data.role,
        roles: baseline.body.data.roles,
        roleMode: baseline.body.data.roleMode,
        allowAnonymous: baseline.body.data.allowAnonymous,
      },
    });
    expect(response.body.data).not.toHaveProperty('data');
  });

  it.each(['', ' ', '/x/', '/x/portal-access-gate/extra', '/v/portal-access-gate', 'Portal'])(
    'rejects invalid X-Portal value %j',
    async (portalName) => {
      const response = await deniedAgent.get('/roles:check').set('X-Portal', portalName);

      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual([
        expect.objectContaining({
          code: 'PORTAL_CONTEXT_INVALID',
        }),
      ]);
    },
  );

  it.each(['portal-access-missing', 'portal-access-disabled', 'portal-access-invalid-runtime'])(
    'returns 404 for unavailable Portal %s',
    async (portalName) => {
      const response = await deniedAgent.get('/roles:check').set('X-Portal', portalName);

      expect(response.status).toBe(404);
      expect(response.body.errors).toEqual([
        expect.objectContaining({
          code: 'PORTAL_NOT_FOUND',
        }),
      ]);
    },
  );

  it('allows root and a union role when any constituent role has a grant', async () => {
    const [rootResponse, unionResponse] = await Promise.all([
      rootAgent.get('/roles:check').set('X-Portal', 'portal-access-gate'),
      unionAgent.get('/roles:check').set('X-Portal', 'portal-access-gate'),
    ]);

    expect(rootResponse.status).toBe(200);
    expect(unionResponse.status).toBe(200);
    expect(unionResponse.body.data).toMatchObject({
      role: UNION_ROLE_KEY,
      roles: expect.arrayContaining(['portal-gate-allowed', 'portal-gate-union-other']),
    });
  });

  it.each(['admin', 'mobile'])(
    'keeps fixed %s Portal access governed by its Layout permissions',
    async (portalName) => {
      const response = await deniedAgent.get('/roles:check').set('X-Portal', portalName);

      expect(response.status).toBe(200);
    },
  );

  it('allows roles:check after switching to a granted role', async () => {
    const deniedRoleAgent = await app.agent().login(switchUser, 'portal-gate-denied');
    const deniedResponse = await deniedRoleAgent.get('/roles:check').set('X-Portal', 'portal-access-gate');
    const switchResponse = await deniedRoleAgent.post('/users:setDefaultRole').send({
      roleName: 'portal-gate-allowed',
    });
    const reloadedAgent = await app.agent().login(switchUser);
    const allowedResponse = await reloadedAgent.get('/roles:check').set('X-Portal', 'portal-access-gate');

    expect(deniedResponse.status).toBe(403);
    expect(switchResponse.status).toBe(200);
    expect(allowedResponse.status).toBe(200);
    expect(allowedResponse.body.data.role).toBe('portal-gate-allowed');
  });

  it('keeps unauthenticated roles:check requests as 401', async () => {
    const response = await app.agent().get('/roles:check').set('X-Portal', 'portal-access-gate');

    expect(response.status).toBe(401);
  });
});
