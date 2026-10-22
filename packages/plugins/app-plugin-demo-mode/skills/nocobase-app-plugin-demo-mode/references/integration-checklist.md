# Integrate demo mode into an application

The order of work when an application adopts this plugin, and the observable result at each step. Each item names what to deliver and how to check it. Read [Adapt demo data](adapting-data.md) for the dataset itself and [Model and execution simulation](simulation.md) for Agents.

## 1. Register and decide the scope

Confirm that the user needs a dedicated demo system, not only sample records in an existing application. The latter uses sample seeds or `sampleDataToken` without this plugin.

- Register the Server plugin, the Client factory and `@nocobase/app-plugin-demo-mode/cli` in the application's composition roots, and add the package's build hook if the application vendors or packages plugins itself.
- Infer from the request and existing application guidance: which languages, which roles and how many accounts, the full business cleanup boundary (this is a dedicated demo instance), whether visitors may write anything in read-only mode, and whether Agents answer from scripts. Record those decisions in the application's development guide.

## 2. Inventory every external boundary first

List every way the application's code can reach outside the process, then decide for each what a demo record gets. Search the code for the transports, not only the obvious client: `fetch`, `undici`, `node:https`/`node:http`, `node:dns`, sockets, SDK clients, mail and notification channels, drive uploads, queue producers, model gateways, Runner dispatch. Include transports that bypass the application's usual network layer.

- Route requests made for demo records to an in-process responder at one layer every caller already uses, selected by the server’s demo environment configuration, never by a client flag. Persisted markers may select fixture content, but an unmarked record in a demo environment must not reach a real provider. A request the fixtures do not cover fails with a clear error; it never falls through to the network.
- Recognize demo scope in every process: use the server environment mode, including for unmarked visitor-created records and queued work.
- Give fixture data real shapes by running the application's own collection, parsing and saving code against the responder, rather than writing finished results directly. Pages that query upstream services on view keep working, and the stored formats follow the code as it changes.
- Mail, notifications, payments, repository pushes and publication must refuse or be simulated explicitly in demo scope; a disabled simulation never means "use the real one".

## 3. Find what runs by itself

Background jobs, schedules, timers and catch-up ticks act on demo records too. Catch-up jobs may overwrite freshly generated content.

- For each job, decide: skip demo scopes, run against the in-process responder, or accept that it changes demo content. Skipping is usually right for jobs that rewrite curated content; leave the manual trigger working so the feature can still be shown.
- Make sure a job that starts during an import cannot collide with it (on SQLite one connection serves both).

## 4. Write the dataset

Follow [Adapt demo data](adapting-data.md). In addition:

- Write each language as its own content, with names that read naturally in it; tie authored comments and owners to the demo people so "my tasks" means something for each account.
- Give demo accounts roles the demo owns (`createPermissionSet`), scoped to the demo's own projects or tenants. Do not hand a demo account the application's built-in administrator role: a role's last active assignment is protected, so clearing could not disable that account.
- Demo accounts are always disabled on clear and re-enabled on import. Do not add deletion or restoration policies.
- When the application registers a role scope marked `requiredOnCreate`, pass its value as `roleScopes` on each account spec; the plugin applies it again when an import reuses the account.
- Inside a transaction of a legacy or ORM layer, do not query through another connection API; on SQLite that deadlocks or fails. Run those deletes before or after the transaction.

## 5. Let visitors do what the demo is for

In read-only mode request writes need an exception. For disposable business tables, configure whole-collection exceptions when normal application authorization is sufficient. Register capabilities and wrap the authorized operation with `runWrites` when it needs narrower operation or record scopes. See [policies](policies.md).

- Typical candidates include starting a task, saving a note or updating a demo record. For Agents online conversations, use the dedicated `runOnlineConversation` persistence boundary and chat policy in [simulation](simulation.md#online-conversation-persistence); do not register protected Agent tables as business capabilities.
- Map the actions that may write to their capabilities in one table at the dispatcher instead of nesting wrappers.
- Rules start empty; tell administrators which ones to enable, or enable them as part of the deployment and say so.

## 6. Simulate Agents convincingly

Follow [Model and execution simulation](simulation.md). When showing task progress is part of the requested demo, play back a short simulated transcript through the existing run view. Otherwise an immediate, clearly simulated result is sufficient. Business AI calls that expect JSON need scripted answers per operation, in the scope's language.

## 7. Build the page and permissions

- Mount the plugin's `DemoModeSettings` page (`client/settings`) with the application's `label` and `chatTools`. Protect the route with an ordinary page grant given together with the settings grants; do not add demo checks to the shared navigation, which runs on every page.
- Show what clear and reset delete in the application's own words before they run.

## 8. Verify in a running application

Automated tests cover contracts; verify the requested user journeys in a browser too.

- Import, then open each principal page as each demo account in the supported languages; clear and reset. If the demo includes tasks or online Agents, exercise those flows too.
- Run the demo in read-only mode as a visitor would. Confirm that what should work works and that everything else is refused.
- If background jobs are enabled, observe a relevant run and check that curated content is not unexpectedly rewritten.
- Trace one request per external boundary and confirm it stayed in process; report boundaries you could not exercise.
