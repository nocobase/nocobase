# OnlineAgent chats and business tools

The shared OnlineAgent entry exports the SDK UI message contract; see `docs/ui-messages.md` in the installed `@nocobase/app-plugin-agents` package for types, validation, dependency versions and conversion boundaries. Realtime routes, Registry and Examples consume that contract through the SDK.

Use `OnlineAgentService` for SDK conversations that call application services and continue answering with their results, or for lightweight background generation with a JSON Schema-constrained result. Native model execution runs inside the application process. Realtime sessions can also select a callable Runner agent through the same service; Runner output arrives as completed text blocks. The plugin owns persistence, model selection, execution control and public chat transport; the application owns its business tools, permissions and page composition.

## Obtain and configure the shared service

Import the original `agentsToken` from `@nocobase/app-plugin-agents/server/tokens` and resolve `agentsToken.onlineAgent` in an application provider after the plugin has registered. Do not construct a second service for an HTTP entry or user: the application instance coordinates busy, stop and finalization across all facades. `OnlineAgentService` and `OnlineAgentConfigurator` are exported from `@nocobase/app-plugin-agents/server` and `@nocobase/app-plugin-agents/server/online-agent`; the latter also exports the prefixed configuration, tool and stream contracts.

Application dependencies and function parameters use the complete `OnlineAgentService` type. Resolve the shared instance through `agentsToken`; do not introduce another service interface or a method-only type projection. `OnlineAgent` is the common public session interface, with `history(): Promise<AppUIMessage[]>`, session identity, status, cancellation and finalization. `RealtimeOnlineAgent extends OnlineAgent` adds `send`, `receive`, `backend`, required `approve` and `messages`; `BackgroundOnlineAgent extends OnlineAgent` adds `run`, `get` and `try`, without `send` or browser `receive`. The service's `realtime()` and `background()` factories return the corresponding interfaces, implemented by the actual session classes rather than inline facade objects.

`onlineAgent.configurator` is the `OnlineAgentConfigurator` (the configuration component). Register global layers, named business scopes and versioned tools once at application boot. It resolves prompts, variables, model lists and tool sets; a Scope selects ordinary configuration and grants no business permission.

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
  online.configurator.registerTool('read_invoice', {
    version: '1',
    definition: (services) => ({
      inputSchema: z.object({ id: z.string() }),
      execute: ({ id }, { context }) =>
        services.resolve(invoiceToken).read(id, context),
    }),
  });
  online.configurator.registerOnlineAgentGlobalScope({
    model: ['billing-models/chat'],
    systemPromptTemplate: 'Answer using the authorized business tools.',
  });
  online.configurator.registerOnlineAgentScope('invoices', {
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

Replace `billing-models/chat` with an enabled chat model in the application's existing model services. Model credentials remain in that service. Factories resolve application dependencies once and must not capture a current user. Each tool invocation receives fresh `OnlineAgentToolContext`: user, current authorization, complete entry credentials, business data, signal and the authoritative runtime `sessionId`. Forward it to the original business service; retain its object, row and field checks. Never use model-provided user/session IDs as authority. Keep secrets out of tool output, prompts, variables and saved configuration. Every tool result and async yield must already be lossless JSON: convert Date to an ISO string and other business objects to intentional JSON values inside `execute`. Non-JSON returns are rejected, not implicitly serialized or retried. The SDK's `toModelOutput` derives model input from that raw JSON without replacing the saved result.

Layers resolve in order: global registrations, selected named scopes, then explicit options. Providers run sequentially; omitted fields keep their preceding value and arrays replace it, including empty arrays. Prompt functions can compose `context.systemPrompt` and validate variables. The resolved serializable snapshot is saved. Loading an existing session restores it without reevaluating Providers. Idle explicit overrides reevaluate only the named sources requested; running configuration is frozen. `selectedModel` explicitly selects the existing model columns, while a model-list replacement selects its first entry. A prompt-only override retains the selected model.

## Use a realtime session or a background result

Construct `OnlineAgentContext` from the authenticated user and full trusted entry identity, never from browser JSON. The authorization principal must match `user.id`. Business references are untrusted input and still require authorization in tools.

```ts
import type {
  OnlineAgentContext,
  OnlineAgentService,
} from '@nocobase/app-plugin-agents/server/online-agent';

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
  // Consume the standard SDK stream when present; always reconcile saved history and execution state.
  return {
    sessionId: chat.sessionId,
    events,
    history: await chat.history(),
  };
}

export async function classify(
  online: OnlineAgentService,
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
  // run acknowledges admission; get waits for validation, persistence and release.
  return await job.get();
}
```

Pass `{ sessionId }` to `realtime`/`background` to load without starting execution. Realtime `send` accepts input for the bound executor; native background `run` saves its input and starts the SDK. `status` includes pending finalization. `get` waits for the execution already admitted at invocation and returns only its successfully persisted and finalized result validated against the submitted JSON Schema. `try({ wait })` observes the same execution with a finite non-negative budget (default 0), returning pending, success, failed or cancelled without stopping work on timeout; admission, authorization and persistence errors still throw. `get` throws OnlineAgentResultError for safe failed/cancelled outcomes. Every session's `history()` returns public `AppUIMessage[]` with ordered SDK parts and stable identities, including background sessions. It never returns privileged model history or raw tool/provider evidence. Background structured results remain separate from message history: `get`/`try` observe the validated result and execution outcome, while status, cancellation and finalization retain their own execution state. Only successful JSON-safe background results persist.

`run(messages, schema)` requires a plain Draft-07 JSON Schema, not Zod. Browser callers submit the same JSON through an authenticated application-owned API; the server supplies the trusted actor, scopes and tools. The schema is snapshotted and compiled before input admission, passed to the AI SDK through `Output.object({ schema: jsonSchema(...) })`, and used for final server-side validation without coercion, default insertion or property removal. Invalid schemas are rejected before model execution. Only local references are supported; schemas are limited to 64 KiB, 32 nesting levels and 4096 JSON nodes. Patterns use a linear-time RE2 engine; unsupported syntax such as lookaround and backreferences is rejected before admission. Use explicit null types instead of OpenAPI `nullable`. Provider warnings that JSON response formatting is unsupported fail the execution rather than falling back to text.

Use `abort()` for explicit Stop. Native execution waits for terminal persistence; Runner acknowledges its existing cancellation request and remains busy until its normal terminal confirmation. Read saved execution state before permitting another turn. A save or seal failure keeps the session busy; `retryFinalization()` retries only that closing work and never reruns the model or tools. Application shutdown drains active executions and warns if finalization fails, allowing the application to close. Cancelled tool exchanges retain paired actual results or an explicit unknown result in private model context; advisory risk feedback never permanently blocks a finished conversation.

## Browser integration and limits

Native `POST /api/agents/conversations/:id/messages` accepts only the current SDK user message (`id`, `role: "user"`, text `parts`) plus authorized attachment IDs, page context and optional selected model. It returns a standard SDK UI message stream. Use a `DefaultChatTransport.prepareSendMessagesRequest` mapper; do not submit browser history or trusted metadata. Tool input/output, assistant/system messages and configuration cannot be supplied as history. Creation starts no model. Detail, list, history, config, attachment and Stop retain ownership checks.

In both native realtime and background modes, `content.original` is the only complete internal UIMessage, with the same ID as its record and raw JSON tool inputs/results, reasoning and provider/approval evidence. Both modes share the same original-message storage and raw tool JSON, not a separate background ModelMessage codec. Public tools require explicit `public.input`/`public.output` projections. All public history reads, including background `history()`, and realtime streams use current projections; current `toModelOutput` rules separately derive internal model input from the original when it is read. Both conversions use detached copies and never execute tools. Missing or failed projections never expose the raw original. No duplicate full message, migration, compatibility fallback or format version is used. SDK `needsApproval` tools require these projections. The approval endpoint accepts only `{ messageId, executionId, approval: { id, approved, reason? } }` and resumes from trusted persisted history. Waiting approvals, denials and outcomes update the same message with increasing metadata revision; use message revision notifications and `GET messages?ids=...` to reread changes. Approval retains its owner/execution/message binding and does not bypass active execution occupancy. Background structured execution stays separate.

Native and Runner realtime receive use the standard SDK stream with optional shared Redis recovery. Background sessions have no browser receive transport and do not require Redis. Browser disconnect never cancels generation. Finish ends the HTTP response, possibly while waiting for approval; execution detail and saved history determine business state. Failed persistence keeps occupancy and supports explicit finalization without reexecution. Missing streams require history/status reconciliation, never automatic resend. A lost producer remains interrupted and is not automatically restarted. The public ChatProvider and installed Registry/Examples consumers use SDK Chat ownership and GET recovery. See [UI messages](../../../docs/ui-messages.md) and [client coordination](../../../docs/ui-message-clients.md) for configuration, costs and limits.

Permission-restricted configuration, custom permission/approval protocols and nonempty Skills execution remain unsupported. SDK approval is native-only; Runner remote tool approval is refused. Verify with isolated model fixtures and authorized application services, never real business writes.

## Open UI context, custom tool cards and local form drafts

Use the public `@nocobase/app-plugin-agents/client/chat` exports for these capabilities; the full contracts and integrated application wiring are in [UI context, tool cards and AI form adapters](../../../docs/ai-forms.md). The plugin supplies infrastructure only. Applications own tool names/schemas, fields, permissions, proposal cards and browser adapters. The Examples application's `examples_form_proposal`, `examples-form-fill` scope and `/ai-form-fill` page are application demonstrations, not plugin defaults or APIs to import into another application.

`PageContext.ui = { version: 1, items: [...] }` is open JSON data: every `PageUIItem` has required `kind`/`id` and arbitrary accepted `AppUIJson` fields, including unknown kinds and nested values. This is separate from server-resolved/authorized `context.items`. UI items grant no server record access or tool permission and enter Native/Runner model context as explicitly untrusted data, never instructions. Accepted fields survive public user metadata, saved history and recovery. Budgets in `PAGE_UI_CONTEXT_LIMITS` reject non-JSON, dangerous keys, duplicate identities and oversized snapshots without truncation; applications must minimize data and exclude secrets.

Register availability with `useChatUIContextSource({ kind, id, label, getSnapshot })`. Registration does not select, read or upload values. An explicit user action calls `useChatSources().selectUI({ kind, id }, true)`; selection state uses `selectedUIKeys` and `uiItemKey`. The installed composer awaits `snapshotUI()` immediately before Send and gives its detached envelope to `buildPageContext`. Custom composers must await this too: `buildPageContext` is synchronous and `uiSources` alone adds chips, not data. Async read failures or selection/source/lifetime changes must block sending with visible feedback. Do not register a resolver for UI data or automatically include every mounted form. Include a fresh snapshot explicitly for each turn that needs it.

`AIToolRendererProvider` takes an `AIToolRendererMap` keyed by exact SDK tool name, with components accepting `AIToolRendererProps`. Registry chat dispatches static `tool-*` and `dynamic-tool` parts using the SDK name helpers; unregistered tools keep their fallback. Nested renderer providers inherit other keys and override matching keys. Renderers receive the public SDK `part`, owning `message`, and `context` with read-only/streaming gates, source message/context and the bound SDK `approval.respond(approved, reason?)` control. A registered renderer owns presentation in every streaming, input, approval, success, error and denial state; only complete schema-valid `output-available` proposals may enable local Apply. Preserve genuine approval controls for approval tools. Keep existing data/message extensions and the one Chat owner; never start effects from rendering, mount, history replay or reconnect.

A card's source comes only from server-owned assistant `metadata.sourceUserMessageId`. Native execution sets it to the admitted user-message id and retains it through approval revisions/public projection. `getAIToolSourceMessage` requires an assistant conversation id and exactly one loaded user message matching that id and conversation; the Registry passes that message and its saved `metadata.context`. Missing source history, legacy messages or a backend without this linkage must disable local application, not fall back to adjacency, the latest user message, current composer selection or model-supplied allowed ids. Native-only Examples tools must not be advertised as Runner browser callbacks.

`AIFormRegistryProvider`, `useAIFormRegistry`, `AIFormRegistry` and `useAIForm` provide generic draft registration, `locate`/`list` descriptors, async `snapshot(id)` and controlled `apply({ source, operationId, values, signal? })`. `useAIForm` returns a **ref callback**, not `{ ref, context }`; attach it to the form and register/select its UI source separately. A registration declares stable id, user/record identity, safe fields, synchronous `getRevision`, current `getValues`/`setValues` callbacks and optional validation. Instances rotate on reattachment or identity change, including A→B→A; duplicate live ids throw. Flat declared fields only: undeclared, read-only, dangerous paths, invalid types/enums and changed revisions are rejected before writing.

Mount form/renderer providers inside the existing keyed authenticated lifetime and around both page and panel, never as a module-global registry or second `ChatProvider`. Nested form registries are isolated, not merged. A card passes the selected snapshot from its exact source message, its final user-edited patch and a stable conversation/message/tool operation key to `apply`. Same-key identical requests deduplicate; changed content under the same key is rejected. The registry checks live identity/instance/revision/capabilities, validates, awaits the setter and reports real applied/partial/failed/rejected/cancelled outcomes. A setter attempt invalidates that snapshot even on failure; do not auto-retry an uncertain or partial write.

Adapters must exclude sensitive fields, advance a monotonic revision synchronously on every draft edit and remain side-effect free while reading. Async preparation must honor `signal` and check `context.isCurrent()` immediately before a synchronous draft commit, without an intervening await. The registry cannot make an arbitrary third-party setter transactional or stop one that ignores cancellation; adapters own atomicity/rollback and truthful partial/failure reporting. A successful local Apply is browser draft state only: no form submission, business save request, fabricated message/tool output, `addToolOutput`, HITL/resume or SDK continuation. The proposal tool already completed on the server. Keep explicit `public.input`/`public.output` safety projections; SDK-standard `toModelOutput` is a separate private model-conversion boundary.

## Select a Runner executor

Applications depend directly on the shared `OnlineAgentService`. Native and Runner realtime execution share `RealtimeOnlineAgent`, and the Runner adapter implements `OnlineAgentBackend`. Both executors return `AppUIMessage[]` history and standard SDK streams. Runner blocks retain source IDs, sequences, creation times and stable part identities in message metadata; render source segments around independent notifications while retaining one logical message. Use the SDK to parse, assemble and resume the stream. Native background sessions implement `BackgroundOnlineAgent`: public UI history is shared with realtime sessions, model conversion remains internal, and the structured `run(messages, schema)` / `get()` / `try()` result and execution state remain separate from UI history. They have neither `send()` nor a browser `receive()` method, and acquire no Redis dependency. The retired custom stream contracts and memory replay manager are no longer exported. EOF or cancelling a subscriber means neither saved completion nor business Stop.

`OnlineAgentBackend` defines required realtime/background creation and restoration, configuration read/write and shutdown. Shared persistence recovery and output transport are not execution-backend capabilities. Runner implements realtime and rejects unsupported background execution, approval and Native-only configuration before persistence or dispatch. A rejected capability uses `INVALID_REQUEST` with `details.reason = 'UNSUPPORTED_CAPABILITY'`, `backend` and `capability` (HTTP exposes details as `metadata`). Applications continue to use the complete `OnlineAgentService` and its canonical `.configurator`; custom injected backends implement this execution contract rather than the removed `OnlineAgentRunnerBackend`. Session `approve` is required, with Runner explicitly rejecting the operation. There is no public Service `isActive()` or `notify()` API.

Creation resolves defaults and configuration Providers once before choosing the backend. On restoration, the session manager first verifies ownership and identifies Native realtime/background or Runner realtime from persisted `mode` and versioned binding metadata, without probing configuration or running Providers. Missing, malformed, conflicting or mode-mismatched bindings and unavailable backends are explicitly rejected, never defaulted to Native. Pending overrides are resolved on send against the latest saved configuration, under the original trusted/HTTP boundary, and cannot change the Agent. Only successful acceptance consumes pending options and pins a new response. Failed or concurrent rejected sends leave the prior accepted response intact. A pinned stream cannot follow a later round; use an unpinned recovery entry to discover the current execution. Startup correction is a session-manager operation invoked directly by the service; shared producer availability is composed once from Native local occupancy and UIStreams. Shutdown drains Runner admissions before detaching projection transport and never cancels or redispatches an already accepted remote Run. Shared transport closes only after both backends have settled.

```ts
online.configurator.registerOnlineAgentScope('coding', {
  agentId: 'runner-agent-id',
});
const chat = await online.realtime(actor, { scope: ['coding'] });
// Or pass { agentId: 'runner-agent-id' } explicitly.
await chat.send([{ role: 'user', content: 'Review the selected code.' }]);
const events = await chat.receive();
```

`agentId` follows global → ordered scopes → explicit options. Omission or `online` selects native execution. Selection happens before native model lookup. Existing sessions restore their saved executor and configuration without evaluating providers; a different executor requires a new conversation. New creation and each admission check the actual caller, Agent and execution eligibility. Scope never grants authority. `GET /api/agents/chatAgents` reads the conversation directory directly, independently of OnlineAgent execution, and retains offline reasons; an offline Agent may be displayed but cannot accept new input until executable.

Runner sessions accept one user message per round. Send authorized files by `attachmentIds`, with text parts only; native execution resolves authorized stored files into transient model data URLs. Prompts, configuration variables, resolved page context and business data are assembled on the server. Native model references, thinking settings, local tools, structured background execution and restricted credentials cannot be mapped to Runner execution and are explicitly refused. Keep native business tools in an explicit `agentId: 'online'` business scope selected by the application's native chat, Ask agent and Organize entries; do not put them in a global layer shared with Runner scopes or silently remove them in an adapter.

Request-level business context is assembled directly into the existing Runner input as untrusted data. It is not stored again in message metadata or content, and public messages exclude that internal payload; public page context retains its existing authorized projection.

Runner admission, files and enqueue share the existing conversation transaction. Queued, dispatched, running, cancelling and terminal-history closing all remain busy. Existing Runner synchronization is the only assistant-history writer; persisted event identity and real conversation message positions handle retransmission, blank events and notices. Notifications trigger coalesced persisted catch-up; only active executions have a one-second read fallback. No-change catch-up takes no write lock. Stop requests reuse Runner cancellation and keep the gate until terminal confirmation; retries remain the same active execution. Closing a browser only unsubscribes. Browser recovery reconnects only the standard output stream and never repeats input; Runner claim, lease, retry, spool and adapter protocols are unchanged.

### History confirmation and identity lifetime

Message insertion notifications advance the committed watermark; same-ID revision notifications trigger exact ID rereads. The shared coordinator drains every bounded `nextAfter` page before advancing its forward cursor and preserves older pages and active SDK output. Canonical history merges by ID and revision; browser input with an unknown outcome is reconciled without resending. SDK actions and retained Undo notifications are guarded by the Provider lifetime; removing an archived row does not invalidate its legitimate Undo. Consumers must not write stale detail snapshots into the shared cache from submission callbacks; the controller orders trusted details before notifying consumers.

Use one `ChatProvider` for the authenticated identity and remount it on every identity lifetime change, including logout followed by login to the same user. The SDK orders detail refreshes and commands together, preserves fresh refreshes queued behind older pages, and replaces temporary output only when its canonical message has actually loaded. Submission reconciliation merges confirmed messages without sending again or reopening events. SDK actions and retained Undo notifications are guarded by the Provider lifetime; removing an archived row does not invalidate its legitimate Undo. Consumers must not write stale detail snapshots back into the shared cache from submission callbacks; the controller already commits those details before notifying consumers.

## Chat feedback, defaults and read state

`chatFeedback`, `chatIsRunning` and `useChatScroll` from the public client/chat entry provide presentation shared by the Registry block and its application copies. Local submissions show sending immediately; occupied OnlineAgent execution shows thinking until the first visible reply, even before the subscription attaches or emits text. The busy indicator belongs immediately after the latest message in the scrolling log, not in the composer footer, and is not provider reasoning output; legacy Run-only state may still show waiting. A successful Stop request remains stopping until the execution actually becomes idle. EOF or an interrupted subscription reports an unconfirmed result, never success or an automatic resend. Outcomes use localized safe keys; internal provider errors are not displayed. Legacy effect-review hints are advisory and never disable sending after execution has actually ended. Check possibly completed actions before repeating them. Layout growth follows only while the reader remains near the bottom; loading older messages preserves their position.

The built-in `online` choice is part of the service directory and may be saved as a personal or team default even before a model is configured; its availability still reports `noModel`. UI selection remains picked agent, personal default, then team default and passes that choice explicitly. Service calls that omit `agentId` retain Native compatibility, regardless of a Runner preference. Explicit scope/options precedence and existing session binding are unchanged; invalid or unavailable choices never silently select another backend.

Accepted user input marks the conversation read in its existing transaction. Only newly persisted visible assistant output marks it unread; empty cancellation/failure, tool-only records and duplicate finalization do not. Stop/abort resolves after the cancellation request has been processed; consumers must use execution status, saved history and terminal stream confirmation rather than the request Promise to decide whether another turn is safe. Follow-up context is limited to reauthorized references from the latest earlier page-bearing user message, with current page references taking priority. Full historical page context, including old selections, filters, routes and credentials, is not replayed.

The historical `runCancelled` notice means that cancellation was requested, not that execution has ended. It is rendered as “Cancellation requested.” even when older stored text says otherwise; terminal feedback still waits for the existing execution and saved-history confirmation.

## Historical page references

On a follow-up, OnlineAgent may supplement the current user input with authorized references from only the latest earlier page-bearing user message. Current page references (including a selection source) take priority, duplicates are removed, and historical additions use only the remaining slots of a ten-reference budget after counting current references; existing current-context limits stay unchanged. An empty, deleted, unknown or inaccessible latest page never falls back to an older one.

References are re-resolved through the existing page-kind resolver for the current user, once per kind. Only kind, identifier and the current title (at most 2,000 characters) enter the supplementary untrusted user data. Stored titles, URLs, keys, routes, filters, selections and entry credentials are not replayed. The supplement is not written back to conversation history or promoted to a system instruction. A Native entry with a restricted credential scope receives no inferred historical references because the existing resolver accepts user identity only; ordinary current context and tool authorization stay unchanged.

Resolvers remain responsible for business authorization and their own database reads. One batched resolver invocation does not imply one SQL query: Studio currently resolves each issue through its authorized detail service. Native UI history validation and attachment reauthorization add reads; admission, approval and finalization reuse the existing conversation lock with no new tables or per-token writes. There is no automatic resend. Optional `agents.uiRecovery` uses the plugin-owned shared Redis stream component; SDK consumers use the authorized events endpoint for full replay and later chunks. Runner protocol and lifecycle remain unchanged; existing Runner session memory and previously generated answers are not erased by this policy.

## Shared UI transport and independent notifications

Native and Runner realtime history is `AppUIMessage[]`, and HTTP input for both is the current `{ message: { id, role: "user", parts }, attachmentIds?, context?, selectedModel? }`. Responses use the SDK UI message stream, not the old block events. Runner assistant ID is `runner:<runId>`; `metadata.sourceRecords` retains real saved record IDs, source sequences and stable part IDs/indices. Display segments must interleave independent notifications by source sequence without duplicating the logical assistant message. Registry and application consumers use `chatMessageSegments` to retain that source ordering. Forward history readers must drain `meta.nextAfter` before advancing to the conversation watermark.

For multiple instances configure `agents.uiRecovery: { namespace, redis: { host, port, ... } }` with an application-specific namespace and a shared Redis deployment. The plugin owns the connections. `DefaultChatTransport.prepareReconnectToStreamRequest` points to `/api/agents/conversations/:id/events`. Without configuration there is one live response and history only, reported as `x-online-agent-recovery: live`; configured failures never fall back. Replay requires the live producer: process death does not restart inference, tools or Runner work. Stop remains a separate authenticated action and can signal a live native producer on another instance; read execution and saved history until termination is confirmed. Approval waiting and a missing stream are not business success. See [UI messages and recovery](../../../docs/ui-messages.md) for identity, lifecycle, limits, costs and validation boundaries.

Existing system notices are delivered through `ConversationService.deliver()` in the caller's business transaction. OnlineAgent bindings persist them without starting another execution, and rollback removes them with the business changes. Native notices use standard public data parts and remain readable after a response closes. Independent application timeline content should use the authorized business subscription and rendering extensions; OnlineAgent has no separate notification-injection API.

## Public UI messages

Browser consumers use the SDK-owned `AppUIMessage` and `ChatProvider` from `client/chat`. Render ordered parts and use `chatMessageSegments` to preserve Runner source ordering around independent notifications. The public extension hooks receive the complete SDK message, and approval uses only a bound server-validated control. Follow [the client contract](../../../docs/ui-message-clients.md) for identity lifetimes, unknown admission, revision rereads, durable notification polling and independent Stop. A standard response finish or a missing recovery stream never implies saved business completion.

## Single-instance startup and visibility

Deploy one execution process per logical application/database, fully stopping the old process before starting its replacement. A real serving host repairs pre-process native occupancy at startup: complete saved results are finalized; missing terminal snapshots become failed UI messages on their stable IDs. Current-process rows, valid approval waits and Runner bindings are preserved. Command hosts do not perform crash recovery. Repeated reads and initialization do not rerun models or tools. Shared stream markers express transport reachability, never execution-process death; overlapping deployment and execution takeover are outside this contract.

Normal native and Runner creation accepts showInChatList (default true); background creation always hides the record. List filtering happens in the database before pagination. A known hidden ID retains its ownership checks and remains readable. Notifications delivered through conversations.deliver join the caller's transaction, do not wake new native/Runner execution, and roll back with business changes; native realtime notices are saved as standard data parts.

HTTP creation/configuration cannot override tool lists, model lists or system prompts. Business variables must be declared and validated by selected scopes; selectedModel still selects an authorized catalog entry. Trusted server SDK configuration retains its policy capability. Legacy unbound conversations are read-only but their owner can still Stop their existing Run without a current model or online Agent.
