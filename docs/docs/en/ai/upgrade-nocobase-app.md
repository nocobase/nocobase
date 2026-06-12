---
title: Upgrade NocoBase App
description: Upgrade a NocoBase app saved as a CLI env with nb app upgrade, including env confirmation, upgrade commands, target versions, and verification.
---

# Upgrade NocoBase App

## Step 1: Confirm the Current Env

```bash
nb env current
```

If you are not sure which envs are available, list them first:

```bash
nb env list
```

If the current env is not the app you want to upgrade, switch to the target env:

```bash
nb env use <env-name>
```

## Step 2: Run the Upgrade

:::warning Note

By default, upgrade downloads the app source code or Docker image again.

For npm / Git envs, the `source/` directory is deleted and downloaded again. Do not put files you need to keep in `source/`.

If you have already prepared the source code or Docker image manually and do not want CLI to download it again, add `--skip-download` after the command.

:::

The default upgrade command is:

```bash
nb app upgrade
```

This command usually completes these steps:

1. Stop the current app
2. Download and replace the saved source or image
3. Sync commercial plugins
4. Upgrade and start the app
5. Refresh env runtime information

In scripts, CI, or AI Agent sessions, pass `--force` explicitly:

```bash
nb app upgrade --force
```

If the app to upgrade is not the current env, specify the env:

```bash
nb app upgrade --env app1 --yes --force
```

### Upgrade to a Specific Version

Use `--version` to upgrade to a specific version channel:

```bash
nb app upgrade --version beta
```

You can also pass an exact version:

```bash
nb app upgrade --version 2.1.0-beta.24
```

After a successful upgrade, CLI writes the target version back to the env configuration, so later upgrades or recovery flows can reuse it.

### Skip Download

If you have already updated the source code or Docker image, and only want to run upgrade and start based on the current content, add `--skip-download`:

```bash
nb app upgrade --skip-download
```

This skips source or image download and also skips commercial plugin sync. Use it only when the target version has already been prepared manually.

## Step 3: Verify the Result

After the upgrade, check env runtime and app logs:

```bash
nb env info
nb app logs
```

Then open the app and confirm that the administrator account can sign in. If you want an AI Agent to continue working with this app, start a new AI Agent session or restart the current one so it can read the latest env information.

## Related Links

- [Manage apps](../nocobase-cli/operations/manage-app.md) — Start, stop, restart, view logs, and upgrade apps
- [`nb app upgrade` command reference](../api/cli/app/upgrade.md) — View all upgrade command options
- [Multiple environment management](../nocobase-cli/operations/multi-environment.md) — Confirm, switch, and maintain multiple CLI envs
