---
title: 'nb env proxy nginx'
description: 'nb env proxy nginx command reference: generate Nginx proxy config files and helper files for one CLI-managed env.'
keywords: 'nb env proxy nginx,NocoBase CLI,nginx,reverse proxy,proxy configuration'
---

# nb env proxy nginx

`nb env proxy nginx` generates Nginx proxy config files and helper files for one CLI-managed env. It fits these cases well: you already use Nginx to manage sites, or you still want to manage certificates, caching, or access control yourself.

This command only works for managed envs whose runtime is reachable from the current machine, which means `local` or `docker`. It does not currently work for envs that only have a remote API connection or for SSH envs.

## Usage

```bash
nb env proxy nginx [name] [flags]
```

## Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `[name]` | string | Name of the configured env to generate a proxy config for. Uses the current env when omitted |
| `--env`, `-e` | string | Explicitly specify the env name. This form is usually recommended |
| `--host` | string | Host written into the entry config, such as `example.com` or `localhost` |
| `--port` | string | Port written into the entry config. This is the proxy entry port, not the upstream NocoBase app port |
| `--install` | boolean | Install the shared proxy config into the Nginx main config |
| `--reload` | boolean | Validate and reload Nginx after writing files |
| `--print` | boolean | Print the rendered `app.conf` directly instead of writing files |

## Default output

`nb env proxy nginx` maintains these files under `~/.nocobase/proxy/nginx/`:

| File | Purpose |
| --- | --- |
| `~/.nocobase/proxy/nginx/<env>/app.conf` | Editable site entry file. The CLI refreshes the managed block inside it, and you can add site-level config around that block |
| `~/.nocobase/proxy/nginx/<env>/public/index-v1.html` | v1 SPA fallback page generated from the current active client's `index.html` |
| `~/.nocobase/proxy/nginx/<env>/public/index-v2.html` | v2 SPA fallback page generated from the current active client's `v/index.html` |
| `~/.nocobase/proxy/nginx/nocobase.conf` | Shared main config that includes every env `app.conf` |
| `~/.nocobase/proxy/nginx/snippets/` | Shared snippets directory copied from built-in templates |

Where:

- `app.conf` is editable, but you should keep the managed block between `# BEGIN NocoBase managed config` and `# END NocoBase managed config`
- `index-v1.html` and `index-v2.html` automatically rewrite asset URLs according to the current env subpath, active client version, and `CDN_BASE_URL`
- `nocobase.conf` is mainly used by `--install`
- Files under `public/` and `snippets/` are usually not meant to be edited manually and will be resynced the next time you run the command

:::warning Note

If you need to add site-level Nginx config, edit `app.conf`. Do not manually edit managed files under `public/` or `snippets/`, because they will be overwritten the next time you run `nb env proxy nginx`.

:::

## Related configuration items

These CLI configuration items directly affect the generated Nginx output:

| Configuration item | Default value | Description |
| --- | --- | --- |
| `proxy.nb-cli-root` | CLI root, usually the current user's home directory | Map the `.nocobase` path to the root path that Nginx actually sees |
| `proxy.upstream-host` | `127.0.0.1` | Host used when the proxy forwards traffic back to the NocoBase app |
| `bin.nginx` | `nginx` | Path to the Nginx executable used by `--install` or `--reload` |

Most setups do not need to change `proxy.nb-cli-root`. You usually need it only when Nginx runs in another container, mount root, or path view.

## Notes

- `--port` must be an integer between `1` and `65535`
- The upstream NocoBase app port comes from the saved env `appPort`, not from `--port`
- If the command says the env is missing `appPort`, run `nb env update <name>` first, or explicitly save it with `nb env update <name> --app-port <port>`
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun `nb env proxy nginx` afterward
- `--print` cannot be combined with `--install` or `--reload`
- The Nginx provider does not support `--output`

## Examples

```bash
# Generate an Nginx config for the current env
nb env proxy nginx

# Generate a config for one env
nb env proxy nginx --env demo

# Write the public host and port into the entry config
nb env proxy nginx --env demo --host demo.local.nocobase.com --port 8080

# Print the rendered app.conf without writing files
nb env proxy nginx --env demo --print

# Map the .nocobase path when Nginx runs under another mount root
nb config set proxy.nb-cli-root /workspace

# Install the shared config into the Nginx main config and reload immediately
nb env proxy nginx --env demo --install --reload
```

## Related commands

- [`nb env proxy`](./index.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb config`](../../config/index.md)
