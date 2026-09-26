# @nocobase/hub-installer

Installs, upgrades and rolls back a NocoBase 3 Hub on a server, for a Hub whose source you do not change. It generates the Hub from the published `@nocobase/app-template-hub`, builds it on the server, keeps only the deployment archive, and runs it under pm2. A Hub you customise is an application project: create it with `pnpm create @nocobase/app hub --template=hub` and deploy it like any other application. Docker remains the other way to run an unmodified Hub.

## Requirements

- Linux or macOS. On Windows, use WSL: switching releases relies on symbolic links and atomic renames.
- Node.js 24 or later, pnpm 11 or later, and `tar`.
- pm2 4.3 or later, installed globally (`npm install -g pm2`), to start the Hub. A copy fetched through `npx` does not work, because `pm2 startup` writes a boot service that names pm2's own path.

NocoBase 3 packages are published to `https://npm.nocobase.ai` rather than the public npm registry, so every command below names that registry for `npx`. Add `--yes` before `--registry` to skip npx's own install prompt, as a script or an agent has to. The suggestions in an error, and the examples in `--help`, are written the same way and run as they are.

`install` and `upgrade` build the Hub on the machine they run on, which takes several minutes; give them a timeout to match when a script or an agent runs them.

## Install

```bash
npx --registry=https://npm.nocobase.ai @nocobase/hub-installer install /srv/nocobase/hub --origin https://apps.example.com
```

The target must be new or empty. Before writing anything, the command also checks that the port is free, that no pm2 process already uses the name (`pm2 start` on a taken name would restart that process with this Hub's configuration rather than start a new one), and that every variable named by `--set-from-env` is set. It then resolves the version, generates and builds the Hub in a temporary build directory, unpacks the deployment archive into a release directory, writes the configuration, applies the database migrations, and starts the Hub with pm2, waiting until its health check answers or pm2 reports the process as crashed. Anything it wrote is removed again if it fails before the Hub is switched on, so running it again starts clean — with `--keep-source`, the build directory is kept for inspection and has to be removed before retrying.

Ctrl-C (or SIGTERM) stops the step that is running and lets that cleanup happen; a second one exits at once.

| Flag               | Default                   | Purpose                                                                                   |
| ------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `--dir`            |                           | The target, as the other commands name it; the same as the directory argument.            |
| `--hub-version`    | `latest`                  | Template version or dist-tag. Resolved to an exact version before anything is built.      |
| `--origin`         | `http://HOST:PORT`        | Public origin without `/hub`. Set it before exposing the Hub.                             |
| `--host`, `--port` | `127.0.0.1`, `13000`      | Where the Hub listens. Keep the loopback default behind a reverse proxy.                  |
| `--dialect`        | `sqlite`                  | Database. Anything else adds `@nocobase/db-<dialect>` before the build and needs `--set`. |
| `--set`            |                           | `key=value` passed to `nocobase config set`, repeatable. Values are YAML scalars.         |
| `--set-from-env`   |                           | `key=VARIABLE` read from the environment, repeatable. Use it for passwords.               |
| `--registry`       | `https://npm.nocobase.ai` | Registry for the template and NocoBase packages; `NOCOBASE_REGISTRY` also sets it.        |
| `--name`           | `nocobase-hub`            | pm2 process name.                                                                         |
| `--no-start`       |                           | Install without starting; the result names the command that starts it.                    |
| `--health-timeout` | `180`                     | Seconds to wait for the health check.                                                     |
| `--keep-source`    |                           | Keep the build directory, with the sources and development dependencies, even on failure. |
| `--json`           |                           | Print one JSON result on stdout. Progress always goes to stderr.                          |

A PostgreSQL Hub, with the password taken from the environment:

```bash
HUB_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/hub-installer install /srv/nocobase/hub \
  --origin https://apps.example.com --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=hub \
  --set-from-env database.connections.main.password=HUB_DB_PASSWORD
```

`--set` values are read as YAML scalars by `nocobase config set`: `0123` becomes the number `123` and `no` becomes `false`, so quote text that looks like either, as in `--set 'key="0123"'`. Values are masked in the installer's own output, but a secret passed with `--set` is still visible to other users in the process list while the command runs; pass secrets with `--set-from-env`.

Afterwards, run `pm2 startup` once and execute the command it prints so pm2 restarts the Hub after a reboot, and proxy the origin to the Hub with `location /` and `client_max_body_size 260m`. The first sign-in comes from `users.initialAdmin` in `config.yml`. The result's `initialAdmin` names that account's username and email, and `defaultPassword` says whether its password is still the template's (`admin123`), to be changed after signing in; the password itself is never printed.

## Upgrade

```bash
npx --registry=https://npm.nocobase.ai @nocobase/hub-installer upgrade --dir /srv/nocobase/hub
```

Upgrades to `latest`, or to the version or dist-tag given with `--to`. Everything that takes time happens while the current release keeps serving: the new release is built beside it (or reused, when that version is already on disk), then checked with its own CLI — `config check`, and `db apply --dry-run` to count the pending migrations. Only then does the downtime start: the Hub is stopped, its SQLite database, `config.yml` and `hub.env` are copied to `backups/<time>_<from>_to_<to>/`, `current` is switched, the migrations are applied, and the new release is started and must pass its health check. Stopping the Hub stops every application it hosts, and deployments in progress are marked failed.

If migrating or starting the new release fails, the upgrade rolls itself back: `current` returns to the previous release, the database is restored from the backup when the new release may have migrated it, and the previous release is started again. The command then exits with code `3`. If the previous release does not come back either, it exits with `4`, keeps the new release on disk, and leaves the operation pending, so `rollback` finishes the job once the cause is fixed.

A version older than the running one is refused: the older release knows nothing of the newer migrations. Going back is what `rollback` is for. A release already on disk is reused only when it was built for this platform and Node major; otherwise it is built again. The pm2 process named in `installer.json` must belong to this Hub root, and once the Hub is stopped its port must be free, so the health check cannot be answered by anything but the new release.

| Flag               | Default  | Purpose                                                                                                                            |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--to`             | `latest` | Version or dist-tag, not older than the running one; the installed version with `--rebuild`. A matching release on disk is reused. |
| `--backup-done`    |          | Required for any database but SQLite, which the installer cannot back up: back it up yourself.                                     |
| `--keep`           | `3`      | Releases to keep on disk (at least 2). The new release and the one upgraded from are always kept.                                  |
| `--health-timeout` | `180`    | Seconds to wait for the new release's health check.                                                                                |
| `--keep-source`    |          | Keep the build directory.                                                                                                          |
| `--rebuild`        |          | Build the target again even when it is on disk. Alone, it rebuilds the installed version for this machine.                         |
| `--yes`            |          | Proceed without the confirmation prompt; required with `--json` or without a terminal.                                             |
| `--json`           |          | Print one JSON result on stdout.                                                                                                   |

The backup covers what rolling back needs: upgrading the Hub migrates only the Hub's own database, not those of the applications it hosts. It is not a replacement for regular backups of `storage/`, and backups are not pruned: remove old ones from `backups/` yourself. When the machine's Node major differs from the one the current release was built for, the confirmation says so: the current release could not be rolled back to, and hosted applications have to be rebuilt with the new `--node-version`.

When the machine's Node major changes, the release's native modules no longer load, and `status` says so. An upgrade to a newer version builds for the new Node by itself. When the Hub is already on the latest version, `upgrade --rebuild` builds the installed version again for this machine: the release is built beside the running one and swapped in during the same downtime an upgrade has, with the same backup, and if the rebuilt release fails to start the one it replaced is put back. `--rebuild` with another `--to` builds that version rather than reusing a copy on disk. A rebuild interrupted while the Hub is down is finished by running it again: `rollback` cannot help there when the release it would return to was built for another Node, and says so.

## Rollback

```bash
npx --registry=https://npm.nocobase.ai @nocobase/hub-installer rollback --dir /srv/nocobase/hub
```

Returns to the release the last upgrade came from, or to `--to <version>` among the releases on disk. When the upgrade being undone applied migrations, the database is restored from the backup taken before it, which discards whatever was written to the Hub since; `--no-restore` keeps the current database instead. A Hub on an external database has no database in its backups, so nothing is restored and the command says so: restore that database from your own backup. Rolling back never runs migrations backwards. A release built for another Node major is refused, since its native modules would not load.

If the release it returns to does not start, the rollback stays pending, and running `rollback` again retries it — restore included — once the cause is fixed.

If an upgrade or rollback is interrupted while the Hub is down, `installer.json` records it: `status` warns, `upgrade` refuses to start, and `rollback` recovers. It undoes an interrupted upgrade — restoring the database only when the upgrade had already switched releases, since before that nothing was migrated — and finishes an interrupted rollback.

## Status

```bash
npx --registry=https://npm.nocobase.ai @nocobase/hub-installer status --dir /srv/nocobase/hub
```

Reports the current version, its `endpoints` — the public URL and origin, and the host and port it listens on — whether the Hub answers its health check, the pm2 process, the releases on disk and their size, whether the machine's Node major still matches the one the release was built for, and whether the registry has a newer version (`--offline` skips that). It changes nothing, and does not start the pm2 daemon when it is not running.

## Changing the origin or port

`hub.env` holds where the Hub is reached and where it listens: `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT`. Edit them there and restart the process under its pm2 name, `nocobase-hub` unless `--name` chose another:

```bash
pm2 restart nocobase-hub
```

`launcher.mjs` reads `hub.env` every time the process starts, so nothing needs registering again. A new port must be free, and a reverse proxy has to forward to it. Every hub-installer command reads the same file, so `status` and the next `upgrade` check health at the new address.

## Layout

```text
/srv/nocobase/hub/
├── hub.env               runtime variables, read by pm2 and by every hub-installer command
├── config.yml            written by `nocobase config init`, shared by every release
├── storage/              HUB_STORAGE_DIR: the Hub's database, uploaded releases and hosted applications
├── logs/                 the Hub's stdout and stderr, collected by pm2
├── ecosystem.config.cjs  the pm2 configuration every start goes through
├── launcher.mjs          what pm2 runs: reads hub.env and starts the release current points at
├── releases/<version>/hub/  dist/ and config.example.yml from the deployment archive
├── current -> releases/<version>/hub
├── backups/              database and configuration copied before each upgrade
└── installer.json        what the installer knows: current version, dialect, drivers, history
```

`APP_CONFIG_FILE` and `HUB_STORAGE_DIR` in `hub.env` are absolute. A built server treats the directory above `dist/` as its deployment root and would otherwise keep its configuration and data inside the release directory.

pm2 runs `node launcher.mjs` (`interpreter: 'none'`), and on every start `launcher.mjs` reads `hub.env`, resolves `current` and replaces itself with `node <release>/dist/server/standalone.js` through `process.execve`. The Hub therefore keeps the pid pm2 watches, receives pm2's signals directly, and runs as the main module; pointing pm2's `script` at `standalone.js` instead would load it through pm2's own wrapper, where `import.meta.main` is false, and the Hub would never start. Because nothing about the release or its variables is fixed when pm2 registers the process, a plain `pm2 restart` applies a switched `current` or an edited `hub.env`. `install` writes both files once; edits to them are kept. Node flags for the Hub, such as `--max-old-space-size=4096`, go in `args` before `launcher.mjs`, which passes them on, or in `NODE_OPTIONS` in `hub.env`; pm2's `node_args` does not apply to an `interpreter: 'none'` process. The launcher's IPC channel from pm2 does not survive `process.execve`, so `wait_ready` and `shutdown_with_message` are not available.

## Exit codes

| Code | Meaning                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `0`  | Success.                                                                                                               |
| `1`  | The operation failed. A Hub that was already running was not touched.                                                  |
| `2`  | Invalid usage, a failed precheck — including an unsupported Node.js — or a declined confirmation; nothing was written. |
| `3`  | An upgrade failed after the switch and was rolled back; the previous release is running.                               |
| `4`  | Rolling back failed as well; the Hub is down and the error lists what to do.                                           |

## Error codes

Under `--json`, a failure prints `ok: false` with `error.code`, a message, and `error.suggestions`, whose `run` commands run as they are. Codes are stable; branch on them rather than on the message.

| Code                    | Exit | Meaning and what to do                                                                                                                                                                                                                                                            |
| ----------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INVALID_USAGE`         | `2`  | An unknown command or flag, a malformed `--set`, an `--origin` with a path, or no install directory. Fix the command line.                                                                                                                                                        |
| `NODE_UNSUPPORTED`      | `2`  | Node.js is older than 24. Install Node.js 24 or later.                                                                                                                                                                                                                            |
| `PLATFORM_UNSUPPORTED`  | `2`  | Windows. Run the installer inside WSL.                                                                                                                                                                                                                                            |
| `PNPM_MISSING`          | `2`  | pnpm is not on PATH. Install pnpm 11 with corepack, as the suggestion shows.                                                                                                                                                                                                      |
| `PNPM_UNSUPPORTED`      | `2`  | pnpm is older than 11.                                                                                                                                                                                                                                                            |
| `TAR_MISSING`           | `2`  | `tar` is not on PATH. Install it with the system package manager.                                                                                                                                                                                                                 |
| `PM2_MISSING`           | `2`  | pm2 is not on PATH. Install it globally, or install with `--no-start`.                                                                                                                                                                                                            |
| `PM2_UNSUPPORTED`       | `2`  | pm2 is older than 4.3, which does not read `ecosystem.config.cjs`, or `pm2 --version` printed no version. Update it globally, then run `pm2 update`.                                                                                                                              |
| `PM2_NAME_IN_USE`       | `2`  | Another process owns the pm2 name. Choose another with `--name` when installing; for an installed Hub, stop or rename that process.                                                                                                                                               |
| `PORT_IN_USE`           | `2`  | Something already listens on the Hub's host and port. Choose another port, or stop what holds it.                                                                                                                                                                                 |
| `ENV_MISSING`           | `2`  | A variable named by `--set-from-env` is not set.                                                                                                                                                                                                                                  |
| `TARGET_NOT_EMPTY`      | `2`  | The install target holds files, or is a file. Install into a new or empty directory; an installed Hub is managed with the other commands.                                                                                                                                         |
| `NOT_INSTALLED`         | `2`  | The directory holds no `installer.json`. Run from the Hub root, or name it with `--dir`.                                                                                                                                                                                          |
| `STATE_UNSUPPORTED`     | `2`  | `installer.json` was written by a newer hub-installer. Run the latest one.                                                                                                                                                                                                        |
| `LOCKED`                | `2`  | Another hub-installer is working on this Hub. Wait for it to finish.                                                                                                                                                                                                              |
| `REGISTRY_UNREACHABLE`  | `2`  | The registry could not be read. Check the network or `--registry`.                                                                                                                                                                                                                |
| `VERSION_NOT_FOUND`     | `2`  | No such template version or dist-tag; `details` lists the tags and recent versions.                                                                                                                                                                                               |
| `CONFIRMATION_REQUIRED` | `2`  | `upgrade` or `rollback` needs consent, and `--json` or the lack of a terminal leaves no prompt to ask on. `details.notes` says what the operation does; pass `--yes` once that is accepted.                                                                                       |
| `CANCELLED`             | `2`  | The confirmation prompt was declined. Nothing changed.                                                                                                                                                                                                                            |
| `OPERATION_INTERRUPTED` | `2`  | An earlier upgrade or rollback stopped while the Hub was down. Run `rollback` to recover before anything else.                                                                                                                                                                    |
| `DOWNGRADE`             | `2`  | `upgrade --to` names an older version. Use `rollback --to`.                                                                                                                                                                                                                       |
| `BACKUP_REQUIRED`       | `2`  | The Hub uses an external database. Back it up, then pass `--backup-done`.                                                                                                                                                                                                         |
| `DISK_LOW`              | `2`  | Less than about 2 GB free for a build. Free space, or lower `--keep`.                                                                                                                                                                                                             |
| `NOTHING_TO_ROLL_BACK`  | `2`  | No upgrade led to the current release. Name a release on disk with `--to`.                                                                                                                                                                                                        |
| `RELEASE_MISSING`       | `2`  | The release to return to is not on disk; `status` lists those that are.                                                                                                                                                                                                           |
| `NODE_MISMATCH`         | `2`  | The release was built for another Node major, so its native modules would not load.                                                                                                                                                                                               |
| `RELEASE_EXISTS`        | `2`  | A release directory for this version is already there.                                                                                                                                                                                                                            |
| `CREATE_FAILED`         | `1`  | Generating the Hub project with `create-app` failed; `details.output` holds its output.                                                                                                                                                                                           |
| `DRIVER_INSTALL_FAILED` | `1`  | Adding the database driver failed; `details.output` holds pnpm's output.                                                                                                                                                                                                          |
| `BUILD_FAILED`          | `1`  | `pnpm build` failed; `details.output` holds its output.                                                                                                                                                                                                                           |
| `UNPACK_FAILED`         | `1`  | Unpacking the deployment archive failed.                                                                                                                                                                                                                                          |
| `BUILD_TARGET_MISMATCH` | `1`  | The build produced a release for another platform or Node major than this machine.                                                                                                                                                                                                |
| `APP_CLI_FAILED`        | `1`  | The release's own CLI printed no result. A failure it does report keeps its own code instead, such as `CONFIG_INVALID` from `config check`.                                                                                                                                       |
| `START_FAILED`          | `1`  | The Hub is installed but did not pass its health check; `details.log` holds the end of its error log. Fix the cause and start it with the suggested command.                                                                                                                      |
| `UPGRADE_ABORTED`       | `1`  | The upgrade stopped before switching releases and the previous release is running again; exit `4` when it did not come back.                                                                                                                                                      |
| `ROLLBACK_ABORTED`      | `1`  | Stopping the Hub failed; nothing was restored or switched.                                                                                                                                                                                                                        |
| `INTERRUPTED`           | `1`  | Ctrl-C or SIGTERM stopped the running step before the Hub was touched. An install removes what it wrote unless the Hub was already switched on; an upgrade removes the release it was building. Once an upgrade or rollback has stopped the Hub, it reports its own code instead. |
| `UNEXPECTED`            | `1`  | An error the installer does not recognise. The message is all there is; report it.                                                                                                                                                                                                |
| `UPGRADE_ROLLED_BACK`   | `3`  | The new release failed after the switch; the previous one runs again, on the restored database when the new one may have migrated it.                                                                                                                                             |
| `ROLLBACK_FAILED`       | `4`  | The Hub is down. Follow the suggestions: read the log, fix the cause, and run `rollback` again, which retries the restore.                                                                                                                                                        |
