# Design and develop system settings

Use this reference for persistent configuration and administration of a plugin: permission management, service configuration, policy editors or account administration. Settings are normal client route contributions with explicit server capabilities. The authorization plugin is the reference for a routed settings workspace; the default-access plugin is the smaller example for one configuration page.

## Decide ownership and operations

Define the configuration entity, stable identifier, persistence service and who can read or change it. Separate `read` from mutation rights. Use `configure` for saving/clearing a singleton baseline; use create/update/delete for a rule collection and `assign` for membership changes. A settings reader must not gain write access by loading the page.

Put validation, persistence and transactions in the owning service. Routes authenticate, authorize, validate input and map errors. Keep declarations static and service tokens owned by their exporting package. Database migrations create the fixed schema; seeds initialize missing defaults without overwriting administrator edits. Never store user-editable settings by rewriting source files or environment variables at runtime.

## Settings and ordinary pages have different authorization ownership

A settings page is a settings item, not a page resource. Its entry, children and standalone detail routes check the item's `settings` actions, including details declared with `defineAppRoutes`. Do not declare `page` `access` on these routes; the permission workspace lists as pages only routes that check `page` `access`. Route declaration helpers and URL paths do not decide authorization ownership; the function of the page does.

Group related settings items by the user's management area with a subsection of the `administration` section. For example, `automation` is the subsection, while Workflow and Schedules are settings items inside it; each item exposes its own `read` action and any management actions its plugin implements. Workspace display lives in `authz.ui`. Mirror the client settings menu: the plugin that owns the settings group adds the subsection with `authz.ui.sections.add`, and a plugin whose settings route extends that group with `extend: true` adds it with `extend: true` too, which does nothing when it exists, creates it otherwise and yields to the owner's title whichever boots first. Two owners with different definitions throw. List each item in its subsection with `authz.ui.place`; an unplaced item is listed under Administration's Other with a startup warning, and a placement naming an unknown subsection fails a development start. Keep page entry checks separate from the server operation checks described below.

## Register administration capabilities

Resolve `authorizationToken` in provider boot and register the item with `authz.settings.add`. Registration makes its actions grantable; an assigned permission set activates them. `settings` is a catalog type: a check or grant on an item or action nobody registered is denied.

```ts
authz.ui.sections.add({
  name: 'delivery-admin',
  title: 'Delivery administration',
  parent: 'administration',
});
authz.settings.add({
  id: 'delivery.configuration',
  title: 'Delivery configuration',
  actions: [{ name: 'read' }, { name: 'configure' }],
});
authz.ui.place(
  { type: 'settings', id: 'delivery.configuration' },
  { section: 'delivery-admin' },
);
```

Use translated `{ key, ns }` titles for real items. Keep the same stable settings id in the registration, the route's `authz`, client checks and server checks. `authz.settings.grant(id, actions)` builds the grant for seeds and provisioning. Grant settings access directly rather than through a composite resource. For business data permissions, read `packages/plugins/app-plugin-authorization/skills/nocobase-app-plugin-authorization/SKILL.md` instead of treating all data editing as system administration.

## Contribute the page

```ts
import { defineSettingsRoutes } from '@nocobase/app-client/plugins';
export default defineSettingsRoutes([
  {
    name: 'delivery-configuration',
    path: '/delivery-configuration',
    navigation: { title: 'navigation.deliveryConfiguration' },
    breadcrumb: { title: 'navigation.deliveryConfiguration' },
    authz: {
      resource: { type: 'settings', id: 'delivery.configuration' },
      action: 'read',
    },
    componentLoader: () => import('./pages/delivery-configuration-page.js'),
  },
]);
```

Register this contribution through the plugin's client `routes`. Do not include `/settings` or a deployment prefix in the declared path. The page module default-exports a React component. Settings require authentication; the `authz` check controls whether the page is available. Declare `authz` on the entry settings page, which its children inherit unless they declare their own settings check or `'skip'`; an entry page that omits it opens only for root. Dynamic detail URLs must not become a bypass.

A standalone leaf fits a small configuration surface. A collection workspace can use a sidebar list and child routes for editor, assignments and basic information, as `app-plugin-authorization/client/routes.ts` does. The parent renders an `Outlet`; child Tabs navigate routes, with the URL as the selection state. Do not duplicate route state in local tab state. Independent plugins can join a declared group through entry-level `parent`; the rule plugins use `parent: 'authorization'` while keeping their own translation namespace.

## Protect each endpoint

In the real `defineApiRoutes` factory, resolve authentication, authorization and the settings service from the container. Install both middlewares before handlers, then check the exact action on each endpoint in middleware ahead of its validators, and declare each endpoint for the API document:

```ts
const allowed = (action: 'read' | 'configure') =>
  createMiddleware<AuthorizationEnv>(async (c, next) => {
    await c.get('authz').require({
      resource: { type: 'settings', id: 'delivery.configuration' },
      action,
    });
    await next();
  });

router.use('*', authentication.required(), authz.middleware());
router.get(
  '/delivery/configuration',
  allowed('read'),
  describeRoute({
    tags: ['Delivery'],
    summary: 'Get the delivery configuration',
    operationId: 'deliveryGetConfiguration',
    responses: {
      '200': dataResponse(DeliveryConfigurationView),
      ...apiErrorResponses,
    },
  }),
  async (c) => c.json({ data: await service.read() }),
);
router.put(
  '/delivery/configuration',
  allowed('configure'),
  describeRoute({
    tags: ['Delivery'],
    summary: 'Replace the delivery configuration',
    operationId: 'deliveryReplaceConfiguration',
    responses: {
      '200': dataResponse(DeliveryConfigurationView),
      ...apiErrorResponses,
    },
  }),
  apiValidator('json', DeliveryConfiguration),
  async (c) => c.json({ data: await service.save(c.req.valid('json')) }),
);
```

Here `service`, the `DeliveryConfiguration` zod schema (a `z.strictObject`) and the `DeliveryConfigurationView` response schema, both in `server/routes/schemas.ts`, belong to the feature; `createMiddleware` comes from `hono/factory`, and `describeRoute`, `apiValidator` and the response helpers from `@nocobase/app-server/router`. The path starts with the plugin's namespace, and a singleton configuration is replaced with `PUT`, as the [HTTP API rules](http-api.md) describe. `AuthorizationDeniedError` is answered `403` with reason `AUTHORIZATION_DENIED` by the application; a router tested on its own renders it with `router.onError(apiErrorHandler)`. Never return secrets from the read endpoint; define explicit public read shapes for settings containing credentials, and let the response schema describe that shape rather than the stored one. A client route's read check does not authorize PUT/DELETE. Protect options, record search, uploads and subject resolution as well as main CRUD endpoints.

If a selector queries another module's directory, it needs that directory's authorization and record constraints. Selection does not authorize assignment. For authorization-specific extensions, use the exported `@nocobase/app-plugin-authorization/server/extension` helpers (`requireSettings`, `createRuleSupportRoutes`, `createRouteHandler`, `parse`) and `@nocobase/app-plugin-authorization/client/management` components instead of copying handlers or importing private source. A rule plugin registers its settings item with `authz.settings.add` and its routes with `authz.routes.add(path, createRouteHandler(router))`, declaring each route of `router` with `describeRoute()`; routes registered this way are documented automatically at their full `/api/authorization/...` path and checked like any other route.

## Editor state and feedback

Read through the application's API client (`useApiClient`); resolve permission clients inside components/hooks. Keep one saved baseline and one editable draft per independently saved section. Derive dirty state from them; preserve the draft on save failure, replace the baseline with the server result on success, and distinguish loading, empty, failed and unavailable data.

Gate mutations with `useCan` for their actual action and server checks. Render read-only data for readers. Protect unsaved work on route navigation and browser unload; avoid duplicate confirmation flows or multiple overlapping dirty-state implementations. Preserve unknown fields and translation descriptors when editing unrelated properties. Hide or disable protected operations based on server metadata, not hard-coded special record names.

Keep lists/selection and dependent views consistent after create/update/delete. Paginate and search large directories on the server. Prefer shared filter/subject controls when contracts match; avoid speculative component abstractions for a single form. Use the repository's shadcn components and theme tokens, translated text and accessible labels. See [client routing](client-routing.md) and [components](client-components.md).

## Verify the complete surface

Test the production route contribution's `createRouter` output: anonymous denial, read-only access, mutation denial, granted writes, invalid payloads and protected records. Test option/search endpoints and direct child URLs too. For transactional multi-entity changes, verify rollback and concurrent invariants. For the UI, verify deep links, back/forward, dirty navigation, failed saves, read-only presentation, session changes and updated data after successful save.

Run the owning package and relevant consumer checks. Keep package README API examples and its published Skill aligned with the final configuration workflow. Refer to `app-plugin-authorization/client/pages/permission-sets/`, its management handlers, and the optional rule plugin pages for maintained examples; copy their patterns only where the new settings domain has the same needs.
