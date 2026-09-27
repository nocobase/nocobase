---
title: 'Standalone: app-installer'
description: Install a deployment archive on a server with app-installer, run it under pm2, and upgrade, roll back and inspect it.
---

# Standalone: app-installer

`@nocobase/app-installer` installs a deployment archive built on another machine onto a server, runs it under pm2, and handles its later upgrades, rollbacks and status checks. It fits when there is no Hub and no container platform, and you would rather not extract archives, maintain process configuration and take pre-upgrade backups by hand. Running the archive by hand is covered in [Build and run](./standalone), containers in [Docker](./docker), and centrally managed publishing of several applications in [Deploy Hub](./hub).

## Build machine and server

Deployment happens in two environments:

| Environment   | Needs                                                                        | Does                                                    |
| ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| Build machine | The application sources, Node.js 24, the pnpm version `packageManager` names | Builds the deployment archive; a workstation or CI      |
| Server        | Linux or macOS (WSL on Windows), Node.js 24 or later, a global pm2           | Installs, runs, upgrades and rolls back the application |

The server needs no sources, no pnpm and no `tar`. pm2 must be 4.3 or later, installed globally with `npm install -g pm2`; a copy fetched through `npx` does not work, because `pm2 startup` writes a boot service that names pm2's own path.

## 1. Build the archive

In the application project on the build machine, build for the server and copy the archive over:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

- **Build target**: `--target` and `--node-version` must match the server, since native modules load only on the platform, architecture, C library and Node major they were built for. See [Environment and directories](./standalone#environment-and-directories) for how to read them. The installer refuses an archive built for another environment and prints the build command that fits.
- **Base path**: the archive is not tied to a mount path. Choose it at install time with `--base-path /crm`, which is written to `app.env` as `APP_BASE_PATH`; without it the server default `/main` applies, and `/hub` for the Hub template. An archive from an earlier `@nocobase/app-cli` has its mount path compiled into the client and runs only at the path it was built for; another `--base-path` is refused with `BASE_PATH_MISMATCH`.
- **Database driver**: for a database other than SQLite, add its driver to the project before building, such as `pnpm add @nocobase/db-postgres`. An archive carries only the drivers it was built with.
- **Package versions**: the archive records in `dist/package.json` that it is not tied to a mount path (`relocatable`), and when it was built. One built by an `@nocobase/app-cli` older still records neither that nor a base path or build time, and is refused with `ARCHIVE_TOO_OLD`; a release whose `@nocobase/app-server` predates `APP_STORAGE_DIR` would write its data inside the release directory and is refused with `STORAGE_IN_RELEASE`. In either case, upgrade that package in the project and build again.

## 2. Install the application

NocoBase 3 packages are published to `https://npm.nocobase.ai`, not the public npm, so name the registry. On the server, run:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com
```

The target must be new or empty, and `--origin` is the public origin without `/crm`. By default the application listens on `127.0.0.1:13000`, uses SQLite, and runs under the pm2 name `nocobase-` followed by the directory name, `nocobase-crm` here. A script or an agent adds `--yes` before `--registry` to skip npx's own install prompt.

The command then:

1. **Checks** before writing anything that the port is free (naming a free one when it is not), that no other process owns the pm2 name, and that every variable named by `--set-from-env` is set.
2. **Unpacks** the archive into `releases/<version>_<build time>/app` and checks that it was built for this machine.
3. **Writes the configuration**: a `config.yml` with generated secrets and an `app.env` with the runtime variables.
4. **Migrates** the database.
5. **Starts** it: points `current` at the release, starts the application with pm2, and waits until its health check answers.

If any step before the application starts fails, the installer removes everything it wrote, so running it again starts clean.

Another database takes `--dialect` and `--set` for the connection. Put the password in an environment variable and read it with `--set-from-env`, since a value passed with `--set` is visible to other users in the process list while the command runs:

```bash
CRM_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=crm \
  --set-from-env database.connections.main.password=CRM_DB_PASSWORD
```

## 3. After installing

- **Start at boot**: run `pm2 startup` and execute the command it prints with sudo, so pm2 brings the application back after a reboot.
- **Reverse proxy**: set up the domain and certificate as in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy) and forward to `http://127.0.0.1:13000`.
- **First sign-in**: open `https://apps.example.com/crm/` and sign in with the `users.initialAdmin` account from `config.yml`, `nocobase` / `admin123` unless changed; change the password right away. The install result's `initialAdmin` names the account's username and email, and `defaultPassword` says whether the password is still the template default. Then run the checks in [Initialize and verify](./standalone#initialize-and-verify).

Read logs with `pm2 logs nocobase-crm`, or directly in `logs/app.out.log` and `logs/app.err.log`.

## Several applications on one server

Install each application separately, each with its own directory, port and pm2 name; the name defaults to one derived from the directory, so different directories do not collide. Give each application its own mount path with `--base-path`:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm --archive /tmp/crm.tar.gz --origin https://apps.example.com --base-path /crm --port 13000
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/erp --archive /tmp/erp.tar.gz --origin https://apps.example.com --base-path /erp --port 13001
```

The reverse proxy routes by path or by domain to each port. Behind one domain, give each application a `location` whose `proxy_pass` again appends no path, with the same forwarded headers as the example in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy):

```nginx
location /crm/ {
    proxy_pass http://127.0.0.1:13000;
}
location /erp/ {
    proxy_pass http://127.0.0.1:13001;
}
```

## Directory layout

| Path                                   | Contents                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app.env`                              | Runtime variables, read by pm2 and by every installer command                            |
| `config.yml`                           | Runtime configuration, shared by every release and left alone by upgrades                |
| `storage/`                             | The `APP_STORAGE_DIR`: databases, uploaded files and anything else the app keeps         |
| `logs/`                                | `app.out.log` and `app.err.log`, collected by pm2                                        |
| `releases/<version>_<build time>/app/` | Each release's `dist/` and `config.example.yml`                                          |
| `current`                              | Points at the running release                                                            |
| `backups/`                             | Databases and configuration copied before each upgrade                                   |
| `ecosystem.config.cjs`                 | The pm2 configuration every start goes through                                           |
| `launcher.mjs`                         | What pm2 runs: reads `app.env` on every start and starts the release `current` points at |
| `installer.json`                       | The installer's record: application, base path, source, releases and history             |

## Upgrade

Build a new archive on the build machine, copy it to the server, and run:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
```

The new archive must hold the same application and not an older version, and the upgrade keeps the mount path `app.env` names; an earlier archive tied to a mount path must also have been built for that path. going back is what `rollback` is for. Every build is a release of its own, named by its version and UTC build time, such as `0.3.0_20260927T005500Z`, so redeploying without bumping the version is still an upgrade.

The new release is unpacked and checked with its own CLI, validating the configuration and counting the pending migrations, while the current one keeps serving. Only then does the downtime start: the application stops, every SQLite database `config.yml` declares is copied into `backups/` together with `config.yml` and `app.env`, `current` switches, the migrations run, and the new release starts and must pass its health check. If migrating or starting fails, the installer returns to the previous release by itself, restoring the databases when needed.

- **External database**: the installer cannot back it up. Back it up yourself first and pass `--backup-done`.
- **Confirmation**: the command explains what it is about to do and asks first; a script passes `--yes`.
- **Retained releases**: three releases stay on disk by default; `--keep` changes that. Pre-upgrade backups are never pruned and leave out uploaded files, so they do not replace regular backups of `storage/`.
- **Node major change**: after the server moves to another Node major, the existing release's native modules no longer load, and `status` says so. Build the archive again with the new `--node-version` and upgrade to it.

## Roll back

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/crm
```

Returns to the release the last upgrade came from, or to a release id or version on disk given with `--to`. When the upgrade being undone applied migrations, the SQLite databases are restored from the backup taken before it, discarding whatever was written since; `--no-restore` keeps the current databases instead. An external database is not in the backup: restore it from your own. A rollback never runs migrations backwards.

If an upgrade or rollback is interrupted while the application is down, `installer.json` records it: `status` warns, `upgrade` refuses to start, and `rollback` recovers.

## Status and changing the address

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/crm
```

`status` changes nothing. It reports the application and its source, the running release and its build time, the public URL and listening address, health, the pm2 process, the releases on disk and their size, and whether the machine's Node major still matches the build.

To move the application to another origin or port, edit `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT` in `app.env` and run `pm2 restart nocobase-crm`, or the name given with `--name`. A new port must be free, and the reverse proxy has to forward to it. The mount path changes the same way through `APP_BASE_PATH`, and the reverse proxy has to route the new path. A release from an earlier build tied to a mount path cannot move, and `upgrade` and `rollback` refuse one that does not match `app.env`.

## More options

Every flag, exit code and error code is in `--help` and the [installer's README](https://github.com/nocobase/nocobase3/blob/develop/packages/tools/app-installer/README.md). Backups and troubleshooting are covered in [Backup, recovery and troubleshooting](./operations).
