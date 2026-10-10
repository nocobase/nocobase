# Configuration and accounts

## Contents

- [Registration and configuration ownership](#registration-and-configuration-ownership)
- [Connect and manage accounts](#connect-and-manage-accounts)
- [OAuth callback and return page](#oauth-callback-and-return-page)
- [Push synchronization](#push-synchronization)
- [IMAP/SMTP boundaries and sent copies](#imapsmtp-boundaries-and-sent-copies)
- [Credential storage and provider extensions](#credential-storage-and-provider-extensions)
- [Verify this path](#verify-this-path)

## Registration and configuration ownership

Inspect the application's Client, Server, and configuration composition roots before adding Mail. `pnpm nocobase plugin register mail` installs the package, wires Client/Server composition entries, and synchronizes this Skill, but it does not register the application-owned `mail` configuration. Add `server/config/mail.ts`, import it from `server/config/index.ts`, and complete the required migrations through the application's migration workflow. Configuration and credential work alone do not require creating another plugin or another migration. Background synchronization and scheduled sending require the application jobs service: `JobExecutorServiceProvider` from `@nocobase/app-server/jobs` in `server/app.ts`, which the application templates already compose. Mail runs them on its `@nocobase/app-plugin-mail` scope. `mail.jobs` (override `MAIL_JOBS`) names the `jobs` configuration they run on, for example one with its own `concurrency`; left out, they follow `jobs.default`, and a name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so an application running more than one instance needs a `redis` jobs configuration.

Use this minimal configuration registration in an application that does not already provide it:

```ts
// server/config/mail.ts
import { mailConfig } from '@nocobase/app-plugin-mail/server';

export default mailConfig;
```

Register this factory under `mail` in `server/config/index.ts` through `defaultAppConfigs()`. The Mail plugin falls back to built-in defaults when the whole namespace is absent, but provider instances still require this registration. `mailConfig` already declares all seven `MAIL_*` environment overrides using section-relative paths, and `pnpm nocobase config env` discovers them. No application-level environment file or duplicated mappings are needed. `mailEnvironmentMappings` remains a compatibility export with fully prefixed `mail.*` paths for older application-level providers; never pass it directly as a section's `env`.

Environment values override configuration files and code defaults. Before upgrading, review existing OAuth, sync, webhook and jobs variables that may previously have been inert. Undefined values keep defaults; empty or invalid integer values fail configuration loading, and Mail retains its numeric bounds. Existing application-level providers can coexist when their mappings match; section rules take priority over their custom transformations, so migrate custom parsers into the section rules when needed. A variable mapped to different paths in different sections is rejected even when unset. Mail configuration is not public browser configuration, and webhook secrets must not be exposed.

`mail.providers` is a map keyed by stable instance names. The map key is the provider name; each value contains `type` and provider-specific options. Multiple instances of the same type can coexist. Renaming an instance breaks its existing account association. `enabled` defaults to `true`; disabling an instance also makes it unavailable to existing accounts.

Keep only the instances needed by the application. These placeholders describe the configuration shape; replace them before connecting an account. User mailbox providers are separate from SMTP providers under `notification` used for system notifications.

```yaml
mail:
  providers:
    google:
      type: gmail
      clientId: replace-with-google-oauth-client-id
      clientSecret: replace-with-google-oauth-client-secret
      # Optional. Set to the quota allocated to this Google Cloud project.
      quota:
        projectId: replace-with-google-cloud-project-id
        unitsPerUserPerMinute: 6000
        unitsPerProjectPerMinute: 1200000
    microsoft-365:
      type: microsoft
      clientId: replace-with-microsoft-entra-client-id
      clientSecret: replace-with-microsoft-entra-client-secret
      # tenant: common # Default; override for a specific tenant.
    company-mail:
      type: imap-smtp
      imap:
        host: imap.example.com
        port: 993
        secure: true
      smtp:
        host: smtp.example.com
        port: 465
        secure: true
      # Enable only when the SMTP service does not save sent messages itself.
      # sentCopyMode: client
      # sentFolder: Sent # Existing folder; optional if the server marks a Sent folder.
```

Use one of the following instance shapes; inspect the installed provider types for optional settings rather than copying internal adapter code.

| Type        | Required configuration and connection                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `gmail`     | `clientId`, `clientSecret`; connect through Google OAuth                                                                              |
| `microsoft` | `clientId`, `clientSecret`; optional `tenant` defaults to `common`; connect through Microsoft OAuth                                   |
| `imap-smtp` | `imap` and `smtp`, each with `host`, `port`, and `secure`; the user supplies mailbox address, username and password during connection |

## Gmail quota configuration

`quota` is an optional server-side setting on each Gmail provider instance; it is not an end-user setting. Both values are positive integer quota units per minute. When omitted, Mail uses 6,000 units per user per project per minute and 1,200,000 units per project per minute, then paces requests at 80% of those limits. These are the current default limits for newer Google Cloud projects; actual allocations can differ, especially for older or quota-adjusted projects. Check the Gmail API quota page and the project's Google Cloud Console before raising a value. A local override does not request or increase Google's quota.

The limiter keys project usage by `quota.projectId` (or falls back to OAuth `clientId`) and user usage by that project ID plus mailbox address. Set the same Google Cloud project ID on provider instances that use different OAuth client IDs from one project, so their quotas are coordinated in-process. The limiter is in-memory per application process. When multiple server processes share the same Gmail project, divide the project's actual per-user and per-project limits among those processes (or route Gmail sync through one worker); repeating the full project quota on every process can exceed Google's shared quota.

```yaml
mail:
  providers:
    google:
      type: gmail
      clientId: replace-with-google-oauth-client-id
      clientSecret: replace-with-google-oauth-client-secret
      quota:
        projectId: replace-with-google-cloud-project-id
        unitsPerUserPerMinute: 6000 # Replace with the actual allocation when it differs.
        unitsPerProjectPerMinute: 1200000
```

Use the un-throttled Google quota values in configuration; Mail applies its 20% headroom internally. Omit either property to use the corresponding default. The defaults are intentionally conservative and may slow projects with higher approved quotas.

Official references: [Gmail API quotas and quota-increase guidance](https://developers.google.com/workspace/gmail/api/reference/quota?hl=zh-cn). [verified: 2026-09-26]

For IMAP/SMTP, `secure: true` means TLS from connection start; STARTTLS endpoints use the service's prescribed settings. TLS certificate verification defaults to enabled. Mail validates both endpoints before saving account credentials. Use the provider-required app password or authorization code where applicable.

The connection form's Username is the shared IMAP and SMTP login name, not the sender's display name. It is optional: an omitted, empty, or whitespace-only value uses the entered mailbox address. A supplied login name is trimmed without changing case or requiring email syntax. Mailbox address and password remain required.

Provider secrets, endpoints and allowed OAuth `scopes` live in `mail.providers`. The top-level `MAIL_*` overrides below do not create per-provider credential environment mappings. Do not assume generic `${NAME}` interpolation in YAML; use the target application's supported server configuration mechanism. Keep actual secrets in private server configuration, out of committed examples and client bundles, and restart after changing configuration.

## Connect and manage accounts

`MailAccountsPage` contains account connection, a history start date defaulting to one calendar month ago, account suspend/resume and removal, and signature, template and NocoBase label management. New OAuth and credential-based account requests must include `initialSyncReceivedAfter` as a valid ISO 8601 date-time; the server rejects a missing or invalid boundary instead of allowing an unbounded initial import. A registered provider without a configured instance is unavailable for connection.

Use public account and authorization APIs or the existing client flow. OAuth starts with an authenticated request to `POST /api/mail/authorizations`; credential-based connection uses `POST /api/mail/accounts/connect`. Preserve the plugin's short-lived, single-use OAuth state. Account and log responses must remain free of credentials and tokens.

Personal account operations use `/api/mail/accounts`. `/api/mail/settings/accounts` is a read-only all-user overview, with owner names and a user-ID fallback. Suspending prevents sending and synchronization. Removing an account clears its local data and authorization without deleting provider mailbox messages; remote subscription cleanup can fail without preventing local removal.

## OAuth callback and return page

The default callback is the app-local `/mail/oauth/callback`. Mail combines `app.publicOrigin` (or the request origin) with `app.publicBasePath` and that path. An application mounted at `/main` with origin `https://mail.example.com` uses:

```text
https://mail.example.com/main/mail/oauth/callback
```

Override through `mail.oauthCallbackUrl` or `MAIL_OAUTH_CALLBACK_URL`. A relative path receives the application prefix; an absolute HTTP(S) URL must already include it and reach the mounted callback. Register the exact resulting URL with the OAuth provider. Fragments are invalid. `oauthCallbackUrl` controls only the provider callback endpoint, not the page shown in the browser after authorization.

Configure the browser destination through `mail.oauthReturnUrl` or `MAIL_OAUTH_RETURN_URL`. It defaults to the application's root (`/`), and the plugin registers no built-in Dev, settings or management pages or routes. Register an application-owned page rendering the public `MailAccountsPage`, such as `/mail/accounts`, and configure the return URL to match that personal account page. A relative return path receives the application public base path, so `/mail/accounts` under `/main` becomes `/main/mail/accounts`; an absolute HTTP(S) URL is also supported and is treated as trusted server configuration. Fragments are invalid.

Mail warns once at production startup if the effective return destination targets the legacy `/dev/mail/accounts` page, including prefixed and absolute URL forms with query parameters. The current root (`/`) default does not trigger the warning. The warning does not change defaults, block startup, validate arbitrary client route existence, or expose full URLs or secrets. Production apps must register their own authenticated personal account page, such as `/mail/accounts`, with `page / mail.workspace / access` permission; reuse the public `MailAccountsPage`, which already reads authorization results and refreshes accounts. An application-owned administrator overview using the read-only all-user APIs is not a personal connection destination. See [Client integration](client-integration.md) for route composition. Set `MailWorkspacePage.accountsHref` separately: a navigation link does not configure the server's OAuth return.

For a production application, configure the callback and return paths together so the provider callback and application page are not confused:

```yaml
mail:
  oauthCallbackUrl: /mail/oauth/callback
  oauthReturnUrl: /mail/accounts
```

With origin `https://mail.example.com` and public base path `/main`, the provider must redirect to `https://mail.example.com/main/mail/oauth/callback`, and the browser will finish at `https://mail.example.com/main/mail/accounts?mailAuthorization=success` or `https://mail.example.com/main/mail/accounts?mailAuthorization=failure`. Register the full callback URL with the selected OAuth provider, such as Google for Gmail or Microsoft Entra ID for Microsoft 365, not the return page URL.

When deployment values come from environment variables, use `MAIL_OAUTH_CALLBACK_URL=/mail/oauth/callback` and `MAIL_OAUTH_RETURN_URL=/mail/accounts` without repeating `/main`. Composing `mailConfig` as `mail` activates these overrides automatically. Current templates use configuration-section rules, not an application-level environment file. A wrapper that customizes defaults must explicitly retain `env: mailConfig.rules?.env`; merely calling `mailConfig(runtime)` returns defaults, not its environment rules. To customize parsing, spread those section rules and override the selected variable using a section-relative path. Do not pass the legacy full-path `mailEnvironmentMappings` as a section's `env`.

The plugin preserves query parameters already present in the configured return URL and adds or replaces `mailAuthorization=success` or `mailAuthorization=failure`. The application-owned return page can use this status to show a result and refresh its account state.

The callback route still performs provider code exchange, OAuth state validation, and account persistence before redirecting. A custom return page therefore does not implement the OAuth callback and does not call `POST /api/mail/accounts/connect` to save the just-authorized account again. If the page also exposes a new-account action, it may compose `MailAccountConnector` or call the documented authorization APIs for that separate action.

The browser flow is: the provider redirects to `oauthCallbackUrl`; Mail validates the one-time state, completes authorization and saves the account; Mail redirects to `oauthReturnUrl`; the application-owned page reads `mailAuthorization` and refreshes `GET /api/mail/accounts` if needed. A missing `state` is rejected with HTTP 400 and does not redirect to the return page.

Before enabling production account connection, confirm that the application-owned return route exists in the production client, the full callback URL is registered with the provider, the configured relative paths match the public base path, and both success and failure destinations are handled.

## Push synchronization

Push is optional and supplements periodic synchronization. Configure both `mail.pushWebhookUrl` and `mail.pushWebhookSecret`, or their overrides `MAIL_PUSH_WEBHOOK_URL` and `MAIL_PUSH_WEBHOOK_SECRET`. The base URL must reach the public Mail webhook route; the secret is 32–128 characters using letters, digits, `_`, or `-`.

For example, base `https://mail.example.com/main/mail/webhooks`, type `gmail`, and instance `google` produce `https://mail.example.com/main/mail/webhooks/gmail/google/<secret>`.

- Gmail also needs `pushTopicName` and a Pub/Sub push subscription targeting the complete URL. The topic must allow Gmail's push service to publish. Optional `pushLabelIds` narrows the watch; Mail creates and renews account watches.
- Microsoft Graph subscriptions, endpoint validation, `clientState` checks and renewal are handled by Mail. The endpoint must be publicly reachable over HTTPS.
- IMAP/SMTP has no push support.

Preserve webhook secret validation and the provider-specific boundary; external webhook callers have no application session. A notification schedules the existing incremental path rather than writing messages directly. Keep periodic sync enabled as the fallback.

## IMAP/SMTP boundaries and sent copies

The generic adapter supports periodic new-UID discovery, sending, attachments, read/star updates and explicit permanent deletion. It does not support remote draft mirrors, discovered aliases, provider-native labels, move-to-folder, or complete external flag/deletion/move reconciliation. Local drafts and NocoBase metadata remain supported. Ordinary deletion is rejected because this adapter cannot move mail to Trash; do not substitute permanent deletion for that action.

`sentCopyMode` defaults to `server`, leaving sent-mail archiving to SMTP. When the service does not save sent copies, set `sentCopyMode: client` and use an existing `sentFolder` or server-designated Sent folder. The plugin appends the sent content and checks Message-ID before append. Keep `server` when the service saves asynchronously: an immediate duplicate check cannot see a future server copy.

A failed append records `IMAP_SENT_COPY_FAILED` while retaining the accepted submission. Fix the archive configuration without resending the accepted mail. The client does not automatically retry an ambiguous append. Advanced folder hints `sentFolder`, `trashFolder`, and `draftsFolder` identify provider folders; they do not enable unsupported move or remote-draft capabilities. Keep `trashFolder` and `draftsFolder` out of the minimal configuration example. Setting `sentFolder` alone does not enable client archiving; `sentCopyMode: client` is required.

## Credential storage and provider extensions

The default `mailCredentialVaultToken` implementation persists plain JSON. For encryption, register a compatible replacement before Mail Core and verify save, load, token rotation, and removal through account operations. Preserve ownership checks and API redaction; encryption does not replace either.

Third-party provider definitions register through `mailProviderRegistryToken`. For a requested extension, inspect the installed `MailProviderDefinition` and `MailProviderAdapter` types and the package's shipped provider documentation. Implement the capabilities actually advertised, including resumable page and cursor contracts where synchronization is supported. Built-in provider configuration alone needs no extension.

## Verify this path

Confirm registration, migrations, provider availability, and connection with the intended account. Check that the account API returns no token material, an unrelated user cannot operate it, and disabling it blocks send/sync. For OAuth changes, verify exact callback matching, rejection of reused state, account persistence before redirect, configured destinations under the actual application base path, preservation of existing query parameters, and the destination after both success and failure. For push changes, verify the generated endpoint and an actual sync trigger separately from periodic polling.
