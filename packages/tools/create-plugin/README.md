# @nocobase/create-plugin

Create a publish-ready NocoBase 3 application plugin inside the `packages/plugins/` directory of a NocoBase 3 source workspace. The command generates only the
capabilities explicitly selected by the caller.

```bash
pnpm create @nocobase/plugin audit-log \
  --with server.service-providers \
  --with server.routes \
  --with database \
  --with skills
```

The command accepts either a short kebab-case name such as `audit-log` or the
full package name `@nocobase/app-plugin-audit-log`.

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
  registry
  skills

OPTIONS
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
without choosing either one for the plugin. `client.routes` similarly supports
App and Settings Routes. `client.service-providers` generates application-owned
Client services and lifecycle hooks, while `client.react-providers` generates
React context composition owned by the rendered tree.

`server.jobs` adds a one-off background job in `server/jobs/`, a `Job` class from `@nocobase/jobs`, and the Server provider that owns the plugin's `JobExecutor` under its package name: it registers the job and sets the executor up in `start()`, and shuts it down in `shutdown()`. The application's `jobs` configuration decides the backend.

`cli` adds a CLI plugin in `cli/index.ts`, exported as `./cli`, with one example command under the topic derived from the package name; an application lists it in its `cli/plugins.ts` to get the commands. `--with all` selects every capability at once.

The generator derives Client and Server plugin declarations, package exports,
dependencies, tests, publication files, Registry scripts, and Plugin Skill
publication from the same capability model. It does not invent business routes
or rely on a complete example that must be deleted after generation.

Use `--dry-run --json` to inspect the exact read-only generation plan before
creating a plugin. Registering or enabling the generated plugin remains an
explicit step.

JSON mode emits one document on stdout for both success and failure, in the same envelope as `pnpm nocobase … --json`: `{ schemaVersion: 1, ok, command: "create-plugin", status, result | error, warnings }`. A success has `ok: true` and the plan under `result` — `mode`, `plugin`, `requestedCapabilities`, `capabilities`, `derivedStructure`, `files`, `writes`, `commands` and `nextSteps` — with `status: "success"`, or `"success-noop"` for a `--dry-run`, which writes nothing. A failure keeps a non-zero exit code and returns `ok: false` and `status: "failure"` with a stable `error.code`, the human-readable `error.message`, and `error.suggestions`, each a `{ message }`. `--help --json` and `--version --json` return `result.help` and `result.version`.

## Server resources and compiled database tasks

Generated Server declarations include the required absolute `baseDir`, calculated relative to `import.meta.dirname`. All filesystem contributions resolve against it. Keep source and published Server exports aligned so development loads source contributions and installed or built plugins load compiled contributions.

Plugins with the `database` capability run `nocobase-db-manifests` after TypeScript compilation. This command comes from `@nocobase/dev-config` and seals each migrations or seeds directory with `.manifest.json`. Run it after any JavaScript rewriting, keep generated manifests in the published `dist`, and clean stale output when removing or renaming task files.
