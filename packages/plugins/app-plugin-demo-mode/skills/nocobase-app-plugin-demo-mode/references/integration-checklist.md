# Integrate demo mode into an application

The order of work when an application adopts this plugin, and the mistakes earlier integrations made at each step. Each item names what to deliver and how to check it. Read [Adapt demo data](adapting-data.md) for the dataset itself and [Model and execution simulation](simulation.md) for Agents.

## 1. Register and decide the scope

- Register the Server plugin, the Client factory and `@nocobase/app-plugin-demo-mode/cli` in the application's composition roots, and add the package's build hook if the application vendors or packages plugins itself.
- Decide with the user, before writing code: which languages, which roles and how many accounts, whether clear/reset removes only the demo's records (`clear`) or all business data (`clearAll`, demo instances only), whether visitors may write anything in read-only mode, and whether Agents answer from scripts. Record those decisions in the application's development guide.

## 2. Inventory every external boundary first

List every way the application's code can reach outside the process, then decide for each what a demo record gets. Search the code for the transports, not only the obvious client: `fetch`, `undici`, `node:https`/`node:http`, `node:dns`, sockets, SDK clients, mail and notification channels, drive uploads, queue producers, model gateways, Runner dispatch. Earlier integrations missed a public-page reader that resolved DNS and connected with `https.get` on its own, outside the application's network layer.

- Route requests made for demo records to an in-process responder at one layer every caller already uses, keyed by trusted persisted ownership (a marker on the project or tenant row), never by a client flag. A request the fixtures do not cover fails with a clear error; it never falls through to the network.
- Recognize demo scope in every process: read the persisted marker when the process starts and again before an unknown scope sends anything, so another instance's import or clear cannot leave a demo scope talking to real services.
- Give fixture data real shapes by running the application's own collection, parsing and saving code against the responder, rather than writing finished results directly. Pages that query upstream services on view keep working, and the stored formats follow the code as it changes.
- Mail, notifications, payments, repository pushes and publication must refuse or be simulated explicitly in demo scope; a disabled simulation never means "use the real one".

## 3. Find what runs by itself

Background jobs, schedules, timers and catch-up ticks act on demo records too. An automatic daily analysis once replaced a demo's hand-written insights a minute after import, because it caught up "today's run".

- For each job, decide: skip demo scopes, run against the in-process responder, or accept that it changes demo content. Skipping is usually right for jobs that rewrite curated content; leave the manual trigger working so the feature can still be shown.
- Make sure a job that starts during an import cannot collide with it (on SQLite one connection serves both).

## 4. Write the dataset

Follow [Adapt demo data](adapting-data.md). In addition:

- Write each language as its own content, with names that read naturally in it; tie authored comments and owners to the demo people so "my tasks" means something for each account.
- Give demo accounts roles the demo owns (`createPermissionSet`), scoped to the demo's own projects or tenants. Do not hand a demo account the application's built-in administrator role: a role's last active assignment is protected, so clearing could not disable that account.
- An application that does not configure account deletion gets demo accounts disabled on clear, and enabled again on the next import; check its users plugin configuration rather than assuming deletion works. When deletion is configured, set `keepAccounts` on the dataset: the users plugin keeps a deleted account's username and email reserved, so the next import could not create the account again.
- When the application registers a role scope marked `requiredOnCreate`, pass its value as `roleScopes` on each account spec; the plugin applies it again when an import reuses the account.
- Inside a transaction of a legacy or ORM layer, do not query through another connection API; on SQLite that deadlocks or fails. Run those deletes before or after the transaction.

## 5. Let visitors do what the demo is for

In read-only mode every request write is refused. Decide which interactions the demo must still allow and register each as a write capability with a persisted scope check, wrapped around exactly the authorized operation with `runWrites`.

- Typical candidates: starting a task in a demo project, handing an opportunity to an Agent, saving knowledge, and online Agent conversations. Without a conversation capability, visitors cannot talk to the simulated model at all.
- Map the actions that may write to their capabilities in one table at the dispatcher instead of nesting wrappers.
- Rules start empty; tell administrators which ones to enable, or enable them as part of the deployment and say so.

## 6. Simulate Agents convincingly

Follow [Model and execution simulation](simulation.md). A simulated Runner that completes instantly with a fixed text reads as fake: play a transcript back over tens of seconds, with thinking, tool calls whose results come from the record's real material, the submission and usage, so the application's existing run view shows a run in progress. Business AI calls that expect JSON need scripted answers per operation, in the scope's language.

## 7. Build the page and permissions

- Build the demo page on `useDemoData()` (and the configuration endpoints when the application exposes them). Protect the route with an ordinary page grant given together with the settings grants; do not add demo checks to the shared navigation, which runs on every page.
- Show what clear and reset delete in the application's own words before they run.

## 8. Verify in a running application

Automated tests prove contracts; earlier integrations still shipped a run view that crashed only in the browser.

- Import, then open each principal page as each demo account in both languages; start a task and watch its run view update; ask the online Agent a question; clear and reset.
- Run the demo in read-only mode as a visitor would. Confirm that what should work works and that everything else is refused.
- Leave the demo for longer than its scheduled jobs' interval and check nothing curated was rewritten.
- Trace one request per external boundary and confirm it stayed in process; report boundaries you could not exercise.
