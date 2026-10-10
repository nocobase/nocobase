---
title: 'Testing plugins'
description: 'Verify plugin pages, services, migrations, commands and application integration.'
---

# Testing plugins

A plugin's tests use `@nocobase/app-testing` in `devDependencies`. Import its `client`, `server` and `cli` entries instead of importing `@nocobase/db-testing` or `@nocobase/app-cli/testing` directly. The [application testing guide](../app/testing) explains the fixtures, their lifetime, strict translations and API responses; this page covers the plugin-specific setup.

## Directories and environments

The plugin generator configures Vitest projects by directory:

| Directory                           | Subject                                                | Environment |
| ----------------------------------- | ------------------------------------------------------ | ----------- |
| `tests/client/`                     | Pages, components and client services                  | jsdom       |
| `tests/server/`                     | Services, production routers and permissions           | Node        |
| `tests/database/`                   | Migrations and seeds                                   | Node        |
| `tests/cli/`                        | Commands                                               | Node        |
| `tests/project/`                    | Package exports and build artifacts                    | Node        |
| `tests/fixtures/`, `tests/helpers/` | Fixture applications and shared helpers; no test files | As imported |

Use `*.test.ts` or `*.test.tsx`; directory selection makes environment comments unnecessary. A plugin without client code starts with the Node project only. Add the React project and jsdom test dependencies with its first client test. An older plugin follows its existing layout until its configuration is migrated.

## Pages and client services

The example assumes the plugin exports a registration factory from `client/index.ts`, an `OrdersPage` that requests `GET orders`, and its locale resources through the plugin declaration. Replace those names and the response body with the actual feature.

```tsx
// tests/client/orders.test.tsx
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import orders from '../../client/index.js';
import OrdersPage from '../../client/pages/orders.js';
import packageMetadata from '../../package.json' with { type: 'json' };

it('loads orders with the plugin services and translations', async () => {
  await renderWithApp(<OrdersPage />, {
    plugins: [orders()],
    namespace: packageMetadata.name,
    route: '/orders',
    fetch: answerApi(({ method, path }) =>
      method === 'GET' && path === 'orders'
        ? { data: [{ id: '1', name: 'Order 1' }] }
        : new Response(null, { status: 404 }),
    ),
  });
  expect(await screen.findByText('Order 1')).toBeInTheDocument();
});
```

Listing the plugin runs its service providers and loads its locales. Omitting it registers nothing. Use `namespace: packageMetadata.name` for its own pages; omit the namespace for a component intended to resolve its own translations outside the plugin's render subtree.

Answer requests with `answerApi()`, register external service substitutes through `services`, and assert open notifications with the render result's `toasts()`. Do not mock application hooks or register both a substitute and the plugin owning that service. Render child `Routes` inside the helper's memory router. Cover direct child URLs, redirects, query preservation and denied actions; host route guards need a target-application test too.

## Services, routes and real permissions

Test pure domain logic with explicit dependencies. For a production route, call its actual `createRouter()` with the required services and make requests to the resulting router. Use `createDatabaseTest()` from `@nocobase/app-testing/server` if it needs a database. Do not create a second registration API solely for tests.

For real login, final mounting and permission enforcement, use `createAppTest()` with a fixture application's `createStandaloneServer`, or add the case to the target application's suite. The fixture runtime must register this plugin and the authentication, authorization and other plugins it depends on. A plugin's `server/plugin.ts` is a declaration, not an application server factory.

Sign in through `signIn()` from `@nocobase/app-plugin-authentication/testing`. Cover anonymous `401`, authenticated-but-denied `403`, and the authorized response. A deliberately public callback instead tests its signature and replay boundary. For protected operations, do not treat a hidden button as evidence of server authorization. Application tests share data per file unless `scope: 'test'` is selected.

## Migrations and seeds

A plugin's migrations live in `database/migrations`, with no connection segment. Include the owning package and any prerequisite packages in `sources`. The following example assumes a migration named `202610080001_orders_create_orders` that creates the required string field `orders.name`:

```ts
// tests/database/orders.test.ts
import { fileURLToPath } from 'node:url';
import { describeMigration } from '@nocobase/app-testing/server';
import packageMetadata from '../../package.json' with { type: 'json' };

describeMigration('202610080001_orders_create_orders', {
  sources: [
    {
      packageName: packageMetadata.name,
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('orders').toHaveField('name', {
      type: 'string',
      nullable: false,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('orders').not.toExist();
  },
});
```

The fixture applies, rolls back and reapplies the migration on the selected dialect, checking schema and metadata. Never choose a database driver in a plugin test. For database-backed services or seeds, use `createDatabaseTest({ migrations, seeds })` and check actual persisted behavior, including repeated seed execution.

## Commands and delivery

Use `bindAppCommand()` and `runAppCommand()` from `@nocobase/app-testing/cli` for command results and errors. A command opening the real application uses `createTestAppConfig()` and `bindTestAppCommand()` with the fixture application's root; dispose the configuration in `finally`. See the [command example](../app/testing#test-commands).

Run the plugin's `lint`, `typecheck`, `test` and `build` scripts and checks for affected application consumers. In the source workspace, scope commands with `pnpm --filter <plugin-package>`. `pnpm db-tests:check` checks database portability, and `pnpm test:db <dialect> --filter <plugin-package>` runs the suite against another dialect. These root scripts belong to the source repository, not a generated standalone application.

Verify published exports, declarations and migration resources when packaging changes. Read package identity and version from `package.json` in tests. A generated scaffold, green build or successful registration alone does not prove that the installed plugin behaves correctly; exercise its affected workflow in the target application.
