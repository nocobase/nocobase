import { afterEach, beforeEach, expect, it } from 'vitest';
import { PROJECTS } from '../../server/sales-authorization.js';
import { projectReference } from '../../server/sales-resources.js';
import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { SharingRulesAuthorizationApi } from '@nocobase/authorization/sharing-rules';
import type { RestrictionRulesAuthorizationApi } from '@nocobase/authorization/restriction-rules';
import {
  adminRequest,
  createFixture,
  listIds,
  type SalesFixture,
} from '../helpers.js';

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
  await fixture.database.disconnect();
});
const admin = (path: string, method?: string, body?: unknown) =>
  adminRequest(fixture, path, method, body);
const ids = (user: string, path?: string) => listIds(fixture, user, path);

it('grants page entry separately while data rules govern real endpoints, independently in both directions', async () => {
  expect(await ids('assistant')).toEqual([
    'project-1',
    'project-2',
    'project-3',
  ]);
  expect(await ids('assistant', 'quotes')).toEqual([
    'quote-1',
    'quote-history-1',
  ]);
  expect(await ids('engineer')).toEqual([
    'project-1',
    'project-2',
    'project-3',
  ]);
  expect(await ids('manager')).toEqual(['project-3']);
  expect(
    (
      await fixture.request('assistant', 'salesProjects/updateOne', {
        filter: { id: 'project-2' },
        values: {
          notes: 'Not allowed',
        },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await fixture.request('engineer', 'salesProjects/updateOne', {
        filter: { id: 'project-2' },
        values: {
          notes: 'Updated',
        },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await fixture.request('engineer', 'salesProjects/updateOne', {
        filter: { id: 'project-4' },
        values: {
          notes: 'Secret',
        },
      })
    ).status,
  ).toBe(404);
  expect(
    await authz
      .for({ principal: { type: 'user', id: fixture.users.assistant } })
      .can({
        resource: { type: 'page', id: 'example.sales.projects' },
        action: 'access',
      }),
  ).toBe(true);
  expect(
    (await fixture.router.request('/api/authorizationExample/sales/projects'))
      .status,
  ).toBe(401);
  const identity = { principal: { type: 'user', id: fixture.users.assistant } };
  const set = (await authz.permissionSets.get('example-sales-assistant'))!;
  const pageGrant = set.grants.find(
    (grant) =>
      grant.resource.type === 'page' &&
      grant.resource.id === 'example.sales.projects',
  )!;
  const dataGrant = set.grants.find(
    (grant) =>
      grant.resource.type === 'composite' &&
      grant.resource.id === 'example.sales.projects',
  )!;
  const pageRequest = {
    resource: { type: 'page', id: 'example.sales.projects' },
    action: 'access',
  };
  await authz.permissionSets.update(set.key, { ...set, grants: [pageGrant] });
  expect(await authz.for(identity).can(pageRequest)).toBe(true);
  expect((await fixture.request('assistant', 'sales/projects')).status).toBe(
    403,
  );
  await authz.permissionSets.update(set.key, { ...set, grants: [dataGrant] });
  expect(await authz.for(identity).can(pageRequest)).toBe(false);
  expect((await fixture.request('assistant', 'sales/projects')).status).toBe(
    200,
  );
  const decision = await authz.for(identity).authorize({
    resource: { type: 'composite', id: 'example.sales.projects' },
    action: 'view',
  });
  expect(
    decision.conditions?.checks.every(
      (check) => check.resource.type === 'database.collection',
    ),
  ).toBe(true);
});

it('keeps all-region read separate from engineer edit, including direct repository policies', async () => {
  await authz.permissionSets.create({
    key: 'extra-read',
    grants: [projectReference.grant({ view: { projects: 'allRecords' } })],
  });
  await authz.permissionSets.assign({
    subject: { type: 'user', id: fixture.users.engineer },
    permissionSet: 'extra-read',
  });
  expect(await ids('engineer')).toEqual([
    'project-1',
    'project-2',
    'project-3',
    'project-8',
  ]);
  expect(
    (
      await fixture.request('engineer', 'salesProjects/updateOne', {
        filter: { id: 'project-3' },
        values: {
          notes: 'Cross-region',
        },
      })
    ).status,
  ).toBe(404);
  const scope = authz.for({
    principal: { type: 'user', id: fixture.users.engineer },
  });
  const policy = await authz.database.policyFor(PROJECTS, scope);
  await expect(
    fixture.database
      .repository(PROJECTS)
      .withPolicy(policy)
      .updateOne({
        filter: { id: 'project-3' },
        values: { notes: 'Bypass attempt' },
      }),
  ).rejects.toThrow();
});

it('separates project editing, quote submission and delivery with server-side state transitions', async () => {
  expect(
    (
      await fixture.request('engineer', 'salesProjects/updateOne', {
        filter: { id: 'project-2' },
        values: {
          title: 'Revised project',
          notes: 'Qualified',
        },
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await fixture.request('engineer', 'salesProjects/updateOne', {
        filter: { id: 'project-2' },
        values: {
          ownerId: fixture.users.assistant,
        },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-2',
        {
          amount: 15000,
          notes: 'Final price',
        },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  expect(
    (await fixture.request('assistant', 'sales/quotes/quote-1/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(200);
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-2',
        { amount: 1 },
        'PATCH',
      )
    ).status,
  ).toBe(400);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(400);
  expect(await ids('delivery', 'orders')).toEqual(['order-1', 'order-2']);
  expect((await fixture.request('delivery', 'sales/projects')).status).toBe(
    403,
  );
  for (const deliveryReference of [null, '', '   ']) {
    expect(
      (
        await fixture.request('delivery', 'sales/orders/order-2/deliver', {
          deliveryReference,
        })
      ).status,
    ).toBe(400);
  }
  expect(
    (
      await fixture.request('delivery', 'sales/orders/order-2/deliver', {
        deliveryReference: 'SHIP-200',
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await fixture.request('delivery', 'sales/orders/order-2/deliver', {
        deliveryReference: 'SHIP-201',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await fixture.request('delivery', 'sales/orders/order-3/deliver', {
        deliveryReference: 'SHIP-300',
      })
    ).status,
  ).toBe(403);
  // Each failure names its reason in the standard error body.
  const blank = await fixture.request(
    'delivery',
    'sales/orders/order-1/deliver',
    { deliveryReference: '   ' },
  );
  expect((await blank.json()).error).toMatchObject({
    status: 'INVALID_ARGUMENT',
    reason: 'DELIVERY_REFERENCE_REQUIRED',
    domain: 'authorizationExample',
    fieldViolations: [expect.objectContaining({ field: 'deliveryReference' })],
  });
  const delivered = await fixture.request(
    'delivery',
    'sales/orders/order-2/deliver',
    { deliveryReference: 'SHIP-202' },
  );
  expect(delivered.status).toBe(400);
  expect((await delivered.json()).error).toMatchObject({
    status: 'FAILED_PRECONDITION',
    reason: 'STATE_CONFLICT',
    domain: 'authorizationExample',
  });
  const hidden = await fixture.request(
    'delivery',
    'sales/orders/order-3/deliver',
    { deliveryReference: 'SHIP-301' },
  );
  expect((await hidden.json()).error).toMatchObject({
    status: 'PERMISSION_DENIED',
    reason: 'FORBIDDEN',
    domain: 'authorizationExample',
  });
  const missing = await fixture.request(
    'delivery',
    'sales/orders/no-such-order/deliver',
    { deliveryReference: 'SHIP-404' },
  );
  expect(missing.status).toBe(403);
  const extra = await fixture.request(
    'delivery',
    'sales/orders/order-1/deliver',
    { deliveryReference: 'SHIP-1', status: 'delivered' },
  );
  expect(extra.status).toBe(400);
  expect((await extra.json()).error.reason).toBe('INVALID_INPUT');
});

it('reports per-record edit eligibility and input errors without mislabeling permission denial', async () => {
  const data = (
    await (await fixture.request('engineer', 'sales/projects')).json()
  ).data;
  expect(
    data.find((row: { id: string }) => row.id === 'project-3').operations.edit,
  ).toBe('outsideScope');
  expect(
    data.find((row: { id: string }) => row.id === 'project-2').operations.edit,
  ).toBe('allowed');
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-2',
        { amount: 0 },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  const quotes = (
    await (await fixture.request('engineer', 'sales/quotes')).json()
  ).data;
  expect(
    quotes.find((row: { id: string }) => row.id === 'quote-2').operations
      .submit,
  ).toBe('invalidAmount');
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(400);
});

it('lets engineers prepare their own quotes and requires an explicit handover to edit a colleague quote', async () => {
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-5',
        {
          amount: 16000,
        },
        'PATCH',
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-6',
        {
          amount: 19000,
        },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-6/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (
      await fixture.request(
        'proposal',
        'sales/quotes/quote-7',
        {
          amount: 22000,
        },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  const rule = (await authz.sharingRules.get('example-proposal-handover'))!;
  expect(
    (
      await admin('sharingRules/example-proposal-handover', 'PATCH', {
        ...rule,
        subjects: [],
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await fixture.request(
        'proposal',
        'sales/quotes/quote-7',
        {
          amount: 23000,
        },
        'PATCH',
      )
    ).status,
  ).toBe(403);
  expect(
    (await fixture.request('proposal', 'sales/quotes/quote-7/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-2',
        {
          amount: 13000,
        },
        'PATCH',
      )
    ).status,
  ).toBe(200);
});

it('separates project-region and quote-preparer scopes through the real submit endpoint', async () => {
  const response = await fixture.request('engineer', 'sales/quotes');
  const body = (await response.json()).data;
  expect(body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'quote-2',
        projectId: 'project-2',
        preparedByName: 'Morgan Lee',
        operations: expect.objectContaining({ submit: 'allowed' }),
      }),
      expect.objectContaining({
        id: 'quote-5',
        projectId: 'project-2',
        preparedByName: 'Alex Chen',
        operations: expect.objectContaining({ submit: 'quoteScope' }),
      }),
      expect.objectContaining({
        id: 'quote-6',
        projectId: 'project-3',
        preparedByName: 'Morgan Lee',
        operations: expect.objectContaining({ submit: 'projectScope' }),
      }),
    ]),
  );
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-2/submit', {}))
      .status,
  ).toBe(200);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-5/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-6/submit', {}))
      .status,
  ).toBe(403);
  expect(
    (await fixture.request('engineer', 'sales/quotes/quote-4/submit', {}))
      .status,
  ).toBe(403);
});

it('grants independent page entries and keeps delivery-only accounts out of sales menus and APIs', async () => {
  const scope = authz.for({
    principal: { type: 'user', id: fixture.users.delivery },
  });
  expect(
    await scope.can({
      resource: { type: 'page', id: 'example.sales.orders' },
      action: 'access',
    }),
  ).toBe(true);
  for (const name of ['projects', 'quotes']) {
    expect(
      await scope.can({
        resource: { type: 'page', id: `example.sales.${name}` },
        action: 'access',
      }),
    ).toBe(false);
    expect((await fixture.request('delivery', `sales/${name}`)).status).toBe(
      403,
    );
  }
  const { data, meta } = await (
    await fixture.request('delivery', 'sales/orders')
  ).json();
  expect(
    data.every((row: { project?: unknown }) => row.project === undefined),
  ).toBe(true);
  expect(meta.navigation).toEqual({
    projects: false,
    quotes: false,
    orders: true,
  });
  expect(data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'order-2',
        projectId: 'project-2',
        quoteId: 'quote-history-2',
      }),
    ]),
  );
});

it('pages the sales lists and carries navigation in meta', async () => {
  const response = await fixture.request(
    'assistant',
    'sales/projects?page=2&pageSize=2',
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.data.map((row: { id: string }) => row.id)).toEqual(['project-3']);
  expect(body.meta).toMatchObject({
    page: 2,
    pageSize: 2,
    total: 3,
    navigation: { projects: true },
  });
  const tooLarge = await fixture.request(
    'assistant',
    'sales/projects?pageSize=101',
  );
  expect(tooLarge.status).toBe(400);
  expect((await tooLarge.json()).error).toMatchObject({
    reason: 'INVALID_INPUT',
    fieldViolations: [expect.objectContaining({ field: 'pageSize' })],
  });
});

it('decides permission before validating input or looking up the record', async () => {
  // `delivery` holds no quote action at all, so malformed input and a missing quote both answer 403, not 400 or 404.
  for (const [path, body, method] of [
    ['sales/quotes/quote-1', { bogus: true }, 'PATCH'],
    ['sales/quotes/no-such-quote', { amount: -1 }, 'PATCH'],
    ['sales/quotes/quote-1/submit', { unexpected: 1 }, 'POST'],
    ['sales/quotes?pageSize=not-a-number', undefined, 'GET'],
  ] as const) {
    const response = await fixture.request('delivery', path, body, method);
    expect(response.status).toBe(403);
    expect((await response.json()).error.status).toBe('PERMISSION_DENIED');
  }
  // `engineer` may not deliver, so a blank reference is refused as 403 before the blank-reference check.
  const deliver = await fixture.request(
    'engineer',
    'sales/orders/order-1/deliver',
    { deliveryReference: ' ' },
  );
  expect(deliver.status).toBe(403);
  // Nor manage relations: an unknown relation name is still 403.
  const relations = await fixture.request(
    'engineer',
    'sales/orders/order-1/relations',
    { notARelation: {} },
    'PATCH',
  );
  expect(relations.status).toBe(403);
});

it('answers a submit of a quote without an amount as a failed precondition naming no request field', async () => {
  expect(
    (
      await fixture.request(
        'engineer',
        'sales/quotes/quote-2',
        { amount: 0 },
        'PATCH',
      )
    ).status,
  ).toBe(200);
  const response = await fixture.request(
    'engineer',
    'sales/quotes/quote-2/submit',
    {},
  );
  expect(response.status).toBe(400);
  const { error } = await response.json();
  expect(error).toMatchObject({
    status: 'FAILED_PRECONDITION',
    reason: 'QUOTE_AMOUNT_REQUIRED',
    domain: 'authorizationExample',
  });
  expect(error.fieldViolations).toBeUndefined();
});
