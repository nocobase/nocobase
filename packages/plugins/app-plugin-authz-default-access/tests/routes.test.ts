import { describe, expect, it, vi } from 'vitest';
import {
  AuthorizationDeniedError,
  selection,
  type AuthorizationContext,
} from '@nocobase/authorization/core';
import type { DefaultAccessRule } from '@nocobase/authorization/default-access';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import {
  createSettingsRouter,
  documentAuthorizationRoutes,
} from '@nocobase/app-plugin-authorization/server/extension';
import {
  ApiDocsService,
  findUndeclaredApiRoutes,
  type ApiDocsTarget,
} from '@nocobase/app-server/router';
import { defaultAccess } from '../server/authorization.js';

const PATH = '/defaultAccess';
const SETTINGS = { type: 'settings', id: 'authorization.default-access' };

class MemoryStore {
  readonly rules = new Map<string, DefaultAccessRule>();
  list = async () => [...this.rules.values()];
  get = async (key: string) => this.rules.get(key);
  create = async (rule: DefaultAccessRule) => {
    this.rules.set(rule.key, rule);
    return rule;
  };
  update = async (key: string, rule: DefaultAccessRule) => {
    this.rules.delete(key);
    this.rules.set(rule.key, rule);
    return rule;
  };
  delete = async (key: string) => {
    this.rules.delete(key);
  };
  withTransaction = () => this;
}

const rule: DefaultAccessRule = {
  key: 'orders-rule',
  resource: { type: 'database.collection', id: 'orders' },
  actions: [{ action: 'read', selection: selection.records(['o1']) }],
};

function fixture(permitted = true) {
  const store = new MemoryStore();
  const authz = createAppAuthorization({
    config: { plugins: [defaultAccess({ store })] },
  });
  authz.database.collections.add({ name: 'orders', title: 'Orders' });
  const require = vi.fn(async () => {
    if (!permitted)
      throw new AuthorizationDeniedError({ effect: 'deny', reasons: [] });
  });
  const call = async (path: string, init?: RequestInit): Promise<Response> => {
    const response = await authz.routes.handle({
      request: new Request(`http://app/api/authorization${path}`, init),
      path,
      authorization: { require } as unknown as AuthorizationContext,
    });
    if (!response) throw new Error(`No route answered ${path}`);
    return response;
  };
  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { authz, store, require, call, json };
}

describe('default access through the authorization dispatcher', () => {
  it('registers its settings item and route', () => {
    const { authz } = fixture();
    expect(
      authz.resourceTypes.get('settings').items?.get(SETTINGS.id),
    ).toMatchObject({
      actions: ['read', 'create', 'update', 'delete'].map((name) =>
        expect.objectContaining({ name }),
      ),
    });
    expect(authz.ui.placementOf(SETTINGS)).toEqual({
      section: 'authorization',
      order: 10,
    });
    expect(authz.routes.list()).toContain(PATH);
    expect('defaultAccess' in authz).toBe(true);
  });

  it('gates every route on its own settings item', async () => {
    const { call, require } = fixture();
    for (const path of [PATH, `${PATH}/options`]) {
      expect((await call(path)).status).toBe(200);
      expect(require).toHaveBeenLastCalledWith({
        resource: SETTINGS,
        action: 'read',
      });
    }
    // `orders` is registered for authorization but no database holds it, so it has no records to page.
    const records = await call(`${PATH}/records/orders`);
    expect(records.status).toBe(404);
    await expect(records.json()).resolves.toMatchObject({
      error: { reason: 'COLLECTION_NOT_FOUND', domain: 'authorization' },
    });
    expect(require).toHaveBeenLastCalledWith({
      resource: SETTINGS,
      action: 'read',
    });
    expect((await call(`${PATH}/subjects/user`)).status).toBe(404);
  });

  it('answers 403 when the settings check fails, before reading the body', async () => {
    const { call, json } = fixture(false);
    expect((await call(PATH)).status).toBe(403);
    expect((await call(`${PATH}/options`)).status).toBe(403);
    expect((await call(PATH, json('POST', { unknown: true }))).status).toBe(
      403,
    );
  });

  it('creates, lists, updates and deletes a rule with settings checks', async () => {
    const { call, json, require, store } = fixture();

    expect((await call(PATH, json('POST', rule))).status).toBe(201);
    expect(require).toHaveBeenLastCalledWith({
      resource: SETTINGS,
      action: 'create',
    });
    expect(await (await call(PATH)).json()).toEqual({
      data: [rule],
      meta: { total: 1 },
    });
    const updated = {
      ...rule,
      actions: [{ action: 'read', selection: selection.records(['o2']) }],
    };
    expect(
      (await call(`${PATH}/orders-rule`, json('PATCH', updated))).status,
    ).toBe(200);
    expect(require).toHaveBeenLastCalledWith({
      resource: SETTINGS,
      action: 'update',
    });
    expect((await call(`${PATH}/missing`, json('PATCH', updated))).status).toBe(
      404,
    );
    expect(
      (await call(`${PATH}/orders-rule`, { method: 'DELETE' })).status,
    ).toBe(204);
    const gone = await call(`${PATH}/orders-rule`, { method: 'DELETE' });
    expect(gone.status).toBe(404);
    await expect(gone.json()).resolves.toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'RULE_NOT_FOUND',
        domain: 'authorization',
      },
    });
    expect(require).toHaveBeenLastCalledWith({
      resource: SETTINGS,
      action: 'delete',
    });
    expect(store.rules.size).toBe(0);
  });

  it('rejects malformed rules and rules outside the model', async () => {
    const { call, json } = fixture();
    const malformed = await call(
      PATH,
      json('POST', { resource: { type: 'x', id: 'y' } }),
    );
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
    });
    expect(
      (await call(PATH, json('POST', { ...rule, subjects: [] }))).status,
    ).toBe(400);
    expect(
      (
        await call(
          PATH,
          json('POST', {
            ...rule,
            resource: { type: 'database.collection', id: 'invoices' },
          }),
        )
      ).status,
    ).toBe(400);
  });

  it('answers 409 for a second rule on the same resource', async () => {
    const { call, json, store } = fixture();
    expect((await call(PATH, json('POST', rule))).status).toBe(201);
    const second = await call(PATH, json('POST', { ...rule, key: 'again' }));
    expect(second.status).toBe(409);
    expect(await second.json()).toMatchObject({
      error: {
        status: 'ALREADY_EXISTS',
        reason: 'DEFAULT_ACCESS_CONFLICT',
        domain: 'authorization',
      },
    });
    // Updating the rule in place, even under a new key, is not a conflict.
    expect(
      (
        await call(
          `${PATH}/orders-rule`,
          json('PATCH', { ...rule, key: 'orders-renamed' }),
        )
      ).status,
    ).toBe(200);
    expect([...store.rules.keys()]).toEqual(['orders-renamed']);
  });
  it('refuses a key another rule already uses, on create and on rename', async () => {
    const { call, json, store, authz } = fixture();
    authz.database.collections.add({ name: 'invoices', title: 'Invoices' });
    expect((await call(PATH, json('POST', rule))).status).toBe(201);
    const second = {
      ...rule,
      key: 'second-rule',
      resource: { type: 'database.collection', id: 'invoices' },
    };
    expect((await call(PATH, json('POST', second))).status).toBe(201);
    for (const response of [
      await call(PATH, json('POST', rule)),
      await call(`${PATH}/second-rule`, json('PATCH', { key: rule.key })),
    ]) {
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        error: {
          status: 'ALREADY_EXISTS',
          reason: 'RULE_ALREADY_EXISTS',
          domain: 'authorization',
          metadata: { key: rule.key },
        },
      });
    }
    expect([...store.rules.keys()].sort()).toEqual([
      'orders-rule',
      'second-rule',
    ]);
    // Keeping its own key is not a conflict.
    expect(
      (await call(`${PATH}/second-rule`, json('PATCH', { key: 'second-rule' })))
        .status,
    ).toBe(200);
  });

  it('answers a unique-constraint violation from the store as the same conflict', async () => {
    const { call, json, store } = fixture();
    store.create = async () => {
      throw Object.assign(new Error('duplicate key value'), { code: '23505' });
    };
    const response = await call(PATH, json('POST', rule));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { reason: 'RULE_ALREADY_EXISTS' },
    });
  });

  it('refuses the keys of its fixed route segments, on create and on rename', async () => {
    const { call, json } = fixture();
    expect((await call(PATH, json('POST', rule))).status).toBe(201);
    for (const key of ['options', 'subjects', 'records'])
      for (const response of [
        await call(PATH, json('POST', { ...rule, key })),
        await call(`${PATH}/orders-rule`, json('PATCH', { key })),
      ]) {
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({
          error: {
            reason: 'INVALID_INPUT',
            fieldViolations: [expect.objectContaining({ field: 'key' })],
          },
        });
      }
  });

  it('names the offending field when the model refuses a rule', async () => {
    const { call, json } = fixture();
    const unknownCollection = await call(
      PATH,
      json('POST', {
        ...rule,
        resource: { type: 'database.collection', id: 'missing' },
      }),
    );
    expect(unknownCollection.status).toBe(400);
    await expect(unknownCollection.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_AUTHORIZATION_INPUT',
        domain: 'authorization',
        fieldViolations: [
          { field: 'resource.id', description: expect.any(String) },
        ],
      },
    });
    const scopeKey = await call(
      PATH,
      json('POST', {
        ...rule,
        actions: [{ ...rule.actions[0], scopeKey: 'orders' }],
      }),
    );
    await expect(scopeKey.json()).resolves.toMatchObject({
      error: { fieldViolations: [{ field: 'actions.0.scopeKey' }] },
    });
  });

  it('declares its routes for the API document', async () => {
    const { authz } = fixture();
    const warnings: string[] = [];
    // The routes behind the `/api/authorization` dispatcher, registered as the authorization plugin does, below an empty
    // `/api` router.
    const docs = new ApiDocsService();
    documentAuthorizationRoutes(docs, authz.routes, (message) =>
      warnings.push(message),
    );
    docs.attach({
      api: createSettingsRouter() as unknown as ApiDocsTarget['api'],
      describe: () => ({ info: { title: 'Test', version: '1.0.0' } }),
    });
    expect(findUndeclaredApiRoutes(docs)).toEqual([]);

    const document = await docs.getDocument();
    expect(warnings).toEqual([]);
    const operations = Object.entries(document.paths ?? {})
      .filter(([path]) => path.startsWith('/api/authorization/defaultAccess'))
      .flatMap(([, item]) =>
        Object.values(item ?? {}).map(
          (operation) => (operation as { operationId?: string }).operationId,
        ),
      )
      .sort();
    expect(operations).toEqual(
      [
        'authorizationCreateDefaultAccessRule',
        'authorizationDeleteDefaultAccessRule',
        'authorizationListDefaultAccessRuleOptions',
        'authorizationListDefaultAccessRuleRecords',
        'authorizationListDefaultAccessRuleSubjects',
        'authorizationListDefaultAccessRules',
        'authorizationResolveDefaultAccessRuleSubjects',
        'authorizationUpdateDefaultAccessRule',
      ].sort(),
    );
    expect(
      document.paths?.['/api/authorization/defaultAccess']?.post?.tags,
    ).toEqual(['Authorization']);
    expect(document.components?.schemas).toHaveProperty(
      'AuthorizationDefaultAccessRule',
    );
  });
});
