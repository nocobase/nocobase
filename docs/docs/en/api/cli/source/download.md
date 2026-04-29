---
title: "nb source download"
description: "nb source download command reference: fetch NocoBase source or images from npm, Docker, or Git."
keywords: "nb source download,NocoBase CLI,download,npm,Docker,Git"
---

# nb source download

Fetch NocoBase from npm, Docker, or Git. `--version` is shared by all three source types: npm uses a package version, Docker uses an image tag, and Git uses a git ref.

## Usage

```bash
nb source download [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Use defaults and skip interactive prompts |
| `--verbose` | boolean | Show verbose command output |
| `--locale` | string | CLI prompt language: `en-US` or `zh-CN` |
| `--source`, `-s` | string | Source type: `docker`, `npm`, or `git` |
| `--version`, `-v` | string | npm package version, Docker image tag, or Git ref |
| `--replace`, `-r` | boolean | Replace the target directory if it already exists |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Whether npm/Git installs devDependencies |
| `--output-dir`, `-o` | string | Download target directory, or directory for the Docker tarball |
| `--git-url` | string | Git repository URL |
| `--docker-registry` | string | Docker image repository name without tag |
| `--docker-platform` | string | Docker image platform: `auto`, `linux/amd64`, or `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Whether to save the pulled Docker image as a tarball |
| `--npm-registry` | string | Registry used for npm/Git downloads and dependency installation |
| `--build` / `--no-build` | boolean | Whether to build after npm/Git dependency installation |
| `--build-dts` | boolean | Whether to generate TypeScript declaration files during npm/Git build |

## Examples

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## Version Aliases

With Git source, common dist-tags are resolved to branches: `latest` -> `main`, `beta` -> `next`, `alpha` -> `develop`.

## Related Commands

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
