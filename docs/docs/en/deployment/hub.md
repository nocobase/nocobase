---
title: 'Manual: Hub'
description: Install a Hub and publish applications to it from the management console or the CLI.
---

# Manual: Hub

Hub is NocoBase's platform for publishing and managing applications. It is a Professional edition feature and requires a Professional license to install and use; the open-source edition deploys as described in [Manual: standalone](./standalone). This page covers the installation of a Hub first, then the publishing of an application; if the team already has a Hub, continue at [Publish an application](#publish-an-application). For an AI Agent, use the prompts in [Deploy with an AI Agent](./with-agent#publish-to-a-hub).

## Components of a Hub

Hub is itself a NocoBase application, built from the `@nocobase/app-template-hub` template. It provides the management console, records applications, Releases, runtime configuration and deployment operations, and starts an App Host in the background to run the business applications. In the current version one Hub manages one local Host, and all applications run inside that Host process. Replacing an application's version stops the old instance before starting the new one, so a service interruption window must be planned for.

| Address                         | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `https://apps.example.com/hub/` | Sign in to Hub and manage applications and deployments |
| `https://apps.example.com/crm/` | Access the CRM business application                    |

Hub is mounted at `/hub` and each application at `/<app ID>`. The reverse proxy forwards the entire domain to Hub; no application requires a port of its own.

## Install Hub

Both installation methods require a persistent directory for Hub's database, the uploaded Releases and each application's data.

### Install with Docker

The official image supports Linux amd64 and arm64 and is published to `ghcr.io/nocobase/hub` and `registry.cn-beijing.aliyuncs.com/nocobase/hub`. Each release pushes `latest` and a fixed tag of the form `run-<run ID>-<attempt>`; pin a deployment to the latter or to the image digest. Images do not use npm version numbers as tags.

Create the deployment directory on the server, pull the image and extract the configuration template from it:

```bash
mkdir -p hub/storage && cd hub
hub_image=ghcr.io/nocobase/hub:latest
docker pull "$hub_image"
docker run --rm --entrypoint cat "$hub_image" /app/config.example.yml > config.example.yml
cp config.example.yml config.yml
echo "HUB_IMAGE=$hub_image" > .env
```

Edit `config.yml`: generate two values with `openssl rand -hex 32` and use them to replace `auth.secret` and `session.secret`; set the account and password as described under [Initial administrator](./configuration#initial-administrator); keep the template's SQLite path for the database. The official image contains the SQLite driver only; another database requires building a custom image.

Create `compose.yml`:

```yaml
services:
  hub:
    image: ${HUB_IMAGE:?Set HUB_IMAGE}
    restart: unless-stopped
    init: true
    stop_grace_period: 60s
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      NODE_ENV: production
      APP_CONFIG_FILE: /app/config.yml
      APP_STORAGE_DIR: /data
      APP_BASE_PATH: /hub
      APP_PUBLIC_ORIGIN: https://apps.example.com
      APP_SERVER_HOST: 0.0.0.0
      APP_SERVER_PORT: '13000'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/data
```

The image runs as the `node` user (UID 1000); the `storage` directory must be writable by that user. Start the service and review the logs:

```bash
docker compose up -d
docker compose logs --tail=100 hub
```

After editing `config.yml`, run `docker compose up -d --force-recreate hub` to apply it. To upgrade Hub, update `HUB_IMAGE` in `.env` and run `docker compose pull hub && docker compose up -d hub`.

### Install with app-installer

Without Docker, and without changes to Hub's source, Hub can be installed on a Node.js server with app-installer. The server requires Node.js 24, pnpm 11 and a globally installed pm2 4.3 or later (`npm install -g pm2`; do not use a pm2 fetched through `npx`). NocoBase 3 packages are published to `https://npm.nocobase.ai`, which is specified with `--registry`:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer install /srv/nocobase/hub --template hub --origin https://apps.example.com
```

app-installer builds Hub on the server, generates a `config.yml` with random secrets, runs the database migrations, starts Hub under pm2 and waits for the health check to pass; the process takes several minutes. By default it listens on `127.0.0.1:13000` and uses SQLite. For another database, specify the connection settings with `--dialect` and `--set`, and read the password from an environment variable with `--set-from-env`. After installation, run `pm2 startup` and then the command it prints with sudo, so that pm2 starts Hub after a server reboot.

Subsequent upgrades, rollbacks and status queries:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/app-installer upgrade --dir /srv/nocobase/hub
npx --registry=https://npm.nocobase.ai @nocobase/app-installer rollback --dir /srv/nocobase/hub
npx --registry=https://npm.nocobase.ai @nocobase/app-installer status --dir /srv/nocobase/hub
```

Before an upgrade, app-installer states the downtime scope and backup contents and requests confirmation; a failed upgrade is rolled back to the original version automatically. The complete list of flags is available through `--help`.

A Hub with modified source is an ordinary application project: build its archive as described in [Manual: standalone](./standalone), install it with `--archive`, and set the runtime `APP_BASE_PATH` to `/hub`.

### Reverse proxy and first sign-in

Forward the entire domain to `http://127.0.0.1:13000` as described in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy), and add `client_max_body_size 260m;` to the Nginx `server` block. Hub accepts Releases of up to 256 MiB.

Open `https://apps.example.com/hub/` and sign in with the account configured under `users.initialAdmin` in `config.yml`. The template default is the user `nocobase` with the password `admin123`; change it immediately after signing in.

## Publish an application

### 1. Create the application in Hub

Sign in to Hub, create the application and record its app ID. The app ID is unique across the Hub and may contain only letters, digits, underscores and hyphens; the application path is fixed at `/<app ID>`, so `crm` corresponds to `https://apps.example.com/crm/`.

### 2. Build the archive

Run the build in the application project root. `--target` and `--node-version` must match the environment in which the Hub process actually runs: a Hub installed with Docker is always Linux glibc with Node 24, on the image's architecture; a Hub installed with app-installer follows the server's environment.

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

Use `linux-arm64` for an ARM64 server. If the parameters do not match the runtime environment, the upload and deployment still succeed, and the application fails at startup because its native modules do not load. The build output is `storage/exports/dist.tar.gz`.

### 3. Deploy from the management console

1. Open the application details and upload the archive. Uploading stores a Release without switching the running version.
2. Click **Deploy** and select the Release to run.
3. For a first deployment, choose the **Configuration file** mode and fill in the database and other settings, starting from the Release template. `auth.secret` and `session.secret` may be left empty or as placeholders; Hub generates them. Later deployments reuse the current configuration by default.
4. Submit and wait for the deployment record to show success; on failure, review that deployment's log.
5. Open the application address, sign in and verify the business features.

### 4. Deploy from the CLI

The CLI requires a Hub API key. Create one on the **API Keys** page in the Hub navigation: select the target application and grant the **Upload release** and **Deploy release** permissions. The plaintext key is shown only at creation; the bound applications and permissions cannot be changed afterwards.

Set the following in the application project's `.env`, which is not committed to the repository:

```dotenv
HUB_URL=https://apps.example.com/hub
HUB_APP_ID=crm
HUB_API_KEY=REPLACE_WITH_PUBLISHING_KEY
```

The `hub deploy` and `hub upload` commands are provided by `@nocobase/hub-cli`. The default template depends on it; other templates run `pnpm add -D @nocobase/hub-cli` first. The commands run in the source project; the build output `dist/` does not contain them.

For a first deployment, upload and deploy while submitting the runtime configuration:

```bash
pnpm nocobase hub deploy --config ./runtime.yml --json
```

Later updates without `--config` reuse Hub's current configuration; with `--config`, the whole document is replaced, so a complete configuration must be submitted. To upload without deploying, and to deploy a Release that is already uploaded:

```bash
pnpm nocobase hub upload --json
pnpm nocobase hub deploy --release-id <RELEASE_ID> --json
```

`hub deploy` waits for the final result by default, with a timeout of 600 seconds. Exit code `0` indicates success, `1` a rejection by Hub or a failed deployment, `2` a local argument error, and `3` a network error or an unconfirmed result. Exit code `3` does not indicate a failed deployment: review the deployment record in Hub first, then retry with the same `--idempotency-key`.

## Update, roll back, start and stop

- **Update**: build a new archive, upload and deploy it. Complete a backup first when the change includes database migrations. The application is interrupted while the version is replaced.
- **Roll back**: select a successful deployment in the deployment history and roll back to it, or deploy an earlier Release with `pnpm nocobase hub deploy --release-id <RELEASE_ID> --idempotency-key <NEW_ROLLBACK_KEY> --json` from the CLI. Use a new idempotency key for each new rollback; reuse that key only when retrying the same rollback after a network error or an unconfirmed result. Without a new key, the command may reuse a historical deployment and return its earlier result without switching the running version. A rollback does not undo database changes; if the old version is incompatible with the current database, the matching backup taken before the deployment must be restored.
- **Stop and start**: operated from the application details. Stopping keeps the deployment, configuration and data.
- **Remove**: deletes the application record, all Releases, the configuration and the application's data volume. Complete a backup before removing.

## Upgrade Hub

Upgrading Hub restarts every application it hosts and should be scheduled when a service interruption is acceptable. Before upgrading, confirm that no deployment is in progress and back up Hub's persistent directory and `config.yml`; Hub's `auth.secret` also encrypts publishing credentials, so a restore must use the secret that matches the database. The upgrade commands are listed under the corresponding installation method above. After the upgrade, check each business application individually.

If the upgrade changes Hub's Node major version, published applications must be rebuilt with the new `--node-version` and published again; otherwise their native modules fail to load at startup.
