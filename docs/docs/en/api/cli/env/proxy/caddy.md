---
title: 'nb env proxy caddy'
description: 'nb env proxy caddy command reference: generate a Caddy proxy config for one CLI-managed env.'
keywords: 'nb env proxy caddy,NocoBase CLI,caddy,reverse proxy,proxy configuration'
---

# nb env proxy caddy

`nb env proxy caddy` generates a Caddy proxy config for one CLI-managed env. It fits these cases well: you already have a domain, want HTTPS running quickly, and do not want to maintain too many TLS details yourself.

This command only works for managed envs whose runtime is reachable from the current machine, which means `local` or `docker`. It does not currently work for envs that only have a remote API connection or for SSH envs.

## Usage

```bash
nb env proxy caddy [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Name of the configured env to generate a proxy config for. Uses the current env when omitted |
| `--env`, `-e` | string | Explicitly specify the env name. This form is usually recommended |
| `--output`, `-o` | string | Output file path. Only writes the generated route config and does not additionally create `app.caddy` or the shared main config |
| `--host` | string | Host written into the entry config, such as `example.com` or `localhost` |
| `--port` | string | Port written into the entry config. This is the proxy entry port, not the upstream NocoBase app port |
| `--install` | boolean | Install the shared proxy config into the Caddy main config |
| `--reload` | boolean | Validate and reload Caddy after writing files |
| `--print` | boolean | Print the generated route config directly instead of writing files |

## Default output

If you do not pass `--output`, the CLI maintains these files under `~/.nocobase/proxy/caddy/`:

| File | Purpose |
| --- | --- |
| `~/.nocobase/proxy/caddy/<env>/generated.caddy` | Actual reverse-proxy config managed by the CLI and overwritten on every run |
| `~/.nocobase/proxy/caddy/<env>/app.caddy` | Editable site entry file where you can add site-level config |
| `~/.nocobase/proxy/caddy/nocobase.caddy` | Shared main config that imports every env `app.caddy` |

Where:

- `generated.caddy` is only meant to be managed by the CLI and should not be edited manually
- `app.caddy` is editable, but you should keep the managed import inserted by the CLI
- `nocobase.caddy` is mainly used by `--install`

:::warning Note

If you need to add site-level Caddy config, edit `app.caddy`. `generated.caddy` will be overwritten the next time you run `nb env proxy caddy`.

:::

If you pass `--output`, the CLI only writes the generated config to that file and does not additionally create or update `app.caddy` or the shared main config.

## Related configuration items

These CLI configuration items directly affect the generated Caddy output:

| Configuration item | Default value | Description |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root, usually the current user's home directory | Map the `.nocobase` path to the root path that Caddy actually sees |
| `proxy.upstream-host` | `127.0.0.1` | Host used when the proxy forwards traffic back to the NocoBase app |
| `bin.caddy` | `caddy` | Path to the Caddy executable used by `--install` or `--reload` |

Most setups do not need to change `proxy.nb-cli-root`. You usually need it only when Caddy runs in another container, mount root, or path view.

## Notes

- `--host` is important. Caddy decides whether to manage HTTPS based on the site address. In production, try to pass a domain that already resolves to the current server
- `--port` must be an integer between `1` and `65535`
- The upstream NocoBase app port comes from the saved env `appPort`, not from `--port`
- If the command says the env is missing `appPort`, run `nb env update <name>` first, or explicitly save it with `nb env update <name> --app-port <port>`
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun `nb env proxy caddy` afterward
- `--print` cannot be combined with `--install` or `--reload`
- `--output` cannot be combined with `--install` or `--reload`

## Examples

```bash
# Generate a Caddy config for the current env
nb env proxy caddy

# Generate a config for one env
nb env proxy caddy --env demo

# Write the public host and port into the entry config
nb env proxy caddy --env demo --host demo.local.nocobase.com --port 8080

# Print the generated route config without writing files
nb env proxy caddy --env demo --print

# Write the generated route fragment to a custom file
nb env proxy caddy --env demo --output ./generated.caddy

# Map the .nocobase path when Caddy runs under another mount root
nb config set proxy.nb-cli-root /workspace

# Install the shared config into the Caddy main config and reload immediately
nb env proxy caddy --env demo --install --reload
```

## Related commands

- [`nb env proxy`](./index.md)
- [`nb env proxy nginx`](./nginx.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
