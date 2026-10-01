---
title: Deployment
description: The deployment methods NocoBase 3 supports, and how to carry out a deployment with an AI Agent or by hand.
---

# Deployment

Once development is complete, the application is deployed to a server. This chapter covers three subjects: the available deployment methods and when each applies, how to hand a deployment to an AI Agent, and the commands a manual deployment requires.

## Deployment methods

| Method        | When it applies                                                                                                                                                                | Server requirements                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Hub           | Requires a Professional license. The team maintains several applications and manages versions, runtime configuration, deployment history and start/stop state from one console | An installed Hub; see [Manual: Hub](./hub#install-hub) for installation |
| app-installer | A single application runs directly on a server without containers; app-installer manages the pm2 process, backs up before upgrades and rolls back on failure                   | Node.js 24 and a globally installed pm2                                 |
| Docker        | A container platform is already in place, or services are managed with Compose                                                                                                 | Docker and Compose                                                      |

All three deployment methods use the same deployment archive. Running `pnpm build --tar` in the application project root produces `storage/exports/dist.tar.gz`; a Docker deployment runs the same build from source during the image build. The archive contains only build output and production dependencies, excludes runtime configuration and business data, and is not bound to a mount path: the same archive can be mounted standalone at any path such as `/crm`, or handed to a Hub, which mounts it at `/<app ID>`.

Hub is the application publishing and management platform provided by the NocoBase Professional edition and is not included in the open-source edition; without a Professional license, deploy with app-installer or Docker. Hub is itself a NocoBase application. Developers upload deployment archives to it, operators select a version, enter the runtime configuration, start deployments and review logs in the management console, and business users access each application at its own address. A single server can provide both the management console address, such as `https://apps.example.com/hub/`, and the business application addresses, such as `https://apps.example.com/crm/`.

## Ways to carry out a deployment

- **With an AI Agent.** After the deployment target, database and type of operation are stated, the Agent builds, uploads, installs and verifies. The deployment Skill shipped with the application specifies every step, so no commands need to be memorized. See [Deploy with an AI Agent](./with-agent).
- **Manually.** Each deployment method requires only a small number of commands. See [Manual: Hub](./hub) and [Manual: standalone](./standalone).

Both ways run the same commands. The manual pages also serve as the reference for reviewing what an Agent did.

## Prerequisites

The following must be prepared before starting, whichever way the deployment is carried out. An Agent cannot obtain these on its own.

| Item             | Notes                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A server         | Linux x64 or ARM64. Record its CPU architecture and Node major version; the archive must be built for the environment that runs it, and for a Hub running in Docker the container is that environment                             |
| A public address | The domain and mount path, such as `https://apps.example.com/crm/`, together with the TLS certificate and reverse proxy                                                                                                           |
| A database       | The default SQLite needs no preparation. PostgreSQL, MySQL and the other databases require a database and account created in advance and the driver added to the project, such as `pnpm add @nocobase/db-postgres`                |
| Credentials      | Database passwords and other credentials are kept in `.env` or environment variables; a Hub API key is saved with `pnpm nocobase hub auth login`. None of them goes in the conversation, on the command line or in the repository |

## Contents of the runtime directory

| Item         | Description                                                 | On an update                 |
| ------------ | ----------------------------------------------------------- | ---------------------------- |
| `dist/`      | Build output and production dependencies                    | Replaced                     |
| `config.yml` | The current environment's runtime configuration and secrets | Kept                         |
| `storage/`   | Database files, uploads and logs                            | Kept and backed up regularly |

Keeping these three apart ensures that upgrades and rollbacks do not affect data. The backup scope is `config.yml` and `storage/`; data held in an external database or object storage is backed up separately with that service's own tools. A Hub's persistent directory, `APP_STORAGE_DIR`, contains the platform database, the uploaded Releases and the configuration and data of every hosted application, and is backed up as a whole. The configuration fields are described in [Runtime configuration](./configuration); failures are covered in [Troubleshooting](./troubleshooting).
