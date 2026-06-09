---
title: 'nb env'
description: 'nb env command reference: manage NocoBase CLI envs, including adding, viewing the current env, checking status, switching, updating, generating proxy configs, authenticating, and removing.'
keywords: 'nb env,NocoBase CLI,environment management,env,current env,proxy,authentication,OpenAPI'
---

# nb env

Manage saved NocoBase CLI envs. An env stores connection and local runtime information such as the API address, authentication info, local app path, and database configuration.

Starting from this version, the CLI separates two concepts:

- `current env`: the env currently used by the current shell or agent runtime, isolated by `NB_SESSION_ID` when possible
- `last env`: the last env used globally, used as a fallback when session mode is not enabled

## Usage

```bash
nb env <command>
```

## Subcommands

| Command                          | Description                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| [`nb env add`](./add.md)         | Save a NocoBase API endpoint and switch to this env                                |
| [`nb env current`](./current.md) | View the currently effective env                                                   |
| [`nb env update`](./update.md)   | Update a saved env configuration and automatically handle follow-up sync as needed |
| [`nb env list`](./list.md)       | List configured envs                                                               |
| [`nb env status`](./status.md)   | View the status of the current env, a specified env, or all envs                   |
| [`nb env info`](./info.md)       | View detailed information for a single env                                         |
| [`nb env proxy`](./proxy/index.md) | Show proxy provider subcommands and generate Nginx or Caddy configs for one managed env |
| [`nb env remove`](./remove.md)   | Remove the env configuration after stopping the managed runtime                    |
| [`nb env auth`](./auth.md)       | Perform OAuth login for a saved env                                                |
| [`nb env use`](./use.md)         | Switch the current env                                                             |

## Examples

```bash
nb env add app1 --api-base-url http://localhost:13000/api
nb env current
nb env list
nb env status
nb env info app1
nb env proxy nginx --env app1
nb env update app1
nb env use app1
nb env auth app1
```

## session mode

Session mode is recommended by default. This allows the `current env` in different terminals, different shells, or different agent runtimes to stay isolated from each other without affecting one another in parallel.

If session mode is not enabled, `nb env use` updates the global `last env`, and other sessions without session isolation will also be affected.

See [`nb session setup`](../session/setup.md) for how to enable it.

## Related commands

- [`nb init`](../init.md)
- [`nb api`](../api/index.md)
- [`nb app`](../app/index.md)
- [`nb session`](../session/index.md)
