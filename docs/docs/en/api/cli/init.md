---
title: 'nb init'
description: 'nb init command reference: install a new app, take over an existing local app, or connect to a remote app and save it as a CLI env.'
keywords: 'nb init,NocoBase CLI,initialize,env,Docker,npm,Git,remote connection'
---

# nb init

Initialize the current workspace so the coding agent can connect to and use NocoBase.

`nb init` can install a new local NocoBase app, or save the connection information of an existing app.

In addition, `nb init` also synchronizes NocoBase AI coding skills by default. You only need to add `--skip-skills` if you already manage skills yourself, or if you are running in CI or an offline environment.

## Usage

```bash
nb init [flags]
```

## Interactive modes

`nb init` supports three interactive modes:

- `nb init`: complete the setup step by step in the terminal
- `nb init --ui`: open a local browser form and complete setup with a visual wizard
- `nb init --yes --env app1`: skip prompts and use flags directly; parameters not explicitly passed will use default values

`--yes` mode is suitable for scripts, CI/CD, or other non-interactive scenarios. In this mode, `--env <envName>` is required. Generally, it installs a new local app by default; if you do not specify `--source`, it uses `docker` as the default install source.

## Resuming interrupted initialization

Installation flows save the env configuration first, then perform download, database, and app installation. If the process fails midway, you can continue with:

```bash
nb init --env app1 --resume
```

`--resume` only applies to initialization flows where the env configuration has already been saved, and `--env` must be passed explicitly.

## Preparing an env without installing the app yet

`--prepare-only` is intended for flows where the env should be prepared first, then the license is activated, and only after that the app is installed and started.

If you want to save the env config, prepare the source files or image, and get the database ready first, but delay the actual app installation and first startup, you can use:

```bash
nb init --env app1 --prepare-only
nb init --env app1 --prepare-only --ui
nb init --env app1 --prepare-only --yes
```

This mode is available for local installation flows, including the `--ui` wizard. It is not available for remote connection flows. It saves the env as a prepared env, so you can continue later with a flow such as:

```bash
nb license activate --env app1
nb app start --env app1
```

`nb app start` will then complete the first installation and switch the env from the prepared state to the normal installed state.

## Installation directory layout

You can view the full path with `nb env info app1 --field app.appPath`.

By default, the CLI organizes local files under `app-path` using the following convention:

```text
<app-path>/
├── source/   # Default directory for app source code or downloaded content
├── storage/  # Runtime data directory
└── .env      # Optional app environment variable file
```

Typically:

- `source/` mainly corresponds to the local app directory for npm / Git envs. For Docker envs, the CLI also keeps this default path derivation, but most of the time you do not need to care about it manually. Pay special attention during upgrades: the `source/` directory will be deleted and downloaded again, so do not put files you need to keep here
- `storage/` is used for runtime data, such as built-in database data, plugins, logs, and more
- `.env` is an optional app environment variable file. You only need to add it in `<app-path>/.env` when you want to customize environment variables; if this file exists, Docker, npm, and Git install sources will all read it by default

This represents the CLI's default directory convention. Depending on the install source, plugins, and runtime stage, the actual generated directory contents may not be exactly the same.

## Notes

:::warning Notes

- `--ui` cannot be used together with `--yes`
- `--ui` also cannot be used together with `--resume`
- `--ui-host` and `--ui-port` can only be used together with `--ui`
- `--skip-auth` cannot be used together with `--access-token` or `--token`

:::

## Quickly locate by Steps

The Steps shown are not exactly the same for different setup paths. For example, when connecting to an existing app, you usually only use `Getting started` and `Remote connection`.

If you are following the local UI wizard step by step, you can first use the table below to quickly locate the relevant section:

| Step                      | Main related parameters                                                                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Getting started`         | `--env`、`--yes`、`--ui`、`--locale`、`--verbose`、`--skip-skills`、`--resume`                                                                                                                                    |
| `App environment`         | `--lang`、`--app-path`、`--app-port`、`--force`                                                                                                                                                                   |
| `App source and version`  | `--source`、`--version`、`--skip-download`、`--git-url`、`--docker-registry`、`--docker-platform`、`--npm-registry`、`--replace`、`--dev-dependencies`、`--output-dir`、`--docker-save`、`--build`、`--build-dts` |
| `Configure the database`  | `--builtin-db`、`--db-dialect`、`--builtin-db-image`、`--db-host`、`--db-port`、`--db-database`、`--db-user`、`--db-password`、`--db-schema`、`--db-table-prefix`、`--db-underscored`                             |
| `Create an admin account` | `--root-username`、`--root-email`、`--root-password`、`--root-nickname`                                                                                                                                           |
| `Remote connection`       | `--api-base-url`、`--auth-type`、`--access-token`、`--username`、`--password`、`--skip-auth`                                                                                                                      |

## Parameters

There are many parameters, so it is clearer to break them down by usage scenario.

The “Default” below means the value or behavior that `nb init` usually uses when you omit that parameter.

### Basics and interaction

| Parameter       | Type    | Default                                                                      | Description                                                                            |
| --------------- | ------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `--yes`, `-y`   | boolean | `false`                                                                      | Skip prompts and use flags and default values                                          |
| `--env`, `-e`   | string  | None                                                                         | The env name to save for this initialization; required in `--yes` and `--resume` modes |
| `--ui`          | boolean | `false`                                                                      | Open the local browser wizard; cannot be used with `--yes` or `--resume`               |
| `--verbose`     | boolean | `false`                                                                      | Show detailed command output                                                           |
| `--skip-skills` | boolean | `false`                                                                      | Skip syncing NocoBase AI coding skills                                                 |
| `--ui-host`     | string  | `127.0.0.1`                                                                  | Bind address for the `--ui` local service                                              |
| `--ui-port`     | integer | `0`                                                                          | Port for the `--ui` local service; `0` means automatic assignment                      |
| `--locale`      | string  | Follows `NB_LOCALE`, CLI config, or system locale; final fallback is `en-US` | Language for CLI prompts and the local setup UI: `en-US` or `zh-CN`                    |
| `--resume`      | boolean | `false`                                                                      | Continue the last unfinished initialization and reuse the saved workspace env config   |
| `--prepare-only` | boolean | `false`                                                                     | Save and prepare a local installation env, including `--ui` flows, without installing or starting the app yet |

### Connecting to an existing app

| Parameter              | Type    | Default | Description                                                                                                                                        |
| ---------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u` | string  | None    | API base URL; must include the `/api` prefix                                                                                                       |
| `--auth-type`, `-a`    | string  | `oauth` | Authentication method: `basic`, `token`, or `oauth`. In most cases, the default `oauth` is fine; in some CI/CD scenarios, `basic` can also be used |
| `--access-token`, `-t` | string  | None    | API key or access token used for `token` authentication                                                                                            |
| `--username`           | string  | None    | Username used for `basic` authentication                                                                                                           |
| `--password`           | string  | None    | Password used for `basic` authentication                                                                                                           |
| `--skip-auth`          | boolean | `false` | Save the env and auth method first, then complete login later with `nb env auth`                                                                   |

### Basic parameters for local installation

| Parameter         | Type    | Default                             | Description                                                                       |
| ----------------- | ------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `--lang`, `-l`    | string  | `en-US`                             | UI language of the newly installed app                                            |
| `--force`, `-f`   | boolean | `false`                             | Reconfigure an existing env and replace conflicting runtime resources when needed |
| `--app-path`      | string  | `./<envName>/`                      | Local npm/Git app directory                                                       |
| `--app-port`      | string  | `13000`                             | Local app HTTP port; in `--yes` mode, an available port is selected automatically |
| `--root-username` | string  | `nocobase` (`--yes` mode)           | Initial admin username                                                            |
| `--root-email`    | string  | `admin@nocobase.com` (`--yes` mode) | Initial admin email                                                               |
| `--root-password` | string  | `admin123` (`--yes` mode)           | Initial admin password                                                            |
| `--root-nickname` | string  | `Super Admin` (`--yes` mode)        | Initial admin display name                                                        |

### Database parameters

| Parameter                                  | Type    | Default                                                               | Description                                                       |
| ------------------------------------------ | ------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | `true`                                                                | Whether to create and connect a CLI-managed built-in database     |
| `--db-dialect`                             | string  | `postgres`                                                            | Database type: `postgres`, `mysql`, `mariadb`, `kingbase`         |
| `--builtin-db-image`                       | string  | Follows `--db-dialect` and locale                                     | Built-in database container image                                 |
| `--db-host`                                | string  | `postgres` for built-in databases; `127.0.0.1` for external databases | Database host address                                             |
| `--db-port`                                | string  | `postgres=5432`、`mysql=3306`、`mariadb=3306`、`kingbase=54321`       | Database port                                                     |
| `--db-database`                            | string  | `nocobase`; `kingbase` for KingbaseES                                 | Database name                                                     |
| `--db-user`                                | string  | `nocobase`                                                            | Database username                                                 |
| `--db-password`                            | string  | `nocobase`                                                            | Database password                                                 |
| `--db-schema`                              | string  | None                                                                  | Database schema; only used by PostgreSQL                          |
| `--db-table-prefix`                        | string  | None                                                                  | Database table prefix                                             |
| `--db-underscored` / `--no-db-underscored` | boolean | `false`                                                               | Whether database table names and field names use underscore style |

### Download and source code parameters

| Parameter                                            | Type    | Default                                                                                          | Description                                                                              |
| ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `--skip-download`                                    | boolean | `false`                                                                                          | Skip download and reuse an existing local app directory or Docker image                  |
| `--source`, `-s`                                     | string  | `docker`                                                                                         | How to obtain NocoBase: `docker`, `npm`, or `git`                                        |
| `--version`, `-v`                                    | string  | `beta`                                                                                           | Version parameter: npm package version, Docker image tag, or Git ref                     |
| `--replace`, `-r`                                    | boolean | `false`                                                                                          | Replace when the target directory already exists                                         |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | `false`                                                                                          | Whether to install devDependencies for npm/Git installs                                  |
| `--output-dir`, `-o`                                 | string  | Derived from `--app-path` for npm/Git; `./nocobase-<version>` for Docker + `--docker-save`       | Download target directory, or the tarball save directory when `--docker-save` is enabled |
| `--git-url`                                          | string  | `https://github.com/nocobase/nocobase.git`                                                       | Git repository URL                                                                       |
| `--docker-registry`                                  | string  | `nocobase/nocobase`; under `zh-CN` locale, `registry.cn-shanghai.aliyuncs.com/nocobase/nocobase` | Docker image repository name, without tag                                                |
| `--docker-platform`                                  | string  | `auto`                                                                                           | Docker image platform: `auto`, `linux/amd64`, `linux/arm64`                              |
| `--docker-save` / `--no-docker-save`                 | boolean | `false`                                                                                          | Whether to additionally save the Docker image as a tarball after pulling                 |
| `--npm-registry`                                     | string  | Empty                                                                                            | Registry used for npm/Git download and dependency installation                           |
| `--build` / `--no-build`                             | boolean | `true`                                                                                           | Whether to build after installing npm/Git dependencies                                   |
| `--build-dts`                                        | boolean | `false`                                                                                          | Whether to generate TypeScript declaration files during npm/Git builds                   |

## Examples

The most common usage patterns are as follows.

### Complete the setup step by step in the terminal

```bash
nb init
```

### Open the local browser wizard

```bash
nb init --ui
nb init --ui --ui-port 3000
```

### Prepare first, then activate the license and start later

```bash
nb init --env app1 --prepare-only
nb license activate --env app1
nb app start --env app1
```

### Install a new local app in non-interactive mode

If you do not specify `--source`, Docker is usually used as the install source.

```bash
nb init --env app1 --yes
nb init --env app1 --yes --source docker --version latest
nb init --env app1 --yes --source docker --version beta
nb init --env app1 --yes --source docker --version alpha
nb init --env app1 --yes --source docker --version main \
  --docker-registry registry.cn-beijing.aliyuncs.com/nocobase/nocobase
nb init --env app1 --yes --source npm --version latest
nb init --env app1 --yes --source npm --version beta
nb init --env app1 --yes --source npm --version alpha
nb init --env app1 --yes --source npm --version beta --app-port 13080
nb init --env app1 --yes --source git --version latest
nb init --env app1 --yes --source git --version beta
nb init --env app1 --yes --source git --version alpha
nb init --env app1 --yes --source git --version feat/plugin-workflow-timeout
nb init --env app1 --yes --source git --version latest \
  --git-url https://gitee.com/nocobase/nocobase.git
```

### Quick install and use basic authentication

If you want to quickly install a local app in non-interactive mode and directly save `basic` authentication after installation, you can also write it like this. This way, you do not need to open a browser to complete OAuth.

If you keep the default admin account used in `--yes` mode, the shortest form is:

When omitted, the default admin account is `nocobase`, and the default password is `admin123`:

```bash
nb init --env app1 --yes --auth-type basic
```

If you also want to customize the admin account, you can write it like this:

```bash
nb init --env app1 --yes \
  --auth-type basic \
  --root-username admin \
  --root-password secret123
```

### Connect to an existing app

Using OAuth by default is fine. If opening a browser is inconvenient in some CI/CD scenarios, you can also directly save `basic` authentication; if you already have an API token, you can also directly save `token` authentication.

```bash
nb init --env staging --yes \
  --api-base-url https://demo.example.com/api

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type basic \
  --username <username> \
  --password <password>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type token \
  --access-token <token>

nb init --env staging --yes \
  --api-base-url https://demo.example.com/api \
  --auth-type oauth \
  --skip-auth
```

### Customize database naming

If you need to specify a PostgreSQL schema, table prefix, or underscore naming, you can pass parameters like this:

```bash
nb init --env app1 --yes \
  --db-dialect postgres \
  --db-schema public \
  --db-table-prefix nb_ \
  --db-underscored
```

### Continue the last interrupted initialization

```bash
nb init --env app1 --resume
```

### Show detailed logs when troubleshooting

```bash
nb init --env app1 --yes --source docker --version latest --verbose
```

## Related commands

- [`nb env add`](./env/add.md)
- [`nb env auth`](./env/auth.md)
- [`nb source download`](./source/download.md)
