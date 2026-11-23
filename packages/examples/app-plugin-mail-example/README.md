# @nocobase/app-plugin-mail-example

An offline full-stack example of extending NocoBase Mail with a custom Provider. It registers three demo mailbox Provider types through Mail's public Provider registry and reuses Mail's real account, sync, message and send flows. It has no pages of its own: it extends the pages Mail registers (**Mail**, **Team mail**, **Personal settings › Mail accounts** and **System settings › Mail**) through Mail's client extension points.

The OSS Examples template registers Mail and this example, including the three offline Provider configurations. Other templates do not load the example.

## Demo data and user interface

Configure the three mock Provider instances under the application's `mail.providers` setting. Open **Mail** in the main navigation and choose **Set up demo mailboxes** in its header, a `mail.slots.workspaceActions` entry this example registers. It connects `sam@example.test`, `alex-microsoft@example.test` and `casey-imap@example.test`, synchronizes each mailbox through Mail's public client API, and seeds editable templates, signatures and labels; the button disappears once all three are connected. No real credentials are needed. The example also registers titles for its three Provider types with `mail.providerTypes`, which the connect dialog and the Providers tab of the Mail settings page show.

Gmail, Microsoft 365, and IMAP/SMTP are separate mock Provider types backed by the same offline fixture implementation. Each supplies deterministic inbox and sent messages, including a text attachment. Mail imports those messages through its normal sync path and persists them in the application's Mail database. More `@example.test` mailboxes can be connected from **Personal settings › Mail accounts** with any of them. Sending uses Mail's normal send path, records a simulated outbox entry in memory, and never contacts an external mail service; the accepted message is saved by Mail in the local Sent folder and appears under **Activity** on the Mail accounts page.

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

For a UI run, use the OSS Examples template, or install both plugins into an OSS Default application and add the three provider entries above, initialize and check the application configuration, then start it with `pnpm dev`. Open **Mail**, choose **Set up demo mailboxes**, then filter by an address or `@domain`, add a note, reply or schedule a send, and review the result under **Personal settings › Mail accounts › Activity**. Never add real credentials to the demo configuration.
