# Repository Query and Mutation Examples

Use these examples for a plugin page that reads or changes Collections through the host API Client. They follow the current Repository example plugin (`packages/examples/app-plugin-repository-example/README.md`), its customer migration (`packages/examples/app-plugin-repository-example/database/migrations/202609060001_repository_example_create_crm.ts`), and remote Repository contract (`packages/libs/api-client/src/repository.ts`). Register that example plugin and run its migrations before trying its Collection names; these examples need no demonstration Seed.

## Expose only the intended server operations

Place this contribution in `server/routes/index.ts` and import it from the plugin's Server declaration, preserving its `baseDir` and database contributions. This demonstration policy deliberately allows all authenticated users to manage shared customer records. A tenant- or role-restricted product must substitute its own caller-dependent policy rather than copy that access decision.

```ts
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  type AppApiRouteContribution,
  type RepositoryApiExposure,
} from '@nocobase/app-server/router';
import { buildRepositoryPolicy } from '@nocobase/db';
import { Hono } from 'hono';

const repositories: readonly RepositoryApiExposure[] = [
  {
    name: 'repositoryExampleCustomers',
    policy: buildRepositoryPolicy((policy) =>
      policy
        .read(true)
        .create((create) =>
          create.scope(true).fields('id', 'name', 'company', 'email', 'status'),
        )
        .update((update) =>
          update.scope(true).fields('name', 'company', 'email', 'status'),
        )
        .delete(true),
    ),
    actions: {
      findMany: { maxLimit: 100 },
      findOne: {},
      count: {},
      createOne: {},
      updateOne: {},
      deleteOne: {},
    },
  },
];
const repositoryRoutes = defineRepositoryApiRoutes({ repositories });

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(async (app) => {
    const router = new Hono();
    const authentication = app.container.resolve(authenticationToken);
    for (const { name, actions } of repositories) {
      for (const action of Object.keys(actions)) {
        router.use(`/${name}/${action}`, authentication.required());
      }
    }
    router.route('/', await repositoryRoutes.createRouter(app));
    return router;
  });

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];
export default routes;
```

The Collection name is logical metadata, not a physical table name. The `actions` map is the endpoint allowlist; a policy does not expose an omitted action. Policy nodes omitted from `buildRepositoryPolicy()` deny access. Request bodies cannot set `policy` or `scope`. For caller-specific rules, supply both an exposure policy function and the `principal(context)` resolver; an unresolved principal is forbidden. See [database resources](database.md) for policy and schema boundaries.

## Resolve a typed Repository from the host

For `client/customers.ts`, import the Client and Repository types from the host runtime. This example includes every non-null customer field from the current migration, including `company`.

```ts
import {
  useApiClient,
  type ApiClient,
  type RemoteRepository,
} from '@nocobase/app-client';

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly email: string;
  readonly status: 'lead' | 'active' | 'inactive';
}

export type CustomerCreate = Customer;
export type CustomerUpdate = Partial<Omit<Customer, 'id'>>;
export type CustomersRepository = RemoteRepository<
  Customer,
  CustomerCreate,
  CustomerUpdate
>;

export function getCustomers(api: ApiClient): CustomersRepository {
  return api.repository<Customer, CustomerCreate, CustomerUpdate>(
    'repositoryExampleCustomers',
  );
}

export function useCustomers(): CustomersRepository {
  return getCustomers(useApiClient());
}
```

Call `useCustomers()` only from a React component or custom Hook; pass `getCustomers(api)` to ordinary functions from an application-owned service or caller. Do not create a second API Client for product requests. Perform requests in the page's loading mechanism or awaited event handler, never during render. The host handles the API base URL, deployment prefix, session, and response envelope.

## Query with Builders or JSON AST

In an async caller with `customers: CustomersRepository`, use Builders directly; the client converts their synchronous callbacks to JSON before making the request. No manual `.build()` is required:

```ts
const matches = await customers.findMany({
  filter: (filter) => filter.string('name').includes('Alice'),
  select: (select) => select.fields('id', 'name', 'email'),
  sort: (sort) => sort.field('name').asc(),
  limit: 20,
  offset: 0,
});
```

The equivalent JSON form is useful when queries are stored or generated dynamically:

```ts
const matches = await customers.findMany({
  filter: {
    kind: 'filter',
    version: 1,
    root: {
      kind: 'group',
      logic: 'and',
      items: [
        {
          kind: 'condition',
          path: ['name'],
          operator: '$includes',
          value: 'Alice',
        },
      ],
    },
  },
  select: {
    kind: 'select',
    version: 1,
    root: { kind: 'selection', fields: ['id', 'name', 'email'] },
  },
  sort: {
    kind: 'sort',
    version: 1,
    items: [{ kind: 'field', path: ['name'], direction: 'asc' }],
  },
  limit: 20,
  offset: 0,
});
```

Only selected fields are returned at runtime; the generic record type does not make unselected fields present. Filter equality shorthand such as `{ id: customerId }` is supported, but `sort: { name: 'asc' }` and nested operator-style filter shorthand are not. Use `RemoteFilterAst`, `RemoteSelectAst`, and `RemoteSortAst` from `@nocobase/api-client` when annotating stored AST values. If those types survive in a plugin's published declarations, give consumers a resolvable dependency contract.

`findMany()` returns a query that supports both awaiting an array and asynchronous iteration. `findOne()` resolves to a record or `undefined`, not `null`; `count()` returns a number. `exists()` returns a boolean when the Server explicitly exposes that action. Direct `api.request()` does not convert Builder callbacks; use the corresponding option builders first, or use `api.repository()`.

## Create, read, update, and delete

These are separate HTTP calls. Use them as an integration exercise in a test or a deliberately invoked workflow, not as a page mount side effect:

```ts
const created = await customers.createOne({
  values: {
    id: crypto.randomUUID(),
    name: 'Alice',
    company: 'Example Company',
    email: 'alice@example.test',
    status: 'lead',
  },
});

const customer = await customers.findOne({
  filter: { id: created.record.id },
});
if (!customer) {
  throw new Error('The created customer is no longer available');
}

const updated = await customers.updateOne({
  filter: { id: customer.id },
  values: { name: 'Alice Chen', status: 'active' },
});

const deleted = await customers.deleteOne({
  filter: { id: updated.record.id },
});
```

Create and update responses contain `record`, `createdTargets`, and an optional `version`. A successful delete has `deleted: true`. For a Collection configured with optimistic locking, pass the mutation result's `version` as `ifVersion` on the next update/delete and handle HTTP `409` with `error.reason` `VERSION_CONFLICT`; do not branch on the translated message. The current example plugin's orders demonstrate this contract, whereas its customers have no version column.

## Write relations deliberately

For the existing example's order Repository, connect a customer through the relationship rather than sending a UI object:

```ts
const order = await orders.createOne({
  values: {
    id: crypto.randomUUID(),
    number: 'SO-EXAMPLE-001',
    status: 'draft',
    customer: { connect: { id: customerId } },
  },
});
```

Here `orders` is the separately resolved `repositoryExampleOrders` Repository and `customerId` identifies an existing customer. Its exposure must explicitly allow the relation operation and nested target fields where applicable. This operation is not enabled by the customer-only exposure above. `disconnect` preserves the target record; `delete` deletes it; `set` is for to-many relations. One root write and its nested writes are transactional, but independent HTTP requests do not automatically share a transaction.

See the maintained relation mutation examples (`packages/examples/app-plugin-repository-example/client/relation-mutations.ts`) and HTTP tests (`packages/examples/app-plugin-repository-example/tests/routes.test.ts`) for relation policies, nested writes, version conflicts, and constraint failures.

## Test real HTTP behavior

The following test belongs in the existing Repository example plugin's `tests/` directory. It imports that package's real fixture (`packages/examples/app-plugin-repository-example/tests/helpers.ts`), which creates an in-memory SQLite database, runs migrations, binds the real `Auth` with a controlled session lookup, mounts the production contribution under `/main/api`, and connects an API Client to `router.fetch`. Creating this isolated transport is appropriate in a test; product components still use the host Client.

```ts
// @vitest-environment node
import { expect, it } from 'vitest';
import { createFixture } from './helpers.js';

it('protects customer writes and executes CRUD through the production router', async () => {
  const fixture = await createFixture();
  try {
    const anonymous = await fixture.router.request(
      '/main/api/repositoryExampleCustomers/createOne',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ values: { id: 'blocked' } }),
      },
    );
    expect(anonymous.status).toBe(401);

    const customers = fixture.api.repository('repositoryExampleCustomers');
    const created = await customers.createOne({
      values: {
        id: 'customer-roundtrip',
        name: 'Alice',
        company: 'Example Company',
        email: 'alice@example.test',
        status: 'lead',
      },
    });
    const updated = await customers.updateOne({
      filter: { id: created.record.id },
      values: { status: 'active' },
    });
    expect(updated.record.status).toBe('active');
    expect(await customers.count()).toBe(1);
    expect(
      await customers.deleteOne({ filter: { id: created.record.id } }),
    ).toEqual({ deleted: true });
    expect(
      await customers.findOne({ filter: { id: created.record.id } }),
    ).toBeUndefined();
  } finally {
    await fixture.database.destroy();
  }
});
```

For a new plugin, own the equivalent fixture and point it at that plugin's production contribution and migrations. Add denied fields/relations, unknown actions, maximum limits, and caller-specific policy cases for its actual API. The API Client guide (`packages/libs/api-client/README.md`) describes streaming, Builder positions, return values, and error handling in more detail.
