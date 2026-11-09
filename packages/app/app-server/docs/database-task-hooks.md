# Database task hooks

`databaseTaskHooksToken` from `@nocobase/app-server/database` provides asynchronous preparation before application database tasks. It has no identifier, allocation, mode, shutdown or database-destroy semantics. `DatabaseProvider.register()` binds the service even when no database is configured. Providers register hooks synchronously, after DatabaseProvider, so CLI execution needs registration alone and never depends on boot.

```ts
import { databaseTaskHooksToken } from '@nocobase/app-server/database';

// Inside a Provider's register():
this.app.container.resolve(databaseTaskHooksToken).add({
  name: 'acme/task-preparation',
  beforeTasks: async ({ resetConnections }) => {
    await this.prepareForTasks(resetConnections);
  },
});
```

Names are unique within an application; duplicates throw. `registrations()` returns a snapshot in registration order. Each execution snapshots the registrations once and awaits each hook once, sequentially, before any migration or seed callback. Registrations added during execution apply to subsequent executions. Hooks must manage repeated invocations themselves; the host does not memoize initialization or own the resources a hook creates.

## Executions and storage

`executeAppDatabasePlan`, `runAppDatabaseTasks` and DatabaseProvider startup share this contract. It applies to `run`, `rollback` and `sample` when at least one plan entry is executable. An existing task directory with no pending files still has an executable plan entry and invokes hooks. An empty plan or a plan containing only skipped entries invokes none. Disabled automatic tasks do not initialize a service through these hooks; a Provider that needs runtime initialization without tasks must use its own boot.

Before calling hooks, the executor prepares driver storage for the executable plan's selected connections. This is storage preparation, not business schema migration. No unselected connection is prepared by the executor; a hook requiring an additional connection must prepare its own storage. The frozen context contains only `resetConnections`, a frozen array naming connections actually reset in this execution, in reset order. Ordinary runs, rollbacks and samples pass an empty array.

Dry runs, checksum repair and lock unlock operations never invoke hooks. Read-only or management commands which only register Providers do not run them. Provider registration and hook registration must themselves stay free of preparation side effects. Direct `createAppMigrator` and `createAppSeeder` calls are lower-level operations and do not invoke these application-plan hooks.

## Fresh runs

With registered hooks and executable tasks, a non-preview fresh run prepares and resets every selected migration connection before calling any hook. It then invokes hooks once and executes the original plan using `latest()` rather than resetting again. Seeds retain the original fresh-install behavior. Only selected managed connections are reset; external connections remain skipped. Direct plans follow the same contract, including when the default connection appears last. Existing plan validation and destructive confirmation stay in effect.

There is no cross-connection rollback. If the second reset fails, the first connection may already be empty; no hook or business callback runs. Without registered hooks, the executor retains its original per-connection fresh sequence and storage access. Hooks do not prohibit fresh or preserve tables.

## Execution structure

An internal planner builds a linear list without I/O: storage preparation, schema reset, hooks and business tasks. A read-only install-history inspection step retains sample-data first-install detection before business tasks alter history. One executor awaits these steps, then one projection combines successful resets, business results and any failed phase. The planner alone expresses the hooked versus unhooked order; business execution neither prepares storage nor resets schemas. Unhooked non-preview execution preserves the existing storage preparation call per task, including repeated connections. Dry runs plan only read-only previews and never call storage preparation.

## Failure and ownership

A storage preparation, reset, install-history inspection or hook error aborts execution and propagates as `AppDatabaseTaskError` with its original cause. Each hook is required preparation: the first failure stops later hooks and business tasks, without retries. Business tasks that never started are `not-run`, never reported as failed migrations; skipped entries retain their original reason. Already completed resets, tasks and hook side effects are not rolled back; the responsible Provider must clean up partial work.

`AppDatabaseTasksResult.failure` independently makes the execution unsuccessful, even when every business task is `not-run`. It contains `phase` (`prepare-storage`, `reset-schema`, `before-tasks`, `inspect-installs` or `run-task`), the original error message as `error`, the `hook` name for hook failures, and `connection`/`kind` where applicable. Only a business task that actually throws has task status `failed`. `resetConnections`, when present, lists successful resets in execution order, including on failure. A reset followed by a failed hook explicitly reports that schemas were cleared and business rebuilding is incomplete. An empty rebuild without migration directories remains completed with empty execution lists and `reason: 'missing-directory'`; `resetConnections` records the schema work independently.

CLI keeps the existing JSON envelope and `DATABASE_TASK_FAILED` code, adds `error.details.failure` and `error.details.resetConnections`, and preserves `error.details.results`. Successful fresh commands include `result.resetConnections`. Lock contention retains `DATABASE_LOCKED`. Consumers must inspect the overall error/`ok` and `failure`, rather than infer success from the absence of a failed business task.

Resource ownership stays with Providers. Registry shutdown awaits Providers in reverse order, including registered Providers not yet booted after a boot failure, and continues after a cleanup error. Place a Provider using the application database after DatabaseProvider so its shutdown precedes database destruction. CLI disposes its application after execution. `runAppDatabaseTasks` destroys only a manager it created; it never shuts down services borrowed from a supplied application container. Callers must keep hook resources tied to the appropriate manager and dispose their own application. No destroy hook is added.

A plan adds one in-memory registry lookup and snapshot. Without hooks it adds no storage access. The hook implementation determines any additional I/O. Request handling and ID generation are unchanged.
