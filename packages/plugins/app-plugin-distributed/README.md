# @nocobase/app-plugin-distributed

Shows whether an application can run on several instances, and provides the Agent Skills to configure it: shared infrastructure, Redis caching, concurrency, Jobs, Queue, Realtime, rollout and verification.

The plugin contributes one read-only settings page, **System settings › System › Cluster and distributed**, and the endpoint behind it, `GET /api/distributed/status`. It owns no tables, migrations or configuration section, writes nothing, and does not include or license the commercial Redis implementations. Registering it does not make an application distributed; it reports what the instance it runs on actually uses.

## Register the plugin

```ts
// server/plugins.ts, after Authentication, Authorization, File and, when installed, Concurrency
distributed;

// client/plugins.ts
distributed();
```

Both application templates register it. `@nocobase/app-plugin-concurrency` is an optional peer: without it the page shows the concurrency service as not running and reports the others. To replace the whole page, pass `distributed({ statusComponentLoader: () => import('./pages/cluster.js') })`; the replacement reads the same endpoint.

## Access

The page and the endpoint share one grant, `page:distributed.status/access`: the settings route declares it, so the roles editor lists the page and a role without it neither sees the entry nor reads the endpoint, which answers `403` with reason `DISTRIBUTED_STATUS_FORBIDDEN` and domain `distributed`. The seeded System Administrator permission set grants `page:*/access`.

## What the endpoint returns

`GET /api/distributed/status` answers `{ data }` with:

- `services`: for caching, concurrency, jobs, queue and realtime, the default backend's name and adapter, whether it is `shared` between instances, `local` to this instance or `unknown`, whether its adapter is registered, every configured backend by name and adapter, the backends business code selects by name, and whether the selection is `configured` or the code `default`.
- `idGeneration`: `auto` when a plugin provides `idGeneratorImplementationToken` and assigns each instance its worker ID, otherwise `manual` with `snowflake.workerId`.
- `checks`: each with a level (`required`, `recommended` or `ok`), English text, interpolation `params` and, where it applies, how to fix it with a configuration fragment. Built-in checks cover the database dialect, file collections stored on a local disk on every configured connection (a collection of another connection is named `<connection>.<collection>`, and a connection that cannot be read is reported as unchecked), the shared services and the backends callers select by name, ID generation, `secrets.keys` and `app.publicOrigin`, of which only the scheme, host and port are shown.
- `mode`: `multi` when a service's default backend or a backend a caller selects by name is shared, or worker IDs are automatic; `single` otherwise. In `single` mode scaling items are only recommended, and the page says running one instance needs no change unless a check is still `required`, such as an adapter no registered plugin provides.
- `extensions`: data other plugins add.

A service reports its sharing from what its adapter declares when it registers (`sharing: 'local' | 'shared'`); an adapter that declares nothing is `unknown`. The response is assembled field by field from the services' `describe()` and parsed through a closed schema, so connection addresses, user names, passwords and tokens never reach it. The page reflects only the instance that answers, offers no connection test (Redis plugins connect at startup and the application does not start without them), and lists running instances only through a plugin that assigns worker IDs automatically.

The running application's API document lists the endpoint under the `Distributed` tag.

## Extend the page

On the server, resolve `distributedStatusToken` from `@nocobase/app-plugin-distributed/server` in a provider's `boot()` after checking `container.has()`:

```ts
const status = container.resolve(distributedStatusToken);
status.addCheck({
  id: 'acme.workers',
  run: ({ mode }) => [
    { id: 'acme.workers', level: 'ok', title: 'Workers', detail: '2 running' },
  ],
});
status.addData('acme', {
  fields: { workers: 'number', nodes: [{ name: 'string' }] },
  read: () => workerPool.stats(),
});
```

A check that throws shows as one recommended `checkFailed` entry instead of failing the page. Extension data declares its public `fields`: `'string'`, `'number'` or `'boolean'` for a value, an object of declarations for a nested object, and a one-element array for a list. The server copies only declared values of the declared type, at every depth; there is no open record or unknown value, so `read()` may return a runtime object without leaking its connection settings. The `params` of a check another plugin registers are dropped, since only built-in checks interpolate them; its `title`, `detail` and `fix` are sent as written, so keep them free of addresses and credentials.

On the client, resolve `distributedStatusSlotsToken` from `@nocobase/app-plugin-distributed/client` and register a block in one of the slots `overview`, `services`, `idGeneration` or `checklist`:

```ts
container.resolve(distributedStatusSlotsToken).register({
  slot: 'idGeneration',
  id: '@acme/app-plugin-workers:instances',
  load: () => import('./instances-block.js'),
});
```

The block receives `{ status }`, including `status.extensions`, and loads only when the page renders.

## Ask the Agent

> Prepare this application to run on two instances behind one public URL. Inspect its existing configuration, identify which shared backends it needs, configure the authorized Redis plugins, and verify cross-instance behavior before scaling out.

The Agent starts with [the distributed application Skill](skills/nocobase-app-plugin-distributed/SKILL.md). App configuration and deployment files remain owned by the application; synchronized `.agents/skills/` files are generated output.
