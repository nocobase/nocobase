---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-authorization': minor
'@nocobase/authorization': minor
'@nocobase/app-plugin-authz-default-access': patch
'@nocobase/app-plugin-authz-restriction-rules': patch
'@nocobase/app-plugin-authz-sharing-rules': patch
'@nocobase/app-plugin-i18n': patch
---

The user management routes under `/api/users`, every authorization route under `/api/authorization` (the permission snapshot, Permission Sets, the inspector, and the default-access, sharing-rule and restriction-rule settings) and `GET /api/i18n/locales` are now described in the application's OpenAPI document, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs` under the `Users`, `Authorization` and `I18n` tags. `GET /api/i18n/locales` declares `security: []`, because the sign-in page reads it before anyone is signed in. `PUT /api/i18n/locale` is hidden from the document because it only changes the browser's session. Input validation answers exactly as before. Each route lists `403` only where it checks a permission, so `GET /api/authorization/permissions` lists `401` and `500`; the `400` for invalid input comes from the input validators, and a route that can answer `400` for another reason declares it with its reasons, such as `INVALID_AUTHORIZATION_INPUT` on rule create and update, `PROTECTED_PERMISSION_SET` on Permission Set changes, and the password and role-scope reasons on user routes.

The settings routes behind the `/api/authorization` dispatcher are forwarded at request time, where the document generator cannot see them, so at boot the authorization plugin registers every `authz.routes` registration with the application's API documentation through app-server's generic `addApiRouter()` and `addUndeclaredApiRoute()`. Routes registered through `authz.routes.add(path, createRouteHandler(router))` are documented automatically at their full `/api/authorization/...` path and checked like any other route; declare each route of the router with `describeRoute()`. A handler that is a plain function rather than a `createRouteHandler` router keeps working but cannot be described: the plugin logs a warning naming its path and registers it as an undeclared route, so `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` report it like any route that declares nothing. A route a router declares outside the path its handler is registered under, which the dispatcher never forwards to, is left out of the document, logged, and reported the same way. `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?)` performs that registration, for a plugin's tests to assert on with `findUndeclaredApiRoutes` and the generated document without starting an application. `createRuleSupportRoutes` accepts an optional `name` for its operation ids, and the extension exports `AUTHORIZATION_API_TAGS`, `documentAuthorizationRoutes` and response schemas such as `SubjectRuleSchema` and `TotalMetaSchema`.

`AuthorizationRouteRegistry` in `@nocobase/authorization/core` gains `entries()`, which lists every registration with its handler, sorted by path like `list()`.

The default-access, sharing-rule and restriction-rule plugins no longer declare `hono`, which none of their code imports. The authorization plugin's README describes the rule request bodies as validated through `apiValidator()`.
