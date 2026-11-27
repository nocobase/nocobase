import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import {
  pagesPlugin,
  settingsPlugin,
  uiPlugin,
} from '@nocobase/app-plugin-authorization/server';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  createAuthorization,
  permissionSetsPlugin,
  type PermissionGrant,
  type PermissionSet,
  type PermissionSetAssignment,
  type PermissionSetStore,
  type PermissionSetSubject,
} from '@nocobase/authorization';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { MailAuthorizationProvider } from '../../server/providers/authorization.js';
import { mailApiRoutes } from '../../server/routes/api.js';
import { mailServiceToken } from '../../server/tokens.js';
import type { MailService } from '../../server/types.js';
import { MAIL_ACCESS } from '../../shared/access.js';

/** One role's grants, as the permission workspace would store them. */
class RoleStore implements PermissionSetStore {
  private readonly set: PermissionSet;
  private readonly assignment: PermissionSetAssignment = {
    id: 'role-member',
    subject: { type: 'user', id: 'member' },
    permissionSet: 'role',
  };
  public constructor(grants: readonly PermissionGrant[]) {
    this.set = { key: 'role', grants };
  }
  public async list(): Promise<readonly PermissionSet[]> {
    return [this.set];
  }
  public async get(key: string): Promise<PermissionSet | undefined> {
    return key === this.set.key ? this.set : undefined;
  }
  public async create(set: PermissionSet): Promise<PermissionSet> {
    return set;
  }
  public async update(
    _key: string,
    set: PermissionSet,
  ): Promise<PermissionSet> {
    return set;
  }
  public async delete(): Promise<void> {}
  public async assign(
    assignment: PermissionSetAssignment,
  ): Promise<PermissionSetAssignment> {
    return assignment;
  }
  public async revoke(): Promise<void> {}
  public async listAssignments(): Promise<readonly PermissionSetAssignment[]> {
    return [this.assignment];
  }
  public async findAssignments(
    subjects: readonly PermissionSetSubject[],
  ): Promise<readonly PermissionSetAssignment[]> {
    return subjects.some(
      (subject) => subject.type === 'user' && subject.id === 'member',
    )
      ? [this.assignment]
      : [];
  }
  public withTransaction(): PermissionSetStore {
    return this;
  }
}

async function roleRouter(
  grants: readonly PermissionGrant[],
  mail: Partial<MailService> = {},
): Promise<Hono> {
  const authorization = createAuthorization({
    plugins: [
      permissionSetsPlugin({ store: new RoleStore(grants) }),
      pagesPlugin(),
      settingsPlugin(),
      uiPlugin(),
    ],
  }) as unknown as AppAuthorization;
  const registration = new ServiceContainer();
  registration.instance(authorizationToken, authorization);
  await new MailAuthorizationProvider({
    container: registration,
  } as AppPluginApplication).boot();
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      context.set('auth', { user: { id: 'member' }, session: {} });
      await next();
    },
  } as Auth);
  container.instance(authorizationToken, {
    ...authorization,
    middleware: () => async (context, next) => {
      context.set(
        'authz',
        authorization.for({ principal: { type: 'user', id: 'member' } }),
      );
      await next();
    },
  } as unknown as AppAuthorization);
  container.instance(mailServiceToken, service(mail));
  const contribution = await mailApiRoutes.createRouter({
    appName: 'test',
    publicBasePath: '',
    config: {
      get: (key: string) =>
        key === 'mail'
          ? { providers: {}, logRetentionDays: 90 }
          : { name: 'test', publicOrigin: 'https://mail.example.com' },
    },
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  const router = new Hono();
  router.route('/api', contribution);
  return router;
}

const post = { method: 'POST' };
const batch = {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    action: 'markRead',
    items: [{ accountId: 'account-2', messageId: 'message-2' }],
  }),
};

/** Every route a Team mail or Mail settings grant guards, and the level it needs. */
const RESTRICTED: readonly (readonly [
  string,
  RequestInit,
  'read' | 'write',
])[] = [
  ['/api/mail/management/accounts', {}, 'read'],
  ['/api/mail/management/messages', {}, 'read'],
  ['/api/mail/management/accounts/account-2/messages/message-2', {}, 'read'],
  ['/api/mail/management/messages/batchApply', batch, 'write'],
  ['/api/mail/settings/overview', {}, 'read'],
  ['/api/mail/settings/accounts', {}, 'read'],
  ['/api/mail/settings/syncRuns', {}, 'read'],
  ['/api/mail/settings/submissions', {}, 'read'],
  ['/api/mail/settings/syncRuns/run-2/retry', post, 'write'],
  ['/api/mail/settings/syncRuns/run-2/cancel', post, 'write'],
  ['/api/mail/settings/submissions/submission-2/retry', post, 'write'],
  ['/api/mail/settings/submissions/submission-2/cancel', post, 'write'],
];

/** 403, or `allowed` for anything past the permission check, such as a 404 for a message the fake service lacks. */
const outcome = (status: number) =>
  status === 401 || status === 403 ? status : 'allowed';

const grant = (type: string, id: string, ...actions: string[]) => ({
  resource: { type, id },
  actions: actions.map((action) => ({ action })),
});

describe('[SEC] Mail permissions registered with the authorization plugin', () => {
  it('registers Team mail and Mail settings with their levels in their own sections', async () => {
    const authorization = createAuthorization({
      plugins: [pagesPlugin(), settingsPlugin(), uiPlugin()],
    }) as unknown as AppAuthorization;
    const container = new ServiceContainer();
    container.instance(authorizationToken, authorization);
    await new MailAuthorizationProvider({
      container,
    } as AppPluginApplication).boot();
    expect(
      authorization.resourceTypes.get('mail').items?.get('mail.management'),
    ).toMatchObject({
      actions: [
        expect.objectContaining({ name: 'view' }),
        expect.objectContaining({ name: 'process' }),
      ],
    });
    expect(
      authorization.ui.placementOf({ type: 'mail', id: 'mail.management' }),
    ).toEqual({ section: 'pages.mail' });
    expect(
      authorization.settings.grant('mail.admin', ['read', 'manage']),
    ).toEqual(grant('settings', 'mail.admin', 'read', 'manage'));
    expect(
      authorization.ui.placementOf({ type: 'settings', id: 'mail.admin' }),
    ).toEqual({ section: 'mail' });
  });

  it('rejects every restricted route for a role that only holds the former page grants', async () => {
    const router = await roleRouter([
      grant('page', 'mail.workspace', 'access'),
      grant('page', 'mail.management', 'access'),
      grant('page', 'mail.admin', 'access'),
    ]);
    for (const [path, init] of RESTRICTED) {
      const response = await router.request(path, init);
      expect({ path, status: response.status }).toEqual({ path, status: 403 });
    }
    // The workspace grant is unchanged.
    expect((await router.request('/api/mail/accounts')).status).toBe(200);
  });

  it('lets a role re-granted read only view, while batch actions, retries and cancellations stay 403', async () => {
    const router = await roleRouter([
      grant('mail', 'mail.management', 'view'),
      grant('settings', 'mail.admin', 'read'),
    ]);
    for (const [path, init, level] of RESTRICTED) {
      const response = await router.request(path, init);
      expect({ path, status: outcome(response.status) }).toEqual({
        path,
        status: level === 'read' ? 'allowed' : 403,
      });
    }
    expect((await router.request('/api/mail/accounts')).status).toBe(403);
  });

  it('lets process and manage act, but not see, without the read level', async () => {
    const manageManagedSubmission = vi.fn<
      MailService['retryManagedSubmission']
    >(async () => submission());
    const router = await roleRouter(
      [
        grant('mail', 'mail.management', 'process'),
        grant('settings', 'mail.admin', 'manage'),
      ],
      { retryManagedSubmission: manageManagedSubmission },
    );
    for (const [path, init, level] of RESTRICTED) {
      const response = await router.request(path, init);
      expect({ path, status: outcome(response.status) }).toEqual({
        path,
        status: level === 'write' ? 'allowed' : 403,
      });
    }
    expect(manageManagedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'member' }),
      'submission-2',
    );
  });

  it("marks other members' logs manageable only with manage", async () => {
    const listManagedSyncRunsPage = vi.fn<
      MailService['listManagedSyncRunsPage']
    >(async () => ({ items: [], total: 0 }));
    for (const actions of [['read'], ['read', 'manage']]) {
      const router = await roleRouter(
        [grant('settings', 'mail.admin', ...actions)],
        { listManagedSyncRunsPage },
      );
      await router.request('/api/mail/settings/syncRuns');
      expect(listManagedSyncRunsPage).toHaveBeenLastCalledWith(
        expect.anything(),
        undefined,
        20,
        {},
        actions.includes('manage'),
      );
    }
  });

  it('uses the same requirements as the client pages', () => {
    expect(MAIL_ACCESS).toEqual({
      workspace: grantRequest('page', 'mail.workspace', 'access'),
      teamView: grantRequest('mail', 'mail.management', 'view'),
      teamProcess: grantRequest('mail', 'mail.management', 'process'),
      settingsRead: grantRequest('settings', 'mail.admin', 'read'),
      settingsManage: grantRequest('settings', 'mail.admin', 'manage'),
    });
  });
});

function grantRequest(type: string, id: string, action: string) {
  return { resource: { type, id }, action };
}

function submission(): import('../../shared/mail.js').MailManagedSubmissionView {
  return {
    id: 'submission-2',
    accountId: 'account-2',
    status: 'pending',
    recipientCount: 1,
    createdAt: '2026-09-06T08:00:00.000Z',
    updatedAt: '2026-09-06T08:00:00.000Z',
  };
}

function syncRun(): import('../../shared/mail.js').MailSyncRunView {
  return {
    id: 'run-2',
    accountId: 'account-2',
    mode: 'incremental',
    phase: 'completed',
    status: 'cancelled',
    policy: { batchSize: 100 },
    processedMessages: 0,
    processedPages: 0,
    createdAt: '2026-09-06T08:00:00.000Z',
    updatedAt: '2026-09-06T08:00:00.000Z',
  };
}

function service(overrides: Partial<MailService>): MailService {
  return new Proxy(
    {
      listAccounts: async () => [],
      listProviders: async () => [],
      countAccountsByProvider: async () => [],
      listAdminAccounts: async () => [],
      listTeamAccounts: async () => [],
      listManagedSyncRunsPage: async () => ({ items: [], total: 0 }),
      listManagedSubmissionsPage: async () => ({ items: [], total: 0 }),
      listManagedMessages: async () => ({ items: [], total: 0 }),
      getManagedMessage: async () => undefined,
      manageMessages: async () => ({ items: [], succeeded: 0, failed: 0 }),
      retryManagedSyncRun: async () => syncRun(),
      cancelManagedSyncRun: async () => syncRun(),
      retryManagedSubmission: async () => submission(),
      cancelManagedSubmission: async () => submission(),
      ...overrides,
    } as Record<string, unknown>,
    {
      get(target, property: string) {
        if (property in target) return target[property];
        throw new Error(`Unexpected Mail service call: ${property}`);
      },
    },
  ) as unknown as MailService;
}
