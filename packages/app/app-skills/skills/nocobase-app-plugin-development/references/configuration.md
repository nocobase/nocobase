# Plugin Configuration

Use Server configuration for deployment values, typed Client factory options for composition choices, and settings items plus APIs for administrator-managed business data. A Client plugin declaration has no `config` contribution. The application owns composition and configuration files; a plugin exports its configuration factory and documents the section under which the application registers it.

## Define defaults, environment mappings and validation

The complete [reading-list configuration factory](../assets/testing-example/server/config.ts) exports `defineReadingListConfig()` and `ReadingListConfig`. Its `defineAppConfig()` declaration sets `pageSize: 20`, maps `READING_LIST_PAGE_SIZE` through `envInteger('pageSize')`, validates an integer from 1 through 100, and publishes only `pageSize` to the browser. `READING_LIST_INTEGRATION_KEY` maps to an optional string marked `secret: true`; it illustrates a private deployment value and is not needed by the reading-list service.

Keep paths in `env`, `public` and validation errors relative to the section: `pageSize`, not `readingList.pageSize`. The application supplies the `readingList` section name. Validation receives the merged value, which originates in user input even though the callback is typed. Report issues with `context.error()` or `context.warning()`; validate without network calls or writes, because validation also runs during reload and configuration checks. Never include secret values in issue messages.

Publish the factory through a documented package export, such as `@example/app-plugin-reading-list/config`. Its consumer is the application's Server composition; importing it must not start a service or read process-wide environment variables. The example [manifest](../assets/testing-example/package.json) shows the source export, while a release must also have the corresponding compiled export and declaration files described in [package contracts](plugin-foundation.md).

## Register the factory in the application

Add the section to the application's existing `defaultAppConfigs()` map and register the Server plugin separately. The complete fixture's [runtime](../assets/testing-example/tests/fixtures/app/server/runtime.ts) shows both steps together with authentication, authorization and database prerequisites. In a generated application, preserve its other sections and its normal configuration-file loading:

```ts
// App server/config/reading-list.ts
import { defineReadingListConfig } from '@example/app-plugin-reading-list/config';

export default defineReadingListConfig();
```

Merge `readingList` into the existing aggregator; this abbreviated map shows only the new entry:

```ts
import { defaultAppConfigs } from '@nocobase/app-server/config';

import readingList from './reading-list.js';

export default defaultAppConfigs({ readingList });
```

With the standard runtime, section defaults are the fallback, configuration-file values override defaults, and declared environment values override the file. For example, a file setting `readingList.pageSize` to `30` and `READING_LIST_PAGE_SIZE=10` resolve to `10`. A value of `0` fails startup validation. Environment mappings are explicit: a similarly named environment variable has no effect unless declared or loaded by another application configuration source.

The [Server provider](../assets/testing-example/server/provider.ts) reads `app.config.get<ReadingListConfig>('readingList')` when constructing its service. It does not store deployment state in the static plugin declaration. The example service captures `pageSize` at construction; a runtime configuration change requires recreating the application/service unless the plugin deliberately implements live reconfiguration.

## Publish a minimal browser contract

`public: ['pageSize']` means the Server runtime may serialize that field into public configuration. The `integrationKey` remains Server-only because it is absent from `public`; marking a variable `secret` is metadata, not a substitute for the public-field allowlist. Do not return the whole configuration section from an API.

The Client entry imports a module that augments `PublicAppConfig`, so downstream application code receives the contract through the public import:

```ts
// Plugin client/public-config.ts
import type { ClientApplication } from '@nocobase/app-client';

declare module '@nocobase/app-client' {
  interface PublicAppConfig {
    readingList: { pageSize?: number };
  }
}

export function readingListPageSize(app: Pick<ClientApplication, 'config'>): number {
  return app.config.public.get('readingList.pageSize', 20);
}
```

Read Server-published fields through `app.config.public.get()`. `app.config.get()` reads Client-owned configuration and does not return them. Keep the public contract's fields optional because a Server may not publish a value. Public values are visible to the browser and cannot establish authorization; the [protected route](../assets/testing-example/server/routes.ts) checks the current authenticated user's permission independently.

## Verify the configuration boundary

The executable [Server configuration tests](../assets/testing-example/tests/server/config.test.ts) start the registered plugin, prove environment-over-file precedence, inspect the public projection for secret exclusion, and reject an invalid final value. The [Client configuration test](../assets/testing-example/tests/client/public-config.test.tsx) verifies the typed accessor against a runtime public payload. Run them with the [complete example's validation command](testing-example.md#run-the-example-checks).

Configuration and registration are separate contracts. A plugin being registered does not automatically install its exported configuration factory, and a valid configuration does not prove the plugin is enabled. Document both in the plugin's App-facing Skill; keep interactive administration in [settings items and APIs](system-settings.md).
