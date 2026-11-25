# @nocobase/app-plugin-message-broker-example

Message broker app plugin example: a business event published in the business transaction and consumed by independent subscriptions that update business tables through the inbox, plus a message received from an external system. It uses the application's `MessageBrokerService`, resolved from `messageBrokerServiceToken` in `@nocobase/app-server/message-broker`, and the outbox and inbox of `@nocobase/app-plugin-message-broker`. The examples template registers both plugins on the in-memory backend.

## The scenario

- `placeOrder()` in `server/service.ts` creates a row in `messageBrokerExampleOrders` and publishes `order.placed` to the logical publisher `orderEvents` with `{ transaction }`, in one transaction. A rollback leaves neither the order nor the message; a committed message is sent by the outbox relay. The `messageId` is `order-placed:<orderId>`, one ID per business event, and the order ID is the ordering `key`.
- `orderShipments` and `customerOrderStats` are two independent subscriptions to the same events. Each runs its own retries and dead letters: a failure in one does not run the other again. Both set `inbox: true` and write through `context.transaction`, so their writes commit together with the inbox record. `orderShipments` creates a row in `messageBrokerExampleShipments`; `customerOrderStats` increments counters in `messageBrokerExampleCustomerStats`, an effect that would count twice on a redelivery without the inbox.
- `paymentEvents` is published by an external payment provider. Its handler marks the order paid inside the inbox transaction and returns `reject()` for an order it does not know, which rolls the transaction back and dead-letters the message for an operator. In production, `orderEvents` can be read by other systems through the same middleware resource.

Each subscription validates bodies with a zod schema; a malformed message is dead-lettered without running the handler. Handlers are registered in the provider's `boot()` and unregistered in `shutdown()`.

## Configuration

The subscriptions read the topic the publisher writes, which the application maps in its `messageBroker` section; the examples template's `server/config/message-broker.ts` has:

```ts
{
  default: 'memory',
  backends: {
    memory: {
      adapter: 'inMemory',
      subscriptions: {
        orderShipments: { topic: 'orderEvents' },
        customerOrderStats: { topic: 'orderEvents' },
      },
    },
  },
}
```

Moving to a real middleware changes this section only: map `orderEvents` to an exchange or topic, each subscription to its own queue or consumer group, and `paymentEvents` to the resource the payment provider publishes to. The plugin's migration creates its three tables; run `pnpm nocobase db apply` in the application.

## Tests

`tests/message-broker-example.test.ts` runs on a real database with the outbox plugin's and this plugin's migrations, composing the outbox plugin's provider with this plugin's provider on an in-memory backend. It covers a committed order reaching both subscriptions, a rolled-back transaction publishing nothing, a handler that fails after writing being rolled back and retried while the other subscription runs once, a redelivered event not counting twice, and the external payment's duplicate, unknown-order and malformed cases. The examples template's `tests/server/message-broker.test.ts` repeats the committed-order path in the started application.

## Verification

```bash
pnpm --filter @nocobase/app-plugin-message-broker-example lint
pnpm --filter @nocobase/app-plugin-message-broker-example typecheck
pnpm --filter @nocobase/app-plugin-message-broker-example test
pnpm --filter @nocobase/app-plugin-message-broker-example build
```
