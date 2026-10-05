# @nocobase/api-client

## 1.0.0-beta.3

### Major Changes

- 3f01f61: Every failed `/api` response now has one body, `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`, following Google's AIP-193: `code` is the HTTP status, `status` one of a fixed set such as `NOT_FOUND`, and `reason` the stable, machine-readable cause clients branch on.

  - `@nocobase/app-server/router` exports `ApiError`, which a route throws to answer in that body, and `parseApiInput()`, which validates input against a zod schema inside Hono's `validator()` and answers `400 INVALID_ARGUMENT` naming every invalid field. The application renders anything a route does not: an unexpected error is an opaque `500 INTERNAL`, Hono's `HTTPException` and any error carrying a 4xx `status` keep it, and an unknown `/api` path is a JSON `404 ROUTE_NOT_FOUND` instead of the SPA page. Every `/api` response carries the request's id in `x-request-id`, reusing a safe id the caller sent, and the request log uses the same id. Repository routes report their errors in the new body, with the Repository error code as `reason` and `domain` `app`; a write refused by Policy carries its `path` and `details` in `metadata`.
  - `ApiClientError` (from `@nocobase/api-client`, re-exported by `@nocobase/app-client`) replaces `code` with `reason` and `domain`, read from the new body; `requestId` falls back to the body when the header is absent. Replace `error.code === 'X'` with `error.reason === 'X'`.
  - `AuthorizationDeniedError` carries `reason` `AUTHORIZATION_DENIED` and `domain` `authorization`, and its `getResponse()` answers the new body.
  - `auth.required()` answers an anonymous request with `401 UNAUTHENTICATED`, reason `AUTHENTICATION_REQUIRED`, and a credential Better Auth refuses with its status and Better Auth's code as `reason`, instead of `{ code: 'UNAUTHORIZED' }` and Better Auth's own body. Better Auth's own routes under `/api/auth/` are unchanged.
  - The authorization routes answer a denial with `403 PERMISSION_DENIED` and invalid settings input with `400 INVALID_ARGUMENT`, reason `INVALID_AUTHORIZATION_INPUT`, instead of `{ code: 'FORBIDDEN' }` and `{ code: 'INVALID_AUTHORIZATION_INPUT' }`.

- 21d274c: Data endpoints from `defineRepositoryApiRoutes` separate the exposure name and the action with a slash instead of a colon: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`. The colon form is no longer routed and answers `404 ROUTE_NOT_FOUND`. `api.repository(name)` in `@nocobase/api-client` sends the new path.

  An exposure name must be a camelCase path segment matching `/^[a-z][a-zA-Z0-9]*$/`, and must not be `auth`, `healthz` or `swagger`. `defineRepositoryApiRoutes` throws at declaration for any other name, so an application exposing a name such as `sales/orders` or `sales-orders` must rename it, and its clients must use the new name. A duplicate name now reports which name was declared twice.

  The HTTP API specification in `@nocobase/app-skills` now covers singular or plural plugin namespaces, plugins mounted through another plugin's dispatcher, fixed segments registered before path parameters, the not-found rule, the `413`/`415` statuses and the removal of `422` and `502`, binary and multipart input, and the routes that keep their own shape. The generated plugin `AGENTS.md` from `@nocobase/create-plugin` states the namespace and data endpoint rules accordingly.

### Patch Changes

- Updated dependencies [7dbc54b]
- Updated dependencies [21d274c]
  - @nocobase/repository-input@0.1.0-beta.2

## 0.1.0-beta.2

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

## 0.1.0-beta.1

### Patch Changes

- c960d07: Replace the Repository API's per-action `writePolicy` with a Repository Policy
  declared once per exposure.

  **Breaking.** `defineRepositoryApiRoutes()` no longer accepts `writePolicy` on
  an action, and every exposure must declare a `policy`. An action configuration
  now says only that an endpoint exists; what it may do is the exposure's Policy,
  which governs reading, creating, updating and deleting together. Declaring one
  is required rather than optional because `writePolicy` defaulted to refusing
  writes while an absent Policy restricts nothing — making it optional would have
  turned every existing declaration from "refuse every write" into "allow
  everything" without a word of warning.

  Declare `policy` as a function of a principal, together with a
  `principal(context)` resolver, to scope rows to the caller. The resolver belongs
  to the application, since this router installs no authentication; one that
  returns nothing refuses the request with 403 `PRINCIPAL_REQUIRED` rather than
  binding a Policy built from a principal that is not there. A fixed Policy is
  still normalized when the routes are defined, so a malformed one fails where it
  is written; a Policy function cannot be, and its `INVALID_POLICY` now reaches
  the host error handler as a server error instead of being reported to the caller
  as a 400.

  `@nocobase/db` gains `buildRepositoryPolicy`, a builder whose unmentioned nodes
  are denied, so the four-node requirement costs nothing to satisfy while the
  default stays refusal. Two related fixes travel with it: `create`, `update` and
  `delete` nodes that are `false` now refuse a write before its payload is read,
  so an empty body is reported as forbidden rather than as invalid input; and a
  `create` node whose relations grant `update`, `upsert`, `disconnect`, `set` or
  `delete` is refused during normalization, since a root create performs none of
  them.

  `@nocobase/app-plugin-file` exposures declare a Policy too, and it reaches
  uploads: the upload path binds a Policy derived from the exposure's, inheriting
  `create.scope` and `create.defaults` and substituting the file columns for the
  field allowlist. A file uploaded under a scoped Policy therefore lands inside
  the scope the same exposure reads from. The public content route under
  `accessPath` is unchanged and deliberately outside it.

  The method-level `writePolicy` option on `db.repository()` calls is unaffected
  and remains available for narrowing a single call.

- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
  - @nocobase/repository-input@0.1.0-beta.1

## 0.1.0-beta.0

### Minor Changes

- 90a4903: Support asynchronous iteration of remote Repository `findMany` queries over framed NDJSON while preserving array consumption through `await`.
- 90a4903: Add portable Repository AST and mutation input builders shared by browser and server clients. Support synchronous builder callbacks and complete JSON options helpers for all nine remote Repository actions, including nested selections, relation mutations, and numeric updates. Preserve relation create client keys through an explicit JSON envelope and reject unserializable builder inputs before sending requests.
- 90a4903: Expose opt-in aggregate and groupBy Repository HTTP actions with JSON AST validation, grouped filters and sorting, and lossless BigInt result serialization. Add matching remote Repository methods and public types. Switch the aggregate example to the generic authenticated endpoints and display its actual Repository requests.

### Patch Changes

- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/repository-input@0.1.0-beta.0

## 0.0.1

### Patch Changes

- Add a lightweight HTTP client with JSON, raw body, streaming, and remote Repository APIs.
