---
title: "nb init"
description: "nb init command reference: initialize NocoBase, connect an existing app or install a new app, and save it as a CLI env."
keywords: "nb init,NocoBase CLI,initialization,env,Docker,npm,Git"
---

# nb init

Initialize the current workspace so coding agents can connect to and use NocoBase. `nb init` can connect an existing app or install a new app from Docker, npm, or Git.

## Usage

```bash
nb init [flags]
```

## Notes

`nb init` supports three prompt modes:

- Default mode: fill in setup details step by step in the terminal.
- `--ui`: open a local browser form for the setup wizard.
- `--yes`: skip prompts and use flags plus defaults. This mode requires `--env <envName>` and creates a new local app.

If initialization is interrupted after env configuration has been saved, resume it with:

```bash
nb init --env app1 --resume
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Skip prompts and use flags plus defaults |
| `--env`, `-e` | string | Env name for this setup; required with `--yes` and `--resume` |
| `--ui` | boolean | Open the browser-based setup wizard; cannot be used with `--yes` |
| `--verbose` | boolean | Show verbose command output |
| `--ui-host` | string | Local service bind address for `--ui`, default `127.0.0.1` |
| `--ui-port` | integer | Local service port for `--ui`; `0` means auto-assign |
| `--locale` | string | CLI prompt and UI language: `en-US` or `zh-CN` |
| `--api-base-url`, `-u` | string | NocoBase API URL, including the `/api` prefix |
| `--auth-type`, `-a` | string | Authentication type: `token` or `oauth` |
| `--access-token`, `-t` | string | API key or access token used with `token` authentication |
| `--resume` | boolean | Reuse saved workspace env config and continue initialization |
| `--lang`, `-l` | string | Language for the installed NocoBase app |
| `--force`, `-f` | boolean | Reconfigure an existing env and replace conflicting runtime resources when needed |
| `--app-root-path` | string | Local npm/Git app source directory, default `./<envName>/source/` |
| `--app-port` | string | Local app port, default `13000`; `--yes` mode auto-selects an available port |
| `--storage-path` | string | Directory for uploaded files and managed database data, default `./<envName>/storage/` |
| `--root-username` | string | Initial admin username |
| `--root-email` | string | Initial admin email |
| `--root-password` | string | Initial admin password |
| `--root-nickname` | string | Initial admin nickname |
| `--builtin-db`, `--no-builtin-db` | boolean | Whether to create a CLI-managed built-in database |
| `--db-dialect` | string | Database dialect: `postgres`, `mysql`, `mariadb`, or `kingbase` |
| `--builtin-db-image` | string | Built-in database container image |
| `--db-host` | string | Database host |
| `--db-port` | string | Database port |
| `--db-database` | string | Database name |
| `--db-user` | string | Database user |
| `--db-password` | string | Database password |
| `--fetch-source` | boolean | Download app files or pull the Docker image before installation |
| `--source`, `-s` | string | How to obtain NocoBase: `docker`, `npm`, or `git` |
| `--version`, `-v` | string | Version parameter: npm version, Docker image tag, or Git ref |
| `--replace`, `-r` | boolean | Replace the target directory if it already exists |
| `--dev-dependencies`, `-D` | boolean | Whether npm/Git installs devDependencies |
| `--output-dir`, `-o` | string | Download target directory, or directory for the Docker tarball |
| `--git-url` | string | Git repository URL |
| `--docker-registry` | string | Docker image repository name without tag |
| `--docker-platform` | string | Docker image platform: `auto`, `linux/amd64`, or `linux/arm64` |
| `--docker-save`, `--no-docker-save` | boolean | Whether to save the pulled Docker image as a tarball |
| `--npm-registry` | string | Registry used for npm/Git downloads and dependency installation |
| `--build`, `--no-build` | boolean | Whether to build after npm/Git dependency installation |
| `--build-dts` | boolean | Whether to generate TypeScript declaration files during npm/Git build |

## Examples

```bash
nb init
nb init --ui
nb init --env app1 --yes
nb init --env app1 --resume
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source npm --version alpha --app-port 13080
nb init --env app1 --yes --source git --version fix/cli-v2
nb init --ui --ui-port 3000
```

## Related Commands

- [`nb env add`](./env/add.md)
- [`nb source download`](./source/download.md)
