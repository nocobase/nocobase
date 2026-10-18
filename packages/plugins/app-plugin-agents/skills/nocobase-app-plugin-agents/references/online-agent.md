# OnlineAgent chats and business tools

Use `OnlineAgentService` for SDK conversations that call application services and continue answering with their results, or for lightweight background generation with a JSON Schema-constrained result. Native model execution runs inside the application process. Realtime sessions can also select a callable Runner agent through the same service; Runner output arrives as completed text blocks. The plugin owns persistence, model selection, execution control and public chat transport; the application owns its business tools, permissions and page composition.

## Obtain and configure the shared service

Import the original `agentsToken` from `@nocobase/app-plugin-agents/server/tokens` and resolve `agentsToken.onlineAgent` in an application provider after the plugin has registered. Do not construct a second service for an HTTP entry or user: the application instance coordinates busy, stop and finalization across all facades. `OnlineAgentService` and `OnlineAgentConfigurer` are exported from `@nocobase/app-plugin-agents/server` and `@nocobase/app-plugin-agents/server/online-agent`; the latter also exports the prefixed configuration, tool and stream contracts.

`onlineAgent.configurer` is the `OnlineAgentConfigurer` (the configuration component). Register global layers, named business scopes and versioned tools once at application boot. It resolves prompts, variables, model lists and tool sets; a Scope selects ordinary configuration and grants no business permission.

```ts
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  OnlineAgentRuntime,
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
): OnlineAgentRuntime {
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
  OnlineAgentRuntime,
} from '@nocobase/app-plugin-agents/server/online-agent';

export async function askInvoice(
  online: OnlineAgentRuntime,
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
  online: OnlineAgentRuntime,
  actor: OnlineAgentContext,
) {
  const job = await online.background(actor);
  await job.run(
    [{ role: 'user', content: 'Return JSON with category: invoice.' }],
    {
      type: 'object',
      properties: { category: { type: 'string' } },
      required: ['category'],
      additionalProperties: false,
    },
  );
  // A caller observes status until idle; run acknowledges admission, not completion.
  return job;
}
```

Pass `{ sessionId }` to `realtime`/`background` to load without starting execution. Realtime `send` accepts input for the bound executor; native background `run` saves its input and starts the SDK. `status` includes pending finalization. `get` returns only a successfully persisted background result validated against the submitted JSON Schema. Realtime `history` returns public conversation messages. Native background `history` is privileged canonical SDK history for trusted server consumers; it includes tool and provider data and must not be returned directly to browsers. Only successful JSON-safe background results persist.

`run(messages, schema)` requires a plain Draft-07 JSON Schema, not Zod. Browser callers submit the same JSON through an authenticated application-owned API; the server supplies the trusted actor, scopes and tools. The schema is snapshotted and compiled before input admission, passed to the AI SDK through `Output.object({ schema: jsonSchema(...) })`, and used for final server-side validation without coercion, default insertion or property removal. Invalid schemas are rejected before model execution. Only local references are supported; schemas are limited to 64 KiB, 32 nesting levels and 4096 JSON nodes. Patterns use a linear-time RE2 engine; unsupported syntax such as lookaround and backreferences is rejected before admission. Use explicit null types instead of OpenAPI `nullable`. Provider warnings that JSON response formatting is unsupported fail the execution rather than falling back to text.

Use `abort()` for explicit stop: it waits for actual execution and terminal persistence. A save or seal failure keeps the session busy; `retryFinalization()` retries only that closing work and never reruns the model or tools. Application shutdown drains active executions and warns if finalization fails, allowing the application to close. An interrupted tool exchange retains its valid call and trustworthy result in internal model history, including successful writes completed after Stop. A missing or cancellation-unknown result is paired with an explicit warning that the action may already have completed; these private tool and provider details remain redacted from HTTP history.

## Browser integration and limits

Use the original `/api/agents/conversations` resources: create starts no model; first and subsequent input both use `POST /:conversationId/messages`. Detail, list, history, configuration, attachment, read, title and archive operations retain their original ownership checks. `GET /:conversationId/events` provides one initial cached/live reception; no current stream returns 204, after which the client reads saved history. Stop uses the original stop operation. GET config restores the snapshot; PATCH config applies explicit idle overrides and optional selectedModel.

Mount one `ChatProvider` from `@nocobase/app-plugin-agents/client/chat`, keyed by authenticated identity, above all chat surfaces. Reuse its controller and hooks for sidebar, full-page, home, Registry and business intake. Keep drafts, uploads and business references scoped to their view/conversation. Ask-agent actions prepare a draft and references without sending. HTTP history and stream events expose user/assistant text and safe file/context fields; provider payloads, reasoning and tool results remain internal. Legacy Runner chats without an OnlineAgent executor binding remain readable and read-only in these entries.

Ordinary create/send requests have no persistent deduplication. Repeated inputs may execute again after completion; concurrent input receives busy. `clientId` correlates display only. On a timeout or disconnect, show an unknown result and offer explicit history refresh; never silently resend or reconnect. The default stream manager is in-memory and assumes one executing process; changing stream storage alone does not provide distributed execution or restart recovery.

Permission-restricted configuration, tool permission/approval declarations and nonempty Skills execution are rejected. Generic approval/resume, tool-result panels, automatic reconnection and execution environments are unavailable. Original authentication and business authorization always apply. Verify integration with an isolated model requesting the registered tool, a permitted and a denied actor, model continuation, saved-history refresh and stop; do not use real business writes for a smoke test.

## Select a Runner executor

`OnlineAgentRealtimeService` and `OnlineAgentRealtimeSession` are the replaceable public conversation contracts. Realtime `history()` returns public `ConversationMessage[]` for either executor; native background sessions retain their SDK history and structured `run(schema)`/`get()` capabilities. The shared event type is exported from `@nocobase/app-plugin-agents/shared/online-agent`. A `part` replaces the current prefix, a `delta` appends text once at its boundary/message index, and a `message` upserts the canonical Runner message by its actual ID and sequence. Never add the final part as another delta. `saved` follows terminal history and logical sealing; EOF or cancelling a subscription means neither completion nor Stop.

```ts
online.configurer.registerOnlineAgentScope('coding', {
  agentId: 'runner-agent-id',
});
const chat = await online.realtime(actor, { scope: ['coding'] });
// Or pass { agentId: 'runner-agent-id' } explicitly.
await chat.send([{ role: 'user', content: 'Review the selected code.' }]);
const events = await chat.receive();
```

`agentId` follows global → ordered scopes → explicit options. Omission or `online` selects native execution. Selection happens before native model lookup. Existing sessions restore their saved executor and configuration without evaluating providers; a different executor requires a new conversation. New creation and each admission check the actual caller, Agent and execution eligibility. Scope never grants authority. `chatAgents` uses the service's per-user directory and retains offline reasons; an offline Agent may be displayed but cannot accept new input until executable.

Runner sessions accept one user message per round. Send authorized files by `attachmentIds`, with text parts only; the HTTP transport reads binary attachment data only for native execution. Prompts, configuration variables, resolved page context and business data are assembled on the server. Native model references, thinking settings, local tools, structured background execution and restricted credentials cannot be mapped to Runner execution and are explicitly refused. Keep native business tools in an explicit `agentId: 'online'` business scope selected by the application's native chat, Ask agent and Organize entries; do not put them in a global layer shared with Runner scopes or silently remove them in an adapter.

Request-level business context is assembled directly into the existing Runner input as untrusted data. It is not stored again in message metadata or content, and public messages exclude that internal payload; public page context retains its existing authorized projection.

Runner admission, files and enqueue share the existing conversation transaction. Queued, dispatched, running, cancelling and terminal-history closing all remain busy. Existing Runner synchronization is the only assistant-history writer; persisted event identity and real conversation message positions handle retransmission, blank events and notices. Notifications trigger coalesced persisted catch-up; only active executions have a one-second read fallback. No-change catch-up takes no write lock. Stop requests reuse Runner cancellation and keep the gate until terminal confirmation; retries remain the same active execution. Closing a browser only unsubscribes. This does not introduce automatic browser reconnection or change Runner claim, lease, retry, spool or adapter protocols.

### History confirmation and identity lifetime

Native message notifications carry the committed message watermark only when new rows were appended. The existing metadata notification is retained so other tabs also refresh execution occupancy; metadata-only changes do not fabricate a message watermark. Public execution occupancy combines the saved running/closing state with the application's current native execution object, so a failed finalization remains busy until its existing retry finishes. This does not change Runner cancellation or native finalization ordering.

Use one `ChatProvider` for the authenticated identity and remount it on every identity lifetime change, including logout followed by login to the same user. The SDK orders detail refreshes and commands together, preserves fresh refreshes queued behind older pages, and replaces temporary output only when its canonical message has actually loaded. Submission reconciliation merges confirmed messages without sending again or reopening events. SDK actions and retained Undo notifications are guarded by the Provider lifetime; removing an archived row does not invalidate its legitimate Undo. Consumers must not write stale detail snapshots back into the shared cache from submission callbacks; the controller already commits those details before notifying consumers.

## Chat feedback, defaults and read state

`chatFeedback`, `chatIsRunning` and `useChatScroll` from the public client/chat entry provide presentation shared by the Registry block and its application copies. Local submissions show sending immediately; occupied OnlineAgent execution shows thinking until the first visible reply, even before the subscription attaches or emits text. The busy indicator belongs immediately after the latest message in the scrolling log, not in the composer footer, and is not provider reasoning output; legacy Run-only state may still show waiting. A successful Stop request remains stopping until the execution actually becomes idle. EOF or an interrupted subscription reports an unconfirmed result, never success or an automatic resend. Outcomes use localized safe keys; internal provider errors are not displayed. Legacy effect-review hints are advisory and never disable sending after execution has actually ended. Check possibly completed actions before repeating them. Layout growth follows only while the reader remains near the bottom; loading older messages preserves their position.

The built-in `online` choice is part of the service directory and may be saved as a personal or team default even before a model is configured; its availability still reports `noModel`. UI selection remains picked agent, personal default, then team default and passes that choice explicitly. Service calls that omit `agentId` retain Native compatibility, regardless of a Runner preference. Explicit scope/options precedence and existing session binding are unchanged; invalid or unavailable choices never silently select another backend.

Accepted user input marks the conversation read in its existing transaction. Only newly persisted visible assistant output marks it unread; empty cancellation/failure, tool-only records and duplicate finalization do not. Stop/abort resolves after the cancellation request has been processed; consumers must use execution status, saved history and terminal stream confirmation rather than the request Promise to decide whether another turn is safe. Follow-up context is limited to reauthorized references from the latest earlier page-bearing user message, with current page references taking priority. Full historical page context, including old selections, filters, routes and credentials, is not replayed.

The historical `runCancelled` notice means that cancellation was requested, not that execution has ended. It is rendered as “Cancellation requested.” even when older stored text says otherwise; terminal feedback still waits for the existing execution and saved-history confirmation.

## Historical page references

On a follow-up, OnlineAgent may supplement the current user input with authorized references from only the latest earlier page-bearing user message. It reuses loaded Native history; Runner admission performs one bounded latest-page read outside the existing admission transaction. Current page references (including a selection source) take priority, duplicates are removed, and historical additions use only the remaining slots of a ten-reference budget after counting current references; existing current-context limits stay unchanged. An empty, deleted, unknown or inaccessible latest page never falls back to an older one.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. There is no extra Native history query, new table, lock, persistent idempotency, automatic resend or reconnect. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

Server startup repairs native occupancy left by the previous terminated process before mounting chat routes. It marks an execution without a saved outcome as failed, preserving persisted history and warning about possibly completed actions; saved terminal outcomes and structured results survive closing repair. Repeated startup is idempotent, and rows written since the current process started are excluded so a second service facade cannot reclaim live work. This assumes one server instance and a terminated predecessor. There is no recovery endpoint, timer, automatic resend, model continuation or tool replay. Opening or reading a session does not recover it. Runner sessions retain their existing run synchronization and terminal closing path.

Historical conversations without a native or Runner OnlineAgent binding remain read-only. Their owner can still request Stop for an existing run through the ordinary Stop route, even if the agent is now unavailable; cancellation acceptance is not terminal confirmation. Start a new conversation to continue chatting.
