# AI Employee Tasks Page

This Registry item is an application-owned page that runs AI employee tasks on a queue of sample support tickets. Its `extension.ts` replaces the component of the `@nocobase/app-plugin-ai-employee-example` route at `/ai-employee-example`; the route, its menu entry and its access rule stay with the plugin, which shows a fallback page until this item is installed.

## Prerequisites

- `@nocobase/app-plugin-ai-employee` and `@nocobase/app-plugin-ai-employee-example` registered in the application's `client/plugins.ts` and `server/plugins.ts`, the example after the AI Employee plugin. The example's server registers the AI employee `iris` and the read-only tool `example-ticket-history`.
- The AI Employee plugin's `nocobase-ai` item installed in `client/extensions/nocobase-ai`. The page imports it through `@/extensions/nocobase-ai`.
- A global AI entry around the signed-in layout: `NocoBaseAIRootProvider`, an `AIChatProvider` bound to `useGlobalAIChatController()`, and a `ChatSurface` that opens with the controller. The page has no chat of its own; every task it starts opens there.
- The application's shadcn `badge`, `button` and `card`, and its `PageContainer` and `PageHeader`.

## What it demonstrates

- `tasks.ts` defines three `AIEmployeeTask`s: one sent at once, one placed in the composer for the user to finish, and one started from a button. Each carries the user message, instructions for that run, and the tools it may call.
- `AIPageContextScope` hands the selected ticket to the AI employee as work context, so `AIEmployeeShortcut` beside its title needs no context of its own.
- `useGlobalAIChatController().triggerTask()` starts the queue triage from an ordinary button, with every ticket as work context.

The page's texts are translated in the plugin's namespace, `@nocobase/app-plugin-ai-employee-example`, which the registered plugin loads. An application that rewords them adds an `overrides` block for that namespace to its own locale files, or moves the texts into its own locales.

## Ownership

The installed copy belongs to the application. Replace the sample tickets in `tickets.ts` with the application's own records and adapt the tasks to its work. When a newer plugin version changes this canonical source, review the upstream diff and merge it with the application's changes instead of overwriting the installed copy.
