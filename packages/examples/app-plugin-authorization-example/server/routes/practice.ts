import type {
  AuthorizationEnv,
  AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import type { DatabaseManager } from '@nocobase/db';
import { Hono } from 'hono';
import { salesRecords } from '../sales-records.js';
import { ApiError } from '@nocobase/app-server/router';
import { AUTHORIZATION_EXAMPLE_DOMAIN, forbidden } from './mutations.js';

import { PROJECTS, QUOTES, ORDERS } from '../sales-authorization.js';

export function createPracticeRoutes(
  database: DatabaseManager,
  authz: AppAuthorization,
): Hono<AuthorizationEnv> {
  const router = new Hono<AuthorizationEnv>();

  router.get('/context', async (c) => {
    const identity = c.var.authz.identity;
    const sets = await authz.permissionSets.getEffective(identity);
    const assignments = await authz.permissionSets.listAssignments();
    const subjects = [identity.principal, ...(identity.subjects ?? [])];

    return c.json({
      data: {
        canReset: (await c.var.authz.snapshot()).unrestricted,
        roles: sets.map((set) => ({
          key: set.key,
          title: set.title,
          sources: assignments
            .filter(
              (assignment) =>
                assignment.permissionSet === set.key &&
                subjects.some(
                  (subject) =>
                    subject.type === assignment.subject.type &&
                    subject.id === assignment.subject.id,
                ),
            )
            .map((assignment) => assignment.subject),
        })),
      },
    });
  });

  router.post('/reset', async (c) => {
    if (!(await c.var.authz.snapshot()).unrestricted)
      throw forbidden('Only an unrestricted user may reset the example.');

    await database.transaction(async (connection) => {
      const users: Record<string, string> = {};
      for (const key of ['assistant', 'engineer', 'manager', 'coordinator']) {
        const user = await connection.query
          .selectFrom('user')
          .select('id')
          .where('username', '=', `sales_${key}`)
          .executeTakeFirst();
        if (!user || typeof user.id !== 'string')
          throw new ApiError({
            status: 'FAILED_PRECONDITION',
            reason: 'EXAMPLE_ACCOUNTS_MISSING',
            domain: AUTHORIZATION_EXAMPLE_DOMAIN,
            message:
              'Example accounts are missing; run application seeds first.',
          });
        users[key] = user.id;
      }

      const records = salesRecords(users);
      const orderIds = records.orders.map((row) => row.id);

      await connection.query
        .deleteFrom('authorizationExampleOrderCarriers')
        .where('orderId', 'in', orderIds)
        .execute();

      await connection.query
        .deleteFrom('authorizationExampleOrderChecks')
        .where('orderId', 'in', orderIds)
        .execute();

      await connection.query
        .updateTable(ORDERS)
        .set({ carrierId: null })
        .where('id', 'in', orderIds)
        .execute();

      for (const [collection, rows] of [
        [PROJECTS, records.projects],
        [QUOTES, records.quotes],
        [ORDERS, records.orders],
      ] as const) {
        for (const row of rows) {
          const existing = await connection.query
            .selectFrom(collection)
            .select('id')
            .where('id', '=', row.id)
            .executeTakeFirst();
          if (existing)
            await connection.query
              .updateTable(collection)
              .set(row)
              .where('id', '=', row.id)
              .execute();
          else
            await connection.query.insertInto(collection).values(row).execute();
        }
      }
    });

    return c.json({ data: { saved: true } });
  });

  return router;
}
