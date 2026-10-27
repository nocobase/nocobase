import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  defineApiRoutes,
  describeRoute,
  apiErrorHandler,
  ApiError,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
// This isolated verification fixture uses the real native auth and retained application database.
export default defineApiRoutes<Application>(({ container }) => {
  const router = new Hono();
  const routes = new Hono<AuthorizationEnv>();
  routes.onError(apiErrorHandler);
  const auth = container.resolve(authenticationToken);
  const authz = container.resolve(authorizationToken);
  const db = container.resolve(databaseManagerToken);
  const repo = db.repository('recoveryLoans');
  routes.use('*', auth.required(), authz.middleware(), async (c, next) => {
    await c.get('authz').require({
      resource: { type: 'settings', id: 'authorization.permission-sets' },
      action: 'update',
    });
    await next();
  });
  const describe = (summary: string) =>
    describeRoute({
      tags: ['Recovery verification'],
      summary,
      responses: { 200: { description: 'Success' } },
    });
  routes.post(
    '/reset',
    describe('Reset isolated loan verification data'),
    async (c) => {
      const body = await c.req.json();
      const count = Number(body.count ?? 21);
      if (!Number.isSafeInteger(count) || count < 0 || count > 1000)
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_COUNT',
          domain: 'list-recovery-fixture',
          message: 'Invalid count',
        });
      await repo.deleteMany({ filter: { deleted: false } });
      await repo.deleteMany({ filter: { deleted: true } });
      for (let i = 1; i <= count + 3; i++)
        await repo.createOne({
          values: {
            id: String(i).padStart(3, '0'),
            name: `Loan ${String(i).padStart(3, '0')}`,
            status: i <= count ? 'open' : 'closed',
            costCenter: 'LAB-42',
            approvalState: 'approved',
            protected: i === 2,
            deleted: false,
            deleteEvents: 0,
          },
        });
      return c.json({ data: { count } });
    },
  );
  routes.get(
    '/',
    describe('List matching loan records and accurate total'),
    async (c) => {
      const page = Number(c.req.query('page') ?? 1),
        pageSize = Number(c.req.query('pageSize') ?? 10);
      if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        ![10, 20, 50, 100].includes(pageSize)
      )
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_PAGE',
          domain: 'list-recovery-fixture',
          message: 'Invalid page',
        });
      const q = c.req.query('q') ?? '',
        status = c.req.query('status') ?? '';
      const filter: NonNullable<Parameters<typeof repo.count>[0]> = {
        filter: (f) =>
          f.and([
            f.boolean('deleted').isFalse(),
            ...(q ? [f.string('name').includes(q)] : []),
            ...(status ? [f.string('status').eq(status)] : []),
          ]),
      };
      const [total, data] = await Promise.all([
        repo.count(filter),
        repo.findMany({
          ...filter,
          sort: (s) => [
            c.req.query('order') === 'desc'
              ? s.field('name').desc()
              : s.field('name').asc(),
          ],
          limit: c.req.query('mode') === 'client' ? 1000 : pageSize,
          offset: c.req.query('mode') === 'client' ? 0 : (page - 1) * pageSize,
        }),
      ]);
      return c.json({ data, meta: { total } });
    },
  );
  routes.get(
    '/snapshot',
    describe('Read retained business data for upgrade comparison'),
    async (c) =>
      c.json({
        data: await repo.findMany({ sort: (s) => [s.field('id').asc()] }),
      }),
  );
  routes.post(
    '/validate',
    describe('Retain cost center validation'),
    async (c) => {
      const body = await c.req.json();
      if (!body.costCenter?.trim())
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_COST_CENTER',
          domain: 'list-recovery-fixture',
          message: 'Cost center is required',
        });
      return c.json({ data: { valid: true } });
    },
  );
  routes.delete(
    '/:id',
    describe('Soft delete a loan with business policy and event counter'),
    async (c) => {
      const id = c.req.param('id'),
        current = await repo.findOne({ filter: { id } });
      if (!current || current.deleted)
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'LOAN_NOT_FOUND',
          domain: 'list-recovery-fixture',
          message: 'Loan not found',
        });
      if (current.protected)
        throw new ApiError({
          status: 'FAILED_PRECONDITION',
          reason: 'PROTECTED_LOAN',
          domain: 'list-recovery-fixture',
          httpStatus: 409,
          message: 'Approved loan is protected',
        });
      await repo.updateOne({
        filter: { id },
        values: {
          deleted: true,
          deleteEvents: Number(current.deleteEvents) + 1,
        },
      });
      return c.json({ data: { id } });
    },
  );
  return router.route('/loans', routes);
});
