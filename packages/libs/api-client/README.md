# `@nocobase/api-client`

A lightweight HTTP and remote Repository client for NocoBase APIs. It does not
connect directly to a database and has no React or application-runtime
dependency.

```ts
import { createApiClient } from '@nocobase/api-client';

const api = createApiClient({ baseURL: '/api' });

const health = await api.request<{ ok: boolean }>({
  path: '/healthz',
});

await api.request({
  path: '/auth/sign-in/email',
  method: 'POST',
  json: { email, password },
});

const upload = new FormData();
upload.append('file', file);

await api.request({
  path: '/attachments/uploadOne',
  method: 'POST',
  body: upload,
});

const stream = await api.stream({
  path: `/aiEmployee/conversations/${encodeURIComponent(sessionId)}/send`,
  method: 'POST',
  json: {
    aiEmployee: 'atlas',
    messages: [{ role: 'user', content: { type: 'text', content: 'Hello' } }],
  },
});

const order = await api.repository<Order>('orders').findOne({
  filter: { id: 'order-1' },
});

const orders = await api.repository<Order>('orders').findMany();

for await (const order of api.repository<Order>('orders').findMany()) {
  console.log(order);
}
```

Use `json` for values that the client should serialize as JSON. Use `body` for
raw Fetch bodies such as `FormData`, `Blob`, and strings. The two options are
mutually exclusive. `request()` defaults to accepting JSON, while `stream()`
defaults to accepting server-sent events; explicit request headers override
both defaults.

Repository calls are encoded as `POST /{name}/{action}`, relative to the API
base URL. For example, `api.repository('salesOrders').findOne()` requests
`POST /api/salesOrders/findOne`. Exposure names are camelCase, which the server
enforces when it declares them. The server decides which repositories and actions
are exposed and remains responsible for authentication, authorization,
validation, and query limits.

`findMany()` is lazy and supports one consumption mode. Await it to request a
complete JSON array, or asynchronously iterate it to request framed NDJSON and
process records as they arrive. A query cannot be awaited and iterated, or be
iterated twice; create another query to execute it again.

## Repository input builders

Every remote Repository method accepts builders in its structured input
positions, alongside the existing JSON input forms. Parameters can mix forms
independently. Scalar options such as `limit`, `offset`, `direction`,
`ifVersion`, and field arrays such as `by` and `distinct` retain their usual
values.

```ts
const orders = api.repository<Order>('orders');

const query = orders.findMany({
  filter: (f) =>
    f.and([f.string('status').eq('paid'), f.number('amount').gte(100)]),
  select: (s) => s.fields('id', 'status', 'amount'),
  sort: (s) => s.field('amount').desc().nullsLast(),
  limit: 20,
});

const rows = await query;
```

Callbacks execute synchronously when the method is called, including for lazy
`findMany` queries. Their results and JSON inputs are snapshotted before HTTP
execution, so changing a captured variable or the input object afterward does
not change the request. Awaiting and streaming use the same snapshot.

### Complete options for `api.request`

Use the corresponding `build*Options` helper to construct a plain JSON options
object without sending a request:

```ts
import { buildFindManyOptions } from '@nocobase/api-client';

const options = buildFindManyOptions<Order>({
  filter: (f) => f.string('status').eq('paid'),
  select: (s) => s.fields('id', 'amount'),
  sort: (s) => s.field('amount').desc(),
  limit: 20,
});

const response = await api.request<{ data: Pick<Order, 'id' | 'amount'>[] }>({
  path: '/orders/findMany',
  method: 'POST',
  json: options,
});

// Built options can also be reused with Repository methods.
const rows = await api.repository<Order>('orders').findMany(options);
```

`api.request` retains the endpoint's response envelope; Repository methods
unwrap `{ data }`. The helpers only build input and do not add pagination
defaults or decide which actions a server exposes.

| Method      | Complete options helper | Builder positions                       |
| ----------- | ----------------------- | --------------------------------------- |
| `findMany`  | `buildFindManyOptions`  | `filter`, `select`, `sort`              |
| `findOne`   | `buildFindOneOptions`   | `filter`, `select`, `sort`              |
| `count`     | `buildCountOptions`     | `filter`                                |
| `exists`    | `buildExistsOptions`    | `filter`                                |
| `aggregate` | `buildAggregateOptions` | `filter`, `aggregate`                   |
| `groupBy`   | `buildGroupByOptions`   | `filter`, `aggregate`, `having`, `sort` |
| `createOne` | `buildCreateOneOptions` | `values`, `select`                      |
| `updateOne` | `buildUpdateOneOptions` | `filter`, `values`, `select`            |
| `deleteOne` | `buildDeleteOneOptions` | `filter`, `select`                      |

The `Remote*Options` types describe accepted input, including callbacks. The
corresponding `Remote*OptionsJson` types describe built output, without
callbacks. `count` and `exists` share `RemoteFilterOnlyOptionsJson`.

### Individual parameters

`buildFilter`, `buildSelect`, `buildSort`, and `buildAggregate` construct their
respective ASTs. Use them to store/reuse a parameter or send it to a custom
endpoint that accepts that AST:

```ts
import { buildFilter, buildAggregate } from '@nocobase/api-client';

await api.request({
  path: '/orders/aggregate',
  method: 'POST',
  json: {
    filter: buildFilter<Order>((f) => f.string('status').eq('paid')),
    aggregate: buildAggregate<Order>((a) => ({
      count: a.count(),
      total: a.sum('amount'),
    })),
  },
});
```

`buildFilter` also converts an equality shorthand such as `{ status: 'paid' }`
to a Filter AST. Options helpers preserve existing shorthand objects on the
wire. Nested select includes and `combine` branches recursively convert their
filter/sort callbacks; they do not need database metadata in the browser.

`api.request` and `api.stream` do not inspect arbitrary JSON fields for
callbacks. Explicitly build the parameters first. URL `query` values remain
scalars or arrays of scalars; when an endpoint expects an AST as a query-string
value, pass `JSON.stringify(buildFilter(...))` explicitly.

### Mutation values

Mutation methods accept ordinary values, a whole-values callback for
`variable`/`literal` expressions, and field callbacks for numeric updates or
relation operations. `buildCreateValues` and `buildUpdateValues` expose the
same conversion for individual values objects.

```ts
await orders.updateOne({
  filter: (f) => f.string('id').eq(orderId),
  values: (v) => ({
    status: v.literal('paid'),
    amount: (n) => n.increment(10),
    tasks: (r) =>
      r.update({
        filter: (f) => f.string('status').eq('pending'),
        values: { points: (n) => n.multiply(2) },
      }),
  }),
  select: (s) => s.fields('id', 'status', 'amount'),
});
```

The server still determines whether a field is numeric, a relation, or JSON
and validates allowed operations. Ordinary JSON values, including objects
with keys such as `increment` or `update`, stay data. Nested callbacks are
processed only in supported mutation operation positions, never inside
literal payloads. Variables are encoded as references; helpers do not supply
or authorize a server context, and the standard HTTP adapter does not accept
a client-provided `context`.

Relation `create` callbacks preserve `through` data and `clientKey`. A creation
with a client key uses the explicit JSON form below, which can also be sent
directly to servers supporting this input protocol:

```ts
{
  create: [{
    kind: 'relationCreate',
    version: 1,
    values: { title: 'New task' },
    clientKey: 'local-task',
  }],
}
```

Repository builders serialize valid `Date` instances as ISO strings and
`bigint` values as decimal strings. They reject circular data, non-finite
numbers, invalid callback results, and functions left in JSON data rather
than silently losing input during serialization. These conversion rules
apply to Repository builders; raw `api.request({ json })` keeps its normal
JSON serialization behavior.

AST contracts and builder implementations are shared with `@nocobase/db`
through the browser-compatible `@nocobase/repository-input` package. The
client does not import the database runtime, database drivers, or React.

## Aggregate and grouped queries

Enable `aggregate` and `groupBy` in the server's `defineRepositoryApiRoutes`
exposure before calling them. Both return promises and accept either JSON ASTs or synchronous builder
callbacks. Callbacks execute locally and only their JSON output crosses HTTP.
Database context remains a server concern.

```ts
const repository = api.repository<{ status: string; amount: number }>('orders');
const aggregate = {
  kind: 'aggregate',
  version: 1,
  items: [
    { kind: 'count', alias: 'count' },
    { kind: 'sum', field: 'amount', alias: 'total' },
    { kind: 'avg', field: 'amount', alias: 'average' },
    { kind: 'min', field: 'amount', alias: 'minimum' },
    { kind: 'max', field: 'amount', alias: 'maximum' },
  ],
} as const;
const totals = await repository.aggregate({
  filter: { status: 'paid' },
  aggregate,
});
const groups = await repository.groupBy({
  by: ['status'],
  aggregate,
  having: {
    kind: 'filter',
    version: 1,
    root: {
      kind: 'group',
      logic: 'and',
      items: [
        { kind: 'condition', path: ['count'], operator: '$gte', value: 2 },
      ],
    },
  },
  sort: {
    kind: 'sort',
    version: 1,
    items: [{ kind: 'field', path: ['total'], direction: 'desc' }],
  },
});
```

Requests use `POST /orders/aggregate` and `POST /orders/groupBy`; the client
unwraps `{ data }` into an aggregate object or array of group objects. Exported
contracts are `RemoteAggregateAst`, `RemoteAggregateOptions`,
`RemoteGroupByOptions`, and `RemoteAggregateResult`. Result aliases are dynamic.
COUNT (including the standalone `count()` method) returns a safe integer number; counts above Number.MAX_SAFE_INTEGER fail with INVALID_STORED_VALUE.
SUM/AVG of integer, BIGINT and DECIMAL fields preserve database-formatted strings;
FLOAT/DOUBLE SUM/AVG return numbers. MIN/MAX retain the field's
logical type (BIGINT string, integer number). An empty input set returns count
`0` and null for SUM/AVG/MIN/MAX; empty grouped
results are `[]`. BigInt results are serialized as decimal strings to avoid
precision loss, dates as ISO strings, and dialect-specific numeric strings are
preserved. These methods do not use `findMany` pagination or NDJSON streaming.

Authorization is server-only. Remote Repository options and their builders expose
neither `writePolicy` nor `policy`, and an HTTP request containing either is
rejected. Frontend code sends `values`; the server declares what may be written
in each exposure's `policy` in `defineRepositoryApiRoutes`, for example
`policy: { read: true, create: false, update: { scope: true, fields: ['name'] }, delete: false }`.
Every exposure declares one, and a node it does not grant is refused with 403.
