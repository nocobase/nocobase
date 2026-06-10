#Intranet installation

If your server cannot access the public network, the installation method requires you to prepare the images, dependencies and plug-in packages required for offline use in advance. By default, it is recommended to use Docker first, which has the shortest path and is easiest to reproduce.

## Default recommendation: Prepare Docker image offline

On a machine that can access the public network, first pull down the application image and database image:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Then export as offline file:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

If you still need commercial plug-ins, it is also recommended to prepare the plug-in package in the external network environment and then bring it into the intranet together.

## Copy the file to the intranet server

Prepare at least these documents:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` or your own deployment instructions

## Import the image to the intranet server

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Start application

After preparing `docker-compose.yml`, start directly:

```bash
docker compose up -d
docker compose logs -f app
```

If you haven't written a compose file yet, first read [Installation via Docker Compose](./docker-compose.md) and save the examples there locally.

## What to do if you can’t use Docker

If Docker cannot be used in your intranet environment, you can also use `create-nocobase-app` to create a complete project in the external network environment, install dependencies and package it, and then copy the entire project to the intranet server.

This path will be longer, but more practical in environments without container capabilities. The overall process is usually:

1. Create a project in an external network environment and install dependencies.
2. Package the project directory.
3. Copy to the intranet server.
4. Unzip the file on the intranet, complete `.env` and start the application.

## Where to look next

- If you have not confirmed the application configuration, continue to see [Application Environment Variables](./env.md)
- If you are ready to officially open the application to business users, continue to read [Nginx](../production/reverse-proxy/nginx.md) or [Caddy](../production/reverse-proxy/caddy.md)
