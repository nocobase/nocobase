# UI message clients

The public client entry is `@nocobase/app-plugin-agents/client/chat`. `ChatProvider` owns one `@ai-sdk/react` Chat per conversation. Sidebar, full-page and home surfaces share that owner. The SDK owns messages, ordered parts, streaming status, response parsing, approval updates and resumption. The application coordinator owns history page metadata, unknown submissions, admission reconciliation, identity disposal and business Stop.

Mount a single provider inside the application's router and key its lifetime by authenticated identity. Dispose the old identity before mounting the next, clear the unscoped panel storage and chat query cache, and discard retained application callbacks. Examples implements this in `OnlineAgentProvider`; it preserves drafts across surface changes within the same identity. A request finishing after disposal cannot publish messages, navigate an abandoned editor, update another account's cache or invoke retained Undo.

## Input, admission and recovery

The SDK transport uses the host's authenticated `ApiClient.stream`. A POST contains only the current `message: { id, role: "user", parts: [{ type: "text", text }] }`, authorized attachment IDs and optional page context. It never sends the SDK's complete browser history, assistant parts or tool output as input. Uploaded files remain the existing attachment service's responsibility.

The response headers acknowledge admission; the coordinator then reads canonical history and conversation detail. Pending controls remain until the stable user ID, or Runner's `metadata.clientId`, is found in saved history. An unknown POST result is reconciled without automatic resend. Explicit creation recovery still warns that a conversation may already have been created.

Initial recovery starts only for a known running, non-approval-waiting conversation. GET recovery uses the SDK transport's reconnect entry, including on browser online/realtime reconnection. Manual recovery never POSTs user input. The shared component replays a response's full prefix. After a network error, the coordinator retires the SDK owner that retained delta-resume state and publishes one fresh shared owner using public UIMessage state. Pending tool state is reread from trusted history before replay; a missing stream retains the interrupted display and occupancy. No SDK private fields or custom stream parser are used. A missing/expired stream or a disabled shared recovery facility leaves durable history and execution detail authoritative. An SDK `ready`, EOF, `onFinish` or standard `finish` cannot mark business execution complete. Approval waiting remains occupied.

Stop uses the independent business endpoint. It remains stopping until trusted detail confirms idle. Disposing a subscriber only stops its SDK reader. A lost reader may be released after its matching saved assistant message and terminal execution have been read; that reconciliation never stops business execution or repeats input/tools. Save failure keeps occupancy and exposes explicit finalization retry with visible failure feedback.

## History and source segments

An aborted SDK text part can retain `state: "streaming"` in saved history. A writing cursor therefore also requires the message to own the current active SDK response. Registry and Examples pass that presentation flag only to the active response at the SDK working array's tail; saved partial replies stay still after Stop, refresh and later turns. This presentation flag does not establish business completion.

History APIs return `AppUIMessage[]`. During a live response the SDK working array keeps its active assistant last so subsequent SDK chunks update it in place. Independent notices remain in that same owner; source metadata determines their displayed position. Approval and recovery select the same response target, and the scroll anchor follows the first displayed source segment. Merge by message ID and monotonic `metadata.revision`; preserve an actively streaming SDK assistant against stale history snapshots. A canonical user replaces its optimistic counterpart by ID or client ID. Drain every `nextAfter` page before advancing the forward watermark. Revision events reread exact IDs in batches of at most 100 and never advance that watermark. Failed revision reads retain the requested IDs for later durable polls or repeated announcements until the requested revision is acknowledged.

`chatMessageSegments(messages)` creates rendering descriptors referencing the original SDK object. It does not create additional logical messages. Each Runner source record carries its actual sequence, creation time, source record ID and stable part ID in `metadata.sourceRecords`. Render the descriptor's part indexes at its source time; independent notifications retain their own identity between source blocks. A complete logical message remains intact in history pagination. Render `renderMessageExtra` once, on the final segment.

The shared presentation omits empty text, SDK step/reasoning bookkeeping, and only the framework's `execution-status` success notice; the original SDK messages and their durable execution outcomes remain unchanged. Thinking is shown at the next response position rather than as an empty assistant bubble. Successful turns add no generic completion banner, while failure, cancellation, approval and uncertain-effect feedback remain available. An application's `renderMessageExtra` still renders once even when the message has no visible standard parts. The Registry transcript scrolls vertically; long code blocks and tables keep their bounded, local scrolling rather than widening the conversation.

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

A visible conversation has one shared durable-history poll, regardless of surfaces: every 5 seconds while running, every 30 seconds while idle, and none while the document is hidden or after the last surface unmounts. This provides independent-notification catch-up when instance-local announcements are missed. Running conversation detail retains the existing 5-second React Query polling; shared keys deduplicate in-flight reads, while staggered observers can each refetch. The SDK stream removes the old one-second text-growth polling.

A forward history poll makes one GET plus each bounded `nextAfter` continuation. Recovery of an interrupted pending tool can add one ID GET before its GET stream. A revision announcement makes one batched ID GET; duplicate revision announcements from multiple surfaces are coalesced. Successful input admission adds history reconciliation and a detail GET; SDK completion/recovery adds detail, forward history and an ID reread for a revisable assistant. A stalled subscription may require a second completion reconciliation after its SDK reader stops. None of these reads creates SQL writes, locks or transactions. Source creation timestamps and public context are derived in the existing projection/snapshot write; no new storage write is introduced.

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
