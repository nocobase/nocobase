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

Register that factory under the `mail` key in the application's `defaultAppConfigs()` composition. The plugin uses built-in defaults when the namespace is absent, but no external Mail provider is available until the application configures one. Keep provider credentials in private server configuration. `mailConfig` declares all seven `MAIL_*` overrides as section-relative environment rules; composing it makes them effective and discoverable with `pnpm nocobase config env`. The legacy `mailEnvironmentMappings` export retains fully prefixed paths for application-level environment providers; do not pass it as a section's `env`.

For Gmail, `mail.providers.<name>.quota` can override per-user and per-project quota pacing using the allocation shown in Google Cloud; otherwise the plugin uses conservative defaults with headroom. Account creation requires an initial-sync date, and the account screen defaults it to one calendar month ago. Direct initial-sync requests must also provide a date boundary. See the Mail Skill references for configuration and quota details.

## Supported integration surface

Import the server plugin and service contracts from `@nocobase/app-plugin-mail/server`, the client plugin, `MailWorkspacePage` and `MailAccountsPage` from `@nocobase/app-plugin-mail/client`, and reusable UI from `@nocobase/app-plugin-mail/client/components`. The package root is a Server alias; new application code should use the explicit `/server` path. `MailClient` and `mailClientToken` are the supported Client data access layer; `mailServiceToken` is the supported in-process Server facade. Do not import implementation files, persistence contracts, internal service tokens, or route contribution modules. See the [public API inventory](skills/nocobase-app-plugin-mail/references/public-api.md) for the exported names and responsibility of each entry.

The supported reusable UI exports `MailAccountCard`, `MailAccountConnector`, `MailConversationView`, `MailMessageList`, `MailProviderCard`, `MailRichTextEditor`, `MailNavigationIcon`, `MailLabelManager`, `MailLabelTag`, `MailLabelColorDot`, `MailSignatureManager`, `MailStatusBadge`, `MailSyncPolicyFields`, `MailTemplateManager`, `MailboxSidebar`, `MailComposer`, and `MailWorkspaceComposer`, together with their exported props and state types. `MailComposer` renders one supplied compose request; `MailWorkspaceComposer` additionally coordinates sendable identities across accounts. Register the Mail Client plugin before rendering components that use `useMailClient()`.

Custom menus can use `useMailUnreadCount()` and `MailUnreadCountState` from `/client` to share the navigation icon's current-user fetching, invalidation and polling logic. Unknown counts stay `undefined`, background failures retain the last successful count, and the Hook exposes loading/error state without changing the built-in badge appearance. Mount consumers in a session-owned scope that remounts on user changes; instances fetch independently rather than using a global cache. See [custom unread menus](skills/nocobase-app-plugin-mail/references/client-integration.md#unread-counts-on-custom-menus) for host-context prerequisites, refresh semantics and lifecycle boundaries.

Composer completion preserves its existing three arguments and adds optional `MailComposerCompletionDetails` as the fourth: exact per-operation submissions and a detached client-request snapshot, or a separate draft reference. Associate business activity by submission ID, not the latest history row, and preserve each record's real status. Async completion errors are isolated and may be handled with `onCompletionError`; the composer does not wait for business persistence to close. See [client integration](skills/nocobase-app-plugin-mail/references/client-integration.md#associate-composer-completion-with-business-records) for unknown outcomes, drafts, bulk sends and reliability limits.

For a production workspace, register an application-owned personal account route rendering the public `MailAccountsPage`, pass its path (without the deployment prefix) as `MailWorkspacePage.accountsHref`, and configure `mail.oauthReturnUrl` separately to the same page. The empty workspace shows a connection link and the populated workspace keeps an account-management link; without `accountsHref` it invents no route. Optional `headerActions` append application actions without replacing Compose or Sync. See the [client integration guide](skills/nocobase-app-plugin-mail/references/client-integration.md) for authentication and permission wiring.

The plugin registers no built-in Dev, settings or management pages or routes; applications own their Mail pages. `mail.oauthReturnUrl` defaults to the application's root (`/`), not an account page. Register an application-owned, authenticated personal account page with `page / mail.workspace / access` permission and configure the return URL to that page. Production startup warns once only when the effective return URL targets the legacy `/dev/mail/accounts` destination, including prefixed and absolute forms; the current default does not trigger that warning. The warning does not block startup, change configuration or verify arbitrary application routes. An application-owned administrator overview using the read-only all-user APIs is not a substitute for personal connection. Application runtime environment checks use `app.nodeEnv`, including embedded apps with an environment distinct from their host.

Other Server plugins may register custom providers through `mailProviderRegistryToken` and `MailProviderDefinition`. `createMailProviderRegistry()` creates a standalone registry for tests or isolated integrations; applications should extend the registry supplied by Mail Core. Provider capability records may contain capabilities unknown to this Mail version; Mail does not use unknown keys to enable built-in operations, and treats missing known capabilities as unsupported. Client UIs should tolerate unknown capability keys. A custom `MailCredentialVault` may be registered through `mailCredentialVaultToken` before Mail Core initializes when an application needs its own credential storage.

Server integrations can subscribe through `MailService.onMessagesSynced()` to committed synchronization inserts on the application's `@nocobase/queue` service. Events contain bounded local message IDs, account/run metadata and a history/catch-up/incremental phase, not complete bodies. There are no Mail event-log tables or incremental event-read checkpoints. The queue owns delivery, retry and retention; Redis workers compete rather than broadcasting to every instance. Publishing occurs after the Mail transaction commits and can fail or be lost before queue acceptance, so this is not atomic or exactly-once delivery. See [Server synchronization events](skills/nocobase-app-plugin-mail/references/message-sync-events.md) for Provider lifecycle, permission boundaries, idempotent processing, content recovery and backend limits.

`MailClient` is the preferred integration with Mail's HTTP API. The [HTTP API reference](skills/nocobase-app-plugin-mail/references/http-api.md) lists the `/api/mail` paths, request and response shapes, error codes, permission resources, realtime event, OAuth callback, and Provider webhook contracts. OAuth callbacks and Provider webhooks are protocol endpoints rather than general application APIs. A running application also serves the `/api/mail` routes in its OpenAPI document, at `/api/swagger/docs` (Swagger UI) and `/api/swagger` (JSON), for a signed-in user or an API key.

Within a major version, existing public exports, required props, request fields, response meanings, error codes, permissions, and event semantics remain compatible. Additive fields and capabilities must be optional or safely ignored by older consumers. Removing or changing a public contract requires a new major version and a migration note.

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

User-facing and application-integration documentation is maintained in the NocoBase documentation site rather than duplicated in this package README.
