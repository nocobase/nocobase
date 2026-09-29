---
title: '6. Deploy'
description: 'Build the production application and verify it again in the target environment.'
---

# 6. Deploy

Build a production artifact after the development flow works. Do not run the production service with `pnpm dev`.

## Goal and starting point

Complete the order, permission, approval, and notification checks first. This chapter produces a runnable build and prepares the target configuration. You need permission to manage files, configure services, and read logs on the target machine.

## Separate code, configuration, and business data

| Item                      | Contents                                                 | During an update                      |
| ------------------------- | -------------------------------------------------------- | ------------------------------------- |
| Build artifacts           | Compiled pages, server code, and workflow artifacts      | Update with the release               |
| Environment configuration | Database location, public address, secrets, and channels | Maintain for the target environment   |
| Business data             | Customers, orders, accounts, notifications, and uploads  | Persist and back up before deployment |

A working local page only demonstrates the local environment. Check the database path, public address, and workflow enablement when deploying, so the new process does not connect to an empty database or generate incorrect links.

## Check before building

Run from the application root:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

If integration tests need a running application, configure their target URL and make sure they actually ran rather than all being skipped. A successful build does not verify permissions, approvals, or delivery.

## Run production locally

First set an absolute persistent SQLite `filename` in `config.yml`. The default path follows the runtime root: development uses `storage/database.sqlite`, while the build may use `dist/storage/database.sqlite`. Without a fixed path you can open a new database and lose sight of earlier orders. The `database` field is not a substitute for SQLite's `filename`.

```yaml
database:
  connections:
    main:
      dialect: sqlite
      filename: /absolute/path/to/persistent/database.sqlite
```

Check that it points to the intended data and stop development before running another process against the same exercise database:

```bash
pnpm start
```

Sign in at the printed address and check order details and My notifications. Development-only routes are absent in production; this is why the inbox needs an App route.

Next, prepare the target server, domain, and environment configuration.

## Prepare a deployment archive

Builds target the current machine by default. For a Node.js 24, Linux x64, glibc server:

```bash
pnpm build --target linux-x64 --tar
```

The output is `storage/exports/dist.tar.gz`, containing `dist/` and `config.example.yml`; `dist/` already carries its production dependencies. Use a matching target for ARM or musl. Native database dependencies must also match the target platform and Node.js version.

Do not publish the local database, test passwords, or real `config.yml`. Upload the build archive to a new release directory and extract it:

```bash
mkdir -p order-app
cd order-app
tar -xzf /path/to/dist.tar.gz
cp config.example.yml config.yml
```

Set the target database, authentication and session secrets, and in-app channel in `config.yml`. Keep SQLite data and uploads in persistent locations outside replaceable release directories. Use independent production configuration and accounts rather than demonstration data.

## Configure the address and start

`APP_PUBLIC_ORIGIN` is the external origin without the mount path; `APP_BASE_PATH` is the mount path. Replace these example values:

```bash
export APP_PUBLIC_ORIGIN=https://orders.example.com
export APP_BASE_PATH=/main
export APP_SERVER_HOST=127.0.0.1
export APP_SERVER_PORT=13000
export NODE_ENV=production
node ./dist/server/standalone.js
```

The archive holds only the build output. After extracting it, run the compiled entry `dist/server/standalone.js` with `node`; in the source workspace use `pnpm start`. Run the application's commands, such as `db apply`, with `node dist/cli/index.js db apply`.

Configure an HTTPS reverse proxy for the domain, retaining API, static asset, and WebSocket paths. Use a service manager for process startup, restarts, and logs. Back up an existing database before migrations and decide whether the target runs them at startup or as a separate release step.

## Verify the target environment

| Check                        | Expected result                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Sign-in and detail refresh   | Correct sessions, routing, and assets                                                                |
| Salesperson A and B          | Isolated data, including direct detail requests                                                      |
| Submission and decisions     | Valid transitions; duplicate approval rejected                                                       |
| Management API authorization | Ordinary users cannot read others’ run records or perform management operations; APIs enforce access |
| Workflow revision            | Correct deployed revision enabled                                                                    |
| My notifications             | One result for the applicant, with the correct link                                                  |
| Service restart              | Orders and notifications persist                                                                     |

Artifacts are deployed with the build, but workflow enablement in the target database still needs checking. Distinguish configuration, migration, native dependency, and business errors; do not reset a database to fix deployment.

## Deploy through Hub

When the team has a Hub, which requires a Professional license, the archive built above can be published to it, and Hub takes over unpacking and process management. The steps are described in [Manual: Hub](/deployment/hub); for an AI Agent, use the prompts in [Deploy with an AI Agent](/deployment/with-agent).
