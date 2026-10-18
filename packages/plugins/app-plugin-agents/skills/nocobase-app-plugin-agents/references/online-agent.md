# OnlineAgent chats and business tools

The SDK UI message foundation is available from the shared OnlineAgent entry; see `docs/ui-messages.md` in the installed `@nocobase/app-plugin-agents` package for types, validation, dependency versions and the staged integration boundary. Existing realtime routes and consumers have not yet switched to that contract.

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
  // Consume the standard SDK stream when present; always reconcile saved history and execution state.
  return {
    sessionId: chat.sessionId,
    events,
    history: await chat.history(),
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

Pass `{ sessionId }` to `realtime`/`background` to load without starting execution. Realtime `send` accepts input for the bound executor; native background `run` saves its input and starts the SDK. `status` includes pending finalization. `get` returns only a successfully persisted background result validated against the submitted JSON Schema. Native and Runner realtime `history` return public `AppUIMessage[]` with ordered SDK parts and stable identities. Native background `history` is privileged canonical SDK history for trusted server consumers; it includes tool and provider data and must not be returned directly to browsers. Only successful JSON-safe background results persist.

`run(messages, schema)` requires a plain Draft-07 JSON Schema, not Zod. Browser callers submit the same JSON through an authenticated application-owned API; the server supplies the trusted actor, scopes and tools. The schema is snapshotted and compiled before input admission, passed to the AI SDK through `Output.object({ schema: jsonSchema(...) })`, and used for final server-side validation without coercion, default insertion or property removal. Invalid schemas are rejected before model execution. Only local references are supported; schemas are limited to 64 KiB, 32 nesting levels and 4096 JSON nodes. Patterns use a linear-time RE2 engine; unsupported syntax such as lookaround and backreferences is rejected before admission. Use explicit null types instead of OpenAPI `nullable`. Provider warnings that JSON response formatting is unsupported fail the execution rather than falling back to text.

Use `abort()` for explicit Stop. Native execution waits for terminal persistence; Runner acknowledges its existing cancellation request and remains busy until its normal terminal confirmation. Read saved execution state before permitting another turn. A save or seal failure keeps the session busy; `retryFinalization()` retries only that closing work and never reruns the model or tools. Application shutdown drains active executions and warns if finalization fails, allowing the application to close. A cancelled incomplete tool exchange is saved as internal evidence and excluded from model replay.

## Browser integration and limits

Native `POST /api/agents/conversations/:id/messages` accepts only the current SDK user message (`id`, `role: "user"`, text `parts`) plus authorized attachment IDs, page context and optional selected model. It returns a standard SDK UI message stream. Use a `DefaultChatTransport.prepareSendMessagesRequest` mapper; do not submit browser history or trusted metadata. Tool input/output, assistant/system messages and configuration cannot be supplied as history. Creation starts no model. Detail, list, history, config, attachment and Stop retain ownership checks.

Native `content.original` is a JSON-safe UIMessage with the same ID as its record. Public tools require explicit `public.input`/`public.output` projections; private model results are kept outside the public message. SDK `needsApproval` tools require these projections. The approval endpoint accepts only `{ messageId, executionId, approval: { id, approved, reason? } }` and resumes from trusted persisted history. Waiting approvals, denials and outcomes update the same message with increasing metadata revision; use message revision notifications and `GET messages?ids=...` to reread changes. Approval does not bypass effect-review protection. Background structured execution stays separate.

Native and Runner receive use the standard SDK stream with optional shared Redis recovery. Browser disconnect never cancels generation. Finish ends the HTTP response, possibly while waiting for approval; execution detail and saved history determine business state. Failed persistence keeps occupancy and supports explicit finalization without reexecution. Missing streams require history/status reconciliation, never automatic resend. A lost producer remains interrupted and is not automatically restarted. The public ChatProvider and installed Registry/Examples consumers use SDK Chat ownership and GET recovery. See [UI messages](../../../docs/ui-messages.md) and [client coordination](../../../docs/ui-message-clients.md) for configuration, costs and limits.

Permission-restricted configuration, custom permission/approval protocols and nonempty Skills execution remain unsupported. SDK approval is native-only; Runner remote tool approval is refused. Verify with isolated model fixtures and authorized application services, never real business writes.

## Select a Runner executor

`OnlineAgentRealtimeService` and `OnlineAgentRealtimeSession` are the replaceable public conversation contracts. Both executors return `AppUIMessage[]` history and standard SDK streams. Runner blocks retain source IDs, sequences, creation times and stable part identities in message metadata; render source segments around independent notifications while retaining one logical message. Use the SDK to parse, assemble and resume the stream. Native background sessions retain separate SDK history and structured `run(schema)` / `get()` capabilities. EOF or cancelling a subscriber means neither saved completion nor business Stop.

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

Runner sessions accept one user message per round. Send authorized files by `attachmentIds`, with text parts only; native execution resolves authorized stored files into transient model data URLs. Prompts, configuration variables, resolved page context and business data are assembled on the server. Native model references, thinking settings, local tools, structured background execution and restricted credentials cannot be mapped to Runner execution and are explicitly refused. Keep native business tools in an explicit `agentId: 'online'` business scope selected by the application's native chat, Ask agent and Organize entries; do not put them in a global layer shared with Runner scopes or silently remove them in an adapter.

Request-level business context is assembled directly into the existing Runner input as untrusted data. It is not stored again in message metadata or content, and public messages exclude that internal payload; public page context retains its existing authorized projection.

Runner admission, files and enqueue share the existing conversation transaction. Queued, dispatched, running, cancelling and terminal-history closing all remain busy. Existing Runner synchronization is the only assistant-history writer; persisted event identity and real conversation message positions handle retransmission, blank events and notices. Notifications trigger coalesced persisted catch-up; only active executions have a one-second read fallback. No-change catch-up takes no write lock. Stop requests reuse Runner cancellation and keep the gate until terminal confirmation; retries remain the same active execution. Closing a browser only unsubscribes. Browser recovery reconnects only the standard output stream and never repeats input; Runner claim, lease, retry, spool and adapter protocols are unchanged.

### History confirmation and identity lifetime

Message insertion notifications advance the committed watermark; same-ID revision notifications trigger exact ID rereads. The shared coordinator drains every bounded `nextAfter` page before advancing its forward cursor and preserves older pages and active SDK output. Canonical history merges by ID and revision; browser input with an unknown outcome is reconciled without resending. SDK actions and retained Undo notifications are guarded by the Provider lifetime; removing an archived row does not invalidate its legitimate Undo. Consumers must not write stale detail snapshots into the shared cache from submission callbacks; the controller orders trusted details before notifying consumers.

Use one `ChatProvider` for the authenticated identity and remount it on every identity lifetime change, including logout followed by login to the same user. The SDK orders detail refreshes and commands together, preserves fresh refreshes queued behind older pages, and replaces temporary output only when its canonical message has actually loaded. Submission reconciliation merges confirmed messages without sending again or reopening events. SDK actions and retained Undo notifications are guarded by the Provider lifetime; removing an archived row does not invalidate its legitimate Undo. Consumers must not write stale detail snapshots back into the shared cache from submission callbacks; the controller already commits those details before notifying consumers.

## Chat feedback, defaults and read state

`chatFeedback`, `chatIsRunning` and `useChatScroll` from the public client/chat entry provide presentation shared by the Registry block and its application copies. Local submissions show sending immediately; occupied OnlineAgent execution shows thinking until the first visible reply, even before the subscription attaches or emits text. The busy indicator belongs immediately after the latest message in the scrolling log, not in the composer footer, and is not provider reasoning output; legacy Run-only state may still show waiting. A successful Stop request remains stopping until the execution actually becomes idle. EOF or an interrupted subscription reports an unconfirmed result, never success or an automatic resend. Outcomes use localized safe keys; internal provider errors are not displayed. `requiresEffectReview` asks the person to check actions before continuing. Layout growth follows only while the reader remains near the bottom; loading older messages preserves their position.

The built-in `online` choice is part of the service directory and may be saved as a personal or team default even before a model is configured; its availability still reports `noModel`. UI selection remains picked agent, personal default, then team default and passes that choice explicitly. Service calls that omit `agentId` retain Native compatibility, regardless of a Runner preference. Explicit scope/options precedence and existing session binding are unchanged; invalid or unavailable choices never silently select another backend.

Accepted user input marks the conversation read in its existing transaction. Only newly persisted visible assistant output marks it unread; empty cancellation/failure, tool-only records and duplicate finalization do not. Stop/abort resolves after the cancellation request has been processed; consumers must use execution status, saved history and terminal stream confirmation rather than the request Promise to decide whether another turn is safe. Follow-up context is limited to reauthorized references from the latest earlier page-bearing user message, with current page references taking priority. Full historical page context, including old selections, filters, routes and credentials, is not replayed.

The historical `runCancelled` notice means that cancellation was requested, not that execution has ended. It is rendered as “Cancellation requested.” even when older stored text says otherwise; terminal feedback still waits for the existing execution and saved-history confirmation.

## Historical page references

On a follow-up, OnlineAgent may supplement the current user input with authorized references from only the latest earlier page-bearing user message. It reuses loaded Native history; Runner admission performs one bounded latest-page read outside the existing admission transaction. Current page references (including a selection source) take priority, duplicates are removed, and historical additions use only the remaining slots of a ten-reference budget after counting current references; existing current-context limits stay unchanged. An empty, deleted, unknown or inaccessible latest page never falls back to an older one.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. Native UI history validation and attachment reauthorization add reads; admission, approval and finalization reuse the existing conversation lock with no new tables or per-token writes. There is no automatic resend. Optional `agents.uiRecovery` uses the plugin-owned shared Redis stream component; SDK consumers use the authorized events endpoint for full replay and later chunks. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

## Shared UI transport and independent notifications

Native and Runner realtime history is `AppUIMessage[]`, and HTTP input for both is the current `{ message: { id, role: "user", parts }, attachmentIds?, context?, selectedModel? }`. Responses use the SDK UI message stream, not the old block events. Runner assistant ID is `runner:<runId>`; `metadata.sourceRecords` retains real saved record IDs, source sequences and stable part IDs/indices. Display segments must interleave independent notifications by source sequence without duplicating the logical assistant message. Registry and application consumers use `chatMessageSegments` to retain that source ordering. Forward history readers must drain `meta.nextAfter` before advancing to the conversation watermark.

For multiple instances configure `agents.uiRecovery: { namespace, redis: { host, port, ... } }` with an application-specific namespace and a shared Redis deployment. The plugin owns the connections. `DefaultChatTransport.prepareReconnectToStreamRequest` points to `/api/agents/conversations/:id/events`. Without configuration there is one live response and history only, reported as `x-online-agent-recovery: live`; configured failures never fall back. Replay requires the live producer: process death does not restart inference, tools or Runner work. Stop remains a separate authenticated action and can signal a live native producer on another instance; read execution and saved history until termination is confirmed. Approval waiting and a missing stream are not business success. See [UI messages and recovery](../../../docs/ui-messages.md) for identity, lifecycle, limits, costs and validation boundaries.

Applications can deliver an authorized independent native business notification through `onlineAgent.notify(ownerContext, conversationId, { id, parts })`. Only JSON-safe public `data-notice` and `data-business` parts are accepted; the ID deduplicates identical retries. The notification is saved and emits the normal revision/business events even after the model response ends. Normal history and ID rereads retrieve it; it is excluded from model input. This entry does not recreate a deleted business producer or authorize browser-supplied business payloads.

## Public UI messages

Browser consumers use the SDK-owned `AppUIMessage` and `ChatProvider` from `client/chat`. Render ordered parts and use `chatMessageSegments` to preserve Runner source ordering around independent notifications. The public extension hooks receive the complete SDK message, and approval uses only a bound server-validated control. Follow [the client contract](../../../docs/ui-message-clients.md) for identity lifetimes, unknown admission, revision rereads, durable notification polling and independent Stop. A standard response finish or a missing recovery stream never implies saved business completion.
