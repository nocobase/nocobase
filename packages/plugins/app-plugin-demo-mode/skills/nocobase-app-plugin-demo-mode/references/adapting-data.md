# Adapt business data

Use the application's database and authorization Skills for its schema, services and grants. Reuse its existing business pages and lifecycle methods; the example's project/task schema is only for a new application without a business domain.

## Map the demo to records

Choose fictional records that make the requested journeys useful, in the user's language. Preserve relationships, totals, ownership, valid states and chronology. Do not copy real customer data or credentials into a public demo.

| Journey                        | Required records                                      | Verification                                                       |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------ |
| A rep opens “My opportunities” | Customers and related opportunities owned by that rep | Expected records appear; another rep's private records stay hidden |
| A manager opens the pipeline   | Opportunities across relevant stages and dates        | Chart totals match the list                                        |
| A rep opens an opportunity     | Related contacts and recent activities                | The existing detail page and timeline render correctly             |

Map the story to the application's actual collections and services. Use enough records to demonstrate the requested behavior; add volume only for pagination or performance requirements.

## Dataset contract

Import `DemoDataset` and the original `demoDataToken` from `@nocobase/app-plugin-demo-mode/server/tokens`. Register one dataset from an application provider's `boot()`, after its business services are registered. The maintained [typed dataset](../assets/minimal-demo/server/demo/dataset.ts) and [business adapter](../assets/minimal-demo/server/demo/business.ts) show the pattern.

Supply `id`, `languages`, `accounts(language)`, `generate(context)` and `clear(context)`. For weighted progress stages, use `steps(language)` instead of `generate`, never both. Registration must not generate or clear data at startup.

- Write through application services so validation and lifecycle transitions run. Use `context.actorId` when a service needs the importing administrator.
- Track created business records with `context.track(collection, ids, { key })`; `key` is needed only for a non-`id` key. Tracking supplies membership and counts, not business deletion. Use `setData` for identifiers the cleanup needs and `progress` for meaningful generation stages.
- Use `context.clock` for recent, coherent dates. If daily variation is wanted, `clock.sample(stableKey)` provides reproducible values for the import day. Add `timeZone(language)` or `counts(context)` only when the defaults do not fit.
- A dataset with no visitor accounts returns `[]` from `accounts()`. Model `answers` are optional; see [simulation](simulation.md).

When ordinary sample installation uses the same story, share an application-owned generator and adapt each entry's identity and clock. Demo generation must not invoke the core sample registry or change seed history; sample installation must not invoke demo clear/reset.

## Visitor accounts

Keep `accounts(language)` and `createAccount()` on one shared definition with explicit passwords satisfying the host's authentication policy. Use `createPermissionSet`, `createAccount` and `assignPermissionSet` for identities and grants. Every listed account is publicly enterable while quick sign-in is enabled, as intended; list any role the demo should show, administrators included.

Create demo-owned Permission Sets rather than assigning a built-in administrator role, whose last active assignment may prevent account cleanup. Supply any `roleScopes` marked `requiredOnCreate`. Assign a Permission Set through either `permissionSets` or its role scope, not both.

### Keep the executing administrator available

Clear and failed-import cleanup automatically preserve the executing administrator's current enabled state, password, sessions, assignments and required Permission Sets, including role scopes. HTTP operations use the authenticated, authorized user ID; scheduled reset uses the dataset's recorded actor ID. CLI import and clear still require `--actor`; reset may reuse the recorded actor and fails if none exists. No new permissions are granted. Ordinary demo accounts are disabled and lose their assignments, while all business data is cleared.

Necessary tracking and ownership remain so generation/reset can reuse the same account and Permission Sets. Successful regeneration reconciles obsolete tracked grants. A later clear by a different administrator applies ordinary cleanup to the previous dataset-owned actor; accounts outside the dataset are never disabled or adopted. After clear, use normal password sign-in; quick sign-in lists accounts only while a dataset is ready.

### Update demo accounts

Reset after changing account definitions, then verify credentials and effective permissions. Clear disables ordinary accounts for reuse; reset preserves sessions when credentials are unchanged and revokes them when passwords change.

On reuse, omitting a `roleScopes` key preserves its previous value. To remove an optional multi-value scope, supply an explicit empty array, such as `roleScopes: { app: [] }`; other scopes require a host-supported replacement value. Verify an operation the removed role used to allow is now denied.

## Business cleanup

Implement retry-safe `clear(context)` for all business data in the dedicated demo, including visitor additions, partially generated rows, files and caches. Stop and drain application-owned jobs and active writes first; remove dependent records before parents. Preserve system identities, authorization, secrets, demo configuration and the environment model. The plugin handles its tracked accounts and Permission Sets.

The same callback runs for clear, reset and failed generation. Accept empty or partial context and retain enough information to retry failed cleanup. The plugin does not wrap the whole generation in a transaction or restore previous business data; use the application's transaction boundaries where needed.

If an operation fails, inspect its error and verify business rows and account access before retrying. For an identity conflict, check the configured username and email against the intended demo account; do not adopt an existing unrelated identity or edit private tracking tables.

## Verify the application adapter

Check the requested pages under representative visitor accounts, including relationships, recent dates and role-specific access. Run reset and clear/generate to verify repeatability. For writable demos, add visitor content and verify cleanup removes it, including associated files and caches. Test partial-generation cleanup for the business adapter. Check [external integrations](integration-checklist.md) only where the application uses them.
