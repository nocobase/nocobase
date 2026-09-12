---
title: "nb proxy caddy"
description: "nb proxy caddy command-group reference: manage the Caddy provider driver, config generation, and runtime control."
keywords: "nb proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration"
---

# nb proxy caddy

`nb proxy caddy` is the command-group entry for the Caddy provider.

If you already have a domain, want to get HTTPS running quickly, and do not want to maintain too many TLS details yourself, this is usually the place to start. It handles two things:

- choosing how Caddy runs, which means `local` or `docker`
- generating, starting, reloading, and inspecting the Caddy entrypoint for CLI-managed envs

## Usage

```bash
nb proxy caddy <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb proxy caddy use`](./use.md) | Switch the Caddy driver |
| [`nb proxy caddy current`](./current.md) | Print the current driver |
| [`nb proxy caddy generate`](./generate.md) | Generate or refresh the Caddy config for one env |
| [`nb proxy caddy start`](./start.md) | Start the Caddy proxy |
| [`nb proxy caddy restart`](./restart.md) | Restart the Caddy proxy |
| [`nb proxy caddy reload`](./reload.md) | Reload the Caddy config |
| [`nb proxy caddy stop`](./stop.md) | Stop the Caddy proxy |
| [`nb proxy caddy status`](./status.md) | Show Caddy runtime status |
| [`nb proxy caddy info`](./info.md) | Show driver, config paths, and runtime info |

## Notes

- The current driver is stored in `proxy.caddy-driver`
- The default driver is `local`
- The local driver uses the executable pointed to by `bin.caddy`, whose default value is `caddy`
- The Docker driver uses `caddy:latest`
- The default Docker container name is `<docker.container-prefix>-caddy-proxy`
- The Docker driver mounts host `NB_CLI_ROOT` into the container at `/apps`

## Typical workflow

```bash
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app1.example.com
nb proxy caddy start
nb proxy caddy status
nb proxy caddy info
```

## Related commands

- [`nb proxy`](../index.md)
- [`nb proxy nginx`](../nginx/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
