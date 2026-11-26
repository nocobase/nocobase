import { isDeepStrictEqual } from 'node:util';

import authentication, {
  type AuthEnv,
} from '@nocobase/app-plugin-authentication/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { Application } from '@nocobase/app-server/application';
import { CachingProvider } from '@nocobase/app-server/caching';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import {
  defineServerPlugins,
  resolveAppServerPlugins,
} from '@nocobase/app-server/plugins';
import {
  ApiError,
  repositoryIdempotencyToken,
} from '@nocobase/app-server/router';
import { createTestAppConfig } from '@nocobase/app-testing/server';
import type { PermissionGrant } from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import type { Context } from 'hono';
import { expect, it, onTestFinished } from 'vitest';

import authorization, {
  authorizationToken,
  type PermissionSetMutationContext,
} from '../../../server/index.js';

const origin = 'http://localhost';
const path = '/authorization/permissionSets';
const role = `${path}/operator`;
const grant = (type: string, id: string): PermissionGrant => ({
  resource: { type, id },
  actions: [{ action: 'read' }],
});
const inventory = grant('portal', 'inventory');
const reports = grant('settings', 'reports');
const archives = grant('settings', 'archives');

const portalGrants = (grants: readonly PermissionGrant[] = []) =>
  grants
    .filter(({ resource }) => resource.type === 'portal')
    .flatMap(({ resource, actions }) =>
      actions.map(({ action }) => JSON.stringify([resource.id, action])),
    )
    .sort();

it.each(['with receipts', 'without receipts'])(
  'checks direct Permission Set mutations %s',
  async (mode) => {
    const receiptEnabled = mode === 'with receipts';
    const fixture = await createTestAppConfig();
    onTestFinished(() => fixture.dispose());
    const config = new AppConfig().loadFile(fixture.path);
    await config.loadAll();
    const { dialect, databaseDriver } =
      fixture.testDatabases.connectionConfig();
    config.mergeDefaults({
      app: { name: 'main', publicOrigin: origin, publicBasePath: '/' },
      auth: {
        secret: 'permission-set-check-test-secret-over-32-characters',
        emailAndPassword: { enabled: true },
      },
      caching: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
      database: { default: 'main', drivers: { [dialect]: databaseDriver } },
      snowflake: { workerId: 0 },
    });
    const app = new Application({
      config,
      paths: createAppPaths({ rootDir: fixture.directory }),
    });
    onTestFinished(() => app.shutdown());
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(CachingProvider);
    app.addServiceProvider(IdGeneratorProvider);
    app.addServerPlugins(
      resolveAppServerPlugins(
        fixture.directory,
        defineServerPlugins([authentication, authorization]),
      ),
    );
    if (receiptEnabled) {
      app.container.instance(repositoryIdempotencyToken, {
        required: true,
        principal: (context) =>
          (context as Context<AuthEnv>).get('auth')?.user.id,
      });
    }
    await app.start();
    const connection = app.container.resolve(databaseManagerToken).connection();
    if (receiptEnabled) {
      await connection.builder.createCollection('mutationReceipts', (c) => {
        c.string('id', { length: 64 }).primary();
        c.string('digest', { length: 64 }).notNull();
        c.json('result').nullable();
        c.datetime('expiresAt').notNull();
      });
    }
    const authz = app.container.resolve(authorizationToken);
    const target = {
      fetch: (request: Request) => app.fetch(request),
      publicBasePath: '',
    };
    const admin = await signIn(target, {
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      password: DEFAULT_ADMIN_CREDENTIALS.password,
    });
    await authz.permissionSets.create({
      key: 'permission-set-editor',
      grants: [
        authz.settings.grant('authorization.permission-sets', [
          'read',
          'create',
          'update',
          'delete',
        ]),
      ],
    });
    await authz.permissionSets.assign({
      permissionSet: 'permission-set-editor',
      subject: { type: 'user', id: admin.user.id },
    });
    const memberCredentials = {
      email: 'test-member@example.test',
      password: 'permission-set-test-password',
    };
    const signUp = await target.fetch(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({ name: 'Test Member', ...memberCredentials }),
      }),
    );
    expect(signUp.status).toBe(200);
    const member = await signIn(target, memberCredentials);

    function mutation(method: string, body?: object): RequestInit {
      const headers = new Headers({
        'content-type': 'application/json',
        origin,
      });
      if (receiptEnabled)
        headers.set('Idempotency-Key', `${Date.now()}.${crypto.randomUUID()}`);
      return { method, headers, body: JSON.stringify(body) };
    }

    // A host without registered checks can save through the generic API.
    const created = await admin.fetch(
      path,
      mutation('POST', {
        key: 'operator',
        title: 'Operator',
        grants: [inventory, reports],
      }),
    );
    expect(created.status).toBe(201);
    const original: unknown = await (await admin.fetch(role)).json();
    const storedRole = () =>
      connection.query
        .selectFrom('authorizationPermissionSets')
        .selectAll()
        .where('key', '=', 'operator')
        .executeTakeFirst();
    const originalRow = await storedRole();
    await authz.permissionSets.assign({
      permissionSet: 'operator',
      subject: { type: 'user', id: member.user.id },
    });
    const originalAssignments =
      await authz.permissionSets.listAssignments('operator');
    const notifications: string[] = [];
    authz.onGrantsChanged((subject) => {
      notifications.push(subject.id);
    });

    let restricted = true;
    const observed: PermissionSetMutationContext['operation'][] = [];
    const stop = authz.addPermissionSetMutationCheck(async (change) => {
      observed.push(change.operation);
      expect(change.authorization.identity.principal.id).toBe(admin.user.id);
      expect(change.transaction).not.toBe(connection);
      if (change.previous) {
        const current = await authz.permissionSets
          .withTransaction(change.transaction)
          .get(change.previous.key);
        expect(current).toEqual(change.previous);
      }
      if (
        restricted &&
        !isDeepStrictEqual(
          portalGrants(change.previous?.grants),
          portalGrants(change.next?.grants),
        )
      ) {
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'PORTAL_GRANTS_READ_ONLY',
          domain: 'host',
          message: 'Portal grants are read-only.',
        });
      }
    });

    const edit = mutation('PATCH', {
      key: 'renamed',
      title: 'Renamed',
      grants: [archives],
    });
    expect(
      (await target.fetch(new Request(`${origin}/api${role}`, edit))).status,
    ).toBe(401);
    expect((await member.fetch(role, edit)).status).toBe(403);
    expect(
      (await admin.fetch(role, mutation('PATCH', { grants: null }))).status,
    ).toBe(400);
    const unprotect = authz.permissionSets.protect({
      owner: 'test-host',
      keys: ['operator'],
    });
    const protectedEdit = await admin.fetch(role, edit);
    expect(protectedEdit.status).toBe(400);
    expect(await protectedEdit.json()).toMatchObject({
      error: { reason: 'PROTECTED_PERMISSION_SET' },
    });
    expect(observed).toEqual([]);

    unprotect();

    const deniedCreate = await admin.fetch(
      path,
      mutation('POST', { key: 'new-role', grants: [inventory] }),
    );
    const deniedEdit = await admin.fetch(role, edit);
    const deniedDelete = await admin.fetch(role, mutation('DELETE'));
    for (const denied of [deniedCreate, deniedEdit, deniedDelete]) {
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({
        error: { reason: 'PORTAL_GRANTS_READ_ONLY', domain: 'host' },
      });
    }
    expect(observed).toEqual(['create', 'update', 'delete']);
    expect(await (await admin.fetch(role)).json()).toEqual(original);
    expect(await storedRole()).toEqual(originalRow);
    expect((await admin.fetch(`${path}/renamed`)).status).toBe(404);
    expect((await admin.fetch(`${path}/new-role`)).status).toBe(404);
    expect(await authz.permissionSets.listAssignments('operator')).toEqual(
      originalAssignments,
    );
    expect(notifications).toEqual([]);
    if (receiptEnabled)
      expect(await connection.repository('mutationReceipts').count()).toBe(1);

    expect(
      (await admin.fetch(role, mutation('PATCH', { title: null }))).status,
    ).toBe(200);
    const unrelated = await admin.fetch(
      role,
      mutation('PATCH', { grants: [archives, inventory] }),
    );
    expect(unrelated.status).toBe(200);
    expect(await unrelated.json()).toMatchObject({
      data: { grants: [archives, inventory] },
    });

    restricted = false;
    const allowed = await admin.fetch(role, edit);
    expect(allowed.status).toBe(200);
    const allowedBody: unknown = await allowed.json();
    expect(allowedBody).toMatchObject({
      data: { key: 'renamed', title: 'Renamed', grants: [archives] },
    });
    expect(await authz.permissionSets.listAssignments('renamed')).toHaveLength(
      1,
    );
    expect(notifications).toEqual(Array(3).fill(member.user.id));

    restricted = true;
    if (receiptEnabled) {
      const replay = await admin.fetch(role, edit);
      expect(replay.status).toBe(200);
      expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
      expect(await replay.json()).toEqual(allowedBody);
    }
    expect(observed).toEqual([
      'create',
      'update',
      'delete',
      'update',
      'update',
      'update',
    ]);
    stop();
    expect(
      (
        await admin.fetch(
          `${path}/renamed`,
          mutation('PATCH', { grants: [inventory] }),
        )
      ).status,
    ).toBe(200);
    expect(observed).toHaveLength(6);
  },
);
