---
name: nocobase-deployment
description: Plan, build, deploy, verify, upgrade, and troubleshoot NocoBase 3 applications on an existing Studio or a standalone Node.js or Docker server. Use when an application must move from source to a deployment environment or when a deployment failure needs diagnosis.
---

# NocoBase production deployment

Use this Skill to execute a complete deployment workflow. Read the application's `AGENTS.md`, the `.agents/rules/` files it indexes for building and deployment, and `README.MD` before changing files or running stateful commands: the README documents this application's build targets, archive layout and configuration variables.

Do not treat a process being healthy as proof that the application is usable. A deployment is complete only after the database, configuration, application behavior, and persistence checks below have evidence.

Preinstalled plugins belong in devDependencies and provide Skills. Run `pnpm nocobase plugin register <name>` to enable one. Run `plugin unregister <name>` to retain it for development or `plugin remove <name>` to uninstall it together with its synchronized Skills.

## Stop and identify the deployment

Before building or changing a server, record:

- The deployment mode: an App managed by an existing Studio, standalone Node.js managed by app-installer, standalone Node.js by hand, or standalone Docker.
- The source revision, application version, Node.js and pnpm versions, target CPU/OS/libc, and the destination host.
- Whether the destination uses the existing database and storage, a new database, or a restore. Business data is not included in `dist`, `dist.tar.gz`, or a Docker image.
- The application base path, public origin, database type, external services, reverse proxy, persistent directories, and service identity.
- Whether the requested action is a first install, an update, a migration, a restart, a rollback, or a recovery.

Do not run production writes, migrations, seeds, uploads, deployments, or destructive removal until the target and the user's authorization are explicit. If the target or data plan is unresolved, stop and ask for it.

## Deploy to an existing Studio

When the user asks to deploy this application to an existing NocoBase Studio, read [Deploy to Studio](references/deploy-to-studio.md) before building. It covers installing and signing in with the target Studio's `nb-studio` CLI, choosing an upload route, deploying and verifying the application. The application being deployed does not need its own business CLI.

Confirm the source application, target Studio, App ID and environment. A source directory, deployment directory and App ID can have different names; do not infer application identity from one of them. Follow the reference for Studio-managed configuration, storage and deployment; use the shared artifact and verification guidance below where applicable, not the standalone installation commands.

Deploying Studio itself to a server follows the standalone deployment workflow below.

## Prepare the source and artifact

In the application project root, use the project's lockfile and declared pnpm version:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
```

Run the checks that the project actually defines; do not invent a test or lint command when it is absent. Build for the destination platform:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
tar -tzf storage/exports/dist.tar.gz | head -30
```

`pnpm build` writes the production `dist/` with production dependencies installed for the selected platform; `--tar` also packs `storage/exports/dist.tar.gz` with `dist/`, `config.example.yml` and the application's `Dockerfile` and `Dockerfile.dockerignore`. The build is not tied to a mount path: the server serves it at the `APP_BASE_PATH` it runs with. The archive never contains runtime configuration, the database, uploads or other business data. Inspect it before transfer, and make sure the build target matches the server's architecture, libc and Node ABI; for Docker, build with the application's own `Dockerfile` instead.

Read [build artifact and CDN assets](references/artifact.md) for what the archive contains, installing it on a server, retargeting a `dist/` built for the wrong platform, running commands inside `dist/`, and building with a `CDN_BASE_URL` (a build-time setting: changing it means rebuilding).

## Decide the data operation

A deployment package carries code and production dependencies, not business data. Keep the existing database and storage mounts for an in-place update. When switching to a new database or server, perform a separate data migration or restore a coordinated backup before allowing users to write.

Before an update that can change schema, take a database and file backup and confirm the restore path. Ensure the database account can perform the configured migration and seed operations. Do not point a new instance at an empty database and describe the result as a data migration.

Read [database upgrades](../nocobase-app-upgrade/references/database-upgrades.md) when the update changes migrations or reports checksum drift, before starting the new runtime. It covers target-version upgrade notes, reviewed checksum repair, data prerequisites, and irreversible changes, including plugin migrations that the application's source diff does not show. `db repair` acknowledges source checksums only; it does not upgrade schema or recover a partially failed installation.

The default configuration uses managed schema migrations and automatic seeds. Determine whether the deployment should run them on startup. If migrations or seeds are run separately, set the corresponding automatic options to `false` and execute the supported CLI operation before starting the application. Record the migration and seed result; a successful process start alone is insufficient.

## Build and review production configuration

Prepare the complete runtime configuration before starting the service, following [production configuration](references/configuration.md) item by item. The decisions that most often go wrong:

- **Database**: dialect, host, credentials, schema and migration policy. A container's `localhost` is that container. `DB_*` variables override `config.yml`.
- **Secrets**: `secrets.keys` (or `SECRETS_KEYS`) stays unchanged across restarts and upgrades, is backed up apart from the database, and never enters artifacts, source control or logs. Rotate it only as the reference describes.
- **Initial administrator**: replace the example's `admin123` before exposing the application; the setting applies only to the first seed. Leave `app.sampleData` off in production.
- **Public address**: `APP_PUBLIC_ORIGIN` (scheme and host, no path), `APP_BASE_PATH` (default `/main`), `APP_SERVER_HOST` and `APP_SERVER_PORT`.
- **Jobs and queues**: the built-in memory backends serve one process only. More than one instance needs the Redis backends, which require installing and registering their commercial Server plugins first; never claim memory satisfies a multi-instance deployment. Concurrency, Jobs and Queue use strict `default`/`backends` sections.
- **Commercial packages**: probe, install and register an authorized version as the reference describes; when access is unavailable, say so briefly, continue independent preparation, and keep dependent deployment pending.
- **Variables**: `dist/variables.json` (or `pnpm nocobase config variables`) lists every runtime variable, which ones are secret, required, generatable or read only on the first start.

The reverse proxy must preserve the public `Host` and protocol headers, forward cookies, and support WebSocket `Upgrade` and `Connection` headers.

## Choose the deployment path

Read [standalone deployment paths](references/standalone.md) for the commands and refusal cases of each path.

- **Standalone with app-installer** (preferred on a server without a container platform): `@nocobase/app-installer` installs an archive into its own directory, writes `config.yml` and `app.env`, applies migrations, runs the application under pm2, and upgrades with a backup and automatic rollback. The server needs Node.js 24 and a global pm2. The global `nocobase-app-installer` Skill drives it. `install --base-path` chooses the mount path; each application gets its own directory, port and pm2 process.
- **Standalone Node.js by hand** when you manage the service directly. Follow [the standalone Node.js instructions](references/standalone.md#standalone-nodejs).
- **Standalone Docker**: build with the application's own `Dockerfile` (`Dockerfile.dockerignore` must sit beside it), set `APP_BASE_PATH` at `docker run`, bind-mount `config.yml` read-only at `/app/config.yml` and storage at `/app/storage` writable by UID 1000, and run with `init: true`. The image has no pnpm: run `node dist/cli/index.js config check` before the first start. Recreate the container to read a replaced configuration file.

## Verify the deployed application

Use the intended public origin, including its scheme, host and base path, and exercise actions through completion while watching browser errors. Also check on an origin where `window.isSecureContext` is `false` that UUID generation and copying work and that HTTPS-only features explain themselves, as [deployment verification details](references/verification.md) describes; localhost and HTTPS can mask these incompatibilities.

Collect evidence for each item:

1. The process or container reports ready. The application answers `GET <APP_BASE_PATH>/api/healthz` with a JSON object whose `ok` is `true` (alongside the app name and base path).
2. The public URL, base path, static assets, page refresh, API requests, cookies, and WebSocket connections work through the real reverse proxy.
3. The configured administrator can sign in, and a normal user has the expected server-side permissions.
4. The application can read and write a known record in the intended database; the database is not an unexpected empty instance.
5. Upload and download a file if the application uses file storage.
6. Exercise one representative business operation end to end and confirm its expected result.
7. Restart the service or recreate the container and confirm records, files, configuration, and enabled runtime behavior remain available, including that scheduled jobs keep firing.

Record the exact artifact or image digest, configuration revision, database migration result, logs checked, and verification time.

The OpenAPI document at `<APP_BASE_PATH>/api/swagger` answers only a signed-in session or a valid API key and cannot be made public or turned off; restrict it at the reverse proxy when policy requires. See [deployment verification details](references/verification.md#api-documentation-in-production).

## Update, rollback, and recovery

Before an update, review migration and configuration differences and take a backup. A code rollback creates or selects an older runtime; it does not undo database migrations, business writes, or a historical configuration snapshot. Confirm database compatibility before switching back.

For recovery, stop the affected service, prepare the code and runtime matching the backup, restore the database, files, configuration, stable secrets, and persistent mounts, then start and verify. Restore external databases and object storage to a coordinated point in time.

## Report the result

Return a concise deployment report with these sections:

- Target and deployment mode.
- Source revision and artifact or image digest.
- Configuration, database, migration and seed status.
- Representative business verification.
- Restart or recovery verification.
- Logs and checks performed.
- Unresolved risks, skipped checks, and required follow-up.

Never claim a production deployment, migration, rollback, or recovery was completed when it was only planned, accepted by an API, or tested locally.
