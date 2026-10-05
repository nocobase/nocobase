---
'@nocobase/app-server': major
'@nocobase/api-client': major
'@nocobase/app-skills': minor
'@nocobase/create-plugin': patch
---

Data endpoints from `defineRepositoryApiRoutes` separate the exposure name and the action with a slash instead of a colon: `POST /api/{name}:{action}` is now `POST /api/{name}/{action}`, such as `POST /api/salesOrders/findMany`. The colon form is no longer routed and answers `404 ROUTE_NOT_FOUND`. `api.repository(name)` in `@nocobase/api-client` sends the new path.

An exposure name must be a camelCase path segment matching `/^[a-z][a-zA-Z0-9]*$/`, and must not be `auth`, `healthz` or `swagger`. `defineRepositoryApiRoutes` throws at declaration for any other name, so an application exposing a name such as `sales/orders` or `sales-orders` must rename it, and its clients must use the new name. A duplicate name now reports which name was declared twice.

The HTTP API specification in `@nocobase/app-skills` now covers singular or plural plugin namespaces, plugins mounted through another plugin's dispatcher, fixed segments registered before path parameters, the not-found rule, the `413`/`415` statuses and the removal of `422` and `502`, binary and multipart input, and the routes that keep their own shape. The generated plugin `AGENTS.md` from `@nocobase/create-plugin` states the namespace and data endpoint rules accordingly.
