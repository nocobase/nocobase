# Realtime and periodic reconciliation

Realtime notifications invalidate authoritative API snapshots. They are transient: publish failures and external systems without notifications still need recovery. The refresh scheduler serializes reads, coalesces events, retries transient failures and pauses hidden documents. `refreshIntervalMs` is an optional reconciliation interval, disabled by default; it does not replace topic readiness or reconnect recovery.

## Audited business reads

The audit covered 22 business read loops in 15 source files: 19 production entries and three examples. UI clocks, debounce timers, server heartbeats and worker leases are excluded. Fourteen entries now use event-driven refresh with one-minute reconciliation or have reduced their existing fallback to one minute. Eight retain their original timing for the specific reasons below.

| Entry                                | Current strategy                                                                                   | Why a periodic read remains                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Projects intake job                  | `intake.changed` plus 60-second reads while running                                                | Recover failed best-effort announcements; stop after completion.                                   |
| Knowledge document index             | Indexer `onChange` when available, plus 5-second reads while pending                               | Third-party indexers may implement only status reads.                                              |
| Knowledge unfinished document list   | Indexer `onChange` when available, plus 5-second reads while work is pending                       | Completion notifications are optional for external indexers.                                       |
| Knowledge rechunking                 | Committed space/chunk events plus 60-second reconciliation while running                           | Recover after process interruption or a failed announcement.                                       |
| Agent Sessions computers             | Events plus 30-second reads                                                                        | Online status can expire with time without a database write.                                       |
| Agent Sessions list                  | Events plus 60-second reconciliation                                                               | Recover lost announcements and changes from another instance.                                      |
| Agent Sessions detail                | Events plus 60-second reconciliation                                                               | Linked resources can change independently of the session.                                          |
| Agent Sessions transcript            | Cursor-based event reads plus 60-second reconciliation                                             | Recover persisted stream revisions and missed events.                                              |
| Agents run events                    | Event-driven cursor reads plus 60-second reconciliation while open                                 | Recover missed signals without discarding earlier events.                                          |
| Agents subject run list              | Discovery signals plus 60-second reconciliation while runs are open                                | Recover missed status changes.                                                                     |
| Agents run detail                    | Events plus 60-second reconciliation while open                                                    | Recover terminal state if publication fails.                                                       |
| Agents conversation detail           | Events plus 60-second reconciliation while a run is open                                           | Recover run/conversation state after missed signals.                                               |
| Agents conversation messages         | Persisted revision events plus 60-second reconciliation while streaming or active                  | Cursor/sequence merging remains authoritative.                                                     |
| Agents runner registration           | Events plus the existing 3-second wait                                                             | A bounded interactive connection flow must also work before event readiness.                       |
| Mail unread count                    | Events/focus plus the existing 60-second reconciliation                                            | Provider-originated changes can arrive through other processes.                                    |
| Mail workspace sync progress         | Start/progress/terminal events plus 60-second reconciliation while active                          | Recover from a worker crash or failed publication.                                                 |
| Mail accounts sync progress          | Start/progress/terminal events plus 60-second reconciliation while active                          | Empty results and failures now announce state changes too.                                         |
| Mail account removal                 | Removal event plus 60-second reconciliation while removing                                         | Durable cleanup can retry after a worker interruption.                                             |
| Releases app summary                 | Existing 1.5-second busy / 5-second normal health reads, with failure backoff and hidden-tab pause | Runtime health is observed from an external host; database events cannot report all host failures. |
| Office Flows example loader          | Committed lifecycle events plus 60-second reconciliation                                           | Parameter edits and effect bookkeeping can occur outside lifecycle transitions.                    |
| Mail example initial synchronization | Existing bounded 500-ms wait                                                                       | This waits for initialization with a deadline; it is not a permanent page refresh loop.            |
| Lifecycle example follow-up          | Existing conditional read based on effect state / `runAfter`                                       | Waiting effects can become due without a transition event.                                         |

The shared lifecycle React hook still offers configurable `refreshMs` (four seconds by default); callers with event coverage can set it to zero. Agent choice discovery retains its five-minute TTL because it describes remote capabilities rather than database mutations. Authentication `onOpen` listeners remain identity lifecycle hooks.

## Acceptance boundaries

- An event arriving during an older request causes a later authoritative read, including initial loading and prefix matches.
- Reconnection and topic readiness catch up missed state; an HTTP failure retries without waiting for another event.
- A continuously streaming record makes visible progress without repeatedly cancelling slow reads; cursors and revisions handle duplicates.
- Every committed mail synchronization start, progress, retry, completion, failure and cancellation announces to the account owner, including an empty mailbox.
- Rechunking start/completion announces space invalidation, even when no document changes; an indexer can announce externally committed state through `onChange`.
- Office Flows reads after a lifecycle event and readiness, and performs no four-second reads on a quiet page.
- A hidden page does not perform fallback stream reads; disposal cancels scheduled follow-ups and application refresh timers.
- Retained polling is part of the recovery contract. Removing it requires equivalent coverage for external state changes and failed publication, not just a working WebSocket.
