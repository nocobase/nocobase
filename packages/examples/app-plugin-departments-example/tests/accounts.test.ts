// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEMO_PASSWORD } from '../database/seed-data/organization.js';
import {
  createTestApp,
  readSales,
  SALES_SETS,
  type TestApp,
} from './helpers.js';

const email = (name: string): string => `${name}@departments.example`;
/** Every public quote of the authorization example: the engineer set reads all records, less the confidential. */
const PUBLIC_QUOTES = [
  'quote-1',
  'quote-2',
  'quote-3',
  'quote-5',
  'quote-6',
  'quote-7',
  'quote-8',
  'quote-history-1',
  'quote-history-2',
  'quote-history-3',
  'quote-history-8',
];
const ACCOUNTS = [
  'grace',
  'leo',
  'nina',
  'chen',
  'eric',
  'mia',
  'sophia',
  'owen',
] as const;

const NORTH_PROJECTS = ['dept-project-northgate', 'dept-project-riverside'];
const SHARED_PROJECTS = ['dept-project-bayview', 'dept-project-riverside'];

/**
 * The seeded accounts against the authorization example's own sales and delivery lists. The department scopes
 * select the `dept-` projects, quotes and order this example seeds for its own staff; the authorization example's
 * rows reach them only through the region and all-records scopes its sets carry. The company-wide confidentiality
 * restriction on the root department hides confidential project-4 and its quotes and orders.
 */
describe('the seeded demo accounts', () => {
  let test: TestApp;
  const cookies: Record<string, string> = {};

  beforeAll(async () => {
    test = await createTestApp();
    for (const name of ACCOUNTS)
      cookies[name] = await test.signIn(email(name), DEMO_PASSWORD);
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  const read = (name: string, list?: 'projects' | 'quotes' | 'orders') =>
    readSales(test, cookies[name] ?? '', list);

  it('a North engineer sees North projects and orders, and none of the South ones', async () => {
    expect(await read('leo')).toEqual({
      status: 200,
      ids: [...NORTH_PROJECTS, 'project-1', 'project-2'],
    });
    expect(await read('leo', 'orders')).toEqual({
      status: 200,
      ids: ['order-1', 'order-2'],
    });
    // The engineer set reads every quote; the restriction still hides the confidential project's.
    const quotes = await read('leo', 'quotes');
    expect(quotes.ids).toEqual(
      expect.arrayContaining(['dept-quote-bayview', 'quote-3']),
    );
    expect(quotes.ids).not.toContain('quote-4');
  });

  it('a South engineer sees the South projects and orders only', async () => {
    expect(await read('eric')).toEqual({
      status: 200,
      ids: ['dept-project-bayview', 'dept-project-southport', 'project-3'],
    });
    expect(await read('eric', 'orders')).toEqual({
      status: 200,
      ids: ['dept-order-bayview', 'order-3'],
    });
  });

  it('a sales assistant opens the pages through Sales Center, reads her North colleagues’ projects and her region’s orders', async () => {
    // North Sales' project viewer set: projects owned by North Sales members, and no South one.
    expect(await read('nina')).toEqual({ status: 200, ids: NORTH_PROJECTS });
    expect(await read('nina', 'quotes')).toEqual({ status: 200, ids: [] });
    expect(await read('nina', 'orders')).toEqual({
      status: 200,
      ids: ['order-1', 'order-2'],
    });
  });

  it('Chen holds South sales access and delivery access at once', async () => {
    // Only the projects shared with Delivery: his own-projects set reaches none, and nothing viewer-relative shows
    // him his South colleague's unshared Southport project.
    expect(await read('chen')).toEqual({ status: 200, ids: SHARED_PROJECTS });
    // Delivery's set, scoped to his South region by the sharing rule: he may deliver the South orders.
    const response = await test.request(
      'GET',
      '/api/authorizationExample/sales/orders',
      { cookie: cookies.chen ?? '' },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { id: string; operations: { deliver: string } }[];
    };
    expect(
      body.data
        .map((item) => [item.id, item.operations.deliver])
        .sort((left, right) => String(left[0]).localeCompare(String(right[0]))),
    ).toEqual([
      ['dept-order-bayview', 'allowed'],
      ['order-3', 'allowed'],
    ]);
    // Nina reads the same kind of list without the delivery set.
    const nina = await test.request(
      'GET',
      '/api/authorizationExample/sales/orders',
      { cookie: cookies.nina ?? '' },
    );
    const ninaBody = (await nina.json()) as {
      data: { operations: { deliver: string } }[];
    };
    expect(
      ninaBody.data.every((item) => item.operations.deliver !== 'allowed'),
    ).toBe(true);
  });

  it('a delivery specialist without a region reads the shared projects and no orders yet', async () => {
    expect(await read('mia')).toEqual({ status: 200, ids: SHARED_PROJECTS });
    expect((await read('mia', 'quotes')).status).toBe(403);
    expect(await read('mia', 'orders')).toEqual({ status: 200, ids: [] });

    // Giving Delivery a region is an organisation change the sync carries into the sales data scope.
    await test.organization.updateDepartment('delivery', { region: 'North' });
    try {
      expect(await read('mia', 'orders')).toEqual({
        status: 200,
        ids: ['order-1', 'order-2'],
      });
      // Chen's primary department still decides his region.
      expect(await read('chen', 'orders')).toEqual({
        status: 200,
        ids: ['dept-order-bayview', 'order-3'],
      });
    } finally {
      await test.organization.updateDepartment('delivery', { region: null });
    }
  });

  it('the executive holds the manager role directly and reviews the projects shared with her office', async () => {
    expect(await read('grace')).toEqual({
      status: 200,
      ids: ['project-2', 'project-3'],
    });
    expect(await read('grace', 'orders')).toEqual({ status: 200, ids: [] });
  });

  it('keep a direct job role when the department grant is revoked', async () => {
    const assistant = await test.database
      .connection()
      .query.selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('permissionSetKey', '=', SALES_SETS.assistant)
      .where('subjectType', '=', 'org.department')
      .where('subjectId', '=', 'sales-center')
      .executeTakeFirstOrThrow();
    await test.authz.permissionSets.revoke(String(assistant.id));

    expect((await read('nina', 'quotes')).status).toBe(403);
    expect((await read('chen', 'quotes')).status).toBe(403);
    // North Sales' own project viewer set keeps Nina's projects page.
    expect((await read('nina')).status).toBe(200);
    // Chen keeps his delivery access and the shared projects, which come from another department.
    expect((await read('chen', 'orders')).ids).toEqual([
      'dept-order-bayview',
      'order-3',
    ]);
    expect((await read('chen')).ids).toEqual(SHARED_PROJECTS);
    // The engineers hold their role directly.
    expect(await read('leo')).toEqual({
      status: 200,
      ids: [...NORTH_PROJECTS, 'project-1', 'project-2'],
    });
  });

  it('the Sales Center head sees every North and South project, quote and order of its staff', async () => {
    expect(await read('sophia')).toEqual({
      status: 200,
      ids: [
        'dept-project-bayview',
        'dept-project-northgate',
        'dept-project-riverside',
        'dept-project-southport',
      ],
    });
    expect(await read('sophia', 'quotes')).toEqual({
      status: 200,
      ids: ['dept-quote-bayview', 'dept-quote-riverside'],
    });
    expect(await read('sophia', 'orders')).toEqual({
      status: 200,
      ids: ['dept-order-bayview'],
    });
  });

  it('the North Sales head sees what North Sales people own and prepared', async () => {
    expect(await read('owen')).toEqual({ status: 200, ids: NORTH_PROJECTS });
    expect(await read('owen', 'quotes')).toEqual({
      status: 200,
      ids: ['dept-quote-riverside'],
    });
    // No North order is owned in the department; North orders 1–2 reach him as a salesperson, through Sales
    // Center's regional delivery-orders sharing.
    expect(await read('owen', 'orders')).toEqual({
      status: 200,
      ids: ['order-1', 'order-2'],
    });
  });

  it('a transfer moves the owner’s records to the new department’s head', async () => {
    const leo = await test.database
      .connection()
      .query.selectFrom('user')
      .select('id')
      .where('email', '=', email('leo'))
      .executeTakeFirstOrThrow();
    const id = String(leo.id);
    await test.organization.addMember({
      departmentId: 'south-sales',
      userId: id,
      primary: true,
    });
    await test.organization.removeMember('north-sales', id);
    try {
      // Leo's projects follow him out of North Sales; the Sales Center head still sees them below her.
      expect((await read('owen')).ids).toEqual([]);
      expect((await read('nina')).ids).toEqual([]);
      expect((await read('sophia')).ids).toEqual(
        expect.arrayContaining(NORTH_PROJECTS),
      );
    } finally {
      await test.organization.addMember({
        departmentId: 'north-sales',
        userId: id,
        primary: true,
      });
      await test.organization.removeMember('south-sales', id);
    }
    expect((await read('owen')).ids).toEqual(NORTH_PROJECTS);
  });

  it('the Delivery sharing rule is what shows Mia the sales projects', async () => {
    const assignment = await test.database
      .connection()
      .query.selectFrom('authorizationSharingRuleAssignments')
      .selectAll()
      .where('sharingRuleId', '=', 'departments-example-sales-projects')
      .where('subjectId', '=', 'delivery')
      .executeTakeFirstOrThrow();
    await test.database
      .connection()
      .query.deleteFrom('authorizationSharingRuleAssignments')
      .where('id', '=', String(assignment.id))
      .execute();
    try {
      // The action stays; only the widened records go.
      expect(await read('mia')).toEqual({ status: 200, ids: [] });
    } finally {
      await test.database
        .connection()
        .query.insertInto('authorizationSharingRuleAssignments')
        .values(assignment)
        .execute();
    }
    expect((await read('mia')).ids).toEqual(SHARED_PROJECTS);
  });
});

/**
 * The authorization example's own accounts stay outside the organisation and keep what that example gives them.
 * The only difference is this example's demo data reaching the engineer set's scopes: its North projects through
 * "own region", and every public quote through "all records".
 */
describe('the authorization example’s accounts', () => {
  let test: TestApp;

  beforeAll(async () => {
    test = await createTestApp();
  }, 60_000);

  afterAll(async () => {
    await test.close();
  });

  const EXPECTED: Record<
    string,
    Record<'projects' | 'quotes' | 'orders', number | string[]>
  > = {
    assistant: {
      projects: ['project-1', 'project-2', 'project-3'],
      quotes: ['quote-1', 'quote-history-1'],
      orders: ['order-1'],
    },
    engineer: {
      projects: [...NORTH_PROJECTS, 'project-1', 'project-2', 'project-3'],
      quotes: ['dept-quote-bayview', 'dept-quote-riverside', ...PUBLIC_QUOTES],
      orders: ['order-2'],
    },
    manager: {
      projects: ['project-3'],
      quotes: ['quote-3', 'quote-6', 'quote-7', 'quote-history-3'],
      orders: ['order-3'],
    },
    delivery: { projects: 403, quotes: 403, orders: ['order-1', 'order-2'] },
    proposal: {
      projects: [...NORTH_PROJECTS, 'project-1', 'project-2'],
      quotes: ['dept-quote-bayview', 'dept-quote-riverside', ...PUBLIC_QUOTES],
      orders: [],
    },
    coordinator: {
      projects: ['project-8'],
      quotes: ['quote-8', 'quote-history-8'],
      orders: ['order-8'],
    },
  };

  it('are not placed in any department', async () => {
    const members = await test.database
      .connection()
      .query.selectFrom('departmentMembers')
      .innerJoin('user', 'user.id', 'departmentMembers.userId')
      .select('email')
      .where('email', 'like', 'sales_%@example.test')
      .execute();
    expect(members).toEqual([]);
  });

  it('see what the authorization example gives them', async () => {
    for (const [key, lists] of Object.entries(EXPECTED)) {
      const cookie = await test.signIn(
        `sales_${key}@example.test`,
        'AuthzExample123!',
      );
      for (const [list, expected] of Object.entries(lists) as [
        'projects' | 'quotes' | 'orders',
        number | string[],
      ][]) {
        const result = await readSales(test, cookie, list);
        expect({ key, list, result }).toEqual({
          key,
          list,
          result:
            typeof expected === 'number'
              ? { status: expected, ids: [] }
              : { status: 200, ids: expected },
        });
      }
    }
  });
});
