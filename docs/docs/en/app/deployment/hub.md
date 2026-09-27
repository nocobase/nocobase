---
title: Deploy Hub
description: Run the Hub control plane and its managed App Host.
---

# Deploy Hub

Hub manages Releases, deployments, configuration and runtime operations. The current implementation starts one local managed App Host with in-process applications. It does not provide remote Host scheduling or per-App container isolation. If Hub is already available, continue with [Publish applications with Hub](./hub-publishing).

## Platform deployment

The repository publishes images to `ghcr.io/nocobase/hub` and `registry.cn-beijing.aliyuncs.com/nocobase/hub`, targeting amd64 and arm64, built from the Hub template's own `Dockerfile`. Verify an available tag or digest before use; workflow configuration alone does not prove a tag was published. Alternatively, scaffold the Hub template and build it with that `Dockerfile` (see [Standalone: Docker](./docker#1-build-the-image)), or build for the target platform with Node 24.

Applications are built for the environment Hub itself runs in, not for the server around it. The published image is based on Debian bookworm with Node 24, so a Docker deployment builds with `--target linux-x64` (or `linux-arm64`) and `--node-version 24` whatever the host runs; the Node version installed on the host, and whether the host is Alpine, do not apply. For a template deployment, read the values on the server that runs Hub with `uname -sm`, `node -p "process.versions.node + ' ABI ' + process.versions.modules"` and `ldd --version`. A Hub upgrade that changes the Node major version changes these flags, and already published applications must be rebuilt.

Configure a persistent storage directory, database and stable authentication/session secrets before starting. Set `APP_CONFIG_FILE` to the runtime configuration file and `HUB_STORAGE_DIR` to a writable persistent directory. With Docker, mount both explicitly and set the SQLite `database` path to a location inside the persistent mount. The image contains `/app/config.example.yml` as a configuration reference. Do not replace an existing runtime configuration with the template on upgrade.

## Install with hub-installer

For an unmodified Hub on a Node.js server without Docker, `@nocobase/hub-installer` installs, upgrades and rolls back the Hub. It generates the Hub from the published template, builds it on the server, keeps only the deployment archive under `releases/<version>/hub`, and runs it under pm2. `config.yml`, `hub.env` and `storage/` sit beside the releases and are kept across upgrades. It needs Linux or macOS (WSL on Windows), Node.js 24 or later, pnpm 11 or later, `tar`, and pm2 4.3 or later installed globally with `npm install -g pm2`. NocoBase 3 packages are published to `https://npm.nocobase.ai`, not the public npm, so name the registry:

```bash
npx --registry=https://npm.nocobase.ai @nocobase/hub-installer install /srv/nocobase/hub --origin https://apps.example.com
```

The target must be new or empty, and `--origin` is the public origin without `/hub`. The command builds the Hub, writes its configuration, applies the migrations, and starts it with pm2 until its health check answers; a failure before the Hub starts removes everything it wrote. It listens on `127.0.0.1:13000` with SQLite by default; another database takes `--dialect`, `--set` for the connection and `--set-from-env` for the password. Run `pm2 startup` once and execute the command it prints so the Hub comes back after a reboot. The [package README](https://github.com/nocobase/nocobase3/blob/develop/packages/tools/hub-installer/README.md) documents every flag, the directory layout and the exit codes.

`upgrade --dir /srv/nocobase/hub` builds the new release while the current one keeps serving, checks it, and only then stops the Hub, backs up the SQLite database and configuration, switches, migrates and starts the new release; a failure after the switch rolls back automatically. An external database has to be backed up first and confirmed with `--backup-done`. When the machine's Node major changes while the Hub is already on the latest version, `upgrade --dir /srv/nocobase/hub --rebuild` builds the installed version again for this machine, through the same steps as an upgrade. `rollback` returns to the release the last upgrade came from, restoring the pre-upgrade database when that upgrade migrated it, and `status` reports the version, the public URL and listening address, health, pm2 process and available updates. To move the Hub to another origin or port, edit `APP_PUBLIC_ORIGIN`, `APP_SERVER_HOST` and `APP_SERVER_PORT` in `hub.env` and run `pm2 restart nocobase-hub`, or the name given with `--name`; a new port must be free, and the reverse proxy has to forward to it.

## Public access

Use `APP_BASE_PATH=/hub`, set `APP_PUBLIC_ORIGIN` to the external origin without a path, and proxy the public site to Hub's application port. The standalone listener keeps `/hub` and its descendants in Hub and forwards other paths, including WebSocket upgrades, to its ready Host. Preserve Host and protocol information. Hosted applications can use paths such as `/crm`; the Host port does not need separate public exposure.

Visit `/hub/`, not only the origin root. Before first startup, set `users.initialAdmin.username`, `users.initialAdmin.email` and `users.initialAdmin.password` in the runtime configuration. The default template uses `nocobase` / `admin@nocobase.com` / `admin123`. These settings apply only when the default seed runs against an empty user table and do not reset existing accounts. Replace the default password before opening access. Verify platform permissions and deploy a test App to check routing and persistence.

## Upgrade and recovery

Back up the platform database, stable secrets, Releases, desired configurations and application volumes. Update the image or built code while retaining persistence; a Hub installed with hub-installer upgrades with `hub-installer upgrade`, which keeps the previous release and backs up a SQLite database first; any other database has to be backed up by hand and confirmed with `--backup-done`. A Hub restart affects its Host and applications. Verify each App after recovery; Hub readiness is not equivalent to every eager App being ready. Interrupted queued or deploying operations are marked failed and require inspection before retrying. See [Backup, recovery and troubleshooting](./operations).
