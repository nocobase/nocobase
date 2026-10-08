# @nocobase/app-plugin-ai-employee-example

## 0.1.0-beta.0

### Minor Changes

- a5e19f7: Add `@nocobase/app-plugin-ai-employee-example`, a plugin demonstrating AI employee tasks. Its server registers the AI employee `iris`, a support analyst, and the read-only `SPECIFIED` tool `example-ticket-history` through `AIResourceRegistrar` once the AI Employee plugin's provider has booted. Its client declares the `/ai-employee-example` route with a fallback page, and its `tasks-page` Registry item replaces that page in the application: a queue of sample support tickets whose `AIEmployeeShortcut` offers "Analyze this ticket" (sent at once) and "Draft a reply" (left in the composer) with the selected ticket as work context through `AIPageContextScope`, and whose "Triage the queue" button starts a task through `useGlobalAIChatController().triggerTask()` with every ticket as work context. Each task narrows its run to the tools it needs through `skillSettings.tools`.

  The examples template installs the AI Employee plugin's `nocobase-ai` Registry item in `client/extensions/nocobase-ai` and wraps its signed-in layout in a global AI employee entry, `client/components/ai-employee-entry.tsx`: a floating trigger at the lower right, shown once the current user has an AI employee, opens the shared conversation as a side panel that pushes the page narrower and expands into a dialog. It registers the example plugin, installs its `tasks-page` item, and links the page from the homepage.

  The AI Employee plugin's `nocobase-ai` Registry item now translates in the `@nocobase/app-plugin-ai-employee` namespace, like the file plugin's Registry item and the plugin's own pages, instead of through its own `locales/` and the `useAITranslate()` hook, which are removed. Its copy moves into the plugin's `client/locales`, which the registered plugin loads, so an application rewords it with an `overrides` block for that namespace. Four keys the item used without ever defining them, `tool.output`, `tool.businessReport.failed`, `tool.businessReport.chartFailed` and `tool.businessReport.previewUnavailable`, now have English and Chinese text instead of always showing their English fallback. An application that already installed the item keeps working until it merges the upstream change; the merge deletes `client/extensions/nocobase-ai/locales/` and replaces each `useAITranslate()` with `useTranslation('@nocobase/app-plugin-ai-employee')`.

### Patch Changes

- be0fbbd: Client code merges class names with the `cn` package instead of `clsx` and `tailwind-merge`, so the plugins declare `cn` as a peer dependency in their place. The application templates provide it; an application that does not declare `cn` yet adds it to its `devDependencies`, or the client build cannot resolve these plugins. The AI employee registry item `nocobase-ai` lists `cn` instead of `clsx` and `tailwind-merge`, and the authentication plugin drops the two unused development dependencies.
- Updated dependencies [1197085]
- Updated dependencies [a5e19f7]
- Updated dependencies [1071f7d]
- Updated dependencies [1071f7d]
- Updated dependencies [d631536]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [be0fbbd]
- Updated dependencies [bc1e83f]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [37c8d20]
- Updated dependencies [6162033]
  - @nocobase/app-plugin-ai-employee@3.0.0-beta.0
  - @nocobase/app-client@2.0.0-beta.1
  - @nocobase/app-server@2.0.0-beta.1
  - @nocobase/ai-employee@0.2.0-beta.8
  - @nocobase/i18n@1.0.0-beta.5
  - @nocobase/service-provider@0.0.2-beta.1

## 0.0.1

### Patch Changes

- Add the initial plugin scaffold.
