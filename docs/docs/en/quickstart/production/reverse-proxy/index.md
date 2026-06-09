---
title: 'Reverse Proxy for Production'
description: 'Use nb env proxy nginx and nb env proxy caddy to generate reverse-proxy configs for CLI-managed NocoBase envs.'
keywords: 'NocoBase,nb env proxy nginx,nb env proxy caddy,reverse proxy,Nginx,Caddy,production'
---

# Reverse Proxy for Production

In NocoBase CLI, there are two recommended entry points for putting a reverse proxy in front of a production app:

- `nb env proxy nginx`
- `nb env proxy caddy`

As long as your app has already been saved as a CLI env and the env type is `local` or `docker`, letting the CLI generate the config is usually enough. That way, the CLI keeps tricky details such as WebSocket handling, subpaths, SPA fallback pages, and later updates in sync. You only need to decide whether the entry layer should keep using Nginx or move to Caddy.

If your app is not managed by the CLI, or if you explicitly want to handwrite the full proxy config, go straight to the handwritten-config section in the provider pages.

## Check whether this path fits your setup

- Your app is already reachable through an internal address such as `http://127.0.0.1:13000`
- The app has already been saved as a CLI env, and the env type is `local` or `docker`
- The env already has `appPort` saved

If the command says the env is missing `appPort`, run [`nb env update`](../../../api/cli/env/update.md) first and save it.

If you later change settings such as `app-port` or `app-public-path` that affect proxy output, remember to rerun the matching proxy subcommand.

## Default path: let the CLI generate the config first

If you already know which entry provider you want to keep using, go straight to that subcommand:

```bash
nb env proxy nginx --env demo --host demo.example.com
nb env proxy caddy --env demo --host demo.example.com
```

If you have already switched to the current env, you can also omit `--env`:

```bash
nb env proxy nginx --host demo.example.com
```

Where:

- If you already use Nginx to manage sites, caching, access control, or certificates, start with [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- If you want HTTPS running quickly and do not want to maintain many TLS details yourself, start with [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- `--port` is the proxy entry port, not the app `appPort`

If you want the CLI to also connect the shared config to the provider main config and reload it after validation, add:

```bash
nb env proxy nginx --env demo --host demo.example.com --install --reload
```

For the full command reference, see [`nb env proxy`](../../../api/cli/env/proxy/index.md).

## What the CLI keeps in sync for you

The CLI does more than generate one proxy snippet. It also maintains provider-specific helper files. The output shape differs between the two providers:

- Nginx keeps `app.conf`, `public/index-v1.html`, `public/index-v2.html`, the shared `nocobase.conf`, and the shared `snippets/`
- Caddy keeps `generated.caddy`, `app.caddy`, and the shared `nocobase.caddy`

:::warning Note

If you need to add site-level configuration, edit `app.conf` or `app.caddy`. Do not manually edit CLI-managed helper files, because they will be overwritten the next time you run the command.

:::

## Which page should you open first

| I want to... | Go here |
| --- | --- |
| Keep using Nginx to manage sites, certificates, caching, or access control | [Nginx](./nginx.md) |
| Get HTTPS running quickly and maintain fewer certificate and TLS details | [Caddy](./caddy.md) |
| Review the command tree and choose a provider first | [`nb env proxy`](../../../api/cli/env/proxy/index.md) |
| See the Nginx subcommand options, output files, and examples first | [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md) |
| See the Caddy subcommand options, output files, and examples first | [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md) |
| Adjust env settings that may affect proxy output, such as `app-port` or `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| Install the app as a CLI-managed env first | [Install with CLI (Recommended)](../../installation/cli.md) |

## When the CLI-generated path is not the best fit

These cases are usually better served by the handwritten-config section in the provider pages:

- Your app is not managed by the CLI
- The env only has a remote API connection, or it is an SSH env
- You explicitly want to maintain the full Nginx config or full `Caddyfile` yourself

As long as the app has already been saved as a CLI env and the current machine can reach its runtime, the default recommendation is still to start with these commands. It makes later domain changes, site-level adjustments, and regeneration much easier to manage.

## Related links

- [`nb env proxy`](../../../api/cli/env/proxy/index.md)
- [`nb env proxy nginx`](../../../api/cli/env/proxy/nginx.md)
- [`nb env proxy caddy`](../../../api/cli/env/proxy/caddy.md)
- [Nginx](./nginx.md)
- [Caddy](./caddy.md)
- [App Environment Variables](../../installation/env.md)
- [Install with CLI (Recommended)](../../installation/cli.md)
