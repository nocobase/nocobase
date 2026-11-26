import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { authorizationToken } from '@nocobase/app-plugin-authorization';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { auditServiceToken, type AuditEvent } from '@nocobase/audit';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { mutationReceiptCollection } from '@nocobase/app-server/router';
import { createTestApp } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

import { createApp } from '../../server/app.js';
import appRuntime from '../../server/runtime.js';

const rules = [
  [
    'defaultAccess',
    'default-access',
    'authorizationDefaultAccessRules',
    undefined,
  ],
  [
    'restrictionRules',
    'restriction-rules',
    'authorizationRestrictionRules',
    'authorizationRestrictionRuleAssignments',
  ],
  [
    'sharingRules',
    'sharing-rules',
    'authorizationSharingRules',
    'authorizationSharingRuleAssignments',
  ],
] as const;

it('audits forwarded settings writes and records a default-access receipt only once', async () => {
  const events: AuditEvent[] = [];
  const app = await createTestApp({
    createServer: defineStandaloneServer({
      rootDir: path.resolve(import.meta.dirname, '../..'),
      appRuntime,
      async createServer(scope) {
        const runtime = await resolveAppRuntime(appRuntime, scope);
        const app = createApp(runtime);
        app.container.resolve(auditServiceToken).registerDriver({
          name: 'memory',
          createTransport: () => ({
            write(event) {
              if (
                rules.some(
                  ([, settings]) =>
                    event.resource === `settings:authorization.${settings}`,
                )
              )
                events.push(event);
            },
          }),
        });
        return startApplicationInScope(scope, app);
      },
    }).create,
    config: {
      app: { publicOrigin: 'http://localhost' },
      audit: { enabled: true, transports: { capture: { driver: 'memory' } } },
      auth: { secret: 'test-auth-secret-at-least-32-characters' },
    },
  });
  try {
    const admin = await signIn(app, DEFAULT_ADMIN_CREDENTIALS);
    const connection = app.connection;
    await connection.builder.createCollection('auditExamples', (builder) => {
      builder.string('id').primary();
    });
    app.application.container
      .resolve(authorizationToken)
      .database.collections.add({ name: 'auditExamples' });
    for (const [route, settings, collection, assignmentCollection] of rules) {
      const key = 'audit-rule';
      const resource = `settings:authorization.${settings}`;
      const url = `/authorization/${route}`;
      const mutation = (method: string, body?: unknown): RequestInit => ({
        method,
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          ...(route === 'defaultAccess'
            ? { 'Idempotency-Key': `${Date.now()}.${randomUUID()}` }
            : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const create = mutation('POST', {
        key,
        resource: { type: 'database.collection', id: 'auditExamples' },
        actions: [
          { action: 'read', selection: { type: 'records', ids: ['example'] } },
        ],
        ...(assignmentCollection
          ? { subjects: [{ type: 'user', id: admin.user.id }] }
          : {}),
      });
      const countRules = () => connection.repository(collection).count();
      const created = await admin.fetch(url, create);
      if (!created.ok) throw new Error(await created.text());
      expect(created.status).toBe(201);
      if (route === 'defaultAccess') {
        const replayed = await admin.fetch(url, create);
        expect(replayed.headers.get('Idempotency-Replayed')).toBe('true');
        expect(await replayed.json()).toEqual(await created.json());
      }
      expect(await countRules()).toBe(1);
      const updateInput = mutation('PATCH', { key: 'renamed-rule' });
      const update = await admin.fetch(`${url}/${key}`, updateInput);
      expect(update.status).toBe(200);
      const deleteInput = mutation('DELETE');
      const removed = await admin.fetch(`${url}/renamed-rule`, deleteInput);
      expect(removed.status).toBe(204);
      expect(await countRules()).toBe(0);
      if (route === 'defaultAccess') {
        for (const [path, input, first] of [
          [`${url}/${key}`, updateInput, update],
          [`${url}/renamed-rule`, deleteInput, removed],
        ] as const) {
          const replay = await admin.fetch(path, input);
          expect(replay.status).toBe(first.status);
          expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
          expect(await replay.text()).toEqual(await first.text());
        }
        const receipts = connection.repository(mutationReceiptCollection);
        const before = await receipts.count();
        expect(
          (await admin.fetch(`${url}/renamed-rule`, mutation('DELETE'))).status,
        ).toBe(404);
        expect(await receipts.count()).toBe(before);
        expect(events.at(-1)).toMatchObject({
          action: 'delete',
          resource,
          outcome: 'failure',
          status: 404,
          targets: [{ collection, key: 'renamed-rule' }],
        });
      }
      expect(
        events.filter(
          (event) => event.resource === resource && event.outcome === 'success',
        ),
      ).toMatchObject([
        { action: 'create', status: 201, targets: [{ collection, key }] },
        {
          action: 'update',
          status: 200,
          targets: [{ collection, key: 'renamed-rule' }],
          source: { collection, key },
        },
        {
          action: 'delete',
          status: 204,
          targets: [{ collection, key: 'renamed-rule' }],
        },
      ]);
    }
  } finally {
    await app.close();
  }
});
