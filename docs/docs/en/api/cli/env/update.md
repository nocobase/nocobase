---
title: 'nb env update'
description: 'nb env update command reference: update the saved API, authentication, source code, application, and database configuration.'
keywords: 'nb env update,NocoBase CLI,env configuration,authentication,database,source code'
---

# nb env update

`nb env update` is used to update the configuration of a saved env. You can use it to adjust the API address, authentication method, source code origin, local app path, port, database parameters, and more. After the update is complete, the CLI will automatically handle the necessary follow-up steps based on the changes.

If you do not provide any configuration parameters, the CLI will also perform a re-sync based on the current env state.

## Usage

```bash
nb env update [name] [flags]
```

## Common options

| Option      | Type    | Description                                                                            |
| ----------- | ------- | -------------------------------------------------------------------------------------- |
| `[name]`    | string  | The name of the configured environment to update; if omitted, the current env is used. |
| `--verbose` | boolean | Show detailed progress.                                                                |

## API and authentication options

| Option                            | Type   | Description                                                                                                                                                           |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--api-base-url`, `-u`            | string | NocoBase API address, including the `/api` prefix.                                                                                                                    |
| `--auth-type`                     | string | Authentication method: `basic`, `token`, `oauth`.                                                                                                                     |
| `--access-token`, `--token`, `-t` | string | API key or access token used for `token` authentication. After saving, the authentication method will be switched to `token`.                                         |
| `--username`                      | string | Username saved for `basic` authentication. Can only be used when the current env uses `basic` authentication, or when `--auth-type basic` is passed at the same time. |

## Source code and download options

| Option                                         | Type    | Description                                                           |
| ---------------------------------------------- | ------- | --------------------------------------------------------------------- |
| `--source`                                     | string  | Saved application source: `docker`, `git`, `local`, `npm`.            |
| `--download-version`, `--version`              | string  | Saved version parameter: Docker tag, npm package version, or Git ref. |
| `--docker-registry`                            | string  | Docker image registry name, without the tag.                          |
| `--docker-platform`                            | string  | Docker image platform: `auto`, `linux/amd64`, `linux/arm64`.          |
| `--git-url`                                    | string  | Git repository URL.                                                   |
| `--npm-registry`                               | string  | Registry used for npm/Git downloads and dependency installation.      |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Whether to install devDependencies when installing from npm/Git.      |
| `--build` / `--no-build`                       | boolean | Whether to build automatically after downloading from npm/Git.        |
| `--build-dts` / `--no-build-dts`               | boolean | Whether to generate TypeScript declaration files during build.        |

## Application options

| Option       | Type   | Description                                                                                          |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| `--app-path` | string | Application directory. This is now the recommended option for managing local directories by default. |
| `--app-public-path` | string | Public application path (`APP_PUBLIC_PATH`), such as `/` or `/nocobase/`. |
| `--app-port` | string | Application HTTP port.                                                                               |
| `--cdn-base-url` | string | Client asset CDN base URL (`CDN_BASE_URL`). |
| `--app-key`  | string | Application secret key (`APP_KEY`).                                                                  |
| `--timezone` | string | Application time zone (`TZ`).                                                                        |

## Database options

| Option                                     | Type    | Description                                                |
| ------------------------------------------ | ------- | ---------------------------------------------------------- |
| `--builtin-db` / `--no-builtin-db`         | boolean | Whether to use the built-in database managed by the CLI.   |
| `--db-dialect`                             | string  | Database type: `postgres`, `mysql`, `mariadb`, `kingbase`. |
| `--builtin-db-image`                       | string  | Built-in database container image.                         |
| `--db-host`                                | string  | Database host address.                                     |
| `--db-port`                                | string  | Database port.                                             |
| `--db-database`                            | string  | Database name.                                             |
| `--db-user`                                | string  | Database username.                                         |
| `--db-password`                            | string  | Database password.                                         |
| `--db-schema`                              | string  | Database schema. Usually only used by PostgreSQL.          |
| `--db-table-prefix`                        | string  | Table prefix.                                              |
| `--db-underscored` / `--no-db-underscored` | boolean | Whether table names and field names use underscore style.  |

## Configuration cleanup options

| Option    | Type     | Description                                                                                                                                                                    |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--unset` | string[] | Clear one or more saved fields by the canonical flag name. Repeated usage is supported, and comma-separated values are also supported, for example `--unset git-url,username`. |

## Notes

:::tip

If you only want the CLI to re-sync according to the latest state of the current env, just run `nb env update` or `nb env update <name>`. No extra parameters are needed.

:::

- After the update is complete, the CLI will automatically handle any required follow-up synchronization based on the changes made this time
- Other options only update the saved env configuration; they do not automatically restart the application or automatically replace local source code or Docker images
- After modifying settings such as `app-path`, `app-port`, `timezone`, or `db-*`, the CLI will usually prompt you to run `nb app restart --env <name>` afterward; if the change involves the built-in database managed by the CLI, it will prompt you to use `nb app restart --env <name> --with-db`
- After modifying settings such as `app-port`, `app-public-path`, or `cdn-base-url` that affect reverse-proxy rendering, rerun `nb env proxy nginx` or `nb env proxy caddy` if you already use a generated proxy config
- When updating source settings such as `source`, `download-version`, `docker-registry`, `git-url`, or `npm-registry`, only the saved values are changed. Existing local source code, dependencies, and images are not automatically replaced
- `--access-token` cannot be used together with `--auth-type basic` or `--auth-type oauth`
- The same field cannot be used with both `--unset` and an explicit value at the same time. For example, you cannot write both `--unset git-url` and `--git-url ...`
- If you switch the authentication method to `basic` or `oauth`, or clear the token, you will usually need to run `nb env auth <name>` afterward

## Examples

```bash
# Re-sync the current env according to the latest state
nb env update

# Re-sync the specified env according to the latest state
nb env update prod

# Update the API address
nb env update prod --api-base-url http://localhost:13000/api

# Update the token and switch the authentication method to token
nb env update prod --access-token <token>

# Switch to basic authentication, save only the username, and run nb env auth later
nb env update prod --auth-type basic --username admin

# Adjust the source origin and version, only updating the saved configuration
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Adjust the application port and time zone, then restart the application later
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Adjust the public application path. After that, you usually also need to regenerate the proxy config
nb env update local --app-public-path /nocobase/

# Save a CDN base URL for versioned client assets
nb env update local --cdn-base-url https://cdn.example.com/nocobase/

# Clear saved fields
nb env update local --unset git-url --unset username
nb env update local --unset git-url,username
```

## Related commands

- [`nb api`](../api/index.md)
- [`nb env auth`](./auth.md)
- [`nb env info`](./info.md)
- [`nb env add`](./add.md)
- [`nb app restart`](../app/restart.md)
- [`nb source download`](../source/download.md)
