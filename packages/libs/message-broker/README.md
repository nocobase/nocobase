# @nocobase/message-broker

Middleware-neutral message integration with external systems: plugins publish and consume messages through logical names, and the application's configuration decides which middleware carries them and under which physical names. The package holds the service, the message model, codecs, the backend contract, the in-process `inMemory` backend and the backend contract tests. Production backends, such as RabbitMQ, are separate packages that register an implementation.

## When to use it

| Use                        | For                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@nocobase/jobs`           | Work this application runs for itself, possibly scheduled or repeated                                                                  |
| `@nocobase/queue`          | Work this application hands to its own processes; physical queue names are derived, messages are JSON with a private envelope          |
| `@nocobase/message-broker` | Messages another system produces or consumes; physical names are configured to match what the other side expects, and bodies are bytes |

A queue's channel is a filter inside one queue, and its names are private to the application. A broker's publisher and subscription are logical names bound to resources an operator created in the middleware, which other systems also read and write.

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

A message carries `body`, `contentType`, `headers` (string values), `messageId`, `key` (the partition or ordering key), `correlationId`, `replyTo`, `type` and `timestamp`. `messageId` defaults to a random UUID and `timestamp` to now. Bodies go through a codec: `jsonCodec` by default, `rawCodec` for a `Buffer` passed as is, or any object with `contentType`, `encode()` and `decode()`, given as `{ codec }` to `publisher()` or `subscription()`. A subscription's `schema` takes any [Standard Schema](https://standardschema.dev) such as zod; a body that fails it, like one the codec cannot decode, goes to the dead letter without running the handler.

A handler that returns acknowledges the message, and one that throws retries it. It may return `ack()`, `retry({ delay })` or `reject(reason)` to decide explicitly; `reject` dead-letters at once. A message that has been delivered `maxAttempts` times goes to the dead letter instead of another retry. `context.attempt` counts deliveries from 1 and `context.signal` aborts when the service shuts down.

`publish()` without a transaction resolves once the backend has confirmed the message, within 10 seconds; it needs the service to be set up. With `{ transaction }` it resolves once the message is written to the outbox in that transaction, which needs `@nocobase/app-plugin-message-broker` (below), and it may run before setup.

## Delivery semantics

Delivery is at least once, in both directions. An outbox row is marked sent only after the middleware confirmed it, so a crash between the two sends it again; middleware redelivers a message whose acknowledgement was lost. Give every message a stable `messageId` derived from the business event, not a random one, and make every handler idempotent: either check the effect yourself, or subscribe with `inbox: true`, which records `(subscription, messageId)` in the same transaction as the handler's writes (`context.transaction`) and skips a message already recorded. The inbox remembers a message for `inboxRetention`, 7 days by default.

Order is kept only per `key`, only on backends that declare `orderedByKey`, and only for subscriptions configured with `ordered: true`. The outbox keeps a failed message's later messages with the same key from overtaking it within one relay round, but not across rounds; when the receiver needs strict order, carry a version in the message and let the receiver drop stale ones.

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

Every subscription binding accepts `maxAttempts` (default 3), `retryDelay` in milliseconds (default 0), `concurrency` (default 1) and `ordered` (default `false`) besides the backend's physical names. Switching middleware means changing this section only.

The templates configure `inMemory`, which delivers within the process and loses everything when it exits; use it for development and tests. It accepts `topics` (a list; when given, every binding's topic must be in it), `publishers: { <name>: { topic } }` and `subscriptions: { <name>: { topic, …common options } }`. A binding's topic defaults to its logical name, and every subscription of a topic receives every message published to it.

## Capabilities

Each backend declares what it can do, and the service refuses a configuration or call that needs something it cannot, at setup or at the call, instead of quietly doing less:

| Capability      | Needed by                                               | Checked                              |
| --------------- | ------------------------------------------------------- | ------------------------------------ |
| `perMessageAck` | `concurrency` above 1                                   | setup                                |
| `delayedRetry`  | `retryDelay` above 0                                    | setup                                |
| `delayedRetry`  | `retry({ delay })` from a handler                       | the call; logged and retried at once |
| `orderedByKey`  | `ordered: true`                                         | setup                                |
| `deadLetter`    | every subscription (`maxAttempts`, `reject()`, schemas) | setup                                |

`inbox: true` needs a registered inbox and a transactional publish a registered outbox; both are checked too. A name first used after setup is bound and checked on first use.

## Topology

The application never creates middleware resources: operators create exchanges, queues, topics and consumer groups, and other systems depend on their exact names and settings. At setup every backend checks that the resources its bindings name exist, and startup fails with one error listing each missing resource and the logical name that uses it, for example `Message broker backend "rabbit" is missing exchange "shop.orders" (publisher "orderEvents")`.

## Transactional outbox and inbox

`@nocobase/app-plugin-message-broker` registers the outbox and the inbox, on the application's default database connection, and runs the relay; both templates register it. A transactional publish adds one INSERT to the business transaction. After the commit, the relay of the same instance sends the message at once; a fallback poll every `pollInterval` (5 seconds) sends what a crashed or busy instance left behind. Each round reads up to 100 due rows through an index, publishes them, marks the confirmed ones sent with one UPDATE, and schedules the others again with a backoff of 2 s doubling up to 5 minutes, with no limit on attempts: the business change has been committed, so the message is never dropped. A round runs under the concurrency lock `message-broker:outbox`, so across instances each row is sent by one of them at a time; that needs a shared concurrency backend, such as Redis, when several instances run. An idle instance costs one lock attempt per poll, and the instance holding it one indexed query that returns nothing.

Sent rows are deleted after `outboxRetention` (1 day) and inbox rows after `inboxRetention` (7 days), at most once an hour. All three are set in the plugin's `messageBrokerOutbox` configuration section, in milliseconds. A body stored in the outbox is limited to 64 KB, MySQL's BLOB size, on every database; publish a reference to larger data. A failing row keeps its last error in `lastError` and its count in `attempts`.

## Describing the service

`describe()` returns the default backend, each backend's adapter, whether its implementation is registered, its `sharing` (`local` for state in this process, `shared` for middleware every instance reaches) and its capabilities, the logical names in use with their backends and whether each subscription is consuming, and whether an outbox and an inbox are registered. Status pages read it, for instance to warn when a shared backend runs with process-local concurrency.

## Implementing a backend

A backend plugin calls `registerImplementation(adapter, implementation)` in its provider's `register()`; registration performs no I/O and closes once the service is set up. A `BrokerImplementation` declares `sharing` and `capabilities`, may set `implicitBindings` to accept undeclared names, validates its backend entry synchronously in `validateConfig()`, and creates a `BrokerRuntime` per backend. The runtime opens its connection in `open()`, reports missing resources from `checkTopology()`, resolves `publish()` only once the middleware confirmed the message, and delivers messages to the callback `startConsuming()` receives: the callback answers `ack`, `retry` with a delay, or `deadLetter` with a reason, and the runtime settles the message accordingly. `close()` stops consuming and releases the connection.

`tests/contract/broker-contract.ts` holds the contract every backend passes, grouped as `core` plus one group per capability that runs only when the target declares it. A backend suite imports it from this package's source and calls `defineMessageBrokerContract(target)` with how to build a backend entry for a set of names, an entry whose topology is missing, and how to read a subscription's dead letters; `tests/unit/memory-contract.test.ts` is the `inMemory` target.

## Mapping other middleware

Physical concepts appear only in backend entries, so each middleware is a backend implementation:

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
