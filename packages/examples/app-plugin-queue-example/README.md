# @nocobase/app-plugin-queue-example

Queue app plugin example. It publishes to and consumes the `queue-example` queue through the application's `QueueService`, which it resolves from `queueServiceToken` in `@nocobase/app-server/queue`.

`server/providers/queue-example.ts` shows the lifecycle a plugin follows:

- `boot()` reads the configuration key from the plugin's own `queueExample.queue` setting and passes it to `manager()` and `consumer()`; without one, the queue follows `queue.default`. It calls `manager().configure()` to set this instance's concurrency, attempts and backoff, and registers two handlers with `consume()`, each filtered with `withChannel()`: one takes `greeting`, the other takes both `greeting` and `digest`, so a greeting runs through both.
- The application's queue provider sets the service up after every provider has booted, so publishing starts once the application runs.
- `shutdown()` awaits every unregister function before the handlers' dependencies go away.

`server/service.ts` publishes: `publish()` for one greeting, and `publishMany()` for two digests whose `jobIdProducer` derives the job ID from the day, so publishing the same day again adds nothing while the earlier job is still waiting or kept in the history.

Every route requires authentication and is scoped to `/queue-example`, so it does not depend on contribution order and does not affect Routes mounted later:

| Route                               | Does                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `GET /api/queue-example?delay=<ms>` | Publishes one greeting, delayed when asked, and answers `202` with its `jobId` |
| `POST /api/queue-example/digests`   | Publishes this morning's and this evening's digest in one batch                |
| `GET /api/queue-example/deliveries` | Lists what the handlers received since the application started, newest first   |

The examples template sets `queueExample.queue` from `QUEUE_EXAMPLE_QUEUE`, so `QUEUE_EXAMPLE_QUEUE=redis` runs the example on the template's `redis` key while every other queue keeps following `queue.default`.
