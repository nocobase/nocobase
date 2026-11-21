# HTTP API rules for plugins

Every route a plugin contributes with `defineApiRoutes()` follows [HTTP API design](../../nocobase-app-development/references/http-api.md) in the application Skill: URLs, standard and custom methods, responses and paging, `ApiError` and its status table, input validation with `apiValidator()`, body limits, API documentation with `describeRoute()`, the exceptions, and its verification list. Read it before adding or changing a route. Root routes from `defineRootRoutes()` answer whatever their protocol requires and are not bound by it.

This page lists only what a plugin decides differently from an application.

## Namespace and domain

- Every route starts with the plugin's namespace: the package name without the scope and `app-plugin-`, in camelCase, singular or plural. When the main resource has the plugin's name the segment appears once (`/users/{userId}/disable`); otherwise the resource follows the namespace (`/scheduler/schedules`).
- A plugin mounted through another plugin's dispatcher keeps the host's namespace and domain, as the authorization rule plugins answer under `/authorization/sharingRules` with domain `authorization`.
- `ApiError.domain` is the namespace exactly as the URLs spell it, one per plugin even when it serves several prefixes. An error passed through from another plugin keeps that plugin's domain. Keep released `reason` values stable.
- A router's own `onError` turns only the plugin's own domain errors into `ApiError` and hands everything else to `apiErrorHandler`, so the router renders the standard body when tested on a bare Hono too.

## Documentation

- `tags` is the plugin name in PascalCase (`Scheduler`), `operationId` is the namespace, a verb and the resource (`schedulerListOccurrences`), and a shared schema's `.meta({ ref })` starts with the plugin name (`SchedulerSchedule`).
- Import `describeRoute`, `apiValidator` and the response helpers from `@nocobase/app-server/router`. Never depend on `hono-openapi`: only the application's copy reads the declarations, and `pnpm peers:check` fails a plugin that declares it.
- Routes on the authorization dispatcher are registered as `authz.routes.add(path, createRouteHandler(router))` with `createRouteHandler` from `@nocobase/app-plugin-authorization/server/extension`. A plugin's own runtime dispatcher registers each router with `container.resolve(apiDocsToken).addApiRouter({ owner, prefix, scope?, router })`; the application Skill's [API documentation](../../nocobase-app-development/references/http-api.md#api-documentation) section explains both.
- A fallback router registered only while the plugin is unconfigured, answering `503` until the real routes replace it, may be hidden with `describeRoute({ hide: true })` and a comment saying why.

## Package rules

- Keep schemas in `server/routes/schemas.ts` (or `server/routes/schemas/`) and derive service types with `z.infer`. `zod` is a `dependency` of the plugin.
- Plugin packages emit declarations with `isolatedDeclarations`, so every exported schema, input schemas included, needs an explicit annotation that preserves its shape, or `apiValidator()` loses the typed input:

```ts
export const PreviewQuery: z.ZodObject<{ text: z.ZodString }> = z.object({
  text: z.string().trim().min(1).max(200),
});
export type PreviewInput = z.infer<typeof PreviewQuery>;
```

- Check the annotation against the installed Zod version and run the plugin's typecheck and declaration build.
- A plugin test that starts an application expects `findUndeclaredApiRoutes(app)` and `findApiDocumentSchemaProblems(document)` to be empty and the document to contain the plugin's `operationId`s. Source contributors also run the repository-local OpenAPI validation.
