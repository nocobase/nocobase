# OnlineAgent chats and business tools

Use `OnlineAgentService` for SDK conversations that call application services and continue answering with their results, or for lightweight background generation with a Zod-validated result. It runs inside the application process. Coding-tool Runner jobs remain a separate capability. The plugin owns persistence, model selection, execution control and public chat transport; the application owns its business tools, permissions and page composition.

## Obtain and configure the shared service

Import the original `agentsToken` from `@nocobase/app-plugin-agents/server/tokens` and resolve `agentsToken.onlineAgent` in an application provider after the plugin has registered. Do not construct a second service for an HTTP entry or user: the application instance coordinates busy, stop and finalization across all facades. `OnlineAgentService` and `OnlineAgentConfigurer` are exported from `@nocobase/app-plugin-agents/server` and `@nocobase/app-plugin-agents/server/online-agent`; the latter also exports the prefixed configuration, tool and stream contracts.

`onlineAgent.configurer` is the `OnlineAgentConfigurer` (the configuration component). Register global layers, named business scopes and versioned tools once at application boot. It resolves prompts, variables, model lists and tool sets; a Scope selects ordinary configuration and grants no business permission.

```ts
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  OnlineAgentService,
  OnlineAgentToolContext,
} from '@nocobase/app-plugin-agents/server/online-agent';
import type { ServiceResolver, ServiceToken } from '@nocobase/service-provider';
import { z } from 'zod';

type InvoiceService = {
  read(
    id: string,
    actor: OnlineAgentToolContext,
  ): Promise<{ id: string; total: number }>;
};

// Call once from the application's provider, with its existing business service token.
export function configureInvoices(
  resolver: ServiceResolver,
  invoiceToken: ServiceToken<InvoiceService>,
): OnlineAgentService {
  const online = resolver.resolve(agentsToken).onlineAgent;
  online.configurer.registerTool('read_invoice', {
    version: '1',
    definition: (services) => ({
      inputSchema: z.object({ id: z.string() }),
      execute: ({ id }, { context }) =>
        services.resolve(invoiceToken).read(id, context),
    }),
  });
  online.configurer.registerOnlineAgentGlobalScope({
    model: ['billing-models/chat'],
    systemPromptTemplate: 'Answer using the authorized business tools.',
  });
  online.configurer.registerOnlineAgentScope('invoices', {
    tool: ['read_invoice'],
    systemPromptTemplate: {
      variableSchema: z.object({ invoiceId: z.string() }),
      template: (context) =>
        `${context.systemPrompt}\nInvoice reference: ${JSON.stringify(context.variable)}`,
    },
  });
  return online;
}
```

Replace `billing-models/chat` with an enabled chat model in the application's existing model services. Model credentials remain in that service. Factories resolve application dependencies once and must not capture a current user. Each tool invocation receives fresh `OnlineAgentToolContext`: user, current authorization, complete entry credentials, business data, signal and the authoritative runtime `sessionId`. Forward it to the original business service; retain its object, row and field checks. Never use model-provided user/session IDs as authority. Keep secrets out of tool output, prompts, variables and saved configuration. Use the SDK's `toModelOutput` to convert Date or other business objects into supported model output.

Layers resolve in order: global registrations, selected named scopes, then explicit options. Providers run sequentially; omitted fields keep their preceding value and arrays replace it, including empty arrays. Prompt functions can compose `context.systemPrompt` and validate variables. The resolved serializable snapshot is saved. Loading an existing session restores it without reevaluating Providers. Idle explicit overrides reevaluate only the named sources requested; running configuration is frozen. `selectedModel` explicitly selects the existing model columns, while a model-list replacement selects its first entry. A prompt-only override retains the selected model.

## Use a realtime session or a background result

Construct `OnlineAgentContext` from the authenticated user and full trusted entry identity, never from browser JSON. The authorization principal must match `user.id`. Business references are untrusted input and still require authorization in tools.

```ts
import type {
  OnlineAgentContext,
  OnlineAgentService,
} from '@nocobase/app-plugin-agents/server/online-agent';
import { z } from 'zod';

export async function askInvoice(
  online: OnlineAgentService,
  actor: OnlineAgentContext,
  invoiceId: string,
) {
  const chat = await online.realtime(actor, {
    scope: ['invoices'],
    context: { variable: { invoiceId } },
    source: 'chat',
  });
  await chat.send([{ role: 'user', content: 'What is the invoice total?' }]);
  const events = await chat.receive();
  // Consume public events. Null means it already finished: read saved history.
  return {
    sessionId: chat.sessionId,
    events,
    history: events ? undefined : await chat.history(),
  };
}

export async function classify(
  online: OnlineAgentService,
  actor: OnlineAgentContext,
) {
  const job = await online.background(actor);
  await job.run(
    [{ role: 'user', content: 'Return JSON with category: invoice.' }],
    z.object({ category: z.string() }),
  );
  // A caller observes status until idle; run acknowledges admission, not completion.
  return job;
}
```

Pass `{ sessionId }` to `realtime`/`background` to load without starting execution. `send` and `run` save their inputs and start the SDK. `status` includes pending finalization. `get` returns only a successfully persisted background result validated with the original schema instance. `history` is privileged canonical SDK history for trusted server consumers; it includes tool and provider data and must not be returned directly to browsers. Only successful JSON-safe background results persist.

Use `abort()` for explicit stop: it waits for actual execution and terminal persistence. A save or seal failure keeps the session busy; `retryFinalization()` retries only that closing work and never reruns the model or tools. Application shutdown drains active executions and warns if finalization fails, allowing the application to close. A cancelled incomplete tool exchange is saved as internal evidence and excluded from model replay.

## Browser integration and limits

Use the original `/api/agents/conversations` resources: create starts no model; first and subsequent input both use `POST /:conversationId/messages`. Detail, list, history, configuration, attachment, read, title and archive operations retain their original ownership checks. `GET /:conversationId/events` provides one initial cached/live reception; no current stream returns 204, after which the client reads saved history. Stop uses the original stop operation. GET config restores the snapshot; PATCH config applies explicit idle overrides and optional selectedModel.

Mount one `ChatProvider` from `@nocobase/app-plugin-agents/client/chat`, keyed by authenticated identity, above all chat surfaces. Reuse its controller and hooks for sidebar, full-page, home, Registry and business intake. Keep drafts, uploads and business references scoped to their view/conversation. Ask-agent actions prepare a draft and references without sending. HTTP history and stream events expose user/assistant text and safe file/context fields; provider payloads, reasoning and tool results remain internal. Historical Runner chats remain readable and read-only in these switched entries.

Ordinary create/send requests have no persistent deduplication. Repeated inputs may execute again after completion; concurrent input receives busy. `clientId` correlates display only. On a timeout or disconnect, show an unknown result and offer explicit history refresh; never silently resend or reconnect. The default stream manager is in-memory and assumes one executing process; changing stream storage alone does not provide distributed execution or restart recovery.

Permission-restricted configuration, tool permission/approval declarations and nonempty Skills execution are rejected. Generic approval/resume, tool-result panels, automatic reconnection and execution environments are unavailable. Original authentication and business authorization always apply. Verify integration with an isolated model requesting the registered tool, a permitted and a denied actor, model continuation, saved-history refresh and stop; do not use real business writes for a smoke test.
