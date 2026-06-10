---
title: "Nginx"
description: "Use nb proxy nginx to generate and manage Nginx reverse-proxy configuration for CLI-managed NocoBase envs."
keywords: "NocoBase,nb proxy nginx,reverse proxy,Nginx,production"
---

# Nginx

If you already use Nginx on the server to manage sites, or you still want to manage certificates, caching, and access control yourself, `nb proxy nginx` is the recommended path.

If your goal is simply to get HTTPS working as quickly as possible and you do not want to maintain many proxy details yourself, [Caddy](./caddy.md) is usually the simpler option. But if Nginx is already part of your server setup, this page is the default path.

## When Nginx is the better fit

In practice, Nginx is usually the better choice when:

- you already use Nginx to manage multiple sites on the same server
- you still need to maintain certificates, caching, access control, or more custom rules yourself
- you want the entry layer to stay aligned with your existing Nginx operations workflow

If the only goal is to get HTTPS online quickly with less TLS work, [Caddy](./caddy.md) is usually the simpler route.

## Recommended order: choose a driver, generate config, then start

For a CLI-managed env of type `local` or `docker`, the default order is:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Or with a local process:

```bash
nb proxy nginx use local
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx start
```

Common follow-up commands are:

```bash
nb proxy nginx current
nb proxy nginx status
nb proxy nginx info
nb proxy nginx reload
nb proxy nginx restart
nb proxy nginx stop
```

In most cases:

- `current` is the quickest way to confirm the active runtime driver
- `status` shows whether Nginx is currently running normally
- `info` shows the current config path, runtime root, and related runtime details
- after regenerating config, `reload` is usually the first command to use
- use `restart` when you need a full restart

## What `generate` needs as input

The most common form is:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

If you also want to specify the entry port:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

Where:

- `--env`: which CLI env to generate config for
- `--host`: the public domain name
- `--port`: the proxy entry port, not the app's own `appPort`

The upstream application port comes from the saved `appPort` of that env. If the command says the env is missing `appPort`, save it first with:

```bash
nb env update test2 --app-port 56575
```

If you later change settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun `generate`.

## Files maintained by the CLI

Using `test2` as an example, the Nginx workflow usually maintains:

| Path | Purpose |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Shared Nginx snippets directory |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Editable site entry config |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | v1 SPA fallback page |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | v2 SPA fallback page |
| `NB_CLI_ROOT/test2/storage/dist-client` | Frontend build output for the current app |
| `NB_CLI_ROOT/test2/storage/uploads` | Uploads directory for the current app |

Where:

- files under `NB_CLI_ROOT/.nocobase/proxy/nginx/...` are CLI-managed proxy helper files
- files under `NB_CLI_ROOT/test2/storage/...` belong to the application itself
- `app.conf` can be edited, but the NocoBase-managed block must stay intact
- `index-v1.html` and `index-v2.html` are rewritten according to the current env's subpath, active client version, and `CDN_BASE_URL`

:::warning Note

If you need site-level Nginx config such as rate limiting, extra headers, or access control, edit `app.conf`. The CLI-managed helper files are updated again when you regenerate the config.

:::

## Handwritten config: when you are not using the CLI

If the app is not CLI-managed, or you intentionally want to maintain the complete Nginx config yourself, you can still write it by hand.

For NocoBase, though, a production reverse proxy is usually more than a single `proxy_pass`. In addition to forwarding API requests to the backend app, a complete config usually needs to handle uploads, frontend assets, WebSocket, `.well-known` routes, and SPA fallback pages together.

Using `test2` as the example, these are the key Nginx-related files and directories:

- Nginx snippets: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Editable entry config: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA fallback page for v1: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA fallback page for v2: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Frontend build output: `NB_CLI_ROOT/test2/storage/dist-client`
- Uploads directory: `NB_CLI_ROOT/test2/storage/uploads`

In other words, a handwritten config usually needs to cover at least these entry areas:

- `uploads`
- `dist`
- `well-known`
- `api`
- `ws`
- `spa`

So a complete Nginx config is usually more than a generic reverse proxy such as:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

For a CLI-managed app such as `test2`, a more realistic deployment structure usually looks closer to this:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Two details matter here:

- files under `NB_CLI_ROOT/.nocobase/proxy/nginx/...` are CLI-managed proxy helper files
- files under `NB_CLI_ROOT/test2/storage/...` belong to the application's own build output and uploads

If the app uses subpath deployment, or if frontend assets, uploads, and the reverse proxy do not share the same path view, handwritten config becomes easier to get wrong. In those cases, it is usually safer to generate the config first with:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Then use the generated result as the baseline for manual adjustments.

The safer workflow is usually:

1. let the CLI generate the Nginx config first
2. use the generated output to confirm the routing structure and real filesystem paths
3. then adjust it for your own domain, runtime driver, and mount layout

That is usually less error-prone than writing the full config from scratch.

## Validate and reload the config

If you write or adjust Nginx config manually, validate it first and then reload:

```bash
nginx -t
systemctl reload nginx
```

If you are not using `systemd` to manage Nginx, replace that with your own reload workflow.

If you manage the entry layer through `nb proxy nginx`, the usual first choice is:

```bash
nb proxy nginx reload
```

## How to handle HTTPS

If you have already decided to keep using Nginx, you can keep HTTPS there as well. A common pattern is to extend `listen 80` into a `80/443` setup and then add certificate paths and TLS settings.

If the goal is simply to get usable HTTPS quickly without managing certificate issuance and renewal yourself, switching to [Caddy](./caddy.md) is usually simpler.

## Common notes

- `nb proxy nginx generate` only works for CLI-managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- if the command says the env is missing `appPort`, run `nb env update <name> --app-port <port>` first
- if you already have a large top-level Nginx config, the CLI-generated config is usually better used as a site fragment than as a replacement for the entire main config
- if you later change settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun `generate`

## Related links

- [Reverse Proxy in Production](./index.md)
- [Caddy](./caddy.md)
- [Install with the CLI](../../installation/cli.md)
- [Install with Docker Compose](../../installation/docker-compose.md)
- [Environment variables](../../installation/env.md)
