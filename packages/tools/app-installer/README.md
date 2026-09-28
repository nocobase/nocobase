# @nocobase/app-installer

Installs, upgrades and rolls back a NocoBase 3 application on a server, and runs it under pm2. It takes one of two sources, fixed when the application is installed:

- **A deployment archive** you build in the application project with `pnpm build --tar`. The server unpacks it and runs it; it needs neither the sources nor pnpm. This is how an application of your own is deployed without a Hub.
- **The published Hub template**, `--template hub`, for a Hub whose source you do not change. The installer generates the Hub from `@nocobase/app-template-hub`, builds it on the server and keeps only the deployment archive. A Hub you customise is an application project: create it with `pnpm create @nocobase/app hub --template=hub` and deploy its archive like any other.

Each installation lives in a directory of its own, with its own port and pm2 process, so one server can run several. A Hub deployed from an archive — a Hub project of your own — is recognised as a Hub by its manifest and treated like one built from the template: its hosted applications stop with it, and pm2 leaves its App Host child to it. Docker remains the other way to run an application without a Hub.

## Requirements

- Linux or macOS. On Windows, use WSL: switching releases relies on symbolic links and atomic renames.
- Node.js 24 or later. `--template` also needs pnpm 11 or later.
- pm2 4.3 or later, installed globally (`npm install -g pm2`), to start the application. A copy fetched through `npx` does not work, because `pm2 startup` writes a boot service that names pm2's own path.

NocoBase 3 packages are published to `https://npm.nocobase.ai` rather than the public npm registry, so every command below names that registry for `npx`. Add `--yes` before `--registry` to skip npx's own install prompt, as a script or an agent has to. The suggestions in an error, and the examples in `--help`, are written the same way and run as they are.

`--template` builds the Hub on the machine it runs on, which takes several minutes; give `install` and `upgrade` a timeout to match when a script or an agent runs them.

## Building an archive

In the application project, build for the server rather than for the machine you build on, and copy the archive over:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

`--target` and `--node-version` must match the server: native modules are compiled for one platform, architecture, C library and Node major, and the installer refuses an archive built for another. The build is not tied to a mount path: the installation chooses it with `--base-path`. A database other than SQLite needs its driver in the project before the build (`pnpm add @nocobase/db-postgres`), since an archive carries the drivers it was built with. The archive records in `dist/package.json` that it is relocatable, and when it was built. An archive from an `@nocobase/app-cli` that predates relocatable builds records the base path it was compiled for instead, and runs only at that path; one older still records neither, and is refused until the project upgrades it and builds again.

## Install

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub --template hub --origin https://apps.example.com
```

The target must be new or empty. Before writing anything, the command also checks that the port is free — naming a free one when it is not — that no pm2 process already uses the name (`pm2 start` on a taken name would restart that process with this installation's configuration rather than start a new one), and that every variable named by `--set-from-env` is set. It then unpacks the archive, or resolves the template version and builds it in a temporary build directory, into a release directory; writes the configuration; applies the database migrations; and starts the application with pm2, waiting until its health check answers or pm2 reports the process as crashed. Anything it wrote is removed again if it fails before the application is switched on, so running it again starts clean — with `--keep-source`, the build directory is kept for inspection and has to be removed before retrying.

Ctrl-C (or SIGTERM) stops the step that is running and lets that cleanup happen; a second one exits at once.

| Flag               | Default                     | Purpose                                                                                                                                                |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--dir`            |                             | The target, as the other commands name it; the same as the directory argument.                                                                         |
| `--archive`        |                             | The deployment archive to install, by local path. Give this or `--template`.                                                                           |
| `--template`       |                             | `hub`, or `hub@<version or dist-tag>` (`latest` by default), to build the published Hub here. Give this or `--archive`.                                |
| `--origin`         | `http://HOST:PORT`          | Public origin without the base path. Set it before exposing the application.                                                                           |
| `--base-path`      | the server's, `/main`       | Where the application is mounted, such as `/crm`, or `/` for the origin root; `/hub` for a Hub, from the template or an archive. Written to `app.env`. |
| `--host`, `--port` | `127.0.0.1`, `13000`        | Where the application listens. Keep the loopback default behind a reverse proxy; give each installation its own port.                                  |
| `--dialect`        | `sqlite`                    | Database. Anything else needs `--set`; an archive must carry `@nocobase/db-<dialect>`, a template build adds it.                                       |
| `--set`            |                             | `key=value` passed to `nocobase config set`, repeatable. Values are YAML scalars.                                                                      |
| `--set-from-env`   |                             | `key=VARIABLE` read from the environment, repeatable. Use it for passwords.                                                                            |
| `--registry`       | `https://npm.nocobase.ai`   | Registry for the template, NocoBase packages and suggested commands; `NOCOBASE_REGISTRY` also sets it.                                                 |
| `--name`           | `nocobase-<directory name>` | pm2 process name.                                                                                                                                      |
| `--no-start`       |                             | Install without starting; the result names the command that starts it.                                                                                 |
| `--health-timeout` | `180`                       | Seconds to wait for the health check.                                                                                                                  |
| `--keep-source`    |                             | With `--template`, keep the build directory, with the sources and development dependencies, even on failure.                                           |
| `--json`           |                             | Print one JSON result on stdout. Progress always goes to stderr.                                                                                       |

A PostgreSQL Hub, with the password taken from the environment:

```bash
HUB_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub \
  --template hub --origin https://apps.example.com --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=hub \
  --set-from-env database.connections.main.password=HUB_DB_PASSWORD
```

`--set` values are read as YAML scalars by `nocobase config set`: `0123` becomes the number `123` and `no` becomes `false`, so quote text that looks like either, as in `--set 'key="0123"'`. Values are masked in the installer's own output, but a secret passed with `--set` is still visible to other users in the process list while the command runs; pass secrets with `--set-from-env`.

Afterwards, run `pm2 startup` once and execute the command it prints so pm2 restarts the application after a reboot, and proxy the origin to the application's port with `location /` (a Hub also needs `client_max_body_size 260m`). Several installations behind one origin are told apart by their base paths. The first sign-in comes from `users.initialAdmin` in `config.yml`. The result's `initialAdmin` names that account's username and email, and `defaultPassword` says whether its password is still the template's (`admin123`), to be changed after signing in; the password itself is never printed.

## Upgrade

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/hub
```

An upgrade takes the kind of source the install did. An archive installation moves to the archive given with `--archive`, which must hold the same application (its package name owns the migration history) and not an older version; an archive from before relocatable builds must also have been built for the path `app.env` mounts. A template installation moves to `latest`, or to the version or dist-tag given with `--to`.

Every build is a release of its own, named by its version and UTC build time, as in `0.3.0_20260927T005500Z`, so deploying a project without bumping its version is still an upgrade. An archive already on disk is reused, and the one already running changes nothing.

Everything that takes time happens while the current release keeps serving: the new release is unpacked or built beside it, then checked with its own CLI — `config check`, and `db apply --dry-run` to count the pending migrations. Only then does the downtime start: the application is stopped, its SQLite databases, `config.yml` and `app.env` are copied to `backups/<time>_<from>_to_<to>/`, `current` is switched, the migrations are applied, and the new release is started and must pass its health check. Stopping a Hub stops every application it hosts, and deployments in progress are marked failed.

If migrating or starting the new release fails, the upgrade rolls itself back: `current` returns to the previous release, the databases are restored from the backup when the new release may have migrated them, and the previous release is started again. The command then exits with code `3`. If the previous release does not come back either, it exits with `4`, keeps the new release on disk, and leaves the operation pending, so `rollback` finishes the job once the cause is fixed.

A version older than the running one is refused: the older release knows nothing of the newer migrations. Going back is what `rollback` is for. The pm2 process named in `installer.json` must belong to this installation, and once the application is stopped its port must be free, so the health check cannot be answered by anything but the new release.

| Flag               | Default  | Purpose                                                                                                              |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `--archive`        |          | Archive installation: the new archive, by local path. Required there, refused for a template installation.           |
| `--to`             | `latest` | Template installation: version or dist-tag, not older than the running one. A build of it already on disk is reused. |
| `--rebuild`        |          | Template installation: build the target again even when a build of it is on disk; alone, the installed version.      |
| `--keep-source`    |          | Template installation: keep the build directory.                                                                     |
| `--backup-done`    |          | Required when `config.yml` names a database the installer cannot back up — any but SQLite: back it up yourself.      |
| `--keep`           | `3`      | Releases to keep on disk (at least 2). The new release and the one upgraded from are always kept.                    |
| `--health-timeout` | `180`    | Seconds to wait for the new release's health check.                                                                  |
| `--yes`            |          | Proceed without the confirmation prompt; required with `--json` or without a terminal.                               |
| `--json`           |          | Print one JSON result on stdout.                                                                                     |

The backup covers what rolling back needs: every SQLite database `config.yml` declares, with its journals, and the configuration. It is not a replacement for regular backups of `storage/`, whose uploaded files it leaves out, and backups are not pruned: remove old ones from `backups/` yourself. Upgrading a Hub migrates only the Hub's own database, not those of the applications it hosts.

When the machine's Node major changes, a release's native modules no longer load, and `status` says so. For an archive installation, build the archive again with the new `--node-version` and upgrade to it. For a template installation, an upgrade to a newer version builds for the new Node by itself; when the Hub is already on the latest version, `upgrade --rebuild` builds the installed version again for this machine, as a release of its own, switched to through the same steps and the same backup as any upgrade. The release it replaces stays on disk but cannot be rolled back to, since it was built for another Node. A rebuild interrupted while the Hub is down is finished by running it again.

## Rollback

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/crm
```

Returns to the release the last upgrade came from, or to `--to`, which takes a release id or a version (the newest build of it) among the releases on disk. When the upgrade being undone applied migrations, the SQLite databases are restored from the backup taken before it, which discards whatever was written since; `--no-restore` keeps the current databases instead. An external database is never in a backup, so nothing is restored for it and the command says so: restore it from your own backup. Rolling back never runs migrations backwards. A release built for another Node major is refused, since its native modules would not load; the error says how to get one that does.

If the release it returns to does not start, the rollback stays pending, and running `rollback` again retries it — restore included — once the cause is fixed.

If an upgrade or rollback is interrupted while the application is down, `installer.json` records it: `status` warns, `upgrade` refuses to start, and `rollback` recovers. It undoes an interrupted upgrade — restoring the databases only when the upgrade had already switched releases, since before that nothing was migrated — and finishes an interrupted rollback.

## Status

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/crm
```

Reports the application, its source, the running release with its version and build time, its `endpoints` — the public URL and origin, and the host and port it listens on — whether it answers its health check, the pm2 process, the releases on disk and their size, and whether the machine's Node major still matches the one the release was built for. For a template installation it also asks the registry whether a newer version is published (`--offline` skips that). It changes nothing, and does not start the pm2 daemon when it is not running.

## Changing the origin or port

`app.env` holds where the application is reached and where it listens: `APP_PUBLIC_ORIGIN`, `APP_BASE_PATH`, `APP_SERVER_HOST` and `APP_SERVER_PORT`. Edit them there and restart the process under its pm2 name, `nocobase-<directory name>` unless `--name` chose another:

```bash
pm2 restart nocobase-crm
```

`launcher.mjs` reads `app.env` every time the process starts, so nothing needs registering again. A new port must be free, and a reverse proxy has to forward to it. Every app-installer command reads the same file, so `status` and the next `upgrade` check health at the new address. A new `APP_BASE_PATH` takes effect the same way, since a current build is not tied to a mount path; the reverse proxy has to route the new path. A release from before relocatable builds runs only at the path it was built for, so `upgrade` and `rollback` refuse one that does not match `app.env`.

## Layout

```text
/srv/nocobase/crm/
├── app.env               runtime variables, read by pm2 and by every app-installer command
├── config.yml            written by `nocobase config init`, shared by every release
├── storage/              APP_STORAGE_DIR: databases, uploaded files and anything else the application keeps
├── logs/                 app.out.log and app.err.log, collected by pm2
├── ecosystem.config.cjs  the pm2 configuration every start goes through
├── launcher.mjs          what pm2 runs: reads app.env and starts the release current points at
├── releases/<version>_<time>/app/  dist/ and config.example.yml from the deployment archive
├── current -> releases/<version>_<time>/app
├── backups/              databases and configuration copied before each upgrade
└── installer.json        what the installer knows: application, base path, kind, source, releases, history
```

`APP_CONFIG_FILE` and `APP_STORAGE_DIR` in `app.env` are absolute. A built server treats the directory above `dist/` as its deployment root and would otherwise keep its configuration and data inside the release directory; a release too old to read `APP_STORAGE_DIR` does exactly that, and the installer refuses it.

pm2 runs `node launcher.mjs` (`interpreter: 'none'`), and on every start `launcher.mjs` reads `app.env`, resolves `current` and replaces itself with `node <release>/dist/server/standalone.js` through `process.execve`. The application therefore keeps the pid pm2 watches, receives pm2's signals directly, and runs as the main module; pointing pm2's `script` at `standalone.js` instead would load it through pm2's own wrapper, where `import.meta.main` is false, and the application would never start. Because nothing about the release or its variables is fixed when pm2 registers the process, a plain `pm2 restart` applies a switched `current` or an edited `app.env`. `install` writes both files once; edits to them are kept. Node flags for the application, such as `--max-old-space-size=4096`, go in `args` before `launcher.mjs`, which passes them on, or in `NODE_OPTIONS` in `app.env`; pm2's `node_args` does not apply to an `interpreter: 'none'` process. The launcher's IPC channel from pm2 does not survive `process.execve`, so `wait_ready` and `shutdown_with_message` are not available.

## Exit codes

| Code | Meaning                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `0`  | Success.                                                                                                               |
| `1`  | The operation failed. An application that was already running was not touched.                                         |
| `2`  | Invalid usage, a failed precheck — including an unsupported Node.js — or a declined confirmation; nothing was written. |
| `3`  | An upgrade failed after the switch and was rolled back; the previous release is running.                               |
| `4`  | Rolling back failed as well; the application is down and the error lists what to do.                                   |

## Error codes

Under `--json`, a failure prints `ok: false` and `status: "failure"` with `error.code`, a message, `error.suggestions` and, where there is any, `error.details`: the same envelope as the application CLI's `pnpm nocobase … --json`. A suggestion's `run`, where it has one, is `{ command, args }`, an executable and its arguments to run as given, without a shell; a step that takes two commands is two suggestions. Codes are stable; branch on them rather than on the message.

| Code                    | Exit       | Meaning and what to do                                                                                                                                                                                                                                                                                    |
| ----------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_USAGE`         | `2`        | An unknown command or flag, a malformed `--set`, an `--origin` with a path, no install directory, neither or both of `--archive` and `--template`, a template other than `hub`, an `--archive` URL, or an upgrade flag for the other kind of source. Fix the command line.                                |
| `NODE_UNSUPPORTED`      | `2`        | Node.js is older than 24. Install Node.js 24 or later.                                                                                                                                                                                                                                                    |
| `PLATFORM_UNSUPPORTED`  | `2`        | Windows. Run the installer inside WSL.                                                                                                                                                                                                                                                                    |
| `PNPM_MISSING`          | `2`        | `--template` needs pnpm, which is not on PATH. Install pnpm 11 with corepack, as the suggestion shows.                                                                                                                                                                                                    |
| `PNPM_UNSUPPORTED`      | `2`        | pnpm is older than 11.                                                                                                                                                                                                                                                                                    |
| `PM2_MISSING`           | `2`        | pm2 is not on PATH. Install it globally, or install with `--no-start`.                                                                                                                                                                                                                                    |
| `PM2_UNSUPPORTED`       | `2`        | pm2 is older than 4.3, which does not read `ecosystem.config.cjs`, or `pm2 --version` printed no version. Update it globally, then run `pm2 update`.                                                                                                                                                      |
| `PM2_NAME_IN_USE`       | `2`        | Another process owns the pm2 name. Choose another with `--name` when installing; for an installation, stop or rename that process.                                                                                                                                                                        |
| `PORT_IN_USE`           | `2`        | Something already listens on the host and port. When installing, `details.freePort` and the suggestion name a free port; otherwise stop what holds it.                                                                                                                                                    |
| `ENV_MISSING`           | `2`        | A variable named by `--set-from-env` is not set.                                                                                                                                                                                                                                                          |
| `TARGET_NOT_EMPTY`      | `2`        | The install target holds files, or is a file. Install into a new or empty directory; an installation is managed with the other commands.                                                                                                                                                                  |
| `NOT_INSTALLED`         | `2`        | The directory holds no `installer.json`. Run from the installation root, or name it with `--dir`.                                                                                                                                                                                                         |
| `STATE_UNSUPPORTED`     | `2`        | `installer.json` was written by a newer app-installer. Run the latest one.                                                                                                                                                                                                                                |
| `LOCKED`                | `2`        | Another app-installer is working on this installation. Wait for it to finish.                                                                                                                                                                                                                             |
| `REGISTRY_UNREACHABLE`  | `2`        | The registry could not be read. Check the network or `--registry`.                                                                                                                                                                                                                                        |
| `VERSION_NOT_FOUND`     | `2`        | No such template version or dist-tag; `details` lists the tags and recent versions.                                                                                                                                                                                                                       |
| `ARCHIVE_NOT_FOUND`     | `2`        | `--archive` names no file.                                                                                                                                                                                                                                                                                |
| `ARCHIVE_INVALID`       | `2`        | The archive holds no `dist/package.json`: it is not one `pnpm build --tar` wrote.                                                                                                                                                                                                                         |
| `CONFIG_UNREADABLE`     | `2`        | `config.yml` could not be read as YAML, so the databases an upgrade would have to back up are unknown. Fix the file; nothing was changed.                                                                                                                                                                 |
| `ARCHIVE_TOO_OLD`       | `2`        | The archive records neither that it is relocatable nor its base path, or not its build time. Upgrade `@nocobase/app-cli` in the project and build it again.                                                                                                                                               |
| `DRIVER_MISSING`        | `2`        | The archive lacks `@nocobase/db-<dialect>` for the chosen dialect. Add it to the project and build again.                                                                                                                                                                                                 |
| `APP_MISMATCH`          | `2`        | The archive holds another application than the one installed. Install it into a directory of its own.                                                                                                                                                                                                     |
| `BASE_PATH_MISMATCH`    | `2`        | A release from before relocatable builds was built for another path than `--base-path` or `app.env` names. Build it again with a current `@nocobase/app-cli`, which runs at any path.                                                                                                                     |
| `CONFIRMATION_REQUIRED` | `2`        | `upgrade` or `rollback` needs consent, and `--json` or the lack of a terminal leaves no prompt to ask on. `details.notes` says what the operation does; pass `--yes` once that is accepted.                                                                                                               |
| `CANCELLED`             | `2`        | The confirmation prompt was declined. Nothing changed.                                                                                                                                                                                                                                                    |
| `OPERATION_INTERRUPTED` | `2`        | An earlier upgrade or rollback stopped while the application was down. Run `rollback` to recover before anything else, or run an interrupted `--rebuild` again.                                                                                                                                           |
| `DOWNGRADE`             | `2`        | The target is an older version than the running one. Use `rollback --to`.                                                                                                                                                                                                                                 |
| `BACKUP_REQUIRED`       | `2`        | `config.yml` names a database the installer cannot back up. Back it up, then pass `--backup-done`.                                                                                                                                                                                                        |
| `DISK_LOW`              | `2`        | Less than about 2 GB free for a template build. Free space, or lower `--keep`.                                                                                                                                                                                                                            |
| `NOTHING_TO_ROLL_BACK`  | `2`        | No upgrade led to the current release. Name a release on disk with `--to`.                                                                                                                                                                                                                                |
| `RELEASE_MISSING`       | `2`        | The release to return to is not on disk; `status` lists those that are.                                                                                                                                                                                                                                   |
| `NODE_MISMATCH`         | `2`        | The release was built for another Node major, so its native modules would not load; the suggestions say how to get one that does.                                                                                                                                                                         |
| `BUILD_TARGET_MISMATCH` | `2` or `1` | The release was built for another platform or Node major than this machine: an archive (exit `2`, with the build command that fits) or, unexpectedly, a template build (exit `1`).                                                                                                                        |
| `CREATE_FAILED`         | `1`        | Generating the Hub project with `create-app` failed; `details.output` holds its output.                                                                                                                                                                                                                   |
| `DRIVER_INSTALL_FAILED` | `1`        | Adding the database driver to a template build failed; `details.output` holds pnpm's output.                                                                                                                                                                                                              |
| `BUILD_FAILED`          | `1`        | `pnpm build` failed; `details.output` holds its output.                                                                                                                                                                                                                                                   |
| `UNPACK_FAILED`         | `1`        | Unpacking the deployment archive failed.                                                                                                                                                                                                                                                                  |
| `STORAGE_IN_RELEASE`    | `1`        | The release wrote its data inside its own directory: its `@nocobase/app-server` predates `APP_STORAGE_DIR`. Upgrade it in the project and build again; an upgrade rolls back on it.                                                                                                                       |
| `APP_CLI_FAILED`        | `1`        | The release's own CLI printed no result. A failure it does report keeps its own code instead, such as `CONFIG_INVALID` from `config check`.                                                                                                                                                               |
| `START_FAILED`          | `1`        | The application is installed but did not pass its health check; `details.log` holds the end of its error log. Fix the cause and start it with the suggested command.                                                                                                                                      |
| `UPGRADE_ABORTED`       | `1`        | The upgrade stopped before switching releases and the previous release is running again; exit `4` when it did not come back.                                                                                                                                                                              |
| `ROLLBACK_ABORTED`      | `1`        | Stopping the application failed; nothing was restored or switched.                                                                                                                                                                                                                                        |
| `INTERRUPTED`           | `1`        | Ctrl-C or SIGTERM stopped the running step before the application was touched. An install removes what it wrote unless the application was already switched on; an upgrade removes the release it was building. Once an upgrade or rollback has stopped the application, it reports its own code instead. |
| `UNEXPECTED`            | `1`        | An error the installer does not recognise. The message is all there is; report it.                                                                                                                                                                                                                        |
| `UPGRADE_ROLLED_BACK`   | `3`        | The new release failed after the switch; the previous one runs again, on the restored databases when the new one may have migrated them.                                                                                                                                                                  |
| `ROLLBACK_FAILED`       | `4`        | The application is down. Follow the suggestions: read the log, fix the cause, and run `rollback` again, which retries the restore.                                                                                                                                                                        |
