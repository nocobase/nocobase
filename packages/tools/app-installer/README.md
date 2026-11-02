# @nocobase/app-installer

Installs, upgrades and rolls back a NocoBase 3 application on a server, and runs it under pm2. Use `--app <package>` to download and build a published application from npm on the server, or `--archive` to unpack a deployment archive built elsewhere with `pnpm build --tar`. Only npm application installs need pnpm (11 or later); neither route needs a repository checkout.

Each installation lives in a directory of its own, with its own port and pm2 process, so one server can run several. Docker remains the other way to run an application.

Earlier versions could also build the published Hub template on the server (`--template hub`). That source is gone: an installation recorded as built from a template is refused with `STATE_UNSUPPORTED`, and stays manageable with the app-installer version that installed it.

## Published applications

```bash
npx --yes --registry=https://registry.npmjs.org @nocobase/app-installer install /srv/nocobase/crm --app @acme/crm --origin https://crm.example.com
# Select a version or tag: --app @acme/crm@beta or --app @acme/crm@<version>
npx --yes --registry=https://registry.npmjs.org @nocobase/app-installer upgrade --dir /srv/nocobase/crm --yes
```

Bare application names expand to `@nocobase/<name>`; other publishers use the full scoped name, as above. Choose exactly one of `--app` and `--archive`; `--template` is not supported. A published application includes its buildable sources, development dependencies, `build` script and `nocobase.templateKind: app`. The installer preserves its package name and version, installs dependencies and builds its deployment archive in a temporary directory, then removes the sources and build dependencies. The application package and dependencies execute their normal install/build scripts, so choose a publisher you trust. A requested database driver must be declared by the application package.

`--registry` (or `NOCOBASE_REGISTRY`) selects the registry used for the application and its dependencies and is saved in `installer.json`. npm and pnpm use the service user's registry credentials. Installing an npm application requires npm and pnpm 11+ on PATH, in addition to Node and pm2. The build needs more memory, disk space and time than unpacking an archive.

An npm installation records `source.kind: app` and the full package name. `upgrade` resolves that package's `latest` tag; `--to <version or tag>` selects another release for that operation, and `--rebuild` rebuilds the installed version for the current server. An install with `@beta` or an exact version does not pin future upgrades: use `--to beta` or `--to <version>` when needed. The installed version is a no-op unless rebuilding or adapting to a changed Node major. Downgrades require rollback. The new build completes while the previous release keeps serving; configuration, SQLite backup, migration, health checks and rollback use the same path as archive upgrades. Archive installations still require `upgrade --archive` and cannot switch source kinds in place.

## Requirements

- Linux or macOS. On Windows, use WSL: switching releases relies on symbolic links and atomic renames.
- Node.js 24 or later.
- pm2 4.3 or later, installed globally (`npm install -g pm2`), to start the application. A copy fetched through `npx` does not work, because `pm2 startup` writes a boot service that names pm2's own path.

NocoBase 3 packages are published to the public npm registry. The commands below use `--yes` to skip npx's own install prompt. `--registry` or `NOCOBASE_REGISTRY` selects a private registry when needed; the installer records that registry in `installer.json`, so later commands for an existing installation keep using its original source.

## Building an archive

In the application project, build for the server rather than for the machine you build on, and copy the archive over:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

`--target` and `--node-version` must match the server: native modules are compiled for one platform, architecture, C library and Node major, and the installer refuses an archive built for another. The build is not tied to a mount path: the installation chooses it with `--base-path`. A database other than SQLite needs its driver in the project before the build (`pnpm add @nocobase/db-postgres`), since an archive carries the drivers it was built with. The archive records in `dist/package.json` that it is relocatable, and when it was built. An archive from an `@nocobase/app-cli` that predates relocatable builds records the base path it was compiled for instead, and runs only at that path; one older still records neither, and is refused until the project upgrades it and builds again.

## Install

```bash
npx --yes @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
```

The target must be new or empty. Before writing anything, the command also checks that the port is free — naming a free one when it is not — that no pm2 process already uses the name (`pm2 start` on a taken name would restart that process with this installation's configuration rather than start a new one), and that every variable named by `--set-from-env` is set. It then unpacks the archive into a release directory; writes the configuration; applies the database migrations; and starts the application with pm2, waiting until its health check answers or pm2 reports the process as crashed. Anything it wrote is removed again if it fails before the application is switched on, so running it again starts clean.

Ctrl-C (or SIGTERM) stops the step that is running and lets that cleanup happen; a second one exits at once.

On a command timeout or the first interrupt, the installer sends SIGTERM to the command's process group and waits until no member can execute or write, including descendants that closed their output. Members that ignore SIGTERM receive SIGKILL after 10 seconds. Linux and macOS require `ps` on PATH to distinguish running members from terminated, unreaped zombies. Confirmation is bounded to another 2 seconds; if signals or state checks fail or members remain, the failure explicitly says the stop could not be confirmed. Normal successful commands have no added wait. This covers the local process group; it cannot stop descendants that deliberately leave the group or remote operations after an SSH connection ends.

| Flag               | Default                      | Purpose                                                                                                               |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--dir`            |                              | The target, as the other commands name it; the same as the directory argument.                                        |
| `--archive`        |                              | The deployment archive to install, by local path. Required.                                                           |
| `--origin`         | `http://HOST:PORT`           | Public origin without the base path. Set it before exposing the application.                                          |
| `--base-path`      | the server's, `/main`        | Where the application is mounted, such as `/crm`, or `/` for the origin root. Written to `app.env`.                   |
| `--host`, `--port` | `127.0.0.1`, `13000`         | Where the application listens. Keep the loopback default behind a reverse proxy; give each installation its own port. |
| `--dialect`        | `sqlite`                     | Database. Anything else needs `--set`; the archive must carry `@nocobase/db-<dialect>`.                               |
| `--set`            |                              | `key=value` passed to `nocobase config set`, repeatable. Values are YAML scalars.                                     |
| `--set-from-env`   |                              | `key=VARIABLE` read from the environment, repeatable. Use it for passwords.                                           |
| `--registry`       | `https://registry.npmjs.org` | Registry the suggested installer commands use; `NOCOBASE_REGISTRY` also sets it.                                      |
| `--name`           | `nocobase-<directory name>`  | pm2 process name.                                                                                                     |
| `--no-start`       |                              | Install without starting; the result names the command that starts it.                                                |
| `--health-timeout` | `180`                        | Seconds to wait for the health check.                                                                                 |
| `--json`           |                              | Print one JSON result on stdout. Progress always goes to stderr.                                                      |

A PostgreSQL installation, with the password taken from the environment:

```bash
CRM_DB_PASSWORD=... npx --yes @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=crm \
  --set-from-env database.connections.main.password=CRM_DB_PASSWORD
```

`--set` values are read as YAML scalars by `nocobase config set`: `0123` becomes the number `123` and `no` becomes `false`, so quote text that looks like either, as in `--set 'key="0123"'`. Values are masked in the installer's own output, but a secret passed with `--set` is still visible to other users in the process list while the command runs; pass secrets with `--set-from-env`.

Afterwards, run `pm2 startup` once and execute the command it prints so pm2 restarts the application after a reboot, and proxy the origin to the application's port with `location /`. Several installations behind one origin are told apart by their base paths. The first sign-in comes from `users.initialAdmin` in `config.yml`. The result's `initialAdmin` names that account's username and email, and `defaultPassword` says whether its password is still the one `config.example.yml` ships (`admin123`), to be changed after signing in; the password itself is never printed.

## Upgrade

```bash
npx --yes @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
```

An upgrade moves to the archive given with `--archive`, which must hold the same application (its package name owns the migration history) and not an older version; an archive from before relocatable builds must also have been built for the path `app.env` mounts.

Every build is a release of its own, named by its version and UTC build time, as in `0.3.0_20260927T005500Z`, so deploying a project without bumping its version is still an upgrade. An archive already on disk is reused, and the one already running changes nothing.

The new release is unpacked and checked while the current release keeps serving. Its own CLI runs `config check`, `db apply --dry-run` to count pending migrations and seeds, and `db repair --dry-run` to inspect checksum drift independently. These commands use the installation's configuration, environment and default connection. The target application must support the checksum preview and its structured JSON result; an unsupported command or invalid response stops the upgrade before downtime. An apply preview alone does not validate checksums or data prerequisites.

When checksums differ, the installer returns `CHECKSUM_REPAIR_REQUIRED`, even with `--yes`. Review every entry against the target release's upgrade notes: `error.details.checksumRepair` contains `changes` (connection, task kind, package, name, recorded checksum and source checksum) and a `token`. Repeat the same upgrade with `--repair-checksums <token>` only after all changes are explained and approved; add `--yes` to accept the downtime and backup confirmation. The token binds approval to this installation, current release, target version and exact checksum changes. Changed drift requires a new review. An npm rebuild can have a new build timestamp without invalidating an otherwise identical repair plan.

Downtime begins only after preflight and confirmation: stop the application, copy its SQLite databases, `config.yml` and `app.env` to `backups/<time>_<from>_to_<to>/`, switch `current`, recheck the repair plan, apply the approved checksum repairs, run migrations, and start the new release with a health check. No checksum differences means no repair command. Keep other writers to the same database stopped for this maintenance window, and keep the reviewed target sources unchanged. The installer calls `db repair --force` only for the approved plan and only after backup; do not repair manually before running upgrade, because its automatic backup would then already contain the new history.

If migrating or starting the new release fails, the upgrade rolls itself back: `current` returns to the previous release, the databases are restored from the backup when the new release may have migrated them or repaired checksums, and the previous release is started again. The command then exits with code `3`. If the previous release does not come back either, it exits with `4`, keeps the new release on disk, and leaves the operation pending, so `rollback` finishes the job once the cause is fixed.

A version older than the running one is refused: the older release knows nothing of the newer migrations. Going back is what `rollback` is for. The pm2 process named in `installer.json` must belong to this installation, and once the application is stopped its port must be free, so the health check cannot be answered by anything but the new release.

| Flag                 | Default | Purpose                                                                                                               |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `--archive`          |         | The new archive, by local path. Required.                                                                             |
| `--repair-checksums` |         | Approve the exact checksum repair plan returned by preflight, using its token. `--yes` alone never authorizes repair. |
| `--backup-done`      |         | Required when `config.yml` names a database the installer cannot back up — any but SQLite: back it up yourself.       |
| `--keep`             | `3`     | Releases to keep on disk (at least 2). The new release and the one upgraded from are always kept.                     |
| `--health-timeout`   | `180`   | Seconds to wait for the new release's health check.                                                                   |
| `--yes`              |         | Proceed without the confirmation prompt; required with `--json` or without a terminal.                                |
| `--json`             |         | Print one JSON result on stdout.                                                                                      |

A checksum-repairing upgrade records `installer.json` schema version 2 before switching or repairing. Continue using an installer that supports this format for status, recovery and rollback: older installers refuse it rather than silently skipping the database restore. Existing version 1 installations remain supported; an upgrade without repair does not change their state format. Successful upgrade JSON adds `result.checksumRepairs`; history records this count independently of pending migrations.

The backup covers what rolling back needs: every SQLite database `config.yml` declares, with its journals, and the configuration. It is not a replacement for regular backups of `storage/`, whose uploaded files it leaves out, and backups are not pruned: remove old ones from `backups/` yourself.

When the machine's Node major changes, a release's native modules no longer load, and `status` says so. Build the archive again with the new `--node-version` and upgrade to it: the new build is a release of its own, switched to through the same steps and the same backup as any upgrade. The release it replaces stays on disk but cannot be rolled back to, since it was built for another Node.

## Rollback

```bash
npx --yes @nocobase/app-installer rollback --dir /srv/nocobase/crm
```

Returns to the release the last upgrade came from, or to `--to`, which takes a release id or a version (the newest build of it) among the releases on disk. When the upgrade being undone applied migrations or repaired checksums, the SQLite databases are restored from the backup taken before it, which discards whatever was written since; `--no-restore` keeps the current databases instead. An external database is never in a backup, so nothing is restored for it and the command says so: restore it from your own backup. Rolling back never runs migrations backwards. A release built for another Node major is refused, since its native modules would not load; the error says how to get one that does.

If the release it returns to does not start, the rollback stays pending, and running `rollback` again retries it — restore included — once the cause is fixed.

If an upgrade or rollback is interrupted while the application is down, `installer.json` records it: `status` warns, `upgrade` refuses to start, and `rollback` recovers. It undoes an interrupted upgrade — restoring the databases only when the upgrade had already switched releases, since before that nothing was migrated — and finishes an interrupted rollback.

## Status

```bash
npx --yes @nocobase/app-installer status --dir /srv/nocobase/crm
```

Reports the application, its source, the running release with its version and build time, its `endpoints` — the public URL and origin, and the host and port it listens on — whether it answers its health check, the pm2 process, the releases on disk and their size, and whether the machine's Node major still matches the one the release was built for. It changes nothing, and does not start the pm2 daemon when it is not running.

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
└── installer.json        what the installer knows: application, base path, source, releases, history
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

| Code                       | Exit | Meaning and what to do                                                                                                                                                                                                                                                                                     |
| -------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_USAGE`            | `2`  | An unknown command or flag, a malformed `--set`, an `--origin` with a path, no install directory, no `--archive`, or an `--archive` URL. Fix the command line.                                                                                                                                             |
| `NODE_UNSUPPORTED`         | `2`  | Node.js is older than 24. Install Node.js 24 or later.                                                                                                                                                                                                                                                     |
| `PLATFORM_UNSUPPORTED`     | `2`  | Windows. Run the installer inside WSL.                                                                                                                                                                                                                                                                     |
| `PM2_MISSING`              | `2`  | pm2 is not on PATH. Install it globally, or install with `--no-start`.                                                                                                                                                                                                                                     |
| `PM2_UNSUPPORTED`          | `2`  | pm2 is older than 4.3, which does not read `ecosystem.config.cjs`, or `pm2 --version` printed no version. Update it globally, then run `pm2 update`.                                                                                                                                                       |
| `PM2_NAME_IN_USE`          | `2`  | Another process owns the pm2 name. Choose another with `--name` when installing; for an installation, stop or rename that process.                                                                                                                                                                         |
| `PORT_IN_USE`              | `2`  | Something already listens on the host and port. When installing, `details.freePort` and the suggestion name a free port; otherwise stop what holds it.                                                                                                                                                     |
| `ENV_MISSING`              | `2`  | A variable named by `--set-from-env` is not set.                                                                                                                                                                                                                                                           |
| `TARGET_NOT_EMPTY`         | `2`  | The install target holds files, or is a file. Install into a new or empty directory; an installation is managed with the other commands.                                                                                                                                                                   |
| `NOT_INSTALLED`            | `2`  | The directory holds no `installer.json`. Run from the installation root, or name it with `--dir`.                                                                                                                                                                                                          |
| `STATE_UNSUPPORTED`        | `2`  | `installer.json` was written by a newer app-installer, or records an installation built from a published template, which only the app-installer that installed it manages.                                                                                                                                 |
| `LOCKED`                   | `2`  | Another app-installer is working on this installation. Wait for it to finish.                                                                                                                                                                                                                              |
| `ARCHIVE_NOT_FOUND`        | `2`  | `--archive` names no file.                                                                                                                                                                                                                                                                                 |
| `ARCHIVE_INVALID`          | `2`  | The archive holds no `dist/package.json`: it is not one `pnpm build --tar` wrote.                                                                                                                                                                                                                          |
| `CONFIG_UNREADABLE`        | `2`  | `config.yml` could not be read as YAML, so the databases an upgrade would have to back up are unknown. Fix the file; nothing was changed.                                                                                                                                                                  |
| `ARCHIVE_TOO_OLD`          | `2`  | The archive records neither that it is relocatable nor its base path, or not its build time. Upgrade `@nocobase/app-cli` in the project and build it again.                                                                                                                                                |
| `DRIVER_MISSING`           | `2`  | The archive lacks `@nocobase/db-<dialect>` for the chosen dialect. Add it to the project and build again.                                                                                                                                                                                                  |
| `APP_MISMATCH`             | `2`  | The archive holds another application than the one installed. Install it into a directory of its own.                                                                                                                                                                                                      |
| `BASE_PATH_MISMATCH`       | `2`  | A release from before relocatable builds was built for another path than `--base-path` or `app.env` names. Build it again with a current `@nocobase/app-cli`, which runs at any path.                                                                                                                      |
| `CONFIRMATION_REQUIRED`    | `2`  | `upgrade` or `rollback` needs consent, and `--json` or the lack of a terminal leaves no prompt to ask on. `details.notes` says what the operation does; pass `--yes` once that is accepted.                                                                                                                |
| `CANCELLED`                | `2`  | The confirmation prompt was declined. Nothing changed.                                                                                                                                                                                                                                                     |
| `OPERATION_INTERRUPTED`    | `2`  | An earlier upgrade or rollback stopped while the application was down. Run `rollback` to recover before anything else.                                                                                                                                                                                     |
| `DOWNGRADE`                | `2`  | The target is an older version than the running one. Use `rollback --to`.                                                                                                                                                                                                                                  |
| `CHECKSUM_REPAIR_REQUIRED` | `2`  | Review `error.details.checksumRepair.changes`, then repeat the upgrade with its `token` as `--repair-checksums`. `--yes` alone does not authorize repair.                                                                                                                                                  |
| `CHECKSUM_CHECK_INVALID`   | `2`  | The target CLI returned an incomplete or unsupported checksum preview. Use a target application supporting `db repair --dry-run --json`; the running application is unchanged.                                                                                                                             |
| `BACKUP_REQUIRED`          | `2`  | `config.yml` names a database the installer cannot back up. Back it up, then pass `--backup-done`.                                                                                                                                                                                                         |
| `NOTHING_TO_ROLL_BACK`     | `2`  | No upgrade led to the current release. Name a release on disk with `--to`.                                                                                                                                                                                                                                 |
| `RELEASE_MISSING`          | `2`  | The release to return to is not on disk; `status` lists those that are.                                                                                                                                                                                                                                    |
| `NODE_MISMATCH`            | `2`  | The release was built for another Node major, so its native modules would not load; the suggestions say how to get one that does.                                                                                                                                                                          |
| `BUILD_TARGET_MISMATCH`    | `2`  | The archive was built for another platform or Node major than this machine; the suggestion names the build command that fits.                                                                                                                                                                              |
| `UNPACK_FAILED`            | `1`  | Unpacking the deployment archive failed.                                                                                                                                                                                                                                                                   |
| `STORAGE_IN_RELEASE`       | `1`  | The release wrote its data inside its own directory: its `@nocobase/app-server` predates `APP_STORAGE_DIR`. Upgrade it in the project and build again; an upgrade rolls back on it.                                                                                                                        |
| `APP_CLI_FAILED`           | `1`  | The release's own CLI printed no result. A failure it does report keeps its own code instead, such as `CONFIG_INVALID` from `config check`.                                                                                                                                                                |
| `START_FAILED`             | `1`  | The application is installed but did not pass its health check; `details.log` holds the end of its error log. Fix the cause and start it with the suggested command.                                                                                                                                       |
| `UPGRADE_ABORTED`          | `1`  | The upgrade stopped before switching releases and the previous release is running again; exit `4` when it did not come back.                                                                                                                                                                               |
| `ROLLBACK_ABORTED`         | `1`  | Stopping the application failed; nothing was restored or switched.                                                                                                                                                                                                                                         |
| `INTERRUPTED`              | `1`  | Ctrl-C or SIGTERM stopped the running step before the application was touched. An install removes what it wrote unless the application was already switched on; an upgrade removes the release it was unpacking. Once an upgrade or rollback has stopped the application, it reports its own code instead. |
| `UNEXPECTED`               | `1`  | An error the installer does not recognise. The message is all there is; report it.                                                                                                                                                                                                                         |
| `UPGRADE_ROLLED_BACK`      | `3`  | The new release failed after the switch; the previous one runs again, on the restored databases when the new one may have migrated them.                                                                                                                                                                   |
| `ROLLBACK_FAILED`          | `4`  | The application is down. Follow the suggestions: read the log, fix the cause, and run `rollback` again, which retries the restore.                                                                                                                                                                         |

## SSH deployment without server internet access

Build the application locally for the server's platform, then deploy its archive. The local installer packages its own installed runtime dependencies and uploads them with the application; it does not invoke npm, npx or pnpm on the server. The remote Linux machine needs Node.js 24+, tar and pm2 on the non-interactive SSH session's PATH. It needs neither an Agent nor a Skill. External services that the application uses must remain reachable.

```bash
app-installer deploy --ssh deploy@server --dir /srv/apps/crm \
  --archive storage/exports/dist.tar.gz --origin https://crm.example.com --json
app-installer status --ssh deploy@server --dir /srv/apps/crm --json
app-installer upgrade --ssh deploy@server --dir /srv/apps/crm \
  --archive storage/exports/dist.tar.gz --json
app-installer rollback --ssh deploy@server --dir /srv/apps/crm --json
```

These commands are invoked through the installed `app-installer` binary on the local machine. `deploy` selects install when there is no `installer.json`, and upgrade when there is one. `install --ssh` always requests a fresh installation. An existing target retains its configuration: omit install-only flags, such as `--origin`, `--port` and `--set`, when deploying an update. Review an upgrade or rollback's confirmation notes and repeat with `--yes` to proceed. The remote operation always uses JSON, so it never waits for an invisible terminal prompt. The same checksum preview and `--repair-checksums <token>` approval apply to `deploy` updates and `upgrade` over SSH; the token remains valid across temporary upload paths. SQLite backup, external database `--backup-done`, release retention and rollback rules also apply. External databases are never restored automatically, including their migration and seed history after repair; `--backup-done` acknowledges an operator backup only.

| Flag             | Meaning                                                             |
| ---------------- | ------------------------------------------------------------------- |
| `--ssh`          | `user@host` or an alias from SSH config; required for `deploy`      |
| `--ssh-port`     | Override the SSH port                                               |
| `--ssh-identity` | Local private key file; otherwise use SSH config or the SSH agent   |
| `--ssh-config`   | Local SSH config file, including aliases and ProxyJump              |
| `--ssh-timeout`  | Maximum seconds for each transfer or remote execution, default 1800 |

SSH uses batch authentication and strict host-key checking. Establish and verify the server's host key in known_hosts beforehand; the installer never disables verification or asks for an SSH password. Use system SSH configuration for jump hosts and authentication. `--dir` must be an explicit absolute remote path; `--archive`, identity and config paths are local. Configure the remote account's non-interactive PATH for Node and pm2, without relying on an interactive shell's version-manager initialization.

`--set-from-env key=VARIABLE` reads a local environment variable and sends its value through encrypted SSH stdin, not command arguments or a temporary configuration file. The remote child receives only generated secret environment names. Do not put passwords in `--set`. Application configuration and secrets remain in the installation's persistent configuration as with a local install.

Before uploading, the installer checks the remote runtime, archive platform, writable parent and available disk space. Disk space is an estimate allowing twice the archive's expanded size plus installer overhead; large existing databases may require more space for backups. Uploaded files are checked with SHA-256 before execution. `--app`, npm upgrades and `--rebuild` are not supported remotely: build an archive locally instead. A remote operation that succeeds but whose public health URL is unreachable returns a warning and `result.remote.publicHealth: false`; private URLs may legitimately be unreachable from the local machine.

If SSH disconnects or times out after execution starts, `REMOTE_STATE_UNKNOWN` means the remote process may still be running. Query `status --ssh` before retrying, and inspect `pending` plus the persistent application logs if necessary. Do not assume the operation failed or automatically run another deployment. Pre-execution transfer failures leave the application unchanged. Successful operations remove their randomly named `/tmp/nocobase-deploy-*` directory; failures retain it for diagnosis and return its path. It contains archives and installer code, not transported secret values. Remove that directory only after confirming no remote operation is using it. Retrying creates a new transfer; resumable uploads are not implemented.

### Export an offline installer

```bash
app-installer bundle --out installer.tar.gz --json
```

This packages the currently installed installer and its runtime dependency graph without querying a registry. Extract it on the server, then use `node installer/bin/run.js install ... --archive ... --json`, or `status`, `upgrade` and `rollback` the same way. In a source checkout, build app-installer and its workspace dependencies before bundling. The bundle does not include Node or pm2, and recovery suggestions written as `npx ...` must be invoked through this offline entry instead on a disconnected server. SSH commands create and transfer this bundle automatically.
