# UI message clients

The public client entry is `@nocobase/app-plugin-agents/client/chat`. `ChatProvider` owns one `@ai-sdk/react` Chat per conversation. Sidebar, full-page and home surfaces share that owner. The SDK owns messages, ordered parts, streaming status, response parsing, approval updates and resumption. The application coordinator owns history page metadata, unknown submissions, admission reconciliation, identity disposal and business Stop.

Mount a single provider inside the application's router and key its lifetime by authenticated identity. Dispose the old identity before mounting the next, clear the unscoped panel storage and chat query cache, and discard retained application callbacks. Examples implements this in `OnlineAgentProvider`; it preserves drafts across surface changes within the same identity. A request finishing after disposal cannot publish messages, navigate an abandoned editor, update another account's cache or invoke retained Undo.

## Composer lifecycle

`openChat({ conversationId: null })` and `selectConversation(null)` always start a fresh composer, even while the current conversation is already blank. Opening a different conversation clears the previous prefill; omitting the ID or reopening the same ID preserves the local draft. A supplied `draft`, including `''`, is applied in the same update as reset and never sends automatically. Business entries only open the target with optional prefill; they do not clear textarea DOM or own upload cleanup.

`ChatPanelValue.composerRevision` is the local reset identity. The installed `Composer` keys only its input subtree by it, clearing text, unsent attachments and preparation errors, aborting uploads, and rejecting stale completion callbacks. The blank-conversation body also receives a fresh identity so an accepted but delayed creation cannot navigate the replacement editor or retain its optimistic message there. Existing conversation streams and durable messages are not reset. Pass `editorRevision: panel.composerRevision` to `useSendMessage` so a new blank editor does not reuse an earlier editor's pending/unknown creation gate.

Pre-send model/Agent changes and first-send ID promotion use `selectConversation(id, agentId, { preserveComposer: true })`; the promotion retires old prefill without remounting the input or losing focus. Ordinary close/reopen does not change the revision. Full-page scopes keep their own stable composer revision rather than inheriting resets from the closed sidebar.

A fresh composer also clears carried work context: pinned business objects, registered page-object chips, filters, selected page text and checked UI sources. Page/form registrations remain available for subsequent explicit selection; cleared sources are not read or included in the next message. Closing and reopening the same chat, changing the executor and promoting a newly created conversation ID preserve its carried context. Business launchers attach only the intended context atomically with `openChat({ conversationId, draft, pin, uiSources: [{ kind: 'form', id: 'example-request' }] })`; do not call `selectUI` before opening a different conversation because the reset discards the old selection. UI values are still read only when sending, never when opening the chat. A normal new chat may retain its current route identifier, but carries no old object/filter/selection/UI snapshot.

## Resend and inline text edits

`useResendMessage(conversationId)` shares destructive admission across all views of the existing controller. Pass `{ messageId }` for original resend or `{ messageId, input: { text } }` for editing. Only a native user message may be targeted; assistant refresh passes its exact `metadata.sourceUserMessageId`, not a positional guess. The controller reads an unloaded source by ID before using the official SDK `regenerate` or `sendMessage` edit entry. Background and Runner do not gain regeneration.

SDK local truncation before POST is intentional. Durable replacement remains atomic and authoritative: rejection preserves the edit, acceptance closes it even when canonical synchronization fails, and unknown admission never retries POST or restores a stale suffix. `conversation.historyReplaced` invalidates late pages/ID reads; reconnect, manual refresh and the shared durable poll reconcile existing IDs in bounded batches so a missed deletion event cannot resurrect history. Keep the inline editor independent of the bottom composer draft. Edit Send and assistant Regenerate execute directly without a confirmation dialog. Keep pending-state disabling and a synchronous duplicate-submit guard; permanent suffix deletion and possible repeated business effects still apply. See [the full contract](./message-resend.md).

## Input, admission and recovery

The SDK transport uses the host's authenticated `ApiClient.stream`. A POST contains only the current `message: { id, role: "user", parts: [{ type: "text", text }] }`, authorized attachment IDs and optional page context. It never sends the SDK's complete browser history, assistant parts or tool output as input. Uploaded files remain the existing attachment service's responsibility.

The response headers acknowledge admission; the coordinator then reads canonical history and conversation detail. Pending controls remain until the stable user ID, or Runner's `metadata.clientId`, is found in saved history. An unknown POST result is reconciled without automatic resend. Explicit creation recovery still warns that a conversation may already have been created.

Initial recovery starts only for a known running, non-approval-waiting conversation. GET recovery uses the SDK transport's reconnect entry, including on browser online/realtime reconnection. Manual recovery never POSTs user input. The shared component replays a response's full prefix. After a network error, the coordinator retires the SDK owner that retained delta-resume state and publishes one fresh shared owner using public UIMessage state. Pending tool state is reread from trusted history before replay; a missing stream retains the interrupted display and occupancy. No SDK private fields or custom stream parser are used. A missing/expired stream or a disabled shared recovery facility leaves durable history and execution detail authoritative. An SDK `ready`, EOF, `onFinish` or standard `finish` cannot mark business execution complete. Approval waiting remains occupied.

Recovery is single-flight for the current execution; an already submitted or streaming SDK owner is reused. `StreamState.recovery` distinguishes `recovering`, `history` and `interrupted` for application presentation. A running execution without a connected reader is not itself an error, and recovery hides the previous transport error until its attempt settles. A 204 response selects history synchronization and suppresses further stream GETs for that execution, including after online/realtime reconnection or a failed Stop request. A later execution can recover independently. Recovery callbacks and history reads are scoped to their owner, command and controller lifetime.

Stop uses the independent business endpoint. It remains stopping until trusted detail confirms idle. Disposing a subscriber only stops its SDK reader. A lost reader may be released after its matching saved assistant message and terminal execution have been read; that reconciliation never stops business execution or repeats input/tools. Save failure keeps occupancy and exposes explicit finalization retry with visible failure feedback.

A reader still in `submitted` without a start event can also be released. Before reading terminal detail, its current user input must already be acknowledged and saved; matching saved output or a terminal notice must belong to that execution. This avoids treating an old idle snapshot or an unaccepted input as completion. The existing history poll performs this reconciliation without another timer or business mutation.

## History and source segments

An aborted SDK text part can retain `state: "streaming"` in saved history. A writing cursor therefore also requires the message to own the current active SDK response. Registry and Examples pass that presentation flag only to the active response at the SDK working array's tail; saved partial replies stay still after Stop, refresh and later turns. This presentation flag does not establish business completion.

History APIs return `AppUIMessage[]`. During a live response the SDK working array keeps its active assistant last so subsequent SDK chunks update it in place. Independent notices remain in that same owner; source metadata determines their displayed position. Approval and recovery select the same response target, and the scroll anchor follows the first displayed source segment. Merge by message ID and monotonic `metadata.revision`; preserve an actively streaming SDK assistant against stale history snapshots. A canonical user replaces its optimistic counterpart by ID or client ID. Drain every `nextAfter` page before advancing the forward watermark. Revision events reread exact IDs in batches of at most 100 and never advance that watermark. Failed revision reads retain the requested IDs for later durable polls or repeated announcements until the requested revision is acknowledged.

`chatMessageSegments(messages)` creates rendering descriptors referencing the original SDK object. It does not create additional logical messages. Each Runner source record carries its actual sequence, creation time, source record ID and stable part ID in `metadata.sourceRecords`. Render the descriptor's part indexes at its source time; independent notifications retain their own identity between source blocks. A complete logical message remains intact in history pagination. Render `renderMessageExtra` once, on the final segment.

The shared presentation omits empty text/reasoning and SDK step bookkeeping, and only the framework's `execution-status` success notice; the original SDK messages and their durable execution outcomes remain unchanged. Thinking is shown at the next response position rather than as an empty assistant bubble. Successful turns add no generic completion banner, while failure, cancellation, approval and uncertain-effect feedback remain available. An application's `renderMessageExtra` still renders once even when the message has no visible standard parts. The Registry transcript scrolls vertically; long code blocks and tables keep their bounded, local scrolling rather than widening the conversation.

Render nonempty SDK reasoning parts in their original order and at their original part indexes, using the same Markdown sanitization as text. A reasoning part counts as visible output, so reasoning-only responses do not also show generic thinking. A part opens automatically only while it belongs to the active response and has `state: "streaming"`; it collapses when that part ends, and history starts collapsed even if a saved partial part still says streaming. Each mounted message/part keeps its own explicit user-open/user-closed choice across deltas, end chunks and message revisions; do not reset it on those updates. New messages and a genuinely remounted history view start with the defaults. Neither reasoning nor its expand/collapse control adds a text-writing cursor or proves execution completion. Runner output stays text-only unless its existing adapter supplies genuine SDK reasoning.

Native messages generally have one segment. The server places the authorized display snapshot in `metadata.context`, stripping provider-private fields. Input context remains IDs-only and is reauthorized on the server. File parts use their authorized URL and media type; the installed attachment list retains image previews without inventing a size the SDK file part does not contain.

## Extensions

`ChatExtensionsContext` accepts UIMessage directly. Existing application business components adapt to these public boundaries:

| Extension                                    | Input and behavior                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useTimelineItems(conversationId, revision)` | Stable-key business items sorted by time among source segments; the hook may query authorized application data. Message insertions, revisions and business occupancy update its revision input. Application business subscriptions may refresh its own queries independently. |
| `renderMessageExtra(message)`                | The complete original UIMessage once per logical message. Extract all text with `appUIMessageText`; reference discovery, code exclusion, deduplication and record permissions remain application responsibilities.                                                            |
| `renderNews(notice, message)`                | Independent `data-notice` card. Returning null falls back to `newsText`, then the persisted title.                                                                                                                                                                            |
| `newsText(notice, t)`                        | Localized wording, or null for the persisted title.                                                                                                                                                                                                                           |
| `renderDataPart(part, message)`              | Ordered public `data-notice` or `data-business` display. Null retains the built-in display, including the ConsultationCard for a genuine consultation payload.                                                                                                                |

Independent system notifications are persisted through the existing `ConversationService.deliver()` business transaction, then read through business announcements or durable polling. They do not write into a finished model response or wake a new OnlineAgent execution. There is no separate `OnlineAgentService.notify()` entry. These display contracts do not restore a historical Studio plan/delegation producer or the deleted ask_agent chain.

`Composer` exposes `toolbar` and `notice` as child component props. The installed view uses them for application actions and notices; they are not generic top-level ChatPanel slots. Preserve application-owned headers, avatars, menus and readiness/error handling when updating installed Registry source.

Tool approval buttons use genuine SDK approval parts, binding `messageId`, `executionId` and `approval.id` to the server's pending call. SDK approval updates are followed by a controlled approval POST and canonical reread. They never submit browser tool output. Runner does not gain remote tool approval support. Effect-review hints are advisory after actual tool termination and finalization; pending approvals still enforce their owner, execution, message and tool-call bindings.

## Requests and cost

A visible conversation has one shared durable-history poll, regardless of surfaces: every 5 seconds while running, every 30 seconds while idle, and none while the document is hidden or after the last surface unmounts. This provides independent-notification catch-up when instance-local announcements are missed. Running conversation detail retains the existing 60-second React Query polling; shared keys deduplicate in-flight reads, while staggered observers can each refetch. The SDK stream removes the old one-second text-growth polling.

A forward history poll makes one GET plus each bounded `nextAfter` continuation. An authoritative refresh additionally rereads the loaded durable message IDs in batches of at most 100; it applies absence only after every batch succeeds. Recovery of an interrupted pending tool can add one ID GET before its GET stream. A revision announcement makes one batched ID GET; duplicate revision announcements from multiple surfaces are coalesced. Successful input admission adds history reconciliation and a detail GET; SDK completion/recovery adds detail, forward history and an ID reread for a revisable assistant. A stalled subscription may require a second completion reconciliation after its SDK reader stops. These synchronization reads create no SQL writes, locks or transactions. Resend itself is an explicit destructive admission transaction and is never an automatic poll or recovery write.

Measured warm read requests, excluding the host's authentication and authorization queries, are shown below. The native fixture has one completed reply; the Runner fixture has two saved source blocks and an interleaved notification. These counts describe the extra requests a client makes, not new SQL added inside an existing endpoint. Every sample has zero writes, transactions and explicit locks.

| Request                          | Native SELECTs | Runner SELECTs |
| -------------------------------- | -------------: | -------------: |
| Full history                     |              3 |              6 |
| Forward poll with no new row     |              3 |              4 |
| One logical message reread by ID |              3 |              5 |
| Saved execution detail           |              2 |              6 |

Thus an added idle forward poll costs three native or four Runner SELECTs per visible conversation every 30 seconds in these fixtures. Opening a page, reading a changed group or following pagination adds its corresponding read requests. Batched IDs and larger source groups change row counts and execution time; the table is not a production latency estimate. Existing approval, input, Stop and finalization mutations retain their server-side costs; the SDK coordinator does not add another mutation or lock around them.

The server's existing native, notification and shared Redis costs remain those in [UI messages](./ui-messages.md#shared-recovery-request-cost). Runner claims, heartbeats, execution scheduling, synchronization, lifecycle and machine writes are unchanged.

## CLI input

The public command uses the same current-message body, without legacy `content/clientId` request mapping. Put the entire JSON body in a file:

```json
{
  "message": {
    "id": "new-client-uuid",
    "role": "user",
    "parts": [{ "type": "text", "text": "Review the checklist" }]
  }
}
```

Run `conversation message send <conversation> --file current-user-message.json`, optionally with repeatable `--attach`. Use a new ID for a new input. An unknown outcome requires history/state reconciliation; do not blindly repeat the command. Its response is the standard UI stream, not the former JSON send envelope. The history command's columns read SDK `metadata.seq`, `role`, `parts` and `metadata.createdAt` directly.
