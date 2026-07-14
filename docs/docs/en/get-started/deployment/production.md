# Production Environment Deployment

When deploying NocoBase in a production environment, installing dependencies can be cumbersome due to differences in build methods across various systems and environments. For a complete functional experience, we recommend deploying with **Docker**. If your system environment cannot use Docker, you can also deploy using **create-nocobase-app**.

:::warning Note

It is not recommended to deploy directly from source code in a production environment. The source code has many dependencies, is large in size, and a full compilation has high CPU and memory requirements. If you must deploy from source code, it is recommended to first build a custom Docker image and then deploy it.

:::

:::warning Note

If you deploy multiple independent NocoBase services, use a different `hostname` for each service, such as separate subdomains. Do not distinguish services only by port, for example `https://example.com:13000` and `https://example.com:14000`.

NocoBase uses cookies to maintain login state and [file access permissions](../../file-manager/stable-url.md). Browsers do not isolate cookies by port, so services on different ports under the same `hostname` may share cookies with the same name. This can overwrite login state or cause file preview and download authorization failures.

Sub-apps within the same NocoBase deployment are outside this restriction. Login cookies are distinguished by app name, so the main app and differently named sub-apps can share one `hostname`.

However, independent services still need isolation. If another NocoBase service runs on a different port under the same `hostname` and contains a main app or sub-app with the same name, its cookies may still conflict.

Use addresses such as `app1.example.com` and `app2.example.com`, then route them to different NocoBase services through Nginx or Caddy.

:::

## Separated Frontend / Cross-Origin API Access

Prefer keeping the pages and the API on the same origin: use a reverse proxy under one domain to forward `${APP_PUBLIC_PATH}api/` and `${APP_PUBLIC_PATH}files/` to the NocoBase service, and leave `API_BASE_URL` empty.

If the pages must access the API cross-origin (with `API_BASE_URL` pointing to another origin), add the page origin to `CORS_ORIGIN_WHITELIST`. Otherwise the browser ignores `Set-Cookie` in API responses, the login cookie is never stored, and preview and download through stable file URLs fail authorization.

Also note that cookies are stored per `hostname`: when the pages and the API use entirely different domains, requests to `/files/` from the page domain will not carry the login cookie stored under the API domain. Such deployments should switch to a same-origin reverse proxy. See [Environment Variables](../installation/env.md#api_base_url).

## Deployment Process

For production environment deployment, you can refer to the existing installation and upgrade steps.

### New Installation

- [Docker Installation](../installation/docker.mdx)
- [create-nocobase-app Installation](../installation/create-nocobase-app.mdx)

### Upgrading the Application

- [Upgrading a Docker Installation](../installation/docker.mdx)
- [Upgrading a create-nocobase-app Installation](../installation/create-nocobase-app.mdx)

### Installing and Upgrading Third-Party Plugins

- [Installing and Upgrading Plugins](../install-upgrade-plugins.mdx)

## Static Asset Proxy

In a production environment, it is recommended to manage static assets with a proxy server, for example:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Common Operations Commands

Depending on the installation method, you can use the following commands to manage the NocoBase process:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
