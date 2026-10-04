// @vitest-environment jsdom
import type { PropsWithChildren } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { selection } from '@nocobase/authorization/core';
import {
  ClientApplicationContext,
  createApiClient,
  type ClientApplication,
} from '@nocobase/app-client';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  AuthorizationClient,
  authorizationClientToken,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { QUOTES } from '../../server/sales-authorization.js';
import { quoteResource } from '../../server/sales-resources.js';
import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { SharingRulesAuthorizationApi } from '@nocobase/authorization/sharing-rules';
import type { RestrictionRulesAuthorizationApi } from '@nocobase/authorization/restriction-rules';
import { createFixture, listIds, type SalesFixture } from '../helpers.js';

type SalesAuthorization = SalesFixture['authorization'] &
  DefaultAccessAuthorizationApi &
  SharingRulesAuthorizationApi &
  RestrictionRulesAuthorizationApi;

let fixture: SalesFixture;
let authz: SalesAuthorization;
beforeEach(async () => {
  fixture = await createFixture();
  authz = fixture.authorization as SalesAuthorization;
  await authz.permissionSets.create({ key: 'root', grants: [] });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: fixture.users.admin },
    permissionSet: 'root',
  });
});
afterEach(async () => {
  cleanup();
  await fixture.database.disconnect();
});
const ids = (user: string, path?: string) => listIds(fixture, user, path);

it('only lets administrators restore practice records, resetting only practice orders and preserving authorization edits and additional orders', async () => {
  expect(
    (
      await fixture.router.request('/api/authorizationExample/reset', {
        method: 'POST',
      })
    ).status,
  ).toBe(401);
  expect(
    (await (await fixture.request('engineer', 'context')).json()).data.canReset,
  ).toBe(false);
  expect(
    (await (await fixture.request('admin', 'context')).json()).data.canReset,
  ).toBe(true);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(200);
  expect(
    (
      await fixture.request('delivery', 'sales/orders/order-2/deliver', {
        deliveryReference: 'DONE',
      })
    ).status,
  ).toBe(200);
  expect((await fixture.request('engineer', 'reset', {})).status).toBe(403);
  const query = fixture.database.connection().query;
  await query
    .deleteFrom('authorizationPermissionSetAssignments')
    .where('subjectId', '=', fixture.users.proposal)
    .execute();
  for (let attempt = 0; attempt < 2; attempt++) {
    expect((await fixture.request('admin', 'reset', {})).status).toBe(200);
    expect(
      await query
        .selectFrom(QUOTES)
        .selectAll()
        .where('id', '=', 'quote-2')
        .executeTakeFirst(),
    ).toMatchObject({ status: 'draft', amount: 12000 });
    expect(
      await query
        .selectFrom('authorizationExampleOrders')
        .selectAll()
        .where('id', '=', 'order-2')
        .executeTakeFirst(),
    ).toMatchObject({
      status: 'ready',
      deliveryReference: null,
      quoteId: 'quote-history-2',
    });
    expect(
      await query
        .selectFrom(QUOTES)
        .selectAll()
        .where('id', '=', 'quote-history-2')
        .executeTakeFirst(),
    ).toMatchObject({ status: 'accepted' });
    expect((await fixture.request('proposal', 'sales/quotes')).status).toBe(
      403,
    );
  }
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(200);
  const orders = 'authorizationExampleOrders';
  const original = (await query
    .selectFrom(orders)
    .selectAll()
    .where('id', '=', 'order-2')
    .executeTakeFirst())!;
  await query
    .insertInto(orders)
    .values({ ...original, id: 'custom-order', carrierId: 'express' })
    .execute();
  await query
    .insertInto('authorizationExampleOrderChecks')
    .values([
      {
        id: 'custom-check',
        orderId: 'custom-order',
        title: 'Keep',
        done: true,
      },
      { id: 'practice-check', orderId: 'order-2', title: 'Reset', done: false },
    ])
    .execute();
  await query
    .insertInto('authorizationExampleOrderCarriers')
    .values([
      { orderId: 'custom-order', carrierId: 'freight', note: 'Keep' },
      { orderId: 'order-2', carrierId: 'freight', note: 'Reset' },
    ])
    .execute();
  expect((await fixture.request('admin', 'reset', {})).status).toBe(200);
  expect(
    await query
      .selectFrom(orders)
      .selectAll()
      .where('id', '=', 'custom-order')
      .executeTakeFirst(),
  ).toMatchObject({ carrierId: 'express' });
  expect(
    await query
      .selectFrom('authorizationExampleOrderChecks')
      .selectAll()
      .execute(),
  ).toMatchObject([{ id: 'custom-check', done: true }]);
  expect(
    await query
      .selectFrom('authorizationExampleOrderCarriers')
      .selectAll()
      .execute(),
  ).toMatchObject([{ orderId: 'custom-order', note: 'Keep' }]);
  expect(await ids('coordinator')).toContain('project-8');
});

it('answers useCan for a scoped business grant through the real client and snapshot route', async () => {
  const user = 'scoped-submitter';
  await authz.permissionSets.create({
    key: 'scoped-submit',
    grants: [
      quoteResource.reference().grant({
        submit: { quotes: selection.recordAccess('example.sales.prepared') },
      }),
    ],
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: user },
    permissionSet: 'scoped-submit',
  });
  const fetch = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
      fixture.router.request(
        input instanceof Request ? input : String(input),
        init,
      ),
  );
  const client = new AuthorizationClient(
    createApiClient({
      baseURL: 'http://example.test/api',
      fetch,
      headers: { 'x-test-user': user },
    }),
  );
  const services = new ServiceContainer();
  services.instance(authorizationClientToken, client);
  const app = { services } as unknown as ClientApplication;
  const wrapper = ({ children }: PropsWithChildren) => (
    <ClientApplicationContext.Provider value={app}>
      {children}
    </ClientApplicationContext.Provider>
  );
  const quotes = { type: 'composite', id: 'example.sales.quotes' };
  const { result } = renderHook(
    () => ({
      submit: useCan({ resource: quotes, action: 'submit' }),
      edit: useCan({ resource: quotes, action: 'edit' }),
    }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.submit.can).toBe(true));
  await waitFor(() => expect(result.current.edit.isPending).toBe(false));
  expect(result.current.edit.can).toBe(false);
  expect(result.current.submit.error).toBeUndefined();
  expect(result.current.edit.error).toBeUndefined();
  // Both hooks share one snapshot from the real route.
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(String(fetch.mock.calls[0]![0])).toBe(
    'http://example.test/api/authorization/permissions',
  );
  const snapshot = await client.snapshot();
  expect(snapshot.unrestricted).toBe(false);
  expect(snapshot.permissions).toContainEqual({
    resource: quotes,
    actions: ['submit'],
  });
});

it('answers a reset without the seeded example accounts as a failed precondition', async () => {
  await fixture.database
    .connection()
    .query.updateTable('user')
    .set({ username: 'renamed_assistant' })
    .where('username', '=', 'sales_assistant')
    .execute();
  const response = await fixture.request('admin', 'reset', {});
  expect(response.status).toBe(400);
  expect((await response.json()).error).toMatchObject({
    status: 'FAILED_PRECONDITION',
    reason: 'EXAMPLE_ACCOUNTS_MISSING',
    domain: 'authorizationExample',
  });
});
