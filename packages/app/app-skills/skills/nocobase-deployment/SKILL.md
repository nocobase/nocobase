---
name: nocobase-deployment
description: Plan, build, deploy, verify, upgrade, and troubleshoot NocoBase 3 applications in production, including standalone Node.js or Docker deployments and Hub publishing. Use when an application must move from source to a production environment or when a deployment failure needs diagnosis.
---

# NocoBase production deployment

Use this Skill to execute a complete deployment workflow. Read the application's `AGENTS.md` and `README.MD` before changing files or running stateful commands: the README documents this application's build targets, archive layout, configuration variables and Hub publishing commands. The Deployment section of the NocoBase 3 documentation is the reference for command details and platform-specific examples; in the nocobase3 source repository it is `docs/docs/<lang>/deployment/`.

Do not treat a process being healthy as proof that the application is usable. A deployment is complete only after the database, configuration, application behavior, workflow artifacts, and persistence checks below have evidence.

## Stop and identify the deployment

Before building or changing a server, record:

- The deployment mode: standalone Node.js, standalone Docker, Hub platform, or publishing an App to an existing Hub.
- The source revision, application version, Node.js and pnpm versions, target CPU/OS/libc, and the destination host.
- Whether the destination uses the existing database and storage, a new database, or a restore. Business data is not included in `dist`, `dist.tar.gz`, or a Docker image.
- The application base path, public origin, database type, external services, reverse proxy, persistent directories, and service identity.
- Whether the requested action is a first install, an update, a migration, a restart, a rollback, or a recovery.

Do not run production writes, migrations, seeds, uploads, deployments, or destructive removal until the target and the user's authorization are explicit. If the target or data plan is unresolved, stop and ask for it.

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
APP_BASE_PATH=/crm pnpm build --target linux-x64 --node-version 24 --tar
```

`pnpm build` creates the production `dist` tree and installs or retargets production dependencies for the selected platform. `--tar` additionally creates `storage/exports/dist.tar.gz`, containing `dist/` and `config.example.yml`; it does not contain the runtime configuration, database, uploads, or other business data. Inspect the archive before transfer:

```bash
tar -tzf storage/exports/dist.tar.gz | head -30
```

For a direct server deployment, transfer the archive and extract it into the deployment root. Nothing needs installing there: `pnpm build` already ran `pnpm install --prod` inside `dist/`, and the archive carries the resulting `dist/node_modules`. `dist/package.json` stays in the tree so that the same command can be rerun inside `dist/` on the server if `node_modules` was left out of a copy; that is a repair, not a step of a normal deployment, and it is never run in the application source tree. For Docker, build with the application's own `Dockerfile` instead, which runs `pnpm build` inside the image; keep configuration and storage outside the image. Otherwise ensure the build target matches the server's architecture, libc, and Node ABI.

A `dist/` built for the wrong platform does not need a full rebuild: `pnpm nocobase dist retarget --target <platform> --node-version <major>` in the source checkout reinstalls only its native modules, and `pnpm nocobase dist check` re-verifies that everything the server imports is installed. On the server, run the application's commands as `node dist/cli/index.js <topic> <command>` from any directory, or `pnpm nocobase <topic> <command>` inside `dist/`; only runtime commands exist there. `.agents/skills/nocobase-app-development/references/cli.md` lists them and the flags that must not be added unasked.

## Decide the data operation

A deployment package carries code and production dependencies, not business data. Keep the existing database and storage mounts for an in-place update. When switching to a new database or server, perform a separate data migration or restore a coordinated backup before allowing users to write.

Before an update that can change schema, take a database and file backup and confirm the restore path. Ensure the database account can perform the configured migration and seed operations. Do not point a new instance at an empty database and describe the result as a data migration.

The default configuration uses managed schema migrations and automatic seeds. Determine whether the deployment should run them on startup. If migrations or seeds are run separately, set the corresponding automatic options to `false` and execute the supported CLI operation before starting the application. Record the migration and seed result; a successful process start alone is insufficient.

## Build and review production configuration

Prepare the complete runtime configuration before starting the service. At minimum review:

- Database dialect, host, port, database, credentials, schema and migration policy. A container's `localhost` means that container, not the host or another service.
- A unique stable `auth.secret` and `session.secret`. Keep them unchanged across restarts and upgrades and out of artifacts, source control, and logs.
- `users.initialAdmin.username`, `users.initialAdmin.email` and `users.initialAdmin.password` for a new empty user table. These settings apply only during the initial seed and do not reset an existing account.
- `APP_PUBLIC_ORIGIN` as the external scheme and host without the application path, and `APP_BASE_PATH` as the public mount path used at build time and runtime.
- `APP_SERVER_HOST` and `APP_SERVER_PORT`, with containers normally listening on `0.0.0.0` and the proxy controlling external exposure.
- Persistent storage paths, file permissions, service identity, and any external database, object storage, mail, or callback settings.

The reverse proxy must preserve the public `Host` and protocol headers, forward cookies, and support WebSocket `Upgrade` and `Connection` headers. For Hub, proxy the entire site to Hub; do not expose a separate Host port or proxy only `/hub`.

## Choose the deployment path

### Standalone Node.js

Extract the archive as the service user or transfer ownership to that user. Write the configuration by running `pnpm nocobase config init` inside `dist/`, which generates `config.yml` beside it from the `config.example.yml` the archive carries, with fresh secrets; it installs nothing, so a dialect whose driver the build does not include has to be added in the application sources and built again. Set its values with `pnpm nocobase config set`, and `--from-env` for passwords. Then run `pnpm nocobase config check` inside `dist/` on the target machine before the first start: it loads the configuration the way the service will, connects to every database but SQLite, and exits non-zero with the cause when something would stop the start. Keep `config.yml` and `storage/` beside `dist/`, configure `APP_CONFIG_FILE`, and run `node ./dist/server/standalone.js` through the service manager. Replace `dist` during an update while retaining configuration and storage. Do not start a second process against the same data directory.

### Standalone Docker

Build the image from the application root with its own `Dockerfile`: `docker build --build-arg APP_BASE_PATH=/crm -t crm:<release> .`. The mount path is compiled into the client, so pass the path the deployment serves; it cannot be changed at runtime. `Dockerfile.dockerignore` must sit beside the `Dockerfile` — without it `config.yml`, `.env` and `storage/` enter the build context — and an application created before the template shipped them copies both from a newer template version. For another architecture use `docker buildx build --platform`; the build stage cross-targets native modules itself. To package a `dist/` already built, pass `--build-arg DIST=prebuilt` after `pnpm build --target linux-<arch>` with the same `APP_BASE_PATH`; the image build rejects a `dist/` built for another platform, libc, Node major or mount path, and never copies `dist/.env`. Use the source build for release images: a prebuilt `dist/` reflects the building machine's working tree. `.env` is not carried into the image, so pass its settings as container environment variables.

Bind-mount the complete runtime configuration read-only at `/app/config.yml` and the persistent storage at `/app/storage`, writable by the image's `node` user (UID 1000), and run the container with `init: true`. The image has no pnpm: run application commands as `node dist/cli/index.js <command>`, for example `docker run --rm -v ./config.yml:/app/config.yml:ro <image> node dist/cli/index.js config check` before the first start. Validate the Compose file before starting. For a configuration file replacement, recreate the container so the process reads the new file. Keep the image, config, storage, and proxy changes separately identifiable.

### Hub platform

A Hub project created from the Hub template, whose source changes, deploys like any other application, standalone or with Docker. An unmodified Hub needs no project: run the published image with Docker, or on a Node.js server install, upgrade and roll it back with `@nocobase/hub-installer`, which the global `nocobase-hub-installer` Skill drives and whose `--help` documents every flag. Persist the Hub storage root, platform database, Releases, desired configurations, expanded application versions, application data volumes, and logs. Set Hub's `/hub` base path and route the complete public site to Hub. A Hub restart interrupts its hosted applications; after restart, verify each eager App individually.

### Publish an App to an existing Hub

Only a Default application, whose `package.json` sets `nocobase.cli.publishing: true`, has `release upload` and `release deploy`; Examples and Hub applications do not. Run them in the source checkout or in CI. A built `dist/` does not register them, because what they send is the archive `pnpm build --tar` writes beside the sources.

`HUB_API_KEY` is created in Hub, not in the application: the **API Keys** page (`<HUB_URL>/api-keys`, requiring `hub.app / manage-api-keys`) binds a key to selected applications and grants **Upload release**, **Deploy release**, or both. Uploading needs `upload-release`; anything that deploys needs `deploy` as well. Bindings and permissions cannot be edited after creation, and a key never exceeds its creator's current permissions, so a key with the wrong scope is deleted and recreated. Tell the user to create the key before the first upload rather than guessing its value. Never print an API key or put it in committed configuration.

Create or select the target App, build for the Host platform with `pnpm build --tar`, then run `pnpm nocobase release upload`. `HUB_URL` includes the Hub application's mount path. `HUB_URL`, `HUB_APP_ID` and `HUB_API_KEY` are resolved per value: command flags, then the terminal or CI environment, then the App root `.env`, which stays gitignored; no `.env.local` or mode-specific file is loaded. Uploading a Release does not switch the running version. `release upload --deploy` uploads and deploys in one request; `release deploy --release-id <id>` deploys a Release already uploaded, and re-uploading that archive with `upload --deploy` fails with `NO_DEPLOYMENT` instead. Automation belongs in the caller's script; Hub has no deployment-mode setting.

`--config ./runtime.yml` on `release deploy` or `release upload --deploy` supplies the runtime configuration, a non-empty UTF-8 YAML file of at most 1 MiB. `--config` and `--file` resolve from the current directory; without `--file`, upload reads `storage/exports/dist.tar.gz` in the App root. Omitting `--config` reuses the current Hub configuration, and a first deployment uses Release-template initialization. A supplied document replaces the complete configuration through Hub's secret handling and YAML validation rather than merging with existing fields, so submit every required field rather than a partial patch. `release upload --config` without `--deploy` is rejected. Configuration content is never printed.

Deploying commands wait for the final result by default; `--no-wait` returns after acceptance, which does not mean the deployment succeeded. `--timeout` defaults to 600 seconds, and a timeout leaves the deployment unconfirmed rather than cancelled. Add `--json` in CI: every run prints one JSON document on stdout, success or failure, and exits `0` on success, `1` for a Hub rejection or failed deployment, `2` for invalid arguments or local input, and `3` when the outcome could not be confirmed. The Default application's `README.MD` has the full argument and limit reference.

Exit `3` does not mean the deployment failed. Inspect the Hub record before retrying, and retry with the same idempotency key and request. Use a new key only for an intentional new deployment of the same Release or after a confirmed failed deployment; the default deployment key includes the supplied configuration content, and a configured upload retry reuses only the configuration it was first given.

## Handle workflow artifacts after production build

If the application contains DSL workflows or other compiled workflow artifacts, treat the production build as a new artifact set. The workflow definition is compiled into production JavaScript and receives a deployment hash; the development artifact or previous hash may not exist in the production package.

After deployment, check that each workflow's active version points to an artifact present in the production build. If the runtime reports `Workflow Artifact <key>/<hash> is missing`, do not enable the workflow by its database flow ID alone: that keeps the old hash. Enable the pending version by its deployed artifact hash, either with **Enable new version** on the workflow in the management UI or with `POST <APP_BASE_PATH>/api/workflows/<hash>/enable`, then trigger a real business event and inspect the run result. Keep source checking, artifact building, synchronization, enablement, and invocation as separate checks.

## Verify the deployed application

Collect evidence for each item:

1. The process, container, Hub, and Host report ready. An application answers `GET <APP_BASE_PATH>/api/healthz` with a JSON object whose `ok` is `true` (alongside the app name and base path); Hub answers at `/hub/api/healthz`.
2. The public URL, base path, static assets, page refresh, API requests, cookies, and WebSocket connections work through the real reverse proxy.
3. The configured administrator can sign in, and a normal user has the expected server-side permissions.
4. The application can read and write a known record in the intended database; the database is not an unexpected empty instance.
5. Upload and download a file if the application uses file storage.
6. Trigger one representative workflow and confirm its run completes with the expected business result.
7. Restart the service or recreate the container and confirm records, files, configuration, and enabled runtime behavior remain available.
8. In Hub mode, verify every hosted App separately; Hub readiness does not mean every eager App is ready.

Record the exact artifact or image digest, configuration revision, database migration result, workflow artifact hashes, logs checked, and verification time.

## Update, rollback, and recovery

Before an update, review migration and configuration differences and take a backup. A code rollback creates or selects an older runtime; it does not undo database migrations, business writes, or a historical configuration snapshot. Confirm database compatibility before switching back.

For recovery, stop the affected service, prepare the code and runtime matching the backup, restore the database, files, configuration, stable secrets, and persistent mounts, then start and verify. Restore external databases and object storage to a coordinated point in time. If only Hub metadata is restored and expanded application revisions are missing, redeploy the corresponding Release before declaring recovery complete.

## Report the result

Return a concise deployment report with these sections:

- Target and deployment mode.
- Source revision and artifact or image digest.
- Configuration, database, migration and seed status.
- Deployment operation ID and final status, if Hub is used.
- Workflow artifact and representative business verification.
- Restart or recovery verification.
- Logs and checks performed.
- Unresolved risks, skipped checks, and required follow-up.

Never claim a production deployment, migration, rollback, or recovery was completed when it was only planned, accepted by an API, or tested locally.
