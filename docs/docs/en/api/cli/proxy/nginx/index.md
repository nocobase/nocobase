---
title: "nb proxy nginx"
description: "nb proxy nginx command-group reference: manage the Nginx provider driver, config generation, and runtime control."
keywords: "nb proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration"
---

# nb proxy nginx

`nb proxy nginx` is the command-group entry for the Nginx provider.

If you already use Nginx to manage sites, certificates, caching, or access control, this is usually the place to start. It handles two things:

- choosing how Nginx runs, which means `local` or `docker`
- generating, starting, reloading, and inspecting the Nginx entrypoint for CLI-managed envs

## Usage

```bash
nb proxy nginx <command>
```

## Subcommands

| Command | Description |
| --- | --- |
| [`nb proxy nginx use`](./use.md) | Switch the Nginx driver |
| [`nb proxy nginx current`](./current.md) | Print the current driver |
| [`nb proxy nginx generate`](./generate.md) | Generate or refresh the Nginx config for one env |
| [`nb proxy nginx start`](./start.md) | Start the Nginx proxy |
| [`nb proxy nginx restart`](./restart.md) | Restart the Nginx proxy |
| [`nb proxy nginx reload`](./reload.md) | Reload the Nginx config |
| [`nb proxy nginx stop`](./stop.md) | Stop the Nginx proxy |
| [`nb proxy nginx status`](./status.md) | Show Nginx runtime status |
| [`nb proxy nginx info`](./info.md) | Show driver, config paths, and runtime info |

## Notes

- The current driver is stored in `proxy.nginx-driver`
- The default driver is `local`
- The local driver uses the executable pointed to by `bin.nginx`, whose default value is `nginx`
- The Docker driver uses `nginx:latest`
- The default Docker container name is `<docker.container-prefix>-nginx-proxy`
- The Docker driver mounts host `NB_CLI_ROOT` into the container at `/apps`

## Typical workflow

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app1.example.com
nb proxy nginx start
nb proxy nginx status
nb proxy nginx info
```

## Related commands

- [`nb proxy`](../index.md)
- [`nb proxy caddy`](../caddy/index.md)
- [`nb env update`](../../env/update.md)
- [`nb config`](../../config/index.md)
