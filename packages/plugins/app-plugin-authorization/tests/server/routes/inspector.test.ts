import { databasePlugin } from '../../../server/database/plugin.js';
import { createAuthorization } from '../../helpers/authorization-fixture.js';
import { permissionSetsPlugin } from '@nocobase/authorization';
import type {
  AuthorizationDecision,
  AuthorizationPlugin,
} from '@nocobase/authorization/core';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { AppAuthorization as Authorization } from '../../../server/index.js';
import { mountedRouter, testIdentity } from '../../helpers/mounted-router.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';

/**
 * A resource type answering with whichever effect the id asks for, so the
 * endpoint is tested against the core's own shapes rather than one plugin's.
 */
const decisions: AuthorizationPlugin = {
  id: 'test-decisions',
  setup(authz) {
    authz.resourceTypes.add({
      type: 'test.resource',
      actions: ['read'],
      authorize: (request): Promise<AuthorizationDecision> =>
        Promise.resolve(
          request.resource.id === 'conditional'
            ? {
                effect: 'conditional',
                conditions: { type: 'filter', field: 'ownerId' },
                reasons: [
                  {
                    code: 'SCOPED',
                    message: 'Records the person owns',
                    plugin: 'test-decisions',
                  },
                ],
              }
            : request.resource.id === 'permitted'
              ? {
                  effect: 'permit',
                  reasons: [
                    {
                      code: 'GRANTED',
                      message: 'A permission set grants it',
                      plugin: 'test-decisions',
                    },
                  ],
                }
              : {
                  effect: 'deny',
                  reasons: [{ code: 'NO_GRANT', message: 'Nothing grants it' }],
                },
        ),
    });
  },
};

describe('the permission inspector endpoint', () => {
  it('checks a bounded batch and requires the same settings permission', async () => {
    const payload = {
      subject: { type: 'user', id: 'alice' },
      checks: ['permitted', 'conditional', 'denied'].map((id) => ({
        resource: { type: 'test.resource', id },
        action: 'read',
      })),
    };
    const send = (router: Hono, value: unknown) =>
      router.request('/api/authorization/inspector/batchDecide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(value),
      });
    const forbidden = await mountedRouter(
      await authorization({ settings: false }),
    );
    expect((await send(forbidden, payload)).status).toBe(403);
    // Permission is checked before the body, so a malformed request is refused the same way.
    expect((await send(forbidden, {})).status).toBe(403);
    const router = await mountedRouter(await authorization({ settings: true }));
    const response = await send(router, payload);
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      data: { decision: AuthorizationDecision }[];
    };
    expect(result.data.map((item) => item.decision.effect)).toEqual([
      'permit',
      'conditional',
      'deny',
    ]);
    for (const invalid of [
      null,
      {},
      { ...payload, checks: [] },
      {
        ...payload,
        checks: Array.from({ length: 101 }, () => payload.checks[0]),
      },
      { ...payload, checks: [null] },
    ]) {
      expect((await send(router, invalid)).status).toBe(400);
    }
  });

  it('inspects non-user subjects without adding authenticated-user grants', async () => {
    const authz = await authorization({ settings: true });
    const seen: unknown[] = [];
    authz.resourceTypes.add({
      type: 'subject-check',
      actions: ['read'],
      authorize(request) {
        seen.push({ principal: request.principal, subjects: request.subjects });
        return Promise.resolve({ effect: 'permit', reasons: [] });
      },
    });
    const router = await mountedRouter(authz);
    for (const subject of [
      { type: 'department', id: 'sales' },
      { type: 'authenticated', id: '*' },
      { type: 'user', id: 'alice' },
    ]) {
      const response = await router.request(
        '/api/authorization/inspector/batchDecide',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            subject,
            checks: [
              {
                resource: { type: 'subject-check', id: 'test' },
                action: 'read',
              },
            ],
          }),
        },
      );
      expect(response.status).toBe(200);
    }
    expect(seen).toEqual([
      { principal: { type: 'department', id: 'sales' }, subjects: [] },
      { principal: { type: 'authenticated', id: '*' }, subjects: [] },
      {
        principal: { type: 'user', id: 'alice' },
        subjects: [{ type: 'authenticated', id: '*' }],
      },
    ]);
  });

  it('summarizes configured types including policy grants and enforces settings access', async () => {
    const send = (router: Hono) =>
      router.request(
        '/api/authorization/inspector/configuredAccess?subjectType=department&subjectId=sales',
      );
    expect(
      (
        await send(
          await mountedRouter(await authorization({ settings: false })),
        )
      ).status,
    ).toBe(403);
    const authz = await authorization({ settings: true });
    await authz.permissionSets.create({
      key: 'sales',
      grants: [
        {
          resource: { type: 'database.collection', id: '*' },
          actions: [{ action: 'read', policy: { type: 'database' } }],
        },
      ],
    });
    await authz.permissionSets.assign({
      permissionSet: 'sales',
      subject: { type: 'department', id: 'sales' },
    });
    const response = await send(await mountedRouter(authz));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        unrestricted: false,
        types: ['database.collection'],
        resources: [{ type: 'database.collection', id: '*' }],
        identity: { subjects: [] },
        sets: [
          {
            key: 'sales',
            sources: [{ type: 'department', id: 'sales' }],
          },
        ],
      },
    });
  });

  it('explains which inherited subject or direct assignment brings each set', async () => {
    const authz = await authorization({ settings: true });
    authz.subjects.add('department', {
      resolveFor: async (principal) =>
        principal.type === 'user' && principal.id === 'alice'
          ? ['east', 'sales']
          : [],
      filterActive: async (ids) => ids,
    });
    const grant = (id: string) => [
      {
        resource: { type: 'database.collection', id },
        actions: [{ action: 'read', policy: { type: 'database' } }],
      },
    ];
    await authz.permissionSets.create({
      key: 'sales',
      title: 'Sales',
      grants: grant('orders'),
    });
    await authz.permissionSets.create({ key: 'audit', grants: grant('logs') });
    await authz.permissionSets.create({ key: 'hr', grants: grant('people') });
    for (const [permissionSet, subject] of [
      ['sales', { type: 'department', id: 'sales' }],
      ['sales', { type: 'user', id: 'alice' }],
      ['audit', { type: 'department', id: 'east' }],
      ['hr', { type: 'department', id: 'people' }],
    ] as const)
      await authz.permissionSets.assign({ permissionSet, subject });
    const response = await (
      await mountedRouter(authz)
    ).request(
      '/api/authorization/inspector/configuredAccess?subjectType=user&subjectId=alice',
    );
    expect(response.status).toBe(200);
    const { data } = (await response.json()) as {
      data: {
        identity: unknown;
        sets: { key: string; title?: string; sources: unknown[] }[];
      };
    };
    expect(data.identity).toEqual({
      subjects: [
        { type: 'authenticated', id: '*' },
        { type: 'department', id: 'east' },
        { type: 'department', id: 'sales' },
      ],
    });
    expect(
      [...data.sets].sort((left, right) => left.key.localeCompare(right.key)),
    ).toEqual([
      { key: 'audit', sources: [{ type: 'department', id: 'east' }] },
      {
        key: 'sales',
        title: 'Sales',
        sources: expect.arrayContaining([
          { type: 'department', id: 'sales' },
          { type: 'user', id: 'alice' },
        ]) as unknown,
      },
    ]);
  });

  it('returns the effect, the reasons and their plugin, untouched, and requires the settings permission', async () => {
    const forbidden = await mountedRouter(
      await authorization({ settings: false }),
    );
    expect(
      (
        await forbidden.request(
          '/api/authorization/inspector/decide',
          inspect(),
        )
      ).status,
    ).toBe(403);
    const router = await mountedRouter(await authorization({ settings: true }));

    const [permitted, denied, conditional] = await Promise.all(
      ['permitted', 'denied', 'conditional'].map(async (id) => {
        const response = await router.request(
          '/api/authorization/inspector/decide',
          inspect(id),
        );
        expect(response.status).toBe(200);
        return ((await response.json()) as { data: AuthorizationDecision })
          .data;
      }),
    );

    expect(permitted).toEqual({
      effect: 'permit',
      reasons: [
        {
          code: 'GRANTED',
          message: 'A permission set grants it',
          plugin: 'test-decisions',
        },
      ],
    });
    expect(denied).toMatchObject({
      effect: 'deny',
      // A reason the core itself gave carries no plugin, and is passed on so.
      reasons: [{ code: 'NO_GRANT', message: 'Nothing grants it' }],
    });
    expect(denied.reasons[0]).not.toHaveProperty('plugin');
    expect(conditional).toMatchObject({
      effect: 'conditional',
      conditions: { type: 'filter', field: 'ownerId' },
    });
  });

  it('refuses a body that names no subject, resource or action', async () => {
    const router = await mountedRouter(await authorization({ settings: true }));

    const responses = await Promise.all(
      [
        {},
        { subject: { type: 'user', id: 'alice' }, action: 'read' },
        {
          subject: { type: 'user', id: 'alice' },
          resource: { type: 'test.resource', id: 'permitted' },
          action: '',
        },
      ].map((body) =>
        router.request('/api/authorization/inspector/decide', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
      ),
    );

    expect(responses.map(({ status }) => status)).toEqual([400, 400, 400]);
    for (const response of responses)
      await expect(response.json()).resolves.toMatchObject({
        error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
      });
  });
});

function inspect(id: string = 'permitted'): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      subject: { type: 'user', id: 'alice' },
      resource: { type: 'test.resource', id },
      action: 'read',
    }),
  };
}

/** The caller is 'admin', holding the settings grants or holding nothing. */
async function authorization({
  settings,
}: {
  settings: boolean;
}): Promise<Authorization> {
  const authz = createAuthorization({
    plugins: [
      testIdentity(),
      decisions,
      databasePlugin(),
      permissionSetsPlugin({ store: new MockPermissionSetStore() }),
    ],
  }) as unknown as Authorization;
  await authz.permissionSets.create({
    key: 'root',
    grants: settings
      ? [
          {
            resource: { type: 'settings', id: 'authorization.inspector' },
            actions: [{ action: 'inspect' }],
          },
        ]
      : [],
  });
  await authz.permissionSets.assign({
    permissionSet: 'root',
    subject: { type: 'user', id: 'admin' },
  });
  return authz;
}

it('allows inspector options without permission-set read access', async () => {
  const router = await mountedRouter(await authorization({ settings: true }));
  expect(
    (await router.request('/api/authorization/inspector/options')).status,
  ).toBe(200);
  expect(
    (await router.request('/api/authorization/permissionSets/options')).status,
  ).toBe(403);
});
