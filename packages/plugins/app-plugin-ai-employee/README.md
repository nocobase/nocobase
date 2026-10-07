# @nocobase/app-plugin-ai-employee

Publishable NocoBase App plugin that owns the application-specific AI employee runtime: Hono routes and authentication, database collections and repositories, conversation orchestration, agents, built-in employees/tools/skills, file services, and resource loading order.

The package depends on `@nocobase/ai-employee` for framework-neutral contracts, repository ports, managers, resource loaders, provider implementations, and helpers. The dependency is one-way; the core package does not import this plugin.

## Plugin entries

- `server/plugin.ts` is the only server runtime entry and contributes provider lifecycle, routes, and migration location.
- `server/provider/ai-employee.ts` registers App-container-scoped repository and service factories, initializes package resources before the application's external `ai/` directory, and synchronizes `ai.llmServices` on configuration reload.
- `server/route/index.ts` creates the authenticated routes under `/api`: the employees at `/api/aiEmployees`, and every other AI resource — conversations, files, models, LLM services, MCP servers, skills, tools and usage — at `/api/aiEmployee/...`. Every route requires a signed-in session and answers 401 without one, and names one guard from `server/route/settings-access.ts` first: `signedIn` for the chat, its files and the model catalog, or `settings(...)` for what the AI settings pages do, which names the AI settings permissions the route accepts and answers 403 `AI_SETTINGS_ACCESS_REQUIRED` without any of them (see [AI settings permissions](#ai-settings-permissions)). `tests/app/route-table.ts` lists every route with the permissions it accepts, and the route tests fail on one the router registers differently, so a new route has to be placed deliberately. Routes validate their input with `apiValidator()` and the zod schemas in `server/route/schemas.ts`, answer `{ data }` (a list `{ data, meta }`), and report failures in the standard error body with domain `aiEmployees`; domain behavior is delegated to factory-owned services. Every route also declares itself for the application's API document with `describeRoute()`, under the tag `AiEmployee` with an `operationId` starting `aiEmployees`, its response schemas in the same `schemas.ts`, and the shared declarations of a streaming run in `server/route/openapi.ts`; a new route declares itself too, and `tests/app/openapi.test.ts` fails on one that does not. A signed-in caller reads the generated document at `/api/swagger/docs` (Swagger UI) or `/api/swagger` (JSON). The [Skill's API reference](skills/nocobase-app-plugin-ai-employee/references/api-reference.md) is the full contract, including the behavior the document only summarizes.
- `server/provider/checkpoint-cleanup.ts` schedules the `checkpoint-cleanup` job on the application's jobs service under the scope `@nocobase/app-plugin-ai-employee`, as `ai.checkpointCleanup` describes.
- `server/service/ai-mcp-server-service.ts` synchronizes MCP servers from `ai.mcpServers` in `config.yml` and exposes read, test, enable-switch, tool-inspection, and tool-permission operations.
- `database/collections` defines the AI Employee collection layout, and `database/migrations` creates it through the App migration system.
- `@nocobase/app-plugin-ai-employee/cli`, registered in the application's `cli/plugins.ts`, contributes the `ai-employee models` and `ai-employee test` commands.

## LLM service configuration

Declare LLM service defaults in `server/config/ai.ts` and deployment overrides in `config.yml`, keyed by service name:

```yaml
ai:
  llmServices:
    openai:
      title: OpenAI
      provider: openai
      enabledModels:
        - label: Selected model
          value: '<model-id-from-models-command>'
      overrideEnabledModels: false
      enabled: true
      sort: 10
```

The key is the service name, so an entry has no `name` field. The model value above is a placeholder: replace it with an ID returned by the provider, never one recalled from memory. The user writes a secret into ignored, untracked `config.yml` with `pnpm nocobase config set --from-env ai.llmServices.openai.options.apiKey=OPENAI_API_KEY`, using a variable they set privately. When the environment injects it instead, map the variable in `env` of the application's `server/config/ai.ts`, such as `env: { OPENAI_API_KEY: envString('llmServices.openai.options.apiKey') }`. An agent must never request or expose secrets, configuration contents, `.env`, or environment values in its context or output; a silent local script may read the file only to update the selected `enabledModels`. Use `pnpm nocobase config check` for diagnostics.

The configured service name set is authoritative, including an empty map. Changes to `config.yml`, `.env`, or the environment variables the application maps take effect when the server restarts; on load the configured set reconciles additions, structural updates, and removals, and existing records preserve the user-managed `enabled` and `enabledModels` values — so those two take effect from configuration only when a service record is first created. Every other field of an existing record is rewritten from configuration on each load, and replaced rather than merged: an entry without `options` resets them to `{}`, and one without `modelOptions` resets them to the defaults. A service that sets `overrideEnabledModels: true` has its configured `enabledModels` reapplied on every load instead, overwriting what the settings page holds; the switch is per service, defaults to `false`, and governs the model list alone, leaving `enabled` with the administrator. Each configured `enabledModels` array is converted internally to custom mode; `mode` is not part of the application config contract.

`enabledModels` is the menu a service offers, not an access control boundary. It decides what the model selector and `GET /api/aiEmployee/models` list, and which model `resolveModel()` falls back to when a caller names none; a service with an empty list offers nothing and disappears from the selector. It is not checked when a caller does name a model, so a request or a stored employee configuration naming an unlisted model still runs.

## Discover and test models from the CLI

Run these from the application root after registering the plugin's `./cli` entry in `cli/plugins.ts`:

```text
pnpm nocobase ai-employee models <service> [--search keyword] [--json]
pnpm nocobase ai-employee test <service> --model <id> [--json]
```

`<service>` is a key in `ai.llmServices`, not a provider name unless the two happen to match. Both commands use the application's final configuration, including mapped environment overrides, without starting the server or accessing the database. They support built-in providers only, do not load custom providers registered by application startup, and never enable models or change persisted settings. `models` lists provider model IDs; listing an ID is not proof that this account can call it. `test` sends a minimal completion that can incur provider charges and reports callability only, not model capabilities, streaming, tools, attachments, or end-to-end employee readiness. Obtain approval for the paid request; do not run it automatically as a configuration check.

`--search` filters model IDs by a case-insensitive substring. `--json` prints the standard CLI envelope, `{ schemaVersion: 1, ok, command, status, result | error, warnings }`, rather than a bare list. Check `ok` and the exit status before using `result`: `models` returns `{ service, provider, models: [{ id }] }`, and a successful `test` returns `{ service, provider, model, callable: true }` without the completion text.

For a new service, complete setup **before its first server start**:

1. Declare its non-secret service fields, initially without `enabledModels`. Keep the server stopped so development auto-restart cannot initialize an empty model list.
2. Run `pnpm nocobase config check`. Have the user set any missing secret themselves, then rerun the check without reading configuration values.
3. Run `pnpm nocobase ai-employee models openai --json`, optionally adding `--search keyword`, and choose a real returned ID.
4. Use a silent local script to update only `ai.llmServices.openai.enabledModels` with the selected `{ label, value }` entries, preserving other fields, secrets, and comments. Do not output configuration or sensitive errors. Run `config check --no-connect` and wait for confirmation before startup.
5. Start the application for the first time with this service. After approval, run `pnpm nocobase ai-employee test openai --model <id>` with the selected ID, then send a real chat message to verify the employee workflow.

By default, test only the user's specified model or the first selected model; test all models only on explicit request. Report the tested ID without implying that untested models passed.

For custom providers, start the application so its provider is registered and use **LLM services** at `/settings/ai/llm-services` for discovery and selection. Use that page for already initialized services as well: `enabledModels` in configuration is bootstrap-only by default. Editing it or running either CLI command does not update the stored list; use the UI unless configuration ownership through `overrideEnabledModels: true` is intentional. A successful CLI test can coexist with an empty or disabled UI model list because the CLI does not inspect database state.

## MCP server configuration

Declare MCP servers in the application's `config.yml`; the settings page cannot create, edit, or delete a connection:

```yaml
ai:
  mcpServers:
    filesystem:
      transport: stdio
      command: npx
      args:
        - -y
        - '@modelcontextprotocol/server-filesystem'
        - /tmp
    remote:
      transport: http
      url: https://mcp.internal/mcp
```

Credentials are set the same way as an LLM key, at a path such as `ai.mcpServers.remote.headers.Authorization`; the value is the whole header, `Bearer <token>` included.

Each start synchronizes the configured server set and rebuilds the MCP client. Servers are stored in `aiMcpClients`; an existing server keeps the enable switch an administrator set, and tool permissions are saved on the server's row, so both survive restarts. The settings page switches each server on or off, lists the tools discovered from each configured server, sets each tool's permission (`ASK` or `ALLOW`), and tests connections; the switch and the permissions are both persisted. A connection test names a configured server, or gives an inline `http`/`sse` URL, and never runs an inline `stdio` command. Removing or renaming a server in `config.yml` discards its switch and tool permissions. The configured server name set is authoritative, including an empty map.

## Checkpoint cleanup

Agent checkpoints are stored in `lcCheckpoints`, `lcCheckpointBlobs` and `lcCheckpointWrites` under the thread id `<sessionId>:<thread>`, and a conversation starts on thread 1, which is also the default of `aiConversations.thread`. A job on the application's jobs service releases conversations nobody has used for `retentionDays`, every day at 03:00 UTC by default: it deletes the checkpoints of every thread the conversation has had and sets its `thread` to `0`, in one transaction per batch, deleting by `threadId` in lists of at most 500 ids, which every supported dialect accepts. Messages are untouched. Thread 0 therefore means released: the next run on such a conversation replays its latest 50 stored messages onto a fresh thread, as editing a message does, and one with no stored messages runs as before. A resume or a tool decision never replays, and neither does an agent created with a `persistence` of its own. A conversation whose latest message asks for a tool call is never released, and the release only succeeds while the conversation is still unused, so a run starting meanwhile keeps its checkpoints.

```yaml
ai:
  checkpointCleanup:
    enabled: true
    cron: '0 3 * * *'
    tz: UTC
    retentionDays: 7
    batchSize: 100
    # jobs: redis   # a key under `jobs`; omitted, `jobs.default`
```

Every field is optional. An invalid section is a `config check` error and the plugin refuses to start on it. `enabled: false` removes the rule from the backend at the next start. An application without `JobExecutorServiceProvider` starts without the cleanup and logs a warning.

## Conversation center

Settings navigation groups the plugin under **AI**, with sibling **AI Employees** (`/settings/ai`), **Skills** (`/settings/ai/skills`), **Tools** (`/settings/ai/tools`), **Conversations** (`/settings/ai/conversations`), **LLM services** (`/settings/ai/llm-services`), and **MCP services** (`/settings/ai/mcp-services`) pages. LLM and MCP services are standalone pages, not tabs; legacy service-settings links redirect to the corresponding page. AI Employees renders only employee management, with no cross-feature tabs; internal employee detail/editor tabs are unchanged. Other plugins contribute standalone Settings entries with `parent: 'aiGroup'`. The exported tab registry is deprecated and no longer renders contributed content or navigation. Legacy knowledge-base/vector tab query and location-state links redirect to `/settings/ai/knowledge-base` and `/settings/ai/vector-database`, which require the owning Knowledge Base plugin; their path helpers now target those standalone pages. The conversation center is a standalone read-only page, not an employee-settings tab. Authenticated users authorized to access AI settings can page through every user's main conversations and filter them by user, AI employee, and title, in any combination. Each row names its owner and employee. Opening a row shows its transcript in a drawer at `/settings/ai/conversations/:sessionId`, rendered by the Registry chat's read-only message list, and older messages load on request without marking the conversation as read. Tool approvals, message editing, resending, and tool execution are unavailable in this view. Sub-agent sessions are not listed separately: each appears inside the main conversation that delegated to it.

The filters and the page are kept in the URL (`userId`, `aiEmployee`, `title`, and `page`), so a refresh, a shared link, or back and forward restores them; opening and closing a transcript keeps them too. The title search waits for typing to pause and replaces the history entry instead of adding one per search.

The management endpoints are:

- `GET /api/aiEmployee/managedConversations` with optional `q` (part of the title, at most 200 characters), `userId`, `aiEmployeeUsername`, `page` (at most 10000), and `pageSize` (at most 100). It answers `{ data, meta: { page, pageSize, total } }`, main conversations only, newest first, and each row carries `user` (`id`, `name`, `username`) and `aiEmployee` (`username`, `nickname`, `avatar`), or `null` when either no longer exists. Both are read in two batched queries per page.
- `GET /api/aiEmployee/conversationOwners` with optional `q` (part of the name or username), `userId`, `page`, and `pageSize` (at most 100, default 20), answering `meta: { page, pageSize, total }`. It returns only users who own a main conversation, which is what the user filter searches, so it reveals nobody the list would not show anyway.
- `GET /api/aiEmployee/managedConversations/{sessionId}/messages` with an optional `pageToken`, the `meta.nextPageToken` of the previous page, answering 404 `CONVERSATION_NOT_FOUND` for an unknown session.

Every query parameter may appear once; a repeated, blank, or malformed value answers 400. All three enforce authentication and `read` on the `ai.conversations` AI settings item independently of frontend navigation, and answer 403 without it. Permission Sets determine access, and a grant of every page does not include it; legacy `session.user.isRoot` and `roles` fields are not an authorization source. The AI employee filter reads `GET /api/aiEmployees`, which accepts `read` on `ai.conversations` as well as on `ai.employees`. A user's own conversations, at `/api/aiEmployee/conversations`, keep their ownership checks and answer 404 for a conversation that is not the caller's.

## AI settings permissions

A Permission Set grants the AI settings under System management → AI, one `settings` item per settings page, which `server/provider/authorization.ts` registers and `shared/authorization.ts` lists for the server and the client alike:

| Item               | `read`                                             | `manage`                                                              |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------- |
| `ai.employees`     | The employees page, its list and each employee     | `PATCH /api/aiEmployees/{username}`                                   |
| `ai.skills`        | The skills page                                    | —                                                                     |
| `ai.tools`         | The tools page                                     | —                                                                     |
| `ai.llmServices`   | The LLM services page and list                     | Enabling a service and choosing its models, `providerModels` included |
| `ai.mcpServers`    | The MCP services page, servers and their tools     | Enabling a server and setting its tools' permissions                  |
| `ai.usage`         | The usage statistics page                          | —                                                                     |
| `ai.conversations` | The conversation center, and every user's AI files | —                                                                     |

`manage` does not include `read`: a page opens with `read`, and without `manage` it shows the same settings with its controls turned off (`useCanManageAISettings()` in `client/settings-permissions.ts`). A route two pages share accepts either page's `read`: the employee list for the conversation center's filter, and the skill and tool lists for the employee editor. A grant of every page does not include any of these items. `database/migrations/202610070001_ai_employee_settings_permissions.ts` gives every item and action to each Permission Set that held the earlier `{ type: 'page', id: 'ai.settings' }` grant.

## Skills catalog

The **Skills** menu immediately follows **AI Employees** in the AI settings group. It opens a standalone read-only, responsive card catalog of all discoverable AI employee skills, rather than only the skills assigned to one employee. Each card presents the title, identifier, and description above a tools footer with a Wrench icon and wrapping tool badges. The endpoints `GET /api/aiEmployee/skills` and `GET /api/aiEmployee/skills/{name}` require authentication and `read` on the `ai.skills` AI settings item, as the page does. The list returns skill titles, names, descriptions, and associated tool metadata without Markdown content. Clicking a card or activating its title button with the keyboard loads its details into a drawer with the title, description, safely rendered skill Markdown, and tool list. Closing the drawer returns focus to that card's title button. Unavailable tool references remain visible rather than being silently omitted. Search filters skill metadata and tool names locally; loading, empty, no-match, and retryable error states are supported. Viewing a skill never executes its tools. The list also serves the employee editor, so `read` on `ai.employees` lists skills too. Skills are registered in code: no route creates, updates or deletes one, and the page does not list application-development Agent Skills.

## Employee tool selection

The employee's **Tools** tab shows one flat list of every catalog source and scope, plus saved names that are currently unavailable. Each row has a separate enable switch and permission control. CUSTOM tools retain editable Ask/Allow permissions while enabled; disabling a tool preserves its saved permission. GENERAL and SPECIFIED tools display their registered permission read-only. Catalog failures disable tool edits and offer an in-place retry without resetting the employee draft.

`skillSettings.enabledTools` is an authoritative allowlist when present, including `[]` for no tools. Missing or `null` values retain legacy eligibility: GENERAL tools from all sources, configured tool names, tools associated with effective skills, and the available `getSkill`, `subAgentWebSearch`, and `knowledge-base-retrieve` system tools. This is eligibility, not immediate activation: skill tools still require loading their skill, and optional system tools retain their runtime capability checks. The first switch change snapshots this eligibility, preserving unknown saved names. Unrelated saves preserve missing, null, and empty overrides and never discard tool permissions.

## Tools catalog

The **Tools** menu immediately follows **Skills** in the AI settings group at `/settings/ai/tools`. Its read-only cards show each registered tool's title, identifier, description, and declared scope/source when present. Search filters titles, names, and descriptions locally. Opening a card loads a right-side drawer with a fixed header, safely rendered About Markdown, and an inert JSON view of the input schema. A missing schema is shown as unavailable; an empty schema remains `{}`. Schema references are displayed as text, never fetched or executed. Keyboard activation, Escape dismissal, focus return, loading, retryable errors, empty results, and request cancellation are supported. There are no execution or mutation controls.

`GET /api/aiEmployee/tools` returns `{ data: ManagedToolSummary[] }`, where each summary contains `name`, `title`, `description`, `about`, `scope`, `source`, and `defaultPermission` strings. `GET /api/aiEmployee/tools/{name}` returns `{ data }`, the summary plus `inputSchema: Record<string, unknown> | null`. Both require authentication and `read` on the `ai.tools` AI settings item, as the page does. The employee editor reads the same list, so `read` on `ai.employees` lists tools too. Tools are registered in code: no route creates, updates or deletes one.

## Development showcases

Plugin-owned Demo pages live under `client/dev` and are mounted with `defineDevRoutes()` under the `/dev/ai-components` menu group. They exercise the canonical Registry components but are not part of the application-owned Registry item and are excluded from production application builds.

`pnpm build` compiles the plugin-owned development pages with the rest of the Client source and copies runtime skill Markdown to `dist/ai/skills`. This copy is required by application builds that vendor only compiled package output. `defineDevRoutes()` keeps development pages out of production application bundles.

## Runtime data and report skills

`data-metadata`, `data-query`, and `business-analysis-report` are GENERAL employee runtime skills, not coding-agent Skills. Their eight backend tools are SPECIFIED and become callable through the existing `getSkill` activation flow. Current session skill/tool restrictions still apply to previously loaded skills.

Data access requires the Authorization plugin and an explicit `<connection>.<collection>` registration with a `read` action, field definitions, and permission grants for the trusted conversation user. Missing authorization or unmapped collections fail closed, even for a root-marked actor. Main and delegated employees retain the same user identity; tools cannot choose another user or role.

See [data capability boundaries](server/service/data-capabilities.md) for supported filters, temporal semantics, one-hop relations, bounded group domains, precision, pagination, and deployment resource controls. Query tools do not execute arbitrary SQL or fetch all records for in-memory aggregation.

Reports accept strictly structured charts and 1-based `{{chart:n}}` references. The server returns validated, normalized report data with `success`, `chartCount`, `errors`, and `warnings`; the Registry renderer previews only that confirmed output, never unvalidated tool arguments. Markdown-only reports remain supported. No report tables or new persistence/export products are introduced.

After a build, run `AI_SKILLS_PACKAGE_SMOKE=1 pnpm test tests/data-skill-package-smoke.test.ts` from this package to verify both root-asset and dist-only deployment layouts without server source files.
