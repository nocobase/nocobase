---
"@nocobase/app-cli": patch
---

Find an application's workspace packages from the `packages` globs of the nearest `pnpm-workspace.yaml`, with its `!` exclusions applied, instead of assuming the application sits at `packages/<group>/<app>`. An application at the repository root now builds with its unpublished workspace plugins vendored into `dist/`, watches them in `pnpm dev`, and can be selected with `--app` together with `--workspace-root`. Without a `pnpm-workspace.yaml` that declares `packages`, such as a generated application's own, the directory layout is scanned as before.
