# Complete Plugin Testing Example

The [reading-list source fixture](../assets/testing-example/package.json) is one small plugin with a migration, a service, an authenticated API, a translated public Client component and a CLI command. Its tests use the production declarations and implementations in that directory. Use it to see how the layers connect, then adapt the production code and access policy to the feature being built.

This fixture demonstrates a **shared** reading list: a grant on resource `readingList:shared` with action `read` permits reading its entries. It is not a per-user or tenant-scoped collection. The API is read-only; the Server test inserts a record through the Repository to establish fixture data. The Client is a reusable business component, while the application chooses where to render it. Administration pages remain application-owned.

## Follow the complete source

| Layer | Files and behavior |
| --- | --- |
| Database | [Migration](../assets/testing-example/database/migrations/202610180001_reading_list.ts) creates `readingListEntries` with `id` and `title`; `down` drops it |
| Configuration | [Factory](../assets/testing-example/server/config.ts) declares defaults, environment mappings, validation and a public-field allowlist; see [configuration guidance](configuration.md) |
| Server service | [Service and Token](../assets/testing-example/server/service.ts) list a bounded number of entries in stable order and count them |
| Provider | [Provider](../assets/testing-example/server/provider.ts) binds the service and registers the custom authorization resource type; [aggregation](../assets/testing-example/server/providers/index.ts) exports its constructor |
| HTTP | [Route](../assets/testing-example/server/routes.ts) requires authentication and a `read` grant, documents its OpenAPI contract and returns `{ data, meta }` |
| Server registration | [Declaration](../assets/testing-example/server/index.ts) sets absolute `baseDir` and contributes migrations, providers and routes |
| Client | [Declaration](../assets/testing-example/client/index.ts) registers lazy locales; [component](../assets/testing-example/client/reading-list.tsx) uses the host API client and an explicit translation namespace |
| CLI | [Declaration](../assets/testing-example/cli/index.ts) contributes `reading-list:count`; [command](../assets/testing-example/cli/count.ts) starts the registered application, resolves the same service and returns structured output |

The API lists the first configured `pageSize` entries and reports the total. It intentionally has no editor, pagination controls or browser route. Adding those behaviors requires their own contracts and checks. The component uses semantic headings, lists and status messages; interactive controls added later must follow the [shadcn guidance](client-components.md).

## Register a real fixture application

The fixture contains its own [manifest](../assets/testing-example/tests/fixtures/app/package.json), [runtime](../assets/testing-example/tests/fixtures/app/server/runtime.ts), [application factory](../assets/testing-example/tests/fixtures/app/server/app.ts) and [standalone entry](../assets/testing-example/tests/fixtures/app/server/standalone.ts). The runtime loads the generated test configuration from `context.configPath ?? context.environment.APP_CONFIG_FILE`, registers the authentication, authorization and reading-list Server plugins, and adds the reading-list configuration factory. The application adds the database, cache, ID generator and mailer services required by those plugins.

This is a test-only host. Its fixed authentication secret and enabled email/password signup are fixture values; preserve the real target application's authentication policy when integrating a plugin. The production declaration is imported directly from the fixture's source to test the edited implementation. An installed application instead imports the plugin's public package export.

The [shared helper](../assets/testing-example/tests/helpers/app.ts) creates `createAppTest({ createServer: createStandaloneServer })`. Each authentication case registers a distinct user through the real signup API and calls `signIn()` from `@nocobase/app-plugin-authentication/testing`. The allowed case creates and assigns a permission set through the real authorization service. No route, authentication hook or authorization decision is mocked.

## What each suite proves

| Suite | Observable checks |
| --- | --- |
| [Database](../assets/testing-example/tests/database/migration.test.ts) | `describeMigration()` applies, rolls back and reapplies the production migration; verifies the field and collection lifecycle |
| [Server routes](../assets/testing-example/tests/server/routes.test.ts) | Anonymous request is `401`; signed-in user without a grant receives `403` and `AUTHORIZATION_DENIED`; granted user reads the persisted entry |
| [Server configuration](../assets/testing-example/tests/server/config.test.ts) | Environment overrides a file value, public projection excludes the private value, invalid configuration rejects startup |
| [Client component](../assets/testing-example/tests/client/reading-list.test.tsx) | Real Client plugin registration loads English and Chinese resources; held responses prove loading, then success; denied and empty responses produce their visible states |
| [Client public configuration](../assets/testing-example/tests/client/public-config.test.tsx) | The typed Client accessor reads the Server-published payload and supplies its documented default when absent |
| [CLI](../assets/testing-example/tests/cli/count.test.ts) | The contributed production command starts the fixture App on an owned test database and returns the expected JSON envelope |

The CLI fixture uses `bindTestAppCommand()` to place runtime storage in `path.join(config.directory, 'storage')` without changing `APP_STORAGE_DIR` in the process environment. Its assertion checks that owned path, and `config.dispose()` removes the temporary directory.

`createAppTest()` owns its lifecycle; the default file scope shares one application between route cases. Direct `createTestApp()` calls and CLI configuration fixtures use `finally` to close/dispose. Environment stubs are restored. Client requests match both method and API-relative path, reject unexpected endpoints, and release held responses in `finally` without sleeps. The database dialect comes from the standard test environment, not a hard-coded SQLite connection.

Client tests use `answerApi()` at the network boundary. They prove rendering, translations and request contracts; Server tests independently prove persistence and authorization. A page-to-real-API browser workflow, route authorization, navigation/reload, compiled package consumption and publishable tarball contents require target App or packaging checks when those surfaces change. This fixture does not claim those checks passed.

## Run the example checks

Use an installed NocoBase 3 application directory whose development dependencies include `@nocobase/app-testing`, `@nocobase/dev-config`, Vitest, TypeScript, ESLint, React testing libraries and the runtimes used by the example. In this repository, install dependencies normally first, then run from the repository root:

```bash
node skills/nocobase-app-plugin-development/scripts/verify-testing-example.mjs packages/templates/app-template-default
```

The [verifier](../scripts/verify-testing-example.mjs) copies only the [example assets](../assets/testing-example/package.json) to a temporary directory, excluding installed `node_modules` and generated `storage`, links the supplied application's installed dependencies, and runs ESLint, TypeScript, Node tests, then jsdom tests. It fails on a failed command or an empty suite and removes its temporary source, test storage and cache afterward. It never installs dependencies or edits the supplied application. It inherits the standard database test environment; configure that environment as usual when selecting another dialect, and run database integration checks sequentially.

The asset manifest is private and exists for this validation harness. In the source repository it is a workspace member with explicit development dependencies and `lint`, `typecheck` and `test` scripts, so a clean workspace install also supports direct CI checks of its source. When the Skill is installed globally, use the verifier above to borrow an installed application's dependencies; the manifest's workspace references are not standalone installation instructions. It is not a publishable plugin scaffold. For a real plugin, use the scaffold's manifest, declare runtime peers/dependencies and test-only devDependencies, preserve source/dist exports and resource packaging, and register Client, Server and CLI entries in the chosen target App. Start with [package contracts](plugin-foundation.md), [registration](registration.md) and the [scoped delivery checks](testing.md#run-scoped-package-and-consumer-checks).

Keep the example source authoritative: update these assets when changing its behavior, rerun the verifier, and describe the change here. Avoid copying a second implementation into test bodies or maintaining a separate unexecuted copy of the complete plugin in Markdown.
