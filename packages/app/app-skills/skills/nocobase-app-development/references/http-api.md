# HTTP API design

Every route under `/api` follows these rules, whether the application or a plugin owns it. They are Google's API design guidelines ([aip.dev](https://google.aip.dev)) with one change: a custom method is separated by a slash, `/apps/{appId}/deploy`, not by Google's colon, `/apps/{appId}:deploy`. Root routes (`defineRootRoutes()`) answer whatever their protocol requires, such as a payment provider's webhook, and are not bound by them. Two kinds of `/api` route are exempt, listed at the end.

See [server routes](server-routes.md) for mounting, authentication and authorization.

## URLs

- **Segments are camelCase.** `/apiKeys`, `/permissionSets`, never `/api-keys` or `/api_keys`. Collections are plural nouns.
- **A plugin's routes start with its namespace:** the package name without `app-plugin-`, in camelCase. `@nocobase/app-plugin-notification-in-app` owns `/notificationInApp/...`. When the plugin's main resource has the plugin's own name, the segment appears once: the users plugin lists users at `/users`, not `/users/users`. The application's own routes have no namespace: `/orders`.
- **`/swagger` is reserved** for the generated API documentation.
- **Fixed segments go before path parameters.** Hono matches in registration order and the first match wins without warning, so register `/users/options` before `/users/:userId`.
- **The client encodes ids.** An id containing `/` or `:` reaches the route encoded and arrives decoded in `context.req.param()`.

## Standard methods

| Operation                         | Method   | Path                       | Success                  |
| --------------------------------- | -------- | -------------------------- | ------------------------ |
| List                              | `GET`    | `/orders`                  | `200 { data: [], meta }` |
| Get one                           | `GET`    | `/orders/{orderId}`        | `200 { data }`           |
| Create                            | `POST`   | `/orders`                  | `201 { data }`           |
| Update some fields                | `PATCH`  | `/orders/{orderId}`        | `200 { data }`           |
| Replace a singleton configuration | `PUT`    | `/orders/{orderId}/config` | `200 { data }`           |
| Delete                            | `DELETE` | `/orders/{orderId}`        | `204`, no body           |
| Custom method on one resource     | `POST`   | `/orders/{orderId}/cancel` | `200 { data }` or `202`  |
| Custom method on a collection     | `POST`   | `/orders/archiveCompleted` | `200 { data }` or `204`  |

`GET` never changes data: browsers prefetch, crawlers follow links and caches replay requests without the user asking. Marking a message read when a list is opened is a separate `POST`. `DELETE` carries no body; a confirmation is a query parameter, `DELETE /users/5?confirm=true`.

## Custom methods

Use one only when no standard method expresses the operation without changing its meaning: deploy, roll back, enable, disable, send, copy. An operation that is a field update is a `PATCH`.

The method follows the resource it acts on: `/{collection}/{id}/{verb}` for one resource, `/{collection}/{verb}` for a whole collection, and `/{scope}/{verbNoun}` for a computation on no stored resource, such as `/ai/translateText`. It is `POST` when it changes anything, and `GET` only when it is a pure read whose input fits in the query string.

| Rule                                                                                  | Right                                  | Wrong                       |
| ------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------- |
| A verb or verb + noun, camelCase                                                      | `/deploy`, `/markRead`, `/batchDelete` | `/deployment`, `/mark-read` |
| Verbs act, plural nouns are sub-resources                                             | `/users/5/activate`, `/users/5/roles`  | `/users/5/activation`       |
| Not a standard verb: `get`, `list`, `create`, `update` and `delete` are methods above | `GET /orders/7`                        | `/getDetails`, `/listAll`   |
| No prepositions; conditions are parameters                                            | `/send` with `{ userId }`              | `/sendToUser`               |
| No `Async`; a long operation returns a resource whose progress can be read            | `/deploy` returning the deployment     | `/deployAsync`              |
| Paired operations take paired verbs                                                   | `/enable` and `/disable`               | `/enable` and `/turnOff`    |

One operation has one URL across the whole system. Enabling a workflow is `POST /workflows/{workflowId}/enable` and nothing else.

## Responses

Every successful JSON response is `{ data }`; a list is `{ data: [...], meta }`. Never answer a bare array or object, and never put the payload beside `data`.

There are two pagination styles, and a list uses one of them:

- **Cursor**, for feeds and external callers: request `pageSize` and `pageToken`; `meta` carries `nextPageToken`, absent on the last page. The token is opaque — the server builds it, the client sends it back unchanged. These are the names Google's AIP-158 uses.
- **Page number**, for administrative tables: request `page` and `pageSize`; `meta` carries `page`, `pageSize` and `total`.

`pageSize` defaults to 20 and is capped at 100. Search is `q`, ordering is `orderBy`.

Data formats:

- Ids are strings. Snowflake ids exceed `Number.MAX_SAFE_INTEGER`, and a JavaScript client silently rounds them as numbers.
- Times are RFC 3339 strings, such as `2026-10-04T08:00:00.000Z`.
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

- **`reason`** is what clients branch on: UPPER_SNAKE_CASE, unique within its domain, stable once released. A client never parses `message`.
- **`domain`** is the namespace of whoever defined the reason: the plugin namespace, or the application's name for its own routes. The framework uses `app`.
- **`message`** is an English sentence for developers. It is never shown to users.
- **`localizedMessage`**, `{ locale, message }`, is optional user-facing text the handler has already translated with the request's i18n.
- **`fieldViolations`**, `[{ field, description }]`, names the invalid fields of an `INVALID_ARGUMENT`.
- **`metadata`** carries further machine-readable facts about this occurrence.

Check permission before existence: a caller who may not see a resource gets `403` whether it exists or not, and `404` only once allowed. Otherwise the difference leaks which ids exist.

The application handles everything a route does not:

- An unexpected error becomes `500 INTERNAL` with reason `INTERNAL_ERROR` and nothing about its cause; the stack goes to the request log.
- Hono's `HTTPException`, and an error carrying a 4xx `status` such as `AuthorizationDeniedError`, keep their status.
- An unknown `/api` path is `404 NOT_FOUND` with reason `ROUTE_NOT_FOUND`, never the application page.
- A route's own `onError` still runs first. Use one only to turn domain errors into `ApiError`, and rethrow the rest.

## Input

Validate every input before using it — path parameters, query parameters and the JSON body — with a zod schema, through Hono's `validator()` and `parseApiInput()`. An invalid request is answered `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` and a field violation for each problem, before the handler runs. The handler reads only `context.req.valid(...)`, never `context.req.json()` or `context.req.query()`.

```ts
import { parseApiInput } from '@nocobase/app-server/router';
import { validator } from 'hono/validator';
import { z } from 'zod';

const OrderParams = z.object({ orderId: z.string() });
const CancelOrderInput = z.strictObject({
  reason: z.string().min(1),
});

router.post(
  '/orders/:orderId/cancel',
  auth.required(),
  validator('param', (value) => parseApiInput(OrderParams, value)),
  validator('json', (value) => parseApiInput(CancelOrderInput, value)),
  async (context) => {
    const { orderId } = context.req.valid('param');
    const input = context.req.valid('json');
    return context.json({ data: await orders.cancel(orderId, input) });
  },
);
```

| Input           | Schema           | An unknown field                        |
| --------------- | ---------------- | --------------------------------------- |
| JSON body       | `z.strictObject` | Rejected with `400`, naming the field   |
| Query string    | `z.object`       | Dropped; proxies and libraries add some |
| Path parameters | `z.object`       | Cannot occur                            |

A strict body catches a misspelled field instead of silently ignoring it. So a client sends only the fields it changes, never a whole record read back from the server. Derive the service's types with `z.infer` instead of writing a second `interface`.

Field types: ids are `z.string()`, times `z.iso.datetime()`, enumerations `z.enum([...])`. "May be omitted" is `.optional()` and "may be null" is `.nullable()`; do not use one for the other.

## Exceptions

Two kinds of `/api` route keep their own shape. Nothing else is exempt, and code you write never imitates them.

- **Repository routes from `defineRepositoryApiRoutes`** keep their actions — `findMany`, `createOne` and the rest — and are always `POST`, because their filter is a tree that only fits in a body. They report errors in the standard body, with domain `app` and the Repository error code as reason.
- **Better Auth's routes under `/api/auth/`**, such as `POST /api/auth/sign-in/email`, are defined by the library and stay as it defines them. Routes this repository writes about authentication, such as the Hub's API key management, follow the rules above.

## Verify

- Every failure is the standard body. Assert `reason`, not `message`.
- An invalid body is `400` with the offending field in `fieldViolations`, and an unknown body field is rejected.
- A `GET` changes nothing.
- A list returns `{ data, meta }`, and its paging parameters are honored and capped.
