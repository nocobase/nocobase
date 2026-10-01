---
title: Deploy with an AI Agent
description: Prepare connection details and copy a scenario prompt so the Agent handles configuration, builds, transfers and verification.
---

# Deploy with an AI Agent

With the application sources and access to the target server or Hub ready, choose a scenario below, replace the placeholders, and send the prompt to your Agent. You do not need to prepare deployment commands or runtime configuration first. The Agent checks the environment, prepares configuration, builds and deploys; it asks for information it cannot verify instead of guessing.

A deployment archive excludes development databases and uploaded files. The first-deployment examples start with new data. Tell the Agent explicitly if you need to keep development data: that requires a separate migration or restore.

## Where to start

| What you want to do                 | Where to open the Agent session                        | Example                                                             |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Publish to your team's existing Hub | Application source root                                | [Publish to a Hub](#publish-to-a-hub)                               |
| Run one application on a server     | Application source root, accessing the server over SSH | [Deploy with app-installer](#deploy-to-a-server-with-app-installer) |
| Run the application with Docker     | Application source root, accessing the server over SSH | [Deploy with Docker](#deploy-with-docker)                           |
| Set up a Hub for the team           | A session directly on the server                       | [Install a Hub](#install-a-hub)                                     |

Hub requires a Professional license. Without a Hub, prefer app-installer for one application, or Docker if you already operate containers. Without an Agent, follow [Manual: Hub](./hub) or [Manual: standalone](./standalone); no Skill installation is required.

### Make the deployment Skills available

Applications normally include `nocobase-deployment` under `.agents/skills/`; publishing also needs `nocobase-hub-cli`. Ask the Agent to read these files rather than relying on automatic discovery. If missing, check dependencies and Skill synchronization; `pnpm nocobase skills sync` synchronizes Skills supplied by installed packages. Hub commands come from `@nocobase/hub-cli`; check compatible versions before adding it to an older project.

For app-installer installations, install the global Skill on the machine running the Agent:

```bash
npx skills add nocobase/nocobase3 --skill nocobase-app-installer -g
```

Open a new Agent session after installation. For a local Agent using SSH, install the Skill locally; for an Agent running directly on the server, install it there. Do not let two sessions manage the same installation directory simultaneously.

### What you need to prepare

- **Server deployment**: a working SSH connection, such as a configured `crm-prod` alias. Do not paste SSH passwords or private keys into the conversation.
- **Hub publishing**: the address of an existing Hub application, `<Hub URL>/apps/<app ID>`, and an API key bound to that application with upload and deployment permissions. See [Hub CLI deployment](./hub#2-deploy-from-the-cli).
- **Public access**: the domain, base path, and current DNS and HTTPS setup.
- **Data plan**: a new empty database or existing databases and uploaded files to preserve.

Store credentials in Git-ignored files or environment variables, and give the Agent only their locations and names. SSH does not automatically forward local environment variables; variables required by remote commands must be available in the remote execution environment.

## Prompts

Each first-deployment prompt authorizes execution: the Agent briefly explains its plan, then proceeds through checks, configuration, build and deployment. Missing information, system privileges or existing target data require user input. Use the separate update and rollback prompts for existing installations.

### Publish to a Hub

At the source root, add the Hub application as a remote with `pnpm nocobase hub remote add origin <Hub URL>/apps/<app ID>`, then run `pnpm nocobase hub auth login` yourself: it asks for the API key without echoing it and saves it outside the project, so the key never passes through the conversation. This example uses a new SQLite database; no prewritten `runtime.yml` is required.

```text
Publish this NocoBase 3 application to an existing Hub for the first time and verify the deployment.
Hub remote: origin, <for example https://apps.example.com/hub/apps/crm; the application already exists in Hub>
Credentials: the API key is saved with hub auth login.
Data plan: a new SQLite database; do not migrate development data.

Read the project's AGENTS.md, README, nocobase-deployment and nocobase-hub-cli Skills. Check dependencies, the working tree and available commands. Briefly explain your plan, then perform the checks, configuration preparation, build, upload and first deployment.
Check with hub remote list and hub auth status that the remote matches this request and Hub accepts its key; if not, ask me to run hub auth login rather than handling the key. Let hub deploy build for the platform Hub reports; do not run pnpm build or pass a target yourself. Prepare complete runtime configuration from config.example.yml, checking persistent database paths, the administrator and required plugin settings; do not copy development configuration. Tell me where to enter passwords securely when needed. Stop if an existing deployment or data is found and ask whether this should be an update.
Run the project's relevant checks, publish with hub deploy, which builds, uploads and deploys, and wait for the final result. On a network timeout, verify the deployment record before retrying; reuse the same idempotency key only for the same request.
Report the version, Release and operation IDs, URL, migration results, health check and business verification. If you cannot query deployment history or sign in, tell me exactly what to verify in Hub or the application. Do not invent commands or expand API key permissions. Upload success alone is not deployment success.
```

For PostgreSQL or another external database, replace the SQLite data plan with the database host, port, database name, username and the variable or credential-file path holding the password. Ask the Agent to include the compatible driver in the build and supply complete runtime configuration. Back up an existing external database before migrations.

### Deploy to a server with app-installer

Open a session at the source root and ensure the Agent can connect to the server over SSH. The Agent builds and transfers the archive as part of this task.

```text
Deploy this NocoBase 3 application to my server over SSH for the first time, using app-installer to manage runtime and upgrades.
SSH target: <for example crm-prod>
Installation directory: <for example /srv/nocobase/crm, absent or empty>
Public origin: <for example https://apps.example.com, without a path>
Base path: /crm; listen address: 127.0.0.1; port: 13000.
Data plan: a new SQLite database; do not copy development databases or uploads.
Domain and HTTPS status: <current setup>

Read the project deployment Skill and the global nocobase-app-installer Skill. Check the server's OS, CPU, libc, Node, global pm2, directory permissions and ports over SSH, then explain the plan. You may build, transfer, install and start this first deployment. Ask before global installations, sudo, changes to existing Nginx configuration, or operations involving a nonempty directory or existing data.
Build for the server's actual platform, transfer the archive with scp and verify its checksum, then install using JSON output. Tell me how to provide the initial administrator password securely before installation. Do not print passwords or complete configuration, or empty the directory after a failure to retry installation.
Check the server-local health endpoint and logs. Report the version, sign-in URL, persistent directories, pm2 startup steps and reverse proxy configuration. If public access is not ready, report “running locally; public access pending” rather than declaring completion.
```

If the local Agent cannot use SSH, split the work into two sessions. Have it build for the server platform and provide the archive, SHA-256 and transfer command. After copying the archive, open a server-side session with the global Skill and send:

```text
Install a prepared NocoBase 3 archive with app-installer; do not build source code.
Archive: <absolute server path>; expected SHA-256: <checksum from the build>.
Installation directory: <directory>; public origin: <URL, or “local verification only for now”>.
Base path: /crm; port: 13000; data plan: a new SQLite database.
Read nocobase-app-installer, verify the archive, platform, dependencies and directory, then install and check server-local health. Stop for nonempty directories or existing data; explain how I should supply missing credentials or permissions. Do not print passwords. Report installation results and remaining public-access steps.
```

### Deploy with Docker

Open a session at the source root. The local machine must be able to build images; the server needs Docker and Compose. This example transfers the image with `docker save`, `scp` and `docker load`, without requiring an image registry.

```text
Deploy this NocoBase 3 application to a server with Docker for the first time, from build through verification.
SSH target: <for example crm-prod>
Deployment directory: <for example /srv/nocobase/crm-docker, absent or empty>
Public origin: <for example https://apps.example.com>; base path: /crm.
Bind the published port only to the server's 127.0.0.1:13000.
Data plan: a new SQLite database, without development data.
Domain and HTTPS status: <current setup>

Read the project deployment Skill and check local Docker, server Docker and Compose, target CPU architecture, directories and ports. Use the project's Dockerfile and Dockerfile.dockerignore to build for the server architecture with a unique image tag. Exclude local configuration, secrets and data from the image.
Explain the plan, then build, export with docker save, transfer with scp, verify checksums, import with docker load and start through Compose. Prepare server configuration from the image's config.example.yml, generate persistent secrets, and tell me where to provide the administrator password securely.
Create compose.yml with read-only config.yml and persistent storage mounts; verify that the container user can write storage. Validate Compose and run config check inside the image before startup without printing secrets. Ask if there are existing containers, nonempty directories, old databases or missing system privileges; do not recreate data volumes.
Check container health, the health endpoint at the actual base path and logs. Report the image identity, sign-in URL and pending HTTPS or proxy setup. Ask before modifying an existing proxy service; server-local health alone does not prove public access.
```

### Install a Hub

Open an Agent session directly on the server. Installing a Hub does not require creating a development project first.

```text
Install NocoBase Hub on this server with app-installer. Do not develop or modify Hub source code. I have the required Professional license.
Installation directory: <for example /srv/nocobase/hub>
Public origin: <for example https://apps.example.com>; base path: /hub.
Database: new SQLite; port: 13000, listening only on 127.0.0.1.
Domain and HTTPS status: <current setup>

Read nocobase-app-installer and check Node, pnpm, global pm2, directory, ports and disk space. You may perform the first installation and startup; report missing dependencies, nonempty directories or sudo requirements first. Install from the published Hub template, not a development server.
Tell me how to supply administrator credentials securely before installing. Verify /hub/api/healthz and the sign-in URL, then report configuration, data and backup locations and startup-on-boot steps. Prepare a reverse proxy configuration forwarding the whole domain to Hub with WebSocket support and the Release upload size limit; wait for confirmation before changing an existing proxy. If there are no hosted applications yet, report Hub verification only and explain how to create and publish the first application.
```

## Update and roll back

Do not reuse first-deployment prompts for existing installations. Establish the current version, configuration and data, backup recovery steps and permitted downtime. The Agent should explain impact and its estimate rather than promise an unverified number of downtime seconds.

### Update an application on Hub

Use the original source project:

```text
Update the application on Hub. Hub remote: <name>; its API key is saved with hub auth login.
Keep Hub's current configuration, database and uploaded files; do not replace them with local development configuration.
Read the deployment and Hub CLI Skills, record the running Release with hub status, and review source, configuration and migration changes; hub deploy builds for the platform Hub reports.
Explain downtime, backup and recovery requirements when preparation is complete. Wait for me to confirm the switch window and backup status before publishing. Verify an unconfirmed result before retrying and reuse the same idempotency key for the same request. Finally verify the actual running Release, health and business access, and retain rollback information.
```

### Upgrade an app-installer application

Use a server-side session, or add the SSH target for a local Agent. Build and transfer the new archive from the source project first.

```text
Upgrade the existing app-installer application using the new archive already on the server.
Installation directory: <directory>; archive: <path>; SHA-256: <expected checksum>.
Read nocobase-app-installer, run status, and check the current version, archive platform, configuration, backup scope and migration risk. Run the upgrade precheck without --yes and show me the installer's downtime and backup notes.
Wait for my confirmation before executing. Confirm external database backups before declaring backup-done. Preserve secrets, databases and storage. Report old and new versions, backup locations and verification results; if an automatic rollback occurs, state which version is ultimately running.
```

### Roll back an application on Hub

```text
Roll back the Hub application to a specified Release.
Hub remote: <name>; target Release ID: <ID selected from hub releases or Hub history>.
The API key is saved with hub auth login. Check the target Release, current configuration and database compatibility, explain downtime and data recovery risks, and wait for my confirmation. Check the target with hub releases rather than guessing the previous version.
Use a new idempotency key for a new rollback; reuse it only when retrying that request. Do not treat a historical success as a new version switch. Code rollback is not database restoration: do not restore or clear data without authorization. Verify the actual running version, health and business access afterward.
```

For Docker updates, specify the new image tag or digest, preserve Compose configuration and persistent directories, confirm backups and the switch window, and retain the old image identity. For app-installer rollback, read the installer's confirmation notes: restoring SQLite can lose writes made since the upgrade. Code rollback is not database restoration; see [Manual: standalone](./standalone).

## Acceptance

Ask for a short deployment report covering:

- The target server or Hub application, source revision, archive checksum or image identity, and final running version.
- Configuration and persistent directory locations, migration and seed results, without secret contents.
- The health-check URL and response, public URL, and completed sign-in and business checks.
- For updates, the old version, backup locations and rollback procedure; incomplete checks, reasons and concrete next steps.

Sign in through the public URL yourself. For a first deployment, use agreed test data to verify writes, uploads and persistence after restart. For an existing production application, agree on test records and a restart window first; do not write business data, trigger workflows or restart solely for verification without agreement. If the Agent cannot operate a browser, perform those checks yourself and leave them marked pending in its report.

“Configuration generated,” “request accepted,” “container started” and “healthy locally” are intermediate results. Public access, business verification or migration results that remain unconfirmed must stay on the outstanding list.
