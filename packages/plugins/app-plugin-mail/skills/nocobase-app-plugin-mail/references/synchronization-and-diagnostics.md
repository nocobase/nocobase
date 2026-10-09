# Synchronization and diagnostics

## Start and observe synchronization

Use `MailService.startSync()` or `POST /api/mail/accounts/:accountId/sync`. The workspace's all-mailbox action targets active accounts supporting incremental synchronization; selecting an account narrows the scope. Observe history through `GET /api/mail/syncRuns` (paged by `page` and `pageSize`), a run through `GET /api/mail/syncRuns/{syncRunId}`, or `/dev/mail/logs/sync`.

Automatic synchronization is configured globally through `mail.automaticSyncIntervalMs` or `MAIL_AUTOMATIC_SYNC_INTERVAL_MS`. It defaults to `300000` milliseconds, minimum `60000`, and applies to both existing and new accounts. The runtime checks due accounts every minute. Account forms and account-update APIs do not set independent automatic intervals.

`mail.syncBatchSize` or `MAIL_SYNC_BATCH_SIZE` defaults to 100, with an integer range of 1–200. This bounds each provider list page, not the total imported history. The account screen defaults a new initial sync to one calendar month ago. Direct account-creation APIs require `initialSyncReceivedAfter`; direct initial-sync requests must carry `receivedAfter` unless the account already has a saved start date. Both are RFC 3339 date-times such as `2026-01-01T00:00:00Z`. Legacy accounts without one use a one-month boundary for automatic or push-triggered first syncs. An active pre-upgrade initial run missing a valid boundary restarts with the same one-month fallback; Gmail rejects any initial list call without a valid date. The sync request no longer accepts `maxMessages`; an import is bounded only by its start date.

## Gmail quota, HTTP batch, and retry behavior

For Gmail, one list page is fetched with `messages.list`, followed by one `messages.get` per message. Mail groups up to 10 message gets into each HTTP `multipart/mixed` batch request. Batching reduces HTTP connections only: Google charges every embedded call separately, so `messages.get` still costs 20 quota units and `messages.list` costs 5. A 100-message page therefore costs about 2,005 units before incidental profile, label, history, or fallback metadata calls; it does not become a single quota unit. See [Gmail quota configuration](configuration-and-accounts.md#gmail-quota-configuration) for defaults and project overrides.

Google recommends keeping Gmail batches at or below 50 calls; Mail uses 10 to bound response size. A batch-level transport failure retries the page; an individual embedded error is preserved and surfaced. Quota pacing uses the per-user and per-project limits configured for the Gmail provider with 20% headroom. The defaults are 6,000 units/user/minute and 1,200,000 units/project/minute. Since pacing state is process-local, split those quota values among app processes sharing the same project or centralize sync work on one process.

HTTP 403 is not automatically a quota failure. `rateLimitExceeded` and `userRateLimitExceeded` (and HTTP 429) are retryable; authorization/permission 403 responses are not. Retryable sync errors honor `Retry-After` and use truncated exponential backoff with random jitter, capped at 64 seconds. After 12 consecutive scheduled retries, the run is marked failed for an operator to inspect and retry. A local quota override cannot change the quota granted by Google.

Official references: [Gmail API quotas and retry guidance](https://developers.google.com/workspace/gmail/api/reference/quota?hl=zh-cn) and [HTTP batch behavior and limits](https://developers.google.com/workspace/gmail/api/guides/batch?hl=zh-cn). [verified: 2026-09-26]

## Recovery and correctness

Mail captures a provider baseline before scanning history, then alternates history and incremental pages with separate persisted cursors. It serializes account writes and commits messages, checkpoints and the next outbox task together. The outbox relay submits background jobs; each job advances a bounded step. Application code should not enqueue independent sync jobs or write checkpoints directly.

Startup and periodic maintenance recover expired workers and published job deliveries without progress. Recovery uses task revisions and leases so old workers cannot advance newer state. Pending delayed retries retain their schedule. An idle-looking run is not evidence that a replacement run should be created; inspect its public progress and the jobs backend first.

A provider cursor error starts a fresh scan of the configured history range with a new baseline. Never set a failed cursor to “current” and report completion without scanning, because that loses unseen changes. Existing messages and local metadata remain available; history must not overwrite newer synchronized state or resurrect a message deleted during the scan. A rescan does not reconcile deletions that have already disappeared from provider history.

The owner can cancel an active run through `POST /api/mail/syncRuns/{syncRunId}/cancel` and retry a failed or cancelled run through `POST /api/mail/syncRuns/{syncRunId}/retry`. Keep retry and cancellation behind the service/API transitions rather than editing run status.

## Incomplete content

Keep visible records with `contentStatus: deferred` or `failed`. IMAP bounds encoded body input and retained decoded text to 2 MiB each per message during background synchronization (16 MiB for manual retries using bounded chunk requests), while retaining envelope and attachment metadata for deferred content. Attachments stream separately on demand; large attachments alone do not defer a small body. Parsing failures retain a durable message identity rather than blocking the whole mailbox.

The owner can load or retry content through the message detail action or `POST /api/mail/accounts/:accountId/messages/:messageId/retryContent`. This fetch is independent of the background size limit and can use memory proportional to the full message. Preserve current read/starred state, labels, notes and follow-up markers during a content retry.

Logs expose `recovering` and `historyComplete` to distinguish recovery from unfinished history import. A sync run can finish as `partial` when content remains unresolved. Its `pendingMessages` count describes the completion snapshot; loading content later does not rewrite historical log totals. Later synchronization refreshes those counts. Distinguish this from a `failed` batch caused by a network or authentication error.

## Diagnostic order

| Symptom                      | Check and response                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mail capability absent       | Client/Server registration, migrations and enabled provider configuration; inspectors cover composition only                                          |
| Account cannot send or sync  | Account status, provider availability and ownership; `reauthorizationRequired` requires reconnecting                                                  |
| Task remains pending         | Application jobs service, Mail runtime, migration state and server logs; page refresh cannot execute queued work                                      |
| Progress stops after restart | Lease/delivery recovery and pending retry schedule, using the same application database                                                               |
| History appears incomplete   | Configured start date, ongoing history progress and incomplete-content records; do not introduce a total import cap                                   |
| Gmail returns quota 403      | Check `rateLimitExceeded`/`userRateLimitExceeded`, real project quotas, batch subrequest count, and whether all app processes share one pacing budget |
| Cursor fails repeatedly      | Provider authorization and cursor recovery; preserve the date-scoped rescan instead of skipping to now                                                |
| IMAP external state differs  | New-UID sync does not fully reconcile external flags, deletions or moves                                                                              |
| Sent mail missing            | Provider visibility and sent-copy mode; delivery outcome is authoritative for whether to resend                                                       |

Personal diagnostics require workspace permission and ownership. Cross-user operation history is available under admin permission as two paged lists, `GET /api/mail/settings/syncRuns` and `GET /api/mail/settings/submissions` (`page`, `pageSize` up to 100, `meta.total`); `GET /api/mail/settings/accounts` lists the accounts with API-safe metadata. It has no built-in settings page. Keep credential references, cursors, leases and internal provider errors out of application diagnostics.

## Verify this path

For synchronization integration, verify multiple history pages and a message arriving during history import, not merely one successful list request. For recovery changes, verify restart with retained progress, rejection of stale worker writes and invalid-cursor rescan without skipped changes. For incomplete-content UI, verify continued visibility, independent retry and metadata preservation. Confirm local NocoBase labels/notes survive resync. Run only the scenarios relevant to the requested change; provider and job executor mocks do not prove a deployment's live connectivity.
