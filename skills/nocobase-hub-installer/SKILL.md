---
name: nocobase-hub-installer
description: Install, upgrade, roll back and check a NocoBase 3 Hub on a server with `@nocobase/hub-installer`, for a Hub whose source is not changed. Use when the user asks to install, deploy, upgrade or roll back a NocoBase Hub, or when the directory holds an `installer.json` written by hub-installer. Not for developing or customising a Hub, which is an application project, and not for publishing an application to a Hub.
---

# Run a NocoBase 3 Hub with hub-installer

`@nocobase/hub-installer` builds the published Hub template on the server, keeps only its deployment archive under `releases/<version>/hub`, and runs it under pm2. `config.yml`, `hub.env`, `storage/`, `backups/` and `logs/` sit beside the releases and survive every upgrade. This Skill decides when to use it and how to act on what it reports; `--help` is the reference for every flag.

## Run it

Every command goes through `npx` with the registry named, and with `--json`:

```bash
npx --yes --registry="${NOCOBASE_REGISTRY:-https://npm.nocobase.ai}" @nocobase/hub-installer <command> … --json
```

NocoBase 3 publishes to `https://npm.nocobase.ai`, not to the public npm, so a bare `npx @nocobase/hub-installer` answers 404. `NOCOBASE_REGISTRY` is set only when someone points the shell at another registry, such as an unreleased snapshot; the installer reads the same variable for the Hub template, records the registry it installed from in `installer.json`, and upgrades from it. The `--yes` before the package is npx's own: it downloads the installer without asking. The installer's `--yes`, after the command, is a separate answer that only the user gives.

`--json` prints one document on stdout and progress on stderr. Read the document, not the exit code alone: `ok`, `status` (`success`, `success-noop` or `error`), `result`, and on failure `error.code`, `error.message`, `error.suggestions` (each a `message` and, where there is one, a `run` command that runs as printed) and `error.details`.

| Exit | Meaning                                                                                 |
| ---- | --------------------------------------------------------------------------------------- |
| `0`  | Done, or nothing to do (`success-noop`).                                                |
| `1`  | Failed; a Hub that was already running was not touched.                                 |
| `2`  | Invalid usage, a failed precheck, or a confirmation still needed; nothing was written. |
| `3`  | An upgrade failed after switching and was rolled back; the previous release is running. |
| `4`  | Rolling back failed too; the Hub is down.                                               |

## Choose the route

Settle this with the user before installing anything:

- The Hub's source will change — its own code or plugins: it is an application project. Create it with the `nocobase-create-app` Skill, whose `pnpm create @nocobase/app <name>` takes `--template=hub`, and deploy it with that project's own `nocobase-deployment` Skill. When a Hub installed by hub-installer is already running, say that hub-installer does not move its data into a project, and leave that Hub running while the user decides.
- Docker is available and preferred: follow the Hub deployment documentation instead. The Compose walkthrough, `通过 Docker 部署`, is on the Chinese page, https://github.com/nocobase/nocobase3/blob/develop/docs/docs/cn/app/deployment/hub.md#通过-docker-部署; the English page names the published images and what to persist, https://github.com/nocobase/nocobase3/blob/develop/docs/docs/en/app/deployment/hub.md.
- Otherwise, an unmodified Hub on a server with Node.js: this Skill.

When the working directory already holds `installer.json`, the Hub exists: start with `status`.

## Install

1. Check the server: `node --version` (24 or later), `pnpm --version` (11 or later), `tar --version`, and `command -v pm2`, which finds pm2 without starting its daemon. pm2 4.3 or later has to be installed globally, `npm install -g pm2`; a copy fetched through `npx` breaks `pm2 startup`. Report what is missing with the command that installs it, and install nothing globally unless the user asks. On Windows, work in WSL.
2. Settle with the user: the target directory, new or empty, such as `/srv/nocobase/hub`; the public origin without `/hub`, such as `https://apps.example.com`; whether a reverse proxy will sit in front; the port, 13000 by default; and the database, SQLite by default.
3. Run `install <dir> --origin <origin> --json`, adding `--port` when it is not 13000. The Hub listens on `127.0.0.1`, which suits a reverse proxy on the same server; when people reach it directly at `http://<address>:<port>`, add `--host 0.0.0.0` and use that address as the origin. With `0.0.0.0` the health check still probes loopback, so it passes either way; any other address is probed as given, so prefer `0.0.0.0` to a specific interface. For another database add `--dialect <dialect>`, the connection as `--set database.connections.main.host=…` and friends, and the password as `--set-from-env database.connections.main.password=<VARIABLE>` after the user has exported it. It builds on the server and takes several minutes: give the command a timeout of 30 minutes or more. A shorter one interrupts the build. The installer removes what it wrote when the interruption is a signal it can catch, SIGINT or SIGTERM; a tool that kills with SIGKILL leaves the target half-written, and the next `install` refuses it with `TARGET_NOT_EMPTY`. Report that, and leave emptying the directory to the user.
4. When `result.started` is true, the Hub answered its health check. Tell the user:
   - `result.url`, and the first sign-in: `result.initialAdmin.username` or its `email`, with the password under `users.initialAdmin` in `config.yml`. When `result.initialAdmin.defaultPassword` is true, that password is still the template's `admin123` and has to be changed after signing in; otherwise it is the one they set. The result never carries the password, and `config.yml` stays unread;
   - each command in `result.nextCommands`: `pm2 startup` prints a command they run once with sudo, after which pm2 restores the process list the installer saved, so the Hub comes back after a reboot;
   - with a reverse proxy: it forwards the whole origin with `location /` to the Hub's port, with `client_max_body_size 260m` and the WebSocket upgrade headers;
   - anything in `warnings`.

A failed install before the switch leaves the target as it found it. What the failing step said is in `error.details`: `output` for generating, building and unpacking the release, `stderr` and `stdout` when the release's own CLI printed no result; a failure that CLI reports itself keeps the CLI's own code, such as `CONFIG_INVALID`, and its `error.message` and `error.suggestions` say what was wrong. `START_FAILED` means installed but not running: show `error.details.log`.

## Status

`status --dir <root> --json` changes nothing; `--offline` also skips asking the registry for a newer version. Report `current`, `endpoints.url`, `health.ok`, `process`, `updateAvailable`, and anything in `warnings`. `node.matches: false` means the machine's Node major changed since the release was built, and the release will not load its native modules until it is built again for this machine: the warning names the command, `upgrade --rebuild`, which builds the installed version again and swaps it in through the same stop, backup and confirmation as an upgrade, so the relay-and-confirm step below applies to it too. An upgrade to a newer version builds for the new Node by itself. A non-null `pending` means an operation was interrupted; see below.

## Upgrade and roll back

Both stop the Hub and every application it hosts, so the user decides:

1. Run `upgrade --dir <root> --json` without `--yes`; an upgrade that builds a release needs the same long timeout as an install. It answers `CONFIRMATION_REQUIRED` with `error.details.notes`: what will stop, what is backed up, and any Node major change. Relay those notes and wait for a clear yes before running it again with `--yes`. `success-noop` means the Hub is already on that version.
2. On any database but SQLite, the installer backs up `config.yml` and `hub.env` but not the database: have the user back the database up first, then add `--backup-done`.
3. An upgrade keeps three releases, always including the new one and the one it came from, and prunes older ones once it succeeds; pass `--keep <n>` when the user wants more of them to stay available for rollback.
4. `upgrade --rebuild` builds the installed version again for this machine, for a Node major that changed while the Hub was already on the latest version; with `--to` it builds that version rather than reusing a copy on disk. It is confirmed and read like an upgrade, and `result.rebuilt` is true.
5. Read the outcome:
   - Exit 0: the new release passed its health check. Report `result.from`, `result.to`, `result.migrations` and `result.backup`, relay each of `result.notes`, and name any release in `result.pruned`, which can no longer be rolled back to.
   - Exit 3: the previous release runs again. Report `error.message` and `error.details.log`, and leave the next attempt to the user once the cause is known.
   - Exit 4: the Hub is down. Work through `error.suggestions` with the user, step by step.

`rollback --dir <root> --json` returns to the release the last upgrade came from, or to `--to <version>`. When that upgrade migrated the database, rolling back restores the backup taken before it and loses whatever the Hub stored since; the confirmation notes say so, and the same relay-and-confirm step applies. `--no-restore` keeps the current database.

## Recover an interrupted operation

`OPERATION_INTERRUPTED` from `upgrade`, or `pending` in `status`, means an earlier run stopped while the Hub was down. Plain `rollback` recovers, through the same confirmation: it undoes an interrupted upgrade, restoring the database, and finishes an interrupted rollback. An interrupted rebuild is the exception: `rollback` cannot start a release built for another Node, so the error names `upgrade --rebuild`, which puts back what the interrupted run moved and builds again.

## Change the origin or port

hub-installer has no command for it. The origin, address and port live in `hub.env` as `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT`. Before changing them, tell the user:

- the Hub will be at the new origin plus `/hub`, and the applications it hosts move to the new origin with it;
- the Hub and its applications stop briefly while it restarts;
- a new port has to be free, or the Hub restarts into a crash loop that only `logs/hub.err.log` explains, and a reverse proxy in front has to forward to it;
- with a reverse proxy, the same proxy rules as for an install apply, and `APP_SERVER_HOST` stays `127.0.0.1` only when the proxy runs on the same server.

With their agreement, edit those three lines and nothing else, then run `pm2 restart <name>`, `<name>` being `name` in `status`. pm2 starts the Hub through `launcher.mjs`, which reads `hub.env` on every start, so nothing has to be registered again. `status` afterwards reports the new `endpoints` and checks health at the address in `hub.env`, which confirms a new host or port took effect; for a new origin, have the user open `endpoints.url`.

## Keep the Hub's data intact

The root holds the Hub's only copy of its configuration, secrets and data. Change everything in it through hub-installer, apart from the three `hub.env` lines above, and leave the choice of deleting anything to the user. Keep the contents of `config.yml`, which holds the secrets, out of the conversation.
