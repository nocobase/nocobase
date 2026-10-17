# OnlineAgent UI message contract

The public foundation for the OnlineAgent migration is `AppUIMessage` from `@nocobase/app-plugin-agents/shared/online-agent`. It is an alias of the installed AI SDK `UIMessage<Metadata, Data, Tools>`. The client chat entry and server OnlineAgent entry export the same type. This foundation does not yet switch existing HTTP routes, history persistence or chat consumers to the SDK protocol; those integrations follow in the next implementation stages.

## Dependencies

The catalog pins `ai` to `7.0.128` and `@ai-sdk/react` to `4.0.131`. The latter's published manifest depends on exactly `ai@7.0.128`, `@ai-sdk/provider@4.0.22` and `@ai-sdk/provider-utils@5.0.54`, matching the server SDK. The templates, UI Library demo and agent-chat installation recipe use this pair. Keep them aligned when upgrading. A matching major version alone does not establish compatibility.

The plugin declares `ai` as an ordinary runtime dependency: its server executes SDK code and its public declarations reference SDK types. It declares the React SDK as a required peer for the application to resolve the forthcoming client integration. Applications provide the catalog pair directly; the package does not depend on a workspace-only development import. The existing React catalog satisfies the React SDK's published peer range.

## Identity and persistence

Allocate the UI message ID before starting a public stream. For native execution it is also the database record ID; no draft insert is required to allocate it. Metadata carries the conversation, creation time, agent, turn and execution association. These IDs are independent of SDK tool call IDs, data-part IDs and the resumable transport's stream ID. A stream ID belongs to transport state, not to the identity of a saved message.

`seq` is absent until the first save. `revision` starts at zero before saving and increases when a persisted message changes, including an approval continuation. History reconciliation must compare revisions by message ID, and cannot rely on an append-only sequence cursor. The persistence and change-notification stages must implement by-ID refresh and ensure an older history response never replaces newer SDK state. These fields describe the contract; this stage adds no database schema or writes.

Runner aggregation must retain every distinct source record in `metadata.sourceRecords`, with its database ID, sequence, stable stream part ID and index in the ordered parts (SDK text parts do not retain their stream IDs after assembly). A logical assistant UI message does not make those records share a database primary key. The adapter must apply the same grouping to streaming, history and pagination. It must only project information actually retained by the existing Runner, and must not invent tool calls or approvals.

## Validation and public parts

`validateAppUIMessages()` first rejects values that cannot be saved as lossless JSON, then delegates message and part validation to the installed SDK with the exported metadata and data schemas. It requires metadata, nonempty and unique message IDs, and rejects provider annotations and tool metadata from public parts. Callers must project public output before validation; validation does not redact private tool output or grant access to files, references or business records. SDK objects with explicitly undefined properties must be finalized into JSON data before validation; the validator rejects rather than silently dropping values.

Tools use standard SDK tool parts, including approval states and real tool call IDs. `AppUITools` constrains public input and output to JSON; each tool's business schema and authorization remain the server's responsibility. Model-only evidence must remain in a private execution context. A structurally valid approval part is never evidence that a browser is entitled to approve it.

`appUIDataSchemas` defines `data-notice` (notification type, fallback title and optional translated parameters) and `data-business` (business kind, stable record ID and public JSON payload). Producers and renderers must use a stable SDK data-part ID to update the same card. Application cards, references and consultation displays may use these public extension points; their presence does not restore a removed production workflow. Independent notifications are persisted and fetched through the business subscription after a model response ends. Rendering and fallback behavior are verified in the consumer stage.

`appUIMessageText()` joins text parts in order for search and message extensions. It does not flatten files, tools or cards into text. Ordered parts remain authoritative. `convertToModelMessages()` ignores these data parts by default; a server that needs business data in model context must explicitly convert authorized data. See the SDK's [metadata guide](https://ai-sdk.dev/docs/ai-sdk-ui/message-metadata) and [message persistence guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence).

## Remaining integration points

- Native sessions, storage and HTTP routes must save the finalized message directly in `content.original`, validate trusted history before SDK conversion and accept only the current user's validated input or a server-recognized approval response. Do not accept browser-supplied assistant history, tool output, metadata or configuration as authoritative. Bind approvals to the owner, conversation, execution, message and pending call; preserve effect-review gates and background structured execution.
- The OnlineAgent Runner adapter and shared stream infrastructure must use SDK chunks and response helpers, shared Redis recovery when enabled, independent producer lifetime and a separate Stop action. No Runner core or execution provider changes are part of this foundation.
- The plugin controller, message model, submissions, API and extensions still consume the existing contract and must be replaced in the client stage. Remove their old stream types and parser when the native and Runner transports and all consumers have moved; do not add a compatibility codec or adapter.
- Registry agent-chat, the typed website demo, and the Examples component copies require their own consumer migration. Preserve Examples' model readiness and unknown-outcome handling. Validate the extension matrix through the formal public extension context, including translation fallback, timeline mixing, message extras, consultation display, Composer slots and installed application customizations. Private Studio integration remains outside this branch's scope.
- Full cross-instance Redis recovery, approval execution, generated application build/smoke and the historical extension matrix are later-stage acceptance work. This stage tests SDK types, validation, conversion and stream assembly only.

This foundation adds no queries, writes, locks, transactions, polling or Runner claim work. Validation is in-memory traversal of the supplied messages and their JSON data; it is not wired into a request path in this stage.
