---
title: Application deployment
description: Deploy to your own server with PM2 or Docker, or deploy to NocoBase Studio. Choose a method and use an Agent or follow the manual steps.
sidebar: false
pageName: deployment
---

# Application deployment

Deploy to your own server with PM2 or Docker, or deploy to NocoBase Studio. Choose a method and use an Agent or follow the manual steps.

- [Deploy an application with PM2](#pm2)
- [Deploy an application with Docker](#docker)
- [Deploy to NocoBase Studio](#studio)

## PM2 / Docker example environment and access {#deployment-example}

The PM2 and Docker guides use the examples below. Replace the server, deployment directory, and public URL with your own before running the commands. Studio deployments use an environment configured by an administrator and the URL shown on the target App page.

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

Confirm that status reports result.health.ok as true and result.pending as null, and that the health endpoint returns ok: true. Open the application and verify sign-in. Also check page refresh, sign-in and permissions, and a main business operation. Verify uploads and downloads when file storage is used, and persistence after restart when storage changes.

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

Wait for the container to become healthy, confirm that the health endpoint returns ok: true, and verify sign-in in the application. To investigate failures, run docker logs --tail 100 purchase. Also check page refresh, sign-in and permissions, and a main business operation. For persistence configuration changes, confirm that the database and uploaded files survive container recreation.

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

## Deploy to NocoBase Studio {#studio}

Follow these steps to build, upload, and deploy your local application to an existing NocoBase Studio. Run all commands on your local computer. The target environment must accept archives, and Studio must be able to determine the application’s source repository and verify its commit.

### Deploy to Studio with an Agent {#studio-skill}

Open your coding agent in the application project directory, replace the URL and IDs below, and send the prompt. For the first connection, give the agent the setup instructions from Use Studio in your agent in Studio’s avatar menu, then approve sign-in in your browser.

**Send to your local coding agent**

```text
Use the nocobase-deployment Skill to deploy the current project to NocoBase Studio.

Studio URL: https://studio.example.com/studio
Application ID: purchase
Environment ID: preview

Reuse the existing CLI connection, then build, upload, and deploy.
Preserve existing configuration and data during updates; ask me for any missing required information.
Check deployment status, error logs, and application access. Return the application URL and verification results.
If approval is required, submit a request and report its current status.
```

### 1. Install the CLI {#studio-cli}

Open Use Studio in your agent from Studio’s avatar menu. Copy its CLI installation command and run it in a local Bash terminal. Use the complete command generated by the page; the example below only shows its format. Skip installation if the CLI is already available.

**Local · Bash terminal**

```bash
curl -fsSL https://studio.example.com/studio/api/agents/dist/installScript \
  | sh -s -- --token '<download-token>'
```

After installation, check that the command is available:

**Local · Bash terminal**

```bash
export PATH="$HOME/.local/bin:$PATH"
nb-studio --version
```

### 2. Sign in to Studio {#studio-login}

Replace the URL with your Studio URL, including its deployment path such as /studio. This guide names the local connection studio. If you are already signed in to the intended Studio, go directly to whoami to check the connection.

**Local · Bash terminal**

```bash
nb-studio --profile studio login \
  --server https://studio.example.com/studio
```

Check the verification code and approve sign-in in your browser, then check your identity:

**Local · Bash terminal**

```bash
nb-studio --profile studio whoami --json
```

### 3. Select the application {#studio-app}

List the applications and find the ID of the application to deploy:

**Local · Bash terminal**

```bash
nb-studio --profile studio app list --json
```

The following commands use purchase; replace it with your chosen application ID. If you do not have an application yet, create one under Release management → Apps in Studio, select an environment that accepts archives, and complete the source association required for upload.

### 4. Build locally {#studio-build}

Run these commands from the local application project root. This example targets Linux x64 and Node.js 24; adjust the build options for your environment:

**Local · app project root · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar
```

The deployment archive is generated at storage/exports/dist.tar.gz.

### 5. Upload the archive {#studio-upload}

Upload the archive using the connection from step 2. Replace <commit-sha> with the full commit SHA used for this build, which Studio must be able to verify:

**Local · app project root · Bash**

```bash
nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

Confirm that result.data.superseded is false and result.data.release is present, then copy result.data.release.id for the next step. Uploading does not deploy the application.

### 6. Deploy {#studio-deploy}

Replace <release-id> with the ID returned above, then check the required configuration:

**Local · Bash terminal**

```bash
nb-studio --profile studio app env list purchase \
  --release '<release-id>' --json
```

If any entries show missing: true, fill them in on the application’s Variables tab in Studio. For an unprotected environment, deploy with:

**Local · Bash terminal**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

If the environment requires approval, submit a deployment request instead and check the result after approval:

**Local · Bash terminal**

```bash
nb-studio --profile studio deploy request purchase \
  --release '<release-id>' --json
```

--wait true waits for up to about 100 seconds. If deployment is still queued, in progress, or awaiting approval, continue checking as described in step 7.

### 7. Check status and error logs {#studio-verify}

Check the deployment record, application status, and error logs:

**Local · Bash terminal**

```bash
nb-studio --profile studio deploy list purchase --limit 5 --json
nb-studio --profile studio app get purchase --json
nb-studio --profile studio app logs purchase --level error --json
```

Find the deployment whose releaseId matches this upload. Confirm that status is succeeded and app.currentDeploymentId from app get matches its id. Open result.data.url to verify sign-in and the main workflows. For an application that starts on demand or is dormant, visit it first to wake it, then confirm runtime.state is running.

Initial administrator credentials generated by Studio are available on the application’s Overview tab while they are retained and have not been dismissed.

### Update an application on Studio {#studio-update}

Keep the existing application ID, configuration, and storage. Back up the database and uploaded files before updating.

Rebuild and upload the archive, replacing <commit-sha> with the full commit SHA for the updated source. Uploading the same application and SHA again reuses its existing release; use a new source commit for changed build content:

**Local · app project root · Bash**

```bash
pnpm install --frozen-lockfile
pnpm build --target linux-x64 --node-version 24 --tar

nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

After confirming that the upload returned a valid release, replace <release-id> with result.data.release.id. Complete required configuration as in step 6. Run the command below for an unprotected environment; submit a deployment request instead if approval is required.

**Local · app project root · Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' --wait true --json
```

After deployment, follow step 7 to confirm that this deployment succeeded and check error logs, sign-in, and the main workflows.
