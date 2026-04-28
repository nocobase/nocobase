---
title: "nb api dynamic commands"
description: "nb api dynamic commands reference: CLI API commands generated from NocoBase OpenAPI Schema."
keywords: "nb api dynamic commands,NocoBase CLI,OpenAPI,swagger"
---

# nb api dynamic commands

In addition to [`nb api resource`](./resource/), `nb api` includes commands generated from the NocoBase app's OpenAPI Schema. These commands are generated and cached the first time you run [`nb env add`](../env/add.md) or [`nb env update`](../env/update.md).

## Common Groups

| Command group | Description |
| --- | --- |
| `nb api acl` | Access control: roles, resource permissions, and action permissions |
| `nb api api-keys` | API Key management |
| `nb api app` | App management |
| `nb api authenticators` | Authentication management: password, SMS, SSO, and more |
| `nb api data-modeling` | Data modeling: data sources, collections, and fields |
| `nb api file-manager` | File management: storage services and attachments |
| `nb api flow-surfaces` | Page orchestration: pages, blocks, fields, and actions |
| `nb api system-settings` | System settings: title, logo, language, and more |
| `nb api theme-editor` | Theme management: colors, sizes, and theme switching |
| `nb api workflow` | Workflow: automation process management |

Available groups and commands depend on the connected NocoBase app version and enabled plugins. Run the following commands to inspect the commands supported by the current app:

```bash
nb api --help
nb api <topic> --help
```

## Request Body Parameters

Dynamic commands with request bodies support:

| Parameter | Type | Description |
| --- | --- | --- |
| `--body` | string | Request body as a JSON string |
| `--body-file` | string | Path to a JSON file |

`--body` and `--body-file` are mutually exclusive.

## Related Commands

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/)
