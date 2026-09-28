---
title: Deployment
description: Choose standalone or Hub deployment, then configure, publish and operate the application.
---

# Deployment

A NocoBase 3 application can be deployed on its own, or published and run through Hub, which manages application releases and runtime centrally.

## What Hub is

Hub is NocoBase's platform for deploying and managing applications. Developers build an application into a deployment archive and upload it to Hub; administrators with the right permissions pick a version in the browser, fill in the runtime configuration, start a deployment, and follow its status and logs. Once the application is live, Hub is also where it is updated to a new version, started, stopped or rolled back.

Take a CRM application you have already built:

- **Without Hub**: put the CRM archive on a server, configure the database and secrets, and start it with Node.js or Docker. Later updates mean maintaining the code or image on that server yourself, or letting app-installer install, upgrade and roll it back.
- **With Hub**: prepare a working Hub, create an App record for the CRM in it, upload the archive and deploy. Later versions are published through the Hub console or the CLI.

Hub manages one or many applications and is meant for developers and operators. Business users reach each application at its own address.

## How Hub relates to your applications

Hub itself has to be installed on a server. Once a platform administrator has done that, application developers can use it to publish applications; if your team already runs a Hub, all you need is the application and permission to publish.

```text
Developer:      build the CRM archive → upload to Hub → configure and deploy
Administrator:  open Hub → review versions, deployment results, runtime status and logs
Business user:  open the CRM address → work with customers, orders and the rest
```

One server can serve two addresses for two purposes, such as `https://apps.example.com/hub/` for the management platform and `https://apps.example.com/crm/` for the application itself. Hub's administrator accounts and permissions are maintained separately from the CRM's business accounts and data permissions.

## Choosing a deployment mode

| Mode                          | When it fits                                                                                                                           | Where to read                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Standalone                    | You manage the application process, containers and release flow yourself                                                               | [Production configuration](./configuration), [Build and run](./standalone); for containers continue with [Docker](./docker) |
| Standalone with app-installer | No Hub and no containers: the installer puts the archive on the server, runs it under pm2, and handles upgrades, backups and rollbacks | [Production configuration](./configuration) → [app-installer](./app-installer)                                              |
| Hub                           | Versions, configuration, deployment records and start/stop are managed centrally through Hub                                           | [Deploy Hub](./hub) → [Publish applications with Hub](./hub-publishing); with an existing Hub, read the latter directly     |

## Hand it to the AI Agent

Every step on the pages above can be carried out by an AI Agent. Prepare the server, the database and the credentials as the matching page describes before starting; the agent cannot make up what it does not have.

### Where to open the session

- **Publishing to Hub**: in the application's source root, where the application's own `nocobase-deployment` Skill, synchronized under `.agents/skills/`, builds, uploads and verifies; the steps are in [Publish applications with Hub](./hub-publishing).
- **Standalone (Node.js or Docker)**: likewise in the application's source root, to build the archive or the image. The steps on the server need the agent to reach the server over SSH, or a second session opened on the server to take over; the steps are in [Build and run](./standalone) and [Docker](./docker).
- **app-installer**: the session on the build machine builds the archive. Installing, upgrading and rolling back on the server are driven by the global `nocobase-app-installer` Skill, installed first with `npx skills add nocobase/nocobase3 --skill nocobase-app-installer -g`; the steps are in [app-installer](./app-installer).
- **Installing Hub**: with the installer, the same global `nocobase-app-installer` Skill drives it; with Docker, follow [Deploy Hub](./hub) from a session opened in a NocoBase application directory, where the application's own deployment Skill takes over.

### What to state

- Deployment mode: Hub, standalone (Node.js or Docker) or app-installer.
- Address: for example `https://apps.example.com/crm/`.
- Database: keep the existing one, start with a new empty one, or restore a backup.
- Operation: first deployment, update, rollback or recovery.

Credentials do not belong in the conversation. Put database passwords and Hub API keys in `.env` or the runtime configuration file and state where they are. For example:

```text
Deploy this application to Hub at https://apps.example.com/hub with App ID crm; the address is https://apps.example.com/crm/.
This is the first deployment. It uses PostgreSQL; the database exists and the connection details are in runtime.yml in the project root.
Tell me the commands before running them, and give me a deployment report when done.
```

### What the report must contain

Ask for the deployed version, the migration result, the outcome of every item under [Initialize and verify](./standalone#initialize-and-verify), and any check that was skipped. A running process is not a usable application: open the real address and sign in yourself as well.

## After going live

Backups, recovery steps and common problems are covered in [Backup, recovery and troubleshooting](./operations).
