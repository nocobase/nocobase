# Messages: business events, transactional publishing and idempotent consumers

`@nocobase/message-broker` publishes and consumes messages inside an application and between applications or systems: business events ("an order was placed"), asynchronous commands, messages published in the same database transaction as the business change (a transactional outbox), handlers whose database writes commit together with their deduplication record (an inbox), classic message-queue usage where the backend supports it, and integration with external systems. Whether another system is involved does not decide the choice; what the work needs from delivery does.

Read this before publishing an event from a business change, consuming one idempotently, or connecting a message middleware. The `@nocobase/message-broker` README is the full contract, the `@nocobase/app-plugin-message-broker` README covers the outbox and inbox tables, and `packages/examples/app-plugin-message-broker-example` in the NocoBase source repository is a runnable plugin with tests.

## Choose between jobs, queue and message-broker

The three overlap: each runs code outside the request, retries, and can fan out. Choose by the semantics the work needs.

| Need                                                                | `@nocobase/jobs` (`JobExecutor`)                      | `@nocobase/queue`                                                                                          | `@nocobase/message-broker`                                                                                   |
| ------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| What it centers on                                                  | Executing a piece of background work                  | Queuing this application's work with execution control                                                     | Delivering messages to independent subscribers, consistently with the business transaction                   |
| Submit only if the business transaction commits                     | No; submit after the commit and accept the gap        | No; publish after the commit and accept the gap                                                            | `publish(message, { transaction })` writes the outbox in that transaction                                    |
| Several consumers of one message                                    | No                                                    | Every handler of a queue runs; the job completes only when all succeed, and a retry runs all of them again | Each subscription acknowledges, retries and dead-letters on its own; a failing one does not rerun the others |
| Deduplication                                                       | None: each `addJob` is a task; use `jobId` in effects | A job ID that still exists adds nothing; once the job is removed from history it can be added again        | Inbox: `(subscription, messageId)` recorded in the handler's transaction, for the inbox retention (7 days)   |
| Delay, priority, rate limit, cancelling a running job, atomic batch | No                                                    | Yes                                                                                                        | Only a delayed retry, where the backend declares `delayedRetry`                                              |
| Physical resource names                                             | Derived                                               | Derived; JSON messages in a private envelope                                                               | Configured per logical name; Buffer bodies with content type, headers, key, correlation ID                   |
| Other systems produce or consume                                    | No                                                    | No                                                                                                         | Yes, through the middleware's own resources                                                                  |

- Background work this application runs for itself, with no business event behind it: a job. Delays, priorities, rate limits or cancellation: a queue.
- "Publish an event when this record changes, and only if the change commits": message-broker with a transactional publish, even when every consumer lives in the same application.
- "Process each message once in its effect on our tables": message-broker with `inbox: true`, writing through the inbox's transaction. A queue job ID deduplicates submissions while the job exists; it does not make a handler's database writes happen once.
- "Several parts of the application react to the same event, each at its own pace": several message-broker subscriptions to one topic. Several handlers on one queue share one job's success or failure instead.
- Classic queue behaviour (competing consumers, per-message acknowledgement, dead letters, per-key order) holds only as far as the configured backend declares it; see [capabilities](#dev-and-production-backends).

### Combining message-broker with jobs or a queue

A handler may hand long work to a job or a queue, but the inbox transaction and the enqueue are not atomic. Enqueue inside the handler and the message can be retried after the job was already submitted, so submit with a stable ID derived from the message (a queue `jobIdProducer` returning it, or a check in the job's effect). Enqueue after the inbox commits and a crash in between loses the hand-over. A reliable pattern records the work in a business table inside the inbox transaction and lets a job or schedule pick pending rows; do not describe the combination as exactly once.

## Prerequisites in the application

Both application templates have everything below. Check that it is still there before relying on it:

1. `server/app.ts` registers `MessageBrokerServiceProvider` from `@nocobase/app-server/message-broker`. It creates the service under `messageBrokerServiceToken` and sets it up in `start()`, after every plugin provider has booted.
2. `server/plugins.ts` registers `@nocobase/app-plugin-message-broker/server`, which adds the outbox and inbox tables through its migration and runs the outbox relay. Without it, `publish(…, { transaction })` and `inbox: true` fail with an error that names `@nocobase/app-plugin-message-broker`. Run `pnpm nocobase db apply` after adding it.
3. `server/config/message-broker.ts`, assembled in `server/config/index.ts`, defines the `messageBroker` section: `{ default, backends }`. The templates configure the in-process `inMemory` backend.
4. A production backend is a separate package whose provider calls `registerImplementation(adapter, implementation)` in `register()`; registration does no I/O. RabbitMQ is delivered separately as a commercial backend. Kafka, RocketMQ and ActiveMQ have mapping notes in the `@nocobase/message-broker` README, not implemented drivers. Follow [commercial package access](plugins.md#commercial-package-access) for a commercial backend.

A plugin declares `@nocobase/message-broker` and `@nocobase/app-server` as peers, and `@nocobase/app-plugin-message-broker` too when it relies on the outbox or inbox.

## Publish and subscribe by logical name

Code names only logical publishers and subscriptions; configuration maps them to physical resources.

```ts
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';

const broker = app.container.resolve(messageBrokerServiceToken);
broker.publisher<OrderPlaced>('orderEvents');
broker.subscription<OrderPlaced>('orderShipments', { schema, inbox: true });
```

```ts
// server/config/message-broker.ts, inside defineAppConfig({ defaults: () => (…) })
{
  default: 'memory',
  backends: {
    memory: {
      adapter: 'inMemory',
      subscriptions: {
        // Two independent subscriptions to the topic `orderEvents` publishes to.
        orderShipments: { topic: 'orderEvents' },
        customerOrderStats: { topic: 'orderEvents', maxAttempts: 5 },
      },
    },
  },
}
```

A name binds to the backend that declares it under `publishers` or `subscriptions`, otherwise to `default`. `inMemory` accepts undeclared names, with the topic equal to the name; production backends require every name to be declared. Every subscription binding accepts `maxAttempts` (default 3), `retryDelay` in milliseconds (default 0), `concurrency` (default 1) and `ordered` (default `false`).

Register handlers in a provider's `boot()`, keep the unregister functions, and await them in `shutdown()`:

```ts
public override boot(): Promise<void> {
  const broker = this.app.container.resolve(messageBrokerServiceToken);
  this.unregister = broker
    .subscription<OrderPlaced>('orderShipments', { schema: orderPlacedSchema, inbox: true })
    .consume((message, context) =>
      shipments.create(message.body, context.transaction as DatabaseConnection),
    );
  return Promise.resolve();
}
```

A handler that returns acknowledges; one that throws is retried until `maxAttempts`, then dead-lettered. Return `retry({ delay })` or `reject(reason)` from `@nocobase/message-broker` to decide explicitly; `reject` dead-letters at once. A body that fails `schema` (any Standard Schema such as zod) or that the codec cannot decode is dead-lettered without running the handler. `context.attempt` counts deliveries from 1; `context.signal` aborts at shutdown.

## Publish inside the business transaction

```ts
await database.transaction(async (transaction) => {
  await transaction.repository('orders').createOne({ values: order });
  await broker.publisher<OrderPlaced>('orderEvents').publish(
    {
      body: { orderId: order.id, customer: order.customer, total: order.total },
      messageId: `order-placed:${order.id}`,
      key: order.id,
      type: 'order.placed',
    },
    { transaction },
  );
});
```

The message is written to the outbox in that transaction, so a rollback leaves neither the order nor the message, and a committed message survives a crash: the relay sends it after the commit and retries with backoff without a limit. `publish` then resolves with `{ deferred: true }`. Publish on the default database connection's transaction; the outbox refuses a connection that is not inside a transaction. A stored body is limited to 64 KB; publish a reference to larger data.

`publish(message)` without a transaction sends at once and resolves after the backend confirmed it. Use it only when there is no business change to stay consistent with: a message sent before or after a separate commit can be lost or describe a change that rolled back.

The outbox is reliable local storage plus at-least-once sending, not an atomic commit across the database and the middleware. The relay marks a row sent after the middleware confirmed it; a crash in between sends it again.

## Consume with the inbox

With `inbox: true`, the service runs the handler inside a transaction that also inserts `(subscription, messageId)`. A message already recorded is acknowledged without running the handler.

- Write every business change through `context.transaction`. Writes through another connection or `database.repository()` are not covered by the inbox, are not rolled back with it, and on SQLite wait for the inbox transaction's lock.
- A throw, `retry()` or `reject()` rolls the transaction back, including the inbox record, so the retried message runs again from a clean state.
- The inbox protects only database writes committed in that transaction, and only within `inboxRetention` (7 days by default). An HTTP call, an email or a write to another system made by the handler can repeat; give those their own idempotency key, for example the `messageId`.
- Without the inbox, make the effect idempotent yourself: a unique key, an upsert, or a state check.

## Event IDs, versions and order

- `messageId` identifies one business event. Derive it from the event (`order-placed:<orderId>`, `order-status:<orderId>:<version>`), never a random value, so every redelivery carries the same ID. Two different events must not share an ID: a later version of the same record gets its own, or the inbox drops it as a repeat.
- For state snapshots ("the order's current status"), carry a version and let the consumer ignore a version older than what it stored.
- For incremental events that must apply in sequence, design the order explicitly (a sequence number per key, held back until the gap fills). `ordered: true` keeps per-`key` order only on backends that declare `orderedByKey`, and the outbox keeps a failed message's later messages with the same key from overtaking it within one relay round but not across rounds. Neither provides strict order across outbox retries.

## Dev and production backends

| Capability      | Needed by                                | When it is checked                                |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| `perMessageAck` | `concurrency` above 1                    | setup                                             |
| `delayedRetry`  | `retryDelay` above 0, `retry({ delay })` | setup; at the call, dead-lettered with the reason |
| `orderedByKey`  | `ordered: true`                          | setup                                             |
| `deadLetter`    | every subscription                       | setup                                             |

The service refuses what the backend does not declare instead of quietly doing less. `broker.describe()` lists the backends, each one's `sharing` (`local` or `shared`) and capabilities, the logical names in use and whether an outbox and an inbox are registered.

`inMemory` declares every capability but runs within one process: it keeps nothing across a restart and shares nothing between instances. A message it has acknowledged to the outbox is gone if the process exits before delivery; the outbox does not make an in-memory backend reliable. Use it for development and tests only; production delivery depends on the configured backend and its deployment.

## Several instances

The relay runs on every instance and sends under the concurrency lock `message-broker:outbox`, so one instance at a time sends a given row. That holds across instances only when the concurrency service uses a shared backend such as Redis; with the default process-local lock, instances relay independently and consumers see duplicates, which stable message IDs and the inbox absorb. An idle instance costs one indexed query per poll (every 5 seconds) and takes the lock only when rows are due; cleanup of sent outbox rows and expired inbox rows takes the lock separately, at most once an hour.

## Topology

The application never creates middleware resources. Operators create exchanges, queues, topics and consumer groups first. At startup each backend checks that the resources its bindings name exist; startup fails with one error listing each missing resource and the logical name that uses it. A name first used after startup is checked on first use, and a failed check runs again on the next call.

## Troubleshooting

| Symptom                                                                                                           | Check                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `publish(…, { transaction })` or an `inbox: true` subscription fails naming `@nocobase/app-plugin-message-broker` | `@nocobase/app-plugin-message-broker` is registered in `server/plugins.ts` and its migration has run                                                |
| Startup fails with "does not support …"                                                                           | The subscription's options need a capability its backend does not declare; change the binding or the backend                                        |
| Startup fails with "is missing …"                                                                                 | Create the named middleware resource, or fix the physical name in the backend entry                                                                 |
| A committed message never arrives                                                                                 | `messageBrokerOutbox` rows with `sentAt` null: `attempts` and `lastError` say why the relay cannot send; `nextAttemptAt` says when it tries again   |
| A message stops being retried                                                                                     | It reached `maxAttempts` or was rejected: read the backend's dead letter for the reason (`inMemory.deadLetters(subscription)` in tests)             |
| The handler's writes happen twice                                                                                 | The subscription lacks `inbox: true`, the writes bypass `context.transaction`, the same event got a new `messageId`, or the inbox retention expired |
| Duplicates across instances                                                                                       | The concurrency service is process-local; configure a shared backend                                                                                |

## Verify

- Test with a real database (`createDatabaseTest` from `@nocobase/app-testing/server`, listing the migrations of `@nocobase/app-plugin-message-broker` and of the plugin) and an `inMemory` backend created for the test, composing the outbox plugin's `MessageBrokerOutboxProvider` with the plugin's provider. The example plugin's `tests/message-broker-example.test.ts` is a complete harness.
- Cover: a rolled-back business transaction leaves no business row and delivers nothing; a handler that writes and then fails leaves no partial write and succeeds on retry; a repeated `messageId` does not repeat the business effect; each independent subscription reaches its effect once; a malformed or unprocessable message is dead-lettered with its reason.
- Wait for effects with `vi.waitFor` on the database, not on fixed sleeps. To show that a message did not arrive, publish a later one through the same path and wait for it.
- In an application integration test, start the application and check `broker.describe()` shows the backend, its capabilities and `outbox: true`, `inbox: true`.
- Run the plugin's `lint`, `typecheck`, `test` and `build`, and the application's tests.
