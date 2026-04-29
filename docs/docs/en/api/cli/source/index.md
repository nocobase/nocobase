---
title: "nb source"
description: "nb source command reference: manage the local NocoBase source project, including download, dev, build, and test."
keywords: "nb source,NocoBase CLI,source,download,dev,build,test"
---

# nb source

Manage the local NocoBase source project. npm/Git envs use a local source directory; Docker envs usually use [`nb app`](../app/) to manage runtime.

## Usage

```bash
nb source <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb source download`](./download.md) | Fetch NocoBase from npm, Docker, or Git |
| [`nb source dev`](./dev.md) | Start development mode for npm/Git source envs |
| [`nb source build`](./build.md) | Build the local source project |
| [`nb source test`](./test.md) | Run tests in the selected app directory |

## Examples

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Related Commands

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
