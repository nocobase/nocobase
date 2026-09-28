# @nocobase/create-app

Creates a NocoBase 3 application.

```bash
npm_config_registry=https://npm.nocobase.ai pnpm create @nocobase/app crm
```

`pnpm create @nocobase/app` resolves to the `@nocobase/create-app` package and runs it, forwarding every argument after the package name verbatim.

## Why `npm_config_registry` is needed

Two downloads happen, at different stages, each reading a different setting:

```
Stage 1  pnpm resolves the @nocobase/create-app package from a registry
         ← npm_config_registry decides this, before any of our code runs

Stage 2  create-app runs and downloads the application template
         ← --registry decides this, and already defaults to https://npm.nocobase.ai
```

This package is published only to the self-hosted registry, while `pnpm create` resolves package names from the public npm by default, so stage 1 has to be pointed at it or the command fails outright:

```
ERR_PNPM_FETCH_404  GET https://registry.npmjs.org/@nocobase%2Fcreate-app: Not Found
```

`pnpm create` does not accept `--registry` itself — after the package name it is forwarded to this program, and before the package name it is read as part of the name. So it has to be an environment variable, or a one-time entry in `~/.npmrc`:

```
@nocobase:registry=https://npm.nocobase.ai
```

After that the prefix is no longer needed. This whole section stops applying once the package is published to the public npm.

Note that `--registry` is not a substitute: that flag belongs to this program and is parsed only after the process starts, whereas a stage 1 failure means the process never started. Conversely, stage 2 already defaults to the self-hosted registry, so `--registry` is rarely needed day to day.

## About dist-tags

**Do not append `@beta` to the package name.** For now the `beta` tag points at the oldest published version rather than the newest:

```
latest: 0.1.0-beta.1   ← the most recent release
beta:   0.1.0-beta.0   ← the first release, untouched since
```

This is changesets behavior: a package whose published versions are all prereleases is treated as publishing for the first time, so the tag goes to `latest` to keep the package installable with `npm install`, and not to `beta`. That holds on every release until a stable version ships, which is why `beta` stayed on the first one and `latest` is the newest.

The problem resolves itself once a stable version is published, at which point `beta` starts tracking again.

To check the current state:

```bash
npm view @nocobase/create-app dist-tags --registry=https://npm.nocobase.ai
```

For the same reason, `--template-tag` also defaults to `latest`.

## Interactive use

With no arguments, the command asks for the directory and nothing else:

```bash
npm_config_registry=https://npm.nocobase.ai pnpm create @nocobase/app
```

## Flags

| Flag             | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `[directory]`    | Application directory, relative to the current one. Prompted for when omitted            |
| `--json`         | Non-interactive mode; requires a directory and prints one final JSON result              |
| `--no-install`   | Skip installing dependencies after scaffolding                                           |
| `--template`     | Template, `default` by default. Also accepts a published package or a local package path |
| `--template-tag` | Channel a named template is fetched from: `latest` (default) or `beta`                   |
| `--registry`     | Registry the template is downloaded from, `https://npm.nocobase.ai` by default           |
| `-h, --help`     | Show help                                                                                |
| `--version`      | Show the version                                                                         |

`--template` supports three names: `default` (the default application), `examples` (the example application), and `hub` (an application hub), each pointing at the corresponding `@nocobase/app-template-*` package.

```bash
pnpm create @nocobase/app crm --template=default   # the default, can be omitted
pnpm create @nocobase/app examples --template=examples
pnpm create @nocobase/app hub --template=hub
```

`--template-tag` decides which channel a named template is fetched from, `latest` by default:

```bash
pnpm create @nocobase/app crm --template-tag=beta
```

**Note that `beta` currently fetches the oldest version rather than the newest**, for the reason described above. Use it only when you specifically want that version.

Any other value is used as given, so a specific version or a local directory works as usual. `--template-tag` is ignored in that case: you have already said which version you want, and appending a channel would override the more specific request.

```bash
pnpm create @nocobase/app crm --template=@nocobase/app-template-default@1.0.0-beta.24
pnpm create @nocobase/app crm --template=./packages/templates/app-template-default
```

Dependencies are installed automatically; `--no-install` skips that. Generated `pnpm-workspace.yaml` defaults to `verifyDepsBeforeRun: false`, so `pnpm dev`, `pnpm build`, and `pnpm start` do not implicitly install dependencies. Run `pnpm install` explicitly after changing dependencies, or before starting an app created with `--no-install`. An explicit template setting is preserved. Existing applications can add `verifyDepsBeforeRun: false` to their own `pnpm-workspace.yaml`.

## What gets generated

The template is downloaded (`@nocobase/app-template-default@latest` by default) and, on top of it:

- `package.json` is rewritten: the application's own name and display name, publish metadata dropped so it cannot be released by accident, and `packageManager` pinned to a pnpm that reads `allowBuilds`
- `.npmrc` records the registry the template came from, scoped to `@nocobase`, so later installs in the project resolve NocoBase packages from the same place; it is omitted for the public npm
- `.gitignore` is written when the template ships none, so the `config.yml` that `config init` later writes cannot be committed
- `pnpm-workspace.yaml` gets its `allowBuilds` decisions (see below)
- A hub additionally gets `.env`, copied from the template's `.env.example`
- Dependencies are installed (skip with `--no-install`)
- The application's own `pnpm nocobase skills sync` runs, copying skills from its direct `@nocobase/*` dependencies and registered plugins into `.agents/skills/`. This has to come after the install, because the sync resolves packages out of `node_modules`. A failure is only a warning; the generated application still runs, and the command can be re-run in the application directory at any time.

## Configuring the application

Creation stops at a project that can be configured, not at one that can run. The application has no `config.yml` yet, and `pnpm dev` and `pnpm start` refuse to run without one. Three commands of the application's own take it from there — `config init` writes the file, `config set` changes it, and `config check` checks it:

```bash
cd crm
pnpm nocobase config init
pnpm nocobase config check
pnpm dev
```

`config init` writes `config.yml` from the template's `config.example.yml`, keeping its comments, and fills in `auth.secret` and `session.secret`. It is part of the application rather than of this command, so it is also how an application is configured on a server. Run again on a configured application it leaves the file alone and reports it unchanged.

The templates depend on `@nocobase/db-sqlite`, which is the dialect their own `server/config/database.ts` defaults to, so a new application is ready to configure without installing anything. Another database means installing its driver first, because which dialects an application can run on is decided by what it depends on, and then filling in the connection:

```bash
cd crm
pnpm add @nocobase/db-postgres
pnpm remove @nocobase/db-sqlite   # optional, if nothing else uses SQLite
pnpm nocobase config init --dialect postgres
pnpm nocobase config set database.connections.main.host=db.internal database.connections.main.username=crm
pnpm nocobase config set --from-env database.connections.main.password=CRM_DB_PASSWORD
pnpm nocobase config check
```

`config init` installs nothing. A dialect whose driver is absent is reported with the `pnpm add` that supplies it, pinned to the range the installed runtime accepts, and nothing is written — so the command can simply be run again once the driver is there. It writes placeholder connection settings for anything but SQLite and lists them as `requiredSettings`; on a terminal it asks for them instead, reading the password without echo, and tries the connection before writing. Other connections are left exactly as the template declared them, including the Examples template's additional SQLite databases.

`config set` keeps the file's comments, refuses a section the application does not know, and with `--from-env` reads a value from an environment variable so a secret never reaches the shell history. `config check` loads the configuration the way a start would and connects to every database but SQLite; it reports a driver that is missing, a secret that is missing or still the placeholder, a section nothing reads, and a `${NAME}` that would be used as literal text.

## Agent output

```bash
pnpm create @nocobase/app crm --json
```

JSON mode never prompts. It writes one final JSON document to stdout and progress to stderr, in the same envelope as `pnpm nocobase … --json`: `{ schemaVersion: 1, ok, command: "create-app", status, result | error, warnings }`. A success has `status: "success"` and a `result` with `directory`, `projectCreated`, `dependenciesInstalled`, `configured`, `nextCommands` and `message`. A failure has `status: "failure"` and an `error` with a `code`, a `message`, `suggestions`, and `details` naming the `stage` it stopped at, the `directory`, and whether the project was created and its dependencies installed. `--help --json` and `--version --json` return `result.help` and `result.version`.

| `error.code`                 | `details.stage` | Meaning                                                                                |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| `INVALID_USAGE`              | `input`         | The arguments were not accepted; nothing was created.                                  |
| `TEMPLATE_DOWNLOAD_FAILED`   | `download`      | The template could not be downloaded from the registry; nothing was created.           |
| `SCAFFOLD_FAILED`            | `scaffold`      | The project could not be written, for example because the directory is already in use. |
| `INSTALL_FAILED`             | `install`       | The project exists, but `pnpm install` failed; retry it inside the project.            |
| `DRIVER_VERIFICATION_FAILED` | `verify`        | The database driver's native addon did not load, even after a rebuild.                 |
| `NODE_UNSUPPORTED`           |                 | Node.js is older than 24; nothing ran.                                                 |

`result.nextCommands` is the whole remaining procedure in order, so an agent can run it as written rather than reconstructing it from prose. It always begins with `pnpm nocobase config init` and `pnpm nocobase config check`, preceded by `pnpm install` after `--no-install`, and a Hub ends with `pnpm build` and `pnpm start` instead of `pnpm dev`. `config init --json` returns the rest the same way: `result.nextCommands`, and `result.requiredSettings` for a database whose connection still has to be filled in.

Success exits with 0, invalid input with 2, and operational failures with 1. An install failure preserves generated files, and its suggestion is the `pnpm --dir <directory> install` that retries it in the existing directory from wherever it is run. `configured` is always `false`: creation writes no configuration, and nothing here verifies a database connection. The CLI never starts the application itself.

## About native install scripts

pnpm 11 does not run a dependency's install script unless the package is listed under `allowBuilds` in `pnpm-workspace.yaml`. The `pnpm` field in `package.json` was removed in pnpm 11 and `.npmrc` has never carried build settings, so that file is the only entry point.

Without it `better-sqlite3` — which every template pulls in through `@nocobase/db-sqlite` — installs without compiling its native addon, `pnpm install` still reports success, and the first query throws `Could not locate the bindings file`. The generated `allowBuilds` also covers `oracledb`, so switching the application to Oracle later just works, and `esbuild`. `pg`, `mysql2`, and `tedious` are pure JavaScript and need no build permission.

There is one more failure mode: `ignore-scripts=true` in an npm configuration suppresses install scripts globally and outranks `allowBuilds`. After installing, create-app loads the driver once to verify it, and re-runs `pnpm rebuild <driver>` when it installed but will not load — `pnpm rebuild` targets one package and works without changing the global setting. Only if that fails is the user told, with a command they can run themselves.

(Note that `pnpm install --config.ignore-scripts=false` does not help here: the package is already in the store, so pnpm skips it and reports success without compiling anything. It has to be `pnpm rebuild`.)

## Development

```bash
node ./bin/run.js crm            # runs the sources directly; Node 24 strips the types
pnpm --filter @nocobase/create-app build
pnpm --filter @nocobase/create-app check    # lint + format + typecheck + test + build
```

`bin/run.js` picks its mode automatically: it loads `src/` when `src/create.ts` is present, and `dist/` once the package is installed from a registry. A published install has to use `dist`, because Node refuses to strip types from a file under `node_modules`. Set `NOCOBASE_CREATE_APP_USE_DIST=1` to force the published shape from a source checkout.

When developing a template, point `--template` at a local directory:

```bash
node ./bin/run.js crm --template ../../templates/app-template-default
```

A local directory is packed with `pnpm pack`, which resolves `workspace:` and `catalog:` into real version ranges, so the generated project installs outside the repository too.

Post-install native dependency verification checks `better-sqlite3` when present. It does not verify other selected drivers or database connectivity. Non-SQLite creation reports this limitation in its output and JSON `warnings`; configure `database.connections.main` in `config.yml` and verify startup against the target database.
