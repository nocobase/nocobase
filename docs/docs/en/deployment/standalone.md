---
title: 'Manual: standalone'
description: Run the application on a server without a Hub, using app-installer, Docker or Node.js.
---

# Manual: standalone

This page describes the three ways to run an application without a Hub. It applies to the open-source edition and to deployments without a Professional license. app-installer is the recommended method: it installs the archive on the server, runs it under pm2, and performs upgrades and rollbacks. For an AI Agent, use the prompts in [Deploy with an AI Agent](./with-agent#deploy-to-a-server-with-app-installer).

## Build the archive

The Docker method builds inside the image; the other two methods build the archive first on a build machine, either a development machine or CI. Before building, confirm the server's architecture and Node major version on the server:

```bash
node -p "process.platform + '-' + process.arch + ' node ' + process.versions.node"
ldd --version 2>&1 | head -1   # musl in the output indicates an Alpine-type environment
```

Run the build in the application project root with the server's values in `--target` and `--node-version`; an Alpine environment uses a target with the `-musl` suffix:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
scp storage/exports/dist.tar.gz user@server:/tmp/crm.tar.gz
```

The archive contains `dist/` and `config.example.yml`, excludes runtime configuration and business data, and is not bound to a mount path. For a database other than SQLite, add the driver to the project before building, for example `pnpm add @nocobase/db-postgres`. `pnpm build` copies the allow-listed variables from the project's `.env` into `dist/.env`; confirm before building that it contains nothing that must not reach the production environment.

## Deploy with app-installer

The server requires Node.js 24 and a globally installed pm2 4.3 or later (`npm install -g pm2`; do not use a pm2 fetched through `npx`; on Windows, use WSL). Neither the sources nor pnpm are needed. NocoBase 3 packages are published to `https://npm.nocobase.ai`, which is specified with `--registry`.

### Install

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --base-path /crm
```

The target directory must not exist or must be empty. `--origin` carries no path; `--base-path` is the mount path, `/main` when omitted. By default the application listens on `127.0.0.1:13000`, uses SQLite, and runs under a pm2 process named `nocobase-` followed by the directory name. app-installer unpacks the archive, verifies that it was built for this machine, generates a `config.yml` with random secrets and an `app.env` with the runtime settings, runs the database migrations, starts the application under pm2 and waits for the health check to pass. A failure at any step before the start removes the files written so far; the command can simply be run again.

For another database, specify the connection settings with `--dialect` and `--set`; export the password to an environment variable first and read it with `--set-from-env`:

```bash
CRM_DB_PASSWORD=... npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/crm \
  --archive /tmp/crm.tar.gz --origin https://apps.example.com --base-path /crm --dialect postgres \
  --set database.connections.main.host=db.internal \
  --set database.connections.main.username=crm \
  --set-from-env database.connections.main.password=CRM_DB_PASSWORD
```

Three steps follow the installation: run `pm2 startup` and then the command it prints with sudo; forward the domain to `http://127.0.0.1:13000` as described in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy); open `https://apps.example.com/crm/`, sign in with the account configured under `users.initialAdmin` in `config.yml` and change the default password. Logs are available through `pm2 logs nocobase-crm` and are also stored under `logs/` in the installation directory.

When several applications are installed on one server, each uses its own directory, port (`--port`) and base path, and the reverse proxy routes by path to the corresponding port.

### Upgrade, roll back and status

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/crm --archive /tmp/crm.tar.gz
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/crm
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/crm
```

An upgrade first unpacks the new release and checks the configuration while the old release continues to serve, then stops the application, backs up the SQLite databases and configuration into `backups/`, switches releases, runs the migrations, starts the application and runs the health check. A failed migration or start is rolled back to the original release automatically. Before running, the command states the downtime scope and backup contents and requests confirmation; scripts pass `--yes` to skip the prompt. External databases are outside the backup scope: back them up separately and pass `--backup-done`. This backup serves rollbacks only, excludes uploads, and does not replace regular backups. Rebuilding the same version and upgrading with it counts as an upgrade as well.

A rollback returns to the release that the last upgrade started from; `--to` selects another release kept on disk. If the undone upgrade ran migrations, the SQLite databases are restored from the backup taken before it, and data written since is lost; `--no-restore` keeps the current databases. Three releases are kept on disk by default; `--keep` adjusts this.

To change the domain or port, edit `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT` in `app.env`, then run `pm2 restart nocobase-crm`. The complete list of flags and error codes is available through `--help`.

## Deploy with Docker

The application root ships a `Dockerfile` and a `Dockerfile.dockerignore`, which are used together: without the latter, local configuration and data enter the build context. The image runs `pnpm build` from source inside the container; its runtime layer contains only `dist/` and `config.example.yml`, is based on Debian bookworm with Node 24, and does not support an Alpine base image.

```bash
docker build -t crm:release-001 .
```

To build an image for another architecture, use `docker buildx build --platform linux/arm64`; the build stage obtains the target platform's native modules itself. When a `dist/` has already been built locally, `--build-arg DIST=prebuilt` packages it directly, in which case `--target` and `--platform` must be the same architecture.

Create the deployment directory on the server with `config.yml` and `storage/`. Fill in `config.yml` as described in [Runtime configuration](./configuration), using the in-container path `/app/storage/database.sqlite` for SQLite. The image runs as the `node` user (UID 1000); the `storage` directory must be writable by that user. The image does not contain pnpm, so application commands run as `node dist/cli/index.js`; check the configuration before the first start:

```bash
docker run --rm -v ./config.yml:/app/config.yml:ro crm:release-001 node dist/cli/index.js config check
```

Create `compose.yml`:

```yaml
services:
  crm:
    image: crm:release-001
    restart: unless-stopped
    init: true
    stop_grace_period: 60s
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_BASE_PATH: /crm
      APP_PUBLIC_ORIGIN: https://apps.example.com
      NOCOBASE_STRICT_STARTUP: 'true'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage
```

The image already sets `NODE_ENV=production`, `APP_CONFIG_FILE=/app/config.yml`, `APP_SERVER_HOST=0.0.0.0` and `APP_SERVER_PORT=13000`. It is mounted at `/main` by default; `APP_BASE_PATH` changes the mount path, and the built-in health check uses that path. `.env` is not carried into the image, so the required variables are provided here. Start the service:

```bash
docker compose up -d
docker compose logs --tail=100 crm
```

Inside the container, `localhost` refers to the container itself; the database host must be a service name or network address. To update, replace the image tag, keep the configuration and `storage` mounts, complete a backup and run `docker compose up -d`.

## Run with Node.js directly

Without app-installer or containers, the archive is unpacked, the configuration written and the process managed by hand. On the server:

```bash
mkdir -p /srv/nocobase/crm && cd /srv/nocobase/crm
tar -xzf /tmp/crm.tar.gz
mkdir -p storage
node dist/cli/index.js config init
node dist/cli/index.js config set database.connections.main.database=/srv/nocobase/crm/storage/database.sqlite
node dist/cli/index.js config check
```

`config init` generates a `config.yml` with random secrets from `config.example.yml`; `config set` changes a field, and `config set --from-env` reads passwords from environment variables; `config check` loads the configuration the way the service does and connects to the database. Then set the account and password as described under [Initial administrator](./configuration#initial-administrator).

Start in the foreground to verify:

```bash
NODE_ENV=production \
APP_CONFIG_FILE=/srv/nocobase/crm/config.yml \
APP_BASE_PATH=/crm \
APP_PUBLIC_ORIGIN=https://apps.example.com \
APP_SERVER_HOST=127.0.0.1 \
APP_SERVER_PORT=13000 \
node ./dist/server/standalone.js
```

Request `http://127.0.0.1:13000/crm/api/healthz`; `ok` being `true` in the returned JSON indicates that the application is ready. Stop the foreground process and hand the application to systemd for long-term operation. Create `/etc/systemd/system/nocobase-crm.service`:

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

Start it with `systemctl enable --now nocobase-crm` and read the logs with `journalctl -u nocobase-crm`. To use pm2 instead of systemd, copy `ecosystem.config.js` from the project root into the deployment root and run `pm2 start` on it; do not point `script` directly at `standalone.js`, because pm2's wrapper prevents the server from starting.

To update, stop the application, back up the database and configuration, move the old `dist` away and put the new one in place, keep `config.yml` and `storage`, add any new settings from the new `config.example.yml`, and start the application.

## Acceptance

After deployment by any of the methods, perform the following checks:

1. Request `https://apps.example.com/crm/api/healthz`; `ok` is `true`.
2. Sign in, sign out and refresh a nested page through the public domain; confirm that static assets and the realtime connection work.
3. Create a test record and upload a file; confirm that both remain after a service restart.
4. The default password has been changed.

Failures are covered in [Troubleshooting](./troubleshooting).
