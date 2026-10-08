# Mail HTTP API

## Contract and access

The authenticated API base is `/api/mail`, the plugin's namespace; every resource (accounts, messages, labels, templates, sync runs, submissions) lives under it. Paths are camelCase, and custom methods are `POST /{collection}/{id}/{verb}` or `POST /{collection}/{verb}`. Successful JSON responses use `{ data }`; a list is `{ data: [...], meta }`. Creates return `201`, deletes return `204` with an empty body, and attachment reads return a byte stream. Prefer `MailClient` from `@nocobase/app-plugin-mail/client` so callers share the package's request types, path encoding, and paging.

The running application documents every `/api/mail` route — parameters, bodies, response schemas, and error statuses — in its OpenAPI document: Swagger UI at `/api/swagger/docs` and the JSON at `/api/swagger`, readable with a signed-in session or an API key. Each route is tagged `Mail` and has an operationId of the form `mail<Verb><Resource>`, such as `mailSendMessage`. Treat that document as the reference for exact shapes; this page explains behavior it cannot.

Every route under `/api/mail` requires an authenticated user and access to a Mail page resource, checked before input is validated or any record is read. Routes under `/settings` require `mail.admin`; routes under `/management` require `mail.management`; all other routes require `mail.workspace`. Personal account and message operations enforce account ownership. Management message reads are read-only.

Lists page one of two ways. Feeds (`/messages` and conversation messages) take `pageSize` and `pageToken` and answer `meta: { nextPageToken, total }`; `nextPageToken` is absent on the last page and is sent back unchanged as `pageToken`. Log and management tables (`/syncRuns`, `/submissions`, `/settings/syncRuns`, `/settings/submissions`, `/management/messages`) take `page` and `pageSize` and answer `meta: { page, pageSize, total }`. `pageSize` defaults to 20 and is at most 100. Search is `q`. Bounded lists — Providers, accounts, identities, signatures, folders, labels, templates, and the admin and management account overviews — are answered whole as `{ data, meta: { total } }`. Dates in requests, such as `initialSyncReceivedAfter`, `receivedAfter`, and `scheduledAt`, are RFC 3339 date-times.

Every JSON body is validated strictly: an unknown or invalid field is `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` (domain `app`) and a `fieldViolations` entry per problem. A `PATCH` changes only the fields it sends; an omitted field keeps its stored value.

## Errors

Failures use the standard body `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`. Mail's errors use domain `mail`; branch on `reason`, never on `message`, which is English developer text. `localizedMessage` carries the text translated for the request's locale, which `mailErrorMessage(cause, fallback)` shows.

| HTTP | `status`              | `reason`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 400  | `INVALID_ARGUMENT`    | `INVALID_MAIL_REQUEST` for input Mail rejects below the schema, such as an invalid page token or a missing upload `file`; `MAIL_ACCOUNT_CREDENTIALS_INVALID` when the Provider refuses the sign-in while connecting an account, with a field violation on `password`; a resource the body refers to that is missing, with `fieldViolations` naming the field: `MAIL_ACCOUNT_NOT_FOUND`, `MAIL_IDENTITY_NOT_FOUND`, …                                                                                         |
| 400  | `FAILED_PRECONDITION` | `MAIL_ACCOUNT_INACTIVE`, `MAIL_ACCOUNT_REMOVING`, `MAIL_DRAFT_SCHEDULED`, `MAIL_SYNC_RUN_STATE_INVALID`, `MAIL_SUBMISSION_STATE_INVALID`, `MAIL_PROVIDER_UNAVAILABLE`, `MAIL_PROVIDER_OPERATION_UNSUPPORTED`, …; `MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED` when the Provider no longer accepts the account's authorization (revoked or expired) and the user must reconnect it; `MAIL_PROVIDER_REQUEST_FAILED` when the Provider refused the request itself, such as a recipient or content it does not accept |
| 403  | `PERMISSION_DENIED`   | `MAIL_ACCESS_DENIED`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 404  | `NOT_FOUND`           | The resource the URL names: `MAIL_ACCOUNT_NOT_FOUND`, `MAIL_MESSAGE_NOT_FOUND`, `MAIL_SYNC_RUN_NOT_FOUND`, `MAIL_SUBMISSION_NOT_FOUND`, `MAIL_LABEL_NOT_FOUND`, `MAIL_TEMPLATE_NOT_FOUND`, `MAIL_SIGNATURE_NOT_FOUND`, `MAIL_ATTACHMENT_NOT_FOUND`, …                                                                                                                                                                                                                                                        |
| 409  | `ALREADY_EXISTS`      | `MAIL_LABEL_ALREADY_EXISTS`, `MAIL_ACCOUNT_ALREADY_CONNECTED`                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 409  | `ABORTED`             | `MAIL_IDEMPOTENCY_CONFLICT`, `MAIL_DRAFT_REVISION_OUTDATED`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 413  | `INVALID_ARGUMENT`    | `BODY_TOO_LARGE`: a JSON body over 8 MiB or an upload over 27 MiB                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 415  | `INVALID_ARGUMENT`    | `INVALID_MAIL_REQUEST`: an upload that is not `multipart/form-data`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 429  | `RESOURCE_EXHAUSTED`  | `MAIL_PROVIDER_REQUEST_FAILED` when the Provider throttles the request or a Provider quota ran out; when the Provider says how long to wait, `Retry-After` and `metadata.retryAfter` give the delay in seconds                                                                                                                                                                                                                                                                                               |
| 503  | `UNAVAILABLE`         | `MAIL_PROVIDER_REQUEST_FAILED` when the Provider is unreachable, times out or fails on its side, such as an HTTP 5xx or a transient SMTP reply; `Retry-After` is set when the Provider gave a delay                                                                                                                                                                                                                                                                                                          |

Only a route that waits for the Provider while answering can return the Provider statuses: connecting an account, changing read or starred state, moving or deleting a message, retrying message content, and downloading a Provider attachment. Sending, saving drafts and synchronization reach the Provider in the background or record its failure on the submission or sync run (`error` with `code`, `category`, `retryable`), so they never answer `429` or `503`. Every Provider error carries the public Provider error in `metadata` (`code`, `category`, `retryable`, `retryAfterMs` and an allowlisted `reasonCode` when known), never the Provider's own message.

An unexpected failure is `500 INTERNAL` and reveals nothing about its cause.

Request and response types use the names exported from `@nocobase/app-plugin-mail/server` and `@nocobase/app-plugin-mail/client`. New response fields are optional, and callers should ignore fields they do not use. Account, folder, sync, submission, Provider error category/reason, and realtime event values may be unknown to an older client; keep a fallback for those values.

Mail publishes the user-scoped realtime topic `mail:messages` with `{ kind: 'mail.changed' }` as an invalidation signal; it contains no message content. Subscribe through the host Realtime client and refresh affected data after the event or a reconnect. The Client package exports `MAIL_REALTIME_TOPIC` and `MailRealtimeEvent` from its client entry and the `realtime` subpath.

## Providers and accounts

| Method   | Path                                      | Request / result                                                                                                                                                                                                         |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/providers`                              | Returns `MailProviderView[]`.                                                                                                                                                                                            |
| `POST`   | `/authorizations`                         | Provider `type` and `name`, optional `scopes`, and required `initialSyncReceivedAfter`; returns `201` and `MailAuthorizationStartResult`.                                                                                |
| `POST`   | `/accounts/connect`                       | Provider `type` and `name`, `address`, optional `displayName`, `username`, required `password`, and required `initialSyncReceivedAfter`; verifies the credentials, then returns `201` and the created `MailAccountView`. |
| `GET`    | `/accounts`                               | Returns the current user's `MailAccountView[]`.                                                                                                                                                                          |
| `PATCH`  | `/accounts/:accountId`                    | Optional `status` (`active` or `suspended`); returns the updated `MailAccountView`.                                                                                                                                      |
| `DELETE` | `/accounts/:accountId`                    | Starts the asynchronous, durable account removal; returns `202` with the account in its `removing` status, or `202` with no body when the removal already finished.                                                      |
| `GET`    | `/settings/accounts`                      | Admin overview (`mail.admin`); returns `MailManagedAccountView[]`.                                                                                                                                                       |
| `GET`    | `/settings/syncRuns`                      | Admin view of every user's sync runs, newest first, paged with `page` and `pageSize`; `canManage` marks the caller's own.                                                                                                |
| `GET`    | `/settings/submissions`                   | Admin view of every user's submissions, newest first, paged with `page` and `pageSize`.                                                                                                                                  |
| `GET`    | `/management/accounts`                    | Management overview (`mail.management`); returns `MailManagedAccountView[]`.                                                                                                                                             |
| `GET`    | `/management/accounts/:accountId/folders` | Returns folders for the selected account; `404 MAIL_ACCOUNT_NOT_FOUND` when the account does not exist.                                                                                                                  |

`/settings/accounts` and `/management/accounts` return the same list for two different pages, each gated by its own page permission.

## Identities, signatures, labels, and templates

| Method   | Path                                           | Request / result                                                                        |
| -------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET`    | `/accounts/:accountId/identities`              | Returns `MailIdentity[]`.                                                               |
| `PATCH`  | `/accounts/:accountId/identities/:identityId`  | Optional `displayName`; returns the updated `MailIdentity`.                             |
| `GET`    | `/accounts/:accountId/signatures`              | Returns `MailSignature[]`.                                                              |
| `POST`   | `/accounts/:accountId/signatures`              | Creates a signature from name, text/html content, and default selection; returns `201`. |
| `PATCH`  | `/accounts/:accountId/signatures/:signatureId` | Updates the sent fields of a signature (`name`, `text`, `html`, `isDefault`).           |
| `DELETE` | `/accounts/:accountId/signatures/:signatureId` | Deletes a signature; returns `204`.                                                     |
| `GET`    | `/accounts/:accountId/folders`                 | Returns the current user's folders for the account.                                     |
| `GET`    | `/labels`                                      | Returns the current user's labels.                                                      |
| `POST`   | `/labels`                                      | Creates a label from `MailSaveLabelInput`; returns `201`.                               |
| `PATCH`  | `/labels/:labelId`                             | Updates the sent fields of a label (`name`, `color`).                                   |
| `DELETE` | `/labels/:labelId`                             | Deletes a label; returns `204`.                                                         |
| `GET`    | `/templates`                                   | Returns the current user's `MailTemplate[]`.                                            |
| `POST`   | `/templates`                                   | Creates a template from `MailSaveTemplateInput`; returns `201`.                         |
| `PATCH`  | `/templates/:templateId`                       | Updates the sent fields of a template (`name`, `subject`, `text`, `html`).              |
| `DELETE` | `/templates/:templateId`                       | Deletes a template; returns `204`.                                                      |

## Messages, conversations, attachments, and sending

| Method   | Path                                                                 | Request / result                                                                                                                      |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/messages`                                                          | Filters by `accountId`, `folderId`, `labelId`, `conversationId`, `q`, `unread`, and `starred`; pages with `pageSize` and `pageToken`. |
| `GET`    | `/messages/countUnread`                                              | Returns the current user's unread count as a number.                                                                                  |
| `POST`   | `/messages/send`                                                     | Accepts `MailComposeInput`; returns `MailSubmissionView`.                                                                             |
| `POST`   | `/messages/sendBulk`                                                 | Accepts `MailBulkComposeInput`; returns `MailSubmissionView[]`.                                                                       |
| `POST`   | `/messages/saveDraft`                                                | Accepts draft compose fields; creates the draft or replaces the one named by `draftMessageId` or `draftKey`; returns `MailMessage`.   |
| `GET`    | `/accounts/:accountId/conversations/:conversationId/messages`        | Conversation messages, paged with `pageSize` and `pageToken`.                                                                         |
| `GET`    | `/accounts/:accountId/messages/:messageId`                           | Returns a `MailMessage`.                                                                                                              |
| `PATCH`  | `/accounts/:accountId/messages/:messageId`                           | Optional read/starred/note/todo changes; returns the updated `MailMessage`.                                                           |
| `DELETE` | `/accounts/:accountId/messages/:messageId`                           | Optional `permanently=true` query parameter; returns `204`.                                                                           |
| `GET`    | `/accounts/:accountId/messages/:messageId/attachments/:attachmentId` | Streams a personal mailbox attachment.                                                                                                |
| `POST`   | `/accounts/:accountId/messages/:messageId/modifyLabels`              | `addLabelIds` and/or `removeLabelIds`; returns the updated `MailMessage`.                                                             |
| `POST`   | `/accounts/:accountId/messages/:messageId/move`                      | Requires `providerFolderId`; returns the updated `MailMessage`.                                                                       |
| `POST`   | `/accounts/:accountId/messages/:messageId/retryContent`              | Retries deferred message content retrieval; returns the updated `MailMessage`.                                                        |
| `POST`   | `/accounts/:accountId/messages/:messageId/resolveDraftConflict`      | Requires `action` `useRemote` or `keepLocal`; returns the resolved `MailMessage`.                                                     |
| `POST`   | `/attachments`                                                       | `multipart/form-data` with field `file`, at most 27 MiB; returns `201` and `MailOutboundAttachmentView`.                              |
| `GET`    | `/attachments/:attachmentId`                                         | Streams an uploaded outbound attachment.                                                                                              |

## Synchronization and delivery history

| Method | Path                                | Request / result                                                                                                        |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/accounts/:accountId/sync`         | Accepts optional `mode` and `receivedAfter`; returns `202` and `MailSyncRunView`.                                       |
| `GET`  | `/syncRuns`                         | The current user's sync runs, paged with `page` and `pageSize`.                                                         |
| `GET`  | `/syncRuns/:syncRunId`              | Returns one `MailSyncRunView`.                                                                                          |
| `POST` | `/syncRuns/:syncRunId/retry`        | Queues a retry; returns `202` and the updated run.                                                                      |
| `POST` | `/syncRuns/:syncRunId/cancel`       | Cancels a run; returns the updated run.                                                                                 |
| `GET`  | `/submissions`                      | Paged with `page` and `pageSize`; filters with `bulkOnly` and `groupByBatch`. Grouped bulk results count whole batches. |
| `POST` | `/submissions/:submissionId/retry`  | Retries an eligible submission; returns `MailSubmissionLogView`.                                                        |
| `POST` | `/submissions/:submissionId/cancel` | Cancels an eligible submission; returns `MailSubmissionLogView`.                                                        |

## All-user management

| Method | Path                                                                            | Request / result                                                                                    |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET`  | `/management/messages`                                                          | Filters by `accountId`, `folderId`, `q`, `unread`, and `starred`; paged with `page` and `pageSize`. |
| `POST` | `/management/messages/batchApply`                                               | Accepts `MailManagementMessageActionInput`; returns per-item results.                               |
| `GET`  | `/management/accounts/:accountId/messages/:messageId`                           | Returns a read-only `MailMessage`; does not mark it read.                                           |
| `GET`  | `/management/accounts/:accountId/messages/:messageId/attachments/:attachmentId` | Streams an all-user management attachment.                                                          |

## OAuth and Provider webhooks

These two are root routes outside `/api`, so they answer what their protocol requires rather than the API body above, and the OpenAPI document does not list them.

OAuth uses the configured callback path, defaulting to `/mail/oauth/callback`. It requires a short-lived, single-use `state` returned by `POST /api/mail/authorizations`; successful and failed callbacks redirect to the configured `mail.oauthReturnUrl` with `mailAuthorization=success` or `mailAuthorization=failure`.

Provider push notifications use `POST /mail/webhooks/:providerType/:providerName/:secret`. The URL secret and Provider client state are validated by the plugin; webhook request bodies are limited to 1,000,000 bytes.

## Compatibility

Within a major version, existing methods, paths, request requirements, response meanings, error reasons, permission resources, and stream behavior remain stable. Additive request fields are optional; additive response fields are optional. A required-field addition, path removal, behavior change, or permission change requires a new major version and a migration note.
