# Production Environment Deployment

When deploying NocoBase in a production environment, installing dependencies can be cumbersome due to differences in build methods across various systems and environments. For a complete functional experience, we recommend deploying with **Docker**. If your system environment cannot use Docker, you can also deploy using **create-nocobase-app**.

:::warning

It is not recommended to deploy directly from source code in a production environment. The source code has many dependencies, is large in size, and a full compilation has high CPU and memory requirements. If you must deploy from source code, it is recommended to first build a custom Docker image and then deploy it.

:::

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