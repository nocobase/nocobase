# How to connect the old installation method to AI and migrate to CLI

If you are still using Docker, `create-nocobase-app` or Git source code to install and maintain NocoBase according to the old documentation, you can continue to use it in this way. There is no need to reinstall the application immediately to access AI.

This page mainly helps you determine the route first:

- Continue to use the original installation and upgrade methods
- Let existing applications access AI agent first
- Migrate to new CLI-based approach

By default, it is recommended to first check which category you belong to, and then enter the corresponding document. This is more stable and less likely to misoperate the production environment.

## Which method should I choose?

| If you want now... | What to do by default |
| --- | --- |
| Continue to install, upgrade and maintain applications in the original way | Just continue to use the old way, first read the relevant document entry below |
| Let an old application that has been running stably connect to the AI agent | By default, remote connection is used first, which has the lowest risk |
| Use `nb app`, `nb env`, `nb source` to manage applications in the future | Create a new CLI application and migrate the old data there |

## Continue to use the original installation method

If you are used to the previous installation method, you can continue to use it. Just follow the original documents for installation, upgrade and environment variable configuration.

### Install NocoBase

- [Docker installation](/get-started/installation/docker)
- [create-nocobase-app installation](/get-started/installation/create-nocobase-app)
- [Git source code installation](/get-started/installation/git)
- [Environment variables](/get-started/installation/env)

### Upgrade NocoBase

- [Upgrading Docker installation](/get-started/upgrading/docker)
- [Upgrading of create-nocobase-app installation](/get-started/upgrading/create-nocobase-app)
- [Upgrading Git source code installation](/get-started/upgrading/git)

## Method 1: First let existing applications access AI agent

If your old application is already running stably, use this method by default.

The focus of this method is to first connect existing applications to the CLI and AI agent through remote connection. This is the lowest risk because it doesn't directly take over your current installation, startup, stop, and upgrade processes.

But we must first clarify the boundaries:

- This method does not have `nb app` related capabilities
- It does not take over runtime management of old apps for you
- But AI building related abilities can be used normally

In other words, if what you care about most at the moment is "connect the AI ​​first" rather than "immediately switch the entire operation management system to the CLI", you will take this path first by default.

When connecting to an existing application, you can initialize a CLI env like this:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

If re-authentication is required later, you can execute:

```bash
nb env auth app1
```

If you just want to start using AI to build capabilities, just continue to read [AI Build Quick Start](/ai-builder/).

## Method 2: Migrate to CLI

If you want to use `nb app`, `nb env`, and `nb source` to manage local applications in the future, then the safer approach is not to directly take over the existing application, but to create a new application and then migrate the data of the old application there.

The reason is also very simple: the ability to "take over existing applications" is still under development.

So at the moment, the default recommended migration route is:

1. First create a new CLI application
2. Migrate the database, `storage` and environment variables of the old application.
3. After verifying that the operation, upgrade and AI capabilities of the new application are normal, decide whether to switch to the production environment.

First create a new CLI env:

```bash
nb init --yes --env app1
```

Before migrating, it is recommended to confirm that these contents are ready:

1. The database has been backed up
2. The `storage` directory has been backed up
3. The key environment variables of the old application have been recorded, such as `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

By default, it is enough to migrate the test environment first. Only migrate the production environment when you have confirmed that the backup, environment variables, and database configuration are all correct.

## Where to look next

- If you are ready to install and manage applications in a new way, continue to [Installation using CLI (recommended)](./cli.md)
- If you just continue to use the original installation method, just go back to the installation and upgrade document entry above.
