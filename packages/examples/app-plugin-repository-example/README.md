# Repository API example

A working Repository API plugin demonstrating `defineRepositoryApiRoutes`, array and streamed `findMany`, relationship selections and mutations, optimistic locking, atomic updates, and aggregate queries.

## Open the example

This workspace registers the plugin in `@nocobase/app-template-default`. `db apply` runs the application's pending migrations and then its seeds.

```bash
pnpm --filter @nocobase/app-template-default exec nocobase db apply
pnpm --filter @nocobase/app-template-default dev
```

Sign in and expand **CRM example** or **Orders example** in the sidebar. Each child menu opens its own page:

- **CRM example**: Customers (`/repository-example/crm`), Contacts (`/repository-example/crm/contacts`).
- **Orders example**: Orders (`/repository-example/orders`), Order items (`/repository-example/orders/items`), Products (`/repository-example/orders/products`).
- **Repository examples**: relationship writes (`/repository-example/relation-mutations`), `findMany` array/stream (`/repository-example/find-many`), atomic numeric updates (`/repository-example/atomic`), aggregate queries (`/repository-example/aggregate`), select combine (`/repository-example/select-combine`), and sorting (`/repository-example/sort`).

View details opens the child route `<list-path>/details/:recordId`, for example `/repository-example/crm/details/demo-customer-1`. Detail URLs load records directly, support refresh, show related records, and provide a Back to list action. Relation headings use singular labels for belongsTo and plural labels for hasMany. Related records link to their detail pages; customer cards show name, company and email, and foreign-key fields display the related name. New and Edit open a right-side drawer with focus management and Escape/Cancel dismissal. Relation and status fields use shadcn Select, with full-width triggers and readable selected labels. Successful saves close the drawer and refresh the list or current detail; errors keep the drawer and entered values visible.

The active child expands its parent group. Each page has a stable URL, so refresh and browser history retain the selected entity.

Paths are relative to the application's mount point. For an application mounted at `/main`, the CRM URL is `/main/repository-example/crm`.

Create a customer in CRM and products in Orders → Products. When creating an order, add item rows directly in the drawer: select a product, enter quantity, and adjust the automatically populated price if needed. Rows can be removed before saving; subtotals and the order total update immediately. A single `createOne` request writes the order and `items.create` rows atomically. Order details show product names, SKUs, quantities, snapshot prices, subtotals and the total, with links to product and item details. The separate Order items page remains available to manage existing items. The seed adds 4 customers, 5 contacts, 6 products, 4 orders and 8 order items. It covers every customer/order status and multiple related records; the paid order demonstrates a discounted price snapshot. The tables are isolated from the application's real customers and orders.

The seed uses fixed `demo-*` IDs, `DEMO-*` SKUs and `DEMO-SO-*` order numbers. The seed runner records completion and skips subsequent runs, so edits and deletions remain intact. If the seed is deliberately replayed without its history, it only inserts missing IDs and preserves existing records. Unique SKU/order-number collisions with another ID fail the entire transaction without leaving partial example data.

## Schema and relationships

| Logical collection / API name      | Fields                                                      | Relationships                          |
| ---------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `repositoryExampleCustomers`       | `id`, `name`, `company`, `email`, `status`                  | hasMany `contacts`, hasMany `orders`   |
| `repositoryExampleContacts`        | `id`, `name`, `email`, `phone`, `customerId`                | belongsTo `customer`                   |
| `repositoryExampleProducts`        | `id`, `name`, unique `sku`, `unitPriceCents`                | hasMany `items`                        |
| `repositoryExampleOrders`          | `id`, unique `number`, `status`, `customerId`, `version`    | belongsTo `customer`, hasMany `items`  |
| `repositoryExampleOrderItems`      | `id`, `orderId`, `productId`, `quantity`, `unitPriceCents`  | belongsTo `order`, belongsTo `product` |
| `repositoryExampleFindManyRecords` | `id`, unique `sequence`, `title`, `category`, `description` | —                                      |

The browser generates UUID IDs for new records; seeded examples use stable `demo-*` IDs. Monetary values use integer cents; each item stores its own unit price snapshot, so later product price changes do not rewrite existing orders. The displayed line total is quantity × unit price. Customer statuses are `lead`, `active`, `inactive`; order statuses are `draft`, `confirmed`, `paid`, `cancelled`.

The self-contained migration creates the tables, unique constraints, relationship metadata and foreign keys. The belongsTo side owns each physical foreign key and its supporting index; the inverse hasMany side uses `constraints(false)` to avoid duplicating them. Deleting a customer cascades its contacts; deleting an order cascades its items. Customers referenced by orders and products referenced by items cannot be deleted. Rollback drops the tables in reverse dependency order.

The relationship-write page uses six additional collections. Their logical names are deliberately prefixed so they do not collide with an application's own `users`, `projects`, `tasks`, `tags`, or join tables:

| Logical collection                         | Purpose                                     |
| ------------------------------------------ | ------------------------------------------- |
| `repositoryExampleRelationUsers`           | Owner and task-assignee targets             |
| `repositoryExampleRelationProjects`        | Root records with all four relation types   |
| `repositoryExampleRelationProjectProfiles` | Unique nullable project key for hasOne      |
| `repositoryExampleRelationTasks`           | Nullable project key for hasMany            |
| `repositoryExampleRelationTags`            | Shared belongsToMany targets                |
| `repositoryExampleRelationProjectTags`     | Join records with a writable `role` payload |

`projects.owner` is belongsTo, `projects.profile` is hasOne, `projects.tasks` is hasMany, and `projects.tags` is belongsToMany through the prefixed join collection. `tasks.assignee` adds one nested belongsTo. The seed supplies stable `project-1`, `project-other`, `user-1`, `user-2`, profile, task and tag records matching the relationship-write documentation's scenarios.

## Repository HTTP API

`server/routes/index.ts` explicitly exposes Repository actions for the five CRM/order repositories, the atomic counter and the relationship examples. Each request is JSON over `POST /api/<repository>:<action>` (with any application mount prefix). The relationship collections expose only `findMany`, `findOne`, `createOne` and `updateOne`, which are the actions used by that page.

| Action      | Visible example                                                         |
| ----------- | ----------------------------------------------------------------------- |
| `findMany`  | Table, text filter AST, sort AST, offset/limit pagination               |
| `findOne`   | View details / open editor, including related records with a select AST |
| `count`     | Filtered result count and pagination                                    |
| `exists`    | Look up by ID                                                           |
| `createOne` | New record, relationship `connect`                                      |
| `updateOne` | Edit record; orders send `ifVersion`                                    |
| `deleteOne` | Explicit deletion confirmation; orders send `ifVersion`                 |

Expand **Repository calls** to inspect the last seven request/result pairs. These are observational examples of the real API calls, not a second implementation of CRUD.

```ts
import { apiClientToken } from '@nocobase/app-client';

const api = app.services.resolve(apiClientToken);
const orders = api.repository('repositoryExampleOrders');
const created = await orders.createOne({
  values: {
    id: crypto.randomUUID(),
    number: 'SO-001',
    status: 'draft',
    customer: { connect: { id: customerId } },
  },
});
await orders.updateOne({
  filter: { id: created.record.id },
  values: { status: 'confirmed' },
  ifVersion: created.version,
});
```

See `client/model.ts` for the JSON select/filter ASTs and relationship mutation values. `client/pages/repository-page.tsx` drives the same seven actions for each entity. There are no handwritten CRUD HTTP handlers.

## Relationship writes

Open **Repository examples → Relationship writes** at `/repository-example/relation-mutations`. Seven independent cards demonstrate `create`, `connect`, `disconnect`, `set`, `update`, `upsert` and `delete`. Each card has its own relationship selector, preparation button, operation form and target table. Choose hasOne `profile`, hasMany `tasks` or belongsToMany `tags`; `set` is available only for the two to-many relationships.

Click **Prepare example** in a card to create a fresh project and four targets. The page does not write on initial load and does not require seeded records, but its database migrations must be applied. Each preparation uses new IDs, so cards never reuse shared or exclusive targets. Preparing again leaves previous example records in the database. Preparation spans multiple HTTP requests and is not one transaction; each individual root mutation is transactional.

- `create` accepts target fields and adds a new related record.
- `connect` offers existing unlinked targets; `disconnect` operates on current targets and leaves them in the target collection.
- `set` uses checkboxes to replace the current relationship set. Clear all boxes to submit an empty set.
- `update` edits a current target and pre-fills its values.
- `upsert` creates a target on the first run and can update that same target on subsequent runs. For to-many relations, select an existing related target or **New target**.
- `delete` removes the target record. Its destructive button and explanation distinguish it from unlinking.

Tag `create`, `connect` and `set` expose the `through.role` field. The table independently queries targets and shows both **Linked to this project** and **Target exists**, plus target fields, IDs and tag through roles. Deleted targets remain visible as absent rows, making the different effects of `disconnect`, `set` and `delete` observable. Refreshing a table does not repeat a mutation.

The form previews the request; a separate expandable panel shows the last executed request and response. Failed writes retain form values. If a write succeeds but reloading fails, the page reports that distinction and offers a read-only refresh. Request construction and execution live in `client/relation-lab.ts`, using only authenticated Repository actions. The explicit nested-write policies allow the demonstrated operations and fields; no example-specific Server handler exists.

Tests execute all 20 supported operation/relationship combinations through the real HTTP routes and SQLite without seeds. They also verify repeated upserts, empty sets, through fields, target lifetime, relation scope and disallowed fields. The earlier composite-workflow integration test remains as coverage for transactional rollback and multiple nested operations in one root write.

## findMany arrays and streams

Open **Repository examples → findMany: array and stream** at `/repository-example/find-many`. A dedicated migration creates `repositoryExampleFindManyRecords`; its seed inserts 24 deterministic records so ordering and completeness are easy to inspect.

Both panels create the same query with `limit: 24` and ascending `sequence` sorting. Only the way the returned query is consumed changes:

```ts
const repository = api.repository<FindManyRecord>(
  'repositoryExampleFindManyRecords',
);

const records = await repository.findMany(options);

for await (const record of repository.findMany(options)) {
  consume(record);
}
```

Awaiting uses `Accept: application/json` and resolves with the complete array. Async iteration uses `Accept: application/x-ndjson`; the client decodes framed records and yields each one in order. Each call creates a new query because a single query cannot mix the two consumption modes. The collection exposes only `findMany`, is limited to 100 records per request, and is protected by the same required-authentication middleware as the other examples.

## Atomic numeric updates

Open **Repository examples → Atomic numeric updates** at `/repository-example/atomic`. A separate migration creates `repositoryExampleAtomicCounters` (`id`, `name`, non-null integer `value`). A separate transactional seed inserts four stable records without overwriting existing IDs:

| Record        | Initial value | Example                                  |
| ------------- | ------------: | ---------------------------------------- |
| `demo-stock`  |           120 | Receive units; guarded stock deduction   |
| `demo-wallet` |         50000 | Top up or spend integer cents            |
| `demo-points` |           100 | Add points; multiply by two              |
| `demo-visits` |             0 | One increment; ten concurrent increments |

Apply application migrations and seeds after updating the plugin. An empty page explains this prerequisite and disables mutation controls until its records exist. Completed seeds are skipped, preserving edits.

The authenticated `defineRepositoryApiRoutes` declaration exposes this collection too. The page sends `updateOne` with `values: { value: { increment: amount } }`, `decrement`, or `multiply: 2`. It never calculates an absolute replacement value from a browser read. Guarded deductions include `value >= amount` in the same update filter as the ID; no match returns 404 and changes nothing. This protects these page actions, while the shared example API remains a general Repository demonstration.

The concurrency action sends ten independent increments and reports every result with `Promise.allSettled`. Each successful request commits independently; there is no automatic retry. The page reloads the database value even when some requests fail. Other signed-in users share these counters, so the displayed total can also include their updates. Operands are positive integers up to 1,000,000; balance values are cents.

Tests verify authentication, integer validation, concurrent increments without lost updates, competing deductions from the last unit, seed replay, and page operations through real HTTP and SQLite.

## Aggregate queries

Open **Repository examples → Aggregate queries** at `/repository-example/aggregate`. The page reuses the seeded orders, items, products and customers; no additional migration or seed is required.

- `aggregate`: item row count, summed quantity, average/minimum/maximum unit price in cents.
- Enum `groupBy`: order counts by status in a single query, preserving exact enum member identity.
- `groupBy`: items grouped by `productId`, with row count, summed quantity and average unit price, sorted by quantity descending. Product names, SKUs and detail links accompany each group.
- `having`: a minimum grouped quantity applies after aggregation, without changing the overall statistics.
- Relation aggregate selection: the first 50 customers by ID with their matching order count, including zero counts and customer detail links.

The status Select filters every panel, including items through `order.status`. Apply runs the query again; Repository calls shows the actual request and response. Empty sets return count 0 and NULL for SUM/AVG/MIN/MAX. Average price is the unweighted average of item unit prices, not revenue or a quantity-weighted average. Queries run separately, so concurrent edits may be observed between panels.

The page calls `api.repository(name).aggregate()` and `.groupBy()` directly through `defineRepositoryApiRoutes`. Both actions are explicitly enabled and guarded by the plugin's authentication middleware. They use POST requests with Aggregate, Filter and Sort JSON ASTs, matching the database Repository contract. The old example-specific GET aggregate endpoint has been removed. The HTTP adapter validates the envelope and Repository validates fields, aliases and expressions.

The complete client calls are in `client/aggregate.ts`. Product names are fetched in batches of 100 to respect the configured list limit. The request trace shows each actual action and its JSON AST.

```ts
const items = api.repository<Record<string, unknown>>(
  'repositoryExampleOrderItems',
);
const summary = await items.aggregate({
  aggregate: {
    kind: 'aggregate',
    version: 1,
    items: [
      { kind: 'count', alias: 'count' },
      { kind: 'sum', field: 'quantity', alias: 'quantity' },
      { kind: 'avg', field: 'unitPriceCents', alias: 'averagePrice' },
    ],
  },
});
const groups = await items.groupBy({
  by: ['productId'],
  aggregate: {
    kind: 'aggregate',
    version: 1,
    items: [{ kind: 'sum', field: 'quantity', alias: 'quantity' }],
  },
  having: {
    kind: 'filter',
    version: 1,
    root: {
      kind: 'group',
      logic: 'and',
      items: [
        { kind: 'condition', path: ['quantity'], operator: '$gte', value: 3 },
      ],
    },
  },
  sort: {
    kind: 'sort',
    version: 1,
    items: [{ kind: 'field', path: ['quantity'], direction: 'desc' }],
  },
});
```

Unmodified seed data yields 8 item rows, quantity 14, average price 14900 cents, minimum 5900 and maximum 32900. Selecting Paid yields 3 item rows and quantity 5; a grouped minimum of 2 retains Keyboard and Mouse. Tests verify these results through real HTTP/SQLite and page interactions, along with authentication, invalid input, empty sets, and failure recovery.

## Additional groupBy examples

The Aggregate page includes three additional interactive panels using the same
seed data and authenticated Repository HTTP actions:

| Panel                     | Group keys                    | Metrics and ordering                                                                   |
| ------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| Customer order ranking    | `customerId`                  | COUNT, sorted by count descending then customer ID                                     |
| Customer × order status   | `customerId`, `status`        | COUNT per combination, sorted by count descending then customer ID                     |
| Product × item unit price | `productId`, `unitPriceCents` | COUNT and SUM(quantity), sorted by quantity descending, product ID and price ascending |

The status Select filters source rows in all panels. **Minimum rows per group**
applies `HAVING count >= minimum` to these three panels; the existing grouped
quantity threshold still applies only to the original product summary. Customer
and product IDs are resolved to names with detail links, in batches of at most 100. Each panel exposes its actual request AST and raw groupBy result.

With unchanged seeds and minimum count 1, customer ranking contains 3 customers,
customer/status contains 4 groups, and product/price contains 7 groups. Ada has
2 orders overall but only 1 per status. Keyboard has separate groups at 11900
and 12900 cents. With minimum count 2, ranking retains Ada, customer/status is
empty, and product/price retains the USB-C Dock with 2 rows and quantity 2.
Selecting Paid with minimum count 2 yields no groups in these panels.

These examples demonstrate that WHERE filters before grouping, HAVING filters
after grouping, multiple keys identify a combination, and COUNT(rows) differs
from SUM(quantity). Orders without matches do not generate a group; this differs
from the customer relation-count panel, which also includes zero-order customers.
`client/group-by.ts` owns the calls and `client/components/group-by-examples.tsx`
renders the panels. No new schema or seed is needed for these examples.

## Access and limits

Every exposed endpoint installs the authentication plugin's `required()` middleware. This is an intentionally shared example workspace: **every signed-in user can read and modify all example records**. There is no tenant isolation or per-role authorization in this example. Client pages independently require sign-in. Middleware applies only to the declared endpoints and does not protect or interfere with unrelated routes.

`defineRepositoryApiRoutes` enforces its standard JSON validation and 1 MiB request limit. Lists allow at most 100 records per request; the table uses 10. Relationship selectors fetch subsequent pages instead of silently hiding records after the first 100. Unknown collections and actions are not exposed. Concurrent order edits return `409 VERSION_CONFLICT` and the page asks the user to reload; it never silently retries and overwrites another update.

The data endpoints need no `describeRoute()`: the application's API document, read at `/api/swagger/docs` with a session or an API key, lists each exposure's actions with request and record schemas derived from its Collection and Policy. A hand-written route next to them declares itself as the routes example shows.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-repository-example check
```

Tests run a real SQLite migration and rollback, inspect physical schema and relationship metadata, invoke CRUD, relationship mutations and aggregate/groupBy actions through the HTTP client, verify all authentication boundaries, relation scope, rollback, target lifetime, constraints and version conflicts, and exercise browser pages against the same real HTTP/SQLite fixture. Authentication sessions are stubbed in those fixtures; the real authentication middleware is executed.

The plugin uses shared development presets and plugin-local shadcn primitives. Its styles use the host's theme tokens and are included by the Default Template's enabled-plugin Tailwind scan.

Repository route actions use configuration objects (`findMany: { maxLimit: 100 }`,
`findOne: {}`) and say only which endpoints exist. What they may do is the
exposure's `policy`, which is required: a Repository Policy with `read`,
`create`, `update` and `delete`, written out or built with
`buildRepositoryPolicy`, where a node never mentioned is denied. Nested task
create/update/upsert branches have separate field rules; task creation
explicitly permits `assignee.connect`. Many-to-many tag operations permit only
the `role` through field. Prefer relation `connect` when the Policy grants it;
direct foreign-key fields are not implicitly writable. Keep Policies on the
server and never include them in client request options — a request carrying
`policy` or `scope` is rejected. New demos need their own Policy and route
tests. Authentication guards every endpoint. Internal `db.repository` calls bind
no Policy, so a custom HTTP handler is responsible for its own.

## Select combine examples

Open **Repository examples → Select combine** at `/repository-example/select-combine`. Each card shows its JSON select AST before execution and runs a single read-only `api.repository(name).findMany(options)` request. Results display a table with response field paths as column headings, scalar aggregates as cells, and record-array branches as nested tables within their parent row. NULL, zero and empty relations remain distinct. The original JSON is available in a collapsible panel. Root queries show the first 10 records by ID; record branches have explicit per-parent limits and stable ID sorting.

- **Order preview and independent branches:** one order, total count, paid count and cancelled records per customer. A branch-local limit does not truncate sibling counts. Empty relations return empty lists and zero counts.
- **Item records and multiple aggregates:** two item rows with COUNT, SUM quantity and AVG/MIN/MAX snapshot unit prices (cents). AVG is unweighted; empty sums and price metrics are null.
- **Nested orders, items and products:** an orders combine contains another items combine; item preview rows include product names.
- **Shared filter and branch-local filters:** all task branches inherit `status = draft`; the unassigned branch adds `assigneeId = null`, while `count(assigneeId)` counts non-null values.
- **Many-to-many tag combinations:** linked tag records, total count and filtered Documentation count remain scoped to each project.

The examples reuse the existing CRM and relationship seeds without writing records. Run application migrations and seeds if needed. Changes made on other example pages are reflected on the next query. See `client/select-combine.ts` for the request definitions.

## Sort examples

Open **Repository examples → Sort examples** at `/repository-example/sort`. The page follows the Repository sort contract documented in `packages/libs/db/docs/zh-CN/repository/sort.md`. Each card shows a builder snippet and the actual serialized Repository HTTP request, then renders the response in a table without client-side reordering. Raw JSON remains available in a collapsible panel.

The 15 read-only examples cover:

- Default primary-key ascending order, single-field price ascending/descending, and quantity/price priority with automatic ID tie-breaks.
- Explicit NULL-first and NULL-last order on nullable assignee IDs, plus a to-one `assignee.name` sort with a separate include returning names.
- Order-count ranking with zero-order customers, alongside a filtered paid-order count demonstrating that select filters do not change the sort aggregate scope.
- Relation SUM, AVG, MIN and MAX of product item quantities, with explicit select aggregates and nested item previews. Empty relations sort as 0 for count/sum and NULL for avg/min/max; selected SUM remains NULL for an empty relation.
- Local order-number sorting inside each customer include without changing root order.
- Two intentional `INVALID_SORT` responses: duplicate field targets and direct traversal through a to-many field path. Expected validation errors are distinguished from unexpected request failures.

Root queries return at most 10 records; relation previews have their own limits. Reuse the existing CRM and relationship seeds; no new migration, seed, endpoint or query syntax is introduced. Seeded data demonstrates ties, nullable assignees and empty customer orders. Empty product-item aggregates are additionally covered with isolated test records. Changes on other example pages are reflected when queries run again.

`client/sort.ts` owns the builder definitions. `sortExampleRequest()` uses the HTTP client's public serializer, and integration tests verify that each displayed AST produces the same results as its builder. Cursor, distinct, unsupported scalar types and to-one include restrictions are explained on the page; their complete behavior remains documented in the database package.

## Client navigation

`client/routes.ts` owns the API examples, CRM, and Orders menu groups through `navigation` and pathless route groups. Each page keeps its existing URL and lazy loader. Detail routes omit `navigation`. The Client ServiceProvider retains only the CRUD list/show resource mappings; Refine resources do not define the application menu.
