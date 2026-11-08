# ID generator lifecycle

Business code continues to resolve `idGeneratorToken` from `@nocobase/app-server/id-generator` and use synchronous `generate()` / `generateString()`. The host owns that binding and its permanently closable facade. Default configuration remains manual: `{ workerId: 0 }` and `{ mode: 'manual', workerId: 0 }` use the original 53-bit Snowflake implementation, worker range 0..31, epoch and sequence. No allocation plugin is bundled or enabled by this contract.

## Register an automatic factory

A Server provider registers one factory through the host's `idGeneratorLifecycleToken` in `register()`. Register `IdGeneratorProvider` before providers that contribute the factory. All provider registrations finish before database boot. Resolving either Token or registering a factory does not allocate, connect, start timers or initialize the generator. Do not override either host binding.

```ts
import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  idGeneratorLifecycleToken,
  type ManagedIdGenerator,
} from '@nocobase/app-server/id-generator';

export class AutomaticIdsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'example/automatic-ids';

  public override register(): void {
    this.app.container
      .resolve(idGeneratorLifecycleToken)
      .registerFactory((): ManagedIdGenerator => this.createRuntime());
  }

  private createRuntime(): ManagedIdGenerator {
    // Return the plugin's runtime; construction must be synchronous and resource-free.
    throw new Error('Supply an allocation runtime.');
  }
}
```

The factory returns `ManagedIdGenerator`: synchronous `generate(): number` and `generateString(): string`, plus `initialize(): Promise<void>` and `shutdown(): Promise<void>`. It may capture the provider's config, paths, service resolver and structured logger. Construct the runtime synchronously without acquiring resources; acquire them inside `initialize()` so the host retains a handle for partial-initialization cleanup. The plugin implements allocation, time checks and local algorithm ownership. It must keep generation entirely in memory; diagnostics cannot revoke generation merely because the center is unavailable.

Configure `snowflake.mode: auto`. Auto rejects explicit `workerId` and `epoch`, including an environment-mapped worker. Both templates omit manual defaults when the configuration file selects auto. Remove `workerId` and `epoch` from a copied manual example, and unset `SNOWFLAKE_WORKER_ID`. Register a compatible allocation plugin and prepare its storage before auto startup. Plugin-specific settings and bootstrap remain owned by that plugin. Configuration is captured for one application lifetime; restart to change modes.

## Compose the snowflake configuration once

Both templates register `defineAppSnowflakeConfig()` from `@nocobase/app-server/id-generator` as the sole `snowflake` section factory. Omitted mode and explicit `manual` are equivalent. The internal normalized mode is not a required user setting. Invalid modes, including non-string values, produce a `snowflake.mode` configuration error. Selecting auto without a compatible registered runtime still fails initialization clearly.

An adapter contributes its existing `AppConfigFactory<AdapterOptions>` through that same entry:

```ts
// App server/config/snowflake.ts
import { defineAppSnowflakeConfig } from '@nocobase/app-server/id-generator';
import { defineAdapterConfig } from 'example-allocation-adapter/config';

export default defineAppSnowflakeConfig(defineAdapterConfig());
```

The host owns `mode`, `workerId`, `epoch` defaults and `SNOWFLAKE_WORKER_ID`. Those three defaults from the extension are discarded: installing an adapter alone never enables auto, and adapter defaults cannot inject a manual worker/epoch into auto. File values still override host defaults and the worker environment mapping still overrides the file. The extension contributes other defaults, environment mappings, public paths and validators. Its validators receive the final combined section, including host fields, and run after host validation; they must tolerate untrusted input. Extensions must not map other environment variables to host-owned fields or publish them. The composed return type is `ExtendedAppSnowflakeConfig<AdapterOptions>`, which preserves the host mode union and types the adapter's additional fields without adding commercial options to OSS.

Register exactly this composed factory under `snowflake` in the existing `defaultAppConfigs` map; do not also register an independent adapter section with that name. Configuration composition does not register a runtime or prepare allocation storage. A compatible adapter must wire its own factory, configuration composition and bootstrap separately. Existing adapters exporting an independent snowflake factory need to adopt this composition in their application integration; no commercial code or vendor revision belongs in the host change.

## Initialize before business tasks

`initialize()` retains one Promise, including failure; it never implicitly retries or rebuilds a generator. Auto generation fails until initialization succeeds. Missing factories and invalid modes fail without falling back to worker 0. Manual generation remains available synchronously after provider registration.

`DatabaseProvider.boot()` prepares storage and enters `executeAppDatabasePlan()`, which initializes before migration/seed history inspection and execution, including when the plan is empty or all tasks are skipped. Manual `runAppDatabaseTasks()` operations `run`, `rollback` and `sample` enter the same path, preparing the default connection before initialization only when the lifecycle reports `mode: auto`. Manual mode, a missing lifecycle and an empty manual plan add no storage preparation; task connections retain their normal task-owned preparation. Database tasks receive the unchanged allowlisted business Token; they cannot access the lifecycle extension or factory. `IdGeneratorProvider.boot()` also initializes database-free applications.

Dry runs, history/read-only operations, `repair` and `unlock` do not initialize. `fresh` is refused in auto mode before reset, confirmation or allocation, including its preview, because it could erase allocation and release audit records. Low-level standalone database APIs remain owner-managed; application integrations should use the shared task runners and supply the application's `runtimeConfig` and `container`.

Management commands use `AppCommand.withApp()`, call `app.registerProviders()`, and resolve their own management service. They never call `app.start()` or `idGeneratorLifecycleToken.initialize()`. This pattern creates no allocation and runs no application boot, migration, Seed or HTTP service. The CLI closes the application and runtime scope on success and failure.

## Close before database destruction

`shutdown()` synchronously and permanently closes the host facade before invoking the managed runtime's shutdown. Calls share one Promise, including rejection. The runtime must synchronously close its own entrance, stop timers, cancel or drain initialization and in-flight diagnostics, then perform bounded return and resource disposal. It must tolerate failed or partial initialization. Late initialization success cannot reopen the host facade.

Both the ID provider and the database provider request the same idempotent shutdown. The database provider waits before destroying its connections, regardless of provider order, and still destroys them if return fails. Startup failures, including partial registration and failures after provider boot, close registered providers. CLI `withApp()` provides the same cleanup when it only registered providers. A standalone task runner that owns its database also shuts down its supplied lifecycle before destroying that manager; a borrowed manager and application remain the caller's responsibility.

The host waits at most 15 seconds for an adapter shutdown, then reports `ID generator shutdown timed out; worker return is unknown.` and permits database teardown. This deadline is a final wait bound, not cancellation or proof of database rollback: an adapter must provide its own bounded request isolation, stop its handles and retain owner-safe recovery when acknowledgement is unknown. Do not claim successful return on timeout. No host timer runs during normal generation; the shutdown timer is cleared when cleanup settles.

## Cost and integration boundary

Each ID adds only in-memory facade checks and a call to the existing generator. The host adds zero SQL, file I/O, IPC, locks or transactions per ID, request or poll. Initialization invokes the factory and its asynchronous initialization once per application. The allocation plugin owns and must report its startup, diagnostics and return costs. Storage preparation uses the existing driver hook; it does not bootstrap allocation tables.

This host contract contains no allocation table, heartbeat, reclamation policy or management command. A compatible commercial adapter can return its independently implemented runtime directly when it satisfies `ManagedIdGenerator`. Its integration must remove any old boot guard, register this factory and test the complete application lifecycle and production CLI against the released host. Publishing either side alone does not complete automatic worker allocation. Cross-dialect allocation, center faults, cooldown/reassignment and end-to-end commercial acceptance belong to the adapter's verification.
