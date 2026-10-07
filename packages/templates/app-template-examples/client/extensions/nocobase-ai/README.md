# NocoBase AI Employee UI

This Registry item is the canonical, application-owned frontend library for the
AI Employee plugin. It was migrated from the former Default Template Registry
to the plugin that owns the `/api/aiEmployees` and `/api/aiEmployee` contract.

## Ownership

- Canonical recipe: `@nocobase/app-plugin-ai-employee/registry/nocobase-ai`
- Installed copy: `<app>/client/extensions/nocobase-ai`
- Runtime API: the enabled `@nocobase/app-plugin-ai-employee`
- Upgrade policy: review upstream changes with a three-way merge; never
  overwrite an application's edited copy.

The Registry contains browser UI only. It does not duplicate Server Routes,
authentication, authorization, persistence, AI resources, or migrations.

## Main entry

```tsx
import {
  AIChatProvider,
  AIChatWindow,
  ChatInline,
  NocoBaseAIRootProvider,
} from './client/extensions/nocobase-ai';

export function CustomerAssistant() {
  return (
    <NocoBaseAIRootProvider>
      <AIChatProvider id='customer-assistant'>
        <ChatInline>
          <AIChatWindow enableAttachments enableWebSearch />
        </ChatInline>
      </AIChatProvider>
    </NocoBaseAIRootProvider>
  );
}
```

`NocoBaseAIRootProvider` creates a `NocoBaseAIService` from the application's `ApiClient` (`useApiClient()`) unless a `service` is passed. The service calls the plugin's authenticated `/api/aiEmployees` and `/api/aiEmployee` routes for employee and model discovery, conversations, history, uploads, streaming, decisions, and resume. `AIProvider` has no default: pass it a service, such as `new NocoBaseAIService(api)`.

## Capabilities

- Embedded, page, dialog, side-panel, and compact chat surfaces
- Conversation history and unread state
- Attachments and reconnectable SSE transport
- AI employee/model selection and personal prompts
- Page context and selectable page elements
- Form filling and frontend tool registries
- Tool approval, editing, resume, sub-agent, chart, workflow, suggestion, and
  report renderers
- English and Simplified Chinese UI copy, translated in the `@nocobase/app-plugin-ai-employee` namespace from the plugin's `client/locales`, which the registered plugin loads; the item ships no locale files of its own, and an application rewords a string with an `overrides` block for that namespace in its own locale files
