# Plugins in an application

Read this before registering, updating, customizing or removing a plugin, and before building a feature an installed plugin may already provide.

## Read a plugin's Skill before building what it already does

**You are not starting from scratch.** This application ships with NocoBase packages that already solve whole categories of requirement, and packages may publish a Skill explaining how to use them. `pnpm nocobase skills sync` copies Skills from direct `@nocobase/*` dependencies and registered plugins into `.agents/skills/`. Before implementing a feature, check whether an installed and registered plugin already covers it:

| The requirement sounds like                                                                  | Read the Skill for                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------- |
| Email, IM, or in-app messages; notifying someone that something happened                     | `@nocobase/app-plugin-notification`   |
| Roles, permissions, "user A may only see their own records", field-level or row-level access | `@nocobase/app-plugin-authorization`  |
| Sign-in, registration, sessions, password reset                                              | `@nocobase/app-plugin-authentication` |
| User listing, account state, password reset, and application-owned role assignment           | `@nocobase/app-plugin-users`          |
| File upload and metadata through Repository                                                  | `@nocobase/app-plugin-file`           |
| Translated text and language switching                                                       | `@nocobase/app-plugin-i18n`           |

Run `pnpm nocobase skills sync` if `.agents/skills/` is missing or looks out of date, then read the Skill for the plugin you need. It documents that plugin's public entries, the ownership boundary, and how to verify the result — which is faster and more correct than inferring an API from its source.

Building a permission system, a notification sender, or a job scheduler by hand when a registered plugin already provides one is the most expensive mistake available here. Prefer the plugin; write your own only when you have read its Skill and confirmed it genuinely does not fit.

`.agents/skills/` is generated output: gitignored, and every synchronized package-owned directory is replaced wholesale on the next sync, so never edit a file there. The same sync mirrors each synchronized directory into `.claude/skills/` as a symbolic link, because Claude Code discovers skills only there; that mirror is generated and gitignored too. Put application-specific guidance in the application's committed `.agents/rules/`, linked from its `AGENTS.md`.

## The composition roots

Plugins are registered in `client/plugins.ts`, `server/plugins.ts`, and `cli/plugins.ts`. Presence in the array enables a plugin and array order is contribution order. A plugin appears in the roots matching what it ships, so a plugin with only commands is listed in `cli/plugins.ts` alone. Bulk Skills synchronization and plugin updates discover plugins from these composition roots.

Skills synchronization reads direct `@nocobase/*` dependencies from the application manifest and retains compatibility with explicitly registered plugins. It does not make an unregistered runtime plugin active; the composition roots remain the authority for registration and contribution order.

Let `pnpm nocobase plugin register` and `pnpm nocobase plugin unregister` add and remove entries. Edit these files by hand only to reorder entries or to pass a plugin its options.

## Installing and updating

Install plugins with `pnpm nocobase plugin register <name>`. All application plugins belong in `dependencies`, including client-only and disabled plugins, because deployment dependencies come from that field. Plugin frontend libraries remain peers and are not automatically installed in the deployment. Re-registering migrates legacy `devDependencies` entries while preserving the declared range; verify the manifest and lockfile afterward. With an older CLI, use `pnpm add --save-prod <package>@<declared-range>` to correct the declaration; `--no-install` leaves lockfile synchronization to the caller.

To update a registered plugin, use `pnpm nocobase plugin update @nocobase/app-plugin-authentication`, or omit the name to update all registered plugins. Prefer the full package name; `authentication` is also accepted as a short name. The name is a positional argument, not `--plugin`. Use `--dry-run` to preview. With pnpm, updates stay within declared version ranges; after a successful update, all registered plugin Skills are re-synchronized. See the Plugins section of the application's `README.MD` for version-range behavior and examples.

## Customizing a page a plugin owns

To customize a page a plugin owns, pass an option on its registration, add a source extension under `client/extensions/*/extension.ts`, or add an entry to `client/route-overrides.ts`. Do not redeclare the plugin's route — a duplicate `/install` is a conflict, not a customization. An override replaces only `componentLoader`; route identity, path, and auth mode stay with the plugin. One route takes one override across all three mechanisms. Route overrides must stay lazy, declare a `componentEntry`, and load a default-exported component. See section 10 of [pages and routes](frontend/references/page.md).

Authentication pages are not plugin-owned: `/login`, `/register`, `/forgot-password`, and `/reset-password` are application routes declared in `client/routes.ts`. Authentication pages in `client/pages/auth/` use relative links and the authentication plugin's `client/actions` hooks; do not call authentication endpoints directly or create a second session store.

## Removing a direct NocoBase package

Before removing an `@nocobase/*` dependency, search the application's imports, Client/Server/CLI plugin registrations, routes, services, configuration, tests, and build scripts for the package name and the contracts it provides. Migrate or remove those references first. `package remove` updates dependency metadata and generated Skills; it does not rewrite application code or configuration and cannot decide whether the capability is still needed, so never use it to remove a capability the application still needs.

Run `pnpm nocobase package remove @nocobase/example`. The command uses the application's package manager to update `package.json` and the lockfile, then removes only synchronized Skills recorded as owned by that package. An `@nocobase/app-plugin-*` target delegates to the plugin unregister workflow so its Client, Server, and CLI registrations are removed together; `pnpm nocobase plugin unregister <name>` remains available. Use `--dry-run` before a consequential removal and `--json` when structured output is needed.

After an interrupted or manual removal, verify that the manifest no longer declares the package and run a full `pnpm nocobase skills sync` to reconcile stale package-owned output. Passing an already-absent package to `package remove` cleans recorded historical Skill ownership without uninstalling or cleaning another package.
