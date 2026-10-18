---
title: Application deployment
description: Deploy your application to your own server with PM2 or Docker. Choose a method, then build, start, and verify the application.
sidebar: false
pageName: deployment
---

# Application deployment

Deploy your application to your own server with PM2 or Docker. Choose a method, then build, start, and verify the application.

- [Deploy an application with PM2](#pm2)
- [Deploy an application with Docker](#docker)

## Example environment and access {#deployment-example}

The PM2 and Docker guides use the examples below. Replace the server, deployment directory, and public URL with your own before running the commands.

| Parameter            | Example value                       |
| -------------------- | ----------------------------------- |
| Environment          | `Linux x64 · SQLite`                |
| Deployment directory | `/srv/apps/purchase`                |
| Public URL           | `https://purchase.example.com/main` |
| Proxy upstream       | `127.0.0.1:13000`                   |

### Configure public access {#deployment-access}

1. Point purchase.example.com to the target server and configure a TLS certificate for HTTPS.
2. Configure a reverse proxy on the same server, forwarding to 127.0.0.1:13000 and preserving the /main path.
3. Enable WebSocket support and forward the public host and protocol to the application.

The deployment commands below do not configure DNS, certificates, or a reverse proxy. Complete these settings before verifying public access.

## Deploy an application with PM2 {#pm2}

Build an archive locally, install and update it over SSH with app-installer, and let PM2 manage the application process.

### Use an Agent for PM2 deployment {#pm2-skill}

Install the nocobase-app-installer Skill, start a new Agent session in the application directory, and send the prompt below. Use this Skill for external databases, rollback, and CI/CD as well.

**Local · application project root**

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-app-installer -g
```

**Send to the Agent**

```text
Use the nocobase-app-installer Skill to deploy this application with PM2.
SSH: deploy@server.example.com
Directory: /srv/apps/purchase
Public URL: https://purchase.example.com/main
Database: SQLite
Check the environment and configuration, then deploy and verify.
```

### 1. Prepare the PM2 environment {#pm2-prepare}

Install Node.js 24+ and pnpm locally, and configure SSH access. Install Node.js 24 and tar on the Linux server, then install PM2 (4.3+) as the deployment account:

**Server · deployment account**

```bash
npm install --global pm2
```

Make sure non-interactive SSH sessions can find node and pm2. The deployment account must be able to write to the installation directory and its parent; use a new or empty directory for the first installation.

### 2. Build and install with PM2 {#pm2-install}

**Local · application project root**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

The archive is written to storage/exports/dist.tar.gz. Supply the initial administrator password through the local INITIAL_ADMIN_PASSWORD environment variable, then install:

**Local · application project root**

```bash
npx --yes @nocobase/app-installer@beta install \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --origin https://purchase.example.com \
  --base-path /main \
  --port 13000 --name nocobase-purchase \
  --set-from-env users.initialAdmin.password=INITIAL_ADMIN_PASSWORD \
  --json
```

The installer uploads the archive, generates configuration, runs migrations, and starts the application. These examples use @beta; pin a tested installer version in CI.

### 3. Configure PM2 startup and verify {#pm2-verify}

**Server · deployment account**

```bash
pm2 startup
```

Run the system service command printed by PM2, then save the process list as the same deployment account:

**Server · deployment account**

```bash
pm2 save
```

After configuring HTTPS and the reverse proxy described above, check application status and public access:

**Local · application project root**

```bash
npx --yes @nocobase/app-installer@beta status \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase --json

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

Confirm that status reports result.health.ok as true and result.pending as null, and that the health endpoint returns ok: true. Open the application and verify sign-in.

### Update the PM2 application {#pm2-update}

Rebuild the archive, check status for unfinished operations, then run the upgrade preflight:

**Local · application project root**

```bash
npx --yes @nocobase/app-installer@beta upgrade \
  --ssh deploy@server.example.com \
  --dir /srv/apps/purchase \
  --archive storage/exports/dist.tar.gz \
  --json
```

Review the preflight result, downtime, and backup plan, then repeat the command with --yes to apply the update. Repeat the status and access checks afterward. The installer backs up SQLite and configuration; back up uploads separately. For an external database, back it up first and add --backup-done.

## Deploy an application with Docker {#docker}

Build an image with the Dockerfile included in your application, then run it on the server with configuration and data mounted. Install Docker on both machines and sign in to your image registry.

### Use an Agent for Docker deployment {#docker-skill}

The application already includes the nocobase-deployment Skill. Ask an Agent to use it from the project directory, including for multi-platform builds, offline distribution, and CI/CD.

**Send to the Agent**

```text
Use the nocobase-deployment Skill to deploy this application with Docker.
SSH: deploy@server.example.com
Image: registry.example.com/purchase:release-001
Directory: /srv/apps/purchase
Public URL: https://purchase.example.com/main
Database: SQLite
Check the configuration and data mounts, then deploy and verify.
```

### 1. Build and distribute the Docker image {#docker-build}

**Local · application project root**

```bash
docker build --platform linux/amd64 \
  -t registry.example.com/purchase:release-001 .
docker push registry.example.com/purchase:release-001
```

The Dockerfile installs dependencies and builds the application; no prior pnpm build is needed. Keep Dockerfile.dockerignore alongside it to exclude configuration, secrets, and data. This example targets x64; use linux/arm64 for an ARM64 server.

**Server · deployment account**

```bash
docker pull registry.example.com/purchase:release-001
```

### 2. Prepare Docker configuration and data {#docker-config}

For the first deployment, create dedicated directories and generate a SQLite configuration with unique secrets. The container runs as UID 1000 and needs read and write access to these directories.

**Server · deployment account**

```bash
sudo install -d -o 1000 -g 1000 -m 750 \
  /srv/apps/purchase /srv/apps/purchase/storage

docker run --rm \
  --mount type=bind,src=/srv/apps/purchase,dst=/config \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config init \
  --config /config/config.yml --dialect sqlite
```

Supply the initial administrator password through the server’s INITIAL_ADMIN_PASSWORD environment variable, then write it to the configuration:

**Server · deployment account**

```bash
docker run --rm -e INITIAL_ADMIN_PASSWORD \
  --mount type=bind,src=/srv/apps/purchase/config.yml,dst=/app/config.yml \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config set --from-env \
  users.initialAdmin.password=INITIAL_ADMIN_PASSWORD
```

Keep config.yml and storage/ on the host and reuse them across image updates. The project’s .env is not passed to the container automatically; supply any additional variables with the same -e or --env-file options for configuration checks and startup.

### 3. Start and verify the Docker container {#docker-start}

Check the configuration, then start the container after the check passes:

**Server · deployment account**

```bash
docker run --rm \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001 \
  node dist/cli/index.js config check
```

**Server · deployment account**

```bash
docker run -d --name purchase \
  --init --restart unless-stopped --stop-timeout 60 \
  -p 127.0.0.1:13000:13000 \
  -e APP_PUBLIC_ORIGIN=https://purchase.example.com \
  -e APP_BASE_PATH=/main \
  -v /srv/apps/purchase/config.yml:/app/config.yml:ro \
  -v /srv/apps/purchase/storage:/app/storage \
  registry.example.com/purchase:release-001
```

After configuring HTTPS and the reverse proxy described above, check the container and public access:

**Server · deployment account**

```bash
docker inspect --format '{{.State.Health.Status}}' purchase

curl --fail --silent --show-error \
  https://purchase.example.com/main/api/healthz
```

Wait for the container to become healthy, confirm that the health endpoint returns ok: true, and verify sign-in in the application. To investigate failures, run docker logs --tail 100 purchase.

### Update the Docker application {#docker-update}

Rebuild and push with a new tag, such as release-002, keeping the old image. Pull the new image, repeat the configuration check with its tag, and stop the old container only after the check passes:

**Server · deployment account**

```bash
docker pull registry.example.com/purchase:release-002
```

**Server · deployment account**

```bash
docker stop --timeout 60 purchase
```

While the application is stopped, back up config.yml, storage/, and any external database. After confirming the backup, remove the old container:

**Server · deployment account**

```bash
docker rm purchase
```

Repeat the start command with release-002, keeping the same configuration, data mounts, and environment variables, then repeat the checks. Restarting a container does not update its image. Docker does not back up data automatically; check database compatibility before reverting to an older image.
