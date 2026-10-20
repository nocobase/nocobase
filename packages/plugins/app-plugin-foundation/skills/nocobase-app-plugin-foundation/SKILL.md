---
name: nocobase-app-plugin-foundation
description: Use when an application should show its administrators which NocoBase Core capabilities it uses (the App Foundation page), when registering or moving that page, or when asked why a capability shows as in use, needing setup, not used or undetermined there. Not for business permissions or for building other admin pages.
---

# App Foundation

## Use this Skill when

- The application should get the App Foundation page, or it should move or leave the menu.
- Someone asks why a capability on that page is in use, needs setup, is not used yet or is undetermined, or where a number comes from.

Do not use it to grant the page to a role: it admits only unrestricted access by design.

## Public surfaces

- Server plugin: `@nocobase/app-plugin-foundation/server` (default export). Exports `foundationServiceToken`, whose `overview({ refresh? })` answers the same result as the route.
- Server route: `GET /api/foundation/overview`, optional `refresh=true`. Requires a session or API key of an identity with unrestricted access; anyone else gets `403` with reason `FOUNDATION_FORBIDDEN`.
- Client plugin: `@nocobase/app-plugin-foundation/client` (default export). `foundation()` adds the page at `/foundation` with a menu entry; options `path`, `navigation: false` and `routes: false`.
- Page component: `FoundationPage` from `@nocobase/app-plugin-foundation/client/pages`, for an application that routes it itself (`foundation({ routes: false })`). Declare such a route with `authz: 'unrestricted'`.

## Prerequisites

The authentication and authorization plugins are registered, as in the default template. The page reads the query cache the application's routes provide.

## App workflow

1. Add the dependency and register the server plugin in `server/plugins.ts` and the client plugin in `client/plugins.ts`.
2. Restart the application and open `/foundation` as an administrator holding the root Permission Set.
3. Build the application as usual; refresh the page to see new capabilities light up.

## Reading a status

- Collected read-only by the plugin; nothing reports to it, so there is nothing to register per capability.
- In use means wired in: a persisted lifecycle, an enabled schedule, a connected mailbox, a configured notification channel, an API key that has been used. Zero uses still count as in use.
- Needs setup names what is missing in its reason, such as `noChannel` or `noDrive`.
- Undetermined means the evidence could not be read this time, never that it is unused; the details list what could not be read.
- Business record ownership uses `server/catalog.ts`. If an unclassified runtime extension makes ownership uncertain, business counts are withheld; add a supported ownership adapter rather than interpreting them as zero.

## Verification

- As the root administrator, `/foundation` shows the capabilities available in this runtime, and `GET /api/foundation/overview` answers `200`.
- As any other user, the page is not in the menu, and the route answers `403 FOUNDATION_FORBIDDEN`.
- After adding a Collection, a lifecycle or a notification channel and refreshing, the matching capability changes.

## Reading the provider inventory

The visible capability band is dynamic, not a fixed thirteen-item catalog. The optional overview `inventory` lists package manifests, catalog category associations and observed current registration separately. The browser adds Client route and provider owners as view-only evidence. Installation or registration alone never proves a package is configured or used; category usage must not be copied to every provider package.

Unknown Pro and custom providers remain visible as unclassified extensions. An npm scope or proprietary license does not verify official origin or Pro identity. Discovery is bounded to direct dependencies, known providers and public observed contributions, so missing evidence means unknown rather than disabled. Do not write invented module associations, usage facts or provider status into application code to make the overview look complete.

## Dynamic registration coverage

The host records immutable explicit Server and Client plugin registrations, including provider-only and locales-only plugins. Foundation reads those snapshots itself. A registered Pro or custom provider with no category adapter becomes its own `extension:<packageName>` item; its package title and version are displayed, while usage remains pending recognition. Registration does not prove configuration or use. Unknown extensions enter the band only when registered. Recognized installed capabilities remain visible as unused when there is no current registration or usage evidence; a manifest or stale database tables alone never mark them active. Refreshing after unregistering removes the extension and safely selects another available item. Legacy adapter observations remain in `capabilities`; runtime-specific items are returned in optional `availableCapabilities`.

## Business module matrix

Modules follow current registered navigation, with descendant pages grouped under their top-level menu module and translated by their owning namespace. No business-module names or capability relationships are configured in the application. The matrix and module tags use the same dynamic capabilities as the band. Hover or focus a module to highlight its associations; select a checkmark to see evidence and the capability's existing “Without the foundation” explanation.

The plugin combines page, authentication and authorization declarations, provider ownership and readable static page dependencies. Follow only referenced values from the selected page export; unused imports, unrelated shared-file exports and uncalled class methods are excluded. A statically matched literal API-client request can additionally establish dependencies on the matching root-mounted endpoint handlers and their referenced values, never every dependency in the router file. A multi-category provider identity alone does not establish all its categories. Opaque dependency injection and generic request wrappers stay unassociated. These references describe integration, not per-module runtime activity; do not turn them into execution counts. The server parses bounded package-local sources without importing application modules, running component loaders or exposing source paths. Deployed or custom layouts without readable declarations keep their runtime navigation and access evidence. Overrides, computed routing and opaque backend services may remain unassociated. Blank cells mean not identified, not unused. Keep all matrix logic in this plugin; no other plugin reports or application-specific mapping is required.

Capability details include their associated business modules. API dependency associations require both the statically recognized HTTP method and path; an omitted method follows the API client's `GET` default. A refresh failure is shown while retaining the last successful result and its collection time. A `401` or `403` hides the cached overview. Do not describe cached data as freshly collected or type-only references as runtime integration.

## Sidebar grouping

The host can call `groupFoundationNavigation(items)` from `@nocobase/app-plugin-foundation/client` in its existing `client/lib/navigation-transform.ts` hook, after permission filtering. The helper places an already-visible Foundation entry last in the existing `settings` navigation group, avoiding a separate sidebar group gap. Pass the host’s group name as the second argument when different. It preserves route identity, `/foundation`, authorization and other navigation metadata, never creates a hidden entry and leaves Foundation standalone if no settings group exists. The App needs only the hook call; grouping logic stays in this plugin and does not change Core or the sidebar renderer.
