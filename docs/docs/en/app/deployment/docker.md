---
title: 'Standalone: Docker'
description: Build an image with the application's own Dockerfile and run it with persistent storage, without Hub.
---

# Standalone: Docker

To run Hub itself in a container, read [Deploy Hub](./hub). This page builds an image from source with the application's own Dockerfile; database and persistent directory settings are in [Production configuration](./configuration).

## 1. Build the image

The application root ships a `Dockerfile` and a `Dockerfile.dockerignore`. The image runs `pnpm build` from source inside the container, and its runtime layer holds only `dist/` and `config.example.yml`; `config.yml`, `.env`, `storage/` and `node_modules` never enter the build context. From the application root, run:

```bash
docker build -t crm:release-001 .
```

The image is not tied to a mount path: it serves at `/main`, and `docker run -e APP_BASE_PATH=/crm` mounts it elsewhere, which the container health check follows. Settings in `.env` are not carried into the image; supply the variables you need as container environment variables at runtime.

The build stage runs on the build machine's own architecture and fetches the target platform's native modules through `pnpm build --target`, so building for another architecture compiles nothing under emulation, for example `docker buildx build --platform linux/amd64,linux/arm64 ...`. The runtime image is based on Debian bookworm with Node 24 and cannot be swapped for an Alpine base.

If `dist/` is already built on your machine, skip the build inside the image and package it directly. Build it for the image's platform, then pass `DIST=prebuilt`:

```bash
pnpm build --target linux-x64
docker build --platform linux/amd64 --build-arg DIST=prebuilt -t crm:release-001 .
```

`--target` and `--platform` must name the same architecture: without `--platform`, Docker builds for the machine it runs on, which on Apple silicon is `linux/arm64`. The image build checks `dist/`: it must have been built for `linux`, glibc, the image's architecture and Node 24, by an `@nocobase/app-cli` whose builds are not tied to a mount path; otherwise the build fails and says why. `pnpm build` writes server variables from local `.env` files into `dist/.env`, which can include `DB_PASSWORD`; that file never enters the image. One `dist/` covers one architecture, so a multi-platform image has to be built from source.

If the application was created with `pnpm create @nocobase/app` before these files existed, copy `Dockerfile` and `Dockerfile.dockerignore` from a newer version of the same template. Use them together: without `Dockerfile.dockerignore`, local configuration and data enter the build context.

## 2. Prepare the runtime configuration

Create a dedicated directory on the server holding `compose.yml`, the target environment's `config.yml` and `storage/`. Configure the secrets as described in [authentication and session secrets](./configuration#configure-authentication-and-session-secrets), but point the SQLite path at `/app/storage/database.sqlite` inside the container. Make sure the runtime user can write to `storage`; the image runs as the `node` user, and `docker run --rm --entrypoint id crm:release-001` prints its UID and GID.

The image does not include pnpm. To run an application command in a container, call `node dist/cli/index.js` directly, for example to check the configuration:

```bash
docker run --rm -v ./config.yml:/app/config.yml:ro crm:release-001 node dist/cli/index.js config check
```

## 3. Write the Compose file

Create `compose.yml` in the deployment directory:

```yaml
services:
  crm:
    image: crm:release-001
    restart: unless-stopped
    init: true
    stop_grace_period: 60s
    ports:
      - '127.0.0.1:13000:13000'
    environment:
      APP_PUBLIC_ORIGIN: https://apps.example.com
      NOCOBASE_STRICT_STARTUP: 'true'
    volumes:
      - ./config.yml:/app/config.yml:ro
      - ./storage:/app/storage
```

The image already sets `NODE_ENV=production`, `APP_CONFIG_FILE=/app/config.yml`, `APP_SERVER_HOST=0.0.0.0`, `APP_SERVER_PORT=13000` and the build-time `APP_BASE_PATH`, and carries a health check against `<APP_BASE_PATH>/api/healthz`. `init: true` forwards stop signals to the Node process; `NOCOBASE_STRICT_STARTUP` makes a container that fails to start exit, so `restart: unless-stopped` retries it.

## 4. Start the service

Before starting, confirm `config.yml` exists and is a file, or Docker creates a directory at the missing bind path. In the deployment directory run:

```bash
docker compose config --quiet
docker compose up -d
docker compose ps
docker compose logs --tail=100 crm
```

If the image was built on another machine, move it to the server through your own registry or with save/load. Inside the container, the database host cannot be the host machine's idea of `localhost`.

## Public access and acceptance

Configure the public address as described in [HTTPS and reverse proxy](./configuration#https-and-reverse-proxy), then follow [Initialize and verify](./standalone#initialize-and-verify) to change the administrator password, verify real business operations and confirm data survives a restart.

## Update and recovery

Use a new image tag or digest and keep the existing configuration and `storage` mounts. Back up and check migration compatibility before releasing, update `image`, run `docker compose up -d`, and verify real business operations again. See [Update and roll back](./standalone#update-and-roll-back) and [Backup and recovery](./operations#backup-and-recovery).
