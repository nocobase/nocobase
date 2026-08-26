---
title: "nb env update"
description: "nb env update command reference: update the saved API, authentication, source code, application, and database configuration."
keywords: "nb env update,NocoBase CLI,env configuration,authentication,database,source code"
---

# nb env update

`nb env update` updates the configuration of a saved env. You can use it to adjust the API address, authentication method, source origin, local app path, public path, port, database parameters, and more. After the update finishes, the CLI automatically handles any required follow-up steps according to the changes.

If you do not pass any configuration parameters, the CLI still performs a re-sync based on the current env state.

## Usage

```bash
nb env update [name] [flags]
```

## Common options

| Option | Type | Description |
| --- | --- | --- |
| `[name]` | string | The configured env name to update; if omitted, the current env is used |
| `--verbose` | boolean | Show detailed progress |

## API and authentication options

| Option | Type | Description |
| --- | --- | --- |
| `--api-base-url`, `-u` | string | NocoBase API URL, including the `/api` prefix |
| `--auth-type` | string | Authentication method: `basic`, `token`, or `oauth` |
| `--access-token`, `--token`, `-t` | string | API key or access token used with `token` authentication. Saving it also switches the auth type to `token` |
| `--username` | string | Username saved for `basic` authentication. Use it only when the current env already uses `basic`, or together with `--auth-type basic` |

## Source and download options

| Option | Type | Description |
| --- | --- | --- |
| `--source` | string | Saved app source: `docker`, `git`, `local`, or `npm` |
| `--download-version`, `--version` | string | Saved version selector: Docker tag, npm package version, or Git ref |
| `--docker-registry` | string | Docker image registry name, without the tag |
| `--docker-platform` | string | Docker image platform: `auto`, `linux/amd64`, or `linux/arm64` |
| `--git-url` | string | Git repository URL |
| `--npm-registry` | string | Registry used for npm or Git downloads and dependency installation |
| `--dev-dependencies` / `--no-dev-dependencies` | boolean | Whether to install `devDependencies` for npm or Git sources |
| `--build` / `--no-build` | boolean | Whether to build automatically after an npm or Git download |
| `--build-dts` / `--no-build-dts` | boolean | Whether to generate TypeScript declaration files during the build |

## Application options

| Option | Type | Description |
| --- | --- | --- |
| `--app-path` | string | Application directory. This is now the preferred way to manage the local app path |
| `--app-public-path` | string | Public application path (`APP_PUBLIC_PATH`), such as `/` or `/nocobase/` |
| `--app-port` | string | Application HTTP port |
| `--cdn-base-url` | string | CDN base URL for client-side static assets (`CDN_BASE_URL`) |
| `--app-key` | string | Application key (`APP_KEY`) |
| `--timezone` | string | Application timezone (`TZ`) |

## Database options

| Option | Type | Description |
| --- | --- | --- |
| `--builtin-db` / `--no-builtin-db` | boolean | Whether to use the built-in database managed by the CLI |
| `--db-dialect` | string | Database type: `postgres`, `mysql`, `mariadb`, or `kingbase` |
| `--builtin-db-image` | string | Container image used for the built-in database |
| `--db-host` | string | Database host |
| `--db-port` | string | Database port |
| `--db-database` | string | Database name |
| `--db-user` | string | Database username |
| `--db-password` | string | Database password |
| `--db-schema` | string | Database schema. This is usually used only by PostgreSQL |
| `--db-table-prefix` | string | Table prefix |
| `--db-underscored` / `--no-db-underscored` | boolean | Whether table names and field names use underscore naming |

## Configuration cleanup

| Option | Type | Description |
| --- | --- | --- |
| `--unset` | string[] | Clear one or more saved fields by flag name. You can repeat the option or pass a comma-separated list, such as `--unset git-url,username` |

## Notes

:::tip

If you only want the CLI to re-sync based on the latest state of the current env, simply run `nb env update` or `nb env update <name>` without extra options.

:::

- After the update is complete, the CLI automatically handles any required follow-up synchronization based on the changes made this time
- Other options only update the saved env configuration; they do not automatically restart the application or replace local source code or Docker images
- After modifying settings such as `app-path`, `app-port`, `timezone`, or `db-*`, the CLI usually prompts you to run `nb app restart --env <name>`; if the change involves the built-in database managed by the CLI, it will prompt you to use `nb app restart --env <name> --with-db`
- After modifying settings such as `app-port`, `app-public-path`, or `cdn-base-url` that affect reverse-proxy output, rerun `nb proxy nginx generate` or `nb proxy caddy generate` if you already use a generated proxy config
- When updating source settings such as `source`, `download-version`, `docker-registry`, `git-url`, or `npm-registry`, only the saved values are changed. Existing local source code, dependencies, and images are not automatically replaced
- `--access-token` cannot be used together with `--auth-type basic` or `--auth-type oauth`
- The same field cannot be used with both `--unset` and an explicit value at the same time. For example, do not use `--unset git-url` together with `--git-url ...`
- If you switch the authentication method to `basic` or `oauth`, or clear the token, you usually need to run `nb env auth <name>` afterward

## Examples

```bash
# Re-sync the current env based on its latest saved state
nb env update

# Re-sync a specific env
nb env update prod

# Update the API URL
nb env update prod --api-base-url http://localhost:13000/api

# Update the token and switch auth type to token
nb env update prod --access-token <token>

# Switch to basic auth, save the username, and run nb env auth later
nb env update prod --auth-type basic --username admin

# Update the saved source and version without replacing local code yet
nb env update local --source git --git-url git@github.com:nocobase/nocobase.git --download-version next

# Adjust the app port and timezone, then restart later
nb env update local --app-port 13080 --timezone Asia/Shanghai

# Adjust the public path and regenerate the proxy afterward if needed
nb env update local --app-public-path /nocobase/

# Save the CDN base URL for client assets
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
