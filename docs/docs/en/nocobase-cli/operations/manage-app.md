#Manage applications

If you have saved a NocoBase application as a CLI env, daily management is basically completed in the `nb app` group of commands: start, stop, restart, view logs and upgrade.

Most of the time, you don't need to remember all the parameters. First make it clear whether what you want to do is "run the application", "read the logs to troubleshoot problems", or "upgrade to a new version", and then select the corresponding command.

If you want to first understand why `nb app` is unified into this set of commands and its relationship with `nb app autostart`, first read [nb app design intent](../cli-design/nb-app-design-intent.md). This page only retains the most common daily operations.

## Quick index

| I want... | Which command to use |
| --- | --- |
| Start or resume application operation | [`nb app start`](../../api/cli/app/start.md) |
| Temporarily stop the application | [`nb app stop`](../../api/cli/app/stop.md) |
| Stop along with the CLI-managed built-in database | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Restart the application after modifying the configuration | [`nb app restart`](../../api/cli/app/restart.md) |
| View application logs in real time | [`nb app logs`](../../api/cli/app/logs.md) |
| Upgrade to a new source or image version | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip first confirm the current env

The `nb app` command acts on the current env by default. If you maintain multiple environments at the same time, it is recommended by default to confirm the target env before starting, stopping, logging, or upgrading operations.

If you explicitly pass in a different `--env`, the CLI will usually ask for confirmation. In scripts or non-interactive scenarios, you can add `--yes` to skip this step. Multi-environment switching, viewing and removal are introduced in [Multi-Environment Management](./multi-environment.md).

:::

## Start application

Pull up the application and use `nb app start` by default:

```bash
nb app start
```

If you want to operate on something other than the current env, you can specify it explicitly:

```bash
nb app start --env app1 --yes
```

Several other commonly used startup parameters:

- `nb app start` By default, the necessary installation or upgrade preparations will be automatically completed first, and then the service will be started.

Local npm/Git env will start the local application process, and Docker env will rebuild the application container according to the saved configuration. For detailed parameters, see [`nb app start`](../../api/cli/app/start.md).

## Stop and restart

If you just want to stop the application temporarily, use `nb app stop`:

```bash
nb app stop
```

If you have just changed the configuration, dependencies or code, it is usually easier to just use `nb app restart` directly:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` will be stopped first and then restarted in the same way as `start`. For detailed usage, see [`nb app stop`](../../api/cli/app/stop.md) and [`nb app restart`](../../api/cli/app/restart.md).

## View log

When troubleshooting problems, you usually look at the logs first:

```bash
nb app logs
```

If you just want to see more recent output, or don't want to continue following the log, you can use this:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

Local npm/Git env reads pm2 logs, and Docker env reads container logs. By default, `nb app logs` will continue to follow new log output. For detailed parameters, see [`nb app logs`](../../api/cli/app/logs.md).

## Upgrade application

The upgrade command is `nb app upgrade`:

```bash
nb app upgrade
```

This command does more than just "download the new version". The default process usually includes:

1. Stop the current application
2. Download and replace the saved source code or image
3. Synchronize commercial plug-ins
4. Upgrade and start the application
5. Refresh env runtime information

If you have updated the source code or image in advance and just want to continue the upgrade and start the application based on the current content, you can add `--skip-download`:

```bash
nb app upgrade --skip-download
```

If you want to explicitly specify the target version, you can also add `--version`:

```bash
nb app upgrade --version beta
```

:::warning note

`nb app upgrade` You will also usually be asked to confirm once before actually starting. In scripts, CI, or other non-interactive scenarios, `--force` needs to be passed in explicitly. If you also operate across envs at the same time, you usually need to bring `--yes` together.

```bash
nb app upgrade --env app1 --yes --force
```

:::

For a more complete parameter description, see [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Related links

- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [Multiple environment management](./multi-environment.md)
- [`nb app` Command Reference](../../api/cli/app/index.md)
