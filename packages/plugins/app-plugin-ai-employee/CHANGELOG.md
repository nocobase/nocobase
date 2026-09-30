# @nocobase/app-plugin-ai-employee

## 1.0.0-beta.28

### Minor Changes

- 0459df1: Use plugin-owned Base UI shadcn primitives for AI employee settings, with accessible multi-select controls, density-aware switches, and consistent theme tokens. Employee detail Tabs, notices, errors, empty states, badges, list rows and form fields now use the shared Tabs, Alert, Empty, Badge, Item and Field primitives, so labels are associated with their controls and the active employee is announced. MCP tool permissions use the same Ask/Allow menu as employee tools, and the MCP tool count is a single translated message. Make employee tabs and skill, tool, model, and MCP details addressable through child routes, preserve unsaved drafts across tabs, and ask before unsaved edits are discarded by switching employees, closing the model editor, or going back or forward to another employee or out of the model editor. These guards work under the host application's `BrowserRouter` and need no data router; reloading or closing the page warns through the browser. Report MCP permission update failures without losing the previous selection. When no LLM or MCP service is configured, its settings page explains that services are declared in the application configuration and offers a prompt to copy to a coding agent opened in the application directory.

  Remove the unused conversation-center settings page and its route. Retain the public conversation client methods and deprecated path constant for compatibility. The public Registry recipes and authorization model are unchanged.

  **Breaking.** The deprecated AI settings tab registry is removed: `registerAISettingsTabs`, `getAISettingsTabs` and `AISettingsTabDefinition` are no longer exported from `@nocobase/app-plugin-ai-employee/client` or `./client/ai-settings`, and `AISettingsShellProps` no longer accepts `activeTabKey` or `onTabChange`. Registered tabs had already stopped rendering, so only code that still calls or passes them has to change: contribute a Settings route with `parent: 'aiGroup'` instead.

### Patch Changes

- Updated dependencies [3d44c4c]
  - @nocobase/app-server@1.0.0-beta.31
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-cli@1.0.0-beta.10
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.21

## 1.0.0-beta.27

### Minor Changes

- 64cf25a: Check `ai.llmServices` in `config check`, and warn about a service with no key

  `defineAIConfig`, exported from `@nocobase/app-plugin-ai-employee/server/config`, declares the `ai` section with the plugin's validation, the way `defineAuthConfig` does for `auth`. With it, `pnpm nocobase config check` reports a structural problem in `ai.llmServices` — the list form, a `name` field, a wrong field type or an empty `provider` — as an error by path, instead of the start failing on it later. A service whose built-in provider sends `options.apiKey` and has none is reported as a warning naming that path, with the `config set --from-env` command that sets it; `ollama` and providers an application registers are not checked. An application that keeps a plain `defineAppConfig` for `ai` still starts, with the section unchecked until then; switch `server/config/ai.ts` to `defineAIConfig` to get the checks.

- 414956d: Add runtime `ai-employee models` and `ai-employee test` commands to discover built-in provider model IDs and verify model access before application startup, without connecting to the database or exposing credentials or completion content. Both commands support the standard CLI JSON envelope.

  Register the commands in the Default and Examples templates and document selecting initial enabled models before the first startup. Existing applications must register `@nocobase/app-plugin-ai-employee/cli` in `cli/plugins.ts` and provide the plugin's `@nocobase/app-cli` and `@oclif/core` peers as production dependencies. Model selection for already initialized services remains in the management UI; these commands do not modify database model lists.

- 64cf25a: Key `ai.llmServices` by service name, and stop expanding `${NAME}` in AI configuration

  **Breaking.** `ai.llmServices` is now a map keyed by service name, like `ai.mcpServers`, instead of a list of entries that each carry a `name`. The list form, and a `name` field inside an entry, are rejected at startup with a message naming the path. Each service therefore has a stable configuration path, such as `ai.llmServices.openai.options.apiKey`, which `pnpm nocobase config set` can write and an `env` mapping can target; neither can address an item of a list.

  **Breaking.** `${NAME}` in `ai.llmServices` and `ai.mcpServers` is no longer expanded, and `expandEnvironmentReferences` is no longer exported. The plugin read those values from `process.env`, which a built server started with `pnpm start` does not merge `.env` into, so a key kept in `.env` became an empty string there. A key is now written into `config.yml` with `pnpm nocobase config set --from-env`, like a database password. Where a service manager, container or CI injects it instead, the application maps the variable in `env` of `server/config/ai.ts`, which reads the process environment together with `.env` and `.env.local` in development and in a built server alike, and `pnpm nocobase config env` lists it.

  The plugin's Skill follows: an agent writes the service entry without the key and without invented model ids, tells the user the key's path to set rather than asking for the key or building a command that reads one, and has the models picked on the LLM services page, which fetches them from the provider with the configured key.

  To upgrade an application:

  1. In `config.yml`, and in `config.example.yml` if it lists services, move each `ai.llmServices` entry under its name and delete its `name` field — `- name: openai` followed by its fields becomes `openai:` followed by the same fields.
  2. For each `${NAME}` under `ai.llmServices` or `ai.mcpServers`, write the value into the untracked `config.yml` with `pnpm nocobase config set --from-env <path>=<VARIABLE>`, such as `ai.llmServices.openai.options.apiKey=OPENAI_API_KEY`. Where the environment injects the key instead, remove the value and map the variable in `server/config/ai.ts`, declaring the section with `defineAIConfig` from `@nocobase/app-plugin-ai-employee/server/config` in place of `defineAppConfig`: `env: { OPENAI_API_KEY: envString('llmServices.openai.options.apiKey') }`, with `envString` from `@nocobase/app-server/config`. Either way the value is the whole field, so a header such as `Authorization: Bearer ${TOKEN}` needs `Bearer <token>`.
  3. Run `pnpm nocobase config check`, which now warns about any `${NAME}` left in either section, and `pnpm nocobase config env` when a variable is mapped.

### Patch Changes

- 64cf25a: Remove the SQL identifier quoting and `DB_UNDERSCORED` naming rules from the AI employee system prompt. AI employees read data only through the Repository-backed data tools, which take Collection and field names and apply the Connection naming strategy themselves, so the instructions to write SQL and convert names to snake_case described a capability they do not have.
- 64cf25a: Remove the unused `knownRoles` option and getter from the AI employee service, together with the `AI_DEFAULT_ROLES` environment variable it read. Nothing passed the option or read the getter, so setting the variable had no effect; AI employees take roles from the requesting actor.
- Updated dependencies [64cf25a]
- Updated dependencies [aeff80a]
- Updated dependencies [aeff80a]
  - @nocobase/app-cli@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.30
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 1.0.0-beta.26

### Major Changes

- db16945: Toasts go through a toaster that `@nocobase/app-client` defines and the application implements, so code that reports a result no longer depends on how toasts are rendered.

  - **App client.** `useToaster()` returns the application's `Toaster`. Its `show({ type, title, description, action, duration, id, onClose })` returns an id that `close(id)` takes, and `resolveToaster(app.services)` returns the same toaster outside React. The application registers the implementation under `toasterToken`; `@nocobase/app-client` registers none. Without one, nothing throws: each toast is logged to the console instead, an error toast as an error, and the first says how to register a toaster. Clicking a toast's action runs its `onClick` and leaves the toast open.
  - **Templates.** `client/lib/toaster.ts` forwards toasts to the Base UI `toast` manager that the mounted `Toaster` renders, and decides their presentation for the whole application: an error written as plain text is announced at once, while one with an action, or with an element for its title or description, keeps the default priority. `client/service-provider.ts` registers it in `register()`. The account menu, the language switcher and the Examples route overlay demo show their toasts through `useToaster()`.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `useToaster()` instead of `Toast.useToastManager()` from `@base-ui/react/toast`, and no longer choose a toast's priority. They need the `@nocobase/app-client` that exports it, and the application has to register a toaster: without one nothing throws, but their toasts only reach the console, and a Hub page whose only content is an error shows nothing. They no longer require a Base UI `Toast.Provider`.
  - **Skills.** The frontend references and each affected plugin's Skill describe `useToaster()`, and the `nocobase-app-upgrade` edge case "Notifications and the application toaster" replaces "Notifications and the Base UI toast".

  Upgrade an existing application with the `nocobase-app-upgrade` Skill, which brings `client/lib/toaster.ts` and its registration together with the new `@nocobase/app-client` and plugin ranges; follow the same steps when upgrading by hand. `pnpm nocobase plugin update` is not enough on its own: the plugins stay inside the application's `^1.0.0-beta` ranges, so it installs them, but it leaves `@nocobase/app-client` where it is, and their pages then fail to load for want of `useToaster`.

### Patch Changes

- Updated dependencies [db16945]
  - @nocobase/app-client@1.0.0-beta.23
  - @nocobase/app-plugin-authentication@1.0.0-beta.24

## 1.0.0-beta.25

### Major Changes

- 46ce11f: The client services no longer share a module-level API client. Each service function takes the application's API client as its first argument, and `createAIEmployeeClient(api)` and `useAIEmployeeClient()` return an `AIEmployeeClient` with all of them bound to one client. The `nocobase-ai` registry's `NocoBaseAIService` requires a client in its constructor, the `nocobaseAIService` singleton is removed, and `AIProvider` requires its `service`; `NocoBaseAIRootProvider` still creates one from `useApiClient()` when none is given.

### Patch Changes

- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
  - @nocobase/app-client@1.0.0-beta.22
  - @nocobase/app-server@1.0.0-beta.29
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.21

## 1.0.0-beta.24

### Patch Changes

- ba07587: The `nocobase-app-plugin-ai-employee` Skill's frontmatter is valid YAML again. Its unquoted `description` contained a colon followed by a space, which YAML reads as the start of a nested mapping, so Skill loaders that parse the frontmatter strictly skipped the Skill entirely.

## 1.0.0-beta.23

### Major Changes

- 2217eb2: Remove `@nocobase/app-plugin-notification-provider` and show every notification through the Base UI toast the templates already ship. The package is no longer published, and Sonner is no longer a dependency of anything.

  - **Templates.** `client/react-providers.ts` mounts the `Toaster` from `client/components/ui/toast.tsx` once, in the `application` layer, and the account menu and language switcher call `toast.add` from `@/components/ui/toast`. A rule at the end of `client/styles.css` lifts the toast viewport above dialogs and sheets, which share its `z-50`. The plugin and `sonner` leave `client/plugins.ts` and `package.json`, and no Refine notification provider is registered.
  - **Plugins (breaking).** Hub, Users, Workflow and AI employee pages report through `Toast.useToastManager()` from `@base-ui/react/toast` instead of Sonner or Refine's `useNotification()`, so they now require the application to mount a Base UI `Toast.Provider`; without one their pages fail with `Base UI: useToastManager must be used within <Toast.Provider>`. They move to `1.0.0` for that reason, which keeps an existing application's `^0.1.0` ranges, and so `pnpm nocobase plugin update`, from installing them before the toaster is in place. Hub notifications appear where the application's toaster places them rather than top-right. `sonner` and `@refinedev/core` are no longer peers.
  - **Skills.** The frontend references describe `toast.add` from `@/components/ui/toast` in place of Sonner, and each affected plugin's Skill names the toaster requirement and the error that reveals it.

  Upgrade an existing application by moving to this template release with the `nocobase-app-upgrade` Skill, which brings the new plugin ranges together with the toaster. Its "Notifications and the Base UI toast" edge case (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) lists the steps, their order, and how to verify the pages afterwards; follow the same steps when upgrading by hand.

### Patch Changes

- Updated dependencies [757eedf]
- Updated dependencies [1b139b6]
- Updated dependencies [02d5402]
- Updated dependencies [dbf5631]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [757eedf]
  - @nocobase/app-plugin-authorization@0.2.0-beta.20
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/app-plugin-authentication@1.0.0-beta.24
  - @nocobase/app-client@1.0.0-beta.21
  - @nocobase/logging@0.1.0-beta.6
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.22

### Minor Changes

- c2aceaa: Require a session on every `/api/ai` action, and AI settings access behind the settings page

  **Breaking.** Every `/api/ai` action now requires a signed-in session and answers 401 without one; the actor is read from that session. The actions that configure AI — `llmServices`, `aiMcpServers`, the management actions of `aiEmployees`, `aiTools` and `aiSkills`, and `ai:listProviderModels` — also require access to the AI settings page (`page:ai.settings`) and answer 403 without it. The chat stays open to every signed-in user: conversations, files, `aiEmployees:listByUser` and `updateUserPrompt`, `ai:listAllEnabledModels` and `ai:listLLMServices`.

  - **LLM services are configured in `config.yml`.** `llmServices:create`, `update` and `destroy` are removed; the settings page changes a configured service through `llmServices:updateEnabled` and `llmServices:updateEnabledModels`, which answer 404 for an unknown name. On the client, `updateLLMService()` becomes `updateLLMServiceEnabled()` and `updateLLMServiceEnabledModels()`.
  - **MCP connection tests.** `aiMcpServers:testConnection` tests a configured server by `name`, or an inline `http` or `sse` server; an inline `stdio` server is rejected.
  - **File previews.** `aiFiles:preview` returns a file to the user who uploaded it; anyone else, and any file with no recorded uploader, needs AI settings access — not a root flag or a role name on the session. The file's record is authorized before its content is opened, so a refused request reads nothing from storage.
  - **Data tools.** They authorize as the user with every subject the authorization service resolves, so a collection granted through a team is readable by the assistant as it is on the page.

  Upgrading: an account that manages AI needs AI settings access; code calling `updateLLMService()` switches to the two narrower functions; and a stdio server is tested by its configured `name`.

- c2aceaa: Give an agent execution one state, one context and a result contract

  **Breaking.** An agent execution is now described once and reached through public types:

  - **One `AgentState`.** `parseAgentState()` builds it where the request body is parsed, and it reaches `createAIEmployee()` whole. `sessionId` is required, `model` is `{ llmService, model }`, and `messages` is `handoffMessages`, the message a sub-agent receives when the user answers its pending question with a new turn. `AgentServiceFactory` replaces `model` once, against the employee's own policy, and `SubAgentsDispatcher` replaces `sessionId` for a sub-agent's own conversation. `AgentRequest` keeps only what varies per call — `userMessages`, `userDecisions`, `messageId`, `writer`, `signal`, and `runtime` for middleware data — so a request can no longer ask for a model the employee does not allow.
  - **One `AgentContext`**: `actor`, `state`, `deps`, `runtime` (the host's `logger`, `translate` and `getHeader`) and `availableSkills`. `ai`, `database`, `repositories` and `services` are gone. A tool declares the container tokens it needs in `dependencies` and reads them, resolved and typed, from `ctx.deps`; a token the container cannot resolve fails the run naming the tool and the token. The context is bound when a tool is built, so an `agentContext` key on a request reaches nothing. The data tools declare an authorized, read-only reader rather than the database.
  - **Required identity.** `CreateEmployeeOptions` and `CreateAgentOptions` require `actor` and `runtime`, and `createAgent()` requires `sessionId`; neither fills in an implicit root any more. `CreateEmployeeOptions.tools`, which nothing could fill, is removed: an employee's tools come from its own `skillSettings`, narrowed by the conversation's `skillSettings`.
  - **A result contract.** `invoke()`, `resumeInvoke()` and `forkInvoke()` return `AgentInvokeResult`: the assistant turn as `message` in this package's `AIMessageInput` shape, or `null`; `structuredResponse` when the request passes a Zod `responseFormat`; and `interrupt: { id, actions }` when a tool paused the run for approval. An interrupted `invoke()` records the paused calls as `stream()` does, so a decision can be attached to them and the run resumed with `interrupt.id`.
  - **A conversation to run in.** `AIConversationsManager.create()` resolves to `CreatedAIConversation`, whose `sessionId` is a `string`.
  - **Exports.** `AgentRequest`, `AgentInvokeRequest`, `AgentInvokeResult`, `AgentInvokeInterrupt`, `AgentInterruptAction`, `AgentStreamEvent` and `CreatedAIConversation` are exported from `@nocobase/app-plugin-ai-employee/server`.

  Migrating: pass `state` and `runtime` to `createAIEmployee()` instead of `sessionId`, `webSearch`, `frontendTools` or `execution`; read `ctx.runtime.logger` rather than `ctx.logger`, and `ctx.state.handoffMessages` rather than `ctx.state.messages`; declare a token in `dependencies` wherever a tool read `ctx.ai`, `ctx.database`, `ctx.repositories` or `ctx.services`; pass the bound context as `buildTool(entity, ctx)`'s second argument; read `result.message` rather than `result.messages`; and pass an `actor` everywhere one was left out.

- c2aceaa: Classify agent failures, and report the real one

  An agent failure used to reach the caller as `Agent execution failed` with the code `PROVIDER_ERROR`, whatever had gone wrong, and `invoke()` discarded the underlying message on every run. Failures are now classified by the phase they occur in:

  - Anything thrown while resolving the model, the LLM service or the provider is `CONFIGURATION_ERROR`, a new `AgentServiceErrorCode`. `createAgent()` resolves its model and service completely when the agent is created and rejects there; `createAIEmployee()` rejects at creation only when the employee has no usable model at all, and otherwise when the run starts.
  - `invoke()` and `stream()` report the same message for the same failure, and `AgentServiceError.rootMessage` returns the deepest message in the cause chain, so a caller no longer walks `cause` itself. A provider without `parseResponseError()` no longer turns the failure being reported into a `TypeError`.
  - `AgentServiceError` and `AgentServiceErrorCode` are exported from `@nocobase/app-plugin-ai-employee/server`, so a caller can check `instanceof`, read `code` and `retryable`, and decide whether to retry.
  - Over HTTP the chat actions answer `200` with an SSE body whatever the run does, and a failed run arrives as an `error` event; that event now carries the failure's `code` when it is an `AgentServiceError`.

  **Breaking:** a caller that switches exhaustively over `AgentServiceErrorCode` has to handle `CONFIGURATION_ERROR`, and one that matched the literal message `Agent execution failed` now receives the real message instead.

- c2aceaa: Keep LLM services, provider model lists and an employee's model limits consistent

  - **`overrideEnabledModels`.** A configured LLM service kept the `enabledModels` stored in the database once it existed, so a model list in `config.yml` took effect only when the service was first created, and a service created without one stayed at zero models whatever was added later. A service that sets `overrideEnabledModels: true` has its configured list reapplied on every load; edits made in AI settings are then overwritten. It governs the list alone: a service an administrator disabled stays disabled even when its entry says `enabled: true`. It defaults to `false`.
  - **What `enabledModels` constrains.** It scopes the model selector, `ai:listAllEnabledModels` and the model `resolveModel()` falls back to; a caller that names a model is not checked against it. The documentation now says so, and `ModelService` loses `requireModel()`, an unreachable check that suggested otherwise.
  - **An employee's own models.** For an employee with its own model settings, the chat offers only the models it lists that are currently enabled, in its order, opens on the first, and sends the one it shows; the server runs no other. When none of them is enabled, the chat offers no model and cannot send, and the server rejects the run with a `CONFIGURATION_ERROR` rather than falling back to another model. Installed copies of the `nocobase-ai` Registry item get the chat half by updating.
  - **Breaking: provider model lists.** `LLMProviderMeta.models` is typed for embedding model suggestions alone, and `ai:listModels` answers only `model=EMBEDDING`. Chat models are listed from each provider's own API through `ai:listProviderModels`, and the hard-coded chat model lists nothing read are removed, as is the Tongyi provider, which was commented out and exported nothing.

- c2aceaa: Make MCP servers configurable only in `config.yml`, and keep their state

  - **Environment references.** `${NAME}` in `ai.mcpServers` — `headers`, `args`, `env` and `url` — was sent to the server literally; it is now expanded as it is for LLM services, and a missing variable becomes an empty string.
  - **Persistent state.** The enable switch and tool permissions set in AI settings reset at every start. Servers are now stored in `aiMcpClients`: `enabled` in `config.yml` applies when a server is first created and the switch is the administrator's after that, and tool permissions are saved on the server's row in a new `toolPermissions` column, added by a migration. Both belong to the server's name, so removing or renaming a server in `config.yml` discards them. The row holds the configuration with every `${NAME}` expanded, so a credential in `headers` or `env` is stored in plain text and is part of database backups.
  - **An unreachable server.** One server that did not answer stopped the application from starting. It is now skipped with a warning naming it, whose reason reduces any URL to its origin, and the other servers keep their tools. Nothing retries until the client is rebuilt — at start, or when a server is switched on or off.
  - **Unknown tools.** Setting the permission of a tool no connected server exposes answered success and kept nothing; `aiMcpServers:updateToolPermission` now answers 404, and `MCPServerManager.updateMCPToolPermission()` throws.
  - **Breaking:** `AIResourceRegistrarOptions.mcpDirectory` and the protected `AIResourceRegistrar.loadMCP()` are removed, since the configuration sync deleted any server registered that way on its next run. Move such servers into `config.yml`. `registerAIResources()` runs tools, then Skills, then employees.

### Patch Changes

- c2aceaa: Carry an application's AI Skills into its build, and load the plugin once

  - **Skills in the build.** `tsc` emits only TypeScript, so an application's `ai/skills` never reached `dist`, where a deployed server looks for them; they worked in development and disappeared once deployed, logged only at debug level. `@nocobase/app-tools` now copies the Markdown under `ai/skills` into the build, `references/` included. An application without `ai/` copies nothing.
  - **An import cycle at start.** The plugin's tools imported their container tokens from the modules that register those tools, so an application loading the plugin through its provider stopped with `Cannot access 'aiManagerToken' before initialization`. The tokens now live in a module of their own; each keeps its identity and its export paths.
  - **One copy in a source workspace.** Inside a workspace that links the plugin, `@nocobase/app-plugin-ai-employee` and its `./server` entry resolved to the built `dist/` while `./server/plugin` resolved to source, so an application importing `aiManagerToken` from `./server` loaded a second copy whose tokens never matched, and a stale `dist/` stopped the server. Both now resolve to source there. Published packages are unchanged.

- c2aceaa: Fix the `nocobase-ai` chat Registry item, and hold it to an application's lint rules

  Installed copies of the `nocobase-ai` Registry item get these changes by updating it.

  - **Lint.** Installing the item took a generated application from no lint problems to 118, because this package never linted the Registry source with the rules it lands under. It does now, and what the rules found is fixed: refs written or read during render, effects that set state synchronously, `String(value)` over untyped server fields rendering `[object Object]`, promises passed to event handlers, and list items keyed by index. A module that exports a component now exports only components, with its contexts, hooks and helpers in a sibling module such as `ai-context.ts` or `page-context-utils.ts`. Everything exported from `index.ts`, `providers/index.ts` and `components/index.ts` keeps its name; code that deep-imported a hook from a component module follows it to the sibling.
  - **A chat mounted before the configuration loaded** dropped every message without an error. Its stored employee now follows the one the chat resolves, and a send reads the current configuration.
  - **A floating chat opens on the chat's `defaultEmployee`.** `AIChatFloatingTrigger` without `aiEmployee` leaves the choice to the chat instead of opening the first employee, and `AIChatProvider` falls back to `defaultEmployee` when its initial selection cannot be found. `AIEmployeeTaskTrigger.aiEmployee` is optional.
  - **A web search toggle.** `AIChatWindow`, `AIChatCompact` and `ChatComposer` take `enableWebSearch`, which defaults to `false` and puts a web search toggle in the composer next to the file action. It is usable only when the selected model's `supportWebSearch` is `true`, and it switches off when the user moves to a model that cannot search. `AIChatProvider.webSearch` is where the toggle starts, and `useAIChatBase()` gains `webSearch` and `setWebSearch`; a chat that sets `webSearch` without mounting the toggle sends it as before.
  - **A form in a message's context no longer hides the employee's tools.** The chat sent `skillSettings: { tools: ['formFiller'] }` when no task named any tools, which the server reads as an allowlist and stores on the conversation, so for the rest of that conversation the employee could use only `formFiller` and the system tools. The chat now adds `formFiller` only to a task's own tool list.

- c2aceaa: Make a fixed agent follow its Skills and pause on a tool that asks

  - **Skills reach the model.** `createAgent({ skills })` activated the tools those Skills name but never gave the model the Skills themselves. A fixed agent given Skills now gets `getSkill`, bound to exactly those Skills, and its system prompt lists them the way an employee's does.
  - **A tool that asks pauses.** `createAgent()` ran every tool straight away, so a tool declaring `defaultPermission: 'ASK'` — or declaring nothing, which means the same — skipped review in the one kind of agent with nobody watching. It now runs unattended only when it declares `ALLOW`; otherwise the run pauses, `invoke()` reports `interrupt`, and `resumeInvoke()` continues it, as for an employee.
  - **Where a pause is kept.** A fixed agent keeps its pauses in the plugin's own checkpoint tables under the default persistence, so a newly created agent for the same session can resume them, and in the process beside a persistence the caller supplies. `createAgent()` accepts a `checkpointer` to choose otherwise, and `AgentServiceFactory` provides `getMemorySaver()` and `getDatabaseCheckpointSaver()` to build one without importing `@langchain/langgraph`. `createAIEmployee()` takes none: the chat and the conversation center resume an employee's run from the plugin's tables.

- c2aceaa: Fix attachments, direct provider calls, and web search on a provider that cannot search

  - **Attachments.** DeepSeek received no images, and a user dropping a screenshot was told the type is unsupported; images now go to the model as content blocks. Ollama failed the whole turn on a PDF; it now sends images as content blocks and documents through the document loader. An uploaded file kept only the ASCII characters of its name, so `客户截图.png` was stored as `.png`, and once a message was sent its attachments came back from history with no preview address, so an image showed as a plain file; `DriveFileStorage` now stores the name as given, minus any directory part, while only the storage key is reduced to safe characters, and history gives every stored attachment the preview address its upload returned.
  - **Web search that cannot search.** `subAgentWebSearch` asked for built-in search and invoked the model even on a provider that ignores the request, which then answered from training data with sources that looked real, reported as success. It now checks `supportWebSearch` and `webSearchModels` first, and returns an error naming what did not happen and what to use instead.
  - **Tools on a direct call.** `LLMProvider.prepareChain()` — and so `invoke()` and `stream()` — built `context.tools` with each tool's position in the list where its context belongs, and never resolved its `dependencies`. `AIChatContext` gains an optional `toolContext` (`{ agentContext, container? }`), and tools are built with the new `buildAgentTools()`, giving each the context and resolved `deps` an agent does; `createToolContext()` and `ToolRuntimeContext` are exported beside it, and the plugin's agents use the same function. Without `toolContext` a tool that requires a context fails when called. Built-in web search is meant for a call without tools: passing both now logs a warning, and binding is otherwise unchanged.
  - **Breaking (types only).** `AIChatContext.systemPrompt`, `decisions` and `middleware`, which a provider never read, are removed, and so is the unused `AIChatContextOptions`. A direct call's system prompt is a `role: 'system'` message at the start of `messages`; a paused run is resumed through `AgentService.resumeInvoke()`.

- 5537a22: Fit the AI employee and conversation settings pages to the available height on large screens, so the page no longer scrolls around the list, detail and message panes that already scroll on their own. On viewports too short for a usable layout the page keeps a minimum height and scrolls once as a whole.
- c2aceaa: Rewrite the AI Employee App Skill as a build order that matches the code

  The `nocobase-app-plugin-ai-employee` Skill synchronizes into every application that depends on the plugin, so an agent writes what it says. It is rewritten as a build order — configure a model, write the tool, register, define the employee, mount the chat, verify — with a table of what to build for what the user asked and completion checks that are observed rather than read back, and every rule in it is checked against the current code:

  - **Setup.** How to install and upgrade the `nocobase-ai` Registry item, and how to keep an LLM key out of the repository and the transcript: the user runs a hidden-input command built for their own environment and verified with fake values, with the exact rules for writing it into a shell profile, `config.yml` or `.env`, and why `.env.local` and the starting environment override `.env`.
  - **Chat.** The readiness gate, `defaultEmployee`, attachments enabled on every chat surface unless the user declines them, `enableWebSearch` on every chat surface unless the user declines web search, controlled dialog and side-panel surfaces wired to the controller that a floating trigger opens, tasks and their tool allowlist, page context and forms, and the plugin's working example pages under `/dev/ai-components`, with what not to copy from them.
  - **Server.** Employees and tools register only through `AIResourceRegistrar`, and Skills only as `SKILL.md` files; the agent contracts — state, context and declared dependencies, the `invoke()` result, interrupts, error codes; running an agent unattended, as a real service account, with the conversation's own `skillSettings`, a bounded interrupt loop and a timezone; and `createAgent()` with its Skills and checkpointer.
  - **Configuration.** LLM services and `enabledModels`, MCP servers — credentials in `headers` or `env`, what is persisted and what a rename discards — attachment storage, and web search only on a provider that searches.
  - **Runtime extensions.** A new reference covers dynamic tools, a custom LLM provider and a direct model call. It replaces the separate `nocobase-ai-employee` Skill that sat unpublished in `@nocobase/ai-employee`, which no application ever received.

  The application development Skill in `@nocobase/app-skills` names the AI Employee plugin in its table of installed plugins, so an agent building an assistant feature learns that the plugin and its Skill exist.

- c8ddd7d: Consolidate the authorization API. Resource types are either catalog types (`settings`, `composite`, `database.collection`), whose items and actions must be registered, or record types (`page`, `user`, `notification`, `hub.app`, `hub.host`), which declare type-level actions and judge each record; there are no `*` items. Business resources become composite resources, a built-in core mechanism: every Authorization has `authz.compositeResources` (which replaces `authz.business`) and reserves the `composite` resource type, so `businessPlugin()` is gone with no replacement and `resourceTypes.add({ type: 'composite' })` throws; `defineBusinessResource` is `defineCompositeResource`, every `Business*` type is `CompositeResource*` (`CompositeResource`, `CompositeResourceBuilder`, `CompositeResourceActionBuilder`, `CompositeResourceReference`, `CompositeResourceConditions`, `CompositeResourceApi`, `BindableCompositeResourcePermission` and so on) and the grant policy is `{ type: 'composite', scopes }`. Resource types carry no `title`: they are never displayed, and the library holds no translation keys. A composite composes exactly the grants its definition lists, on any type except another composite. A data scope no longer names a `collection`: it targets the one resource its grant actions address (`dataScopeTarget(action, key)`), whose type must declare `recordAccess: true` on `resourceTypes.add`, as `database.collection` does; `define` checks this when the type is registered, and `authz.compositeResources.validate()` and first use check types registered later. The library holds no display concepts. `@nocobase/app-plugin-authorization` provides `authz.ui`, also exposed to plugin setup contexts: `ui.sections.add` for the top-level sections `pages`, `business` and `administration` and one level of subsections (with `extend: true` for a subsection another plugin owns, as workflow owns `automation` and scheduler extends it), `ui.groups.add` for right-side groups, `ui.place(ref, { section, group? })`, and `ui.defaultSection(type, section)`. `pagesPlugin` registers the `pages.page` subsection, the only one the client fills, from its route tree. The client no longer remaps the `@nocobase/authorization` namespace. `authz.settings.add` no longer takes `section`; settings items and composites are placed with `authz.ui.place`, and unplaced ones land in their type's default section "Other". Startup validation runs after every provider has booted and reports unknown subsections and groups, placements of unregistered resources and unfit data scopes, throwing in development and logging a warning in production. A resource holds at most one default-access rule: the table is unique on `(resourceType, resourceId)` as well as `key`, and a second rule raises `DefaultAccessConflictError`, answered with 409. `authorizationToken` is the only service token: `permissionSetsToken` is gone, `authz.db` is now `authz.database`, settings items are registered with `authz.settings.add` and checked with semantic actions, and rule plugins build on `@nocobase/app-plugin-authorization/server/extension`. The client exposes `AuthorizationClient.snapshot/revision/invalidate/onInvalidated` and renamed management components. Every client page route must now declare `authz` (a check or `'skip'`); nothing is inferred from the route name. The authorization migrations and seeds were edited in place, including the new `key` column on default-access rules, so existing databases must be reset and reinstalled. A stored composite grant that no longer expands — an unknown action or data scope, an invalid scope value or policy — is skipped for that grant alone instead of failing every check of the identity: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, and `createAuthorization({ onInvalidGrant })` is told once, which the application plugin logs; `authz.compositeResources.validateGrant` explains a stored grant, and the plugin's startup validation scans every stored Permission Set, throwing in development and warning in production. `authz.database.collections.add` treats a re-registration with the same actions as a no-op even when its title or description differ, keeping the first and reporting a startup warning through `collections.warnings()`; only different actions throw. `authz.resourceTypes.get(type).items.add(item)` remains the generic low-level item registration that `settings.add`, `database.collections.add` and `compositeResources.define` build on.
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [c2aceaa]
- Updated dependencies [f6c3cd8]
- Updated dependencies [c8ddd7d]
- Updated dependencies [f3917b6]
- Updated dependencies [0b37436]
- Updated dependencies [d18e964]
- Updated dependencies [0231d46]
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/app-server@1.0.0-beta.26
  - @nocobase/app-client@1.0.0-beta.20
  - @nocobase/app-plugin-authentication@1.0.0-beta.23
  - @nocobase/app-plugin-authorization@0.2.0-beta.19

## 0.1.0-beta.21

### Patch Changes

- Updated dependencies [cda1175]
- Updated dependencies [e286e0d]
- Updated dependencies [808bf34]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [80ef702]
  - @nocobase/app-plugin-authentication@1.0.0-beta.21
  - @nocobase/app-plugin-authorization@0.2.0-beta.18
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/ai-employee@0.2.0-beta.7
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.20

### Patch Changes

- 709f9ed: Update Better Auth and API keys to 1.7.5 and align fresh authentication databases with provider-based account identity. Existing authentication databases must be recreated; the original account migration has changed and no compatibility migration is provided.
- d696700: Stop the `bubblegum` theme from turning settings pages into competing hues, and fix the token misuse it exposed.

  The preset was carried over from tweakcn verbatim, and upstream spends the generic surface and outline roles on decoration: `--card` was a cream 101 degrees of hue away from the pink `--background`, `--border` was `--primary` itself at chroma 0.18 against a median of 0.02 across the other thirty presets, and `--muted` was a cyan. One demonstration card and a few dividers carry that; a settings page stacking several panels over dozens of hairlines does not, and pages showed pink, cream, cyan and teal at once. Six light values are retuned — `--card`, `--border`, `--muted`, `--input`, `--sidebar-border` and `--sidebar-primary` — keeping those roles in the background's hue family and leaving the preset's colour in `--primary`, `--secondary` and `--accent`. The dark values, the radius, and every other preset are unchanged, and `THIRD-PARTY-NOTICES.md` records the deviation.

  The same pages also used tokens for something other than their role, which no neutral preset makes visible. Authorization's two page shells and four Hub pages painted the whole page with `bg-muted/20`, which is the page surface and belongs to `bg-background`; under a preset whose `--muted` is a real colour that was a film over the entire viewport. The AI employee page's read-only fields hand-rolled `bg-muted/40` instead of using the shared `Input` and `Textarea` with `disabled`, three information callouts were fixed `bg-blue-50`, and the MCP transport labels were fixed `bg-blue-100`/`bg-green-100`/`bg-amber-100`; the transports now take their three tones from the theme's chart series, which is what a preset defines to be told apart.

  Three fixed colours on settings pages are corrected while they are in hand. The AI employee page's missing-knowledge-base warning and the schedule detail page's target-issue icon named a light-mode ink with no dark counterpart, so both were close to unreadable on a dark card; they now carry one. The routes example reported a load failure in a fixed red, which is what `--destructive` is for.

  The theme authoring reference and the token reference now state the rule, so a preset converted tomorrow is checked against it.

- d696700: Give every settings surface the token that matches what it is, so panels stop disagreeing with one another.

  The permission set editor is where this shows: its two tabs sit in one panel, and the permission configuration tab painted itself `bg-background` while the assignment tab inherited the panel's `bg-card`, so switching tabs changed the page colour under the same heading. The same mistake is spread across the settings pages, and none of it is visible under a preset whose page and card are near-identical.

  Each token names a layer rather than a shade, and every site now uses the one that describes it. A panel resting on the page is `bg-card`, which is what the AI tools and skills pages already used while the LLM service, MCP service, conversation, API key, user and notification log panels named the page surface instead — two lists in one plugin, one framed and one flat. A dialog or drawer is `bg-popover`, which is what the shared `Sheet`, `Dialog` and `Popover` primitives use and what six hand-rolled drawers and dialogs did not. An opaque sticky header, footer or table head names the surface it scrolls within rather than the page behind it. A form control names no surface at all and inherits the one it sits on, the way the shared `Input` and `Textarea` do with `bg-transparent`; twenty hand-rolled inputs, selects and text areas were pinned to the page colour and showed through as a differently coloured box inside every card.

  The styling reference now states which token describes which layer, and why picking one because it happens to look right is what puts a page-coloured block inside a panel.

- Updated dependencies [709f9ed]
- Updated dependencies [d696700]
- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [3187ace]
- Updated dependencies [d4783c2]
- Updated dependencies [d696700]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/app-plugin-authentication@0.1.0-beta.20
  - @nocobase/app-plugin-authorization@0.2.0-beta.17
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/ai-employee@0.2.0-beta.7
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.19

### Minor Changes

- ff158aa: Group Settings navigation under AI with separate AI Employees, Conversations, LLM services, and MCP services pages while preserving legacy links. Add a read-only conversation center for searching and inspecting application-wide conversation history, protected by the application's AI settings Permission Set access. Reuse Registry conversation lists, message rendering, and history conversion, with safe read-only tool and sub-agent presentation.

  Make the AI Employees list collapsible and hidden by default, with a localized, accessible icon-only toggle centered on the left divider and no employee count or extra detail toolbar. Preserve the original bordered employee cards, 19rem expanded list, detail header, selection, and unsaved edits, with a reserved control gutter and touch-friendly sizing.

  Keep conversation search, pagination, and selection in the URL; improve responsive metadata, accessible search controls, localized timestamps, independent retries, and scroll anchoring when loading earlier messages. Align the Conversations page with the shared AI settings header, background, spacing, and content container while preserving its read-only controls and independently scrollable list and transcript.

- ff158aa: Add a standalone, read-only Skills catalog immediately after AI Employees with permission-protected management list and detail endpoints. Display associated tool names in a searchable table and show skill titles, descriptions, safe Markdown, and tool metadata in a detail dialog. Include English and Chinese translations, cancellation-safe loading, and retryable errors without executing tools or changing runtime skills endpoints.
- ff158aa: Add a read-only Tools catalog immediately after Skills in AI settings, with searchable cards and an accessible right-side details drawer. Show tool documentation safely and input schemas as inert JSON without execution controls. Add independently authorized management endpoints while preserving the existing runtime tools response contract.

### Patch Changes

- ff158aa: Add human-readable display titles to the built-in data metadata, data query, and business analysis report skills and their data tools. Replace legacy translation markers in all built-in tool titles and about text with plain English metadata so management views display readable text instead of internal resource names or unresolved templates.
- ff158aa: Constrain the AI employee editor to a viewport-responsive height and scroll overflowing tab content, including skills and tools, independently of the employee header, tabs, and save controls.
- ff158aa: Keep system and custom role editors at the same height, avoid marking an unchanged empty custom editor as modified, and align employee save actions with the editor's right edge.
- ff158aa: Expand the employee list by default when multiple AI employees are available, while preserving manual toggling. Let system and custom role editors fill the available detail area above the action bar.
- ff158aa: Sort the Skills and Tools management pages and AI employee skill and tool lists alphabetically by display title, falling back to the name when the title is empty, using a consistent case-insensitive order.
- ff158aa: Add matching icons to AI employee, skill, tool, LLM service, and MCP service settings navigation entries.
- ff158aa: Align AI settings route authorization contracts with the current application runtime and remove a duplicate conversation type import after integrating develop.
- ff158aa: Align LLM and MCP service settings tables with the standard administration table layout and page gutters, removing redundant card headings and nested padding. Clarify English and Chinese AI administration page descriptions and consolidate service configuration guidance into the LLM and MCP page introductions.
- ff158aa: Keep the employee list toggle visible and usable when only one AI employee is available, while leaving the list collapsed by default.
- ff158aa: Remove cross-feature tabs from AI Employee settings and its exported shell wrappers while preserving internal employee detail/editor tabs. Redirect legacy knowledge-base and vector-database tab URLs to their independent settings paths, preserving unrelated query parameters and hashes. Keep the tab registry and shell props as deprecated compatibility APIs without rendering contributed tabs; migrate custom tab contributions to Settings routes with parent `aiGroup`. Knowledge-base list/vector path helpers now target the standalone pages and require the owning Knowledge Base plugin's corresponding route update.
- ff158aa: Add employee skill enable switches backed by an optional `skillSettings.enabledSkills` allowlist. Omitted or null selections retain inherited GENERAL and registered skills, while an empty list disables every skill. Preserve explicit selections across built-in registration and repository reloads, intersect session restrictions, and reject unavailable skill content and persisted tool activations. Existing skill and tool settings remain compatible without a database migration.
- ff158aa: Add persistent employee tool selection with legacy inheritance for omitted or null selections and explicit disabling with an empty selection. Apply selections to discovered, injected, and skill-activated tools without allowing session settings to broaden access, preserve saved custom tool approval settings across registration and restart independently of explicit tool selections, and retain unknown saved names for future registrations. Selected optional tools still require their runtime capabilities, including current-user knowledge-base access.
- ff158aa: Hide Conversations from the AI settings sidebar while preserving its guarded route and legacy direct links.
- ff158aa: Remove the built-in data-modeling skill, which references unavailable tools. Keep the data-metadata, data-query, and business-analysis-report skills available.
- ff158aa: Keep Atlas as the only registered built-in AI employee, removing the Dex, Ellis, Lexi, Vera, and Viz definitions while retaining reusable skills and tools.

  Existing employee records and conversation history are unchanged; this release does not migrate or delete previously registered employees.

- ff158aa: Unify tool rows across employee configuration, skill details, and the tool catalog with fixed heights, truncated titles and identifiers, and two-line plain-text introductions with full hover text. Read employee tool introductions from introduction.about rather than model-facing descriptions, while preserving permission controls and tool-detail navigation.
- ff158aa: Keep skill cards at a fixed height, truncate long metadata, and collapse overflowing tool badges into a responsive +N indicator.
- ff158aa: Replace the Skills settings table with responsive cards showing skill metadata above a tools footer with a Wrench icon and wrapping badges. Preserve metadata and tool search, accessible drawer opening and focus return, safe detail rendering, and loading, empty, and retry states.
- ff158aa: Show localized skill counts alongside search and display tool introductions instead of model-facing descriptions in skill details. Include tool about fields in skill management responses.
- ff158aa: Align tool cards with skill cards using fixed heights, truncated text, and title links without hover underlines. Remove scope and source from tool cards and details.
- ff158aa: Organize tool details into labeled About, Description, and Input schema sections, and remove the redundant read-only schema hint.
- ff158aa: Present tools as a compact single-column directory with whole-row detail triggers, responsive identifiers, localized result counts, and two-line plain-text introductions. Preserve keyboard focus and existing detail drawers.
- ff158aa: Include tool introductions in management summaries and display and search the about field instead of the model-facing description in tool cards.
- ff158aa: Support package-owned i18n metadata for Tools and Skills, preserving English source text for model execution while translating display titles, Tool introductions, and Skill descriptions. Localize built-in resources in English and Chinese, sort catalogs by localized titles in the current locale with stable name tie-breakers, and document Client locale ownership and exact source-text keys.
- Updated dependencies [ff158aa]
- Updated dependencies [ff158aa]
- Updated dependencies [ff158aa]
- Updated dependencies [ff158aa]
  - @nocobase/ai-employee@0.2.0-beta.7

## 0.1.0-beta.18

### Patch Changes

- 8f5eacf: Document a configuration readiness gate for embedded AI chat so the first message can be sent after initial navigation or refresh without switching employees or models. Include complete integration examples, actionable loading and unavailable states, and first-send verification steps.
- 8f5eacf: Document conversation history response fields, stable message identifiers, pagination, nullability, and authenticated HTTP examples. Clarify the current SSE response limitation for non-streaming execution and distinguish history rows from message inputs and server agent results.
- 8f5eacf: Fix AI conversation keyword searches failing with a SQL binding error. Use native repository substring filters with literal wildcard escaping while preserving user and scope isolation and conversation ordering.
- 8f5eacf: Fix missing knowledge base options in the AI employee editor by using the knowledge base plugin's AI API route. Exclude disabled knowledge bases from the available options.
- 8f5eacf: Use the shared Dialog and Button components for the LLM model editor so backdrop clicks and Escape dismiss it, focus is managed and restored, and modal styling matches the application's component library.

  Use a searchable multi-select Combobox for provider models, with selected chips and the search input inside the same field. Filter by model label or ID, preserve selections while searching, and portal the options outside the editor's scroll container with viewport-aware list scrolling. Escape closes the picker before the editor.

  Show localized loading and empty states while discovering LLM services instead of leaving the settings table blank.

## 0.1.0-beta.17

### Patch Changes

- 64b3fdb: Integrate source-qualified database authorization and native relation policies with AI data services. Preserve explicit route group extensions, translated resource search, Hub ownership checks, API key cleanup, and protected permission-set assignments across user deletion. Update shared application guidance for the split authorization plugins.
- 64b3fdb: Remove Refine from client authorization checks. Use `AuthorizationClient.can({ resource, action })` instead of the removed two-argument signature, and import `useCan` from `@nocobase/app-plugin-authorization/client`. Migrate page guards, navigation, and notification visibility while preserving session isolation and realtime permission invalidation.

  Remove the Refine access-control configuration and legacy global authorization client accessors. Resolve the application-owned client through `useAuthorizationClient()` or `authorizationClientToken`. Settings actions now revoke stale access immediately; route checks no longer bypass the authorization page or translate Refine CRUD action names.

  Unify route authorization under `authz: 'skip' | { resource: { type, id }, action }`. Normalize default rules during registration and share them across page guards, navigation, permission discovery, and inspection. Remove the legacy `access` field and string resource adapter.

  Limit settings action checks to the actions each page uses, keep the permission-set action helper internal, and avoid rebuilding navigation twice when selecting a route.

- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [fe564d9]
- Updated dependencies [fe564d9]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
- Updated dependencies [64b3fdb]
  - @nocobase/app-client@1.0.0-beta.19
  - @nocobase/app-plugin-authorization@0.2.0-beta.15
  - @nocobase/app-server@1.0.0-beta.21
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/ai-employee@0.2.0-beta.6
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/db@1.0.0-beta.11
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.16

### Patch Changes

- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- Updated dependencies [e0c4b3d]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
- Updated dependencies [00362cf]
- Updated dependencies [e13ed84]
- Updated dependencies [e13ed84]
  - @nocobase/db@1.0.0-beta.10
  - @nocobase/app-server@1.0.0-beta.19
  - @nocobase/logging@0.1.0-beta.5
  - @nocobase/app-plugin-authentication@0.1.0-beta.18
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/ai-employee@0.2.0-beta.6
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1
  - @nocobase/app-plugin-authorization@0.2.0-beta.13

## 0.1.0-beta.15

### Minor Changes

- ec93611: Add discoverable data metadata, permission-scoped queries, and business analysis report skills for AI employees. Validate report charts on the server and render only confirmed report results. Reapply session restrictions to activated tools and include runtime skill assets in compiled deployment output.

### Patch Changes

- 365a9fe: Complete English and Chinese translations for authentication, route feedback, authorization, shared controls, File and Notification Registry components, and development examples. Use concise semantic keys consistently for the new translations. Resolve AI Registry copy from the active language and localize development navigation and section headings. Translate MCP configuration guidance, tool drawer labels, and transport descriptions.
- d4ca00e: Use useApiClient() for React API client access across application pages, plugins and shared examples, preserving application-scoped client resolution.
- Updated dependencies [d4ca00e]
- Updated dependencies [365a9fe]
- Updated dependencies [365a9fe]
- Updated dependencies [60fa139]
- Updated dependencies [24e771f]
- Updated dependencies [60fa139]
- Updated dependencies [26ac480]
  - @nocobase/app-client@1.0.0-beta.18
  - @nocobase/app-plugin-authorization@0.2.0-beta.13
  - @nocobase/app-plugin-authentication@0.1.0-beta.17
  - @nocobase/db@1.0.0-beta.9
  - @nocobase/app-server@1.0.0-beta.18
  - @nocobase/ai-employee@0.2.0-beta.6
  - @nocobase/caching@0.1.0-beta.2
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.14

### Patch Changes

- 028dd7c: Use host-provided peers for shared database types, authorization errors, service tokens, cache registries, and repository filter metadata. Declare their production providers in all application templates so deployments with automatic peer installation disabled retain the required runtime packages. Document the provider contract for generated plugins.

  Existing applications upgrading these packages must add compatible versions of their required shared peers to production dependencies: @nocobase/db, @nocobase/service-provider, @nocobase/repository-input, @nocobase/authorization, @nocobase/caching, @nocobase/i18n, and @nocobase/queue for the standard server stack, plus @nocobase/ai-employee when using its plugin. Update the lockfile and verify the production install; peer declarations do not remove incompatible historical versions automatically.

- Updated dependencies [028dd7c]
  - @nocobase/ai-employee@0.2.0-beta.6
  - @nocobase/app-client@1.0.0-beta.17
  - @nocobase/app-plugin-authentication@0.1.0-beta.16
  - @nocobase/app-server@1.0.0-beta.17
  - @nocobase/db@1.0.0-beta.8

## 0.1.0-beta.13

### Patch Changes

- 9131230: Use plugin-owned PageContainer and PageHeader components to unify AI component demo and in-app inbox page layouts.

## 0.1.0-beta.12

### Patch Changes

- 6acf3bc: Use plugin-owned PageContainer and PageHeader components to standardize AI settings page spacing and headings.
- d927494: Fix development startup of generated Hub applications by selecting the App Host launcher from the loaded package format, preserving source development in the workspace and using compiled JavaScript in installed packages. Keep the optional application configuration commented out so an empty YAML section cannot override application identity defaults during production startup. Correct the AI Employee plugin Skill namespace so generated applications can synchronize their registered plugins' Skills.
- 89955c5: Upgrade better-sqlite3 to ^13.0.3 and keep its dependency declaration in @nocobase/db-sqlite only. Remove redundant test dependencies from consumers so they use the same SQLite driver as applications.

  Preserve the bundled musl binary when building applications for Alpine Linux.

- Updated dependencies [89955c5]
  - @nocobase/app-plugin-authentication@0.1.0-beta.15
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7

## 0.1.0-beta.11

### Patch Changes

- 11c276a: 将 AI Employee Plugin Skill 移至插件标准的 `skills/` 源目录，确保发布包可以包含并同步该 Skill。

  Move the AI Employee Plugin Skill into the plugin-standard `skills/` source directory so it can be included in the published package and synchronized correctly.

## 0.1.0-beta.10

### Patch Changes

- 1c70f60: Persist AI employee collection field metadata so Oracle returns booleans and integers with their logical types. Let the database query layer encode and decode JSON once, and use a round-trippable name for the default LLM service field. This changes initialization definitions and requires recreating development databases initialized with the previous definitions.
- a60decd: Require an explicit absolute baseDir for Server plugins and resolve migrations, seeds, jobs, and package metadata from the loaded plugin copy. Generate and validate database task manifests during builds so TypeScript and JavaScript share source checksums, with verified legacy JavaScript history conversion and synchronized plugin scaffolding and application templates.
- 1a85a86: Add breadcrumb labels to plugin routes so nested pages show their navigation path.
- e067113: Depend on one zod major, so a deployment can resolve better-auth

  An application that installed both the AI employee plugin and the API keys plugin failed to start with `z.ipv4 is not a function`, thrown while loading `@better-auth/core`. Nothing in better-auth was wrong: the AI employee packages asked for `zod: ^3` while better-auth asks for `^4`, and a deployment installs `dist/` with `nodeLinker: hoisted`, where one version of a package takes the root slot and the rest are nested underneath whoever depends on them. zod 3 won the root, which forced better-auth's whole subtree to be nested, and a `@better-auth/core` that ended up next to the root zod bound to the wrong major.

  The same collision has a second failure mode that is harder to read. `@better-auth/api-key` declares `@better-auth/core`, `better-call`, `jose`, `kysely` and `nanostores` as peer dependencies, and a deployment sets `autoInstallPeers: false` so it installs none of them. It works anyway when better-auth's dependencies hoist to the root, because the peers are then sitting where the resolver looks; it stops working the moment the zod conflict pushes them down into `node_modules/better-auth/node_modules`, and the application fails with `Cannot find package '@better-auth/core'`.

  So the fix is not to declare better-auth's internals somewhere. `@nocobase/ai-employee` never imported zod at all and no longer declares it, `@nocobase/app-plugin-ai-employee` moves to zod 4, and all three templates and the plugin now take it from the `zod` catalog entry, so one version is what an application gets. Its schemas use `z.object`, `z.string`, `z.number`, `z.array`, `z.record`, `z.coerce`, `z.any` and `z.unknown`, all of which carry over unchanged; `buildStandardAgentMiddleware` gained an explicit `AgentMiddleware[]` return type, which the new resolution made necessary.

  A deployment tree now holds a single `zod` and a single `@better-auth/core`, hoisted to the root where `@better-auth/api-key` resolves them.

- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [63db898]
- Updated dependencies [a60decd]
- Updated dependencies [1a85a86]
- Updated dependencies [1c70f60]
- Updated dependencies [63db898]
- Updated dependencies [e067113]
  - @nocobase/app-server@1.0.0-beta.15
  - @nocobase/db@1.0.0-beta.7
  - @nocobase/app-plugin-authentication@0.1.0-beta.14
  - @nocobase/app-client@1.0.0-beta.16
  - @nocobase/ai-employee@0.2.0-beta.5
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.9

### Patch Changes

- 154e09e: Treat a credential Better Auth refuses — an expired or revoked API key — as not signed in when resolving the caller, instead of failing the request.
- Updated dependencies [154e09e]
- Updated dependencies [154e09e]
- Updated dependencies [c01baf6]
  - @nocobase/app-plugin-authentication@0.1.0-beta.12
  - @nocobase/i18n@1.0.0-beta.4
  - @nocobase/app-client@1.0.0-beta.15
  - @nocobase/app-server@1.0.0-beta.13

## 0.1.0-beta.8

### Patch Changes

- a2dbe54: Publish only the compiled `dist/database`, no longer the TypeScript sources beside it. The runtime resolves a plugin's declared `database/migrations` and `database/seeds` against the package directory first and its `dist` second, so an installed plugin that shipped both served the sources, and Node refuses to strip types from a file under `node_modules`: `@nocobase/app-plugin-ai-employee` failed every application start with `Stripping types is currently unsupported for files under node_modules` while every development checkout, which resolves the same sources outside `node_modules`, kept working.

## 0.1.0-beta.7

### Minor Changes

- 6d43421: Identify `ai.aiKnowledgeBase.vectorDatabases` entries by `key` instead of `name`. This is a breaking change to the application configuration contract: `key` is now required and must be unique within one configuration, and `name` is now optional.

  `key` is the stable identifier of a record — the knowledge-base plugin matches existing records by it when synchronizing declarative configuration, and its settings page lists it as the UID. `name` is only a display title, shown as the Title, and falls back to `key` when omitted, so two entries may share the same name.

  A configuration written against the previous contract fails to typecheck until each entry's `name` is renamed to `key`. Keep `name` alongside it only when a separate display title is wanted.

### Patch Changes

- be92e2b: Use the NocoBase AI chat mark for the floating AI employee chat entry instead of the generic `lucide-react` `Bot` glyph on a solid primary square. The trigger now shows the same brand artwork the Portal template uses for this entry.

  The mark ships as an inlined `NocoBaseAIChatIcon` React component under `shared/icons/` rather than an `.svg` asset import. Registry source is copied into an application and typechecked with plain `tsc`, so an asset import would require shipping a `declare module '*.svg'` declaration into every consuming application alongside it.

- 6d43421: Add a `#` row-number column to the LLM service table, matching the MCP table. Both settings tables now open with the same fixed-width centered index column before the UID.
- 6d43421: Fix the LLM service model dialog overlay leaving the page header uncovered. Its backdrop had no `z-index`, so the surface layout's `sticky z-40` header painted over it and stayed interactive while the dialog was open. It now sits at `z-50`, matching every other dialog in the plugin.
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
- Updated dependencies [211538b]
- Updated dependencies [1d5ee9a]
- Updated dependencies [1d5ee9a]
  - @nocobase/app-server@1.0.0-beta.12
  - @nocobase/db@1.0.0-beta.6
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/i18n@1.0.0-beta.3
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.6

### Minor Changes

- f17f3a6: Provide editable TypeScript defaults for application modules, assembled by the runtime before services start. Module factories receive the runtime with application paths and plugin metadata; deployment files and environment variables override defaults, and configuration reload preserves code defaults.

  Keep deployment settings in YAML examples and reserve explicit environment overrides for secrets and startup integration. Simplify application configuration loading, merging and reload subscriptions.

  Align client configuration assembly with the server: runtime merges application TypeScript defaults beneath public configuration before services start. Client inspection reports the application configuration entry.

### Patch Changes

- d566dde: Add a read-only MCP settings page backed by declarative `config.yml` configuration, with connection testing and tool inspection.
- c8f8a93: Keep assistant messages, tool messages, and tool-call persistence atomic behind encapsulated conversation provider implementations.
- d566dde: Register AI Employees and Tools explicitly from server-side resource aggregators, and load plugin and configured Skills from `SKILL.md` directories.
- c8f8a93: Expose `AIConversationsManager` through the server service container and allow conversation creation without an AI employee for AgentServiceFactory integrations.
- ceb356b: Fix published package metadata and database test driver registration.
- c8f8a93: Simplify AI employee chat message converters and expose the renamed conversion contract.
- c8f8a93: Resolve and authorize message attachments once at the provider formatting boundary, and remove the obsolete message normalization contract.
- c8f8a93: Keep conversation thread updates private to the conversation message store implementation.
- c8f8a93: Consolidate AI employee tool policy behavior into the chat context provider.
- c8f8a93: Avoid redundant message conversions when resuming an interrupted sub-agent conversation.
- c8f8a93: Consolidate AI employee tool-call persistence behind the conversation tool-call handler.
- 28132fd: Forward web search selections, complete execution context for AI employee tools, and recognize DeepSeek's `deepseek-flash` model as web-search capable.
- d566dde: Fix the AI employee custom Skill menu and include App-root custom Skills for verification.
- 28132fd: Fix AI employee tool-call resume by loading persisted human decisions correctly and forwarding frontend tool results through the request execution context.
- c8f8a93: Declare AI employee chat context dependencies explicitly and inject direct repository contracts.
- c8f8a93: Consolidate conversation thread operations into the message store contract and use explicit method names.
- c8f8a93: Simplify agent provider boundaries by calculating request-derived details at their use sites and moving conversation persistence ownership out of the employee runtime.
- c8f8a93: Merge tool-call persistence into the conversation message store and clarify its operation names.
- c8f8a93: Refine AI employee conversation dependencies around concrete repositories, checkpoint savers, and default message and tool-call handlers.
- c8f8a93: Persist normalized LLM usage events with AI conversation messages in the same transaction.
- c8f8a93: Use the concrete LLM stream cache contract and inject logging directly into agent providers and middleware.
- c8f8a93: Refactor agent execution around request-local LLM resolution, dedicated chat context and message converter providers, dynamically activated skill tools, and a unified tool-call policy.
- c8f8a93: Consolidate AI employee server types and colocate the AI employee runtime under the agent module.
- c8f8a93: Remove the unused agent provider override layer and require explicit provider composition.
- c8f8a93: Remove the empty recommended-model mechanism and use explicit provider or custom model configuration.
- c8f8a93: Simplify the AI employee agent service API and preserve cancelled tool-call continuation messages.
- c8f8a93: Refactor AI employee execution around an execution-scoped `DiscoveredTools` result, request-selected LLM models, and a simplified system prompt contract.
- c8f8a93: Move response metadata collection and cleanup into each AgentService stream execution and narrow the chat context and resolved LLM contracts.
- c8f8a93: Encapsulate conversation thread reads and updates in AIChatConversation while preserving transactional message persistence.
- Updated dependencies [d566dde]
- Updated dependencies [d566dde]
- Updated dependencies [ceb356b]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [f17f3a6]
- Updated dependencies [43d25b4]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [590861e]
- Updated dependencies [e11b855]
- Updated dependencies [72ed008]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [28132fd]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [e11b855]
- Updated dependencies [ceb356b]
- Updated dependencies [40e2d49]
- Updated dependencies [590861e]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c960d07]
- Updated dependencies [c8f8a93]
- Updated dependencies [c960d07]
- Updated dependencies [ceb356b]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
- Updated dependencies [ceb356b]
- Updated dependencies [c8f8a93]
  - @nocobase/ai-employee@0.2.0-beta.4
  - @nocobase/app-server@1.0.0-beta.11
  - @nocobase/app-client@1.0.0-beta.14
  - @nocobase/app-plugin-authentication@0.1.0-beta.11
  - @nocobase/db@1.0.0-beta.5
  - @nocobase/logging@0.1.0-beta.4

## 0.1.0-beta.5

### Patch Changes

- 52d1107: Resolve the shared UI packages through the workspace catalog: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `shadcn`, `tailwind-merge`, and `tw-animate-css`.

  Every package already agreed on one version for each of these — the catalog is what keeps them agreeing. A range edited in one manifest and not the others would otherwise put two copies of a UI primitive into an application's bundle, which is the kind of drift nothing reports until a component behaves differently depending on which plugin rendered it.

  Peer dependencies use `catalog:` too. `pnpm pack` resolves it before publishing, so a consumer still reads an ordinary range.

- 52d1107: Declare the packages each plugin's browser code imports as peer dependencies, so an application that installs the plugin can resolve them while a server deployment installs none of them.

  A plugin's `client/` is not bundled by the plugin: `build` is `tsc`, so `dist/client/*.js` keeps its bare imports and the consuming application's Vite build resolves them. That application has only what the published manifest declares, and npm does not publish `devDependencies` — so a client import declared only there fails with `Could not resolve "…"`. `sonner` and `@xyflow/react` both shipped that way. Ten of these plugins appeared to work only because `app-template-default` happened to declare the same package for its own use; `@nocobase/app-plugin-hub`'s CodeMirror imports had no such coincidence and were unresolvable wherever it was installed.

  Peer dependencies are what satisfy both sides. An application installs one shared copy, and a deployment — which sets `autoInstallPeers: false` — installs none, so packages a server never requires stay out of it. Each keeps a matching devDependency so the workspace still resolves it and the version used here stays pinned. None is marked `optional`: an optional peer is not auto-installed anywhere, including in the application that needs it.

  `create-plugin` emits the same shape and its generated `AGENTS.md` teaches it, so a plugin created tomorrow declares its browser packages as peers rather than repeating the mistake.

- 52d1107: Declare each peer dependency once, dropping the devDependency that used to accompany it.

  The pairing was required on the grounds that a peer range is wide enough for development to drift off this repository's copy. It is not: pnpm installs a peer and links it into the plugin's own `node_modules`, resolving `workspace:^` to the same package `workspace:*` would. A plugin with the devDependency removed still links, typechecks, builds, and tests against it — verified against a clean install with every plugin's `node_modules` deleted first.

  What remained was a second declaration that changed nothing and had to be kept in step with the first. `pnpm peers:check` no longer asks for it, and `create-plugin` no longer emits it.

- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
- Updated dependencies [52d1107]
  - @nocobase/app-plugin-authentication@0.1.0-beta.9

## 0.1.0-beta.4

### Minor Changes

- dc517b1: Add typed application configuration schemas for declarative AI knowledge-base vector databases and manifest sources.

### Patch Changes

- 0811f18: Localize the LLM service table, model editor, model search, controls, and accessibility labels in English and Chinese.
- 7057ee0: Remove the internal aggregate runtime context, pass explicit route and service inputs, and remove legacy task conversations.
- Updated dependencies [d29d1fe]
- Updated dependencies [dc517b1]
- Updated dependencies [5281fd1]
  - @nocobase/app-server@1.0.0-beta.8
  - @nocobase/ai-employee@0.2.0-beta.3
  - @nocobase/drive@0.1.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.8
  - @nocobase/app-client@1.0.0-beta.11
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.3

### Patch Changes

- 90a4903: Replace the composite application transport with application-owned `ApiClient` and `RealtimeClient` services. Client plugins, examples, and application templates now use object-style HTTP request options through the shared API client, while realtime subscriptions resolve their dedicated WebSocket client.
- 90a4903: Preserve configured API and realtime endpoints after splitting the client services. Integrate file inventory and the plugin-owned inbox with the shared API and realtime clients, including reconnection refresh and isolated event listeners.

  Allow the Oracle driver install script in both templates’ standalone deployment workspace settings.

  Resolve SQLite auto-incrementing bigint metadata correctly, narrow Oracle LOB values before reading their type, preserve legacy file timestamps, and rebuild the AI registry against the current API client.

- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [a864497]
- Updated dependencies [a864497]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
- Updated dependencies [90a4903]
  - @nocobase/db@1.0.0-beta.3
  - @nocobase/app-server@1.0.0-beta.7
  - @nocobase/app-client@1.0.0-beta.10
  - @nocobase/app-plugin-authentication@0.1.0-beta.7

## 0.1.0-beta.2

### Patch Changes

- 8b18b47: Fixed knowledge-base document uploads in ESM applications, made parsed-document cache paths filesystem-safe, corrected embedding-model API requests and database boolean handling, and prevented non-image chat attachments from rendering as broken image previews.
- Updated dependencies [8b18b47]
  - @nocobase/ai-employee@0.2.0-beta.2

## 0.1.0-beta.1

### Minor Changes

- 8d88ff4: Replace the public AI Employee LLM service filesystem loader with the application `config.yml` contract at `ai.llmServices`. Configured model entries use a simple label/value array and are converted internally to custom mode. The App plugin validates and synchronizes declarative service definitions at startup and on application-config reload while preserving repository-managed enabled state for matching services. The default App template includes a commented configuration example, and the App config validator supports unique object properties for rejecting duplicate service names.
- 81c6d6d: Replace the temporary AI file manager with metadata-aware, drive-backed file storage factories, configurable storage disks, and per-domain metadata repositories.

### Patch Changes

- 43d5bf0: Publish the application-owned AI Employee frontend Registry with its chat components. Plugin-owned development showcases now live under `client/dev`, outside the materialized Registry item, and are excluded from production application builds. The Registry uses the application-scoped `@nocobase/app-client` transport for JSON, upload, and streaming requests instead of the deprecated Portal SDK client. The Default and Hub templates scan plugin Registry source for Tailwind utilities, so materialized components retain their intended responsive layout and sizing.
- 813da59: Declare browser-only packages as devDependencies rather than dependencies, and make `react-i18next` an optional peer of `@nocobase/i18n` provided by `@nocobase/app-client`. Client code is bundled by the consuming application, so these entries did nothing for the bundle while `dist/package.json` pulled every one of them into the server deployment to be installed and never required.
- Updated dependencies [8d88ff4]
- Updated dependencies [43d5bf0]
- Updated dependencies [813da59]
- Updated dependencies [81c6d6d]
- Updated dependencies [cee3251]
  - @nocobase/ai-employee@0.2.0-beta.1
  - @nocobase/app-server@1.0.0-beta.6
  - @nocobase/app-client@1.0.0-beta.9
  - @nocobase/i18n@1.0.0-beta.2
  - @nocobase/app-plugin-authentication@0.1.0-beta.6
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.1

## 0.1.0-beta.0

### Minor Changes

- 1527426: Declare identity-sensitive runtime packages as peer dependencies of every plugin.

  A plugin used to list `@nocobase/app-server`, `@nocobase/db`, `@nocobase/service-provider`, `@nocobase/i18n`, `@nocobase/queue`, `@nocobase/app-portal-sdk`, and the plugins it builds on among its `dependencies`. Each of these carries state that only works while exactly one copy of the module exists in the process: `ServiceContainer` keys its bindings by the token object itself, React contexts match only the provider created from the same module, and `@nocobase/queue` registers job classes into a global `Locator`. A `dependencies` range lets a package manager install a second copy to satisfy it, which splits that state.

  The monorepo could never show the problem, because `workspace:` links every consumer to one directory. It appears once a plugin is installed from a registry into an application, and it appears at runtime rather than at install time: a service that is registered reports `Service "..." is not registered`, or a context reads `undefined` under a mounted provider.

  Each of these packages is now a peer dependency paired with a devDependency. The peer is the published contract that makes the installing application provide the single copy; the devDependency pins this repository's copy for development and tests, which the deliberately wide peer range does not. Applications built from the templates are unaffected — they already install every one of these packages directly, which is what satisfies the new peer ranges.

  `pnpm plugin:create` generates the same shape, and `pnpm peers:check` enforces it in CI.

### Patch Changes

- Updated dependencies [174eab5]
- Updated dependencies [ab7b341]
- Updated dependencies [1527426]
- Updated dependencies [174eab5]
  - @nocobase/app-client@1.0.0-beta.6
  - @nocobase/app-portal-sdk@1.0.0-beta.2
  - @nocobase/app-server@1.0.0-beta.4
  - @nocobase/app-plugin-authentication@0.1.0-beta.5
  - @nocobase/db@1.0.0-beta.2
  - @nocobase/i18n@1.0.0-beta.1
  - @nocobase/snowflake@1.0.0-beta.3
  - @nocobase/ai-employee@0.1.1-beta.0
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the AI Employee App plugin with database-backed runtime integration, local API routes, and packaged built-in resources.
- Move the application-specific `CurrentUser` type from AI Employee Core into the App plugin public server API.
- Remove the developer built-in employees and the document-search skill from packaged AI resources.
- Register the AI Employee management page in application settings and localize its settings tabs.
