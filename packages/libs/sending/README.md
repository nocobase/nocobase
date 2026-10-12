# Sending

`@nocobase/sending` owns named external channels, message validation, preparation, submission deadlines and shared transport lifecycle. It has no dependency on authentication, authorization, notification records or application configuration. SMTP and Resend SDKs load when a transport is first used. Feishu and DingTalk webhook adapters use HTTPS.

Applications register `SendingProvider` from `@nocobase/app-server/sending` before their plugin providers. Consumers resolve `sendingServiceToken`, check `available(name, 'email')` without opening a connection, and call `send({ channel, message })`. Each submission has a maximum 20 second budget; callers may provide a shorter absolute millisecond deadline and a stable deliveryId for providers supporting native idempotency. `accepted` means the provider accepted submission, not inbox delivery. `submission_unknown` must not be automatically retried without provider idempotency or a human decision.

The sending service owns transports and closes them at shutdown. Notification retains its durable records, retries, leases, management APIs and in-app channels, while using the same external transport. The user mailbox plugin remains independent and keeps its own user credentials and connections.
