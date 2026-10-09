# @nocobase/app-plugin-mail

## 1.0.0-beta.7

### Patch Changes

- 391ff55: Republish against the 2.0.0 prerelease line of `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/app-plugin-authentication` and `@nocobase/app-plugin-ai-employee`. Those packages moved from `1.0.0-beta.N` to `2.0.0-beta.0` so that the breaking HTTP API changes they carry show in the major version, and the ranges these plugins published before, such as `^1.0.0-beta.33`, do not accept a 2.0.0 prerelease. This release changes no code; it publishes ranges such as `^2.0.0-beta.0` so the plugins install alongside the new versions.

## 1.0.0-beta.6

### Major Changes

- a220bf4: Move the commercial plugins' HTTP routes to the HTTP API rules: paths are camelCase segments under each plugin's namespace, standard methods replace `resource:action` actions, every input is validated, success answers `{ data }` or `{ data, meta }`, and every failure answers the standard error body, whose `reason` clients branch on.

  **Mail: routes follow the HTTP API rules.** Every route stays under `/api/mail`; these paths change:

  | Before                                                                    | After                                                                                  |
  | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
  | `GET /api/mail/unread-count`                                              | `GET /api/mail/messages/countUnread`                                                   |
  | `GET /api/mail/settings/operation-logs`                                   | `GET /api/mail/settings/syncRuns` and `GET /api/mail/settings/submissions`, each paged |
  | `GET /api/mail/sync-runs`                                                 | `GET /api/mail/syncRuns`                                                               |
  | `GET /api/mail/sync-runs/{syncRunId}`                                     | `GET /api/mail/syncRuns/{syncRunId}`                                                   |
  | `POST /api/mail/sync-runs/{syncRunId}/retry`                              | `POST /api/mail/syncRuns/{syncRunId}/retry`                                            |
  | `POST /api/mail/sync-runs/{syncRunId}/cancel`                             | `POST /api/mail/syncRuns/{syncRunId}/cancel`                                           |
  | `POST /api/mail/messages/bulk`                                            | `POST /api/mail/messages/sendBulk`                                                     |
  | `POST /api/mail/messages/drafts`                                          | `POST /api/mail/messages/saveDraft`                                                    |
  | `POST /api/mail/accounts/{accountId}/messages/{messageId}/draft-conflict` | `POST /api/mail/accounts/{accountId}/messages/{messageId}/resolveDraftConflict`        |
  | `POST /api/mail/accounts/{accountId}/messages/{messageId}/content/retry`  | `POST /api/mail/accounts/{accountId}/messages/{messageId}/retryContent`                |
  | `PATCH /api/mail/accounts/{accountId}/messages/{messageId}/labels`        | `POST /api/mail/accounts/{accountId}/messages/{messageId}/modifyLabels`                |
  | `POST /api/mail/management/messages/actions`                              | `POST /api/mail/management/messages/batchApply`                                        |

  `POST /api/mail/authorizations`, `/accounts/connect`, `/templates`, `/labels`, `/attachments` and `/accounts/{accountId}/signatures` answer `201` instead of `200`. `DELETE /api/mail/accounts/{accountId}` answers `202` with the account in its `removing` status, or `202` with no body when the removal already finished. `PATCH` on a template, label or signature changes only the fields it sends; an omitted field keeps its stored value instead of being cleared. The OAuth callback and the push webhook are root routes and unchanged, including the callback's own error body for a missing `state`.

  Lists page in the standard way. `/syncRuns`, `/submissions`, `/settings/syncRuns`, `/settings/submissions` and `/management/messages` take `page` and `pageSize` and answer `{ data, meta: { page, pageSize, total } }`, replacing `offset`, `limit`, `withTotal` and the `{ items, total }` body; their unpaged variants are removed, and the administrators' operation logs are no longer one unpaged object silently cut at 200 rows. Bounded lists (`/providers`, `/accounts`, an account's identities, signatures and folders, `/templates`, `/labels`, `/settings/accounts`, `/management/accounts` and a managed account's folders) answer `{ data, meta: { total } }`. `/messages` and a conversation's messages take `pageSize` and `pageToken` and answer `meta: { nextPageToken, total }`, replacing `cursor`, `offset`, `limit` and `withTotal`. Search is `q` instead of `query`. `pageSize` defaults to 20 and is capped at 100. Every JSON body is validated by a strict schema, so an unknown field, including the previously ignored `automaticSyncIntervalMinutes`, sync `batchSize` and sync `maxMessages` (which no longer capped an import), is `400 INVALID_INPUT`. `initialSyncReceivedAfter`, `receivedAfter` and `scheduledAt` must be RFC 3339 date-times.

  Errors use the standard body `{ error: { code, status, reason, domain: 'mail', message, localizedMessage, requestId } }` in place of `{ error: { code, ns, key, params, message } }`; the translated text moves to `localizedMessage`. `MAIL_ACCESS_DENIED` (`403`), `MAIL_IDEMPOTENCY_CONFLICT` (`409`), `MAIL_MESSAGE_NOT_FOUND` and `MAIL_SYNC_RUN_NOT_FOUND` (`404`) and `INVALID_MAIL_REQUEST` (`400`, or `415` for an upload that is not multipart) keep their reasons. A JSON body over 8 MiB or an attachment upload over 27 MiB is `413` with reason `BODY_TOO_LARGE` instead of `INVALID_MAIL_REQUEST`. The catch-all `422 MAIL_REQUEST_FAILED` is gone: a missing account, identity, signature, label, template, submission, draft, attachment or folder is `404` when the path names it and `400` with a field violation when the body does (`MAIL_ACCOUNT_NOT_FOUND` and the like); a state that forbids the operation is `400 FAILED_PRECONDITION` (`MAIL_ACCOUNT_INACTIVE`, `MAIL_ACCOUNT_REMOVING`, `MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED`, `MAIL_SYNC_RUN_STATE_INVALID`, `MAIL_SUBMISSION_STATE_INVALID` and others); a taken label name or an account connected to another user is `409 ALREADY_EXISTS`; an outdated draft revision is `409 ABORTED MAIL_DRAFT_REVISION_OUTDATED`; a Provider failure is `MAIL_PROVIDER_REQUEST_FAILED`, `429` when rate-limited and `503` when unreachable, with the public Provider error in `metadata`; a missing account behind `/management/accounts/{accountId}/folders` is `404 MAIL_ACCOUNT_NOT_FOUND`; input Mail rejects below the schema, such as an unreadable `pageToken`, is `400 INVALID_MAIL_REQUEST` with a field violation; anything unexpected, a `TypeError` included, is an opaque `500`.

  `MailService` gains `updateSignature` and `updateTemplate`, `updateLabel` takes `MailUpdateLabelInput`, `removeAccount` resolves the removing account, `listManagedOperationLogs` is replaced by `listManagedSyncRunsPage` and `listManagedSubmissionsPage`, and `MailStartSyncInput` drops `maxMessages`. `MailClient` follows: `listManagedOperationLogs` and `MailManagedOperationLogsView` are replaced by `listManagedSyncRunsPage` and `listManagedSubmissionsPage`, `removeAccount` resolves the removing account, `listSyncRunsPage` and `listSubmissionsPage` take an options object, `listManagedMessages` takes `{ page, pageSize, q, ... }`, `listMessages` and `listConversationMessages` take `pageSize`, `pageToken` and `q`, and `listSyncRuns` and `listSubmissions` are removed. `mailErrorMessage` shows the server's `localizedMessage` for display, and the workspace recognizes a missing message by its `reason`. The Mail example's pages use the new paging.

  **AI Knowledge Base: routes follow the HTTP API rules.** Knowledge bases are served under `/api/aiKnowledgeBases`, addressed by their public key, and every other resource of the plugin under `/api/aiKnowledgeBase`; the `/api/ai/...:action` routes are removed:

  | Before                                                                                     | After                                                                                                                                                                |
  | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `GET /api/ai/aiKnowledgeBase:list`                                                         | `GET /api/aiKnowledgeBases` (`page`, `pageSize` up to 100, `q`, `vectorDatabaseKey`)                                                                                 |
  | list filtered by `filter[key]`                                                             | `GET /api/aiKnowledgeBases/{key}`                                                                                                                                    |
  | `POST /api/ai/aiKnowledgeBase:create`                                                      | `POST /api/aiKnowledgeBases` (`201`)                                                                                                                                 |
  | `POST /api/ai/aiKnowledgeBase:update?filterByTk={id}`                                      | `PATCH /api/aiKnowledgeBases/{key}`                                                                                                                                  |
  | `POST /api/ai/aiKnowledgeBase:destroy?filterByTk={id}`                                     | `DELETE /api/aiKnowledgeBases/{key}` (`204`)                                                                                                                         |
  | `POST /api/ai/aiKnowledgeBase:runHitTest`                                                  | `POST /api/aiKnowledgeBases/{key}/search`                                                                                                                            |
  | `GET /api/ai/aiKnowledgeBase:checkVectorStoreChanged?key=`                                 | `GET /api/aiKnowledgeBases/{key}/vectorStoreStatus`                                                                                                                  |
  | `POST /api/ai/aiKnowledgeBase:confirmVectorStoreChanged?key=`                              | `POST /api/aiKnowledgeBases/{key}/confirmVectorStoreChange`                                                                                                          |
  | `GET /api/ai/aiKnowledgeBase:listStorageDisks`                                             | `GET /api/aiKnowledgeBase/storageDisks`                                                                                                                              |
  | `GET /api/ai/aiKnowledgeBase:listExternalVectorStoreProviders`                             | `GET /api/aiKnowledgeBase/vectorStoreProviders`                                                                                                                      |
  | `GET /api/ai/aiKnowledgeBaseDocs:list?filter[knowledgeBaseKey]=`                           | `GET /api/aiKnowledgeBase/documents?knowledgeBaseKey=` (`q` searches titles)                                                                                         |
  | `GET /api/ai/aiKnowledgeBaseDocs:get?filterByTk=`                                          | `GET /api/aiKnowledgeBase/documents/{documentId}`                                                                                                                    |
  | `GET /api/ai/aiKnowledgeBaseDocs:download?filterByTk=`                                     | `GET /api/aiKnowledgeBase/documents/{documentId}/download`                                                                                                           |
  | `POST /api/ai/aiKnowledgeBaseDocs:upload?knowledgeBaseKey=`                                | `POST /api/aiKnowledgeBase/documents` (`201`; `knowledgeBaseKey` is a form field, the query parameter is no longer read)                                             |
  | `GET /api/ai/aiKnowledgeBaseDocs:getUploadStorage?knowledgeBaseKey=`                       | `GET /api/aiKnowledgeBases/{key}/uploadConstraints`                                                                                                                  |
  | `POST /api/ai/aiKnowledgeBaseDocs:vectorization?knowledgeBaseKey=&id=`                     | `POST /api/aiKnowledgeBases/{key}/vectorizeDocuments` with `{ documentIds? }` (`202`); re-vectorizing every document of the App is no longer possible in one request |
  | `POST /api/ai/aiKnowledgeBaseDocs:destroy?filterByTk=`                                     | `DELETE /api/aiKnowledgeBase/documents/{documentId}` (`204`), or `POST /api/aiKnowledgeBase/documents/batchDelete` with `{ documentIds }` (`204`)                    |
  | `GET /api/ai/aiKnowledgeBaseDocSegments:list?knowledgeBaseDocsId=`                         | `GET /api/aiKnowledgeBase/documents/{documentId}/segments` (`q`, `enabled`)                                                                                          |
  | `GET /api/ai/aiKnowledgeBaseDocSegments:getSegment`                                        | `GET /api/aiKnowledgeBase/documents/{documentId}/segments/{segmentUid}`                                                                                              |
  | `POST /api/ai/aiKnowledgeBaseDocSegments:updateSegment`, `:updateQuestions`, `:setEnabled` | `PATCH /api/aiKnowledgeBase/documents/{documentId}/segments/{segmentUid}`                                                                                            |
  | `POST /api/ai/aiKnowledgeBaseDocSegments:deleteSegment`                                    | `DELETE /api/aiKnowledgeBase/documents/{documentId}/segments/{segmentUid}` (`204`)                                                                                   |
  | `POST /api/ai/aiKnowledgeBaseDocSegments:regenerate`                                       | `POST /api/aiKnowledgeBase/documents/{documentId}/regenerateSegments` (`202`)                                                                                        |
  | `GET /api/ai/aiVectorDatabases:list`, `:listEnabled`                                       | `GET /api/aiKnowledgeBase/vectorDatabases` (`enabled=true` for the enabled ones)                                                                                     |
  | `GET /api/ai/aiVectorDatabases:get?filterByTk=`                                            | `GET /api/aiKnowledgeBase/vectorDatabases/{id}`                                                                                                                      |
  | `POST /api/ai/aiVectorDatabases:create`                                                    | `POST /api/aiKnowledgeBase/vectorDatabases` (`201`)                                                                                                                  |
  | `POST /api/ai/aiVectorDatabases:update?filterByTk=`                                        | `PATCH /api/aiKnowledgeBase/vectorDatabases/{id}`                                                                                                                    |
  | `POST /api/ai/aiVectorDatabases:destroy?filterByTk=`                                       | `DELETE /api/aiKnowledgeBase/vectorDatabases/{id}` (`204`)                                                                                                           |
  | `POST /api/ai/aiVectorDatabases:testConnection?filterByTk=`                                | `POST /api/aiKnowledgeBase/vectorDatabases/{id}/testConnection`                                                                                                      |
  | `POST /api/ai/aiVectorDatabases:testConnection`                                            | `POST /api/aiKnowledgeBase/vectorDatabases/testConnection`                                                                                                           |
  | `GET /api/ai/aiVectorDatabases:findRelatedKnowledgeBase?vectorDatabaseKey=`                | `GET /api/aiKnowledgeBases?vectorDatabaseKey=`                                                                                                                       |
  | `GET /api/ai/aiVectorDatabases:listProviders`                                              | `GET /api/aiKnowledgeBase/vectorDatabaseProviders`                                                                                                                   |

  A success is `{ data }` and a list `{ data, meta: { page, pageSize, total } }` instead of `{ data: { data, meta: { count, page, pageSize } } }`; `paginate=false` is gone and `pageSize` is capped at 100. The editor catalogs (`storageDisks`, `vectorStoreProviders`, `vectorDatabaseProviders`) answer `{ data, meta: { total } }`. Every id in a response (knowledge base, document, segment, vector database, and a segment's document and shard ids) is a string and `enabled` a boolean on every database, where SQLite and MySQL answered numbers and `0`/`1` before; ids are accepted only as strings, including a segment question's `id`. Deletes answer `204` with no body instead of `{ success: true }`. JSON bodies are validated and strict, so an unknown field, such as `managedBy` or a counter, is `400 INVALID_INPUT`, and a knowledge base's `key` can no longer be changed by an update. Errors use the standard body `{ error: { code, status, reason, domain: 'aiKnowledgeBases', message, requestId } }` in place of `{ code, message, errors }`: no AI settings access is `403 AI_SETTINGS_ACCESS_REQUIRED` (was `FORBIDDEN`); a missing knowledge base, document, segment or vector database named in the path is `404` (`KNOWLEDGE_BASE_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `SEGMENT_NOT_FOUND`, `VECTOR_DATABASE_NOT_FOUND`) where some answered `200 null` or `500` before, and one named in the body is `400` with a field violation; `LOCAL_KNOWLEDGE_BASE_REQUIRED` is `400 FAILED_PRECONDITION`; a stale segment hash is `409 ABORTED SEGMENT_CONTENT_CHANGED`; a config-managed vector database is `400 FAILED_PRECONDITION VECTOR_DATABASE_CONFIG_MANAGED` and one still in use `400 VECTOR_DATABASE_IN_USE` (both were `409`); an existing vector table is `409 ALREADY_EXISTS TABLE_ALREADY_EXISTS`; a duplicate knowledge base key is `409 KNOWLEDGE_BASE_ALREADY_EXISTS`; missing vector settings, a disallowed disk and invalid connection properties are `400` (`VECTOR_CONFIG_REQUIRED`, `STORAGE_DISK_NOT_ALLOWED`, `INVALID_CONNECT_PROPS`) instead of `500`; upload errors keep their codes as reasons, with `413 UPLOAD_TOO_LARGE` for a file over 100 MiB, `415 UNSUPPORTED_UPLOAD_CONTENT_TYPE` for a request that is not multipart, `400 UNSUPPORTED_FILE_TYPE` for an extension that is not accepted (was `415`) and `503 UNAVAILABLE STORAGE_UNAVAILABLE`; an upload request over 101 MiB or a JSON body over 1 MiB is rejected with `413 BODY_TOO_LARGE` before it is read; a missing document named in `batchDelete` is `400 DOCUMENT_NOT_FOUND` with a field violation even when the body names only one. An unexpected failure is an opaque `500` that no longer carries the underlying message.

  The client service now speaks these routes through `createKnowledgeBaseApiTransport(api)`, which replaces `createKnowledgeBaseActionClient`; `KnowledgeBaseApiTransport` and `KnowledgeBaseRequestOptions` replace `KnowledgeBaseActionClient` and `KnowledgeBaseActionOptions`. `updateKnowledgeBase` and `deleteKnowledgeBase` take the knowledge base's key instead of its id. `normalizePagedResult` reads only `{ data, meta }` and no longer accepts a bare array, `rows`/`count` or a nested `data`; `normalizeKnowledgeBaseError` reads `status` and `reason` from `ApiClientError` and no longer parses the payload; `conflict` is set only for `SEGMENT_CONTENT_CHANGED`. The embedding services and models the editor offers come from the AI Employee plugin's `GET /api/aiEmployee/models?type=EMBEDDING`. The Registry items carry the same changes and require plugin version `>=1.0.0-beta.0 <2.0.0`; the `providers` item no longer calls the removed S3 presign and ZIP encoding actions, and no longer offers `.zip` uploads, which the server rejects.

  **Pro example: `GET /api/pro-example` is now `GET /api/proExample`** and answers `{ data: { scope, plugin, message } }`; an anonymous request gets the standard `401` error body.

- 7b77c1a: Define a deliberate Mail integration surface, publish the composer components and HTTP contract, and make Provider capabilities extensible.

### Minor Changes

- b6d3ac4: Run mailbox synchronization and scheduled sending on the application's jobs service instead of `@nocobase/queue`. Mail submits its tasks to its own executor on the `@nocobase/app-plugin-mail` scope, starts consuming when the application starts, and lets running tasks finish before it shuts down. The application must compose `JobExecutorServiceProvider` from `@nocobase/app-server/jobs` and a `jobs` configuration, as the default template does; without it, Mail refuses to start and says what to add. `mail.jobs`, or its override `MAIL_JOBS`, names the `jobs` configuration the tasks run on, so Mail can have its own `concurrency` or backend; left out, they follow `jobs.default`, and a name that `jobs` does not define stops the application from starting. `@nocobase/jobs` replaces `@nocobase/queue` as a peer dependency. Deployments with more than one instance need a `redis` jobs configuration. Tasks still waiting in a queue connection are not moved: synchronization runs are recovered by maintenance, but let a `redis` or `database` queue connection drain scheduled messages before upgrading.
- ff22cac: Answer mail Provider failures with the status they mean instead of an opaque `500`. A route that waits for the Provider now answers `429 RESOURCE_EXHAUSTED` when Gmail, Microsoft Graph or an IMAP/SMTP server throttles it or a quota ran out, with `Retry-After` and `metadata.retryAfter` in seconds when the Provider gives a delay; `503 UNAVAILABLE` when the Provider cannot be reached, times out or fails on its side; and `400 FAILED_PRECONDITION` with reason `MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED` when the account's authorization was revoked or has expired. Connecting an account with credentials the Provider refuses answers `400 INVALID_ARGUMENT` with the new reason `MAIL_ACCOUNT_CREDENTIALS_INVALID` and a field violation on `password`, and any other Provider refusal while connecting or starting an OAuth authorization answers `400 FAILED_PRECONDITION` `MAIL_PROVIDER_REQUEST_FAILED`; all of these were `500` before. A Provider that cannot download attachments answers `400 FAILED_PRECONDITION` `MAIL_PROVIDER_OPERATION_UNSUPPORTED`. Clients that branched on `MAIL_PROVIDER_REQUEST_FAILED` for a revoked authorization on message actions now receive `MAIL_ACCOUNT_REAUTHORIZATION_REQUIRED` instead.

  Provider failures are classified more precisely, which background synchronization and sending also see: an OAuth token request that is throttled or fails with a 5xx is retried rather than marking the account for reauthorization, a non-JSON error page from a token endpoint is no longer reported as invalid content, Microsoft Graph's `Retry-After` is read as an HTTP date too, and IMAP `[THROTTLED]`, `[UNAVAILABLE]`, `[EXPIRED]` and `[AUTHORIZATIONFAILED]`, imapflow's throttling and socket timeouts, and SMTP replies that report a sending rate limit get their own categories.

  The OpenAPI document now lists `429` and `503` only on the routes that wait for the Provider — connecting an account, updating, moving or deleting a message, retrying message content and downloading a Provider attachment — and no longer on sending, bulk sending, saving drafts, resolving draft conflicts or starting an OAuth authorization, which never answered them.

### Patch Changes

- 7b77c1a: Add Gmail, Microsoft 365, and IMAP/SMTP mock accounts with account management, editable templates and signatures, labels, all mail, sync logs, a complete Mail workspace, and simulated delivery. Reuse Mail's account management page and its management panels in the example.
- ff22cac: Declare every `/api` route in the application's OpenAPI document, served as Swagger UI at `/api/swagger/docs` and as JSON at `/api/swagger` for a signed-in user or an API key. Mail's routes are tagged `Mail` with operationIds such as `mailSendMessage`, the knowledge base's are tagged `AiKnowledgeBase` with operationIds starting with `aiKnowledgeBases`, and the pro example's route is `proExampleGetGreeting`. Each route documents its parameters, request body, response schema and the error statuses it can return — `403` only where it checks a permission, and `400` from its input validators plus any other `400` it answers, such as a failed precondition — including the multipart attachment and document uploads (`413`, `415`) and the binary downloads. Inputs are now validated with `apiValidator`, which answers invalid input exactly as before. The knowledge base plugin moves from zod 3 to zod 4 (the workspace catalog version), because the document generator cannot read zod 3 schemas; its input `fieldViolations` now carry zod 4's wording, while their codes and reasons are unchanged. Requires the `@nocobase/app-server` release that adds the OpenAPI document. The pro example's README describes how its route is declared, which statuses it lists and how its test checks the declaration. The mail example's `AGENTS.md` describes the same declaration pattern.
- 7b77c1a: Skip empty IMAP UID ranges during incremental sync so mailboxes with sparse UIDs complete without repeatedly scheduling empty pages.
- 7b77c1a: Open Mail logs on the Sync logs tab by default.
- 7b77c1a: Use Shadcn components for the Mail client's interactive controls.

## 0.1.0-beta.5

### Patch Changes

- 7f1312d: Add virtual standard folders that aggregate matching folders across mail accounts while preserving direct access to each account's actual folders. Show mailbox accounts as collapsible folder trees, localize provider system folders, and order folders by mail function before custom names. Export Mail environment mappings for applications to wire through the current configuration API.
- 7f1312d: Harden IMAP mailbox selection and UID validation, reconcile remotely deleted messages during synchronization, and preserve local messages when provider searches fail.
- 7f1312d: Localize the initial mail sync date picker in Chinese and keep the connected accounts table scrollable on narrow screens.

## 0.1.0-beta.4

### Patch Changes

- 7b54d97: Show actionable, localized mail provider error details for Gmail quota, authorization, and timeout failures without exposing raw provider messages.
- 7b54d97: Bound first-time mailbox imports to a recent date, batch Gmail message reads, and pace quota usage with retry backoff.
- 7b54d97: Use an aligned calendar popover for selecting the initial mail sync date.

## 0.1.0-beta.3

### Minor Changes

- 47f218d: Declare the Mail environment variables on `mailConfig`

  `mailConfig` now declares `MAIL_OAUTH_CALLBACK_URL`, `MAIL_OAUTH_RETURN_URL`, `MAIL_AUTOMATIC_SYNC_INTERVAL_MS`, `MAIL_SYNC_BATCH_SIZE`, `MAIL_PUSH_WEBHOOK_URL` and `MAIL_PUSH_WEBHOOK_SECRET` itself, the way the current OSS template declares every section's variables, and `pnpm nocobase config env` lists them. Registering `mailConfig` in `server/config/index.ts` is all an application does to make them take effect; applications created from the current template have no `server/environment.ts` to edit.

  The README and Skill now say so, and tell agents to register the plugin with `pnpm nocobase plugin register mail`, since the `plugin:register` script alias no longer exists in generated applications.

## 0.1.0-beta.2

### Minor Changes

- c857ecb: Add a configurable OAuth return URL for production Mail account connection pages and preserve authorization status query parameters after callback completion.

### Patch Changes

- c857ecb: Make Mail startup resilient when the application has not registered its `mail` configuration namespace, validate configuration errors with actionable paths, and document the required application configuration wiring.
- c857ecb: Clarify production OAuth callback and return-page configuration for Mail integrations.

## 0.1.0-beta.1

### Patch Changes

- d646023: Remove duplicated package documentation from the published Mail plugin package and keep user-facing documentation in the main NocoBase documentation site.
- d646023: Use Microsoft Graph well-known folder identifiers when normalizing provider folders, preserve additional folders that share a standard type, and keep IMAP special-use Drafts folders consistent with normalized message draft state.
- d646023: Show account-specific mail folders inline with standard folders, add account markers in the all-accounts view, and keep folder selection in the current account scope.
- d646023: Remove the unreliable unread count badge from the mail folder sidebar while keeping message unread state and filtering unchanged.
- 339e583: Update Mail configuration guidance for applications generated from the OSS default template following retirement of the Pro template.
- 73e0030: Use date-scoped IMAP UID searches for initial mailbox history so sparse UID spaces do not require scanning empty ranges before the configured received-after boundary.

## 0.1.0-beta.0

### Minor Changes

- 5f89965: Add the Mail plugin with built-in Gmail, Microsoft 365, and IMAP/SMTP adapters, automatic provider registration, and extension contracts for third-party providers. Register Mail in the Pro default application template with server configuration and environment mappings.

  Provide account connection and lifecycle management, sending identities, reusable templates with current-record variables, rich-text signatures, inbound and outbound attachments, automatic draft saving and recovery, replies, forwards, scheduled delivery, and separate per-recipient bulk sending. Use a shared composer in the Mail center and development send page, preserve each account's message, attachments, and signature when switching senders, and preserve editing during background autosaves. Preserve forwarded content, formatting, and attachments without duplicating the original body. Confirm account deactivation and template or signature deletion, and explain template placeholder requirements.

  Add automatic and manual mailbox synchronization, push webhooks with subscription renewal, synchronization retry and cancellation, and a global unread indicator. Configure automatic synchronization through server configuration. Preserve IMAP folder pagination and mailbox selection, handle missing UIDNEXT metadata, retain Gmail recovery checkpoints, load Microsoft inline attachments, and prevent implicit permanent IMAP deletion. Refresh mailboxes after accepted sends and support configurable IMAP sent-copy archiving without retrying confirmed deliveries. Consolidate the unreleased schema into one initial migration, including synchronization recovery state, incomplete message metadata, and synchronization deletion records.

  Preserve request identity after lost send responses, distinguish temporary and permanent SMTP failures from unknown delivery outcomes, and report partially accepted deliveries with accepted and rejected recipients without retrying accepted recipients. Keep attachment preparation failures classified as unsent. Add persistent delivery histories with recipient details, expandable batch totals, safe retry and pending-delivery cancellation, and pagination that keeps complete batches together.

  Improve the responsive Mail center and conversation reading layout with isolated, script-disabled HTML rendering that preserves email styles and authenticated inline images. Resize message bodies as content loads, mark opened messages as read, preserve conversation expansion choices, keep single messages expanded, and show labels, notes, to-do controls, and localized action tooltips. Improve rich-text heading and font-size controls, paragraph spacing, form spacing, management selection, and signature ordering. Exclude drafts from non-draft lists before pagination and hide draft read-state controls.

  Unify account, management, and log table pagination with server-side totals, numbered pages, direct page entry, and page-size selection while retaining the Mail center's cursor pagination. Show account owner names and provide permission-protected management detail drawers and attachment downloads. Remove the unsafe cross-account move control, provider message ID column, standalone Mail application route, and administration operation-log page. Keep the development Mail center, account management, and consolidated send, bulk, and synchronization logs available, with redirects from the previous send tabs.

  Keep folder membership and signatures in dedicated sources of truth, enforce account and identity ownership, cascade account-owned records, and clean up temporary OAuth credentials and published outbox records. Preserve local draft attachment contents, scope the client to its application container, expose supported server integration and background-runtime contracts, and retain translation metadata in HTTP errors. Store provider credentials as plain JSON in the core credential store; encryption is left to a separate plugin. Expand persistence, ownership, provider, API, and UI regression coverage, enforce coverage thresholds, and update integration documentation and plugin guidance.

  Hide suspended accounts and their messages from the Mail center and unread count while preserving management access to synchronized mail. Explain this behavior in the deactivation confirmation.

  Fix Microsoft Graph attachment metadata queries by qualifying the fileAttachment contentId property, allowing draft and forwarded messages to send without HTTP 400 errors while preserving inline image metadata.

  Import all date-scoped mail history in resumable batches, interleave new-mail synchronization, recover abandoned queue tasks, and rescan expired cursors without skipping mail. Preserve incomplete message metadata, expose independent content retries, and display recovery and partial-content progress.

  Preserve mail error details in application logs, route cleanup and realtime failures through the shared logger, and record sending, synchronization, and retry outcomes with correlation fields without changing delivery behavior when logging fails.

  Show accepted messages with provider IDs in the known Sent folder immediately, reconcile them with later mailbox synchronization, and prevent stale provider drafts from reverting accepted messages. Hide synchronized duplicates of editable local drafts before pagination and preserve confirmed delivery when local cleanup fails.

  Reorganize the Mail application Skill into focused configuration, client integration, sending, and synchronization references. Clarify production OAuth return handling, provider capabilities, delivery retry boundaries, and resumable synchronization without a total history cap.

  Unify personal and management message mutations, including local draft deletion; refresh mailbox data on realtime changes while preserving reading and composing state; drain background synchronization work on shutdown. Separate shared contracts, scheduling, delivery, and composer state responsibilities while preserving existing public exports.

  Recover failed initial mailbox loads on realtime changes and mark newly displayed replies in an open conversation as read after refreshing.

  Fix PostgreSQL folder and label queries, index creation, and address searches with persisted text projections. Preserve editable Gmail drafts and attachments across changing provider message IDs. Honor Reply-To, keep explicit unread state and mailbox pagination during refreshes, bound automatic read writes, coalesce badge refreshes, preserve notifications across service boot order, and prefilter IMAP history by receipt date before downloading bodies.

  Store absent mail received and sent timestamps as SQL NULL so PostgreSQL accepts messages with missing date metadata and clears dates consistently on updates.

  Save drafts silently after two seconds of inactivity using local editing, inline save status and browser recovery, without interrupting typing, closing, attachments or sending. Retain a manual Save draft action that closes the composer only after the latest content is persisted. Preserve editing on failure, reload the latest draft before reopening and validate save acknowledgements against stale revisions. Transfer submitted content and attachments to durable outgoing snapshots, remove drafts after accepted, failed, unknown or partially accepted delivery, retry failed snapshots independently, and prevent late saves or synchronization from resurrecting closed drafts.

  Keep scheduled messages in Drafts with their send time and status until delivery, and require successful cancellation before editing or rescheduling. Preserve recipients and attachments, prevent cancelled jobs from sending, and protect in-progress and uncertain deliveries against duplicate sends. Show a dedicated detail banner and compact list badges, place cancellation beside the scheduled time, and expose full date and timezone details on hover.

  Allow sending without a subject after composer confirmation, including scheduled and separate delivery, and allow templates without a subject. Accept HTML-only and image-only bodies for single and bulk sends while retaining subject and body type and size validation and requiring a non-empty body. Preserve the authored message body when sending or saving so sanitized or edited signatures are not duplicated. Newly created and imported signatures are not automatically defaults; allow clearing a default, including the only signature, by clicking its Default badge.

  Support rich-text image uploads with authenticated previews, CID references, and proportional resizing through a drag handle or arrow keys. Preserve image dimensions and inline delivery data through drafts and sends. Hide inline images from attachment lists, counts and indicators while retaining their body previews; keep regular image and document attachments visible. Allow deleting selected editor images and drop attachment references when the final body reference is removed. Clear retained inline font sizes when changing heading levels, track the caret in the heading selector, and align heading spacing in the editor and message details.

  Include original content and inline images in replies, preserve quotes through draft saves, and prevent duplicate original bodies in Microsoft replies. Allow removing and restoring quoted content while preserving authored text and attachments, without the provider reinserting removed reply content. Collapse recognized HTML and plain-text history when reading, with accessible expansion controls. Adapt HTML bodies to light and dark application themes while restoring sender formatting on returning to light mode.

  Show sender and recipient names with address fallbacks, avoid duplicate sender addresses, and show recipients in message details. Place header actions beneath timestamps in narrow detail panes. Add global reply and forward buttons below conversation details, targeting the latest non-draft message regardless of collapsed state or loading older pages. Exclude drafts from conversation content and counts before pagination while keeping them in Drafts.

  Align mail page containers and headers with the application template layout. Remove the duplicate mail center header and conflicting height constraints, place search in the mailbox toolbar, and keep log navigation below its page header. Show the current message range and total on one line immediately before compact previous and next arrow buttons, with the whole pagination group aligned right. Clarify English and Chinese copy for account connections, synchronization, signatures, label deletion and provider acceptance, including automatic synchronization after connection and initial progress in Sync logs. Throttle focus refreshes to once every 30 seconds and avoid reloading composer identities and folders when account metadata is unchanged.

  Bound background IMAP body reads to 2 MiB per message and on-demand content reads to 16 MiB. Stream attachments independently without downloading entire messages, preserve synchronization pagination and checkpoints, enforce protocol response allocation limits, and avoid encoded attachment sizes in download Content-Length headers.

  Remove accounts asynchronously in bounded database batches with durable work, restart recovery, retryable cleanup failures and visible removal status. Fence late synchronization and sending results so removed accounts cannot be repopulated. Return HTTP 202 for removal while preserving provider messages. Index active synchronization recovery and align removal folder batches with the existing index to reduce scans and sorting.

  Use one initial migration for the complete unreleased Mail schema, including address search, account cleanup, synchronization recovery, scheduled drafts and draft states. Development databases that ran the former migration sequence require a fresh database for this baseline.

  Remove icons from the Mail development submenu while retaining its parent navigation icon.

### Patch Changes

- 5f89965: Clarify mailbox provider configuration, stable instance names, OAuth callbacks and secret handling, and optional client-side sent-mail archiving in the template example and Mail configuration guide.
- 5f89965: Normalize core mail folders across IMAP, Gmail, and Microsoft providers, and group SMTP sent messages with IMAP replies using RFC reply headers when provider conversation IDs are unavailable, including existing stored messages.
- 5f89965: Keep automatic mailbox synchronization running when maintenance tasks fail, and isolate account scheduling errors so other accounts can continue syncing.

## 0.0.1

### Patch Changes

- Add authenticated mail sending with persisted idempotency and explicit
  indeterminate submission results.
- Add resumable, bounded mailbox synchronization through a transactional
  Outbox, Queue Job adapter, and initial-sync catch-up watermark.
- Add the Mail database schema, runtime service wiring, and Provider contracts.
- Add one-time PKCE OAuth orchestration and a replaceable database credential
  store for concrete Provider plugins.
- Add `/dev/mail/center` for mailbox-style inspection, `/dev/mail/management`
  for the complete synchronized message table, and `/dev/mail/send` for test
  sending.
- Add a development Mail workspace with account and folder navigation, indexed
  folder filtering, and Provider-native conversation detail.
- Recover interrupted pending sends, terminal OAuth failures, and expired sync
  cursors; paginate folder discovery and renew long-running sync leases.
- Add Server error translations, local shadcn UI primitives, and an App-facing
  Mail Plugin Skill.
- Add a permission-protected Mail account management page under Settings with
  explicit account-type selection and OAuth association.
- Keep account management in Mail settings and expose synchronization and send logs from the Mail development pages.
- Add a Settings send-log page backed by authenticated submission history.
- Show all users' connected mailboxes in Mail Settings while preserving
  account-owner synchronization boundaries.
- Remove account association controls from the all-user Mail account page.
- Move initial-sync limits and mailbox synchronization actions from Settings
  to the development Mail accounts page.
