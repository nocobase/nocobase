# @nocobase/app-plugin-service-provider-example

This server-only plugin demonstrates the v3 ServiceProvider pattern with a
small `HeartbeatService`:

- `server/services/heartbeat.ts` contains the domain implementation.
- `server/tokens.ts` defines the stable service contract and typed token.
- `server/providers/index.ts` composes the Provider collection, while
  `server/providers/service-provider-example.ts` registers the service through
  `this.app.container` and manages its lifecycle.
- `server/routes/index.ts` creates a dedicated API Router and resolves the service
  through `app.container`.
- `server/plugin.ts` explicitly declares the Provider and Route collections.

After enabling the plugin, request `GET /api/serviceProviderExample/status` to
inspect the service lifecycle state. A fully started application returns a
response like this:

This example status endpoint is intentionally public so it can focus on the
ServiceProvider lifecycle. That public boundary is owned by this Route; a
business plugin should add its own authentication and authorization middleware
when the exposed state is not explicitly public.

The Route declares itself for the application's API document, read at `/api/swagger/docs`, with `describeRoute()` from `@nocobase/app-server/router`: the `ServiceProviderExample` tag, the `serviceProviderExampleGetStatus` operation, the response schema from `server/routes/schemas.ts`, and `security: []`, which is how a route that needs no session or API key says so.

```json
{
  "data": {
    "service": "@nocobase/app-plugin-service-provider-example",
    "status": "ready",
    "startedAt": "2026-08-28T00:00:00.000Z"
  }
}
```
