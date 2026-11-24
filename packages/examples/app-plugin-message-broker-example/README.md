# @nocobase/app-plugin-message-broker-example

Message broker app plugin example. It publishes `order.placed` events to the logical publisher `orderEvents` and consumes them from the subscription of the same name, through the application's `MessageBrokerService`, which it resolves from `messageBrokerServiceToken` in `@nocobase/app-server/message-broker`. The examples template registers it with `@nocobase/app-plugin-message-broker`, which supplies the outbox and inbox it uses, on the in-memory backend; pointing `orderEvents` at a real middleware is a change to the `messageBroker` configuration only.

`server/service.ts` publishes. `publishOrderPlaced(order, transaction)` derives the `messageId` from the order, so every redelivery carries the same ID, and uses the order ID as the `key`. Inside a transaction the message is written to the outbox and sent once the transaction commits; without one it is sent at once.

`server/providers/message-broker-example.ts` consumes. `boot()` registers the handler before the broker is set up, so the subscription's options are checked against the backend's capabilities at startup. The subscription validates bodies with a zod schema, which dead-letters a malformed order without running the handler, and sets `inbox: true`, which skips a repeated `messageId`. The handler returns to acknowledge; a throw would retry the message up to `maxAttempts` and then dead-letter it. `shutdown()` awaits the unregister function.

The plugin has no routes; `tests/message-broker-example.test.ts` drives it against an in-memory broker, and the examples template's `tests/server/message-broker.test.ts` publishes inside a real database transaction.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-message-broker-example lint
pnpm --filter @nocobase/app-plugin-message-broker-example typecheck
pnpm --filter @nocobase/app-plugin-message-broker-example test
pnpm --filter @nocobase/app-plugin-message-broker-example build
```
