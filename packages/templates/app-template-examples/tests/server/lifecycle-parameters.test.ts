import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { describe, expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
  },
});

describe('lifecycle parameter configuration through the application API', () => {
  test('advertises creation idempotency only where the service implements it', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const response = await session.fetch('/swagger');
    expect(response.status).toBe(200);
    const document = (await response.json()) as {
      paths: Record<
        string,
        { post?: { parameters?: { in: string; name: string }[] } }
      >;
    };
    for (const flow of [
      'subscriptions',
      'orders',
      'exports',
      'purchases',
      'fulfilments',
      'invoices',
    ]) {
      const operation = document.paths['/api/lifecycleExample/' + flow]?.post;
      expect(operation).toBeDefined();
      const headers =
        operation!.parameters
          ?.filter((parameter) => parameter.in === 'header')
          .map((parameter) => parameter.name.toLowerCase()) ?? [];
      expect(headers.includes('idempotency-key')).toBe(
        flow === 'subscriptions',
      );
    }
  });

  test('keeps a draft and its instance diagram on creation revision A after configuration changes to B', async ({
    testApp,
  }) => {
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const root = '/lifecycleExample';
    const headers = {
      'content-type': 'application/json',
      origin: 'http://localhost',
    };
    const write = (
      values: object,
      expectedRevision: number,
      requestId: string,
    ) =>
      session.fetch(
        root +
          '/parameterGroups/expenseThresholds?workflow=expenses-v2&actAs=zhao',
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ values, expectedRevision, requestId }),
        },
      );
    expect(
      (
        await write(
          { autoApproveLimit: 100, financeLimit: 3000 },
          0,
          'creation-a',
        )
      ).status,
    ).toBe(200);
    const create = () =>
      session.fetch(root + '/expenses?actAs=lin', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Creation policy',
          purpose: 'Travel',
          items: [
            {
              date: '2026-11-14',
              category: 'transport',
              description: 'Taxi',
              amountCents: 200000,
            },
          ],
          failPayments: 0,
        }),
      });
    const created = await create();
    expect(created.status).toBe(201);
    const { data: record } = (await created.json()) as { data: { id: string } };
    const history = async () => {
      const response = await session.fetch(
        root + '/parameterHistory/expenses/' + record.id + '?actAs=lin',
      );
      expect(response.status).toBe(200);
      return (await response.json()) as {
        data: {
          snapshot: {
            revision: number;
            at: string;
            values: Record<string, number>;
          };
          current?: unknown;
        };
      };
    };
    const original = await history();
    expect(original.data.snapshot).toMatchObject({
      revision: 1,
      values: { autoApproveLimit: 100, financeLimit: 3000 },
    });
    expect(original.data.current).toBeUndefined();
    expect(
      (
        await write(
          { autoApproveLimit: 200, financeLimit: 2000 },
          1,
          'creation-b',
        )
      ).status,
    ).toBe(200);
    expect((await history()).data.snapshot).toEqual(original.data.snapshot);
    const diagram = await session.fetch(
      root + '/expenses/lifecycle?recordId=' + record.id + '&actAs=lin',
    );
    expect(diagram.status).toBe(200);
    expect(await diagram.json()).toMatchObject({
      data: { parameters: { financeLimit: 3000 } },
    });
    const fresh = await create();
    expect(fresh.status).toBe(201);
    const { data: newer } = (await fresh.json()) as { data: { id: string } };
    const view = await session.fetch(
      root + '/expenses/' + newer.id + '?actAs=lin',
    );
    expect(view.status).toBe(200);
    expect(await view.json()).toMatchObject({
      data: {
        parameterValues: { financeLimit: 2000 },
        parameterSnapshot: { revision: 2 },
      },
    });
    const fired = await session.fetch(
      root + '/expenses/' + record.id + '/fire?actAs=lin',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transition: 'submit',
          requestId: 'creation-submit',
        }),
      },
    );
    expect(fired.status).toBe(200);
    expect((await history()).data.snapshot).toEqual(original.data.snapshot);
  });

  test('authenticates before validation and checks read/write permissions on all entry points', async ({
    testApp,
    request,
  }) => {
    const root = '/lifecycleExample';
    expect((await request(root + '/parameterGroups')).status).toBe(401);
    expect(
      (
        await request(root + '/parameterGroups/expenseThresholds', {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: '{',
        })
      ).status,
    ).toBe(401);
    const session = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
    const write = (
      actor: string,
      values: unknown,
      expectedRevision: number,
      requestId: string,
    ) =>
      session.fetch(
        root +
          '/parameterGroups/expenseThresholds?workflow=expenses&actAs=' +
          actor,
        {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({ values, expectedRevision, requestId }),
        },
      );
    expect(
      (
        await session.fetch(
          root +
            '/parameterGroups/expenseThresholds?workflow=expenses&actAs=lin',
        )
      ).status,
    ).toBe(200);
    const malformed = await session.fetch(
      root + '/parameterGroups/expenseThresholds?workflow=expenses&actAs=lin',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: '{',
      },
    );
    expect(malformed.status).toBe(403);
    expect(
      (await session.fetch(root + '/tickets/lifecycle?actAs=customer-li'))
        .status,
    ).toBe(200);
    expect(
      (await session.fetch(root + '/expenses/lifecycle?actAs=customer-li'))
        .status,
    ).toBe(403);
    expect(
      (
        await session.fetch(
          root +
            '/parameterGroups/financeReviewers/references?actAs=lin&type=user&q=Chen',
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await session.fetch(
          root + '/parameterHistory/expenses/999999?actAs=customer-li',
        )
      ).status,
    ).toBe(403);
    const lookup = root + '/parameterGroups/financeReviewers/references';
    expect((await request(lookup + '?type=user&q=Chen')).status).toBe(401);
    expect((await session.fetch(lookup + '/user/chen?actAs=lin')).status).toBe(
      403,
    );
    const matched = await session.fetch(
      lookup + '?actAs=zhao&type=user&q=Chen&pageSize=10',
    );
    expect(matched.status).toBe(200);
    expect(await matched.json()).toMatchObject({
      data: [{ id: 'chen', name: 'Chen' }],
      meta: { page: 1, pageSize: 10, total: 1 },
    });
    expect(
      (await session.fetch(lookup + '?actAs=zhao&type=user&q=&pageSize=10'))
        .status,
    ).toBe(200);
    expect(
      (await session.fetch(lookup + '?actAs=zhao&type=user&q=Chen&pageSize=11'))
        .status,
    ).toBe(400);
    expect(
      (await session.fetch(lookup + '?actAs=zhao&type=invalid&q=Chen')).status,
    ).toBe(400);
    const values = { autoApproveLimit: 100, financeLimit: 1000 };
    const first = await write('zhao', values, 0, 'save-1');
    expect({ status: first.status, body: await first.json() }).toMatchObject({
      status: 200,
    });
    expect((await write('zhao', values, 0, 'save-1')).status).toBe(200);
    const conflict = await write('zhao', values, 0, 'save-2');
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: { reason: 'CONFIGURATION_CONFLICT' },
    });
    expect(
      (await write('zhao', { ...values, waitMinutes: 2 }, 1, 'unknown')).status,
    ).toBe(400);
  });
});
