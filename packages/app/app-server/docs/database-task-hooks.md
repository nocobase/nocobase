# Database task phases and preparation hooks

Database task execution uses one phase order, whether or not preparation hooks are registered:

1. Validate the request and collect executable connections in their first occurrence order in the plan.
2. Prepare storage for every executable target, once per connection.
3. For a fresh run, reset every selected migration target before starting any business migration or Seed.
4. Await the registered `beforeTasks` hooks in registration order.
5. Determine installation state before business tasks change migration or Seed history.
6. Execute the planned migrations and Seeds, retaining explicit skipped tasks.

Storage preparation is not a connection-readiness check. Drivers still open connections lazily. Connections that have no executable task are not prepared by the executor; `DatabaseProvider.boot()` separately prepares other runtime connections so disabling automatic migrations does not make their storage unavailable.

## Fresh runs are destructive across all selected targets

A fresh run now resets all selected migration targets before executing any migration, including when no hooks exist. It does not preserve the previous connection-by-connection reset-and-migrate order. Storage preparation is also completed for all targets before the first reset or business task.

There is no cross-connection transaction or rollback. If connection A's migration fails, connection B may already have been emptied. If resetting B fails, A stays reset and B may have been partially modified. A failed command does not mean that no database was changed. The existing CLI confirmation, `--force` requirement and external-connection safeguards still apply. A fresh run with an empty migration directory is a completed empty rebuild, not a no-op.

## Register a hook

`DatabaseProvider.register()` creates an application-local `DatabaseTaskHooks` registry under `databaseTaskHooksToken`, even when the application has no database. A plugin registers its hook synchronously in its Provider's `register()`, after the database Provider is registered. Registration must not query storage, acquire resources or start a business runtime.

```ts
import { databaseTaskHooksToken } from '@nocobase/app-server/database';

// Inside a Provider's register(), after DatabaseProvider.register():
this.app.container.resolve(databaseTaskHooksToken).register({
  name: 'example.required-resources',
  async beforeTasks({ resetConnections }) {
    // Prepare only resources owned by this plugin. An empty list means no
    // connection was reset; it does not mean preparation can be skipped.
    await prepareRequiredResources(resetConnections);
  },
});
```

`prepareRequiredResources` represents the plugin's own asynchronous preparation function, not an API supplied by the host. Hook names must be nonblank and unique within a registry. Registration captures the name and binds the callback to its original receiver. Separate registry instances do not share registrations.

The executor takes a registration snapshot once before the plan's storage preparation and runs each captured hook once, sequentially. Registering another hook during execution only affects the next plan. Both the context and its `readonly resetConnections: readonly string[]` are frozen. That list contains confirmed completed resets, in reset order; it is empty on ordinary runs. It reports an observed fact and is not a flag that changes execution order.

## Operation coverage

| Operation                           | Calls `beforeTasks`?                   |
| ----------------------------------- | -------------------------------------- |
| Ordinary `run` / `db apply`         | Yes, with at least one executable task |
| Fresh `run` / `db reset`            | Yes, after all target resets           |
| `rollback`                          | Yes, with at least one executable task |
| `sample`                            | Yes, with at least one executable task |
| `dryRun`                            | No                                     |
| `repair` or `unlock`                | No                                     |
| Empty plan or entirely skipped plan | No                                     |

A dry-run does not prepare storage, reset databases or resolve the hook registry. Previewing missing SQLite storage does not create its file, parent directory or history tables. Real repair and unlock retain their own storage preparation and execution behavior without calling hooks. Existing illegal operation combinations remain errors.

An empty task plan is not a plugin-startup mechanism. A plugin that needs initialization even without migrations or Seeds must provide that initialization in its own lifecycle.

## Failure reporting

Hooks are required preparation, not best-effort notifications. A thrown error stops subsequent hooks and all business tasks; there is no implicit retry or fallback. Hooks must not write the host's business migration or Seed history because installation state is read after preparation.

`AppDatabaseTaskError` preserves the original `cause` and task `result`. Preparation failures additionally expose `preparation`, with `phase` equal to `storage`, `reset`, `beforeTasks` or `installation`; `connection` or `hook` identifies the failing target when available. Executable business items remain `not-run` with reason `preparation-failed`, while explicit skipped items stay skipped. They are not reported as a failed migration. Later business failures retain completed task results and leave remaining executable tasks `not-run`.

If the helper owns its manager and manager destruction also fails while a preparation error propagates, that `AppDatabaseTaskError` stays primary and retains the secondary failure in `cleanupError`. Cleanup is still attempted once. Borrowed-manager ownership and other cleanup behavior are unchanged.

The error's read-only `resetConnections` contains only resets that returned successfully. A connection whose reset threw is not included even if the driver already deleted some objects; its state is uncertain and the error message explicitly says so. Completed resets are not undone if storage, hooks, installation detection or business execution later fail.

The CLI keeps `DATABASE_TASK_FAILED`, the existing error envelope and exit code 1. Error details may contain `preparation` and `resetConnections`. An actual business-task lock conflict still reports `DATABASE_LOCKED`; a hook's private lock failure does not. Successful task results and normal success JSON do not gain reset lists or execution-step arrays.

## Resource ownership

The registry does not create or own the services captured by hooks. Each registering Provider owns its resources and closes them through the existing Provider shutdown lifecycle, including after preparation or startup fails. Declare the Provider's real dependencies so reverse shutdown order closes dependent resources before their database. The hook context deliberately does not expose a container, manager, ID generator or cleanup protocol. The registry token is not automatically exposed through the restricted migration service resolver.

For application startup and the CLI, a hook can explicitly capture its dependency from the application's container when its callback runs. `executeAppDatabasePlan(database, ...)` borrows the supplied manager and never destroys it. If an application passes a hook container into `runAppDatabaseTasks()`, it must ensure that the hook and tasks intentionally use the same manager, for example by passing that explicit manager in `options.database`. Otherwise the helper creates and destroys its own manager, while a callback capturing an application manager still uses that separate instance. The helper never destroys borrowed application services.

These hooks do not alter the default synchronous `SnowflakeIdGenerator`, `idGeneratorToken`, driver APIs or the Application's general failure cleanup. Plugins remain responsible for their own domain-specific initialization and lifecycle.
