# @nocobase/create-plugin

Create a NocoBase 3 plugin inside an existing application. First create and install your application with `pnpm create @nocobase/app my-app`, then run the generator from that application's root:

```bash
cd my-app
pnpm dlx @nocobase/create-plugin demo-tools --with cli --dry-run --json
pnpm dlx @nocobase/create-plugin demo-tools --with cli
pnpm --filter @nocobase/app-plugin-demo-tools check
pnpm nocobase plugin register @nocobase/app-plugin-demo-tools --no-install
pnpm nocobase demo-tools info --json
```

The generator creates `packages/app-plugin-demo-tools/`, ensures the pnpm workspace includes it, adds `workspace:*` to the application's dependencies, and installs the workspace. Runtime registration is a separate explicit step. No NocoBase source checkout is required. Read the dry-run plan before applying it; the target must not already exist.

App-local plugins start with `private: true`. Published plugins can later opt into publishing after reviewing their name, exports, compatibility and package contents. A full scoped name such as `@my-company/app-plugin-demo-tools` keeps that scope; pass the full name when registering it. Custom scopes require an App CLI version supporting them.

The current directory may be below the application root; `--dir` selects another application explicitly. The root is identified by the create-app manifest's `nocobase.templateKind: app`. In the NocoBase source repository, the same generator preserves the `packages/plugins/` layout and source-workspace dependencies, and remains available as `pnpm plugin:create`.

## Application dependencies and workspace settings

Install the application before creating plugins. The generator resolves dependency versions from the application's installed packages, including its runtime packages, and uses exact versions for external dependencies. Real local packages retain workspace references. Missing, ambiguous or incompatible dependencies fail before writing files: install a compatible dependency in the application, then retry. It does not choose unrelated latest versions from the registry.

Existing workspace settings and comments are preserved. The generator adds `packages/*` only when necessary, honors explicit exclusions, and rejects duplicate package names and existing application dependency declarations. `--no-install` writes the plugin and project changes without installing; run `pnpm install` before registration. An installation failure keeps generated files and project edits so installation can be retried without regenerating the plugin.

## Capabilities and options

```text
USAGE
  create-plugin <name> (--with <capability>... | --empty) [options]

CAPABILITIES
  database
  server.service-providers
  server.routes
  server.jobs
  server.locales
  client.routes
  client.components
  client.service-providers
  client.react-providers
  client.locales
  cli
  skills

OPTIONS
  --dir <directory>           Select an application or source workspace
  --with <capability>          Add a capability; may be repeated
                               all selects every capability listed above
  --empty                      Create only the package foundation
  --display-name <name>        Human-readable package display name
  --description <description>  Package description
  --no-install                 Do not synchronize pnpm-lock.yaml
  --dry-run                    Print the exact generation plan without writing
  --json                       Print a stable JSON result for tools and Agents
  --version                    Show the version
  -h, --help                   Show help
```

`database` includes the migrations and seeds structure.
`server.service-providers` includes ServiceProvider, Service, and Token
structure. `server.routes` supports both API and Root Route contributions
without choosing either one for the plugin. `client.routes` supports App Routes,
the only Client route type. `client.service-providers` generates application-owned
Client services and lifecycle hooks, while `client.react-providers` generates
React context composition owned by the rendered tree.

`server.jobs` adds a one-off background job in `server/jobs/`, a `Job` class from `@nocobase/jobs`, and the Server provider that owns the plugin's `JobExecutor` under its package name: it registers the job and sets the executor up in `start()`, and shuts it down in `shutdown()`. The application's `jobs` configuration decides the backend.

The `registry` capability is no longer supported. Editable UI is maintained in the UI Library.

`cli` adds a CLI plugin in `cli/index.ts`, exported as `./cli`, with one example command under the topic derived from the package name; an application lists it in its `cli/plugins.ts` to get the commands. `--with all` selects every capability at once.

The generator derives Client and Server plugin declarations, package exports, dependencies, tests, publication files, and Plugin Skill publication from the same capability model. It does not invent business routes or rely on a complete example that must be deleted after generation.

Use `--dry-run --json` to inspect the exact read-only generation plan before
creating a plugin. Registering or enabling the generated plugin remains an
explicit step.

JSON mode emits one document on stdout for both success and failure, in the same envelope as `pnpm nocobase … --json`: `{ schemaVersion: 1, ok, command: "create-plugin", status, result | error, warnings }`. A success has `ok: true` and the plan under `result` — `mode`, `plugin`, `project`, `projectEdits`, `dependencies`, `requestedCapabilities`, `capabilities`, `derivedStructure`, `files`, `writes`, `commands` and `nextSteps` — with `status: "success"`, or `"success-noop"` for a `--dry-run`, which writes nothing. A failure keeps a non-zero exit code and returns `ok: false` and `status: "failure"` with a stable `error.code`, the human-readable `error.message`, and `error.suggestions`, each a `{ message }`. `projectEdits` lists planned root-file contents even during a dry run; `writes` continues to list generated plugin files, while `dependencies` reports resolved dependency fields. Package-manager output goes to stderr so stdout remains one JSON document. `--help --json` and `--version --json` return `result.help` and `result.version`.

## Server resources and compiled database tasks

Generated Server declarations include the required absolute `baseDir`, calculated relative to `import.meta.dirname`. All filesystem contributions resolve against it. Keep source and published Server exports aligned so development loads source contributions and installed or built plugins load compiled contributions.

Plugins with the `database` capability run `nocobase-db-manifests` after TypeScript compilation. This command comes from `@nocobase/dev-config` and seals each migrations or seeds directory with `.manifest.json`. Run it after any JavaScript rewriting, keep generated manifests in the published `dist`, and clean stale output when removing or renaming task files.

## Installing client UI with shadcn

Every plugin with client code includes `components.json`, `client/styles.css`, shadcn tooling, and the `@nocobase` registry. Editable source is published by the UI Library. A component-only plugin can install UI directly:

```bash
pnpm dlx @nocobase/create-plugin feature-card --with client.components
cd packages/app-plugin-feature-card
pnpm exec shadcn add @nocobase/permission-editor --dry-run
pnpm exec shadcn add @nocobase/permission-editor
pnpm typecheck
pnpm build
```

Within this source repository, copy NocoBase registry items from their canonical sources to retain workspace dependency ranges; the commands above show the remote workflow for a consuming plugin. See `ui-library/USAGE.md` for application and plugin installation, dependencies, translations, and local registry verification.

The CLI writes package-local `#components/*`, `#hooks/*`, `#lib/*`, and `#extensions/*` imports using `components.json`. The generated manifest resolves development sources and compiled defaults; `tsconfig.json` selects `development`, while `publishConfig.imports` replaces all published targets with unconditional `dist/client` paths. No TypeScript `paths`, host Vite alias, or post-install import rewrite is needed. Keep client value dependencies as peers and exported declarations explicitly typed; newly fetched upstream primitives may need type annotations independently of their imports.
