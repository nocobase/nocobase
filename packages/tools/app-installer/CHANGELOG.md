# @nocobase/app-installer

## 0.1.0-beta.10

### Patch Changes

- 7cb71ea: Wait for timed-out or interrupted command process groups to stop before returning, retaining forced termination for descendants that ignore SIGTERM and distinguishing zombies from processes that can still write.

## 0.1.0-beta.9

### Patch Changes

- 164abe7: Describe `--app` with a generic published application (`@acme/crm`) instead of NocoBase Studio in the installer's help, flag description, usage error and README, and in the deployment Skill. The option itself is unchanged and installs any published npm application.

## 0.1.0-beta.8

### Minor Changes

- 033a6dc: Preview migration and seed checksum changes before upgrade downtime and require explicit approval with `--repair-checksums <token>`. Back up SQLite history before repairing and restore it on failed, interrupted, or manually rolled-back upgrades, including upgrades with no pending migrations. Apply the same workflow to SSH deployments and report external databases that require operator restoration.

  Upgrade preflight now requires the target application's `db repair --dry-run --json` support and refuses unreviewed checksum drift even with `--yes`. JSON errors expose `error.details.checksumRepair` with the exact changes and approval token; successful upgrades add `result.checksumRepairs`.

  Checksum-repairing upgrades write installer state format 2 before modifying history, so older installers refuse recovery rather than skipping the restore. The new installer continues to read existing format 1 installations.

## 0.1.0-beta.7

### Minor Changes

- 5f851bb: Add SSH archive deployment and remote install, upgrade, rollback and status commands with an offline installer bundle. Transfer checksums, stdin-only secret transport and structured remote outcomes allow servers without npm access to reuse the existing installation lifecycle.

  Preserve remote confirmation and recovery guidance, route recovery commands to the correct host, and report locally interrupted SSH executions as an unknown remote state requiring a status check.

## 0.1.0-beta.6

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.
- Updated dependencies [cf23bfe]
  - @nocobase/cli-envelope@0.1.0-beta.1

## 0.1.0-beta.5

### Minor Changes

- 87b8394: Install published applications with `--app @nocobase/studio` or the official shorthand `--app studio`, preserving package identity while building and deploying on the server. Support npm application upgrades, explicit version selection and rebuilding with the existing backup and rollback workflow. Include Studio's shared sources and CLI skills in its published package so it builds outside the repository, and document the deployment route.

## 0.1.0-beta.4

### Minor Changes

- c796cb9: Remove NocoBase Hub. `@nocobase/app-plugin-hub`, `@nocobase/app-template-hub` and `@nocobase/hub-cli` are no longer published, and every package that offered or described the Hub drops it.

  Breaking for `@nocobase/app-installer`: it installs, upgrades and rolls back from a deployment archive only. `install --template`, `install --keep-source`, `upgrade --to`, `upgrade --rebuild`, `upgrade --keep-source` and `status --offline` are removed, as are the `latest` and `updateAvailable` members of the `status` result and the `rebuilt` and `notes` members of the `upgrade` result. An installation an earlier version built from the published Hub template is refused with `STATE_UNSUPPORTED`; manage it with the app-installer version that installed it. The error codes that only a template build reported (`PNPM_MISSING`, `PNPM_UNSUPPORTED`, `REGISTRY_UNREACHABLE`, `VERSION_NOT_FOUND`, `DISK_LOW`, `CREATE_FAILED`, `DRIVER_INSTALL_FAILED` and `BUILD_FAILED`) are no longer produced, and pm2 always kills the process tree of an application it stops.

  Breaking for `@nocobase/create-app`: `--template hub` is no longer a template name, and a generated application no longer gets a `.env`.

  The Default template no longer depends on `@nocobase/hub-cli`, so an application generated from it has no `pnpm nocobase hub` commands. An application upgraded from an earlier version that published to a Hub removes the dependency with `pnpm nocobase package remove @nocobase/hub-cli` and deletes `.nocobase/hub.json`; the `nocobase-app-upgrade` Skill describes the steps. The application Skills, the plugins' documentation and the in-app test notification text no longer mention the Hub.

## 0.1.0-beta.3

### Patch Changes

- a695d19: Use the public npm registry as the default source for NocoBase packages, templates, deployment commands, and generated application guidance.

## 0.1.0-beta.2

### Minor Changes

- a857a08: **Breaking for anything that parses `--json`.** The envelope now matches the application CLI's, so a script that reads `pnpm nocobase … --json` reads app-installer's the same way. A failure's `status` is `failure` instead of `error`, including the Node.js version check `bin/run.js` makes before anything else loads; tell success from failure by `ok`. A suggestion's `run` is `{ command, args }`, an executable and its arguments to run without a shell, instead of one shell line. A step that chained two commands with `&&` is now two suggestions: enabling corepack, then activating pnpm; updating pm2, then `pm2 update`; `pm2 start`, then `pm2 save`. Without `--json`, a suggestion still prints as one line that runs when pasted, with each argument quoted where a shell would split it. `status`'s warning about a release built for another Node no longer ends a step that has no command with `undefined`. A Hub built from its template reads create-app's new `--json` envelope, and still reads the flat result an earlier create-app prints.

### Patch Changes

- 9f75a27: The `--json` document is built by the new `@nocobase/cli-envelope` dependency rather than by a copy of the envelope kept here, and `bin/run.js` runs that package's Node.js guard. What is printed is unchanged, except that the guard's `command` is now the arguments before the first flag, as the application CLI's guard names it, where a leading flag used to be taken as the command.
- Updated dependencies [9f75a27]
  - @nocobase/cli-envelope@0.1.0-beta.0

## 0.1.0-beta.1

### Minor Changes

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

## 0.1.0-beta.0

### Minor Changes

- a4ee8aa: Add `@nocobase/app-installer`, which installs, upgrades and rolls back a NocoBase 3 application on a server and runs it under pm2. `install <dir>` takes one of two sources: `--archive`, a deployment archive built in the application project with `pnpm build --tar`, which the server unpacks and runs without the sources, pnpm or `tar`; or `--template hub[@version]`, which builds the published, unmodified Hub on the server. Each build becomes a release named by its version and build time under `releases/`, with `config.yml`, `app.env`, `storage/` and `backups/` shared by every release, so a project can deploy the same version again without bumping it. An archive built for another machine, without its base path and build time, or without the driver for the chosen database is refused with the build command that fixes it. `upgrade` moves to a new archive (the same application and base path, not an older version) or, for the Hub, to a newer template version or a `--rebuild` for the machine's Node; it builds or unpacks while the current release keeps serving, backs up every SQLite database `config.yml` declares, switches, migrates and starts, and rolls itself back if the new release fails. `rollback` returns to an earlier release, restoring the databases when the undone upgrade migrated them, and `status` reports the release, endpoints, health, pm2 process and releases on disk. Every command takes `--json`, and every suggested command runs as printed.

### Patch Changes

- 09b9589: A Hub installation no longer gets `HUB_STORAGE_DIR` in `app.env`: every Hub release from this one on reads `APP_STORAGE_DIR`. Installing an earlier Hub with `--template hub@<version>` is refused with `STORAGE_IN_RELEASE`.

## 0.0.1

### Minor Changes

- Install a NocoBase 3 application on a server from a deployment archive or the published Hub template, and report its state.
