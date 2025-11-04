# Production Environment Deployment

When deploying NocoBase in a production environment, installing dependencies can be cumbersome due to differences in build methods across different systems and environments. For a complete and stable experience, we recommend deploying using **Docker**. If Docker is not available in your environment, you can also deploy using **create-nocobase-app**.

:::warning

It is not recommended to deploy directly from source code in a production environment. The source code has many dependencies, is large in size, and requires high CPU and memory resources for full compilation. If deployment from source code is necessary, it is recommended to first build a custom Docker image before deployment.

:::

## Deployment Process

For production environment deployment, you can refer to the existing installation and upgrade guides.

### New Installation

- [Docker Installation](../installation/docker.mdx)
- [create-nocobase-app Installation](../installation/create-nocobase-app.mdx)

### Upgrading the Application

- [Upgrading a Docker Installation](../installation/docker.mdx)
- [Upgrading a create-nocobase-app Installation](../installation/create-nocobase-app.mdx)

### Installing and Upgrading Third-Party Plugins

- [Installing and Upgrading Plugins](../install-upgrade-plugins.mdx)

## Static Asset Proxy

In a production environment, it is recommended to manage static assets through a proxy server such as:

- [nginx](./static-resource-proxy/nginx.md)
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Common Operation Commands

Depending on the installation method, you can use the following commands to manage NocoBase processes:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)