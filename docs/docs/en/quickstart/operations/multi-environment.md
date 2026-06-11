#Multiple environment management

If you maintain multiple NocoBase applications such as `dev`, `test`, `staging`, `prod`, etc., you can save them as CLI env respectively. Most of the future `nb` commands will act on the current env by default, so it is important to confirm which env you are using before executing commands such as `nb app`, `nb api`, and `nb db`.

Starting from this version, the CLI splits the concept into `current env` and `last env`. You usually only need to care about `current env` - which is the environment the current shell or agent runtime is using. The CLI will fall back to global `last env` only when session mode is not enabled.

## Quick index

| I want... | Which command to use |
| --- | --- |
| Create a new local env and complete the initialization smoothly | [`nb init`](../../api/cli/init.md) |
| Register an existing application as CLI env | [`nb env add`](../../api/cli/env/add.md) |
| See which envs are saved locally | [`nb env list`](../../api/cli/env/list.md) |
| Check connectivity and authentication status of all envs | [`nb env status --all`](../../api/cli/env/status.md) |
| Switch the env to be used by subsequent commands | [`nb env use`](../../api/cli/env/use.md) |
| Confirm which env the current command will fall into | [`nb env current`](../../api/cli/env/current.md) and [`nb env status`](../../api/cli/env/status.md) |
| View detailed configurations saved by an env | [`nb env info`](../../api/cli/env/info.md) |
| Update the saved env configuration, letting the CLI resynchronize the current state if necessary | [`nb env update`](../../api/cli/env/update.md) |
| Re-authenticate after the login state expires, or use a new authentication method | [`nb env auth`](../../api/cli/env/auth.md) |
| Delete unused env configurations and clean up local hosted resources if necessary | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip It is recommended to enable session mode first

By default, it is recommended to execute [`nb session setup`](../../api/cli/session/setup.md) first. In this way, different terminals, different shells, or different agent runtimes can each maintain their own `current env`, and they will not easily affect each other during parallel operations.

If session mode is not enabled, `nb env use` will fall back to updating global `last env`. In this case, if one terminal cuts off the environment, the other terminal may also be affected.

```bash
nb session setup
```

:::

## Create multiple environments

If you want to create or restore a local application, just use `nb init`. It will complete the initialization and save the results into a new CLI env.

```bash
nb init --env dev
nb init --env test
```

If the application already exists and you just want to connect it to the CLI, it is usually more straightforward to use `nb env add`:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

The former is more about "initializing an environment", while the latter is more about "registering an existing environment". If you are just connecting to an existing application, just use `nb env add` by default.

## View the configured environment

First use `nb env list` to see which envs have been saved locally:

```bash
nb env list
```

This command only displays the configuration itself and does not actively check the application status. When you want to see both connectivity and authentication status, use `nb env status --all`:

```bash
nb env status --all
```

You'll usually see status values ​​like `ok`, `auth failed`, `unreachable`.

## Switch the current environment

Use `nb env use` to switch environments:

```bash
nb env use dev
```

After the switch is completed, subsequent commands that omit `--env` will use this env by default.

## Check the current environment

If you are not sure which environment the current command will fall into, execute these two commands first:

```bash
nb env current
nb env status
```

`nb env current` is used to see the name, `nb env status` is used to see whether the current env is accessible and the authentication is normal.

## View details of a single env

If you want to see what configurations are saved in a certain env, use `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Among them, `--field` is suitable for taking only one value in the script. `--show-secrets` will display sensitive information such as tokens and passwords in plain text. Use them only when you clearly need to troubleshoot.

## Update env configuration

`nb env update` is used to adjust the configuration of a saved env. Such as API address, authentication method, source code source, application port and database parameters. Once the update is complete, the CLI automatically handles follow-up steps based on the changes.

If you just want the CLI to resynchronize according to the latest state of the current env, just write like this:

```bash
nb env update
nb env update prod
```

If you want to modify the connection information or local configuration saved by this env, you can explicitly bring the parameters:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Here you can first remember a default judgment:

- To modify the connection information or local configuration saved by env, use `nb env update`
- The application interface, plug-in or CLI available capabilities have just changed, you can also execute `nb env update` again
- The login status has expired, or you need to go through the authentication process again, use `nb env auth`
- Just to see what is currently saved, use `nb env info`

If you change local running configurations such as `app-port`, `timezone`, and `db-*`, `update` will only change the saved value and will not automatically restart the application. Generally speaking, `nb app restart --env <name>` will be executed later; if the change involves the CLI-managed built-in database, use `nb app restart --env <name> --with-db`.

## Reauthentication

If env has been saved, but the login state has expired, or you want to switch the authentication method, you can re-authenticate:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

When the environment name is omitted, the CLI uses the current env. Once authentication is complete, the CLI automatically handles subsequent synchronization.

## Remove environment

These scenarios are the most confusing. You can first remember a default suggestion:

- If you just want to stop the application, use `nb app stop`
- I also want to stop the built-in database runtime on the current machine, use `nb app stop --with-db`
- If you are sure that this env is no longer needed, but you want to keep the storage and local app files first, use `nb env remove`
- Clean up even the local hosting resources and use `nb env remove --purge`

If you only want to remove the saved env configuration:

```bash
nb env remove staging
```

If it is a local or Docker-hosted env, and you also want to clean up the running resources and storage data on the local machine, you can add `--purge`:

```bash
nb env remove test --purge
```

In non-interactive mode, `nb env remove` needs to be passed in `--force` explicitly:

```bash
nb env remove test --purge --force
```

`--purge` will only clean up CLI-managed resources on the current machine. For remote API env, it will not delete the remote service itself.

If you just want to stop the application and the CLI-managed built-in database, just write:

```bash
nb app stop --env app1 --with-db
```

If you want to remove this env but still want to keep the storage and local app files:

```bash
nb env remove app1 --force
```

If you really want to clean up the natively hosted content of this env, add `--purge`:

```bash
nb env remove app1 --purge --force
```

For local npm/Git env managed by CLI downloads, `--purge` also deletes CLI-hosted local app files. For HTTP or SSH env, it will only delete the env configuration saved in the CLI and will not delete the external service itself.

## Related links

- [`nb env` Command Reference](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Command Reference](../../api/cli/session/index.md)
- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [Manage App](./manage-app.md)
