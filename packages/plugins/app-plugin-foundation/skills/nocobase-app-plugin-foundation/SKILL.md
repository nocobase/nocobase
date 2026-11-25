---
name: nocobase-app-plugin-foundation
description: Use when an application should show which plugins it uses (System settings › System › Plugins), when someone asks why a plugin shows as not enabled, development only or needing attention there, when granting who may see that page, or when replacing it. Not for enabling a plugin itself, which is `pnpm nocobase plugin register`.
---

# Plugins page

`@nocobase/app-plugin-foundation` adds System settings › System › Plugins: every plugin the application declares or registers, its installed version and its state, with the commands that enable, update or disable it. The page changes nothing itself and has no detail pages.

## Register it

```ts
// client/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/client';
// …
foundation(),

// server/plugins.ts
import foundation from '@nocobase/app-plugin-foundation/server';
// …
foundation,
```

It needs the authentication and authorization plugins. The factory takes no options. Earlier `/settings/foundation` and `/settings/capabilities` addresses open the plugins page.

## Who may see it

The settings item «Plugins · View» (`foundation.plugins`, action `read`, in the permission workspace's System subsection) opens the page and its `GET /api/foundation/plugins`. Root has it; grant it to another role like any settings item. Without it a user sees no menu entry, and the API answers 403.

## What a state means

The page classifies each plugin the way `pnpm nocobase plugin inspect <name>` does; both call `classifyPluginRegistration` from `@nocobase/app-server/plugins`.

| Page                                 | `plugin inspect`                             | Meaning                                                                             |
| ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| Enabled                              | `registered`                                 | Registered and deployed with the application.                                       |
| Enabled · Skills only                | `registered`, `skillsOnly`                   | Ships only Agent Skills; being in `dependencies` enables it.                        |
| Not enabled                          | `unregistered`                               | In `dependencies`, not registered.                                                  |
| Not enabled · Development dependency | `preinstalled`                               | In `devDependencies`; a deployed application does not have it.                      |
| Enabled · Needs attention            | `inconsistent` (`PARTIALLY_REGISTERED`)      | Registered in only one of `client/plugins.ts` and `server/plugins.ts`.              |
| Enabled · Needs attention            | `inconsistent` (`REGISTERED_DEV_DEPENDENCY`) | Registered but declared in `devDependencies`, so a deployment would miss it.        |
| Enabled · Needs attention            | `registered`, with missing requirements      | A plugin it requires (a non-optional `@nocobase/app-plugin-*` peer) is not enabled. |

Every situation needing attention is fixed by running `pnpm nocobase plugin register` again for the plugin, together with the plugins it requires: `pnpm nocobase plugin register agents knowledge`. Restart `pnpm dev` afterwards; a deployment is rebuilt with `pnpm build --tar` and upgraded with the installer.

A deployed application (its `package.json` records `nocobase.builtAt`) lists development plugins from the metadata recorded by the build in `nocobase.developmentPlugins`. To enable one, register it in the source project and redeploy. Older builds require a rebuild to list these plugins.

## Name and description

The page shows a plugin by the `title` and `description` its `package.json` declares under `nocobase`, one string or one per locale, falling back to the short package name. See the plugin development Skill's package contracts for the field.

## Replace the page

Override the route id `@nocobase/app-plugin-foundation:plugins` with `routeComponentOverrides` in `client/runtime.ts`; `usePlugins()` from `@nocobase/app-plugin-foundation/client` reads the same data.
