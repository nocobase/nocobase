---
title: 'nb env proxy'
description: 'nb env proxy command reference: generate an Nginx or Caddy proxy config for one managed CLI env.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,proxy configuration'
---

# nb env proxy

In NocoBase CLI, `nb env proxy` generates a reverse-proxy config for one CLI-managed env. Use `nginx` by default. Switch to `caddy` only if you already use Caddy or specifically need a Caddyfile.

This command works only for managed envs whose runtime is reachable from the current machine, which means `local` or `docker`. It does not currently support envs that only have a remote API connection or SSH envs.

## Usage

```bash
nb env proxy [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Name of the configured env to generate a proxy config for. Uses the current env when omitted |
| `--output`, `-o` | string | Output file path. Defaults to `~/.nocobase/proxy/<provider>/<env>/generated.<ext>` |
| `--provider` | string | Proxy provider: `nginx` or `caddy` |
| `--host` | string | Host written into the entry config, such as `example.com` or `localhost` |
| `--port` | string | Port written into the entry config. This is the proxy entry port, not the upstream NocoBase app port |
| `--install` | boolean | Install the shared proxy config into the provider main config |
| `--reload` | boolean | Validate and reload the provider after writing the config |
| `--print` | boolean | Print the generated config to stdout instead of writing files |

## Default output files

If you do not pass `--output`, the CLI maintains three kinds of files under `~/.nocobase/proxy/<provider>/`:

| Provider | Generated file | Editable entry file | Shared main config |
| --- | --- | --- | --- |
| `nginx` | `~/.nocobase/proxy/nginx/<env>/generated.conf` | `~/.nocobase/proxy/nginx/<env>/app.conf` | `~/.nocobase/proxy/nginx/nocobase.conf` |
| `caddy` | `~/.nocobase/proxy/caddy/<env>/generated.caddy` | `~/.nocobase/proxy/caddy/<env>/app.caddy` | `~/.nocobase/proxy/caddy/nocobase.caddy` |

Where:

- `generated.*` is managed by the CLI and will be overwritten the next time you run `nb env proxy`
- `app.conf` / `app.caddy` is the editable entry file, but you should keep the generated-config reference managed by the CLI
- `nocobase.conf` / `nocobase.caddy` is the shared main config that includes all env entry files

If you pass `--output`, the CLI writes only the generated config to that file and does not create or update the entry file or shared main config.

## Related configuration items

| Configuration item | Default value | Description |
| --- | --- | --- |
| `proxy.provider` | `nginx` | Default provider used by `nb env proxy` |
| `proxy.nb-cli-root` | CLI root, usually the current user's home directory | Maps the `.nocobase` path to the root path visible to the proxy process |
| `proxy.upstream-host` | `127.0.0.1` | Host used when the proxy forwards traffic back to the NocoBase app |
| `bin.caddy` | `caddy` | Path to the Caddy executable used by `--install` or `--reload` |
| `bin.nginx` | `nginx` | Path to the Nginx executable used by `--install` or `--reload` |

Most setups do not need to change `proxy.nb-cli-root`. You usually need it only when Nginx or Caddy runs in another container, mount root, or path view.

## Notes

- `--port` must be an integer between `1` and `65535`
- The upstream NocoBase app port comes from the saved env `appPort`, not from `--port`
- If the command says the env is missing `appPort`, run `nb env update <name>` first, or explicitly save it with `nb env update <name> --app-port <port>`
- `--print` cannot be combined with `--install` or `--reload`
- `--output` cannot be combined with `--install` or `--reload`
- `--install` connects the shared config to the provider main config. `--reload` validates and reloads the provider. In practice, these two flags are usually used together

## Examples

```bash
# Generate the default nginx config for the current env
nb env proxy

# Generate a config for a specific env
nb env proxy demo

# Print the generated config without writing files
nb env proxy demo --print

# Write a host and port into the entry config
nb env proxy demo --host demo.local.nocobase.com --port 8080

# Generate a Caddy config
nb env proxy demo --provider caddy --host demo.local.nocobase.com

# Change the default provider and upstream host
nb config set proxy.provider caddy
nb config set proxy.upstream-host host.docker.internal

# Map the .nocobase path when the provider runs under another root path
nb config set proxy.nb-cli-root /workspace

# Install the shared config into the provider main config and reload it
nb env proxy demo --install --reload
```

## Related commands

- [`nb env update`](./update.md)
- [`nb env info`](./info.md)
- [`nb config`](../config/index.md)
- [`nb app start`](../app/start.md)
