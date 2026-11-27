# @nocobase/message-broker

Middleware-neutral publishing and consuming of messages, inside an application and between applications and systems: business events, asynchronous commands, messages published in the same transaction as the business change (transactional outbox), consumers whose database writes commit with their deduplication record (inbox), message-queue usage as far as the backend supports it, and integration with external systems. Plugins publish and consume through logical names, and the application's configuration decides which middleware carries them and under which physical names. The package holds the service, the message model, codecs, the backend contract, the in-process `inMemory` backend and the backend contract tests. Production backends, such as RabbitMQ, are separate packages that register an implementation; the outbox and inbox are in `@nocobase/app-plugin-message-broker`.

## When to use it

`@nocobase/jobs`, `@nocobase/queue` and this package overlap: each runs code outside the request and retries. They differ in who consumes what: one `JobExecutor.addJob()` runs one Job class; a queue job is consumed by every handler registered on that queue, on the instance that claimed it, and completes only when all of them succeed, so one failure retries the whole set; each message-broker subscription receives every message and settles it independently. They differ in what they center on and what they guarantee; whether another system is involved is not the deciding factor.

| Need                                           | `@nocobase/jobs`                      | `@nocobase/queue`                                                                                             | `@nocobase/message-broker`                                                                       |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Centers on                                     | Executing background work             | Queuing this application's work with execution control                                                        | Delivering messages to independent subscriptions, consistently with the business transaction     |
| Leave only if the business transaction commits | No                                    | No                                                                                                            | `publish(message, { transaction })` writes the outbox in that transaction                        |
| Several consumers of one message               | No; one submission runs one Job class | Every handler of a queue runs each job; the job completes only when all succeed, and a retry runs all of them | Each subscription settles each message independently                                             |
| Deduplication                                  | None; each submission is a task       | A job ID that still exists adds nothing; once removed from history it can be added again                      | The inbox records `(subscription, messageId)` in the handler's transaction, for `inboxRetention` |
| Delay, priority, rate limit, cancellation      | No                                    | Yes                                                                                                           | A delayed retry, where the backend declares `delayedRetry`                                       |
| Physical names and format                      | Derived                               | Derived; JSON in a private envelope                                                                           | Configured per logical name to match the middleware; Buffer bodies with headers                  |

Choose this package for an event that must follow a business commit, a consumer whose database effect must happen once per message, several subscriptions that each consume every message, or messages other systems produce or consume. Choose a job for background work, and a queue for delays, priorities, rate limits or cancellation. Combining them needs care: a queue or job submission and the inbox transaction are not atomic, so a handler that enqueues may enqueue again on a retry, and one that enqueues after the commit may lose the hand-over in a crash. A queue accepts a stable job ID derived from the message through `jobIdProducer`, within its job ID rules (not an integer, and no `:` unless it has exactly three parts), and drops a repeat while that job exists; `addJob()` takes no ID, so a job deduplicates at its business effect, for example a unique key on what it writes. The application development Skill's `references/messaging.md` walks through the choice, the configuration and the tests.

## Using it in a plugin

Resolve the service from `messageBrokerServiceToken` in `@nocobase/app-server/message-broker`. Register handlers in a provider's `boot()`: the application's `MessageBrokerServiceProvider` sets the service up in its `start()`, after every provider has booted, and checks each subscription's options against its backend's capabilities then.

```ts
import { messageBrokerServiceToken } from '@nocobase/app-server/message-broker';
import { reject, retry } from '@nocobase/message-broker';

// boot()
broker
  .subscription<ErpOrder>('erpOrders', { schema: ErpOrder, inbox: true })
  .consume(async (message, { attempt, transaction }) => {
    if (message.type !== 'order.updated') return reject('unknown type');
    if (!(await erpIsReady())) return retry({ delay: 30_000 });
    await saveOrder(message.body, transaction);
  });

// Inside a business change: sent after the transaction commits, never when it rolls back.
await database.transaction(async (transaction) => {
  const order = await orders.createOne({ values }, { transaction });
  await broker.publisher<OrderPlaced>('orderEvents').publish(
    {
      body: order,
      messageId: `order-placed:${order.id}`,
      key: String(order.id),
      type: 'order.placed',
    },
    { transaction },
  );
});
```

A message carries `body`, `contentType`, `headers` (string values), `messageId`, `key` (the partition or ordering key), `correlationId`, `replyTo`, `type` and `timestamp`. `messageId` defaults to a random UUID and `timestamp` to now. Bodies go through a codec: `jsonCodec` by default, `rawCodec` for a `Buffer` passed as is, or any object with `contentType`, `encode()` and `decode()`, given as `{ codec }` to `publisher()` or `subscription()`. A subscription's `schema` takes any [Standard Schema](https://standardschema.dev) such as zod. Schema and decoding failures go directly to the backend's final failure handling and skip the handler.

A handler that returns normally acknowledges the message. A throw requests a retry. The handler may also return `ack()`, `retry({ delay })` or `reject(reason)`. An explicit rejection or a failure on the last allowed attempt goes to the backend's final failure handling. `context.attempt` starts at 1 and `context.signal` aborts when the service shuts down.

`publish()` without a transaction resolves once the backend has confirmed the message, within 10 seconds; it needs the service to be set up. With `{ transaction }` it resolves once the message is written to the outbox in that transaction, which needs `@nocobase/app-plugin-message-broker` (below), and it may run before setup.

## Delivery semantics

Delivery is at least once, in both directions. The outbox keeps a committed message until it is sent; it is not an atomic commit across the database and the middleware. An outbox row is marked sent only after the middleware confirmed it, so a crash between the two sends it again; middleware redelivers a message whose acknowledgement was lost. Give every message a stable `messageId` that identifies the business event and is the same on every redelivery: derived from the event, or a UUID generated once for the event, stored with it and reused (the outbox stores the default UUID with the row, so its resends keep it; a direct `publish()` repeated without a `messageId` gets a new one), and make every handler idempotent: either check the effect yourself, or subscribe with `inbox: true`, which records `(subscription, messageId)` in the same transaction as the handler's writes (`context.transaction`) and skips a message already recorded. The inbox remembers a message for `inboxRetention`, 7 days by default. It protects only database writes made through `context.transaction` within that window: a throw, `retry()` or `reject()` rolls them back together with the inbox record, and HTTP calls, emails or other external effects need their own idempotency. `messageId` identifies one business event: a later version of the same record is a new event with its own ID.

Order is kept only per `key`, only on backends that declare `orderedByKey`, and only for subscriptions configured with `ordered: true`. The outbox keeps a failed message's later messages with the same key from overtaking it within one relay round, but not across rounds; for state snapshots, carry a version and let the receiver drop stale ones; incremental events that must apply in sequence need an ordering scheme of their own, such as a per-key sequence number.

## Configuration

The `messageBroker` section names backends and maps logical names to physical resources. A logical name binds to the backend that declares it under `publishers` or `subscriptions`, otherwise to `default`; a backend accepts undeclared names only when its implementation allows it, which `inMemory` does and production backends do not. Declaring a name on two backends is an error.

```ts
messageBroker: {
  default: 'rabbit',
  backends: {
    rabbit: {
      adapter: 'rabbitmq', // registered by the backend's plugin
      // adapter options and physical names are defined by the backend
      publishers: { orderEvents: { exchange: 'shop.orders', routingKey: 'order.placed' } },
      subscriptions: {
        erpOrders: { queue: 'erp.orders', maxAttempts: 5, retryDelay: 10_000, concurrency: 4 },
      },
    },
  },
}
```

Every subscription binding accepts `maxAttempts`, `retryDelay` in milliseconds (default 0), `concurrency` (default 1) and `ordered` (default `false`) besides the backend's physical names. `maxAttempts` includes the first attempt. When omitted, it uses the adapter's default for the subscription or 3 if the adapter supplies none. Switching middleware means changing this section only.

The templates configure `inMemory`, which delivers within the process, shares nothing between instances and loses everything when it exits, including messages the outbox already handed to it; use it for development and tests. Production delivery guarantees depend on the backend and how it is deployed. It accepts `topics` (a list; when given, every binding's topic must be in it), `publishers: { <name>: { topic } }` and `subscriptions: { <name>: { topic, …common options } }`. A binding's topic defaults to its logical name, and every subscription of a topic receives every message published to it.

## Capabilities

Each backend declares what it can do, and the service refuses a configuration or call that needs something it cannot, at setup or at the call, instead of quietly doing less:

| Capability      | Needed by                         | Checked                                    |
| --------------- | --------------------------------- | ------------------------------------------ |
| `perMessageAck` | `concurrency` above 1             | setup                                      |
| `delayedRetry`  | `retryDelay` above 0              | setup                                      |
| `delayedRetry`  | `retry({ delay })` from a handler | at the call (final failure if unsupported) |
| `orderedByKey`  | `ordered: true`                   | setup                                      |
| `deadLetter`    | final failure handling            | setup                                      |

`deadLetter` means the backend can send failed messages to a dead-letter destination. An adapter may allow a subscription to omit that destination and documents how it settles final failures in that case.

`inbox: true` needs a registered inbox and a transactional publish a registered outbox; both are checked too. A name first used after setup is bound and checked on first use, by a transactional publish as well as a direct one, so that a message the middleware cannot route fails the caller instead of waiting in the outbox; a failed check runs again on the next call, so a resource an operator creates later takes effect without a restart.

## Topology

The application never creates middleware resources: operators create exchanges, queues, topics and consumer groups, and other systems depend on their exact names and settings. At setup every backend checks that the resources its bindings name exist, and startup fails with one error listing each missing resource and the logical name that uses it, for example `Message broker backend "rabbit" is missing exchange "shop.orders" (publisher "orderEvents")`.

## Transactional outbox and inbox

`@nocobase/app-plugin-message-broker` registers the outbox and the inbox, on the application's default database connection, and runs the relay; both templates register it. A transactional publish adds one INSERT to the business transaction. After the commit, the relay of the same instance sends the message at once; a fallback poll every `pollInterval` (5 seconds) sends what a crashed or busy instance left behind. Each round reads up to 100 due rows through an index, publishes them, marks the confirmed ones sent with one UPDATE, and schedules the others again with a backoff of 2 s doubling up to 5 minutes, with no limit on attempts: the business change has been committed, so the message is never dropped. Each poll first runs one indexed query for a due row, without a lock; only when one is due does the instance take the concurrency lock `message-broker:outbox` and read the batch again under it, so across instances each row is sent by one of them at a time. That needs a shared concurrency backend, such as Redis, when several instances run. An idle instance therefore costs one indexed query per poll and no lock. The cleanup below takes the same lock separately, when its interval has passed.

Sent rows are deleted after `outboxRetention` (1 day) and inbox rows after `inboxRetention` (7 days), at most once an hour per instance, with two DELETE statements under the lock. All three are set in the plugin's `messageBrokerOutbox` configuration section, in milliseconds. A body stored in the outbox is limited to 64 KB, MySQL's BLOB size, on every database; publish a reference to larger data. A failing row keeps its last error in `lastError` and its count in `attempts`.

## Describing the service

`describe()` returns the default backend, each backend's adapter, whether its implementation is registered, its `sharing` (`local` for state in this process, `shared` for middleware every instance reaches) and its capabilities, the logical names in use with their backends and whether each subscription is consuming, and whether an outbox and an inbox are registered. Status pages read it, for instance to warn when a shared backend runs with process-local concurrency.

## Implementing a backend

A backend plugin calls `registerImplementation(adapter, implementation)` in its provider's `register()`; registration performs no I/O and closes once the service is set up. A `BrokerImplementation` declares `sharing` and `capabilities`, may set `implicitBindings` to accept undeclared names, validates its backend entry synchronously in `validateConfig()`, and creates a `BrokerRuntime` per backend. The runtime opens its connection in `open()`, reports missing resources from `checkTopology()`, resolves `publish()` only once the middleware confirmed the message, and delivers messages to the callback `startConsuming()` receives: the callback answers `ack`, `retry` with a delay, or `deadLetter` with a reason, and the runtime settles the message accordingly. `close()` stops consuming and releases the connection.

A missing handler or an error during shutdown can return an immediate `retry` even at the configured attempt limit. An adapter without an application retry route keeps that delivery eligible for broker redelivery at the same attempt.

An adapter may implement `defaultMaxAttempts(options)` to return a positive integer based on the raw subscription options. The service calls it synchronously during binding resolution, before adapter validation, and only when `maxAttempts` is omitted. The resolved binding carries the effective limit in `maxAttempts` and preserves the raw `options`.

`@nocobase/message-broker/contract` holds the contract every backend passes, grouped as `core` plus one group per capability that runs only when the target declares it. It imports `vitest`, an optional peer dependency the backend's test setup provides. A backend suite imports it and calls `defineMessageBrokerContract(target)` with how to build a backend entry for a set of names, an entry whose topology is missing, and how to read a subscription's dead letters; `tests/unit/memory-contract.test.ts` is the `inMemory` target.

## Mapping other middleware

Physical concepts appear only in backend entries, so each middleware is a backend implementation of its own. This package implements only `inMemory`. The RabbitMQ backend is delivered as a separate package; the Kafka, RocketMQ and ActiveMQ notes below describe how a backend would map them, and no driver for them exists yet:

- **RabbitMQ**: a publisher is an exchange with a routing key and a subscription a queue. Per-message acknowledgement, dead-letter exchanges and delayed redelivery (a delay queue or the delayed-message plugin) are native; per-key order holds within a single queue consumed with `concurrency` 1, or with a consistent-hash exchange.
- **Kafka**: a publisher is a topic, with `key` as the partition key (`orderedByKey`); a subscription is a topic and a consumer group. Offsets are committed in order, so `perMessageAck` is not declared and `concurrency` stays 1 unless the implementation serializes per partition. Delayed retries and dead letters use retry and dead-letter topics that the topology check verifies.
- **RocketMQ**: a publisher is a topic and a tag, with `key` as the sharding key of ordered messages; a subscription is a consumer group and a tag expression. Delay levels and the `%RETRY%` and `%DLQ%` queues are native, so all four capabilities hold, with `retryDelay` limited to the broker's delay levels by `validateConfig()`.
- **ActiveMQ Artemis**: a publisher is an address (a JMS topic or queue) and a subscription a queue or durable subscription; `key` maps to `JMSXGroupID` message groups. Individual acknowledgement, scheduled delivery and dead-letter addresses are native.

## Not included

Request-reply (`correlationId` and `replyTo` are carried for building it by hand), strict per-key order across outbox retries, outbox backlog metrics, batch publishing, persistence for `inMemory`, an administration interface and production backends.

## Verification

```bash
pnpm --filter @nocobase/message-broker lint
pnpm --filter @nocobase/message-broker typecheck
pnpm --filter @nocobase/message-broker test
pnpm --filter @nocobase/message-broker build
```
