#Nginx

If you have used Nginx to manage the site on the server, or you need to handle certificates, caches, and access control later, then `nb proxy nginx` is the default recommended path.

If you just want to configure HTTPS as soon as possible and don't want to maintain too many proxy details yourself, then [Caddy](./caddy.md) will be more worry-free. But as long as you are using Nginx, this document is the default path.

## When is it more suitable to use Nginx?

Generally speaking, the following situations give priority to continuing to use Nginx:

- You have used Nginx to manage multiple sites on the server.
- You will need to maintain certificates, caches, access controls or more custom rules yourself later
- You want the entry layer to continue to use the existing Nginx operation and maintenance method

If your goal is just to get HTTPS through as quickly as possible, and you don’t want to maintain too many TLS details yourself, then [Caddy](./caddy.md) will be more worry-free.

## First follow these three commands.

If you just want to run the Nginx entry layer first, it is enough to remember these three commands by default:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

If Nginx has been installed locally, just change the first entry to `nb proxy nginx use local`.

In most scenarios, it is enough to execute `use` first, then `generate`, and finally `reload`. For other details and more commands, see the following chapters or the CLI reference.

## Step 1: First select how to run Nginx yourself

If Nginx is already installed on the current machine, just use `use local`.

If you want to use the Docker version of Nginx, use `use docker`.

The `local` / `docker` here refers to the running mode of **Nginx itself**.

Using the Docker version of Nginx:

```bash
nb proxy nginx use docker
```

Using a locally installed Nginx:

```bash
nb proxy nginx use local
```

If you forget which method is currently selected later, you can execute:

```bash
nb proxy nginx current
```

## Step 2: Execute `generate`

`generate` is used to generate Nginx entry configuration according to the specified env. The most common way to write it is:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

If you also want to specify the entry port, you can also write it together:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

The meaning of the parameters here is:

- `--env`: Specify which CLI env to generate configuration for
- `--host`: Specify the domain name for external access
- `--port`: Specifies the proxy entry port, not the `appPort` of the NocoBase application itself

The upstream application port comes from this env's saved `appPort`. If the command prompts that env is missing `appPort`, execute:

```bash
nb env update test2 --app-port 56575
```

If you later change configurations such as `app-port` and `app-public-path` that will affect the proxy results, remember to re-execute `generate`.

## Step 3: Execute `reload`

After generating the configuration, execute directly:

```bash
nb proxy nginx reload
```

In most scenarios, just use this command directly. If it is not running yet, the startup will be processed internally first; if it is already running, it will be reloaded according to the latest configuration.

## What files will the CLI maintain?

Taking `test2` as an example, Nginx related commands usually maintain these files and directories:

| path | function |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Nginx shared snippets directory |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Editable site entry configuration |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | v1 SPA fallback page |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | v2 SPA fallback page |
| `NB_CLI_ROOT/test2/storage/dist-client` | Currently used front-end build product directory |
| `NB_CLI_ROOT/test2/storage/uploads` | The upload directory of the current application |

in:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` The following are agent auxiliary files maintained by CLI
- `NB_CLI_ROOT/test2/storage/...` The following are the application's own static resources and upload directories
- `app.conf` can be changed, but the NocoBase managed block must be retained
- `index-v1.html` and `index-v2.html` will automatically rewrite resource addresses according to the current env subpath, active client version, and `CDN_BASE_URL`

:::warning note

If you want to add site-level Nginx configuration, such as current limiting, additional headers, and access control, just change `app.conf`. CLI-managed auxiliary files are updated synchronously on subsequent rebuilds.

:::

## Handwritten configuration: what to do without CLI

If your application is not CLI hosted, or you explicitly want to maintain the complete Nginx configuration yourself, you can also write it by hand.

However, for NocoBase, the production reverse proxy is usually more than a simple `proxy_pass`. In addition to forwarding API requests to the backend application, a complete and usable configuration usually needs to handle the upload directory, front-end static resources, WebSocket, `.well-known` route, and SPA fallback page.

Taking `test2` as an example, key files and directories related to Nginx usually include:

- Nginx snippets: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Editable entry configuration: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- SPA fallback page (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- SPA fallback page (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Front-end build product directory: `NB_CLI_ROOT/test2/storage/dist-client`
- Upload directory: `NB_CLI_ROOT/test2/storage/uploads`

In other words, handwritten configuration usually needs to cover at least the following types of entries:

- `uploads`: Expose the upload directory through `alias`
- `dist`: Expose the front-end build product directory through `alias`
- `well-known`: Handle OAuth / OpenID related discovery paths
- `api`: forward `/api/` request to the backend application
- `ws`: forward WebSocket requests to the backend application
- `spa`: Provides front-end entry and `try_files` fallback for `/` and `/v/`

Therefore, a complete Nginx configuration is usually not just the following general reverse proxy writing method:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

For a CLI-hosted application like `test2`, a structure closer to a real deployment would usually look like this:

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

There are two key points here:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` The following are agent auxiliary files maintained by CLI
- `NB_CLI_ROOT/test2/storage/...` The following is to use your own product directory and upload directory

If your application uses sub-path deployment, or the front-end resources, upload directory, and reverse proxy are not in the same path perspective, handwritten configuration will be more error-prone. In this scenario, it is usually more recommended to execute:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Then make adjustments based on the generated results.

A more prudent approach is usually:

1. First let the CLI generate the Nginx configuration
2. Confirm the routing structure and actual path based on the generated results.
3. Then make manual adjustments according to your domain name, running mode and mounting path.

This is usually less likely to miss details related to WebSockets, static resources, upload directories, or SPA fallback pages than handwriting a configuration from scratch.

## How to handle HTTPS

If you have decided to continue using Nginx, HTTPS can also continue to be configured in Nginx. A common practice is to expand `listen 80` to `80/443` dual entry, and then add the certificate path and TLS configuration.

However, if you just want to get available HTTPS as soon as possible, and don't want to handle certificate application and renewal yourself, then it will be more worry-free to use [Caddy](./caddy.md) directly.

## Common instructions

- `nb proxy nginx generate` is for applications installed by `nb init`
- If you subsequently change configurations such as `app-port` and `app-public-path` that will affect the proxy results, remember to re-execute `generate`

## Related links

- [Production environment reverse proxy](./index.md)
- [Caddy](./caddy.md)
- [Install using CLI](../../installation/cli.md)
- [Application configuration with `.env`](../../installation/env.md)
- [`nb proxy nginx` Command Reference](../../../api/cli/proxy/nginx/index.md)
