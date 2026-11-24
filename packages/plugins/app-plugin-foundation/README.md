# @nocobase/app-plugin-foundation

Adds System settings › System › Plugins: the plugins an application uses, their versions and states, grouped as enabled and not enabled, with the commands that enable, update or disable each one. The page changes nothing itself, because enabling or disabling a plugin changes the application's code and takes effect after a restart; it has no detail pages.

## Registering the plugin

```ts
// server/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/server';

// client/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/client';
// foundation() takes no options.
```

The plugin needs the authentication and authorization plugins, which every application built from the default template registers. Its page reads the query cache the application's routes provide. It contributes no CLI commands, build hooks or configuration section.

The page is `/settings/plugins`, route id `@nocobase/app-plugin-foundation:plugins`. The earlier `/settings/foundation`, `/settings/capabilities` and `/settings/capabilities/:entryId` addresses open it. An application replaces the whole page with `routeComponentOverrides` for that route id; `usePlugins()` from the client entry reads the same data.

## Who can see it

The settings item «Plugins · View» (`foundation.plugins`, action `read`, exported as `PLUGINS_ACCESS`) opens the page and `GET /api/foundation/plugins`. It is listed in the permission workspace's System subsection of administration. Root holds it; other roles need it granted. Without it the settings menu has no Plugins entry and the API answers `403`.

## What it lists

`GET /api/foundation/plugins?client=<package>…` lists every `app-plugin-*` and `app-portal-*` package the application declares in `package.json` or registers, with its installed version, the `title`, `description` and `docs` its `package.json` declares under `nocobase`, and its registration state. The browser passes the packages its application registers in `client`, since only it knows them. Manifests are read once per process; a request runs one authorization check and no database query.

The state is the one `pnpm nocobase plugin inspect <name>` reports, computed by the same `classifyPluginRegistration` from `@nocobase/app-server/plugins`:

| Page                           | `plugin inspect`           | Meaning                                                                    |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------------- |
| Enabled                        | `registered`               | Registered by the application.                                             |
| Enabled · Skills only          | `registered`, `skillsOnly` | Ships only Agent Skills; declaring it in `dependencies` enables it.        |
| Not enabled                    | `unregistered`             | Declared in `dependencies`, not registered.                                |
| Not enabled · Development only | `preinstalled`             | Declared in `devDependencies`, so a deployed application does not have it. |
| Enabled · Needs attention      | `inconsistent`             | See below.                                                                 |

Plugins needing attention are listed first, each with the reason in plain words:

- **Only partly enabled** (`PARTIALLY_REGISTERED`): the package has both a page and an API but only one is registered.
- **Not included when deploying** (`REGISTERED_DEV_DEPENDENCY`): registered but declared in `devDependencies`.
- **A plugin it requires is not enabled**: a non-optional `@nocobase/app-plugin-*` peer dependency is not registered.

Running `pnpm nocobase plugin register` again fixes each of them. "How to enable" gives that command for a plugin that is not enabled, with the plugins it requires first, such as `pnpm nocobase plugin register agents knowledge`; "Commands" gives `plugin update` and `plugin unregister` for an enabled one and lists the enabled plugins that depend on it.

A deployed application, whose `package.json` records `nocobase.builtAt`, installs only `dependencies`, so its list leaves out the plugins visible only during development, and the page says so. It reads what the CLI registers from the `cli/plugins.json` `pnpm build` writes; a deployment built before that file existed shows a plugin only the CLI could register as "Can't tell · Rebuild", with no command, until it is rebuilt.

## Upgrading from the App Foundation overview

Earlier versions scanned the application and showed a capability overview and guide. Those pages, the scan, its snapshot table, the `foundation modules build` command with its build hook, the `foundation` configuration section (`FOUNDATION_SCAN_ON_START`) and the `./capability-guide`, `./cli`, `./config` and `./client/pages` exports are gone. Remove the plugin from `cli/plugins.ts`, delete `server/config/foundation.ts` and its entry in `server/config/index.ts`, and call `foundation()` without options in `client/plugins.ts`. The migration `202611220001_drop_foundation_snapshots` drops the `foundationSnapshots` table.
