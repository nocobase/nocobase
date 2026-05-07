---
title: "nb env list"
description: "nb env list command reference: list configured NocoBase CLI envs and API authentication status."
keywords: "nb env list,NocoBase CLI,environment list,authentication status"
---

# nb env list

List all configured envs and check app API authentication status with saved Token/OAuth credentials.

## Usage

```bash
nb env list
```

## Output

The output table includes the current env marker, name, type, App Status, URL, authentication type, and runtime version.

`App Status` is the result of accessing the app API with the saved auth info, such as `ok`, `auth failed`, `unreachable`, or `unconfigured`. Use [`nb db ps`](../db/ps.md) to inspect database runtime status.

## Examples

```bash
nb env list
```

## Related Commands

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
