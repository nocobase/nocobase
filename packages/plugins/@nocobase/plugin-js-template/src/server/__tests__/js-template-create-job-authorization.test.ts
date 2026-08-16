/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { vi } from 'vitest';

import type { JsTemplateCreateJob } from '../../shared/types';
import { authorizeJsTemplateCreateJob } from '../authorizeJsTemplateCreateJob';

describe('JS Template create-job worker authorization', () => {
  it('uses only the request-selected role instead of borrowing a newly assigned privileged role', async () => {
    const can = vi.fn(({ roles }: { roles: string[] }) => (roles.includes('admin') ? {} : null));
    const dependencies = createAuthorizationHarness({
      roles: ['member', 'admin'],
      can,
    });

    await expect(authorizeJsTemplateCreateJob(dependencies, createJob())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
    expect(can).toHaveBeenCalledWith({ roles: ['member'], resource: 'jsTemplate', action: 'create' });
    expect(can).not.toHaveBeenCalledWith(expect.objectContaining({ roles: ['member', 'admin'] }));
  });

  it('accepts only the persisted union-role set and ignores roles granted after enqueue', async () => {
    const can = vi.fn(() => ({}));
    const dependencies = createAuthorizationHarness({ roles: ['member', 'editor', 'admin'], can });
    const job = createJob({
      authorizationRole: '__union__',
      authorizationRoles: ['member', 'editor'],
    });

    await expect(authorizeJsTemplateCreateJob(dependencies, job)).resolves.toBeUndefined();
    expect(can).toHaveBeenCalledWith({
      roles: ['editor', 'member'],
      resource: 'jsTemplate',
      action: 'create',
    });
  });

  it('rejects a persisted union role after the system returns to default role mode', async () => {
    const dependencies = createAuthorizationHarness({ roles: ['member', 'editor'], roleMode: 'default' });
    const job = createJob({ authorizationRole: '__union__', authorizationRoles: ['member', 'editor'] });

    await expect(authorizeJsTemplateCreateJob(dependencies, job)).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
  });

  it('rejects a persisted single role after the system switches to union-only mode', async () => {
    const dependencies = createAuthorizationHarness({ roleMode: 'only-use-union' });

    await expect(authorizeJsTemplateCreateJob(dependencies, createJob())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
  });

  it('accepts a persisted department role while the actor remains in the linked department', async () => {
    const can = vi.fn(() => ({}));
    const dependencies = createAuthorizationHarness({
      roles: [],
      departmentIds: [11],
      departmentRoles: ['department-editor'],
      can,
    });
    const job = createJob({ authorizationRole: 'department-editor', authorizationRoles: ['department-editor'] });

    await expect(authorizeJsTemplateCreateJob(dependencies, job)).resolves.toBeUndefined();
    expect(can).toHaveBeenCalledWith({ roles: ['department-editor'], resource: 'jsTemplate', action: 'create' });
  });

  it.each(['users', 'rolesUsers'] as const)(
    'fails closed when the %s authorization collection is unavailable',
    async (missingCollection) => {
      const dependencies = createAuthorizationHarness({ missingCollections: [missingCollection] });
      await expect(authorizeJsTemplateCreateJob(dependencies, createJob())).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PERMISSION_DENIED',
      });
    },
  );

  it.each([
    ['deleted actor', { actorExists: false }],
    ['removed role membership', { roles: ['viewer'] }],
    ['revoked ACL', { can: vi.fn(() => null) }],
  ])('rejects %s before worker writes', async (_label, options) => {
    const dependencies = createAuthorizationHarness(options);
    await expect(authorizeJsTemplateCreateJob(dependencies, createJob())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });
  });

  it('checks every Git-specific permission using the same persisted role context', async () => {
    const can = vi.fn(() => ({}));
    const dependencies = createAuthorizationHarness({ roles: ['member', 'admin'], can });

    await expect(authorizeJsTemplateCreateJob(dependencies, createJob({ sourceType: 'git' }))).resolves.toBeUndefined();
    expect(can.mock.calls.map(([input]) => input)).toEqual([
      { roles: ['member'], resource: 'jsTemplate', action: 'create' },
      { roles: ['member'], resource: 'jsTemplate', action: 'manageSyncSource' },
      { roles: ['member'], resource: 'jsTemplate', action: 'pullFromSyncSource' },
    ]);
  });
});

interface AuthorizationHarnessOptions {
  actorExists?: boolean;
  roles?: string[];
  departmentIds?: Array<string | number>;
  departmentRoles?: string[];
  roleMode?: string;
  missingCollections?: string[];
  can?: ReturnType<typeof vi.fn>;
}

function createAuthorizationHarness(options: AuthorizationHarnessOptions = {}) {
  const roles = options.roles ?? ['member'];
  const departmentIds = options.departmentIds ?? [];
  const departmentRoles = options.departmentRoles ?? [];
  const repositories = {
    users: {
      findOne: vi.fn(async () => (options.actorExists === false ? null : { id: 7 })),
    },
    rolesUsers: {
      find: vi.fn(async () => roles.map((roleName) => ({ roleName }))),
    },
    departmentsUsers: {
      find: vi.fn(async () => departmentIds.map((departmentId) => ({ departmentId }))),
    },
    departmentsRoles: {
      find: vi.fn(async () => departmentRoles.map((roleName) => ({ roleName }))),
    },
    systemSettings: {
      findOne: vi.fn(async () => ({ roleMode: options.roleMode ?? 'allow-use-union' })),
    },
  };
  const db = {
    hasCollection: vi.fn((name: string) => name in repositories && !(options.missingCollections || []).includes(name)),
    getRepository: vi.fn((name: keyof typeof repositories) => repositories[name]),
  } as unknown as Database;
  return {
    db,
    acl: { can: options.can ?? vi.fn(() => ({})) },
  };
}

function createJob(overrides: Partial<JsTemplateCreateJob> = {}): JsTemplateCreateJob {
  return {
    id: 'jtcj_authorize',
    applicationName: 'main',
    targetProjectId: 'jtp_authorize',
    name: 'authorize',
    normalizedName: 'authorize',
    title: null,
    description: null,
    sourceType: 'starter',
    idempotencyKey: 'create-authorize',
    requestHash: 'request-hash-authorize',
    status: 'running',
    resultProjectId: null,
    payload: { sourceType: 'starter', message: 'Initial source' },
    errorCode: null,
    errorMessage: null,
    reservationKey: 'sha256:authorize',
    actorUserId: '7',
    sessionId: 'session-authorize',
    authorizationRole: 'member',
    authorizationRoles: ['member'],
    dismissed: false,
    requestId: 'request-authorize',
    claimToken: 'claim-authorize',
    claimOwner: 'runner-authorize',
    leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    heartbeatAt: new Date().toISOString(),
    attempt: 1,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
