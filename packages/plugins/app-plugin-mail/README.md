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

The plugin can start with built-in defaults when this namespace is absent, but no external Mail provider is available until the application configures one. Keep provider credentials in private server configuration. If the application uses Mail environment overrides, merge the exported `mailEnvironmentMappings` into the application's environment mappings in `server/environment.ts`. The package metadata lists the supported variables, but applications must explicitly map them for the overrides to take effect.

For Gmail, `mail.providers.<name>.quota` can override per-user and per-project quota pacing using the allocation shown in Google Cloud; otherwise the plugin uses conservative defaults with headroom. Account creation requires an initial-sync date, and the account screen defaults it to one calendar month ago. Direct initial-sync requests must also provide a date boundary. See the Mail Skill references for configuration and quota details.

## Supported integration surface

Import the server plugin and service contracts from `@nocobase/app-plugin-mail/server`, the client plugin and `MailWorkspacePage` from `@nocobase/app-plugin-mail/client`, and reusable UI from `@nocobase/app-plugin-mail/client/components`. The package root is a Server alias; new application code should use the explicit `/server` path. `MailClient` and `mailClientToken` are the supported Client data access layer; `mailServiceToken` is the supported in-process Server facade. Do not import implementation files, persistence contracts, internal service tokens, or route contribution modules. See the [public API inventory](skills/nocobase-app-plugin-mail/references/public-api.md) for the exported names and responsibility of each entry.

The supported reusable UI exports `MailAccountCard`, `MailAccountConnector`, `MailConversationView`, `MailMessageList`, `MailProviderCard`, `MailRichTextEditor`, `MailNavigationIcon`, `MailLabelManager`, `MailLabelTag`, `MailLabelColorDot`, `MailSignatureManager`, `MailStatusBadge`, `MailSyncPolicyFields`, `MailTemplateManager`, `MailboxSidebar`, `MailComposer`, and `MailWorkspaceComposer`, together with their exported props and state types. `MailComposer` renders one supplied compose request; `MailWorkspaceComposer` additionally coordinates sendable identities across accounts. Register the Mail Client plugin before rendering components that use `useMailClient()`.

Other Server plugins may register custom providers through `mailProviderRegistryToken` and `MailProviderDefinition`. `createMailProviderRegistry()` creates a standalone registry for tests or isolated integrations; applications should extend the registry supplied by Mail Core. Provider capability records may contain capabilities unknown to this Mail version; Mail does not use unknown keys to enable built-in operations, and treats missing known capabilities as unsupported. Client UIs should tolerate unknown capability keys. A custom `MailCredentialVault` may be registered through `mailCredentialVaultToken` before Mail Core initializes when an application needs its own credential storage.

`MailClient` is the preferred integration with Mail's HTTP API. The [HTTP API reference](skills/nocobase-app-plugin-mail/references/http-api.md) lists the `/api/mail` paths, request and response shapes, error codes, permission resources, realtime event, OAuth callback, and Provider webhook contracts. OAuth callbacks and Provider webhooks are protocol endpoints rather than general application APIs. A running application also serves the `/api/mail` routes in its OpenAPI document, at `/api/swagger/docs` (Swagger UI) and `/api/swagger` (JSON), for a signed-in user or an API key.

Within a major version, existing public exports, required props, request fields, response meanings, error codes, permissions, and event semantics remain compatible. Additive fields and capabilities must be optional or safely ignored by older consumers. Removing or changing a public contract requires a new major version and a migration note.

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
