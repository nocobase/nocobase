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

Edit `config.yml`: generate a key with `openssl rand -hex 32` and use it to replace the placeholder under `secrets.keys`; set the account and password as described under [Initial administrator](./configuration#initial-administrator); keep the template's SQLite path for the database. The official image contains the SQLite driver only; another database requires building a custom image.

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

Forward the entire domain to `http://127.0.0.1:13000` as described in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy), and add `client_max_body_size 260m;` to the Nginx `server` block. That limit is for the management console, which uploads a whole archive of up to 256 MiB in one request; `hub deploy` and `hub upload` send an archive of up to 2 GiB in resumable 8 MiB chunks and need the proxy to allow only 8 MiB.

Open `https://apps.example.com/hub/` and sign in with the account configured under `users.initialAdmin` in `config.yml`. The template default is the user `nocobase` with the password `admin123`; change it immediately after signing in.

## Publish an application

An application is published either from the CLI, which builds the archive for the Hub, uploads it and deploys it in one command, or by uploading an archive in the management console. Both start by creating the application in Hub.

### 1. Create the application in Hub

Sign in to Hub, create the application and record its app ID. The app ID is unique across the Hub and may contain only letters, digits, underscores and hyphens; the application path is fixed at `/<app ID>`, so `crm` corresponds to `https://apps.example.com/crm/`.

### 2. Deploy from the CLI

The `hub` commands are provided by `@nocobase/hub-cli`. The default template depends on it; other templates run `pnpm add -D @nocobase/hub-cli` first. The commands run in the source project, locally or in CI; the build output `dist/` does not contain them.

Add the Hub application as a remote. Its URL is the Hub URL, including Hub's mount path, followed by `/apps/<app ID>`:

```bash
pnpm nocobase hub remote add origin https://apps.example.com/hub/apps/crm
```

The remote is saved in `.nocobase/hub.json` in the project root. The file holds addresses only and is committed, so everyone working on the project deploys to the same place. A project generated by an earlier version of `create-app` ignores `.nocobase/` in its `.gitignore`; `hub remote add` warns when it does, and that line has to be removed for the file to be committed. The first remote added is the default; add one for each further Hub or application, such as `staging`, and select it with `--remote <name>`. `hub remote list` lists the remotes.

The CLI authenticates with a Hub API key. Create one on the **API Keys** page in the Hub navigation: select the target application and grant the **Upload release** and **Deploy release** permissions. The plaintext key is shown only at creation; the bound applications and permissions cannot be changed afterwards. Save the key on the machine that deploys:

```bash
pnpm nocobase hub auth login
```

The command asks for the key without echoing it, checks with Hub that the key opens the application, and saves it outside the project in `~/.config/nocobase/hub-credentials.json` (`%APPDATA%\nocobase` on Windows), readable by the current user only. `hub auth status` reports whether each remote has a key and whether Hub accepts it; `hub auth logout` removes the saved key, which stays valid in Hub until it is disabled there. The CLI reads no key or Hub address from `.env`, environment variables or command-line flags.

For a first deployment, deploy while submitting the runtime configuration:

```bash
pnpm nocobase hub deploy --config ./runtime.yml --json
```

`hub deploy` asks Hub which platform it runs applications on, builds the archive for that platform with the matching `--target` and `--node-version`, uploads it as a Release and deploys it; there is no need to run `pnpm build` first. If Hub already has the same archive, its existing Release is deployed. Later updates without `--config` reuse Hub's current configuration; with `--config`, the whole document is replaced, so a complete configuration must be submitted. To upload without deploying, and to deploy a Release that is already uploaded:

```bash
pnpm nocobase hub upload --json
pnpm nocobase hub deploy --release-id <RELEASE_ID> --json
```

`--no-build` uploads the existing `storage/exports/dist.tar.gz` instead of building, and `--file <path>` uploads another archive. Either archive is checked against Hub's platform before it is uploaded; one built for another platform fails with `BUILD_TARGET_MISMATCH`.

`hub deploy` waits for the final result by default, with a timeout of 600 seconds that bounds each request to Hub and the wait, not the build or the upload as a whole. Exit code `0` indicates success, `1` a rejection by Hub, a failed build or a failed deployment, `2` a local argument error, and `3` a network error or an unconfirmed result. Exit code `3` does not indicate a failed deployment: review the deployment record in Hub first, then retry with the same `--idempotency-key`.

### 3. Deploy from CI

Store the API key as a CI secret and pipe it into `hub auth login --with-token` before deploying; the remote comes from the committed `.nocobase/hub.json`:

```bash
echo "$HUB_KEY" | pnpm nocobase hub auth login --remote production --with-token
pnpm nocobase hub deploy --remote production --json
```

`HUB_KEY` is the name of the CI secret; the CLI does not read it from the environment itself. A pipeline that should only upload needs a key with the **Upload release** permission alone: it runs `hub upload`, and a person deploys the reported Release with `hub deploy --release-id`.

### 4. Deploy from the management console

Build the archive in the application project root. `--target` and `--node-version` must match the environment in which the Hub process actually runs: a Hub installed with Docker is always Linux glibc with Node 24, on the image's architecture; a Hub installed with app-installer follows the server's environment.

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

Use `linux-arm64` for an ARM64 server. If the parameters do not match the runtime environment, the upload and deployment still succeed, and the application fails at startup because its native modules do not load. The build output is `storage/exports/dist.tar.gz`.

1. Open the application details and upload the archive. Uploading stores a Release without switching the running version.
2. Click **Deploy** and select the Release to run.
3. For a first deployment, choose the **Configuration file** mode and fill in the database and other settings, starting from the Release template. `secrets.keys`, `auth.secret` and `session.secret` may be left out or as placeholders; Hub generates them. Later deployments reuse the current configuration by default.
4. Submit and wait for the deployment record to show success; on failure, review that deployment's log.
5. Open the application address, sign in and verify the business features.

## Update, roll back, start and stop

- **Update**: run `pnpm nocobase hub deploy` again, or build a new archive, upload and deploy it in the management console. Complete a backup first when the change includes database migrations. The application is interrupted while the version is replaced.
- **Roll back**: select a successful deployment in the deployment history and roll back to it, or deploy an earlier Release from the CLI: `pnpm nocobase hub releases` lists the Releases and marks the one that runs, `pnpm nocobase hub deploy --release-id <RELEASE_ID> --json` deploys the chosen one, and `pnpm nocobase hub status` reports the running version and the last deployment. No idempotency key is needed: the default one moves past the earlier deployment of that Release, so the rollback runs, and running the same command again after a network error or an unconfirmed result repeats nothing. Pass `--idempotency-key` only to deploy again what the App already runs. A rollback does not undo database changes; if the old version is incompatible with the current database, the matching backup taken before the deployment must be restored.
- **Stop and start**: operated from the application details. Stopping keeps the deployment, configuration and data.
- **Remove**: deletes the application record, all Releases, the configuration and the application's data volume. Complete a backup before removing.

## Upgrade Hub

Upgrading Hub restarts every application it hosts and should be scheduled when a service interruption is acceptable. Before upgrading, confirm that no deployment is in progress and back up Hub's persistent directory and `config.yml`; Hub's `secrets.keys` also encrypts publishing credentials, so a restore must use the keys that match the database. A Hub upgraded from a version without `secrets.keys` adds a key and keeps its `auth.secret`, which still decrypts the publishing credentials stored before, until `secrets rotate` has resealed them. The upgrade commands are listed under the corresponding installation method above. After the upgrade, check each business application individually.

If the upgrade changes Hub's Node major version, published applications must be rebuilt for it and published again; otherwise their native modules fail to load at startup. `hub deploy` builds for the platform Hub reports, while an archive uploaded in the management console must be rebuilt with the new `--node-version`.
