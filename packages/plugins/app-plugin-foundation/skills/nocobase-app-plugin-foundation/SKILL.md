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
- Undetermined means the evidence could not be read this time, never that it is unused; the details list what could not be read.
- AI and agents are in use with an enabled model service or a registered Runner. Native OnlineAgent and model gateway calls do not require an `agAgents` record. Stored Agent definitions and historical usage alone do not prove current configuration. If neither execution path is confirmed and a required read failed, leave the status undetermined. Preserve another confirmed active path when optional statistics fail; never turn a failed read into zero or a missing-configuration claim.
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

### Overlapping API routes

API associations follow proven Hono registration order, including fluent calls, local registration helpers, ordered API exports and nested mount snapshots. Each matching handler contributes separately. A handler that does not use its `next` parameter ends the chain; a direct unconditional `next()` or `await next()` allows the next matching handler to contribute. Method-specific routes, `all` and `use` middleware retain their chain boundaries. Reached handlers still supply static integration references, including conditional work inside them; these references do not claim that every dependency executes on every request.

Conditional forwarding, opaque middleware factories, uncertain registration paths or order, and request paths that cannot distinguish fixed siblings remain conservative. Keep the proven prefix and other page, access and request evidence, omit downstream contributions whose reachability is unproven, and mark the analysis incomplete. Blank matrix cells remain “not identified”. This is bounded package-local analysis, not a general control-flow interpreter; it never executes application business code.

To apply a correction to an existing deployment, update the consuming application's Foundation dependency, rebuild the application to regenerate `dist/server/foundation-modules.json`, and deploy that build. The artifact format remains compatible and can be read without business source files. Refreshing an old artifact alone cannot apply the correction; do not hand-edit it.

Registration tracing stops at direct returns and loop exits. A possible exit in unsupported control flow makes later registrations uncertain, instead of treating the remaining statements or loop iterations as unconditional. Class definitions do not execute instance fields or methods; static initializers remain module initialization, and recognized instance construction stays conservative. Only terminal wildcards establish a certain wildcard match. A fixed suffix can disprove a nonterminal wildcard match; other suffix patterns remain incomplete and cannot contribute certain associations.

### Declared local aliases and finite route constructors

Static discovery reads package-local `tsconfig.json` JSONC `compilerOptions.paths`, including exact keys and single-wildcard keys with one target, relative to the declaring configuration or its explicit `baseUrl`. Relative package-local configuration inheritance is limited to eight files; each configuration is limited to 512 KB. Explicit mappings in a configuration with an external preset are usable, but external presets are never loaded and their inherited mappings are unavailable. Package imports (`#...`) and relative imports retain their existing behavior. Each application and registered plugin uses its own configuration; `@/` is never implicitly mapped to `client`, and ordinary npm scopes remain external packages. Vite configurations and configuration plugins are never executed or inferred.

Missing, duplicate, conflicting, multi-target, cyclic, unsupported or escaping declarations remain unresolved. An unresolved `@/` or declared local alias marks referenced page analysis incomplete rather than becoming a provider. Mappings cannot traverse `node_modules` or escape the owning package through relative paths or symlinks. Supported mappings have at most 128 keys and one wildcard per key/target; source reads retain the 400-file and 512 KB-per-file limits. Backend declarations are read before lazy page graphs share the remaining source budget, so a large page graph cannot consume the entire budget before backend discovery begins.

Local route constructors may return literal objects or arrays through object parameters, destructuring/defaults, loader aliases, literal template names, nested children and finite literal `map`/`find` operations or `Object.entries` tabs. Invocation bindings keep names and loaders paired across calls and files. Only direct returns and side-effect-free constant declarations are accepted in block bodies. Unknown conditions, opaque calls, spreads, mutation, loops, recursion and larger computations retain independent proven routes and mark aggregate discovery incomplete. Constructors and component loaders are never invoked. Evaluation has a 32-level/value bound and a 100,000-visit budget per declaration file. This remains a static integration inventory; unsupported DomainConfig/service wiring and source limits can leave cells unidentified even when route names are recovered.

Rebuild the consuming application after updating the plugin to regenerate `dist/server/foundation-modules.json`. Its format is unchanged, repeated generation preserves bytes and modification time, and a source-free deployment can read the validated artifact. Refreshing an old artifact alone does not apply the correction.
