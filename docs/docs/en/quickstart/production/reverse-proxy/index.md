---
title: "Production environment reverse proxy"
description: "Generate and manage reverse proxy configuration for CLI hosted NocoBase env based on nb proxy nginx and nb proxy caddy."
keywords: "NocoBase,nb proxy nginx,nb proxy caddy, reverse proxy, Nginx, Caddy, production environment"
---


# Reverse proxy

This article only applies to applications installed using `nb init`.

In NocoBase, the production environment reverse proxy does more than simply forward requests to the application process. Often the details of WebSockets, subpaths, front-end static resources, upload directories, and SPA fallback pages are also handled at the same time.

The function of `nb proxy` is to collect these easily missed details into a stable set of command entries.

## Core process

If you only look at the core process, it is enough to remember these three commands:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

If you are using Caddy, just replace `nginx` in the command with `caddy`.

If Nginx or Caddy has been installed locally, just change `use docker` in the first item to `use local`.

In most scenarios, it is enough to execute `use` first, then `generate`, and finally `reload`. For details on Nginx or Caddy, continue to their respective pages.

## When to choose Nginx and when to choose Caddy

It can usually be judged like this:

| Scenario | Recommendation |
| --- | --- |
| You are already using Nginx to manage your site, certificates, cache or access control | [Nginx](./nginx.md) |
| You already have a domain name and want to run HTTPS as soon as possible and save some TLS details to maintain | [Caddy](./caddy.md) |

## Continue reading below

| I want... | Where to look |
| --- | --- |
| Follow the Nginx management site entrance | [Nginx](./nginx.md) |
| Connect HTTPS as soon as possible | [Caddy](./caddy.md) |
| First adjust the env configuration that will affect the proxy results, such as `app-port`, `app-public-path` | [`nb env update`](../../../api/cli/env/update.md) |
| First confirm the installation and env configuration of the application | [Install using CLI (recommended)](../../installation/cli.md) |
