# @nocobase/create-module

Open-source generator for `@nocobase/app-module-<name>` packages inside an installed NocoBase 3 App. It uses the existing plugin runtime and the open-source [Modules plugin](../../plugins/app-plugin-modules/README.md). No commercial package or Pro example library is required.

This source-workspace addition is not yet a published release. In a workspace that provides the generator, run from the host App:

```bash
pnpm exec create-module samples --title Samples --title-zh 样本管理 --dry-run --json
pnpm exec create-module samples
pnpm exec create-module samples --template records
pnpm exec create-module @acme/app-module-inventory
```

The host must declare `@nocobase/app-plugin-modules` and register its Server entry before generating a module. `@nocobase/app-cli` must support scoped `app-module-*` registration. The generator rejects an incompatible host before writing. Its development dependencies include the generator; it is not a production runtime dependency.

The default command generates sources, installs dependencies, registers Client and Server entries through the App CLI, and formats the new package. It does not start a server or execute database tasks. Restart or rebuild the App to load the module. Without management, registered modules initialize and start with the App. If the host adds commercial module management, the host's policy and persisted installation state control availability; generated module source contains no installation policy or seed.

## Templates and options

- `minimal` (default): descriptor, layout, overview, translations and Server registration, without a business table.
- `records`: a self-contained records table, protected list/create API and page. It uses OSS authentication, authorization and mutation receipts. It does not import `@example/module-records` or seed demonstration records.
- `--no-install`: generate only; follow the returned installation and registration commands.
- `--dir /path/to/app`: select another installed host App.
- `--dry-run --json`: inspect planned paths without writing or installing.

Generated routes initially require an unrestricted administrator. Replace this policy with explicit domain permissions before extending access. Every new endpoint must retain its own authentication, authorization and module availability checks, including mutation replay checks. The records template is a small starting point, not a complete domain data model.

Generated database tasks use `database/main/migrations` and `database/main/seeds`, declared through `database.connections.main`. To use another connection, configure it in the host, add its module directories and declare its name in the Server plugin. Do not rewrite executed migration/seed files when moving an existing module to this layout.

Client layouts work without a custom shell. A host can optionally supply `ModuleLayoutHost` and must include module sources in Tailwind scanning. Existing packages are never overwritten. If installation fails after generation, keep the generated sources and use the reported recovery commands rather than creating the same package again.

## Maintenance and verification

The generator reuses `@nocobase/create-plugin` rendering, dependency resolution and atomic project edits. It uses that package's internal rendering API, so both packages must be verified together when upgrading.

```bash
pnpm --filter @nocobase/create-module check
```

Tests generate both templates in isolated OSS App fixtures, compile and lint the output, seal database manifests, exercise CLI registration/removal and Skills ownership, and verify the generated records API against real authentication, authorization and SQLite storage.
