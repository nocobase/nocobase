---
title: Publish applications with Hub
description: Upload a Release and deploy it through the console or CLI.
---

# Publish applications with Hub

This page assumes an operational Hub and permission to manage the target App. See [Deploy Hub](./hub) for platform setup.

## Build and upload

Create an App in Hub and record its ID. Hub mounts the App at `/<App ID>`, and the archive is not tied to a mount path, so the build names none. Build in the application project for the environment Hub runs in, which for a Docker deployment is Linux with glibc and Node 24 regardless of the host:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

Use `--target linux-arm64` on an ARM64 server, and for a template deployment match the platform, libc and Node major version of the environment that runs Hub; see [Deploy Hub](./hub). Mismatched flags upload and deploy successfully and fail only when the application starts. An archive from an earlier `@nocobase/app-cli` has its mount path compiled into the client, and Hub accepts it only when that path is exactly `/<App ID>`, refusing it otherwise with `BASE_PATH_MISMATCH`; upgrade `@nocobase/app-cli` in the project and build again.

The current artifact is `storage/exports/dist.tar.gz`. Upload it from the App detail page, select the Release, prepare runtime configuration, review, and deploy. Uploading alone does not deploy.

## Publish through the CLI

### Create a publishing key

`HUB_API_KEY` is created in Hub, not in the application. Open **API Keys** in the Hub navigation (`<HUB_URL>/api-keys`), which requires `hub.app / manage-api-keys`, granted to `hub-administrator` and `hub-operator` by default.

![The API Keys page in Hub, with the create action in the top right and no keys yet](https://static-docs.nocobase.com/20260923151656.png)

Choose **Create API Key**:

1. Under **Applications**, select the target application, or **All applications (including future apps)**.
2. Under **Permissions**, grant what the commands need: **Upload release** for uploads alone, and **Deploy release** as well for anything that deploys.
3. Set an expiration if you want one, then copy the plaintext key after creation.

Permissions stay disabled until an application is selected; the dialog says so.

![The Create API Key dialog: name and expiration, the application scope, and the Upload release and Deploy release permissions](https://static-docs.nocobase.com/20260923151943.png)

The plaintext key is shown once at creation and can be copied again by its creator while the key is active. Bound applications and permissions cannot be changed afterwards, so a key with the wrong scope is deleted and recreated. Every request rechecks the creator's current permissions, so uploads and deployments made with the key are rejected once its creator loses access to the bound application. Supply it through a CI secret or a protected local environment rather than command arguments, version control, or logs.

### Configure the CLI environment

Provide `HUB_URL` (including its mount path), `HUB_APP_ID`, and `HUB_API_KEY` through a protected environment or the project's gitignored `.env`. Flags override process environment, which overrides `.env`; publishing does not load `.env.local`.

### Upload and deploy

`release upload` and `release deploy` are registered only in an application source project whose `package.json` sets `nocobase.cli.publishing` to `true`, and never inside a built `dist/`. The Default template sets it; the Examples and Hub templates do not, so to publish one of those through the CLI, add `"cli": { "publishing": true }` to the `nocobase` field of its `package.json`.

```bash
pnpm nocobase release upload --deploy --config ./runtime.yml --wait --json
```

For an existing uploaded Release, use `pnpm nocobase release deploy --release-id <releaseId> --wait --json`. Without `--config`, an existing deployment reuses current configuration; first deployment uses Release-template initialization. A supplied UTF-8 YAML document replaces configuration, subject to existing secret handling and validation, rather than merging arbitrary fields. The limit is 1 MiB; upload without `--deploy` rejects `--config`. `--config` and `--file` resolve from the current directory; without `--file`, upload reads `storage/exports/dist.tar.gz` in the App root.

### Wait for results and automate

Keep the same idempotency key and payload for network retries. Use a new deployment key only when intentionally requesting another deployment. Acceptance is not completion: check the exit code and `result.operationStatus`, particularly with `--no-wait`.

## Update and roll back

Back up data before deploying migrations. Runtime replacement is stop-first and does not guarantee zero downtime. Rollback creates a new deployment from a successful historical deployment; it does not undo database changes or restore a complete historical configuration snapshot. Stop preserves deployment and data, while removing an App deletes its managed records and volume. See [Backup, recovery and troubleshooting](./operations).
