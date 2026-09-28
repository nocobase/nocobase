---
name: nocobase-app-installer
description: Install built NocoBase 3 on the machine that runs it, for production, with `@nocobase/app-installer` — a NocoBase Hub from its published template, or an application's deployment archive built by `pnpm build --tar` — then upgrade, roll back and check it. Use when the user asks to install a NocoBase Hub (unless they will develop the Hub's own code), to deploy an application to production or a server, to upgrade or roll back such an installation, or when the directory holds an `installer.json` written by app-installer. Not for creating a project to develop, which is the `nocobase-create-app` Skill, and not for publishing an application to an existing Hub.
---

# Install and run NocoBase 3 with app-installer

This Skill installs NocoBase that is already built — nothing on the machine is developed, only run. `@nocobase/app-installer` puts each release under `releases/<version>_<build time>/app` and runs it under pm2; `config.yml`, `app.env`, `storage/`, `backups/` and `logs/` sit beside the releases and survive every upgrade. It takes one of two sources, fixed at install: `--template hub`, which builds the published Hub on the machine, or `--archive`, a deployment archive built in an application project. This Skill decides when to use it and how to act on what it reports; `--help` is the reference for every flag.

## Run it

Every command goes through `npx` with the registry named, and with `--json`:

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}" @nocobase/app-installer <command> … --json
```

NocoBase 3 publishes to `https://npm.nocobase.ai`, not to the public npm, so a bare `npx @nocobase/app-installer` answers 404. `NOCOBASE_REGISTRY` is set only when someone points the shell at another registry, such as an unreleased snapshot; the installer reads the same variable for the Hub template, records the registry in `installer.json`, and suggests commands from it. The `--yes` before the package is npx's own: it downloads the installer without asking. The installer's `--yes`, after the command, is a separate answer that only the user gives.

`--json` prints one document on stdout and progress on stderr, in the same envelope as `pnpm nocobase … --json`. Read the document, not the exit code alone: `ok`, `status` (`success`, `success-noop` or `failure`), `result`, and on failure `error.code`, `error.message`, `error.suggestions` and `error.details`. Each suggestion has a `message` and, where there is one, a `run` of `{ command, args }`: an executable and its arguments, run as given without a shell. app-installer 0.1.0-beta.1 and earlier, which a suggested command pinned to that version still runs, print `status` `error` and `run` as one shell line that runs as printed, so tell success from failure by `ok`.

| Exit | Meaning                                                                                  |
| ---- | ---------------------------------------------------------------------------------------- |
| `0`  | Done, or nothing to do (`success-noop`).                                                 |
| `1`  | Failed; an application that was already running was not touched.                        |
| `2`  | Invalid usage, a failed precheck, or a confirmation still needed; nothing was written.  |
| `3`  | An upgrade failed after switching and was rolled back; the previous release is running.  |
| `4`  | Rolling back failed too; the application is down.                                        |

## Choose the route

A project is source code someone changes, created by `nocobase-create-app` and developed locally; an installation is a built NocoBase that only runs, made by this Skill, usually in production. Settle the route before installing anything:

| The user asks to                                         | Route                                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Install, create or try NocoBase, to develop with         | The `nocobase-create-app` Skill                                                                             |
| Install a NocoBase Hub                                   | This Skill, `--template hub`                                                                                |
| Deploy an application to production or a server          | This Skill, `--archive`, from the application's deployment archive                                          |
| Develop the Hub's own code                               | The `nocobase-create-app` Skill with `--template=hub`; its archive later deploys here with `--archive`      |
| Publish an application to an existing Hub                | The `nocobase-hub-cli` Skill that `@nocobase/hub-cli` ships into the application (`hub deploy`), not this one |
| Run it with Docker                                       | The deployment documentation, https://github.com/nocobase/nocobase3/tree/develop/docs/docs/en/app/deployment |

- A Hub is installed, not created: a request to install one is `--template hub`, on a laptop as much as on a server, unless the user says they will develop the Hub's own code.
- "Install NocoBase on this server" with no project and no archive is not settled yet. Ask what it is for. Running the user's own application means creating it locally with `nocobase-create-app`, building its archive, and installing that here with `--archive`. A platform that hosts several applications is a Hub. Do not create a project on the server and run it with `pnpm dev`: that is development mode, not a deployment.
- When the working directory already holds `installer.json`, the installation exists: start with `status`.

## Two machines

An archive is built where the sources are — the user's computer or CI — and installed where NocoBase runs. An agent working on the server usually cannot reach the project: give the user the build command below and wait for the archive to be copied over, rather than trying to build it. A Hub from its template needs no second machine; it is built where it is installed.

## Build the archive

In the application project, whose own `AGENTS.md` and `nocobase-deployment` Skill are the authority on building:

```bash
APP_BASE_PATH=/crm pnpm build --target linux-x64 --node-version 24 --tar
```

- `--target` and `--node-version` describe the machine that will run it, not the one building it: `node -p "process.platform + '-' + process.arch"` and `node --version` there; Alpine takes a `-musl` target. The installer refuses an archive built for another machine and names the command that fits.
- `APP_BASE_PATH` is compiled into the client, `/main` when unset. The application is served there, and every later archive must be built for the same one.
- A database other than SQLite needs its driver in the project before the build, such as `pnpm add @nocobase/db-postgres`: an archive carries only the drivers it was built with.

The archive is `storage/exports/dist.tar.gz`; the user copies it to the machine that runs NocoBase, for example `scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz`. `ARCHIVE_TOO_OLD` or `STORAGE_IN_RELEASE` means the project's NocoBase packages are older than the installer needs: upgrade them, build again, then retry.

## Install

### Every installation

1. Check the machine: `node --version` (24 or later) and `command -v pm2`, which finds pm2 without starting its daemon. pm2 4.3 or later has to be installed globally, `npm install -g pm2`; a copy fetched through `npx` breaks `pm2 startup`. Report what is missing with the command that installs it, and install nothing globally unless the user asks. On Windows, work in WSL.
2. Settle with the user: the target directory, new or empty, such as `/srv/nocobase/crm`; the public origin without the base path, such as `https://apps.example.com`, which may be left out for a machine reached only at `http://127.0.0.1:<port>`; whether a reverse proxy sits in front; the port, 13000 by default and different for every installation on the machine; and the database, SQLite by default.
3. It listens on `127.0.0.1`, which suits a reverse proxy on the same machine; when people reach it directly at `http://<address>:<port>`, add `--host 0.0.0.0` and use that address as the origin. For another database add `--dialect <dialect>`, the connection as `--set database.connections.main.host=…` and friends, and the password as `--set-from-env database.connections.main.password=<VARIABLE>` after the user has exported it; never put a password on the command line.
4. `PORT_IN_USE` names a free port in `error.details.freePort`; offer it rather than picking one silently.

### From an archive

`install <dir> --archive <file> --origin <origin> --json`. It needs no pnpm, and finishes in a minute or two. The archive must carry the driver for `--dialect`, or the install stops with `DRIVER_MISSING` and the build command that fixes it.

### A Hub from its template

`install <dir> --template hub --origin <origin> --json`; `hub@<version>` pins a version. It also needs `pnpm --version` 11 or later, and adds the driver for `--dialect` itself. It builds on the machine and takes several minutes: give it a timeout of 30 minutes or more. A shorter one interrupts the build. The installer removes what it wrote when the interruption is a signal it can catch, SIGINT or SIGTERM; a tool that kills with SIGKILL leaves the target half-written, and the next `install` refuses it with `TARGET_NOT_EMPTY`. Report that, and leave emptying the directory to the user.

### When it succeeds

When `result.started` is true, the installation answered its health check. Tell the user:

- `result.url`, and the first sign-in: `result.initialAdmin.username` or its `email`, with the password under `users.initialAdmin` in `config.yml`. When `result.initialAdmin.defaultPassword` is true, that password is still the template's `admin123` and has to be changed after signing in; otherwise it is the one they set. The result never carries the password, and `config.yml` stays unread;
- each command in `result.nextCommands`: `pm2 startup` prints a command they run once with sudo, after which pm2 restores the process list the installer saved, so the installation comes back after a reboot;
- with a reverse proxy: it forwards to the installation's port with the WebSocket upgrade headers; a Hub also needs `client_max_body_size 260m`. Several installations behind one origin are routed by their base paths;
- anything in `warnings`.

A failed install before the switch leaves the target as it found it. What the failing step said is in `error.details`: `output` for generating, building and unpacking the release, `stderr` and `stdout` when the release's own CLI printed no result; a failure that CLI reports itself keeps the CLI's own code, such as `CONFIG_INVALID`, and its `error.message` and `error.suggestions` say what was wrong. `START_FAILED` means installed but not running: show `error.details.log`.

## Several installations on one machine

Each application or Hub is installed once, in a directory of its own, with its own `--port`. The pm2 process name defaults to `nocobase-<directory name>`, so directories with different names never collide; two directories with the same name report `PM2_NAME_IN_USE` before anything is written, and `--name` gives the second its own. A Hub also starts an App Host for its applications on the first free port from 13010 upwards, so keep the Hubs' own ports away from that range, such as 13000, 13100 and 13200: a Hub restarted later could otherwise find its port taken by another Hub's App Host.

## Status

`status --dir <root> --json` changes nothing; `--offline` also skips asking the registry for a newer Hub. Report the application and `version`, `current` (the release id), `endpoints.url`, `health.ok`, `process`, `updateAvailable` for a template installation, and anything in `warnings`. `node.matches: false` means the machine's Node major changed since the release was built, and it will not load its native modules until a release built for this machine replaces it: the warning names the steps — a rebuilt archive and `upgrade --archive`, or `upgrade --rebuild` for the Hub — which go through the same stop, backup and confirmation as any upgrade. A non-null `pending` means an operation was interrupted; see below.

## Upgrade and roll back

Both stop the application — and for a Hub, every application it hosts — so the user decides:

1. An archive installation upgrades from a new archive: `upgrade --dir <root> --archive <file> --json`. It must be the same application built for the same base path, and not an older version; the same version built again is a new release and deploys normally. A template installation upgrades with `upgrade --dir <root> --json`, to `latest` or `--to <version>`, and needs the same long timeout as an install.
2. Run it without `--yes`. It answers `CONFIRMATION_REQUIRED` with `error.details.notes`: what will stop, what is backed up, and any Node major change. Relay those notes and wait for a clear yes before running it again with `--yes`. `success-noop` means that release is already running.
3. The installer backs up every SQLite database `config.yml` declares, plus `config.yml` and `app.env`, but not any other database: `BACKUP_REQUIRED` names those connections; have the user back them up first, then add `--backup-done`.
4. An upgrade keeps three releases, always including the new one and the one it came from, and prunes older ones once it succeeds; pass `--keep <n>` when the user wants more of them to stay available for rollback.
5. For the Hub, `upgrade --rebuild` builds the installed version again for this machine, for a Node major that changed while it was already on the latest version; the new build is a release of its own, and `result.rebuilt` is true.
6. Read the outcome:
   - Exit 0: the new release passed its health check. Report `result.fromVersion`, `result.toVersion`, the release id `result.to`, `result.migrations` and `result.backup`, relay each of `result.notes`, and name any release in `result.pruned`, which can no longer be rolled back to.
   - Exit 3: the previous release runs again. Report `error.message` and `error.details.log`, and leave the next attempt to the user once the cause is known.
   - Exit 4: the application is down. Work through `error.suggestions` with the user, step by step.

`rollback --dir <root> --json` returns to the release the last upgrade came from, or to `--to <release id or version>`. When that upgrade migrated the databases, rolling back restores the backup taken before it and loses whatever was stored since; the confirmation notes say so, and the same relay-and-confirm step applies. `--no-restore` keeps the current databases.

## Recover an interrupted operation

`OPERATION_INTERRUPTED` from `upgrade`, or `pending` in `status`, means an earlier run stopped while the application was down. Plain `rollback` recovers, through the same confirmation: it undoes an interrupted upgrade, restoring the databases, and finishes an interrupted rollback. An interrupted Hub rebuild is the exception: `rollback` cannot start a release built for another Node, so the error names `upgrade --rebuild`, which builds a fresh release and switches to it.

## Change the origin or port

app-installer has no command for it. The origin, address and port live in `app.env` as `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT`. Before changing them, tell the user:

- the application will be at the new origin plus its base path, and for a Hub the applications it hosts move with it;
- the application stops briefly while it restarts;
- a new port has to be free, or the application restarts into a crash loop that only `logs/app.err.log` explains, and a reverse proxy in front has to forward to it;
- `APP_BASE_PATH` cannot change this way: it is compiled into the client.

With their agreement, edit those three lines and nothing else, then run `pm2 restart <name>`, `<name>` being `name` in `status`. pm2 starts the application through `launcher.mjs`, which reads `app.env` on every start, so nothing has to be registered again. `status` afterwards reports the new `endpoints` and checks health at the address in `app.env`; for a new origin, have the user open `endpoints.url`.

## Keep the data intact

The root holds the only copy of the application's configuration, secrets and data. Change everything in it through app-installer, apart from the three `app.env` lines above, and leave the choice of deleting anything to the user. Keep the contents of `config.yml`, which holds the secrets, out of the conversation.
