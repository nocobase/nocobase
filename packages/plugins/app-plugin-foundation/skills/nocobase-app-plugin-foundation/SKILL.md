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

- Server plugin: `@nocobase/app-plugin-foundation/server` (default export). Exports `foundationServiceToken`, whose `overview({ refresh?, countRecords? })` answers the same result as the route.
- Server route: `GET /api/foundation/overview`, optional `refresh=true` or explicit `countRecords=true`. Ordinary loads and refreshes do not count every business table. Requires a session or API key of an identity with unrestricted access; anyone else gets `403` with reason `FOUNDATION_FORBIDDEN`.
- Collection list: `GET /api/foundation/collections?offset=0&search=orders`, the same unrestricted access boundary, at most 50 entries in `{ data, meta: { total } }`. Search covers the full owned catalog, not just the displayed page.
- Client plugin: `@nocobase/app-plugin-foundation/client` (default export). `foundation()` adds the page at `/foundation` with a menu entry; options `path`, `navigation: false`, `routes: false` and `settingsGroup: true`. The default template uses `settingsGroup: true` so a bare application already has a localized settings group containing only the protected Foundation page.
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
- Information pending update means the evidence could not be read this time, never that it is unused; the existing Refresh operation and the detail's retry button retry collection. Expand the read details for sanitized source notes.
- AI and agents are in use with an enabled model service or a registered Runner. Native OnlineAgent and model gateway calls do not require an `agAgents` record. Stored Agent definitions and historical usage alone do not prove current configuration. If neither execution path is confirmed and a required read failed, leave the status undetermined. Preserve another confirmed active path when optional statistics fail; never turn a failed read into zero or a missing-configuration claim.
- Business record ownership uses `server/catalog.ts`. If an unclassified runtime extension makes ownership uncertain, business counts are withheld; add a supported ownership adapter rather than interpreting them as zero.

## Verification

The application service keeps reliable active statuses, subpart statuses and complete metrics in memory. Retained values expose their original `checkedAt` and display “Last confirmed”; the overview timestamp is the latest check. Current reliable values take precedence, including zero. Earlier unused or needs-setup states do not become current negative conclusions after a failure. File counts, bytes and table counts require complete candidate discovery as well as successful aggregation to be exact. Without complete history, partial values read “Counted …” and “Some data is pending update”; wholly unreadable values remain pending. A fully confirmed empty catalog still reports exact zero. File facts retained from complete discovery carry their original date as well.

History is service-local, isolated by application and default connection identity, and invalidated conservatively on catalog, physical table, provider/ownership, relevant configuration or readable definition changes. It uses existing reads only. Restarting or replacing the application service clears it; separate server processes have independent histories. There is no persistent data, background collection or automatic retry. Authorization always runs before the service; a browser refresh receiving `401` or `403` hides internal cached values.

The existing deadline preserves evidence completed before another read stalled, including confirmed configuration and partial file statistics. This does not issue a second query or extend the deadline. Late completions cannot replace the response, and queries already in flight retain their shared slots until they settle.

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

The plugin combines page, authentication and authorization declarations, provider ownership and readable static page dependencies. Follow only referenced values from the selected page export; unused imports, unrelated shared-file exports and uncalled class methods are excluded. A statically matched literal API-client request can additionally establish dependencies on the matching root-mounted endpoint handlers and their referenced values, never every dependency in the router file. A multi-category provider identity alone does not establish all its categories. Selected local request helpers can preserve literal path/method arguments. Nested Hono prefixes and base paths, explicitly exposed Repository API actions, and unambiguous local singleton/instance bindings to a service constructor and selected method are recognized. Opaque factories and competing service bindings stay unassociated. These references describe integration, not per-module runtime activity; do not turn them into execution counts. The server parses bounded package-local sources without importing application modules, running component loaders or exposing source paths. Deployed or custom layouts without readable declarations keep their runtime navigation and access evidence. Overrides, computed routing and opaque backend services may remain unassociated. Blank cells mean not identified, not unused. Keep all matrix logic in this plugin; no other plugin reports or application-specific mapping is required.

Capability details include their associated business modules. API dependency associations require both the statically recognized HTTP method and path; an omitted method follows the API client's `GET` default. A refresh failure is shown while retaining the last successful result and its collection time. A `401` or `403` hides the cached overview. Do not describe cached data as freshly collected or type-only references as runtime integration.

### Existing application analysis

For existing applications, the source analyzer also recognizes `useService(apiClientToken)`, React `useCallback` request wrappers, literal tuple-generated routes, decidable local literal conversions and Hono registration helpers. Request path and method bindings stay paired per call. After updating the Foundation plugin, rebuild the application to regenerate `dist/server/foundation-modules.json`; merely refreshing an old deployment cannot repair associations missing from its build artifact. Do not hand-edit that artifact or add a per-application capability map.

## Sidebar grouping

The host can call `groupFoundationNavigation(items)` from `@nocobase/app-plugin-foundation/client` in its existing `client/lib/navigation-transform.ts` hook, after permission filtering. The helper places an already-visible Foundation entry last in the existing `settings` navigation group, avoiding a separate sidebar group gap. Pass the host’s group name as the second argument when different. It preserves route identity, `/foundation`, authorization and other navigation metadata, never creates a hidden entry and leaves Foundation standalone if no settings group exists. The App needs only the hook call; grouping logic stays in this plugin and does not change Core or the sidebar renderer.

When business settings are added, preserve the template navigation transform: it merges the initial Foundation settings group into the application settings group without changing the page URL or access boundary. Do not remove the initial Foundation entry when keeping unused business administration unregistered.

## Large catalogs and count freshness

Only five Collection names appear in the overview. The page loads the full-list browser only when opened, with search and 50 entries per page. Exact business row totals are explicit, bounded operations; the page retains the last successful count and shows its original `recordCountCheckedAt`. A normal Refresh does not recount rows, and a process restart clears this in-memory count. Database reads share four service-wide slots; a timed-out scan stops scheduling work, while driver queries already in progress retain their slots until they settle. Known table totals survive a scan timeout; unavailable counts are not zero. Hover or focus a matrix column icon to read its localized capability name.

A missing or unreadable Collection definition makes data modeling partial without discarding the catalog preview or confirmed table/view totals. Field and relation metrics count readable definitions as lower bounds (`complete: false`); if all definitions are unavailable, their values are `null`. A present empty definition remains an exact zero. Refresh retries schema inspection after recovery and retains the last successful business record count with its original time. Raw driver errors and connection details never enter the overview.

Module discovery supports the conventional Client routes, Server routes and provider entries both at the package root and under `dist/`, for applications and registered plugins. Local compiled services retain endpoint and selected-method boundaries. Unreadable backend entries or local dependencies mark pages with recognized backend requests incomplete; pages without such requests need no backend entry. Rebuild existing deployments to regenerate the module artifact; source-free application deployments continue reading that validated artifact.

Literal JSX props, destructured defaults, loader aliases and finite literal array-generated routes/endpoints are statically recognized. Unknown factories and computed values remain unassociated; application code is never executed.

Collection evidence uses at most five compact name tags and the total count on the overview. The full catalog opens in a temporary dialog with a bounded scrolling body and fixed pagination controls; opening it does not expand the capability card. Search is debounced by 250 ms and waits for IME composition to finish; Enter applies it immediately. Collection titles and logical names are listed without opening a schema inspector. Closing returns focus to its trigger. Loading, empty search, recoverable failure and denied-access states remain inside the dialog.
