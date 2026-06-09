---
title: "Reverse Proxy in Production"
description: "Use nb proxy nginx and nb proxy caddy to generate and manage reverse-proxy configuration for CLI-managed NocoBase envs."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy,reverse proxy,Nginx,Caddy,production"
---

# Reverse Proxy in Production

In NocoBase CLI, the recommended production reverse-proxy entrypoints are:

- `nb proxy nginx`
- `nb proxy caddy`

Where:

- `proxy` manages the entry layer
- `nginx` and `caddy` are the provider implementations
- `docker` and `local` are the runtime drivers
- `--env <name>` selects which CLI env to generate config for

As long as your app has been saved as a CLI-managed env and the env is `local` or `docker`, letting the CLI generate and manage the reverse-proxy config is usually enough. That approach keeps WebSocket handling, subpaths, SPA fallback pages, and later updates aligned in one place.

If the app is not CLI-managed, or you intentionally want to maintain the entire proxy configuration by hand, move on to the handwritten-config sections in the provider-specific pages.

## Before you start

Make sure that:

- the app can already be reached internally, such as `http://127.0.0.1:13000`
- the app has already been saved as a CLI env, and that env is `local` or `docker`
- the env already has `appPort` saved

If the command says the env is missing `appPort`, update it first with [`nb env update`](../../../api/cli/env/update.md).

If you later change settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun the matching `generate` command.

## Default workflow

For Nginx:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

For Caddy:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

The roles are:

- `use docker|local`: choose the runtime driver for the current provider
- `generate --env <name> --host <domain>`: generate reverse-proxy config for one env
- `start`: start the local process or Docker container for the current provider

If you update the config later, `reload` is usually the first choice. Use `restart` when you need a full restart of the entry layer.

## How the command group is split

Using Nginx as the example:

| Command | Purpose |
| --- | --- |
| `nb proxy nginx use docker` | Switch the Nginx runtime to Docker |
| `nb proxy nginx use local` | Switch the Nginx runtime to a local process |
| `nb proxy nginx current` | Show the current runtime driver |
| `nb proxy nginx generate --env <name> --host <domain>` | Generate Nginx config for one env |
| `nb proxy nginx start` | Start Nginx |
| `nb proxy nginx reload` | Reload the Nginx config |
| `nb proxy nginx restart` | Restart Nginx |
| `nb proxy nginx stop` | Stop Nginx |
| `nb proxy nginx status` | Show Nginx status |
| `nb proxy nginx info` | Show the current config, paths, and runtime details |

Caddy uses the same action set, but with a different provider implementation.

## What the CLI maintains

The CLI does more than produce one proxy fragment. It also keeps the helper files and site entry structure aligned with the provider:

- Nginx maintains shared `snippets`, `app.conf`, `public/index-v1.html`, and `public/index-v2.html`
- Caddy maintains `nocobase.caddy`, `app.caddy`, `public/index-v1.html`, and `public/index-v2.html`, where `app.caddy` is the full site config for one env

:::warning Note

If you need to add site-level configuration, you usually edit `app.conf` for Nginx and use `app.caddy` as the base for Caddy. Do not edit the CLI-managed helper files directly. Also note that `app.caddy` is overwritten as a whole when you run `generate` again, while `nocobase.caddy` mainly serves as the provider-level entry file.

:::

## Which page should you open first

| I want to... | Go here |
| --- | --- |
| Keep using Nginx for sites, certificates, caching, or access control | [Nginx](./nginx.md) |
| Get HTTPS running quickly with fewer TLS details to maintain | [Caddy](./caddy.md) |
| Adjust env settings that may affect proxy behavior, such as `app-port` or `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Install the app as a CLI-managed env first | [Install with the CLI](../../installation/cli.md) |

## When the CLI path is not the right fit

In these cases, the handwritten-config sections in the provider-specific pages are usually a better fit:

- the app is not CLI-managed
- the env is only a remote API connection or an SSH env
- you intentionally want to maintain the entire Nginx config or `Caddyfile` yourself

As long as the app has been saved as a CLI env and its runtime is reachable from the current machine, using this command group is still the recommended default. It is usually much easier to maintain later when you need to change the domain, add site-level config, switch drivers, or regenerate the entry files.

## Related links

- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [Environment variables](../../installation/env.md)
- [Install with the CLI](../../installation/cli.md)
