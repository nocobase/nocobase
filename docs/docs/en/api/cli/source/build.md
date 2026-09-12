---
title: "nb source build"
description: "nb source build command reference: build the local NocoBase source project."
keywords: "nb source build,NocoBase CLI,build,source"
---

# nb source build

Build the local NocoBase source project. This command forwards to the legacy NocoBase build flow at the repository root.

## Usage

```bash
nb source build [packages...] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[packages...]` | string[] | Package names to build; builds all packages if omitted |
| `--cwd`, `-c` | string | Working directory |
| `--no-dts` | boolean | Do not generate `.d.ts` declaration files |
| `--sourcemap` | boolean | Generate sourcemaps |
| `--verbose` | boolean | Show verbose command output |

## Examples

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Related Commands

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
