# @nocobase/app-plugin-ai-employee-example

Example plugin that shows how an application hands an AI employee prepared tasks. It builds on `@nocobase/app-plugin-ai-employee` and its application-owned `nocobase-ai` Registry item, and contributes three things:

- **Server**: an AI employee, `iris` (Iris, a support analyst), and a read-only backend tool, `example-ticket-history`, registered through `AIResourceRegistrar` from a `ServiceProvider.boot()` that runs after the AI Employee plugin's provider.
- **Client**: an App route at `/ai-employee-example` with a fallback page that explains what to install.
- **Registry**: `tasks-page`, an application-owned page that replaces the fallback through the route's stable ID and runs AI employee tasks on a queue of sample support tickets.

The page has no chat of its own. Every task opens in the application's global AI entry: a floating trigger at the lower right and a side panel that expands into a dialog, built from `NocoBaseAIRootProvider`, an `AIChatProvider` bound to `useGlobalAIChatController()`, `AIChatFloatingTrigger` and `ChatSurface`. `packages/templates/app-template-examples/client/components/ai-employee-entry.tsx` is that entry in the Examples template.

## AI employee tasks

An `AIEmployeeTask` is a prepared request: the title a user picks, the user message, instructions for that run only, whether it is sent at once (`autoSend`) or left in the composer, and `skillSettings.tools` to narrow what the run may call. The page demonstrates three ways to start one:

| Task                | Started from                                   | Work context        | Mode          |
| ------------------- | ---------------------------------------------- | ------------------- | ------------- |
| Analyze this ticket | `AIEmployeeShortcut` beside the ticket's title | the selected ticket | auto send     |
| Draft a reply       | `AIEmployeeShortcut` beside the ticket's title | the selected ticket | fill composer |
| Triage the queue    | a page button, `controller.triggerTask()`      | every ticket        | auto send     |

`AIPageContextScope` supplies the selected ticket as work context, so the shortcut inside it needs none of its own; the button passes `context` explicitly. The server hands each work context item's `content` to the model as JSON, and Iris reads the internal history the page does not show through `example-ticket-history`.

## Register in an application

1. Register the AI Employee plugin and this plugin in `client/plugins.ts` and `server/plugins.ts`, this one after the AI Employee plugin, and add both to the application's `dependencies`.
2. Install the AI Employee plugin's `nocobase-ai` item into `client/extensions/nocobase-ai` and mount a global AI entry around the signed-in layout.
3. Install this plugin's `tasks-page` item into `client/extensions/nocobase-ai-employee-example-tasks-page`. Its `extension.ts` is discovered by the application's `client/source-extensions.ts`.
4. Configure an LLM service under `ai.llmServices` in `config.yml`, as the AI Employee plugin's README describes.

In this repository, materialize the items with:

```bash
pnpm registry materialize --package @nocobase/app-plugin-ai-employee --item nocobase-ai --output-root <app>
pnpm registry materialize --package @nocobase/app-plugin-ai-employee-example --item tasks-page --output-root <app>
```

The page's texts are translated in this plugin's namespace, so they load with the registered plugin. The installed page belongs to the application; review upstream changes with a three-way merge.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-ai-employee-example lint
pnpm --filter @nocobase/app-plugin-ai-employee-example typecheck
pnpm --filter @nocobase/app-plugin-ai-employee-example test
pnpm --filter @nocobase/app-plugin-ai-employee-example build
```

The Registry page is compiled and tested by the application it is installed in; the Examples template's tests cover its route override, its tasks, and the requests they send.
