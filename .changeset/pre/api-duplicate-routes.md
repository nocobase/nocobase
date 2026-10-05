---
'@nocobase/app-server': major
'@nocobase/app-skills': patch
---

An application now fails to start when two API routes answer the same method and path. Hono runs only the first matching route, so a plugin route that repeats another plugin's route, or a hand-written route that repeats a `defineRepositoryApiRoutes` data endpoint, used to be dead code that nothing reported. Parameter names do not distinguish routes (`/orders/:id` and `/orders/:orderId` are the same route), an `ALL` route collides with every method on its path, and middleware is not counted. The error names the method, the path and both owners: a plugin's routes are named by its package name, the application's own routes by the application's package name, and a contribution passed to `Application.addRoutes()` by its position unless the new optional `{ owner }` argument names it.

The `nocobase-app-development` Skill's HTTP API reference states this rule, uses `/translation/translateText` instead of `/ai/translateText` as the example of a computation on no stored resource, and adds that a route schema never uses `z.any()` and uses `z.unknown()` only for a genuinely free-form value, with a comment saying why.
