# @nocobase/app-plugin-foundation

Shows which NocoBase Core capabilities an application uses, with live evidence, for its unrestricted administrators.

The App Foundation page derives its visible capability items from the current application's recognized installed providers, Core runtime evidence and explicit Client/Server plugin registrations. Its total is dynamic. Built-in collectors provide usage facts for recognized capabilities, and registered Pro or custom plugins without a matching adapter appear as independent extension items with their own package title and version. An unknown extension is never labeled in use solely because it is registered.

## Registering the plugin

```ts
// server/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/server';

// client/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/client';
// foundation() adds the page at /foundation with a menu entry; foundation({ path, navigation: false }) moves it or
// leaves it out of the menu, and foundation({ routes: false }) leaves the routing to the application, which renders
// `FoundationPage` from `@nocobase/app-plugin-foundation/client/pages`.
```

The plugin needs the authentication and authorization plugins, which every application built from the default template registers. Its page reads the query cache the application's routes provide.

## Who can see it

Only an identity with unrestricted access, such as a holder of the root Permission Set (`authorization.permissionSets.rootSet`, `root` by default), opens the page or reads `GET /api/foundation/overview`. It is not a grant: no Permission Set can give it to anyone else. Everyone else gets `403 FOUNDATION_FORBIDDEN`.

## How it collects

Everything is collected by this plugin, read-only, when the page asks; no other plugin or agent reports to it. It reads the Collections of the default connection, the application's configuration, the services registered in its container, the migration history, and the `package.json` of each package the application resolves from its own root. A result is cached for 30 seconds; `?refresh=true` collects again. Each capability gets 10 seconds. Database reads share a service-wide limit of four, including reads left running by a timed-out collection. Expired collectors stop scheduling work; an in-flight driver query retains its slot until it settles because the database abstraction has no generic cancellation API.

The rules every capability follows:

- An installed package proves nothing: a capability is in use only when the application is wired to it, such as a lifecycle store, an enabled schedule, a connected mailbox or a configured channel.
- Zero uses is not "not used": a lifecycle no record has moved through yet is in use.
- Business record totals are counted only on explicit request (`?countRecords=true` or the Count business records button). Ordinary loads and refreshes retain the last successful total with its independent collection time, and never silently replace a failed count with zero. Records are counted only in the application's own Collections. The Collections NocoBase packages keep are listed in `server/catalog.ts`; a package that adds one under a new name must be added there, or its records count as the application's. Views are not counted, so no row is counted twice.
- A capability whose evidence cannot be read has no status rather than a guessed one, and a count that could only be read in part is marked as a lower bound. No driver error reaches the response.
- Accepted notification deliveries are accepted by the provider, which is not the same as received.

AI and agents are in use when a model service is enabled or a Runner is registered. Native OnlineAgent sessions and model gateway calls use model services directly and do not require an `agAgents` record; persisted Agent definitions are optional evidence, not a prerequisite. Enabled services establish configuration before the first call, while old usage records alone do not prove current configuration. Unreadable configuration leaves the status unconfirmed unless another execution path is confirmed active; unknown subparts are omitted and their metrics remain unavailable. Collection and usage reads remain read-only and never call a model provider or expose credentials.

## What it does not do yet

- It does not claim exhaustive module associations: opaque service wiring, computed requests and unsupported source layouts remain unassociated.
- It reads the default connection only.
- Organization support remains unrecognized. The audit category says no supported provider has been recognized; it does not claim that additional Pro or custom providers cannot supply audit capabilities.
- It does not verify migration checksums, report upgrade times or official test results, all of which need evidence it cannot read today.
- The interface capability reports the languages the server offers; it cannot count the application's pages, which the application's own router owns.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-foundation lint
pnpm --filter @nocobase/app-plugin-foundation typecheck
pnpm --filter @nocobase/app-plugin-foundation test
pnpm --filter @nocobase/app-plugin-foundation build
```

## Dynamic capabilities and provider discovery

The built-in collector catalog is an ordered set of adapters, not the complete universe of NocoBase capabilities and not a fixed display denominator. The optional `availableCapabilities` response contains runtime-specific items. Existing `capabilities` observations remain for compatible consumers. The browser merges Client-only registration evidence into the same pure selection model, without replacing server usage facts.

The host retains the explicit Server registration snapshot (`app.registeredServerPlugins`) and Client registration snapshot (`runtime.registeredPlugins`). This covers plugins contributing only services or locales, independently of package scope, naming conventions or a hardcoded provider list. The Foundation plugin reads these snapshots; other plugins do not need a reporting integration. Older hosts fall back to partial public contribution evidence.

Known providers are associated with supported capability groups. A registered provider with no category adapter becomes an independent `extension:<packageName>` item, so a newly injected Pro or custom plugin can grow the band without editing a capability enum. The item uses the installed or resolved manifest title and version and has an undetermined usage status. Its presence means registration, not configuration or use. Unregistering an unknown extension removes its item. Recognized installed capabilities stay in the band as unused when there is no current registration or usage evidence; installation alone never marks them active. Historical database records do not establish current use after unregistration.

Discovery also reads direct application dependencies and known providers for the package inventory. Generic `./server` exports do not identify plugins. Filesystem locations, dependency URLs and plugin options never reach the API response. Source labels come from an explicit Foundation catalog; an npm scope or proprietary license alone verifies neither official origin nor Pro edition.

The registration registry establishes which Client/Server plugins were connected, but cannot generically infer the semantics or actual usage of arbitrary plugin code. Foundation-owned adapters still provide detailed configuration, metrics and Collection ownership rules. Unknown runtime extensions keep their usage pending; business totals are withheld when unknown ownership could mix plugin rows into business data. CLI-only and application-local modules without Client/Server registration are not counted as registered extension items. This page is not an exhaustive inventory of every function exported by every package.

Refresh collects current evidence again. Configuration collections are read in stable pages rather than treating the first 1000 records as an exact total; a failed page leaves the statistic unavailable. Client resources cover all ten supported locales.

## Business modules and capability matrix

When an embedded host points the application root at an archive extraction directory without a `package.json`, Foundation reads the package inventory and built page associations from the package containing the resolved server directory. Local development continues to prefer the source application root, even when a previous build exists.

The plugin derives modules from the current Client navigation tree. A top-level menu page or group is a module; its child pages, drawers and tabs belong to that module. Titles use the owning application's or plugin's locale namespace. Guest routes and Foundation itself are excluded. Adding, removing or renaming registered routes updates the matrix without an application-specific module list. Matrix columns use the same dynamic capability list as the band, including registered Pro and other extensions.

Associations have explicit evidence: a registered page uses the interface, required authentication uses accounts, and explicit page authorization uses permissions. A plugin-owned page can establish its provider's single recognized category; a multi-category package alone cannot establish which capability the page uses. The Foundation server parses readable page declarations and follows referenced value symbols from the selected page export through local aliases, re-exports, functions and components. Literal API-client requests, including templates with dynamic path segments, are matched by HTTP method and path to explicit root-mounted Hono endpoints. Router mounts and base paths are composed across local modules. Literal request arguments can pass through selected local helpers, JSX props and destructured defaults; finite literal arrays can supply generated route names, conditional loaders and endpoint paths, and proven host API repository clients match explicitly registered Repository API exposures and enabled actions. Matched exposures also preserve their Collection names for the matrix explanation. Only those endpoint handlers and their referenced values contribute backend dependencies. Unused imports, unrelated exports in a barrel/shared file, uncalled class methods, other endpoints and unreferenced routers do not establish module use. Installation and global registration alone never fill the matrix. These checks identify static integration dependencies rather than proof of past execution; explicit package-local singleton/instance service bindings can connect a selected service method and its constructor dependencies to the endpoint. Ambiguous bindings and opaque service factories remain unassociated instead of borrowing a provider's complete import graph.

The parser reads files without evaluating application code or invoking page loaders. Package-local real paths, at most 400 source files per package and 512 KB per file bound the scan; filesystem paths, code and raw errors are absent from the response. This server-only parser uses TypeScript as a runtime dependency. Results share the overview cache and Refresh operation and the existing unrestricted administrator boundary. The matrix has no storage, migration or new kernel change.

Source discovery currently supports conventional `client/routes` entries, relative imports, package `imports` aliases and explicitly root-mounted API routers. Loader factories, computed imports, component overrides and alternate entry layouts may be unavailable. Register `foundation` from `@nocobase/app-plugin-foundation/cli` in `cli/plugins.ts` (the default template does this). Its `afterServerBuild` hook runs `pnpm nocobase foundation modules build` to write `dist/server/foundation-modules.json`. This versioned, application-bound artifact preserves only route/provider associations, not source code, absolute paths or configuration values. Repeated generation produces identical bytes; the runtime validates it and uses it only when application page declarations are absent. Existing deployed applications must rebuild after registering this CLI contribution to gain the artifact. Deployed applications without readable page declarations or a valid build artifact retain navigation and permission evidence; opaque backend wiring and unsupported plugins stay unassociated. A blank cell means not identified, never proof that the module does not use the capability. No per-module execution numbers are inferred. Hover or focus a module tag to highlight its capabilities; select a matrix checkmark to read its integration evidence and the work that would otherwise need to be implemented. On narrow screens the matrix becomes module cards.

The capability detail lists its automatically associated business modules beside the application evidence, so readers can connect a shared capability to their own business before inspecting package names. Static API dependency matching respects the request method (`GET` when omitted) as well as the path; computed methods stay unassociated, and type-only re-exports do not establish dependencies. A failed refresh retains the last successful result with a visible warning and unchanged collection time. If a refresh returns `401` or `403`, the page hides cached internals and shows the access boundary instead.

### Existing application analysis

Static module tracing recognizes `useService(apiClientToken)` as well as `useApiClient()`. Local hooks may return a React `useCallback` request function; arguments remain scoped to each invocation so one request's method cannot be paired with another request's path. Literal tuple destructuring, unshadowed `String()` conversions and local literal conversions with decidable branches are supported. Hono registration helpers retain their router and literal arguments. Opaque calls, side-effecting conversions and unknown inputs remain unassociated. These associations are generated during the application build, so an existing deployment must rebuild with the updated Foundation plugin before its matrix changes.

## Sidebar grouping

Use `foundation({ settingsGroup: true })` in a bare application to wrap the protected page in a localized System settings group. The default template enables this on initial creation. The group disappears when its page is denied; the navigation helper merges it into the application settings group when that group becomes available.

The host can call `groupFoundationNavigation(items)` from `@nocobase/app-plugin-foundation/client` in its existing `client/lib/navigation-transform.ts` hook, after permission filtering. The helper places an already-visible Foundation entry last in the existing `settings` navigation group, avoiding a separate sidebar group gap. Pass the host’s group name as the second argument when different. It preserves route identity, `/foundation`, authorization and other navigation metadata, never creates a hidden entry and leaves Foundation standalone if no settings group exists. The App needs only the hook call; grouping logic stays in this plugin and does not change Core or the sidebar renderer.

Related package names and versions appear once inside the selected capability detail, combining the capability adapter's packages with providers classified into that capability and deduplicating by package name. Discovery counts and diagnostic evidence remain internal and are not rendered on the value page. Unclassified registered extensions remain selectable in the capability band and display their own package and version without treating registration as proof of use.

## Large applications

The data-modeling overview returns at most five Collection names plus the full catalog total. View all collections opens an on-demand list, with at most 50 names in each response and case-insensitive search over the complete owned catalog. `GET /api/foundation/collections?offset=0&search=orders` returns `{ data: [...], meta: { total } }` under the same unrestricted administrator boundary. Uncertain ownership or an unavailable catalog returns `503 FOUNDATION_COLLECTIONS_UNAVAILABLE`. There is no new table, migration or application-specific module map.

Known catalog totals remain visible when schema inspection or explicit row counting exceeds its deadline; unavailable fields are not reported as zero. Row counts are retained in the service process, invalidated when the catalog table names change, and require a new explicit count after a process restart. The overview still inspects the default connection catalog and supported schema definitions; it is not constant-time in the number of Collections. Matrix icon headers provide localized tooltips on hover and keyboard focus, including inactive capabilities.

Each Collection definition is inspected independently. A missing definition (including a Collection removed after the catalog was listed) or a failed definition read makes the data-modeling result partial while retaining confirmed table/view totals and the catalog preview. Field and relation totals include only readable definitions and carry `complete: false`; when none can be read, both values are `null`. A present empty definition still reports an exact zero. Refresh retries definition reads, and schema failures retain the last successful business record count and its original collection time. Responses contain only sanitized source issue codes, never driver errors or connection details.

Static module discovery uses the same conventional entry resolution for applications and registered plugins in source and published packages: `client/routes`, `server/routes/index` or `server/routes`, and `server/providers/index`, `server/providers` or `server/service-provider`, with a `dist/` fallback for each entry. Source entries take precedence in a checkout. Compiled local service dependencies still contribute only through a matched endpoint and selected service method. A recognized page request whose backend entry or local dependencies cannot be read marks its route and aggregate analysis incomplete; a page without backend requests does not require a backend entry. The existing package realpath and scan limits apply to both layouts.

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
