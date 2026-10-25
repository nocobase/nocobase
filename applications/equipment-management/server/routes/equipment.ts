import { z } from 'zod';
import { Hono } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  describeRoute,
  apiValidator,
  apiErrorResponse,
  apiErrorResponses,
  dataResponse,
  listResponse,
} from '@nocobase/app-server/router';
import {
  LifecycleError,
  lifecycleErrorFields,
  lifecycleDescriptionView,
} from '@nocobase/lifecycle';
import { RepositoryError } from '@nocobase/db';
import { equipmentToken } from '../providers/equipment/index.js';
import {
  fail,
  type Policies,
  type Row,
} from '../providers/equipment/service.js';
import { dictionaries } from '../providers/equipment/resources.js';
import {
  AssetInput,
  AssetPatch,
  ListQuery,
  IdParams,
  FireInput,
  RequestInput,
  HandleInput,
  MaintenanceInput,
  CompleteMaintenance,
  StocktakeInput,
  ObservationInput,
  ReferenceInput,
  CsvInput,
} from './equipment-schemas.js';
const RowSchema = z
  .object({ id: z.union([z.string(), z.number()]) })
  .passthrough();
const InfoSchema = z.object({}).passthrough();
const doc = (operationId: string, summary: string, list = false) =>
  describeRoute({
    tags: ['Equipment'],
    operationId,
    summary,
    responses: {
      '200': list ? listResponse(RowSchema) : dataResponse(InfoSchema),
      ...apiErrorResponses,
      '400': apiErrorResponse(400),
      '404': apiErrorResponse(404),
      '409': apiErrorResponse(409),
    },
  });
export const equipmentRoutes = defineApiRoutes<Application>((app) => {
  const router = new Hono();
  const r = new Hono<AuthEnv & AuthorizationEnv>();
  const auth = app.container.resolve(authenticationToken);
  const authorization = app.container.resolve(authorizationToken);
  const service = app.container.resolve(equipmentToken);
  r.use('*', auth.required(), authorization.middleware());
  r.onError((error, c) => {
    if (
      z
        .object({
          code: z.enum([
            'SQLITE_CONSTRAINT_UNIQUE',
            'SQLITE_CONSTRAINT_PRIMARYKEY',
            '23505',
            'ER_DUP_ENTRY',
          ]),
        })
        .safeParse(error).success
    )
      return apiErrorHandler(
        new ApiError({
          status: 'ALREADY_EXISTS',
          reason: 'DUPLICATE_RECORD',
          domain: 'equipment',
          message: 'A record with this unique value already exists.',
        }),
        c,
      );
    if (error instanceof LifecycleError) {
      const fields = lifecycleErrorFields(error, { inputField: 'input' });
      if (fields)
        return apiErrorHandler(
          new ApiError({ ...fields, domain: 'equipment' }),
          c,
        );
    }
    if (error instanceof RepositoryError) {
      const conflict = [
        'UNIQUE_VIOLATION',
        'DUPLICATE_KEY',
        'CONSTRAINT_VIOLATION',
      ].includes(error.code);
      const denied =
        error.code.includes('POLICY') ||
        error.code.includes('DENIED') ||
        error.code.includes('FORBIDDEN');
      return apiErrorHandler(
        new ApiError({
          status: conflict
            ? 'ALREADY_EXISTS'
            : denied
              ? 'PERMISSION_DENIED'
              : 'FAILED_PRECONDITION',
          reason: conflict ? 'DUPLICATE_RECORD' : 'EQUIPMENT_' + error.code,
          domain: 'equipment',
          message:
            'The operation could not be completed. Review the values and refresh the record.',
        }),
        c,
      );
    }
    return apiErrorHandler(error, c);
  });
  // The composite decision is retained for the exact operation; unrelated grants cannot widen a table policy.
  async function policies(
    context: AuthorizationEnv['Variables']['authz'],
    resource: string,
    action: string,
  ): Promise<Policies> {
    const d = await context.authorize({
      resource: { type: 'composite', id: 'equipment.' + resource },
      action,
    });
    if (d.effect === 'deny' || !d.conditions?.database)
      fail('EQUIPMENT_ACCESS_DENIED', 'PERMISSION_DENIED');
    return d.conditions.database;
  }
  async function assetRead(context: AuthorizationEnv['Variables']['authz']) {
    const d = await context.authorize({
      resource: { type: 'composite', id: 'equipment.assets' },
      action: 'inspect',
    });
    if (d.effect !== 'deny' && d.conditions?.database?.equipmentAssets)
      return { p: d.conditions.database as Policies, full: true };
    return { p: await policies(context, 'assets', 'view'), full: false };
  }
  const who = (c: { get: (key: 'auth') => AuthEnv['Variables']['auth'] }) =>
    String(c.get('auth')!.user.id);
  r.get(
    '/capabilities',
    doc('equipmentCapabilities', 'Get equipment action capabilities'),
    async (c) => {
      const result: Record<string, boolean> = {};
      for (const [resource, action] of [
        ['assets', 'inspect'],
        ['assets', 'create'],
        ['assets', 'operate'],
        ['assets', 'import'],
        ['assets', 'export'],
        ['requests', 'create'],
        ['requests', 'handle'],
        ['maintenance', 'manage'],
        ['stocktakes', 'manage'],
        ['reference', 'manage'],
        ['reference', 'directory'],
      ] as const) {
        const d = await c.get('authz').authorize({
          resource: { type: 'composite', id: 'equipment.' + resource },
          action,
        });
        result[resource + '.' + action] = d.effect !== 'deny';
      }
      return c.json({ data: result });
    },
  );
  r.get(
    '/assets',
    doc('listEquipmentAssets', 'List scoped equipment', true),
    apiValidator('query', ListQuery),
    async (c) => {
      const access = await assetRead(c.get('authz'));
      return c.json(
        await service.listAssets(c.req.valid('query'), who(c), access.p),
      );
    },
  );
  r.post(
    '/assets',
    doc('createEquipmentAsset', 'Create an idle asset'),
    apiValidator('json', AssetInput),
    async (c) => {
      const p = await policies(c.get('authz'), 'assets', 'create');
      return c.json({
        data: await service.createAsset(c.req.valid('json'), who(c), p),
      });
    },
  );
  r.get(
    '/assets/:id',
    doc('getEquipmentAsset', 'Get an asset and authorized history'),
    apiValidator('param', IdParams),
    async (c) => {
      const access = await assetRead(c.get('authz'));
      const id = c.req.valid('param').id;
      const record = await service.requireRow('equipmentAssets', id, access.p);
      if (!access.full)
        return c.json({ data: { record, available: [], history: [] } });
      const view = await service.runtime.view('equipmentAssets', id, {
        id: who(c),
      });
      // History inputs may contain values hidden by this caller's field policy.
      // The asset page needs audit metadata only; privileged workflow inspection owns full inputs.
      return c.json({
        data: {
          record,
          state: view.state,
          version: view.version,
          available: view.available,
          history: {
            transitions: view.history.transitions.map(
              ({ id, transition, at, from, to, version, actorId }) => ({
                id,
                transition,
                at,
                from,
                to,
                version,
                actorId,
              }),
            ),
            effectRuns: [],
          },
        },
      });
    },
  );
  r.patch(
    '/assets/:id',
    doc('updateEquipmentAsset', 'Update descriptive equipment fields'),
    apiValidator('param', IdParams),
    apiValidator('json', AssetPatch),
    async (c) => {
      const p = await policies(c.get('authz'), 'assets', 'operate');
      const { expectVersion, ...values } = c.req.valid('json');
      return c.json({
        data: await service.patchAsset(
          c.req.valid('param').id,
          values,
          expectVersion,
          who(c),
          p,
        ),
      });
    },
  );
  r.post(
    '/assets/:id/fire',
    doc('fireEquipmentAsset', 'Execute an equipment movement'),
    apiValidator('param', IdParams),
    apiValidator('json', FireInput),
    async (c) => {
      const p = await policies(c.get('authz'), 'assets', 'operate');
      const b = c.req.valid('json');
      return c.json({
        data: await service.fireAsset(
          c.req.valid('param').id,
          b.transition,
          b.input,
          b.expectVersion,
          b.requestId,
          who(c),
          p,
        ),
      });
    },
  );
  r.get(
    '/reference',
    doc(
      'listEquipmentReferences',
      'Read reference data and optional custodian directory',
    ),
    async (c) => {
      const p = await policies(c.get('authz'), 'reference', 'view');
      const data: Record<string, Row[]> = {};
      for (const name of dictionaries)
        data[name] = await service
          .repo(name, p)
          .findMany({ limit: 1000, sort: (s) => s.field('name').asc() });
      const d = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'equipment.reference' },
        action: 'directory',
      });
      data.users =
        d.effect !== 'deny' && d.conditions?.database?.user
          ? await service.db
              .repository('user')
              .withPolicy(d.conditions.database.user)
              .findMany({ limit: 1000, sort: (s) => s.field('name').asc() })
          : [];
      return c.json({ data });
    },
  );
  const RefParams = z.object({
    kind: z.enum([
      'equipmentCategories',
      'equipmentDepartments',
      'equipmentLocations',
    ]),
    id: z.string().max(64).optional(),
  });
  r.post(
    '/reference/:kind',
    doc('createEquipmentReference', 'Create reference data'),
    apiValidator('param', RefParams),
    apiValidator('json', ReferenceInput),
    async (c) => {
      const p = await policies(c.get('authz'), 'reference', 'manage');
      return c.json({
        data: (
          await service.repo(c.req.valid('param').kind, p).createOne({
            values: { id: crypto.randomUUID(), ...c.req.valid('json') },
          })
        ).record,
      });
    },
  );
  r.patch(
    '/reference/:kind/:id',
    doc('updateEquipmentReference', 'Update reference data'),
    apiValidator('param', RefParams),
    apiValidator('json', ReferenceInput),
    async (c) => {
      const p = await policies(c.get('authz'), 'reference', 'manage');
      return c.json({
        data: (
          await service.repo(c.req.valid('param').kind, p).updateOne({
            filter: { id: c.req.valid('param').id! },
            values: c.req.valid('json'),
          })
        ).record,
      });
    },
  );
  r.delete(
    '/reference/:kind/:id',
    doc('deleteEquipmentReference', 'Delete unused reference data'),
    apiValidator('param', RefParams),
    async (c) => {
      const p = await policies(c.get('authz'), 'reference', 'manage');
      const { kind, id } = c.req.valid('param');
      const field =
        kind === 'equipmentCategories'
          ? 'categoryId'
          : kind === 'equipmentDepartments'
            ? 'departmentId'
            : 'locationId';
      await service.db.transaction(async (connection) => {
        if (
          await connection
            .repository('equipmentAssets')
            .count({ filter: { [field]: id } })
        )
          fail('REFERENCE_IN_USE');
        if (
          kind === 'equipmentLocations' &&
          (await connection
            .repository('equipmentStocktakes')
            .count({ filter: { locationId: id } }))
        )
          fail('REFERENCE_IN_USE');
        await service
          .repo(kind, p, connection)
          .deleteOne({ filter: { id: id! } });
      });
      return c.json({ data: { deleted: true } });
    },
  );
  for (const [path, collection, resource] of [
    ['requests', 'equipmentRequests', 'requests'],
    ['maintenance', 'equipmentMaintenance', 'maintenance'],
    ['stocktakes', 'equipmentStocktakes', 'stocktakes'],
  ] as const) {
    r.get(
      '/' + path,
      doc('listEquipment' + path, 'List ' + path, true),
      apiValidator('query', ListQuery),
      async (c) => {
        const p = await policies(c.get('authz'), resource, 'view');
        const q = c.req.valid('query');
        const filter = q.status ? { status: q.status } : undefined;
        const repo = service.repo(collection, p);
        const [data, total] = await Promise.all([
          repo.findMany({
            filter,
            limit: q.pageSize,
            offset: (q.page - 1) * q.pageSize,
            sort: (s) => [s.field('createdAt').desc(), s.field('id').desc()],
          }),
          repo.count({ filter }),
        ]);
        return c.json({
          data,
          meta: { page: q.page, pageSize: q.pageSize, total },
        });
      },
    );
    r.get(
      '/' + path + '/:id',
      doc('getEquipment' + path, 'Get ' + path + ' record'),
      apiValidator('param', IdParams),
      async (c) => {
        const p = await policies(c.get('authz'), resource, 'view');
        const id = c.req.valid('param').id;
        const record = await service.requireRow(collection, id, p);
        if (path === 'stocktakes')
          return c.json({
            data: {
              record,
              items: await service
                .repo('equipmentStocktakeItems', p)
                .findMany({ filter: { stocktakeId: id }, limit: 1000 }),
            },
          });
        return c.json({ data: { record } });
      },
    );
  }
  r.post(
    '/requests',
    doc('createEquipmentRequest', 'Submit an equipment request'),
    apiValidator('json', RequestInput),
    async (c) =>
      c.json({
        data: await service.createRequest(
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'requests', 'create'),
        ),
      }),
  );
  r.post(
    '/requests/:id/handle',
    doc('handleEquipmentRequest', 'Confirm or reject a request once'),
    apiValidator('param', IdParams),
    apiValidator('json', HandleInput),
    async (c) =>
      c.json({
        data: await service.handleRequest(
          c.req.valid('param').id,
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'requests', 'handle'),
        ),
      }),
  );
  r.post(
    '/maintenance',
    doc(
      'openEquipmentMaintenance',
      'Open a maintenance order and hold equipment',
    ),
    apiValidator('json', MaintenanceInput),
    async (c) =>
      c.json({
        data: await service.createMaintenance(
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'maintenance', 'manage'),
        ),
      }),
  );
  r.post(
    '/maintenance/:id/complete',
    doc(
      'completeEquipmentMaintenance',
      'Complete maintenance and restore assignment',
    ),
    apiValidator('param', IdParams),
    apiValidator('json', CompleteMaintenance),
    async (c) =>
      c.json({
        data: await service.completeMaintenance(
          c.req.valid('param').id,
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'maintenance', 'manage'),
        ),
      }),
  );
  r.post(
    '/stocktakes',
    doc('createEquipmentStocktake', 'Snapshot assets at a location'),
    apiValidator('json', StocktakeInput),
    async (c) =>
      c.json({
        data: await service.createStocktake(
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'stocktakes', 'manage'),
        ),
      }),
  );
  r.put(
    '/stocktakes/:id/items/:itemId',
    doc(
      'observeEquipmentStocktake',
      'Record stocktake observation and resolution',
    ),
    apiValidator(
      'param',
      IdParams.extend({ itemId: z.string().min(1).max(64) }),
    ),
    apiValidator('json', ObservationInput),
    async (c) =>
      c.json({
        data: await service.observe(
          c.req.valid('param').id,
          c.req.valid('param').itemId,
          c.req.valid('json'),
          who(c),
          await policies(c.get('authz'), 'stocktakes', 'manage'),
        ),
      }),
  );
  r.post(
    '/stocktakes/:id/complete',
    doc('completeEquipmentStocktake', 'Complete a fully resolved stocktake'),
    apiValidator('param', IdParams),
    apiValidator(
      'json',
      z.object({ expectVersion: z.number().int().nonnegative() }).strict(),
    ),
    async (c) =>
      c.json({
        data: await service.completeStocktake(
          c.req.valid('param').id,
          c.req.valid('json').expectVersion,
          who(c),
          await policies(c.get('authz'), 'stocktakes', 'manage'),
        ),
      }),
  );
  r.get(
    '/stats',
    doc('equipmentStatistics', 'Read scoped equipment counts'),
    async (c) => {
      const { p } = await assetRead(c.get('authz'));
      const data = await service
        .repo('equipmentAssets', p)
        .groupBy({ by: ['status'], aggregate: (a) => ({ count: a.count() }) });
      return c.json({ data: { counts: data } });
    },
  );
  for (const mode of ['preview', 'commit'] as const)
    r.post(
      '/import/' + mode,
      doc('equipmentImport' + mode, 'Validate or atomically import CSV'),
      apiValidator('json', CsvInput),
      async (c) =>
        c.json({
          data: await service.importCsv(
            c.req.valid('json').csv,
            who(c),
            await policies(c.get('authz'), 'assets', 'import'),
            mode === 'commit',
          ),
        }),
    );
  r.get(
    '/export',
    doc('equipmentExport', 'Export authorized assets as safe CSV'),
    apiValidator('query', ListQuery),
    async (c) =>
      c.json({
        data: await service.exportCsv(
          c.req.valid('query'),
          who(c),
          await policies(c.get('authz'), 'assets', 'export'),
        ),
      }),
  );
  r.get(
    '/workflows',
    doc('listEquipmentWorkflows', 'List source-owned equipment workflows'),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'equipment.workflows' },
        action: 'read',
      });
      return c.json({
        data: [
          'equipmentAssets',
          'equipmentRequests',
          'equipmentMaintenance',
          'equipmentStocktakes',
        ].map((name) => ({
          id: name,
          ...lifecycleDescriptionView(service.runtime, name),
        })),
      });
    },
  );
  r.get(
    '/workflows/:id',
    doc('getEquipmentWorkflow', 'Read workflow definition'),
    apiValidator('param', IdParams),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'equipment.workflows' },
        action: 'read',
      });
      const id = c.req.valid('param').id;
      if (
        ![
          'equipmentAssets',
          'equipmentRequests',
          'equipmentMaintenance',
          'equipmentStocktakes',
        ].includes(id)
      )
        fail('WORKFLOW_NOT_FOUND', 'NOT_FOUND');
      return c.json({
        data: { id, ...lifecycleDescriptionView(service.runtime, id) },
      });
    },
  );
  r.get(
    '/executions',
    doc(
      'listEquipmentExecutions',
      'Read bounded equipment execution history',
      true,
    ),
    apiValidator('query', ListQuery),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'equipment.workflows' },
        action: 'read',
      });
      const q = c.req.valid('query');
      const repo = service.db.repository('equipmentTransitions');
      return c.json({
        data: await repo.findMany({
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
          sort: (s) =>
            q.order === 'asc' ? s.field('id').asc() : s.field('id').desc(),
        }),
        meta: { page: q.page, pageSize: q.pageSize, total: await repo.count() },
      });
    },
  );
  r.get(
    '/executions/:lifecycle/:id',
    doc('getEquipmentExecution', 'Read a workflow execution'),
    apiValidator(
      'param',
      IdParams.extend({
        lifecycle: z.enum([
          'equipmentAssets',
          'equipmentRequests',
          'equipmentMaintenance',
          'equipmentStocktakes',
        ]),
      }),
    ),
    async (c) => {
      await c.get('authz').require({
        resource: { type: 'settings', id: 'equipment.workflows' },
        action: 'read',
      });
      const { lifecycle, id } = c.req.valid('param');
      return c.json({
        data: {
          ...(await service.runtime.view(lifecycle, id, { id: who(c) })),
          definition: lifecycleDescriptionView(service.runtime, lifecycle),
        },
      });
    },
  );
  router.route('/equipment', r);
  return router;
});
