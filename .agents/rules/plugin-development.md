# Plugin Development in the Source Repository

Read the shared `packages/app/app-skills/skills/nocobase-app-plugin-development/SKILL.md` for plugin architecture and implementation. `scripts/sync-skills.mjs` links that complete source into this checkout's Agent directories instead of the global migration bridge. This file adds only source-repository conventions; an independent App does not need this checkout.

## Create and register

Identify this environment by `packages/tools/create-plugin/`, `packages/app/app-client/`, `packages/app/app-server/` and `pnpm-workspace.yaml`. Plugins live in `packages/plugins/` or `packages/examples/`. From the repository root:

```bash
pnpm plugin:create audit-log --with server.routes --dry-run --json
pnpm plugin:create audit-log --with server.routes
pnpm nocobase plugin register audit-log --workspace-root . --app app-template-default --dry-run --json
pnpm nocobase plugin register audit-log --workspace-root . --app app-template-default --json
```

Select the intended App explicitly; `app-template-default` is only the default. Review actual exports, existing composition entries and Client options. Use `--no-install` only when installation is coordinated separately. Skills synchronization does not prove runtime behavior.

## Dependencies, UI and validation

Use `workspace:` for internal packages and `catalog:` for catalog dependencies, following `.agents/rules/package-dependencies.md`. Follow repository publishing and changeset rules for packages under `packages/`; independent App-local plugins can remain private.

For UI components, copy the files and targets listed in `ui-library/registry/components/registry.json`, following `ui-library/USAGE.md` and `ui-library/MAINTAINING.md`. Do not import private template modules at runtime. The shared Skill's shadcn, theme and public-contract rules still apply.

Run the plugin's scoped checks and relevant consumer checks. When locale resources change, run `pnpm i18n:check` (and `--strict` when required). For HTTP changes use `pnpm openapi:check` or `node scripts/check-openapi.mjs default` as appropriate. Migrations follow `.agents/rules/database-migrations.md`. These repository scripts are not commands to assume in an installed App.

The shared Skill's executable example is a private nested workspace at `packages/app/app-skills/skills/nocobase-app-plugin-development/assets/testing-example/`. Its source and verifier ship as learning resources; installed dependencies, test storage and build output must not enter the published Skill.
