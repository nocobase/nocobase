# @nocobase/app-plugin-mail-example

An offline full-stack example of extending NocoBase Mail with a custom Provider. It registers a demo mailbox Provider through Mail's public Provider registry, reuses Mail's real account, sync, message, and send flows, and exposes the Mail workspace from an application navigation entry.

The OSS Examples template registers Mail and this example, including the three offline Provider configurations. Other templates do not load the example.

## Demo data and user interface

Configure the three mock Provider instances under the application's `mail.providers` setting. Open **Mail example** in the main navigation. On first visit, the example connects `sam@example.test`, `alex-microsoft@example.test`, and `casey-imap@example.test`, then synchronizes each mailbox through Mail's public client API. No real credentials or manual account setup are needed.

The first page is account management, followed by a complete Mail workspace, an all-mail list, send activity, and synchronization logs. Account management reuses Mail's Dev account page, including its connect-account flow and template, signature, and label management panels. It limits the account and Provider lists to the three mock Provider types. The account page can connect additional `@example.test` mailboxes through any of them. Gmail, Microsoft 365, and IMAP/SMTP are separate mock Provider types backed by the same offline fixture implementation. Each supplies deterministic inbox and sent messages, including a text attachment. Mail imports those messages through its normal sync path and persists them in the application's Mail database. The example seeds editable templates, signatures, and labels before showing the page; templates are available in the composer with example variables, labels can be applied to sample messages in the Mail workspace, and each initial account has a default signature. Sending uses Mail's normal send path, records a simulated outbox entry in memory, and never contacts an external mail service. The accepted message is also saved by Mail in the local Sent folder and appears in the activity log with the account's default signature.

The example is a full-stack plugin, not a standalone NocoBase application. Register it in both the Client and Server composition roots, and register `@nocobase/app-plugin-mail` in both roots as well. The application must also register Mail's config factory and provide its normal queue configuration. Add this provider instance to the app's `config.yml`:

```yaml
mail:
  providers:
    demo:
      type: mail-example
    demo-microsoft:
      type: mail-example-microsoft
    demo-imap-smtp:
      type: mail-example-imap-smtp
```

Initialize and check the app config with `pnpm config:init`, `pnpm config:set`, and `pnpm config:check` as appropriate before starting the app. See the Mail plugin's configuration guide for the application-owned config wiring.

## Verify

Run `pnpm --filter @nocobase/app-plugin-mail-example check` from the NocoBase 3 repository root. Its tests cover demo account connection, fixture listing, attachment retrieval, simulated sending, and Provider registration without network access.

For a UI run, install both plugins into an OSS Default application, add the three provider entries above, initialize and check the application configuration, then start it with `pnpm dev`. Open **Mail example** in the application navigation; the three accounts and fixture messages are prepared automatically. Try adding another `@example.test` account, suspending/resuming an account, browsing **All mail**, starting a sync and inspecting **Sync logs**, editing a template or signature, applying a label to a message, then using the workspace to reply or send a message and reviewing **Send activity**. Never add real credentials to the demo configuration.
