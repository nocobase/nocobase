---
title: "Production Deployment"
description: "Finish NocoBase production deployment quickly: configure app auto-start first, then configure a reverse proxy."
keywords: "NocoBase,production deployment,nb app autostart,nb proxy nginx,nb proxy caddy,Nginx,Caddy"
---

# Production Deployment

If your NocoBase app can already run normally on the server, production rollout usually only needs two more things:

1. make sure the app can recover automatically after the machine restarts
2. add a reverse-proxy entrypoint so the app can be accessed from outside reliably

In NocoBase CLI, the main command groups are:

- `nb app autostart`
- `nb proxy`

This page explains the overall path first. For Nginx or Caddy details, continue to the provider-specific pages.

## Step 1: configure app auto-start

In production, the first priority is not the domain name. It is making sure the service itself can recover reliably. Otherwise, after a machine restart, container recreation, or routine operations work, the app may not come back automatically.

The most common `nb app autostart` subcommands are:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Enable auto-start for the current env:

```bash
nb app autostart enable
```

If the target is not the current env, specify it explicitly:

```bash
nb app autostart enable --env app1 --yes
```

Check which envs are marked for auto-start:

```bash
nb app autostart list
```

After the system boots, start all enabled envs with:

```bash
nb app autostart run
```

If you want detailed startup output while debugging:

```bash
nb app autostart run --verbose
```

:::tip What this step actually does

`nb app autostart enable` marks a CLI-managed env as allowed to start automatically. `nb app autostart run` actually starts all envs that have auto-start enabled.

In production, you usually still need to connect `nb app autostart run` to your own system startup flow, such as `systemd`, a container platform startup script, or another host-level auto-start mechanism that you already use.

:::

### Applicability

`nb app autostart` only works for envs with a CLI-managed runtime:

- `local`
- `docker`

If an env is only a remote API connection, or the app is not managed locally by the CLI on the current machine, this command group is not the right way to handle auto-start.

## Step 2: configure the reverse proxy

After the app can recover automatically, handle the external entrypoint. In production, the reverse proxy usually takes care of:

- binding the domain name or entry port
- forwarding HTTP and WebSocket requests to NocoBase
- handling HTTPS, certificates, caching, or access control

The recommended CLI entrypoints are:

- `nb proxy nginx`
- `nb proxy caddy`

### Default workflow

If the app has already been saved as a CLI env and that env is `local` or `docker`, the usual path is to let the CLI generate the config directly:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com

nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
```

Then start the chosen provider:

```bash
nb proxy nginx start
nb proxy caddy start
```

The CLI also helps with details that are easy to miss in handwritten configs, such as:

- WebSocket forwarding
- entry and asset URLs under subpaths
- SPA fallback pages
- provider-level shared config files

### When to choose Nginx or Caddy

| Scenario | Recommendation |
| --- | --- |
| You already use Nginx to manage sites, caching, certificates, or access control | [Nginx](./reverse-proxy/nginx.md) |
| You already have a domain and want HTTPS up quickly with fewer TLS details to maintain | [Caddy](./reverse-proxy/caddy.md) |
| You want the overall introduction first | [Reverse Proxy in Production](./reverse-proxy/index.md) |

If you later change env settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun the matching proxy subcommand.

## Default rollout path

For the simplest production rollout, this sequence is usually enough:

1. confirm the app can already start normally on the server itself
2. run `nb app autostart enable`
3. connect `nb app autostart run` to your system startup flow
4. choose Nginx or Caddy and run the matching `nb proxy` subcommand
5. verify external access through the domain name or entry address

## Quick index

| I want to... | Go here |
| --- | --- |
| Read the overall reverse-proxy introduction first | [Reverse Proxy in Production](./reverse-proxy/index.md) |
| Keep using Nginx at the entry layer | [Nginx](./reverse-proxy/nginx.md) |
| Use Caddy to get HTTPS faster | [Caddy](./reverse-proxy/caddy.md) |
| View app start, stop, logs, and upgrade operations | [Manage the App](../operations/manage-app.md) |
| Read the `nb proxy nginx` CLI reference | [`nb proxy nginx`](../../api/cli/proxy/nginx/index.md) |
| Read the `nb proxy caddy` CLI reference | [`nb proxy caddy`](../../api/cli/proxy/caddy/index.md) |

## Related commands

```bash
# Enable auto-start for one env
nb app autostart enable --env app1 --yes

# Check auto-start state
nb app autostart list

# Start all enabled envs
nb app autostart run

# Choose the Nginx runtime and generate config
nb proxy nginx use docker
nb proxy nginx generate --env app1 --host app.example.com
nb proxy nginx start

# Choose the Caddy runtime and generate config
nb proxy caddy use local
nb proxy caddy generate --env app1 --host app.example.com
nb proxy caddy start
```
