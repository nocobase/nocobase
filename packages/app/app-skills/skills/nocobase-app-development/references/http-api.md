# HTTP API design

Every route under `/api` follows these rules, whether the application or a plugin owns it. They are Google's API design guidelines ([aip.dev](https://google.aip.dev)) with one change: a custom method is separated by a slash, `/apps/{appId}/deploy`, not by Google's colon, `/apps/{appId}:deploy`. Root routes (`defineRootRoutes()`) answer whatever their protocol requires, such as a payment provider's webhook, and are not bound by them. A few `/api` routes keep their own shape; they are listed at the end.

See [server routes](server-routes.md) for mounting, authentication and authorization.

## URLs

- **Segments are camelCase.** `/apiKeys`, `/permissionSets`, never `/api-keys` or `/api_keys`. Collections are plural nouns.
- **A plugin's routes start with its namespace:** the package name without `app-plugin-`, in camelCase, in its singular or its plural form, whichever reads as the plugin's main resource. Every resource of the plugin lives under that one namespace. The application's own routes have no namespace: `/orders`.
- **When the main resource has the plugin's own name, the segment appears once.** The users plugin lists users at `/users` and disables one at `/users/{userId}/disable`, never `/users/users`. The workflow plugin's workflows are `/workflows` and `/workflows/{workflowId}/enable`, and its other resources nest under the same word: `/workflows/runs`, `/workflows/runs/{runId}/nodeRuns`.
- **When the resource word differs from the plugin's, the namespace comes first.** The scheduler plugin lists schedules at `/scheduler/schedules`. `@nocobase/app-plugin-notification-in-app` owns `/notificationInApp/...`.
- **A plugin mounted through another plugin's dispatcher keeps the host's namespace.** The authorization rule plugins answer under `/authorization/defaultAccess`, `/authorization/sharingRules` and `/authorization/restrictionRules`, because the authorization plugin owns `/authorization` and dispatches to them. Their errors use the host's domain too.
- **`/swagger`, `/auth` and `/healthz` are reserved** for the generated API documentation, Better Auth and the health check.
- **Fixed segments go before path parameters.** Hono matches in registration order and the first match wins without warning, so register `/workflows/runs` before `/workflows/:workflowId`. A user-chosen id must then never equal a fixed sibling segment: reject it when the resource is created, with `400 INVALID_ARGUMENT` and a field violation. An AI employee named `roster` would otherwise be unreachable behind `/aiEmployees/roster`.
- **Two routes with the same method and path fail application start.** Hono would otherwise run only the first; parameter names do not distinguish routes, so `/orders/:id` and `/orders/:orderId` are the same route, while `/orders/:orderId` and `/orders/archived` are not.
- **The client encodes ids.** An id containing `/` or `:` reaches the route encoded and arrives decoded in `context.req.param()`.

## Standard methods

| Operation                         | Method   | Path                       | Success                        |
| --------------------------------- | -------- | -------------------------- | ------------------------------ |
| List                              | `GET`    | `/orders`                  | `200 { data: [], meta }`       |
| Get one                           | `GET`    | `/orders/{orderId}`        | `200 { data }`                 |
| Create                            | `POST`   | `/orders`                  | `201 { data }`                 |
| Update some fields                | `PATCH`  | `/orders/{orderId}`        | `200 { data }`                 |
| Replace a singleton configuration | `PUT`    | `/orders/{orderId}/config` | `200 { data }`                 |
| Delete                            | `DELETE` | `/orders/{orderId}`        | `204`, no body                 |
| Custom method on one resource     | `POST`   | `/orders/{orderId}/cancel` | `200 { data }`, `202` or `204` |
| Custom method on a collection     | `POST`   | `/orders/archiveCompleted` | `200 { data }`, `202` or `204` |

`GET` never changes state: browsers prefetch, crawlers follow links and caches replay requests without the user asking. Marking a message read when a list is opened is a separate `POST`. That includes side effects nobody asked for: a `GET` does not delete expired rows or rewrite the session or its cookies on the way. Cleanup belongs to the writers that make data stale, or to a scheduled job. `DELETE` carries no body; a confirmation is a query parameter, `DELETE /users/5?confirm=true`. A delete whose work continues after the response may answer `202`.

## Custom methods

Use one only when no standard method expresses the operation without changing its meaning: deploy, roll back, enable, disable, send, copy. An operation that is a field update is a `PATCH`.

The method follows the resource it acts on: `/{collection}/{id}/{verb}` for one resource, `/{collection}/{verb}` for a whole collection, and `/{namespace}/{verbNoun}` for a computation on no stored resource: a plugin whose namespace is `translation` serves `/translation/translateText`, while an application's own computation has no namespace and is the verbNoun alone, `/translateText`. It is `POST` when it changes anything, and `GET` only when it is a pure read whose input fits in the query string.

| Rule                                                                                  | Right                                  | Wrong                       |
| ------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------- |
| A verb or verb + noun, camelCase                                                      | `/deploy`, `/markRead`, `/batchDelete` | `/deployment`, `/mark-read` |
| Verbs act, plural nouns are sub-resources                                             | `/users/5/activate`, `/users/5/roles`  | `/users/5/activation`       |
| Not a standard verb: `get`, `list`, `create`, `update` and `delete` are methods above | `GET /orders/7`                        | `/getDetails`, `/listAll`   |
| No prepositions; conditions are parameters                                            | `/send` with `{ userId }`              | `/sendToUser`               |
| No `Async`; a long operation returns a resource whose progress can be read            | `/deploy` returning the deployment     | `/deployAsync`              |
| Paired operations take paired verbs                                                   | `/enable` and `/disable`               | `/enable` and `/turnOff`    |

A custom method answers `200 { data }` when it has a result, `202` when the work continues asynchronously, and `204` with no body when there is nothing to return.

One operation has one URL across the whole system. Enabling a workflow is `POST /workflows/{workflowId}/enable` and nothing else.

## Responses

Every successful JSON response is `{ data }`; a list is `{ data: [...], meta }`. Never answer a bare array or object, and never put the payload beside `data`.

There are two pagination styles, and a list uses one of them:

- **Cursor**, for feeds and external callers: request `pageSize` and `pageToken`; `meta` carries `nextPageToken`, absent on the last page. The token is opaque — the server builds it, the client sends it back unchanged. These are the names Google's AIP-158 uses.
- **Page number**, for administrative tables: request `page` and `pageSize`; `meta` carries `page`, `pageSize` and `total`.

`pageSize` defaults to 20 and is capped at 100; a route that needs a larger cap keeps it and says why in a comment. Search is `q`, ordering is `orderBy`.

A bounded configuration list, such as providers, roles, templates or catalogs, may skip paging, but it still answers `{ data, meta }` with at least `meta.total`. Every other list pages. `meta` may carry fields beyond the standard ones when a list has more to say about itself.

Data formats:

- Ids are strings, in responses and in inputs alike. Snowflake ids exceed `Number.MAX_SAFE_INTEGER`, and a JavaScript client silently rounds them as numbers.
- Times are RFC 3339 strings, such as `2026-10-04T08:00:00.000Z`.
- Booleans are `true` and `false`, never `0`, `1` or a string.
- Field names are camelCase.

## Errors

Throw `ApiError` from `@nocobase/app-server/router`; the application renders it. Do not write an error body by hand.

```ts
import { ApiError } from '@nocobase/app-server/router';

throw new ApiError({
  status: 'NOT_FOUND',
  reason: 'ORDER_NOT_FOUND',
  domain: 'orders',
  message: `Order ${orderId} was not found.`,
});
```

Every failed `/api` response then has this body, with the same `requestId` in the `x-request-id` response header:

```json
{
  "error": {
    "code": 404,
    "status": "NOT_FOUND",
    "reason": "ORDER_NOT_FOUND",
    "domain": "orders",
    "message": "Order 42 was not found.",
    "requestId": "7f1c9a3e-…"
  }
}
```

- **`status`** is one of a fixed set, and decides the HTTP status. Pick the one that matches:

  | `status`              | HTTP | Use for                                                   |
  | --------------------- | ---- | --------------------------------------------------------- |
  | `INVALID_ARGUMENT`    | 400  | The request itself is malformed or a field is invalid     |
  | `FAILED_PRECONDITION` | 400  | The request is valid, but the resource's state forbids it |
  | `UNAUTHENTICATED`     | 401  | No valid session or API key                               |
  | `PERMISSION_DENIED`   | 403  | Not allowed                                               |
  | `NOT_FOUND`           | 404  | Allowed, but the resource does not exist                  |
  | `ALREADY_EXISTS`      | 409  | Creating something that already exists                    |
  | `ABORTED`             | 409  | A concurrent change won, such as a version conflict       |
  | `RESOURCE_EXHAUSTED`  | 429  | A rate limit or quota                                     |
  | `INTERNAL`            | 500  | Never thrown on purpose; the application answers it       |
  | `UNAVAILABLE`         | 503  | A dependency is down; retrying later may succeed          |

  Two HTTP statuses exist outside this table, both as an `INVALID_ARGUMENT` that passes `httpStatus`: `413` for a request body over a size limit the route sets or the application's `api.bodyLimit` and `415` for an unsupported request content type. Nothing else overrides the status, and neither covers anything else: a generated output that grows too large is `400 FAILED_PRECONDITION`, and a file with the wrong extension is `400 INVALID_ARGUMENT`. There is no `422`: an invalid request is `INVALID_ARGUMENT` and a valid one the state forbids is `FAILED_PRECONDITION`, both `400`. There is no `502`: a failing upstream is `503 UNAVAILABLE`.

- **`reason`** is what clients branch on: UPPER_SNAKE_CASE, unique within its domain, stable once released. A client never parses `message`.
- **`domain`** is the namespace of whoever defined the reason: the plugin namespace, or the application's name for its own routes. The framework uses `app`. A plugin has one domain even when it serves several URL prefixes: every AI employee error is `aiEmployees`, including those under `/aiEmployee/...`, and every AI knowledge base error is `aiKnowledgeBases`. An error passed through from another plugin keeps the domain of the plugin that defined its reason, so the users plugin passing on `LAST_ASSIGNMENT` answers with domain `authorization`.
- **`message`** is an English sentence for developers. It is never shown to users.
- **`localizedMessage`**, `{ locale, message }`, is optional user-facing text the handler has already translated with the request's i18n.
- **`fieldViolations`**, `[{ field, description }]`, names the invalid fields of an `INVALID_ARGUMENT`.
- **`metadata`** carries further machine-readable facts about this occurrence.

Which resource is missing decides the status:

- **The resource the URL names does not exist:** `404 NOT_FOUND`. `PATCH /orders/42` for an order that is not there is a 404, never a 400 or a 500.
- **A resource the body or query refers to does not exist:** `400 INVALID_ARGUMENT`, with a `fieldViolations` entry naming the field. `POST /orders` with an unknown `customerId` is a bad request, not a missing order.
- **Permission comes before existence:** a caller who may not see a resource gets `403` whether it exists or not, and `404` only once allowed. Otherwise the difference leaks which ids exist.

Permission also comes before input validation. Put authorization in middleware ahead of `validator()`, so an unauthorized caller learns nothing about the input a route expects, and never write anything, a stored record or an uploaded file, before the permission check has passed.

The application handles everything a route does not:

- An unexpected error becomes `500 INTERNAL` with reason `INTERNAL_ERROR` and nothing about its cause; the stack goes to the request log.
- Hono's `HTTPException`, and an error carrying a 4xx `status` such as `AuthorizationDeniedError`, keep their status.
- A Repository error carries its own `status`, which `repositoryErrorStatuses` in `@nocobase/db` assigns to every code. One the caller can act on keeps its code as `reason` with domain `app`, its `path` and `details` in `metadata`, and, when the input is invalid, its path as a field violation: a refused write is `403`, a missing record `404`, a version conflict `409`, invalid input or a missing relation target the body names `400`. One whose status is `INTERNAL`, the server's own fault such as an invalid Policy, is an opaque `500`. A route that calls a Repository lets these errors propagate instead of translating them.
- An unknown `/api` path is `404 NOT_FOUND` with reason `ROUTE_NOT_FOUND`, never the application page.
- `apiErrorHandler(error, context)` is the only error API a plugin uses. A route's own `onError` still runs first. Use one only to turn the plugin's own domain errors into `ApiError`, then hand everything else to `apiErrorHandler` from `@nocobase/app-server/router`, which renders what the framework recognizes and rethrows the rest: `router.onError((error, context) => apiErrorHandler(error instanceof OrderError ? toOrderApiError(error) : error, context))`. A router with no domain errors of its own that is also tested on a bare Hono uses `router.onError(apiErrorHandler)`.

## Input

Validate every input before using it — path parameters, query parameters and the JSON body — with a zod schema, through `apiValidator(target, schema)` from `@nocobase/app-server/router`. An invalid request is answered `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` and a field violation for each problem, before the handler runs. The handler reads only `context.req.valid(...)`, never `context.req.json()` or `context.req.query()`. `apiValidator()` also declares the schema in the [API documentation](#api-documentation), so every route declares itself with `describeRoute()` in the same place.

```ts
// server/routes/schemas.ts
import { z } from 'zod';

import type { OrderView } from '../providers/orders.js';

export const OrderParams = z.object({ orderId: z.string() });
export const CancelOrderInput = z.strictObject({
  reason: z
    .string()
    .min(1)
    .meta({ description: 'Why the order is cancelled.' }),
});
// Typed against what the service returns, so the documented response cannot drift from the real one.
export const Order: z.ZodType<OrderView> = z
  .object({ id: z.string(), status: z.enum(['open', 'cancelled']) })
  .meta({ ref: 'Order' });
```

```ts
// server/routes/orders.ts
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
} from '@nocobase/app-server/router';

import { CancelOrderInput, Order, OrderParams } from './schemas.js';

router.post(
  '/orders/:orderId/cancel',
  auth.required(),
  // Permission middleware ahead of the declaration and the validators: a caller without it gets 403.
  ordersAccess('cancel'),
  describeRoute({
    tags: ['Orders'],
    summary: 'Cancel an order',
    operationId: 'cancelOrder',
    responses: {
      '200': dataResponse(Order, 'The cancelled order.'),
      // 401, 403 and 500. The validators below add the 400 for invalid input.
      ...apiErrorResponses,
      // A 400 for another reason than invalid input is listed by the route.
      '400': apiErrorResponse(
        400,
        'The order is already cancelled (`ORDER_NOT_OPEN`).',
      ),
      '404': apiErrorResponse(404),
    },
  }),
  apiValidator('param', OrderParams),
  apiValidator('json', CancelOrderInput),
  async (context) => {
    const { orderId } = context.req.valid('param');
    const input = context.req.valid('json');
    return context.json({ data: await orders.cancel(orderId, input) });
  },
);
```

`parseApiInput()` inside Hono's `validator()` answers the same error but declares nothing in the document. It is superseded: a route still using it keeps working until it is migrated, and new code uses `apiValidator()`.

| Input           | Schema           | An unknown field                        |
| --------------- | ---------------- | --------------------------------------- |
| JSON body       | `z.strictObject` | Rejected with `400`, naming the field   |
| Query string    | `z.object`       | Dropped; proxies and libraries add some |
| Path parameters | `z.object`       | Cannot occur                            |

A strict body catches a misspelled field instead of silently ignoring it. So a client sends only the fields it changes, never a whole record read back from the server. Derive the service's types with `z.infer` instead of writing a second `interface`.

Field types: ids are `z.string()`, times `z.iso.datetime()`, booleans `z.boolean()`, enumerations `z.enum([...])`. "May be omitted" is `.optional()` and "may be null" is `.nullable()`; do not use one for the other. Never use `z.any()`; use `z.unknown()` only for a value that is genuinely free-form, such as a user-defined JSON payload, with a comment saying why it cannot be described precisely.

Put the schemas in the plugin's `server/routes/schemas.ts`, or a `schemas/` directory once there are many.

A binary or multipart body, such as an upload, has no JSON schema to validate. Validate its path parameters, query and headers with `apiValidator()` as above, and the body in code before using it, answering `413` or `415` as `INVALID_ARGUMENT` with `httpStatus` when it is too large or of the wrong type.

A size limit on the request body is optional. Set one on a route that needs it, such as an upload or a route whose input should stay small, with Hono's `bodyLimit`, and answer an oversized body in the standard shape:

```ts
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import { bodyLimit } from 'hono/body-limit';

router.post(
  '/orders/:orderId/attachments',
  auth.required(),
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (context) =>
      apiErrorHandler(
        new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'BODY_TOO_LARGE',
          domain: 'orders',
          message: 'The request body exceeds 10 MiB.',
          httpStatus: 413,
        }),
        context,
      ),
  }),
  // validators and handler
);
```

## API documentation

The application generates an OpenAPI 3.1 document from its routes and serves it below its base path: `GET <APP_BASE_PATH>/api/swagger` is the JSON document and `GET <APP_BASE_PATH>/api/swagger/docs` is Swagger UI. The Swagger UI files ship with `@nocobase/app-server`; nothing is loaded from a CDN.

### Reading the document

Open `<origin><APP_BASE_PATH>/api/swagger/docs` in a browser where you are signed in, such as `http://127.0.0.1:13000/main/api/swagger/docs` for a local application at the default `/main`. Swagger UI sends the session cookie with every request it makes, so "Try it out" acts as you. To act as an API key instead, enter it under "Authorize"; the page keeps it across reloads.

A script or an agent reads the JSON document with an API key in the `x-api-key` header:

```bash
curl -H "x-api-key: <key>" http://127.0.0.1:13000/main/api/swagger
```

`/main` is the application's `APP_BASE_PATH`; an application mounted at `/crm` serves `/crm/api/swagger`, and one mounted at the origin root serves `/api/swagger`. A user creates an API key on the API keys settings page, `<APP_BASE_PATH>/settings/api-keys`, and the key acts as that user; the `nocobase-app-plugin-api-keys` Skill describes the plugin and its configuration.

Only a request one of the registered access checks allows may read either route: the authentication plugin allows a signed-in session and the API keys plugin a valid API key. Anything else is answered `401` with reason `API_DOCS_UNAUTHENTICATED`. While no access check is registered, as in an application without the authentication plugin, both routes answer `404 ROUTE_NOT_FOUND`: an application that cannot tell who is asking does not publish its API. There is no setting that makes the documentation public.

**An agent working on an application learns its endpoints from this document** rather than from route sources: it lists every route the application and its installed plugins serve, with their parameters, bodies, responses, error statuses and the credentials they need, including the data endpoints and Better Auth's `/api/auth/...` endpoints. Fetch the JSON with an API key, find the operations by `tags` or `operationId`, and read the source only when the document does not answer the question. The document reflects the running application, so fetch it again after adding a plugin or changing a Collection.

A plugin can add its own access check through `apiDocsToken`: `container.resolve(apiDocsToken).addAccess({ name, check: (context) => boolean })`. Checks are alternatives; a check that answers `true` lets the request read the documentation, and one that throws an `ApiError` answers with that error.

### Declaring a route

Every hand-written `/api` route declares itself with `describeRoute()` from `@nocobase/app-server/router`, as in the example above, after its authentication and permission middleware and before its `apiValidator()`s. A route that declares nothing is a defect the API check reports by name.

- **`tags`**: the plugin name in PascalCase, such as `Hub`, `Users` or `AiEmployee`. The application's own routes tag the resource, such as `Orders`.
- **`summary`**: an English verb phrase, such as `Deploy an app`.
- **`operationId`**: the namespace, a verb and the resource in camelCase, unique across the application, such as `hubDeployApp`; the application's own routes have no namespace, `cancelOrder`.
- **`description`**: what a caller cannot read from the schemas, such as the permission a route requires or which credential it expects. A credential that is not one of the document's security schemes is described here and only here, as the Hub's routes say which ones also accept a Hub publishing key in `Authorization: Bearer hub_app_…`.
- **Inputs**: `apiValidator()` for every path, query, header and JSON input, which documents the parameters and the body.
- **Responses**: `dataResponse(schema)` for `{ data }`, `listResponse(itemSchema, metaSchema?)` for `{ data, meta }`, `emptyResponse()` for a `204`, and the standard error body through `apiErrorResponse(status)` or `apiErrorResponse(409, 'When …')`. Do not list `400` for input validation: a route that uses `apiValidator` gets the `400` automatically. List `400` yourself only for another reason, such as a failed precondition. `apiErrorResponses` is `401`, `403` and `500`, for an authenticated route with a permission check; otherwise list each status the route can return with `apiErrorResponse(code)`.
- **Security**: a route a caller reaches without a credential, such as a status probe or the locales the sign-in page reads, declares `security: []`. Every other route inherits the document's top-level requirement, a session cookie (`cookieAuth`) or an API key in `x-api-key` (`apiKeyAuth`), which the authentication and API keys plugins contribute.
- **Schemas** live in the plugin's `server/routes/schemas.ts`. A schema several routes share carries `.meta({ ref: '<PluginName><Thing>' })`, such as `HubDeployment`, and becomes a named component; public fields carry `.meta({ description })`, which stays next to the `$ref` when the field's schema is a shared one. A response object is documented open, so adding a field later is not a breaking change, unless its schema is `z.strictObject()`; a JSON body validated with `z.strictObject()` is documented closed. Recursive schemas such as `z.json()` need no workaround: they become components, named by their `ref` when they declare one.
- **Response schemas describe what the handler returns.** Read the handler and the service it calls rather than guessing, and annotate the schema with the service's view type, `export const OrderSchema: z.ZodType<OrderView> = z.object({ ... })`, so that a response and its documentation cannot drift apart without failing `typecheck`.

Import all of these from `@nocobase/app-server/router`, never from `hono-openapi`: the declarations are attached to middleware under a symbol that module owns, and only the application's copy generates the document. A plugin that declares `hono-openapi` fails `pnpm peers:check`.

A route that is not a contract for external callers declares `describeRoute({ hide: true })` with a one-line comment saying why. Only these are hidden:

- (a) routes that serve the application's own shell or build: client bootstrap and configuration, locale bundles, artifact and asset serving, development-only routes;
- (b) browser-only flows a script cannot meaningfully call: OAuth redirects and callbacks, cookie and session handshakes;
- (c) the documentation routes themselves;
- (d) transports that are not HTTP request and response, such as a WebSocket upgrade;
- (e) a fallback router a plugin registers only while it is unconfigured, which answers every path with `503` until the plugin is set up and is replaced by the real routes afterwards.

Everything an external caller — a script, an integration, an agent with an API key — may rely on is documented, admin and settings routes included.

### Command-line hints

The document is also the application's command line: `GET <APP_BASE_PATH>/api/cli/manifest` answers every documented operation as a command for a CLI client, once a plugin tells the application who calls (the agents plugin does, for a person and for an agent's run). A command's name comes from its tag, path and method (`GET /api/orders` → `orders list`, `GET /api/orders/{orderId}` → `orders get`, `POST` → `create`, `PATCH` → `update`, `DELETE` → `delete`, `POST /api/orders/{orderId}/cancel` → `orders cancel`), and its arguments and flags from the route's parameters and body. A route refines that with `cliRoute()` from `@nocobase/app-server/router`, spread into `describeRoute()`:

```ts
describeRoute({
  tags,
  summary: 'Cancel an order',
  operationId: 'cancelOrder',
  ...cliRoute({
    command: 'order cancel',
    flags: { orderId: { name: 'order' }, reason: { contentFile: true } },
    confirm: 'Cancel the order?',
    action: 'shop.orders/cancel',
  }),
  responses: { 200: dataResponse(OrderSchema), ...apiErrorResponses },
});
```

`command` names it; `args` lists the fields given as positional arguments (the path parameters by default); `flags` renames a field (`name`), gives it an `alias`, reads it from a file (`contentFile`; a JSON field's file is parsed as JSON), fills it with `--from-env` from the caller's environment variable named by another field (`fromEnv: 'name'`, for a secret that should not sit on the command line), defaults it from the caller's environment when it is left out (`env`: variable names such as `['GITHUB_REPOSITORY', 'CI_PROJECT_PATH']`, or `{ file, path }` for a field of the JSON file a variable names, such as `{ file: 'GITHUB_EVENT_PATH', path: 'pull_request.head.sha' }`; the first found wins, and a flag given on the line always wins, so a CI step names only what CI cannot tell), asks for it (`prompt`) or hides it; `bodyFile` lets a JSON file be the body; `uploads` uploads files to another route first and sends their ids; `ticketUpload` streams one file to the upload ticket the route answers, so a large file never passes through the request; `changedFiles` sends, as `multipart/form-data` parts beside the fields, the files of a directory on the caller's machine that differ from the manifest it holds (the route accepts JSON as well, for a call without the flag); `columns` picks a list's table columns (paths such as `owner.name`); `confirm` asks before running; `examples` and `identities` (`person`, `run`) speak for themselves; and `action` names the business action a caller must hold to be offered it. `cliRoute(false)` keeps a route off the command line; an application keeps whole areas off it, such as the back-office routes of a plugin it does not mount, with `exclude({ tags, paths, operationIds })` on `cliToken`. A route an agent's run may call lists its credential in its `security`, as an application's do with `runToken`.

A streaming route documents its media type, `text/event-stream` or `application/x-ndjson`, with a description of its frame format, and lists the errors it answers before the stream opens like any other route.

### What is documented without a declaration

Data endpoints are documented by the framework: each action of each exposure gets its operation, with record and `values` schemas expanded field by field from the Collection, a filter schema listing each field's operators and the shared `RepositoryFilter` grammar. Fields the exposure's fixed Policy forbids are left out; an exposure whose Policy depends on the caller documents every field with a note. A field the exposure adds to every record it returns without the Collection having it, such as the file plugin's `contentUrl`, is declared in the exposure's `computedFields: { name: schema }`, which only documents it — read-only in the record schema, never in `values`, `filter` or `sort` — and a name the Collection also has fails when the routes are created.

Settings routes behind the `/api/authorization` dispatcher are registered as `authz.routes.add(path, createRouteHandler(router))`, with `createRouteHandler` from `@nocobase/app-plugin-authorization/server/extension`, and each route of `router` declares itself with `describeRoute()`. Routes registered this way are documented automatically at their full `/api/authorization/...` path and checked like any other route. A plain function passed to `authz.routes.add` has no routes to read: the authorization plugin registers it as an undeclared route, logs a warning, and `findUndeclaredApiRoutes(app)` reports it.

The authorization plugin does this through a mechanism any plugin can use. A plugin that serves routes through a runtime dispatcher — a catch-all route that hands each request to a router chosen at request time — is invisible to the document generator, so it registers each router it forwards to with `container.resolve(apiDocsToken).addApiRouter({ owner, prefix, scope?, router })`, where `prefix` is the full path the router's own paths follow, such as `/api/authorization`. When the dispatcher forwards only part of `prefix` to the router, `scope` names that sub-path, as in `addApiRouter({ owner, prefix: '/api/authorization', scope: '/sharingRules', router })`: a route the router declares outside `prefix` + `scope` is never reached, so it is left out of the document and the duplicate-route check and reported as undeclared. Those routes are then documented and checked exactly like routes mounted on `/api`: each still declares `describeRoute({...})` or `describeRoute({ hide: true })`, `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report the ones that do not, and a router registered before the application starts takes part in its duplicate-route check. A forwarded target the framework cannot see into, such as a plain function, is registered with `addUndeclaredApiRoute({ owner, method, path, reason })`: it always counts as undeclared and never appears in the document.

Routes a library defines, such as Better Auth's, are merged in by the plugin that mounts them with `container.resolve(apiDocsToken).addFragment({ owner, paths, components, tags, security })`; Better Auth's endpoints appear under the `Authentication` tag at their `/api/auth/...` paths, without the browser-only steps. The document is cached; whatever changes what it describes, such as a Collection's fields, calls `invalidate()` on the same service.

## Limits

The application may also set limits that every `/api` request meets before its route, in the `api` section of `config.yml`. They are all off by default and nothing is installed for one that is unset, so a route never relies on them. `api.bodyLimit` is a ceiling over all routes; a route's own `bodyLimit` above, where it sets one, is usually smaller.

```yaml
api:
  bodyLimit: 10mb # 413 INVALID_ARGUMENT, reason BODY_TOO_LARGE
  timeout: 30s # 503 UNAVAILABLE, reason REQUEST_TIMEOUT
  rateLimit: # 429 RESOURCE_EXHAUSTED, reason RATE_LIMITED, with Retry-After in seconds
    max: 600
    window: 1m
```

All three answer in the standard body with domain `app`. The timeout covers the time until the handler returns its response, so a streaming response that has started is not cut off; the handler is not cancelled and its late result is discarded. The rate limit counts per client address, in each process separately, exempts `GET /api/healthz` and does count Better Auth's sign-in routes. A client that receives `429` waits for `Retry-After` before trying again.

## Exceptions

These `/api` routes keep their own shape. Nothing else is exempt, and code you write never imitates them.

- **Data endpoints from `defineRepositoryApiRoutes`** are `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`. They keep their actions — `findMany`, `createOne` and the rest — and are always `POST`, because their filter is a tree that only fits in a body. The exposure name is a camelCase segment, `/^[a-z][a-zA-Z0-9]*$/`, checked when the routes are declared; name it after its Collection and never after a plugin namespace, whose first segment it would share. They report errors in the standard body, with domain `app` and the Repository error code as reason.
- **The file plugin's upload actions on a file exposure**, `POST /api/{name}/uploadOne` and `POST /api/{name}/uploadMany`, belong to the data endpoints above: they take a multipart body and report errors in the standard body.
- **Better Auth's routes under `/api/auth/`**, such as `POST /api/auth/sign-in/email`, are defined by the library and stay as it defines them. Routes this repository writes about authentication, such as the Hub's API key management, follow the rules above.
- **`GET /api/healthz`** keeps the body load balancers and probes read.
- **Streaming responses**, server-sent events and NDJSON, stay streaming and keep their own frame format once the stream has started. Their path, method and input follow the rules above. Everything that can be detected before the stream opens — invalid input, a missing resource, a refused permission, an exceeded limit — is answered with the standard error body and its status before the first frame, never as an error frame inside a `200` stream.

## Verify

- Every failure is the standard body. Assert `reason`, not `message`.
- An invalid body is `400` with the offending field in `fieldViolations`, and an unknown body field is rejected.
- A `GET` changes nothing, not even expired rows, the session or its cookies.
- A caller without permission gets `403` before any input validation and before anything is written.
- Where a route sets a body limit, a body over it is `413` with reason `BODY_TOO_LARGE`.
- A list returns `{ data, meta }`, and its paging parameters are honored and capped.
- Every route is declared: it appears in `GET /api/swagger` with its tags, summary, operationId, inputs and responses, or declares `describeRoute({ hide: true })` for one of the reasons above. In a test, after `app.start()`: `findUndeclaredApiRoutes(app)` from `@nocobase/app-server/router` lists the application's undeclared routes, `findApiDocumentSchemaProblems(document)` lists every `$ref` the generated document cannot resolve and every component a converter named instead of a declaration. A test expects both to be empty and the document to contain the route's `operationId`.
- In the NocoBase source repository, `pnpm openapi:check` starts each template on a SQLite test database and fails on an undeclared route, a declared route missing `tags`, `summary` or `operationId`, a duplicate `operationId`, and any schema problem, printing the `reason` an undeclared route was registered with and how to fix each problem; `node scripts/check-openapi.mjs default` checks one template. It keeps no snapshot of the document and does not compare versions of it.
