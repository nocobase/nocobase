---
title: 'nb env proxy'
description: 'nb env proxy command-group reference: view and choose the Nginx and Caddy proxy subcommands.'
keywords: 'nb env proxy,NocoBase CLI,nginx,caddy,reverse proxy,proxy configuration'
---

# nb env proxy

In NocoBase CLI, `nb env proxy` is the entry point for reverse-proxy related commands. You mainly use it to discover and choose the Nginx and Caddy provider subcommands.

If your app has already been saved as a CLI-managed env, and that env is `local` or `docker`, picking one provider subcommand is usually enough.

## Usage

```bash
nb env proxy
```

## Which subcommand should you open first

| I want to... | Go here |
| --- | --- |
| Keep using Nginx for sites, certificates, caching, or access control | [`nb env proxy nginx`](./nginx.md) |
| Get HTTPS running quickly and maintain fewer TLS details | [`nb env proxy caddy`](./caddy.md) |
| Adjust env settings that may affect proxy output, such as `app-port` or `app-public-path` | [`nb env update`](../update.md) |

## Notes

- `nb env proxy` does not have its own flags
- Use `nb env proxy nginx` or `nb env proxy caddy` when you want to generate configs
- Both subcommands only work for managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- If you change settings such as `app-port` or `app-public-path` with `nb env update`, you will usually need to rerun the matching proxy subcommand afterward
- This command group does not currently work for envs that only have a remote API connection or for SSH envs

## Examples

```bash
# Show command-group help
nb env proxy

# Generate an Nginx config for one env
nb env proxy nginx --env demo --host demo.local.nocobase.com

# Generate a Caddy config for one env
nb env proxy caddy --env demo --host demo.local.nocobase.com
```

## Related commands

- [`nb env proxy nginx`](./nginx.md)
- [`nb env proxy caddy`](./caddy.md)
- [`nb env update`](../update.md)
- [`nb env info`](../info.md)
- [`nb config`](../../config/index.md)
