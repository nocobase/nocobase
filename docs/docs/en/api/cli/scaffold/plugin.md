---
title: "nb scaffold plugin"
description: "nb scaffold plugin command reference: generate NocoBase plugin scaffold."
keywords: "nb scaffold plugin,NocoBase CLI,plugin scaffold"
---

# nb scaffold plugin

Generate NocoBase plugin scaffold code.

## Usage

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `<pkg>` | string | Plugin package name, required |
| `--cwd`, `-c` | string | Specify the app root directory path |
| `--force-recreate`, `-f` | boolean | Force recreating the plugin scaffold |

## Examples

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Description

For CLI-managed source apps (created via `nb init`), the plugin is generated under the `<app-path>/plugins/` directory, and `nb` automatically syncs it to `source/packages/plugins/` for the development and build workflow.

If the target plugin already exists, the command will fail by default. Use `--force-recreate` to force recreation. If there are conflicting directories or external symlinks on the source side, you need to manually remove the conflicts before retrying.

## Related Commands

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
