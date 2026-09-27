---
title: 'Standalone: build and run'
description: Build the deployment archive and run the application on a server on its own, without Hub.
---

# Standalone: build and run

This page covers the Node.js deployment flow without Hub. For containers, build as described here and then continue with [Standalone: Docker](./docker); for platform hosting, see [Deploy Hub](./hub).

To avoid extracting archives, supervising the process and taking backups by hand, use [app-installer](./app-installer) instead: it installs the same archive on the server, runs it under pm2, and handles pre-upgrade backups, upgrades and rollbacks. The build steps on this page still apply; the installer takes over the steps on the server.

## Environment and directories

Build and run on Node.js 24, with the pnpm version the project's `packageManager` names. This page assumes Linux x64 with glibc; choose `linux-arm64` for ARM64, and for musl environments such as Alpine pick the matching target and verify the native dependencies.

The build flags need the server's CPU architecture, Node major version and libc. Confirm them on the target server:

```bash
uname -sm
node -p "process.versions.node + ' ABI ' + process.versions.modules"
ldd --version 2>&1 | head -1   # musl in the output means an Alpine-like environment
```

Keep three kinds of content apart: `dist` is replaceable code, `config.yml` is the target environment's configuration, and `storage` is data to preserve, such as the database, uploaded files and logs. Sessions are held in memory by default, so a restart signs everyone out. This page uses a fixed deployment root and replaces only `dist` on an upgrade, never the configuration or `storage`.

```text
/srv/nocobase/crm/
  dist/                  the running code and its production dependencies
  config.example.yml     the configuration reference for the current version
  config.yml             the real runtime configuration
  storage/               persistent data
  releases/              retained archives, named by whoever operates the server
```

Create `/srv/nocobase/crm` and a dedicated service account first. The account needs to read `dist` and `config.yml` and write to `storage`. Run the extraction steps below as that account; if an administrator does it instead, hand ownership of the configuration file and the persistent directories to the service account afterwards.

## Build the deployment archive

Run the following in the root of your application project, not in the NocoBase monorepo. Install dependencies with the project's lockfile and its pnpm version.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
APP_BASE_PATH=/crm pnpm build --target linux-x64 --node-version 24 --tar
tar -tzf storage/exports/dist.tar.gz | head -30
```

The output is `storage/exports/dist.tar.gz`, containing `dist/` and `config.example.yml`, and `dist` already carries its production dependencies. The real configuration and local business data do not belong in the artifact. Note that `pnpm build` copies the allow-listed keys of the project's `.env`, such as `DB_PASSWORD` and `APP_BASE_PATH`, into `dist/.env`, which ships with the artifact; before building, make sure it holds nothing that must not reach production. Native dependencies from a default build on macOS cannot be used on Linux. State the mount path explicitly at build time and keep it the same at runtime; after changing the path, rebuild and check the static assets.

## Run with Node.js directly

**First installation.** Copy the archive to the server and extract it into a `/srv/nocobase/crm` that has no application installed yet. These are the first-installation steps; an environment that already runs a version follows [Update and roll back](./standalone#update-and-roll-back) instead.

```bash
cd /srv/nocobase/crm
tar -xzf /path/to/dist.tar.gz
test -f config.yml || cp config.example.yml config.yml
mkdir -p storage
chmod 600 config.yml
```

Keep the template's feature settings, change the database and secrets, and set the [initial administrator](./configuration#configure-the-initial-administrator) before the first start. Run `openssl rand -hex 32` twice and put the two values into `auth.secret` and `session.secret`; never keep the template placeholders. The following are the key parts to merge into the real configuration, not a complete template:

```yaml
auth:
  secret: REPLACE_WITH_GENERATED_AUTH_SECRET
session:
  secret: REPLACE_WITH_GENERATED_SESSION_SECRET
database:
  default: main
  connections:
    main:
      dialect: sqlite
      database: /srv/nocobase/crm/storage/database.sqlite
      schemaManagement: managed
      migrations:
        autoRun: true
      seeds:
        autoRun: true
```

SQLite names its file with `database`. With PostgreSQL, MySQL or another database, also confirm the build output includes the matching driver, fill in the real connection details and verify connectivity; the driver requirements are in [Production configuration](./configuration#checks-before-connecting). To control when a release runs its migrations, turn off the corresponding automatic option and have the release operator run them.

**Verify in the foreground.** In the deployment root, run:

```bash
NODE_ENV=production \
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
node ./dist/server/standalone.js
```

`APP_PUBLIC_ORIGIN` carries no `/crm`; the mount path comes from `APP_BASE_PATH`. Request `http://127.0.0.1:13000/crm/api/healthz`: a JSON response whose `ok` is `true` means the application is ready, and the other fields are the application name and mount path. Signing in from a browser needs localhost or HTTPS, because the session cookie carries the `Secure` flag in production mode. Check the real pages and the logs, then stop the foreground process before handing over to the service manager, so two applications never run against the same data.

**Long-running service.** A Linux systemd example: save the following as `/etc/systemd/system/nocobase-crm.service`. The `nocobase` account must already exist, and the Node path must be replaced with what `command -v node` prints on the server.

```ini
[Unit]
Description=NocoBase CRM
After=network.target

[Service]
Type=simple
User=nocobase
WorkingDirectory=/srv/nocobase/crm
Environment=NODE_ENV=production
Environment=APP_CONFIG_FILE=/srv/nocobase/crm/config.yml
Environment=APP_BASE_PATH=/crm
Environment=APP_PUBLIC_ORIGIN=https://apps.example.com
Environment=APP_SERVER_HOST=127.0.0.1
Environment=APP_SERVER_PORT=13000
Environment=NOCOBASE_STRICT_STARTUP=true
ExecStart=/usr/bin/node /srv/nocobase/crm/dist/server/standalone.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=60

[Install]
WantedBy=multi-user.target
```

`NOCOBASE_STRICT_STARTUP=true` makes the application exit non-zero when startup fails, which is what lets `Restart=on-failure` actually restart it. An administrator runs `systemctl daemon-reload` and `systemctl enable --now nocobase-crm`. Check `systemctl status nocobase-crm` and `journalctl -u nocobase-crm`; restart with `systemctl restart nocobase-crm`.

**Running with pm2.** When systemd is not an option, [pm2](https://pm2.keymetrics.io/) can supervise the process. The application project ships an `ecosystem.config.js` that has pm2 run `node ./dist/server/standalone.js` directly (`interpreter: 'none'`) and sets `NODE_ENV=production`. Do not point `script` at `standalone.js` instead: pm2 would load it through its own wrapper, `standalone.js` would find it is not the main module and never start the server, and pm2 would still report the process as online. The file is not part of the deployment archive: copy it from the project into the deployment root, beside `dist`. Pass the remaining runtime settings as environment variables or add them to the file's `env` block. The file sets `cwd: import.meta.dirname`, so its relative paths resolve against its own directory and it can be started by its full path from anywhere; the example below runs from the deployment root:

```bash
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
pm2 start ecosystem.config.js
pm2 save
```

The process name is `nocobase-` followed by the application's package name without its scope, read from `package.json` in the project root or from `dist/package.json` in a deployment root; set `APP_PM2_NAME` to choose another. Two applications on one machine need different names, or the second `pm2 start` restarts the first. The file is an ES module: if pm2 reports a syntax error when loading it from a deployment root that has no `package.json`, rename it to `ecosystem.config.mjs`. Use `pm2 restart <name>` to restart, `pm2 logs <name>` to read logs, and `pm2 startup` to print the command that starts pm2 at boot.

## Configure HTTPS

Once the foreground start works, set up the domain, certificate and forwarding as described in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy), then carry out the acceptance checks below.

## Initialize and verify

Open `https://apps.example.com/crm/` and sign in with the username and password from the [initial administrator configuration](./configuration#configure-the-initial-administrator). With the default configuration unchanged, the username is `nocobase` and the password `admin123`; the configured email, `admin@nocobase.com` by default, also signs in. When the default password is in use, change it right after the first sign-in and before opening access. An existing application keeps its original account, and changing the initialization settings does not reset its password; customized initialization tasks follow the project's own rules.

Request `https://apps.example.com/crm/api/healthz` first: a JSON response whose `ok` is `true` means the application is ready, and the same address serves as the health check for a service manager or load balancer. Then verify sign-in, sign-out, page refresh, static assets, the API, realtime connections and real business operations. Create a test record and upload a file, restart the service, and confirm both are still there. Confirm external callbacks and notification links use the right domain and mount path.

## Update and roll back

Build the new archive in the build environment first, check migration compatibility, and back up the database, files and configuration. Extract the new archive into a separate temporary directory and inspect it, keeping the old archive. Schedule a maintenance window, stop the application, move the old `dist` into the retained directory and put the new `dist` into the deployment root; keep the original `config.yml` and `storage`. Review the configuration differences against the new template, without overwriting the real configuration. After starting, repeat [Initialize and verify](./standalone#initialize-and-verify).

The Docker route uses a new image tag: back up, update `image` in the Compose file, run `docker compose up -d`, and keep the existing mounts. If acceptance fails, switching straight back to the old image or `dist` is only possible while the database is still compatible with the old code; otherwise restore as a set, as described in [Backup and recovery](./operations#backup-and-recovery).

## Troubleshooting and operations

When a start or an update fails, see [Backup, recovery and troubleshooting](./operations).

## Advanced: App Host without Hub

App Host also supports a standalone mode that discovers build outputs in a local application directory and mounts the applications by path, activating them on demand by default. It differs from the [standalone application deployment](./standalone) on this page and does not provide Hub's management console or publishing flow. Choosing this mode means managing directories, artifacts, configuration and recovery yourself; see `packages/app/app-host/README.md` in the repository.
