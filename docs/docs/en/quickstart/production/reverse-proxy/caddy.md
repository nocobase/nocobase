---
title: "Caddy"
description: "Use nb proxy caddy to generate and manage Caddy reverse-proxy configuration for CLI-managed NocoBase envs."
keywords: "NocoBase,nb proxy caddy,reverse proxy,Caddy,production"
---

# Caddy

If you already have a domain and want to get HTTPS running quickly, `nb proxy caddy` is usually the simplest entry path.

Compared with maintaining certificate configuration in Nginx yourself, Caddy is more like the default shortcut for getting the entry layer online quickly.

## When Caddy is the better fit

In practice, Caddy is usually the better choice when:

- you already have a domain and want to get HTTPS online quickly
- you do not want to manage many certificate and TLS details yourself
- you mainly want a simple and stable entry layer

If you already use Nginx to manage many sites on the same server, or you still need heavier caching, access control, or custom rules, [Nginx](./nginx.md) is usually the better fit.

## Recommended order: choose a driver, generate config, then start

For a CLI-managed env of type `local` or `docker`, the default order is:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Or with a local process:

```bash
nb proxy caddy use local
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy start
```

Common follow-up commands are:

```bash
nb proxy caddy current
nb proxy caddy status
nb proxy caddy info
nb proxy caddy reload
nb proxy caddy restart
nb proxy caddy stop
```

In most cases:

- `current` is the quickest way to confirm the active runtime driver
- `status` shows whether Caddy is currently running normally
- `info` shows the current config path, runtime root, and related runtime details
- after regenerating config, `reload` is usually the first command to use
- use `restart` when you need a full restart

## What `generate` needs as input

The most common form is:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

If you also want to specify the entry port:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

Where:

- `--env`: which CLI env to generate config for
- `--host`: the public domain name
- `--port`: the proxy entry port

For Caddy, `--host` matters especially because the site address strongly affects the HTTPS workflow. In production, it is usually best to pass a domain that already resolves to the current server.

If the command says the env is missing `appPort`, save it first with:

```bash
nb env update test2 --app-port 56575
```

If you later change settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun `generate`.

## Files maintained by the CLI

Using `test2` as an example, the Caddy workflow usually maintains:

| Path | Purpose |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | CLI-generated full site config |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Provider-level Caddy entry file that imports all env `app.caddy` files |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | v1 SPA fallback page |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | v2 SPA fallback page |
| `NB_CLI_ROOT/test2/storage/dist-client` | Frontend build output for the current app |
| `NB_CLI_ROOT/test2/storage/uploads` | Uploads directory for the current app |

Where:

- files under `NB_CLI_ROOT/.nocobase/proxy/caddy/...` are CLI-managed proxy helper files
- files under `NB_CLI_ROOT/test2/storage/...` belong to the application itself
- `nocobase.caddy` is the provider-level entry file and usually does not need manual edits
- `app.caddy` is the full site config for one env and is overwritten as a whole when you regenerate it

:::warning Note

If you need site-level Caddy config such as extra headers, authentication, rate limiting, or compression policy, you can adjust `app.caddy` as the baseline. But remember that running `generate` again overwrites that file.

:::

## Handwritten config: when you are not using the CLI

If the app is not CLI-managed, or you intentionally want to maintain the full Caddy config yourself, you can still write it by hand.

For NocoBase, though, a production entry is usually more than a simple `reverse_proxy`. In addition to forwarding API requests to the backend app, a complete Caddy config usually needs to handle uploads, frontend assets, `.well-known` routes, WebSocket, and SPA fallback pages together.

Using `test2` as the example, the key Caddy-related paths usually include:

- SPA fallback directory: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Frontend build output: `NB_CLI_ROOT/test2/storage/dist-client`
- Uploads directory: `NB_CLI_ROOT/test2/storage/uploads`

In other words, a handwritten config usually needs to cover at least these entry areas:

- `v`: redirect `/v` to `/v/`
- `uploads`: expose the uploads directory
- `dist`: expose the frontend build output
- `oauth well-known`: handle the OAuth discovery path
- `openid well-known`: handle the OpenID discovery path
- `api`: forward `/api/` requests to the backend app
- `ws`: forward WebSocket requests to the backend app
- `spa v2`: serve `/v/` with the v2 entry and fallback page
- `spa v1`: serve `/` with the v1 entry and fallback page

So a complete Caddy config is usually more than a generic example such as:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

For a CLI-managed app such as `test2`, a more realistic deployment structure usually looks closer to this:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Two details matter here:

- files under `NB_CLI_ROOT/.nocobase/proxy/caddy/...` are CLI-managed SPA fallback files
- files under `NB_CLI_ROOT/test2/storage/...` belong to the application's own build output and uploads

If the app uses subpath deployment, or if frontend assets, uploads, and the entry layer do not share the same path view, handwritten config becomes easier to get wrong. In those cases, it is usually safer to generate the config first with:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Then use the generated result as the baseline for manual adjustments.

If you want the CLI to get the routes and paths working first, the generated structure usually looks like this:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

Where:

- `nocobase.caddy` imports all `*/app.caddy` files
- `test2/app.caddy` is the full site config for env `test2`
- `public/index-v1.html` and `public/index-v2.html` are CLI-generated SPA fallback pages

The safer workflow is usually:

1. let the CLI generate the Caddy config first
2. use the generated output to confirm the routing structure and real filesystem paths
3. then adjust it for your own domain, runtime driver, and mount layout

That is usually less error-prone than writing the full config from scratch.

## Validate and reload the config

If you write or adjust Caddy config manually, validate it first and then reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

If you are not using `systemd` to manage Caddy, replace that with your own start and reload workflow.

If you manage the entry layer through `nb proxy caddy`, the usual first choice is:

```bash
nb proxy caddy reload
```

If you want to inspect the current driver, main config-file path, runtime root, and container or local binary details, run:

```bash
nb proxy caddy info
```

If you only want to confirm whether Caddy is already running, run:

```bash
nb proxy caddy status
```

## Common notes

- `nb proxy caddy generate` only works for CLI-managed envs whose runtime is reachable from the current machine, which means `local` or `docker`
- if the command says the env is missing `appPort`, run `nb env update <name> --app-port <port>` first
- if you already have a domain that resolves correctly to the current server, Caddy is often the fastest way to get HTTPS
- if you later change settings such as `app-port` or `app-public-path` that affect proxy behavior, rerun `generate`

## Related links

- [Reverse Proxy in Production](./index.md)
- [Nginx](./nginx.md)
- [Install with the CLI](../../installation/cli.md)
- [Install with Docker Compose](../../installation/docker-compose.md)
- [Environment variables](../../installation/env.md)
