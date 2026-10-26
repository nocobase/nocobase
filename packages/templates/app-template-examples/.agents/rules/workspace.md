# Internal workspace packages

The application stays at the workspace root: keep `client/`, `server/`, `cli/`, `database/`, configuration and storage here. New projects declare `packages/*` in their root `pnpm-workspace.yaml`; an existing project adds that pattern while preserving its other workspace and install settings. Run one `pnpm install` at the application root and commit its shared lockfile. Do not create another workspace or lockfile inside a child package.

Use ordinary packages for shared types, utilities or UI. Application-specific pages, routes and migrations still belong in the application. A package boundary does not require publishing or plugin registration. Read [workspace package contracts](../skills/nocobase-app-development/references/dependencies.md#internal-workspace-packages) before adding one, and use the [runnable example](../skills/nocobase-app-development/references/internal-package-example.md) for configuration, application imports and declaration watching.

`pnpm dev`, `pnpm build` and `pnpm build --tar` still run from this directory. `pnpm check` first runs each internal package's `check` script, then checks the application; a missing or empty package `check` script fails before any package checks run. An application with no internal packages succeeds. Root ESLint and Prettier exclude `packages/`, because every package owns its TypeScript, lint and formatting configuration. Run a package's `fix` with `pnpm --filter <package-name> fix`.

Keep internal package directories, workspace patterns and `workspace:` dependencies when merging a newer template. Template upgrades evolve the root application; they do not recreate its internal packages.
