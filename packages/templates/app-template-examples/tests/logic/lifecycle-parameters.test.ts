// @vitest-environment node
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
