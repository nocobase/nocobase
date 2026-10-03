// @vitest-environment node
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  provisionTestDatabases,
  describeMigration,
} from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

import packageMetadata from '../package.json' with { type: 'json' };
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  SEED_DEPARTMENTS,
} from '../database/seed-data/organization.js';
import { createTestApp } from './helpers.js';

const SEED = '202609250002_departments_example_seed_organization';

describeMigration('202609250001_departments_example_create_organization', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: path.resolve(import.meta.dirname, '../database/migrations'),
    },
  ],
  up: async ({ connection, expectCollection }) => {
    const departments = await expectCollection('departments').toExist();
    expect(Object.keys(departments.fields)).toEqual(
      expect.arrayContaining([
        'id',
        'title',
        'parentId',
        'region',
        'managerId',
        'active',
        'sortOrder',
      ]),
    );
    await expectCollection('departments').toHaveField('title', {
      nullable: false,
    });
    expect(departments.primaryKey).toEqual(['id']);
    await expectCollection('departments').toHaveIndex(['parentId'], {
      unique: false,
    });
    await expectCollection('departments').toHaveIndex(['managerId'], {
      unique: false,
    });

    const members = await expectCollection('departmentMembers').toExist();
    expect(Object.keys(members.fields)).toEqual(
      expect.arrayContaining([
        'id',
        'departmentId',
        'userId',
        'primary',
        'active',
      ]),
    );
    await expectCollection('departmentMembers').toHaveIndex(
      ['departmentId', 'userId'],
      { unique: true },
    );
    await expectCollection('departmentMembers').toHaveIndex(['userId'], {
      unique: false,
    });
    expect(await connection.collections.get('departmentMembers')).toBeDefined();
  },
  down: async ({ connection, expectCollection }) => {
    expect(await connection.collections.get('departments')).toBeUndefined();
    await expectCollection('departments').not.toExist();
    await expectCollection('departmentMembers').not.toExist();
  },
});

describe('organization seed', () => {
  it('writes the tree, the demo accounts, their assignments, regions and sales data once, and a replay changes nothing', async () => {
    // The replay restarts the application on the database the first start seeded, so the test provisions that
    // database itself and hands the same connection to both starts.
    const directory = mkdtempSync(path.join(tmpdir(), 'departments-example-'));
    const databases = await provisionTestDatabases();
    const connection = databases.connectionConfig();
    const first = await createTestApp({ directory, connection });
    const snapshot = async (app: typeof first) => {
      const query = app.database.connection().query;
      const demoUsers = (
        await query
          .selectFrom('user')
          .select('id')
          .where('email', 'like', '%@departments.example')
          .execute()
      ).map((row) => String(row.id));
      return {
        departments: await query
          .selectFrom('departments')
          .select(['id', 'title', 'parentId', 'region', 'managerId', 'active'])
          .orderBy('id', 'asc')
          .execute(),
        assignments: await query
          .selectFrom('authorizationPermissionSetAssignments')
          .leftJoin('user', 'user.id', 'subjectId')
          .select(['permissionSetKey', 'subjectType', 'subjectId', 'email'])
          .where((where) =>
            where.or([
              where('subjectType', 'in', [
                'org.department',
                'org.departmentHead',
              ]),
              where('subjectId', 'in', demoUsers),
            ]),
          )
          .orderBy('permissionSetKey', 'asc')
          .orderBy('subjectId', 'asc')
          .execute(),
        sharing: await query
          .selectFrom('authorizationSharingRuleAssignments')
          .select(['sharingRuleId', 'subjectId'])
          .where('subjectType', '=', 'org.department')
          .orderBy('sharingRuleId', 'asc')
          .orderBy('subjectId', 'asc')
          .execute(),
        restrictions: await query
          .selectFrom('authorizationRestrictionRuleAssignments')
          .select(['restrictionRuleId', 'subjectId'])
          .where('subjectType', '=', 'org.department')
          .orderBy('restrictionRuleId', 'asc')
          .execute(),
        users: await query
          .selectFrom('user')
          .innerJoin('account', 'account.userId', 'user.id')
          .select(['user.id', 'user.email', 'account.providerId'])
          .where('user.email', 'like', '%@departments.example')
          .orderBy('user.email', 'asc')
          .execute(),
        members: await query
          .selectFrom('departmentMembers')
          .innerJoin('user', 'user.id', 'departmentMembers.userId')
          .select(['departmentId', 'email', 'primary'])
          .where('email', 'like', '%@departments.example')
          .orderBy('email', 'asc')
          .orderBy('departmentId', 'asc')
          .execute(),
        regions: await query
          .selectFrom('authorizationExampleSalesMembers')
          .innerJoin('user', 'user.id', 'authorizationExampleSalesMembers.id')
          .select(['email', 'region'])
          .where('email', 'like', '%@departments.example')
          .orderBy('email', 'asc')
          .execute(),
        staff: await query
          .selectFrom('departmentMembers')
          .innerJoin('user', 'user.id', 'departmentMembers.userId')
          .select(['departmentId', 'email'])
          .where('email', 'like', 'sales_%@example.test')
          .orderBy('email', 'asc')
          .execute(),
        projects: await query
          .selectFrom('authorizationExampleProjects')
          .innerJoin('user', 'user.id', 'authorizationExampleProjects.ownerId')
          .select([
            'authorizationExampleProjects.id',
            'region',
            'confidential',
            'email',
          ])
          .where('authorizationExampleProjects.id', 'like', 'dept-%')
          .orderBy('authorizationExampleProjects.id', 'asc')
          .execute(),
        quotes: await query
          .selectFrom('authorizationExampleQuotes')
          .innerJoin(
            'user',
            'user.id',
            'authorizationExampleQuotes.preparedById',
          )
          .select([
            'authorizationExampleQuotes.id',
            'projectId',
            'preparedByName',
            'status',
            'email',
          ])
          .where('authorizationExampleQuotes.id', 'like', 'dept-%')
          .orderBy('authorizationExampleQuotes.id', 'asc')
          .execute(),
        orders: await query
          .selectFrom('authorizationExampleOrders')
          .select(['id', 'projectId', 'quoteId', 'status'])
          .where('id', 'like', 'dept-%')
          .orderBy('id', 'asc')
          .execute(),
        sets: await query
          .selectFrom('authorizationPermissionSets')
          .select(['key', 'title'])
          .where('key', 'like', 'departments-example-%')
          .orderBy('key', 'asc')
          .execute(),
        sharingRules: await query
          .selectFrom('authorizationSharingRules')
          .select(['key', 'resourceId', 'actions'])
          .where('key', 'like', 'departments-example-%')
          .execute(),
      };
    };
    try {
      const seeded = await snapshot(first);
      expect(seeded.departments.map((row) => row.id)).toEqual(
        SEED_DEPARTMENTS.map((row) => row.id).sort(),
      );
      // Seeded titles are stored as translation descriptors, the way permission-set titles are.
      expect(
        seeded.departments.find((row) => row.id === 'north-sales'),
      ).toMatchObject({
        title: JSON.stringify({
          key: 'seed.northSales',
          ns: '@nocobase/app-plugin-departments-example',
        }),
        parentId: 'sales-center',
        region: 'North',
      });
      expect(
        seeded.assignments.map((row) => [
          row.permissionSetKey,
          row.subjectType === 'user' ? row.email : row.subjectId,
        ]),
      ).toEqual(
        expect.arrayContaining([
          ['example-sales-assistant', 'sales-center'],
          ['example-sales-delivery', 'delivery'],
          ['example-sales-engineer', 'leo@departments.example'],
          ['example-sales-engineer', 'eric@departments.example'],
          ['example-sales-manager', 'grace@departments.example'],
          ['departments-example-project-viewer', 'north-sales'],
          ['departments-example-project-viewer-own', 'delivery'],
          ['departments-example-head', '*'],
        ]),
      );
      expect(seeded.assignments).toHaveLength(8);
      expect(seeded.sets.map((row) => [row.key, row.title])).toEqual([
        [
          'departments-example-head',
          JSON.stringify({
            key: 'sets.head',
            ns: '@nocobase/app-plugin-departments-example',
          }),
        ],
        [
          'departments-example-project-viewer',
          JSON.stringify({
            key: 'sets.projectViewer',
            ns: '@nocobase/app-plugin-departments-example',
          }),
        ],
        [
          'departments-example-project-viewer-own',
          JSON.stringify({
            key: 'sets.projectViewerOwn',
            ns: '@nocobase/app-plugin-departments-example',
          }),
        ],
      ]);
      expect(seeded.sharingRules).toEqual([
        {
          key: 'departments-example-sales-projects',
          resourceId: 'example.sales.projects',
          actions: JSON.stringify([
            {
              action: 'view',
              scopeKey: 'projects',
              selection: {
                type: 'records',
                ids: ['dept-project-riverside', 'dept-project-bayview'],
              },
            },
          ]),
        },
      ]);
      expect(seeded.sharing).toEqual([
        {
          sharingRuleId: 'departments-example-sales-projects',
          subjectId: 'delivery',
        },
        { sharingRuleId: 'example-delivery-orders', subjectId: 'delivery' },
        { sharingRuleId: 'example-delivery-orders', subjectId: 'sales-center' },
        {
          sharingRuleId: 'example-selected-projects',
          subjectId: 'executive-office',
        },
      ]);
      // The authorization example's accounts stay outside the organisation.
      expect(seeded.staff).toEqual([]);
      // Demo sales data owned by this example's staff, in each owner's department region.
      expect(
        seeded.projects.map((row) => [
          row.id,
          row.region,
          Boolean(row.confidential),
          row.email,
        ]),
      ).toEqual([
        ['dept-project-bayview', 'South', false, 'eric@departments.example'],
        ['dept-project-northgate', 'North', false, 'leo@departments.example'],
        ['dept-project-riverside', 'North', false, 'leo@departments.example'],
        ['dept-project-southport', 'South', false, 'eric@departments.example'],
      ]);
      expect(seeded.quotes).toEqual([
        {
          id: 'dept-quote-bayview',
          projectId: 'dept-project-bayview',
          preparedByName: 'Eric Liu',
          status: 'accepted',
          email: 'eric@departments.example',
        },
        {
          id: 'dept-quote-riverside',
          projectId: 'dept-project-riverside',
          preparedByName: 'Leo Wang',
          status: 'draft',
          email: 'leo@departments.example',
        },
      ]);
      expect(seeded.orders).toEqual([
        {
          id: 'dept-order-bayview',
          projectId: 'dept-project-bayview',
          quoteId: 'dept-quote-bayview',
          status: 'ready',
        },
      ]);
      // Heads are appointed with their accounts.
      const heads = Object.fromEntries(
        seeded.departments.map((row) => [row.id, row.managerId]),
      );
      const userId = (address: string) =>
        seeded.users.find((row) => row.email === address)?.id;
      expect(heads['sales-center']).toBe(userId('sophia@departments.example'));
      expect(heads['north-sales']).toBe(userId('owen@departments.example'));
      expect(seeded.restrictions).toHaveLength(3);
      // Each demo account is a credential account with its memberships.
      expect(seeded.users.map((row) => [row.email, row.providerId])).toEqual(
        DEMO_ACCOUNTS.map((account) => [account.email, 'credential']).sort(),
      );
      expect(
        seeded.members.map((row) => [
          row.email,
          row.departmentId,
          Boolean(row.primary),
        ]),
      ).toEqual(
        DEMO_ACCOUNTS.flatMap((account) =>
          account.memberships.map((membership) => [
            account.email,
            membership.departmentId,
            membership.primary,
          ]),
        ).sort((a, b) =>
          `${String(a[0])}/${String(a[1])}`.localeCompare(
            `${String(b[0])}/${String(b[1])}`,
          ),
        ),
      );
      // The HR sync wrote the regional accounts' sales region; Chen's primary department decides his.
      expect(seeded.regions).toEqual([
        { email: 'chen@departments.example', region: 'South' },
        { email: 'eric@departments.example', region: 'South' },
        { email: 'leo@departments.example', region: 'North' },
        { email: 'nina@departments.example', region: 'North' },
        { email: 'owen@departments.example', region: 'North' },
      ]);
      // The seeded password signs in.
      await first.signIn('grace@departments.example', DEMO_PASSWORD);

      // An administrator renames a department and edits a demo project; a deliberate replay must keep both.
      await first.organization.updateDepartment('sales-center', {
        title: 'Sales and marketing',
      });
      await first.database
        .connection()
        .query.updateTable('authorizationExampleProjects')
        .set({ region: 'West' })
        .where('id', '=', 'dept-project-southport')
        .execute();
      await first.database
        .connection()
        .query.deleteFrom('__nocobase_seeds')
        .where('name', '=', SEED)
        .execute();
      await first.close({ keep: true });

      const second = await createTestApp({ directory, connection });
      try {
        const replayed = await snapshot(second);
        const history = await second.database
          .connection()
          .query.selectFrom('__nocobase_seeds')
          .select('name')
          .where('name', '=', SEED)
          .execute();
        expect(history).toHaveLength(1);
        expect(replayed.assignments).toEqual(seeded.assignments);
        expect(replayed.sharing).toEqual(seeded.sharing);
        expect(replayed.restrictions).toEqual(seeded.restrictions);
        expect(replayed.users).toEqual(seeded.users);
        expect(replayed.members).toEqual(seeded.members);
        expect(replayed.regions).toEqual(seeded.regions);
        expect(replayed.staff).toEqual(seeded.staff);
        expect(replayed.projects).toEqual(
          seeded.projects.map((row) =>
            row.id === 'dept-project-southport'
              ? { ...row, region: 'West' }
              : row,
          ),
        );
        expect(replayed.quotes).toEqual(seeded.quotes);
        expect(replayed.orders).toEqual(seeded.orders);
        expect(replayed.sets).toEqual(seeded.sets);
        expect(replayed.sharingRules).toEqual(seeded.sharingRules);
        expect(replayed.departments).toEqual(
          seeded.departments.map((row) =>
            row.id === 'sales-center'
              ? { ...row, title: 'Sales and marketing' }
              : row,
          ),
        );
      } finally {
        await second.close();
      }
    } catch (error) {
      await first.close().catch(() => undefined);
      throw error;
    } finally {
      await databases.drop();
    }
  }, 60_000);
});
