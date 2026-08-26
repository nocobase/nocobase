---
title: "nb proxy"
description: "nb proxy command-group reference: choose the Nginx or Caddy provider and manage reverse-proxy entrypoints for CLI-managed envs."
keywords: "nb proxy,NocoBase CLI,nginx,caddy,reverse proxy,proxy configuration"
---

# nb proxy

In NocoBase CLI, `nb proxy` is the unified entry point for reverse-proxy management.

It separates env management from entry-layer management:

- `nb env` saves and maintains application envs
- `nb proxy` generates and manages Nginx or Caddy entrypoints for those CLI-managed envs

As long as your app has already been saved as a CLI-managed env and that env is `local` or `docker`, choosing a provider subcommand is usually enough.

## Usage

```bash
nb proxy <provider> <command>
```

## Command tree

```bash
nb proxy nginx use <local|docker>
nb proxy nginx current
nb proxy nginx generate --env <name> [--host <domain>] [--port <port>]
nb proxy nginx start
nb proxy nginx restart
nb proxy nginx reload
nb proxy nginx stop
nb proxy nginx status
nb proxy nginx info

nb proxy caddy use <local|docker>
nb proxy caddy current
nb proxy caddy generate --env <name> [--host <domain>] [--port <port>]
nb proxy caddy start
nb proxy caddy restart
nb proxy caddy reload
nb proxy caddy stop
nb proxy caddy status
nb proxy caddy info
```

## Providers

| I want to... | Go here |
| --- | --- |
| Keep using Nginx for sites, certificates, caching, or access control | [`nb proxy nginx`](./nginx/index.md) |
| Get HTTPS running quickly while maintaining fewer TLS details yourself | [`nb proxy caddy`](./caddy/index.md) |
| Adjust env settings that may affect proxy output, such as `app-port` or `app-public-path` | [`nb env update`](../env/update.md) |

## Notes

- `nb proxy` itself does not have standalone flags
- Use `nb proxy nginx` or `nb proxy caddy` to generate and manage entrypoints
- Both providers only work for managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- Both providers support two drivers: `local` and `docker`
- `use` saves the default driver, and `current` prints the current driver directly
- `generate` writes or refreshes entry config files and does not automatically start the proxy process
- `start`, `restart`, `reload`, `stop`, `status`, and `info` all operate on the current driver's runtime
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun the matching `generate` command afterward
- This command group does not currently work for envs that only have a remote API connection or for SSH envs

## Typical workflow

```bash
# 1. Choose a provider and runtime driver
nb proxy nginx use docker

# 2. Generate the entry config for one CLI-managed env
nb proxy nginx generate --env app1 --host app1.example.com

# 3. Start the proxy
nb proxy nginx start

# 4. Inspect status and path information
nb proxy nginx status
nb proxy nginx info

# 5. Reload after config changes
nb proxy nginx reload
```

If you choose Caddy, replace `nginx` in the commands above with `caddy`.

## Common command differences

| Command | Purpose |
| --- | --- |
| `use` | Switch the default driver for the current provider |
| `current` | Print the current provider driver, such as `local` or `docker` |
| `generate` | Generate or refresh proxy entry files for one env |
| `start` | Start the proxy with the current driver |
| `reload` | Reload configuration without stopping the service |
| `restart` | Stop and then start again |
| `stop` | Stop the proxy |
| `status` | Show runtime status |
| `info` | Show the driver, config-file path, runtime root, upstream host, and related runtime details |

## Examples

```bash
# Generate and start Nginx for one env
nb proxy nginx use docker
nb proxy nginx generate --env demo --host demo.local.nocobase.com
nb proxy nginx start

# Generate and start Caddy for one env
nb proxy caddy use local
nb proxy caddy generate --env demo --host demo.local.nocobase.com
nb proxy caddy start
```

## Related commands

- [`nb proxy nginx`](./nginx/index.md)
- [`nb proxy caddy`](./caddy/index.md)
- [`nb env update`](../env/update.md)
- [`nb env info`](../env/info.md)
- [`nb config`](../config/index.md)
