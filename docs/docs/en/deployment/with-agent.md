---
title: Deploy with an AI Agent
description: Prepare connection details and copy a scenario prompt so the Agent handles configuration, builds, transfers and verification.
---

# Deploy with an AI Agent

With the application sources and access to the target server ready, choose a scenario below, replace the placeholders, and send the prompt to your Agent. You do not need to prepare deployment commands or runtime configuration first. The Agent checks the environment, prepares configuration, builds and deploys; it asks for information it cannot verify instead of guessing.

A deployment archive excludes development databases and uploaded files. The first-deployment examples start with new data. Tell the Agent explicitly if you need to keep development data: that requires a separate migration or restore.

## Where to start

| What you want to do             | Where to open the Agent session                        | Example                                                             |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Run one application on a server | Application source root, accessing the server over SSH | [Deploy with app-installer](#deploy-to-a-server-with-app-installer) |
| Run the application with Docker | Application source root, accessing the server over SSH | [Deploy with Docker](#deploy-with-docker)                           |

Prefer app-installer for one application, or Docker if you already operate containers. Without an Agent, follow [Manual: standalone](./standalone); no Skill installation is required.

### Make the deployment Skills available

Applications normally include `nocobase-deployment` under `.agents/skills/`. Ask the Agent to read these files rather than relying on automatic discovery. If missing, check dependencies and Skill synchronization; `pnpm nocobase skills sync` synchronizes Skills supplied by installed packages.

For app-installer installations, install the global Skill on the machine running the Agent:

```bash
npx skills add https://github.com/nocobase/nocobase/tree/v3-develop/skills/nocobase-app-installer --skill nocobase-app-installer -g
```

Open a new Agent session after installation. For a local Agent using SSH, install the Skill locally; for an Agent running directly on the server, install it there. Do not let two sessions manage the same installation directory simultaneously.

### What you need to prepare

- **Server deployment**: a working SSH connection, such as a configured `crm-prod` alias. Do not paste SSH passwords or private keys into the conversation.
- **Public access**: the domain, base path, and current DNS and HTTPS setup.
- **Data plan**: a new empty database or existing databases and uploaded files to preserve.

Store credentials in Git-ignored files or environment variables, and give the Agent only their locations and names. SSH does not automatically forward local environment variables; variables required by remote commands must be available in the remote execution environment.

## Prompts

Each first-deployment prompt authorizes execution: the Agent briefly explains its plan, then proceeds through checks, configuration, build and deployment. Missing information, system privileges or existing target data require user input. Use the separate update and rollback prompts for existing installations.

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

## Update and roll back

Do not reuse first-deployment prompts for existing installations. Establish the current version, configuration and data, backup recovery steps and permitted downtime. The Agent should explain impact and its estimate rather than promise an unverified number of downtime seconds.

### Upgrade an app-installer application

Use a server-side session, or add the SSH target for a local Agent. Build and transfer the new archive from the source project first.

```text
Upgrade the existing app-installer application using the new archive already on the server.
Installation directory: <directory>; archive: <path>; SHA-256: <expected checksum>.
Read nocobase-app-installer, run status, and check the current version, archive platform, configuration, backup scope and migration risk. Run the upgrade precheck without --yes and show me the installer's downtime and backup notes.
Wait for my confirmation before executing. Confirm external database backups before declaring backup-done. Preserve secrets, databases and storage. Report old and new versions, backup locations and verification results; if an automatic rollback occurs, state which version is ultimately running.
```

For Docker updates, specify the new image tag or digest, preserve Compose configuration and persistent directories, confirm backups and the switch window, and retain the old image identity. For app-installer rollback, read the installer's confirmation notes: restoring SQLite can lose writes made since the upgrade. Code rollback is not database restoration; see [Manual: standalone](./standalone).

## Acceptance

Ask for a short deployment report covering:

- The target server, source revision, archive checksum or image identity, and final running version.
- Configuration and persistent directory locations, migration and seed results, without secret contents.
- The health-check URL and response, public URL, and completed sign-in and business checks.
- For updates, the old version, backup locations and rollback procedure; incomplete checks, reasons and concrete next steps.

Sign in through the public URL yourself. For a first deployment, use agreed test data to verify writes, uploads and persistence after restart. For an existing production application, agree on test records and a restart window first; do not write business data, trigger workflows or restart solely for verification without agreement. If the Agent cannot operate a browser, perform those checks yourself and leave them marked pending in its report.

“Configuration generated,” “request accepted,” “container started” and “healthy locally” are intermediate results. Public access, business verification or migration results that remain unconfirmed must stay on the outstanding list.
