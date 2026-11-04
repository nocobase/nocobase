# Conversation snapshots

An owner can share a conversation with named, authenticated application users. A recipient reads the saved history through the ordinary conversation URL. Sharing does not grant business-record permissions, add the conversation to the recipient's list, or deliver realtime updates. There are no anonymous or public links.

## Storage and cutoff

The `agConversationShares` migration adds `id`, `conversationId`, `userId`, `cutoffSeq`, `snapshotAt`, `title`, `createdAt` and `updatedAt`. A unique `(conversationId, userId)` index supports each access check and repeat sharing. No messages or files are copied. The title is saved with the grant so a later rename cannot expose new text.

Granting reuses the conversation's existing write serialization with input admission and finalization. Open Runner runs, including a run closing its final projection, are excluded from their first input onward. A native execution in progress, waiting for approval or closing is excluded from its first input onward. The cutoff is the highest safe message sequence; `snapshotAt` is the last included message's time, or creation time for an empty history. Repeat sharing replaces the recipient's cutoff. Runner work with several queued inputs remains excluded until that run ends.

Native resend edits and deletes stored history. It is refused while any snapshot is shared; revoke those snapshots before rewriting history. Ordinary new messages remain available to the owner and leave snapshots unchanged. Deleting a conversation also deletes its grants.

## HTTP boundaries

All paths below are relative to `/api/agents/conversations/:conversationId` and require native application authentication.

| Request                                    | Authorization and result                                                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /shareCandidates`                     | Owner only; candidates from the application's scope.                                                                                                                                                                                            |
| `GET /shares`                              | Owner only; recipients and their cutoffs.                                                                                                                                                                                                       |
| `PUT /shares/:userId`                      | Owner only; validates the current scope and creates or advances the cutoff.                                                                                                                                                                     |
| `DELETE /shares/:userId`                   | Owner only; revokes the recipient.                                                                                                                                                                                                              |
| `GET /`                                    | Owner receives ordinary detail; recipient receives a whitelist of snapshot fields, without execution, runtime, wait, project or attention data.                                                                                                 |
| `GET /messages`                            | Owner retains ordinary backend history; recipient uses a read-only projection bounded by `cutoffSeq`. Older pages, `after`, direct message IDs and expanded logical Runner responses all preserve the bound. `lastSeq` reports only the cutoff. |
| `GET /links`                               | Owner or recipient; recipient links predate the cutoff and resolve using the viewer's own permissions. Unreadable records are omitted.                                                                                                          |
| `GET /events`, `GET /usage`, `GET /config` | Owner only, including after a share is granted.                                                                                                                                                                                                 |
| Every conversation write                   | Owner only, including send, queue, withdraw, stop, approval, finalize, config, rename, archive, delete and link management.                                                                                                                     |

`GET /api/agents/chatAttachments/:id/content` checks the conversation owner or an existing grant, then checks that the attachment's actual owning message belongs to that conversation and is at or before the cutoff. A run credential retains its original conversation-and-owner check; sharing gives runs no new access. Unsent uploads remain the uploader's alone. No file bytes are read before authorization.

An absent conversation, absent grant and revoked grant return the same 404. No grant cache delays revocation. The next HTTP read after revocation fails; content already downloaded cannot be recalled. Historical page references are resolved again as the viewer, without reusing the owner's cached titles, URLs or page filters. The transcript's text and public tool output are intentionally shared content, so the dialog warns that they may be sensitive.

## Application extension

The default directory is the existing `agents.people` provider. Applications can instead call `agents.conversations.shares.provideScope((conn, ownerId, conversationId) => candidates)`. Candidate listing and granting call the same scope, with disabled users removed through `people.inactive`. The returned disposer removes the provider. No project dependency is introduced.

A successful `conversations.get()` now proves read access, not ownership. Host operations that previously used it as an ownership check must reject detail with `snapshot` before allowing a write or owner-session binding. All conversation write methods retain their independent owner checks.

Applications continue to register business link kinds and page-context resolvers; these receive the actual viewer's ID. A scope provider must return application users who may be selected by that owner. Without a directory or scope, the candidate list is empty and granting arbitrary IDs is refused. The Examples application's provider demonstrates a directory limited to enabled person accounts.

## Browser integration

Update the UI Library `agent-chat` and `agent-chat-details` recipes together with the matching Agents package. They include `ShareConversation` and `SnapshotView`. Configure `ChatProvider.conversationPath` with an application-relative authenticated route for copied links. `resolveAppUrl` preserves the application's deployment base path; copying uses the shared HTTP-compatible copy utility.

The owner's conversation menu opens a recipient picker, the existing list, Update and Revoke, and Copy link. A recipient's `snapshot` detail selects the separate historical view in `ConversationView` and the linked workspace. It renders the cutoff label and saved messages with `readOnly` tool contexts, without a composer, usage query, run state, stream receiver or application timeline hooks. Custom tool renderers must honor their existing `context.readOnly` contract. The shared conversation is never inserted into My sessions. The Examples `/chat/:conversationId` page and panel use these contracts.

## Cost and verification

A grant adds one existing conversation lock and one share insert/update in a transaction initiated by the owner. Revocation deletes the selected grant. No new claim, heartbeat, sweeper or output-batch operations are introduced. Each recipient read adds a conversation lookup and indexed grant lookup, and history/file reads constrain their existing message queries by sequence. Owner history requests add one ownership lookup before using their ordinary backend. Recipient views read detail, history and authorized links when opened, reread on focus and request older history on pagination, with no live poll, event stream or per-batch checks. Warm SQLite measurements on a one-turn snapshot are 2 SELECTs for detail, 7 for Runner history, 3 for native history and 4 for an attachment, with zero writes, locks and transactions. Business reference resolvers add their own viewer-specific reads.

`tests/conversation-shares.test.ts` exercises Runner and native history, active-turn exclusion, direct IDs, pagination, files, repeat sharing, revocation, viewer-only record resolution, owner-only notification audiences and the write/live-read permission matrix. Query-count bounds assert zero writes, locks and transactions on recipient reads. `tests/conversation-shares-migration.test.ts` applies, rolls back and reapplies the schema on the configured test dialect.

## Left out

Public links, anonymous access, project-member grants, streaming recipients, extra output channels, long-term run-event retention and message duplication are excluded. Studio's application-specific scope, route and installed recipe update follow after the framework merges. Directory search/paging for very large installations and historical run-event retention remain separate work.
