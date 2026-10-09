# Sending and drafts

## Submit through Mail

Resolve `MailService` with `mailServiceToken`, or use the authenticated `POST /api/mail/messages/send` API. Inspect the installed request type and derive the actor from the server session; a browser-supplied owner ID is not authorization. Mail enforces account ownership and rejects inactive accounts.

Supply a stable `idempotencyKey` for one logical send and retain it across transport retries. A key reused with different content is rejected. After a lost response, query submission history or repeat the same logical request with the same key; generating a new key can duplicate mail. Mail owns persisted submissions and outbox/background job delivery, so application code should not add a second provider submission path.

Submission history is available through `MailService.listSubmissions()`, `GET /api/mail/submissions`, and `/dev/mail/logs/send`. A failed request answers the standard error body `{ error: { code, status, reason, domain: 'mail', message, localizedMessage } }`; branch on `reason` (for example `MAIL_IDEMPOTENCY_CONFLICT` or `MAIL_ACCOUNT_INACTIVE`), never on `message`, and show `localizedMessage` when present. A submission's own delivery error is a public Provider error with `code`, `category` and `retryable`. Public views omit internal provider errors, request fingerprints and leases.

## Delivery outcomes and retries

| Status       | Meaning and handling                                                                        |
| ------------ | ------------------------------------------------------------------------------------------- |
| `pending`    | Waiting, possibly for scheduled time; cancellable before a worker claims it                 |
| `submitting` | Submission in progress; observe its result                                                  |
| `accepted`   | Provider accepted the request; not proof of recipient delivery or reading                   |
| `failed`     | Inspect the error and retry eligibility; supported retries reuse the stored snapshot        |
| `unknown`    | Provider may have accepted it; confirm provider-side outcome before deciding further action |

Use `POST /api/mail/submissions/:submissionId/retry` or `/cancel` for eligible persisted submissions. Accepted and unknown submissions cannot be retried or cancelled through these actions. Older records whose snapshots were cleared cannot recover recipient details or be retried. Do not implement retry as “send a new message” for every terminal status.

SMTP can accept some recipients and reject others. The submission remains `accepted` with `SMTP_RECIPIENTS_REJECTED`, accepted/rejected recipient lists and `retryable: false`. Present the partial outcome; only rejected recipients belong in a new send. Avoid resending to everyone based on the presence of an error field.

## Drafts, attachments and composition

Local drafts support every sending provider. Autosave writes locally after two seconds of inactivity (maximum ten seconds during continuous input), never disables editing or sending, and reports failure only in the autosave indicator. Imported provider drafts are localized before editing; no remote mirroring or conflict prompt is used. Close flushes changes in the background. Preserve stable draft keys, revisions and closed-draft records so late saves cannot recreate a consumed draft.

Retain the attachment IDs returned when uploading or reopening a draft. Local upload identities differ from provider attachment IDs; Mail keeps uploads alive while referenced by a live draft or outgoing submission snapshot. Reopened or rescheduled drafts must use the retained file content, including after page reload. Do not reconstruct attachment references from display names or remove a shared upload when another draft still owns it.

Keep sender-account selection, signatures, templates, scheduled time and attachments consistent with the selected account. Templates resolve variables when applied and preserve unknown placeholders. Forwarded source HTML and the sender's new comment are separate content; preserve that split across editing, autosave and recovery.

Sending clears the composer and browser draft recovery for every result, including failure, unknown delivery and partial acceptance. Validation errors before handoff preserve editing. Transport uncertainty keeps the original request in browser outgoing records; resume it with the same idempotency key instead of creating another draft or submission.

## Scheduled and separate sending

Scheduled sends persist their message snapshot and run through Mail's outbox and the application jobs service. Browser timers are insufficient. The account and provider must still be available when the worker executes.

Ordinary scheduled messages remain in Drafts with `scheduledSend` metadata. Use the submission cancellation action before editing, deleting or sending the draft again; wait for cancellation success before opening the composer. Cancellation restores the same draft and retains recipients, content and attachments. Pending schedules are cancellable before sending starts. Accepted, failed and unknown delivery all remove the draft; outgoing snapshots remain available for inspection and eligible retries. The upgrade migration restores draft associations for existing ordinary schedules. Separate sending continues to use batch history.

`POST /api/mail/messages/sendBulk` creates separate per-recipient submissions. The shared development composer at `/dev/mail/send` offers both ordinary sending and Send separately. Separate sending deduplicates at most 100 recipients and requires empty Cc/Bcc; each child owns its content and attachment references; the source draft is removed once every child request is persisted.

Display grouped history using `GET /api/mail/submissions?bulkOnly=true&groupByBatch=true`. Pages (`page`, `pageSize`) and `meta.total` count complete batches. Expand the parent for recipient details; parent actions apply only to eligible children in that batch. Refresh pending results and retry only failed eligible children, preserving accepted and unknown outcomes.

## Sent-folder refresh

Accepted submissions schedule mailbox refreshes immediately and after 5 and 30 seconds, allowing delayed provider visibility. A request during active sync schedules a follow-up. Synced messages, keyed by account and provider message ID, populate the sent folder; application code should not manufacture a second sent-message record.

A refresh error does not mean delivery failed and must never resend an accepted submission. For IMAP/SMTP, sent copies depend on `sentCopyMode`; read [sent-copy configuration](configuration-and-accounts.md#imapsmtp-boundaries-and-sent-copies). `IMAP_SENT_COPY_FAILED` retains accepted delivery and calls for archive diagnosis, not another send.

## Verify this path

Use provider mocks or an authorized test mailbox to verify stable-key retries produce one provider submission, a key with changed content is rejected, and a lost response does not generate a new send. For the changed behavior, cover unknown results, partial SMTP acceptance, accepted delivery with failed sent-copy saving, restored draft attachments, job-backed scheduling, or batch retry eligibility as applicable. Distinguish provider acceptance from actual recipient receipt in the reported results.
