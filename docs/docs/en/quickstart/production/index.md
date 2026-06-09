---
title: "Production Deployment"
description: "Deploy NocoBase in production with two final steps: enable app autostart and configure a reverse proxy."
keywords: "NocoBase,production deployment,nb app autostart,nb env proxy,Nginx,Caddy"
---

# Production Deployment

If your NocoBase app is already running correctly on the server, production rollout usually only needs two more steps:

1. Make sure the app starts automatically after the machine restarts
2. Put a reverse proxy in front of the app for stable external access

In the NocoBase CLI, the main commands are:

- `nb app autostart`
- `nb env proxy`

This page gives the overall path first. For Nginx or Caddy details, continue to the corresponding subpages.

## Step 1: Enable App Autostart

In production, the first priority is not the domain name. The first priority is making sure the service can recover reliably after a reboot, container recreation, or routine maintenance.

In the CLI, `nb app autostart` is a command group. The most commonly used commands are:

- `nb app autostart enable`
- `nb app autostart list`
- `nb app autostart run`

Enable autostart for the current env:

```bash
nb app autostart enable
```

If you want to target a different env explicitly:

```bash
nb app autostart enable --env app1 --yes
```

Then check which envs are marked for autostart:

```bash
nb app autostart list
```

After the system boots, run the following command to start every env that has autostart enabled:

```bash
nb app autostart run
```

If you want the underlying startup output for troubleshooting:

```bash
nb app autostart run --verbose
```

:::tip What this actually does

`nb app autostart enable` marks a CLI-managed env as allowed to start automatically.  
`nb app autostart run` is the command that actually starts all envs that were marked for autostart.

In other words, in a real production setup you usually still need to wire `nb app autostart run` into your own system startup flow, such as `systemd`, a container platform startup script, or another host-level boot mechanism you already use.

:::

### Scope

`nb app autostart` only applies to envs with a CLI-managed runtime on the current machine:

- `local`
- `docker`

If the env is only a remote API connection, or the app is not managed locally by the CLI on this machine, these commands are not the right tool for autostart.

## Step 2: Configure a Reverse Proxy

Once the app can recover automatically, the next step is to handle the external entry point. In production, the reverse proxy usually takes care of:

- binding the domain name or public port
- forwarding HTTP and WebSocket traffic to NocoBase
- handling HTTPS, certificates, caching, or access control

In the NocoBase CLI, the recommended entry points are:

- `nb env proxy nginx`
- `nb env proxy caddy`

### Default Approach

If your app is already saved as a CLI env and is a `local` or `docker` env, letting the CLI generate the proxy config is usually enough:

```bash
nb env proxy nginx --env app1 --host app.example.com
nb env proxy caddy --env app1 --host app.example.com
```

If the current env is already the target env, you can omit `--env`:

```bash
nb env proxy nginx --host app.example.com
```

The CLI helps cover details that are easy to miss in handwritten configs, such as:

- WebSocket forwarding
- entry and static asset paths for subpath deployments
- SPA fallback pages
- provider shared config files

### When To Choose Nginx Or Caddy

You can usually decide like this:

| Scenario | Recommended |
| --- | --- |
| You already use Nginx for sites, caching, certificates, or access control | [Nginx](./reverse-proxy/nginx.md) |
| You already have a domain and want HTTPS working quickly with less TLS maintenance | [Caddy](./reverse-proxy/caddy.md) |
| You want the overall explanation of this command group first | [Production Reverse Proxy](./reverse-proxy/index.md) |

If you change env settings that affect the proxy result, such as `app-port` or `app-public-path`, remember to rerun the corresponding proxy subcommand.

## Recommended Rollout Path

If you want the simplest production path, this order usually works well:

1. Make sure the app can already start correctly on the server itself
2. Run `nb app autostart enable`
3. Add `nb app autostart run` to your system startup process
4. Choose Nginx or Caddy and run the matching `nb env proxy` subcommand
5. Verify external access through the final domain or public entry address

## Quick Links

| I want to... | Read this |
| --- | --- |
| Start with the overall reverse proxy explanation | [Production Reverse Proxy](./reverse-proxy/index.md) |
| Keep using Nginx for the entry layer | [Nginx](./reverse-proxy/nginx.md) |
| Use Caddy for a faster HTTPS setup | [Caddy](./reverse-proxy/caddy.md) |
| Manage start, stop, logs, and upgrades | [Manage Apps](../operations/manage-app.md) |
| Read the `nb env proxy` CLI reference | [`nb env proxy`](../../api/cli/env/proxy/index.md) |

## Related Commands

```bash
# Enable autostart for one env
nb app autostart enable --env app1 --yes

# List autostart status
nb app autostart list

# Start all envs with autostart enabled
nb app autostart run

# Generate Nginx reverse proxy config
nb env proxy nginx --env app1 --host app.example.com

# Generate Caddy reverse proxy config
nb env proxy caddy --env app1 --host app.example.com
```
