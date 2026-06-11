# Quick start

If this is your first time using this CLI, you don’t need to memorize all the commands at the beginning. Use `nb init --ui` to install an application first, and then continue looking at the rest according to the scenario.

## First establish the most important mind

In NocoBase CLI, subsequent operations do not revolve around "a certain directory" or "a certain port" by default, but around **env**.

You can think of env as "a set of application connection and running information remembered by the CLI". As long as it has been saved successfully, many subsequent commands can be used directly:

- Use `nb init` to install a new application and save it as env
- Use `nb env add` to connect an existing application to the CLI
- Manage this env with `nb app start`, `nb app logs`, `nb app upgrade`
- Backup and restore this env using `nb backup`
- Use `nb app autostart`, `nb proxy` to continue to supplement the production environment capabilities

Keep this in mind first, and the subsequent documents will be much smoother.

## Default recommended path

If you're not sure where to start, it's usually easiest to follow this path:

1. First read [Installation using CLI (recommended)](./installation/cli.md) and complete `nb init` once.
2. After the application is saved as env, look at [Multiple Environment Management](./operations/multi-environment.md) to confirm the current env, switch env, and check the status.
3. For daily startup, stop, log and upgrade, continue to see [Manage Application](./operations/manage-app.md).
4. Before making upgrades, migrations or important changes, see [Backup and Restore](./operations/backup-restore.md).
5. If you are ready to officially go online, then enter [Production Environment Deployment Overview] (./production/index.md).

The first three steps cover most usage scenarios.

## Quick index

| I want... | Where to look |
| --- | --- |
| There is no application yet, first install a new NocoBase and save it as CLI env | [Install using CLI (recommended)](./installation/cli.md) |
| Already have a running NocoBase and want to access CLI management | [Install using CLI (recommended)](./installation/cli.md) |
| Gradually migrate old installation methods to CLI | [Migrate from old installation methods to CLI](./installation/migration.md) |
| See which envs are saved locally, switch the current env, and check the status | [Multiple environment management](./operations/multi-environment.md) |
| Start, stop, restart the application, view logs, or continue the upgrade | [Manage Application](./operations/manage-app.md) |
| Make a backup before upgrading, migrating or batch changing data, and then restore it when necessary | [Backup and restore](./operations/backup-restore.md) |
| First confirm the key environment variables required to run the application | [Application environment variables](./installation/env.md) |
| Install third-party plug-ins | [Third-party plug-in installation and upgrade](./plugins/third-party.md) |
| Let the application enter the production environment: automatic startup, stable external access, reverse proxy | [Overview of production environment deployment](./production/index.md) |

## When to look at the command reference

This set of quick start documents is more "what do I want to do now". If you already know which command you want to execute and just want to continue to see the complete parameters, just go to [NocoBase CLI Command Reference](../api/cli/index.md).

The default suggestions are:

- First use the Quick Start document to establish a sense of path
- Then check the parameter details on the specific command page

This makes it easier to get started than reading the complete command tree at first glance.
