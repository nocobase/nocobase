# @nocobase/app-installer

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
