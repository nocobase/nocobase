# App Source Map

Where each piece of AI work goes in a CLI-created App, and what to read before choosing an extension point.

## Table of contents

- [Identify the App root](#identify-the-app-root)
- [App AI resources](#app-ai-resources)
- [App frontend](#app-frontend)
- [Working examples](#working-examples)
- [App server](#app-server)
- [The installed dependency](#the-installed-dependency)
- [Tests and validation](#tests-and-validation)

## Identify the App root

```bash
pnpm create @nocobase/app my-app   # also installs the dependencies
cd my-app
pnpm nocobase config init                   # writes config.yml
```

The current directory is the App root when it holds `client/`, `server/`, and `package.json`. Work relative to it, and do not require the user to know which npm template generated it.

Read these App-local files when present, before writing anything:

- `README.MD` — setup and development notes; the templates spell the extension in capitals.
- `AGENTS.md` — App-specific coding rules; they outrank this Skill's defaults.
- `package.json` — dependencies and scripts. Runtime plugin registration is in `server/plugins.ts` and `client/plugins.ts`, and CLI registration in `cli/plugins.ts`, not here.

For configuration diagnostics and safe model-list updates without exposing secrets, follow [Configure LLM services](llm-configuration.md).

Also read these App-local files:

- `.gitignore` — confirm it keeps `config.yml` out of the repository; follow [Configure LLM services](llm-configuration.md) for safe key setup and model configuration.
- `client/extensions/nocobase-ai/README.md` — the installed AI frontend. Its absence means the Registry item is not installed yet, not that the App cannot have AI UI.

## App AI resources

| Path                                  | Holds                                                           |
| ------------------------------------- | --------------------------------------------------------------- |
| `config.yml` `ai.llmServices`         | LLM services, keyed by service name                             |
| `config.yml` `ai.mcpServers`          | MCP connections — the only place they can be configured         |
| `config.yml` `ai.aiEmployee.storage`  | the disk chat attachments are written to                        |
| `config.yml` `ai.skills.paths`        | extra Skill directories beyond the App root's `ai/skills`       |
| `server/ai/employees/<name>/index.ts` | one `defineAIEmployee()` with an inline `systemPrompt`          |
| `server/ai/tools/<name>.ts`           | one `defineTools()` backend tool                                |
| `server/ai/index.ts`                  | static imports, aggregated by an `AIResourceRegistrar` subclass |
| `server/providers/ai-resources.ts`    | the `ServiceProvider` that calls `registerAIResources()`        |
| `ai/skills/<name>/SKILL.md`           | one Skill; it names tools, and defines none                     |

The application build copies the Markdown under `ai/skills` into `dist/ai/skills`, which is where a deployed server looks — it resolves the application root from `dist/server`. Nothing else in the directory is copied, because tools are registered in code and a Skill only names them. Pages beside `SKILL.md` are copied too, but only for the people reading them: the model receives the `SKILL.md` body alone, so an employee Skill keeps everything it needs there — see [capabilities.md § Skills](capabilities.md#skills). A directory listed in `ai.skills.paths` is not copied, and a relative one resolves inside `dist/` on a built server, so point those at an absolute path the deployment itself provides.

There is no filesystem scan for employees or tools, and no employee-local prompt, skill, or tool auto-binding. See [capabilities.md § Where each resource is registered](capabilities.md#where-each-resource-is-registered) and [server-runs.md § Register App resources](server-runs.md#register-app-resources).

## App frontend

App source lives under `client/`. The usual extension points are `client/routes.ts`, `client/react-providers.ts` for React providers, `client/pages/`, `client/locales/`, and the installed `client/extensions/nocobase-ai/`.

Inside the extension, the files worth opening:

| Path                                                                           | What it is                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `index.ts`                                                                     | the export surface                                               |
| `components/ai-root-provider.tsx`                                              | `NocoBaseAIRootProvider`, the composition of the three providers |
| `providers/ai-provider.tsx`                                                    | discovery, transport, invokers                                   |
| `providers/ai-context.ts`                                                      | the `useAI()` contract, including the readiness fields           |
| `providers/chat-transport.ts`                                                  | requests and the SSE transport                                   |
| `providers/page-context.tsx`, `page-context-store.ts`, `page-context-utils.ts` | context scopes and tool/form allowlists                          |
| `providers/frontend-tool-registry.ts`                                          | browser tool registration and execution                          |
| `providers/form-registry.ts`                                                   | form validation and filling                                      |
| `services/types.ts`                                                            | the `AIService` contract                                         |
| `services/nocobase-ai-service.ts`                                              | the `/api/ai` adapter                                            |
| `components/chat/`                                                             | the chat UI, composer, attachments                               |
| `components/surfaces/`                                                         | inline, page, dialog, side-panel containers                      |
| `components/page-elements/`                                                    | page-element and form hooks                                      |
| `components/tools/`                                                            | tool result renderers                                            |
| `adapters/react-hook-form.ts`                                                  | `applyReactHookFormValues`, for `useAIForm.setValues`            |

A module that exports a component exports nothing else: an App lints this source with its own Portal configuration, and Fast Refresh requires it. A component's context, hooks, and helpers live in a sibling module — `page-element-store.ts` beside `page-element-provider.tsx`, `tool-call-utils.ts` beside `tool-call-card.tsx` — so import a hook or helper from that sibling, and put new non-component exports there too.

If `client/extensions/nocobase-ai` is missing, install the Registry item before doing frontend work; see [chat-surfaces.md § Install the extension](chat-surfaces.md#install-the-extension). A missing extension is never a reason to import UI from `@nocobase/ai-employee` or to rebuild chat under `client/`.

## Working examples

The plugin ships a working page for each frontend capability. Read the matching one before building a chat surface, a task, page context, a form the assistant fills, or a tool renderer: it shows the whole wiring in one place, where this Skill describes it rule by rule. While `pnpm dev` runs, the same pages are live under the App's base path at `/dev/ai-components/<page>` — for example `http://127.0.0.1:13000/main/dev/ai-components/floating` — so the user can try the behaviour before you build it. They are development routes only: a production build does not have them.

| Page (`/dev/ai-components/…`) | Files under `client/dev/demo/`                                            | What it shows                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chat`                        | `index`, `container-showcase`, `interaction-showcase`, `prompt-generator` | `AIChatWindow` in each container — `ChatInline`, `ChatPage`, `ChatSurface` — message interactions, attachments and the web search toggle                                            |
| `floating`                    | `floating`                                                                | `AIChatFloatingTrigger`, a push side panel that expands to a dialog, all on one controller; the controlled-surface rule in [chat-surfaces.md § Surfaces](chat-surfaces.md#surfaces) |
| `tasks`                       | `shortcut`                                                                | `AIEmployeeShortcut` and tasks bound to employees, inside a chat and from buttons elsewhere on the page                                                                             |
| `context`                     | `page-context`, `page-element-showcase`, `page-context-prompt-generator`  | `useAIPageElement`, the element picker as a composer action, `AIPageContextScope`, `useAIForm`, and frontend tools that update the page                                             |
| `tools`                       | `tool-cards`                                                              | tool renderers, and the shared card a tool without one falls back to                                                                                                                |

Where to read them:

- **In an App**, the built files: `node_modules/@nocobase/app-plugin-ai-employee/dist/client/dev/demo/<file>.js`. They are compiled, so JSX appears as `_jsx(...)` calls, but the components, props, hooks and imports are all there. The page-to-file map is `dist/client/dev/demo-pages.js`, and the routes are in `dist/client/routes.js`.
- **In the plugin's source repository**, `packages/plugins/app-plugin-ai-employee/client/dev/demo/<file>.tsx`.

Copy the wiring, not the demo around it. Every page carries scaffolding an App must not keep:

- **Imports.** The demos reach the Registry through relative paths such as `../../../registry/nocobase-ai/providers/index.js`; an App imports the same names from its installed copy, `@/extensions/nocobase-ai` or its `components` and `providers` modules. Two kinds are not re-exported there: the react-hook-form adapter comes from `@/extensions/nocobase-ai/adapters/react-hook-form`, and the demos' `shared/ui/*` components are the extension's internal primitives — build App UI from the App's own `client/components/ui`.
- **The configuration gate.** `AIConfigurationGate` renders the page on a preview service with invented employees and a placeholder model when nothing is configured, so a demo looks alive without a server. An App never does this: use the readiness gate in [chat-surfaces.md § The readiness gate](chat-surfaces.md#the-readiness-gate), which shows an actionable message instead.
- **`defaultEmployee`.** Several demos leave it out and open on whichever employee sorts first. An App passes its own employee's username.
- **Presentation.** `PageHeader`, `PromptCard`, the `demo.*` translation keys and the sample business data exist only to explain the page; use the App's own layout, locales and data.

When a demo and this Skill disagree, the Skill is the contract; the demo shows the wiring.

## App server

`server/` holds the App's own services, routes, runtime, and plugin integration. `server/plugins.ts` and `client/plugins.ts` register runtime contributions; `cli/plugins.ts` separately registers `@nocobase/app-plugin-ai-employee/cli` for `pnpm nocobase ai-employee models` and `test`. Importing tokens from the server entry does not register these contributions. The App runtime owns one `AIManager`, created by the AI Employee plugin.

Use the plugin runtime for authenticated conversations, persistence, `/api/ai`, SSE, and settings. Direct `AgentService` use is for isolated App-owned server integrations only — see [server-runs.md](server-runs.md#when-to-drive-an-agent-directly).

An App backend tool reaches App services through its declared `dependencies`, so a service the tool needs must be registered in the App container under a token the tool can import — by convention a provider under `server/providers/`, with its token exported from `server/providers/index.ts`.

## The installed dependency

App code imports `@nocobase/ai-employee` from its public root only:

```ts
import { defineAIEmployee, defineTools } from '@nocobase/ai-employee';
```

The root also covers employee and tool managers, `AgentContext`, resource loaders, repositories, LLM providers and helpers, and the knowledge/vector contracts. Inspect the installed declarations under `node_modules/@nocobase/ai-employee` when a shape is in doubt. What an App does with the managers and provider classes directly is in [runtime-extensions.md](runtime-extensions.md).

Two exports look useful and are not. `createAIManager()` builds a second manager; it is only for an isolated worker, CLI, or test that deliberately wants no App runtime. `defineMCP()` belongs to the loader, not to an App: configure MCP in `config.yml` `ai.mcpServers`, which is the one supported path.

The enabled plugin exposes its server entry at `@nocobase/app-plugin-ai-employee/server`. Import only `aiManagerToken`, `aiConversationsManagerToken`, `agentServiceFactoryToken`, `AIResourceRegistrar`, the config types and helpers, the agent request/result types, and the `AgentServiceError` class for `instanceof` checks.

Never import `@nocobase/ai-employee/src/...` or a plugin-private server, agent, or factory path. An importable subpath is not a runtime contribution: importing the server entry registers nothing, and registration happens only in the App's own Provider.

## Tests and validation

Follow the App's existing test layout — commonly `tests/logic/` or `tests/` for unit and integration tests, and `e2e/` for authenticated browser or API flows. Colocate tests inside the installed AI extension only if that extension already does.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a script is absent, read `package.json` and run the closest equivalent. Employees and tools are TypeScript compiled into the build; the Markdown under `ai/skills` is copied into `dist/ai/skills` by a build step of its own. Both deploy.
