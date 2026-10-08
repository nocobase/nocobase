# Mail public API

## Package entries

| Entry                                         | Purpose                                                                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/app-plugin-mail/server`            | Server plugin, application configuration, Server service token and Provider extension contracts.                            |
| `@nocobase/app-plugin-mail/client`            | Client plugin, `MailClient`, its application token/hook, `MailWorkspacePage`, template helpers and realtime event contract. |
| `@nocobase/app-plugin-mail/client/components` | Curated Mail UI components and their props/state types.                                                                     |
| `@nocobase/app-plugin-mail/realtime`          | Realtime topic and event type for consumers that only need the event contract.                                              |
| `@nocobase/app-plugin-mail/package.json`      | Package metadata.                                                                                                           |

The package root is a Server alias retained for plugin registration and application configuration. Use the explicit `/server` entry in new application code. Package export maps are the public boundary; source files such as `server/tokens`, `server/types`, `client/plugin`, `client/routes`, and the internal component barrel are not public imports.

## Server entry

### Plugin and configuration

The Server entry exports the default plugin, `mailConfig`, `DEFAULT_MAIL_CONFIG`, `mailEnvironmentMappings`, `resolveMailConfig`, and the `MailConfig`/provider configuration types. Applications register the plugin and explicitly compose its configuration factory as described in [Configuration and accounts](configuration-and-accounts.md).

### Supported tokens

- `mailServiceToken` resolves `MailService`, the consumer-facing facade for account, mailbox, message, label, signature, template, synchronization and delivery operations. Application plugins consume this service; they do not implement it.
- `mailProviderRegistryToken` resolves `MailProviderRegistry`. A Server plugin registers a `MailProviderDefinition` during boot.
- `mailCredentialVaultToken` resolves `MailCredentialVault`. Replace it only before Mail Core initializes, when the application owns an alternative credential store.
- `createMailProviderRegistry()` creates an isolated registry, primarily for tests and standalone integrations. Application plugins should register with the Mail Core registry token instead of replacing it.

Internal persistence, runtime, adapter-resolver and outbound-storage tokens are intentionally excluded.

### Provider extension contract

Use `defineMailProviderDefinition()` to type-check a `MailProviderDefinition<TConfig>`. Its stable extension points are:

- `type`, `label`, optional `validateConfig`, and extensible `capabilities` metadata.
- Optional `authorization`, `connection`, and `push` handlers.
- Required `createAdapter(context, config, account)`, returning a `MailProviderAdapter` for folder/message listing, content and attachment reads, sends, drafts, message mutations, and optional push subscription operations. The `MailProviderAccount` argument exposes only the account ID, address, Provider identity, and opaque credential reference; retrieve credentials through `context.credentials`.
- `MailProviderContext` provides the public base path and the credential vault. The vault supports `put`, `get`, `replace`, `getOrRefresh`, `delete`, and optionally `deleteExpired`. Authorization secrets belong in that vault, not in account records or logs.

Associated request/result contracts are exported for authorization, connection, change/folder/message pagination, normalized mail records, sending, push notifications and credential access. Advertise only the capabilities supported by the returned adapter; Mail checks capabilities as well as the corresponding adapter method. Provider-defined capability keys may be added. Mail Core ignores unknown keys and treats absent known keys as unsupported; consumers preserve or ignore keys they do not understand.

Built-in Provider config interfaces (`GmailMailProviderConfig`, `MicrosoftMailProviderConfig`, and `ImapSmtpMailProviderConfig`) are exported for applications that need to type their configuration. They are not extension points for changing built-in adapters.

### Domain types

The Server entry exports API-safe account, identity, folder, label, message, attachment, template, signature, operation, synchronization and submission records, plus their request/result types. `MailAccountView` excludes credential references; `MailProviderAccount` is a separate server-only adapter input and carries an opaque vault reference, not a credential. Persistence-only models are not exposed. `MailPublicError` omits provider-internal messages. `MailOperationContext` carries the acting `actorId` and request `AbortSignal` into service calls.

`MAIL_PROVIDER_CAPABILITIES` lists Mail's recognized capability keys, while `MAIL_PROVIDER_ERROR_CATEGORIES` lists its recognized Provider error categories. These runtime constants describe current built-in behavior; consumers should still tolerate unknown capability and error values from later releases.

`MailService` exposes these operation groups:

- Provider discovery and account authorization, connection, listing, update and removal.
- Personal and managed account, folder, message, attachment and operation-log reads; management actions.
- Identity, signature, label and template CRUD.
- Personal message/conversation reads, deferred-content retry, message state updates, label changes, moves and deletion.
- Single and bulk sending, draft save/conflict resolution, and outbound attachment upload/read.
- Sync run and submission history, pagination, retry and cancellation, plus unread counts.

Output status, folder-type and Provider error category/reason types have `Known...` aliases for currently recognized values and open `Mail...` types for values added by a later compatible release. Inputs that trigger a specific operation remain constrained to the values Mail currently accepts.

## Client entry

### Composition and data access

- The default export registers the Mail Client plugin.
- `MailWorkspacePage` and `MailWorkspacePageProps` provide the full workspace. `templateVariables` supplies an allowlisted record context for saved template placeholders; it does not associate messages with application records.
- `MailClient` and `mailClientToken` expose the typed client data layer. Resolve the app-owned instance with `useMailClient()` in React or `app.services.resolve(mailClientToken)` elsewhere; do not construct a separate `MailClient` for normal UI integration.
- `mailErrorMessage(cause, fallback)` returns the text to show for a failed call: the server's `localizedMessage`, or `fallback`. Code that must react to a specific failure branches on `ApiClientError.reason` from `@nocobase/app-client` instead.
- `renderMailTemplate()`, `plainTextToMailHtml()`, and `htmlToPlainText()` are supported template/body helpers. `MailTemplateVariables` and `RenderedMailTemplate` describe their data.
- `MAIL_PLUGIN_NS`, `MAIL_REALTIME_TOPIC`, and `MailRealtimeEvent` expose the translation namespace and invalidation event contract.
- `MAIL_VIRTUAL_FOLDER_IDS` provides stable query identifiers for built-in cross-account folders. `MAIL_LABEL_COLORS` and `DEFAULT_MAIL_LABEL_COLOR` provide the supported user-label palette and default.

### `MailClient` method groups

- **Providers and accounts:** `listProviders`, `listAccounts`, `startAuthorization`, `connectAccount`, `updateAccount`, `removeAccount`, `getUnreadCount`.
- **Managed accounts:** `listManagedAccounts`, `listManagementAccounts`, `listManagedFolders`, `listManagedSyncRunsPage`, `listManagedSubmissionsPage`.
- **Identities and signatures:** `listIdentities`, `updateIdentity`, `listSignatures`, `saveSignature`, `deleteSignature`.
- **Folders, labels and templates:** `listFolders`, `listLabels`, `createLabel`, `updateLabel`, `deleteLabel`, `listTemplates`, `saveTemplate`, `deleteTemplate`.
- **Mailbox reads and message actions:** `listMessages`, `listManagedMessages`, `manageMessages`, `listConversationMessages`, `getMessage`, `getManagedMessage`, `retryMessageContent`, `updateMessage`, `updateMessageLabels`, `moveMessage`, `deleteMessage`.
- **Attachments:** `uploadAttachment`, `downloadAttachment`, `downloadManagedAttachment`.
- **Compose and drafts:** `sendMessage`, `sendBulk`, `saveDraft`, `resolveDraftConflict`.
- **Synchronization:** `startSync`, `getSyncRun`, `listSyncRunsPage`, `retrySyncRun`, `cancelSyncRun`.
- **Delivery history:** `listSubmissionsPage`, `retrySubmission`, `cancelSubmission`.

The TypeScript signatures are the request/result source of truth. For direct HTTP clients, see [HTTP API](http-api.md).

## Reusable components

All components below are exported from `@nocobase/app-plugin-mail/client/components`. Components that call `useMailClient()` require the Mail Client plugin to be registered in the host application.

| Component                           | Exported props and related types                                                                                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MailAccountCard`                   | `MailAccountCardProps`                                                                                                                                                                                      |
| `MailAccountConnector`              | `MailAccountConnectorProps`, `MailAccountConnectorLabels`, `MailAccountCredentials`                                                                                                                         |
| `MailConversationView`              | `MailConversationViewProps`, `MailConversationViewLabels`                                                                                                                                                   |
| `MailMessageList`                   | `MailMessageListProps`, `MailMessageListLabels`                                                                                                                                                             |
| `MailProviderCard`                  | `MailProviderCardProps`                                                                                                                                                                                     |
| `MailRichTextEditor`                | `MailRichTextEditorProps`, `MailRichTextValue`, `MailRichTextEditorLabels`, `MailRichTextEditorInsertOption`, `MailRichTextEditorInsertMenu`, `MailRichTextEditorInsertActions`                             |
| `MailNavigationIcon`                | No props; displays the user's unread count using the host app services.                                                                                                                                     |
| `MailLabelManager`                  | No props; reads and edits the current user's labels.                                                                                                                                                        |
| `MailLabelTag`, `MailLabelColorDot` | `MailLabelTagProps`, `MailLabelColorDotProps`                                                                                                                                                               |
| `MailSignatureManager`              | `MailSignatureManagerProps`                                                                                                                                                                                 |
| `MailStatusBadge`                   | `MailStatusBadgeProps`, `MailStatusTone`                                                                                                                                                                    |
| `MailSyncPolicyFields`              | `MailSyncPolicyFieldsProps`, `MailSyncPolicyValue`                                                                                                                                                          |
| `MailTemplateManager`               | No props; reads and edits the current user's templates.                                                                                                                                                     |
| `MailboxSidebar`                    | `MailboxSidebarProps`, `MailboxSidebarLabels`, `MailboxFolderGroup`, `MailboxSmartView`                                                                                                                     |
| `MailComposer`                      | `MailComposerComponentProps` and shared `MailComposerProps`, `MailComposerRequest`, `MailComposerState`, `MailComposerCompletionResult`, `MailForwardQuote`, `MailTemplateVariables`, `EMPTY_MAIL_COMPOSER` |
| `MailWorkspaceComposer`             | `MailWorkspaceComposerProps` and the shared composer contracts above.                                                                                                                                       |

`MailComposer` renders one supplied account/request. `MailWorkspaceComposer` also manages account and sender identity selection across eligible accounts. Completion results are open strings; callers should handle known results and provide a fallback for future outcomes.

## HTTP and realtime

The authenticated `/api/mail` routes, payloads, paging, permission resources, error reasons, OAuth callback and Provider webhook are documented in [HTTP API](http-api.md). Prefer `MailClient` for application code. The `mail:messages` realtime event is a user-scoped invalidation signal with no message body; refresh affected Mail data after receiving it or reconnecting.

## Evolution rules

Within a major version, keep existing names, required props and request fields, response meaning, permission checks and event semantics stable. Add fields as optional, add optional component props and Provider methods, preserve unknown capability/status/error/event values, and give consumers safe fallbacks. Reserve removal, required-field additions and semantic changes for a major version with a migration note. Do not make application code depend on implementation paths outside the package export map.
