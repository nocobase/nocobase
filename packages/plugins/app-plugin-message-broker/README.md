# @nocobase/app-plugin-message-broker

Transactional outbox, inbox and outbox relay for the application's message broker (`@nocobase/message-broker`). Register it with `MessageBrokerServiceProvider`; both templates do. It takes no backend of its own: the `messageBroker` section chooses the middleware, and this plugin makes `publish(message, { transaction })` and subscriptions with `inbox: true` work on any of them.

## What it adds

- `messageBrokerOutbox`: a message published inside a transaction, written in that transaction and sent after it commits. A rolled-back transaction leaves no row; a committed row survives a crash and is sent by the next instance that runs a relay round.
- `messageBrokerInbox`: `(subscription, messageId)` of every message a subscription with `inbox: true` processed, written in the handler's transaction, so a redelivered message is acknowledged without running the handler again.
- The relay, started in the provider's `start()` and stopped in its `shutdown()`, before the broker service closes. It runs after every commit that wrote outbox rows and every `pollInterval`, under the concurrency lock `message-broker:outbox`, so one instance at a time sends a given row. Several instances need a shared concurrency backend for that; with process-local locks each instance relays on its own and receivers see duplicates, which their `messageId` deduplication absorbs.

Both tables live on the default database connection; publish inside a transaction on that connection. Times are stored as epoch milliseconds. Message bodies are limited to 64 KB on every database.

The `@nocobase/message-broker` README describes delivery semantics, costs and how this plugin fits the service.

## Configuration

The optional `messageBrokerOutbox` section, in milliseconds:

| Field             | Default   | Means                                                                                      |
| ----------------- | --------- | ------------------------------------------------------------------------------------------ |
| `pollInterval`    | 5000      | Time between fallback relay rounds on each instance                                        |
| `outboxRetention` | 86400000  | How long a sent row is kept for inspection; `0` deletes it at the next hourly cleanup      |
| `inboxRetention`  | 604800000 | How long a processed message is remembered: the window in which a redelivery is recognized |

A row that cannot be sent is retried after 2 s, doubling up to 5 minutes, without a limit; `attempts` and `lastError` on the row show why it is waiting.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-message-broker lint
pnpm --filter @nocobase/app-plugin-message-broker typecheck
pnpm --filter @nocobase/app-plugin-message-broker test
pnpm --filter @nocobase/app-plugin-message-broker build
```
