# @nocobase/app-plugin-mail

`@nocobase/app-plugin-mail` provides the NocoBase 3 user-mailbox runtime. It manages mailboxes connected by users, including authorization, synchronization, reading, composing, sending, drafts, attachments, and delivery history.

The plugin is separate from notification delivery. Use the notification provider plugins for system notifications; use Mail when an application needs to read a user's mailbox or send through an account connected by that user.

## Built-in providers

Gmail, Microsoft 365, and generic IMAP/SMTP providers are registered automatically. Register `mail` in the application, register its application configuration, and configure stable provider instances under `mail.providers`.

`pnpm nocobase plugin register mail` adds the dependency, Client/Server composition entries, and the Mail Skill. It does not edit the application-owned configuration composition. Add the configuration explicitly:

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';

export default mailConfig;
```

```ts
// server/config/index.ts
import mail from './mail.js';

// Add `mail: ReturnType<typeof mail>;` to the default config type and `mail,` to defaultAppConfigs({ ... }).
```

Register that factory under the `mail` key in the application's `defaultAppConfigs()` composition. The plugin uses built-in defaults when the namespace is absent, but no external Mail provider is available until the application configures one. Keep provider credentials in private server configuration. `mailConfig` declares all eight `MAIL_*` overrides as section-relative environment rules; composing it makes them effective and discoverable with `pnpm nocobase config env`. The legacy `mailEnvironmentMappings` export retains fully prefixed paths for application-level environment providers; do not pass it as a section's `env`.

For Gmail, `mail.providers.<name>.quota` can override per-user and per-project quota pacing using the allocation shown in Google Cloud; otherwise the plugin uses conservative defaults with headroom. Account creation requires an initial-sync date, and the account screen defaults it to one calendar month ago. Direct initial-sync requests must also provide a date boundary. See the Mail Skill references for configuration and quota details.

## Supported integration surface

Import the server plugin and service contracts from `@nocobase/app-plugin-mail/server`, the client plugin, `MailWorkspacePage` and `MailAccountsPage` from `@nocobase/app-plugin-mail/client`, and reusable UI from `@nocobase/app-plugin-mail/client/components`. The package root is a Server alias; new application code should use the explicit `/server` path. `MailClient` and `mailClientToken` are the supported Client data access layer; `mailServiceToken` is the supported in-process Server facade. Do not import implementation files, persistence contracts, internal service tokens, or route contribution modules. See the [public API inventory](skills/nocobase-app-plugin-mail/references/public-api.md) for the exported names and responsibility of each entry.

The supported reusable UI exports `MailAccountCard`, `MailAccountConnector`, `MailConversationView`, `MailMessageList`, `MailProviderCard`, `MailRichTextEditor`, `MailNavigationIcon`, `MailLabelManager`, `MailLabelTag`, `MailLabelColorDot`, `MailSignatureManager`, `MailStatusBadge`, `MailSyncPolicyFields`, `MailTemplateManager`, `MailboxSidebar`, `MailComposer`, and `MailWorkspaceComposer`, together with their exported props and state types. `MailComposer` renders one supplied compose request; `MailWorkspaceComposer` additionally coordinates sendable identities across accounts. Register the Mail Client plugin before rendering components that use `useMailClient()`.

Custom menus can use `useMailUnreadCount()` and `MailUnreadCountState` from `/client` to share the navigation icon's current-user fetching, invalidation and polling logic. Unknown counts stay `undefined`, background failures retain the last successful count, and the Hook exposes loading/error state without changing the built-in badge appearance. Mount consumers in a session-owned scope that remounts on user changes; instances fetch independently rather than using a global cache. See [custom unread menus](skills/nocobase-app-plugin-mail/references/client-integration.md#unread-counts-on-custom-menus) for host-context prerequisites, refresh semantics and lifecycle boundaries.

Composer completion preserves its existing three arguments and adds optional `MailComposerCompletionDetails` as the fourth: exact per-operation submissions and a detached client-request snapshot, or a separate draft reference. Associate business activity by submission ID, not the latest history row, and preserve each record's real status. Async completion errors are isolated and may be handled with `onCompletionError`; the composer does not wait for business persistence to close. See [client integration](skills/nocobase-app-plugin-mail/references/client-integration.md#associate-composer-completion-with-business-records) for unknown outcomes, drafts, bulk sends and reliability limits.

Other Server plugins may register custom providers through `mailProviderRegistryToken` and `MailProviderDefinition`. `createMailProviderRegistry()` creates a standalone registry for tests or isolated integrations; applications should extend the registry supplied by Mail Core. Provider capability records may contain capabilities unknown to this Mail version; Mail does not use unknown keys to enable built-in operations, and treats missing known capabilities as unsupported. Client UIs should tolerate unknown capability keys. A custom `MailCredentialVault` may be registered through `mailCredentialVaultToken` before Mail Core initializes when an application needs its own credential storage.

`MailClient` is the preferred integration with Mail's HTTP API. The [HTTP API reference](skills/nocobase-app-plugin-mail/references/http-api.md) lists the `/api/mail` paths, request and response shapes, error codes, permission resources, realtime event, OAuth callback, and Provider webhook contracts. OAuth callbacks and Provider webhooks are protocol endpoints rather than general application APIs. A running application also serves the `/api/mail` routes in its OpenAPI document, at `/api/swagger/docs` (Swagger UI) and `/api/swagger` (JSON), for a signed-in user or an API key.

The command line derived from that document offers each Mail route only to callers holding the permission the route checks, which its `x-cli.action` names as `type:id/action`: `page:mail.workspace/access`, `mail:mail.management/view` or `/process`, `settings:mail.admin/read` or `/manage`. Mail registers nothing more for the command line: the host's action gate returns these action names for a caller from their roles and, for an API key, its scope, and the manifest matches them exactly, so a gate that does not report them leaves the Mail commands out.

Within a major version, existing public exports, required props, request fields, response meanings, error codes, permissions, and event semantics remain compatible. Additive fields and capabilities must be optional or safely ignored by older consumers. Removing or changing a public contract requires a new major version and a migration note.

## Pages

The client plugin registers four pages, each replaceable as a whole by route name with the application's `routeComponentOverrides`:

| Route name     | Path             | Where                                            | Requires                                  |
| -------------- | ---------------- | ------------------------------------------------ | ----------------------------------------- |
| `mail`         | `/mail`          | Navigation **Mail**, with the unread count       | `page` `mail.workspace` `access`          |
| `mailTeam`     | `/mail/team`     | Navigation **Team mail**                         | `mail` `mail.management` `view`           |
| `mailAccounts` | `/me/mail`       | Personal settings › Integrations › Mail accounts | signed in; its APIs need `mail.workspace` |
| `mailSettings` | `/settings/mail` | System settings › Messages › Mail                | `settings` `mail.admin` `read`            |

`mail({ routes: { mail: { order, parent }, mailTeam: false } })` moves a navigation entry or leaves it out of the menu; the page and its permission remain. The workspace links to the personal Mail accounts page to connect or reconnect an account, and marks accounts whose authorization has lapsed. Team mail lists every member's synchronized mail by member, account, address or `@domain` and keyword; opening a message never marks it read and offers no reply. The Mail settings page shows Providers and their capabilities, every account's status, every sync and send log, and the runtime configuration with where each value comes from; it never shows a subject, body or secret.

`mail.oauthReturnUrl` defaults to the personal Mail accounts page (`/me/mail`), so a person returns there after connecting Gmail or Microsoft 365. An application that leaves out or moves that page configures `mail.oauthReturnUrl` to its own. `MailWorkspacePage` and `MailAccountsPage` remain exported for applications composing their own pages; their props, including `accountsHref`, `headerActions` and `templateVariables`, still work and are combined with what is registered through the extension points below. Production startup warns once when the effective return URL targets the legacy `/dev/mail/accounts` destination.

## Permissions

Mail registers what it offers to be granted with the authorization plugin (`shared/access.ts`), so roles get them on the role permission page. Every `/api/mail` route declares one requirement and the pages' `authz` use the same constants.

| Resource                 | Action    | Allows                                                                                           |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------ |
| `page` `mail.workspace`  | `access`  | The caller's own mail: accounts, messages, drafts, sending, own logs                             |
| `mail` `mail.management` | `view`    | Team mail: read every member's synchronized mail without changing it                             |
| `mail` `mail.management` | `process` | Team mail: mark read, star and archive in bulk (`POST /api/mail/management/messages/batchApply`) |
| `settings` `mail.admin`  | `read`    | Mail settings: Providers, every account's status, every sync and send log                        |
| `settings` `mail.admin`  | `manage`  | Mail settings: retry or cancel another member's synchronization or send                          |

`process` and `manage` do not include `view` and `read`. Grant read-only Team mail with **View** and add **Process** only when the role should mark read, star or archive in bulk; grant read-only mail operations with **View** and add **Manage** only when the role should retry or cancel other members' syncs and sends. `/api/mail/settings/accounts` answers only `mail.admin`, with status, Provider and last synchronization; `/api/mail/management/accounts` answers only `mail.management`, with the ids, addresses and owners Team mail's filters need.

### Upgrading from the former page grants

Team mail and Mail settings were checked as `page` resources that were never registered, so they could only be granted in code or seeds. They are replaced, without a compatibility layer and without converting old grants:

| Former grant                      | Replacement                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `page` `mail.workspace` `access`  | Unchanged                                                          |
| `page` `mail.management` `access` | `mail` `mail.management` `view`, plus `process` for bulk actions   |
| `page` `mail.admin` `access`      | `settings` `mail.admin` `read`, plus `manage` for retry and cancel |

A role holding only a former grant is refused by every Team mail and Mail settings API. Check the application's role seeds and any code that writes grants directly, and grant the replacements on the role permission page or in the seed.

## Extension points

Resolve `mailExtensionsToken` in a client service provider's `boot()` and register what the plugin's own pages should show. Every registry rejects a second entry with the same name, key or type.

```ts
const mail = this.app.container.resolve(mailExtensionsToken);
mail.providerTypes.add({
  type: 'crm-gateway',
  title: 'CRM gateway',
  icon: Building2,
});
mail.slots.messageAside.add({ name: 'customer', component: CustomerAside });
mail.slots.composeToolbar.add({ name: 'quote', component: InsertQuoteButton });
mail.slots.workspaceActions.add({ name: 'import', component: ImportButton });
mail.templateVariables.add({
  key: 'customer',
  label: 'Customer',
  resolve: ({ to }) => lookUpCustomer(to),
});
const stop = mail.composer.onComplete.add(
  (result, rejectedRecipients, error, details) => linkToDeal(details),
);
```

- `providerTypes`: title, icon and an optional connect form for a server Provider `type`, used by the connect dialog and the Providers tab. Server Providers are still registered through `mailProviderRegistryToken`.
- `slots.messageAside`: beside the open message, with its addresses; nothing is rendered when no aside is registered.
- `slots.composeToolbar`: inside the composer, with `insertText` and `insertHtml`.
- `slots.workspaceActions`: in the Mail header after Compose and Sync, which they never replace; replaces the need for the `headerActions` prop.
- `templateVariables`: values for `{{key}}` placeholders when a template is applied; a `templateVariables` prop with the same key wins.
- `composer.onComplete`: called after the page's own completion handling, with the submission IDs and results in its details; returns a function that removes the handler.

Each slot entry renders inside its own error boundary. A custom `MailCredentialVault` is still registered through `mailCredentialVaultToken`.

## Logs and retention

`mail.logRetentionDays` (`MAIL_LOG_RETENTION_DAYS`, default 90) keeps finished sync runs and sends for that many days; `0` keeps them. The maintenance loop deletes at most 1,000 expired rows per table and instance each hour, and never deletes pending, scheduled, running or submitting work. `GET /api/mail/settings/syncRuns` and `GET /api/mail/settings/submissions` filter by member, account, result and time, and `GET /api/mail/settings/overview` returns Providers, capabilities, account counts and the runtime configuration with each value's source, never a secret.

## Exact participant filtering

The workspace's independent **Participant** field and the optional `participant` in `MailMessagesQuery` and `MailManagedMessagesQuery` match actual From, To and Cc addresses. CRM pages can use the app-owned Mail client without changing keyword search:

```ts
const correspondence = await mail.listMessages({
  participant: 'alice@example.com',
});
const companyMail = await mail.listMessages({ participant: '@example.com' });
```

Matching trims surrounding whitespace and lowercases the entire address or domain, then compares exactly. `@example.com` matches that domain only, not subdomains, lookalike domains or suffixes. Supported input is an ASCII dot-atom mailbox or `@` followed by a dotted DNS domain; display-name forms, quoted local parts and Unicode addresses are not supported. Aliases and `+tag` addresses are not folded. Subject, preview, body, display names, Bcc and Reply-To are excluded. `q` keeps its existing fuzzy subject/preview/sender/recipient search (including display names and Bcc); combining it with `participant` and other filters takes their intersection. Filtering is local to synchronized mail and never widens ownership or management permissions.

Omit `participant` to clear it; an explicitly empty, malformed or oversized API value returns `400 INVALID_INPUT` with a `participant` field violation. The client forwards supplied values unchanged. The workspace validates and debounces participant changes, clearing selection and pagination immediately and ignoring old responses; invalid input cannot fall back to an unfiltered request. The filter affects list totals and pagination, not complete conversation details or existing full-thread counts. IMAP folder copies retain their existing record granularity.

## Upgrading the participant index

This feature adds an internal `mailMessageParticipants` schema and backfills existing From/To/Cc from stored sender/recipient JSON, without fetching provider history or rewriting original messages. Invalid or unsupported historical addresses are skipped, not truncated; other valid addresses on the same message are still indexed. The index is derived data, not a public CRUD resource.

Plan a maintenance window: measure representative and large mailboxes, back up the database, stop application writes and all Mail sync/background workers, deploy the new version and run the application's `nocobase db apply`, verify migration completion and known historical address/domain queries, then restart the application and workers. Do not expose participant results before the complete backfill is verified. Reading and inserting bounded batches limits memory and SQL parameters, not transaction duration or lock time: this is **not an online backfill**. Additional participant rows/indexes increase storage and write cost; measure migration time, locks and transaction-log space before deployment. If the measured mailbox scale does not fit the window, postpone deployment for a separately designed resumable backfill, rather than running this migration alongside writes. See [upgrade verification](skills/nocobase-app-plugin-mail/references/synchronization-and-diagnostics.md#participant-index-upgrade) for the operational checklist.

This release also corrects two over-wide unique indexes in the released `202609030001_create_mail_tables` migration that prevented MySQL installations with utf8mb4, and duplicate account cascade paths that prevented SQL Server installations. New signature/message-folder tables retain account checks without a second direct cascade; identity/message deletion still cascades to their descendants. Existing successful installations keep their original columns and data; expect a checksum warning on `nocobase db apply`, review the correction and acknowledge it with `nocobase db repair`. Fresh installations use a 667-character outbound storage-key bound and a 412-character provider subscription-ID bound, retaining full unique indexes within MySQL's key limit.

See the [acceptance scope and evidence](docs/participant-filter-acceptance.md) and [scale verification](docs/participant-filter-verification.md) for the checked behavior, database coverage and operational limitations.

## Agent integration

The package ships `skills/nocobase-app-plugin-mail/` for application agents. Keep this Skill and its references synchronized with the installed package version; it contains the integration contract, safety gates, provider boundaries, and validation workflow.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-mail lint
pnpm --filter @nocobase/app-plugin-mail typecheck
pnpm --filter @nocobase/app-plugin-mail test
pnpm --filter @nocobase/app-plugin-mail build
```

## IMAP location upgrade

Migration `202610250001_mail_imap_message_locations` supports existing mail data. It preserves legacy `imap:` identities and business UUIDs, decodes their recorded folder, UIDVALIDITY and UID locally, and adds `locator` identity sources and account-scoped locations. Localized remote drafts use their `providerDraftMessageId` mirror, including scheduled drafts. Locations initially retain the recorded read/star state and received time as a valid snapshot; subsequent IMAP reads and mutations still verify the remote generation and UID. The migration does not contact a mail server, discover native identities, merge messages, reset synchronization, or rewrite message content, attachments, notes or draft submissions.

Pure local drafts, non-IMAP accounts and SMTP-accepted RFC Message-ID records without a recorded remote tuple remain unchanged. Such SMTP records do not acquire remote addressing merely by upgrading. Malformed legacy locators, out-of-range or missing tuple values, unrepresentable identities and competing message UUIDs for one account's tuple fail precise preflight before schema changes; the migration never guesses a generation, truncates an identity or drops a conflicting record.

Use the maintenance window described above: stop application writes and all Mail workers, back up the database, run the application's `nocobase db apply`, verify sources, positions and representative existing-message operations, then restart. This is an offline upgrade. Historical migration checksums and existing key/subscription lengths remain unchanged, and this upgrade requires no checksum repair. Rollback refuses when mail business data exists because dropping locations or reverting the expanded header field would be destructive; this rollback restriction does not prevent populated upgrades.

## Synchronized folders upgrade

Migration `202611180001_mail_account_sync_folders` adds a nullable `syncFolderIds` column to accounts and pending authorizations. Existing accounts keep `null` and synchronize every folder exactly as before; nothing is deleted until an owner narrows the selection. The upgrade runs online. Its rollback refuses while any account owns folders, messages or other account data, because SQLite drops a column by rebuilding the accounts table and that would cascade into the account's data.

User-facing and application-integration documentation is maintained in the NocoBase documentation site rather than duplicated in this package README.
