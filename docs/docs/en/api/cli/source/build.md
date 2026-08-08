---
title: "nb source build"
description: "nb source build command reference: build the local NocoBase source project."
keywords: "nb source build,NocoBase CLI,build,source"
---

# nb source build

Build the local NocoBase source project. This command must be run from the source directory (`<app-path>/source/`). For CLI-managed source apps, plugins under `plugins/` are automatically synced to `source/packages/plugins/` before the build.

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
| `--tar` | boolean | Automatically package into `.tgz` files after the build |
| `--verbose` | boolean | Show verbose command output |

## Examples

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Description

When using `--tar`, the specified plugins are packaged into `.tgz` files after the build, and the output is placed in the `source/storage/tar/` directory. The full tarball path is printed when the command finishes.

## Related Commands

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
