import type { AuthorizationContext } from '@nocobase/app-plugin-authorization';
import {
  apiErrorResponses,
  apiValidator,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import { Hono } from 'hono';

import { PROJECTS, QUOTES, ORDERS } from '../sales-authorization.js';
import {
  AUTHORIZATION_EXAMPLE_TAGS as tags,
  authorizeSalesAction,
  forbiddenResponse,
  writableRepository,
  type SalesActionEnv,
} from './mutations.js';
import {
  SalesListMeta,
  SalesListQuery,
  SalesOrderRow,
  SalesProjectRow,
  SalesQuoteRow,
} from './schemas.js';

/**
 * The sales lists page by page number. Each answers `{ data, meta }`, where `meta` carries the paging fields and the
 * page links the caller may follow (`navigation`), since those describe the list rather than any one record.
 */
export function createSalesListRoutes(
  database: DatabaseManager,
): Hono<SalesActionEnv> {
  const router = new Hono<SalesActionEnv>();
  const listQuery = apiValidator('query', SalesListQuery);

  // Each list is declared after its permission check and before the query validator, which documents the paging.
  router.get(
    '/sales/projects',
    authorizeSalesAction('example.sales.projects', 'view'),
    describeRoute({
      tags,
      summary: 'List sales projects',
      operationId: 'authorizationExampleListProjects',
      description:
        "The projects the caller's `view` Policy shows, in id order, paged by `page` and `pageSize`. Each row says whether the caller may edit it, and `meta.navigation` which sales pages it may open. Requires `composite:example.sales.projects` `view`.",
      responses: {
        200: listResponse(SalesProjectRow, SalesListMeta),
        ...apiErrorResponses,
        403: forbiddenResponse,
      },
    }),
    listQuery,
    async (c) => {
      const scope = c.var.authz;
      const page = await viewRecords(
        database,
        c.var.salesPolicies[PROJECTS],
        PROJECTS,
        c.req.valid('query'),
      );
      const items = page.rows;
      const edit = await operationAccess(
        database,
        scope,
        'example.sales.projects',
        PROJECTS,
        'edit',
        ['notes'],
      );
      const navigation = await pageNavigation(scope);

      return c.json({
        data: items.map((row) => {
          let editAccess = 'allowed';
          if (!edit.policies) editAccess = 'notGranted';
          else if (!edit.ids.has(row.id)) editAccess = 'outsideScope';

          return { ...row, operations: { edit: editAccess } };
        }),
        meta: { ...page.meta, navigation },
      });
    },
  );

  router.get(
    '/sales/quotes',
    authorizeSalesAction('example.sales.quotes', 'view'),
    describeRoute({
      tags,
      summary: 'List sales quotes',
      operationId: 'authorizationExampleListQuotes',
      description:
        "The quotes the caller's `view` Policy shows, in id order, paged by `page` and `pageSize`. Each row says whether the caller may edit or submit it, and `meta.navigation` which sales pages it may open. Requires `composite:example.sales.quotes` `view`.",
      responses: {
        200: listResponse(SalesQuoteRow, SalesListMeta),
        ...apiErrorResponses,
        403: forbiddenResponse,
      },
    }),
    listQuery,
    async (c) => {
      const scope = c.var.authz;
      const page = await viewRecords(
        database,
        c.var.salesPolicies[QUOTES],
        QUOTES,
        c.req.valid('query'),
      );
      const items = page.rows;
      const projects = await projectSummaries(database, scope);
      const edit = await operationAccess(
        database,
        scope,
        'example.sales.quotes',
        QUOTES,
        'edit',
        ['amount', 'notes'],
      );
      const submit = await operationAccess(
        database,
        scope,
        'example.sales.quotes',
        QUOTES,
        'submit',
        ['status'],
      );

      const projectPolicy = submit.policies?.[PROJECTS];
      const submittableProjects = projectPolicy?.read
        ? await database
            .repository(PROJECTS)
            .withPolicy(projectPolicy)
            .findMany()
        : [];
      const projectIds = new Set(submittableProjects.map((row) => row.id));
      const navigation = await pageNavigation(scope);

      return c.json({
        data: items.map((row) => {
          let editAccess = 'allowed';
          if (!edit.policies) editAccess = 'notGranted';
          else if (!edit.ids.has(row.id)) editAccess = 'outsideScope';
          else if (row.status !== 'draft') editAccess = 'notDraft';

          let submitAccess = 'allowed';
          if (!submit.policies) submitAccess = 'notGranted';
          else if (!submit.ids.has(row.id)) submitAccess = 'quoteScope';
          else if (!projectIds.has(row.projectId))
            submitAccess = 'projectScope';
          else if (row.status !== 'draft') submitAccess = 'notDraft';
          else if (typeof row.amount !== 'number' || row.amount <= 0)
            submitAccess = 'invalidAmount';

          return {
            ...row,
            project:
              typeof row.projectId === 'string'
                ? projects[row.projectId]
                : undefined,
            operations: { edit: editAccess, submit: submitAccess },
          };
        }),
        meta: { ...page.meta, navigation },
      });
    },
  );

  router.get(
    '/sales/orders',
    authorizeSalesAction('example.sales.orders', 'view'),
    describeRoute({
      tags,
      summary: 'List sales orders',
      operationId: 'authorizationExampleListOrders',
      description:
        "The orders the caller's `view` Policy shows, in id order, paged by `page` and `pageSize`. Each row says whether the caller may deliver it, and `meta.navigation` which sales pages it may open. Requires `composite:example.sales.orders` `view`.",
      responses: {
        200: listResponse(SalesOrderRow, SalesListMeta),
        ...apiErrorResponses,
        403: forbiddenResponse,
      },
    }),
    listQuery,
    async (c) => {
      const scope = c.var.authz;
      const page = await viewRecords(
        database,
        c.var.salesPolicies[ORDERS],
        ORDERS,
        c.req.valid('query'),
      );
      const items = page.rows;
      const projects = await projectSummaries(database, scope);
      const deliver = await operationAccess(
        database,
        scope,
        'example.sales.orders',
        ORDERS,
        'deliver',
        ['status', 'deliveryReference'],
      );
      const navigation = await pageNavigation(scope);

      return c.json({
        data: items.map((row) => {
          let deliverAccess = 'allowed';
          if (!deliver.policies) deliverAccess = 'notGranted';
          else if (!deliver.ids.has(row.id)) deliverAccess = 'outsideScope';
          else if (row.status !== 'ready') deliverAccess = 'notReady';

          return {
            ...row,
            project:
              typeof row.projectId === 'string'
                ? projects[row.projectId]
                : undefined,
            operations: { deliver: deliverAccess },
          };
        }),
        meta: { ...page.meta, navigation },
      });
    },
  );

  return router;
}

/** One page of the records the `view` Policy shows, in id order, with its paging `meta`. */
async function viewRecords(
  database: DatabaseManager,
  policy: RepositoryPolicy,
  collection: string,
  { page, pageSize }: SalesListQuery,
) {
  const meta = { page, pageSize, total: 0 };
  if (!policy.read) return { rows: [], meta };
  const repository = database.repository(collection).withPolicy(policy);
  const [rows, total] = await Promise.all([
    repository.findMany({
      sort: (sort) => sort.field('id').asc(),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    repository.count(),
  ]);
  return { rows, meta: { ...meta, total } };
}

async function pageNavigation(
  scope: AuthorizationContext,
): Promise<Record<string, boolean>> {
  return {
    projects: await scope.can({
      resource: { type: 'page', id: 'example.sales.projects' },
      action: 'access',
    }),
    quotes: await scope.can({
      resource: { type: 'page', id: 'example.sales.quotes' },
      action: 'access',
    }),
    orders: await scope.can({
      resource: { type: 'page', id: 'example.sales.orders' },
      action: 'access',
    }),
  };
}

async function operationAccess(
  database: DatabaseManager,
  scope: AuthorizationContext,
  resource: string,
  collection: string,
  action: string,
  fields: string[],
) {
  const decision = await scope.authorize({
    resource: { type: 'composite', id: resource },
    action,
  });

  const policies =
    decision.effect !== 'deny' ? decision.conditions?.database : undefined;
  const repository =
    policies?.[collection] &&
    writableRepository(database, collection, policies[collection], fields);

  return {
    policies,
    ids: new Set(((await repository?.findMany()) ?? []).map((row) => row.id)),
  };
}

async function projectSummaries(
  database: DatabaseManager,
  scope: AuthorizationContext,
): Promise<Record<string, { title: string; region: string }>> {
  const decision = await scope.authorize({
    resource: { type: 'composite', id: 'example.sales.projects' },
    action: 'view',
  });
  const policy =
    decision.effect !== 'deny'
      ? decision.conditions?.database?.[PROJECTS]
      : undefined;
  if (!policy?.read) return {};

  const rows = await database
    .repository<{ id: string; title: string; region: string }>(PROJECTS)
    .withPolicy(policy)
    .findMany();

  const summaries: Record<string, { title: string; region: string }> = {};
  for (const row of rows) {
    if (
      typeof row.id === 'string' &&
      typeof row.title === 'string' &&
      typeof row.region === 'string'
    )
      summaries[row.id] = { title: row.title, region: row.region };
  }

  return summaries;
}
