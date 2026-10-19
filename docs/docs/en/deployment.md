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

Deploy your local application to an existing NocoBase Studio instance, which manages its configuration, runtime, and releases. The manual steps below use an in-process environment that accepts archives and an application whose source repository Studio can determine. The Studio management URL and the deployed application’s public URL are different.

### Deploy to Studio with an Agent {#studio-skill}

Open your coding agent in the local application project directory and use the project’s nocobase-deployment Skill. It includes deployment to an existing Studio instance. The agent reads the project’s build instructions and the command documentation provided by the target Studio.

For the first connection, open Use Studio in your agent from the target Studio’s avatar menu and give the agent the complete setup instructions. Check the verification code and approve sign-in yourself in the browser. Reuse an existing CLI installation and authenticated connection after confirming that it points to the target Studio.

Replace the Studio URL, application ID, and environment ID below before sending. Include any requirements for initial data, data to preserve during an update, or external services such as a database.

**Send to your local coding agent**

```text
Use the nocobase-deployment Skill to deploy the current project to an existing NocoBase Studio instance.

Studio URL: https://studio.example.com/studio
Application ID: purchase
Environment ID: preview

Reuse the CLI connection for this Studio and verify the current project, target application, and environment.
Build for the target runtime, then use nb-studio to upload and deploy that build.
For an update, preserve existing configuration, the database, and uploaded files, and establish the backup and restore plan first.
Read the project and Studio for the information you need. If the data source, required configuration, or CLI upload prerequisites remain unclear, list what you need from me.
If approval is required, submit a deployment request and return its approval link and current status.
After deployment succeeds, verify application access, sign-in, and main workflows. Return the application URL, deployed version, and verification results, noting any incomplete checks.
```

### 1. Install the CLI {#studio-cli}

Run the commands below in a Bash terminal on your local computer, using macOS, Linux, or Windows WSL. If nb-studio already runs, continue to sign-in. Otherwise, sign in to the target Studio, open Use Studio in your agent from the avatar menu, and copy its CLI installation command. The download token is valid for 30 minutes. The example below shows the format only; use the complete command generated by your Studio.

**Local · Bash terminal**

```bash
curl -fsSL https://studio.example.com/studio/api/agents/dist/installScript \
  | sh -s -- --token '<download-token>'
```

Studio supplies nb-studio; it is not installed with npm install -g @nocobase/studio-cli. One CLI installation can connect to several Studio instances. By default, the command is in ~/.local/bin. Add it to the current terminal’s PATH and check the installation:

**Local · Bash terminal**

```bash
export PATH="$HOME/.local/bin:$PATH"
nb-studio --version
```

If a new terminal cannot find nb-studio, add the PATH setting above to your shell’s startup file.

### 2. Sign in to Studio {#studio-login}

The examples use the studio profile to store this instance’s connection. Use a different profile for each Studio instance. Replace the URL while preserving its deployment path, such as /studio. For an existing authenticated connection, use whoami to check the server, identity, and permissions. Run login only for the first connection or after the session expires.

**Local · Bash terminal**

```bash
nb-studio --profile studio login \
  --server https://studio.example.com/studio
nb-studio --profile studio whoami --json
```

login displays a sign-in URL and verification code for you to check and approve in your browser. Business commands come from the target Studio instance. If a command or flag differs, consult that instance’s documentation with nb-studio --profile studio docs.

### 3. Select the application {#studio-app}

This example uses the purchase application and preview environment; replace them with your IDs. Inspect both and confirm that any existing application belongs to the intended deployment environment:

**Local · Bash terminal**

```bash
nb-studio --profile studio env list --json
nb-studio --profile studio env get preview --json
nb-studio --profile studio app get purchase --json
```

Confirm that the environment accepts archives and identify its operating system, CPU architecture, Node.js version, and approval requirements. An environment that accepts images needs the image release workflow. Studio or App Host running inside Docker does not by itself mean that the environment requires an image.

For a first deployment, create the application only after confirming that it does not exist, the environment is correct, and your account has permission to create it:

**Local · Bash terminal**

```bash
nb-studio --profile studio app create purchase \
  --name "Purchase" --env preview --json
```

Check the source repositories associated with the application:

**Local · Bash terminal**

```bash
nb-studio --profile studio build repo list --app-id purchase --json
```

The CLI upload below requires Studio to determine the repository and verify the commit. Creating an application does not establish that association. An empty list can also mean that the current identity cannot see the associated project; check this before continuing. Archives without a connected repository use the web or application upload API workflow described in the Skill, rather than the CLI upload example below.

### 4. Build locally {#studio-build}

Work from the application project root, following its declared pnpm version and build instructions. Review working-tree changes and ensure that the source being built matches a pushed commit that Studio can verify; record its full SHA. Before updating an existing application, review migration and configuration changes, back up the database and files, and confirm how to restore them.

**Local · app project root · Bash**

```bash
git status --short
git rev-parse HEAD
pnpm install --frozen-lockfile
```

Run the type checks, tests, and lint scripts that the project defines before building for the target platform. This example uses Linux x64 and Node.js 24; use the settings required by the actual environment:

**Local · app project root · Bash**

```bash
pnpm build --target linux-x64 --node-version 24 --tar
tar -tzf storage/exports/dist.tar.gz | head -30
```

The archive is storage/exports/dist.tar.gz and contains dist/ and config.example.yml. Check the application name, version, target platform, and archive SHA256. It does not carry the local database, secrets, or uploaded files. Starting with a new database and migrating existing business data are separate operations.

### 5. Upload the archive {#studio-upload}

Upload with your signed-in profile; Studio determines the repository from the target application’s association. Replace the placeholder after --sha with the full commit SHA used for this build. Start by reading the upload command documentation from the target Studio:

**Local · app project root · Bash**

```bash
nb-studio --profile studio docs release upload
```

**Local · app project root · Bash**

```bash
nb-studio --profile studio release upload \
  --app purchase \
  --sha '<commit-sha>' \
  --file storage/exports/dist.tar.gz \
  --json
```

The CLI obtains an upload ticket and transfers the file. Confirm that the command succeeded and result.data.release is present, then record result.data.release.id. Use that release ID for both configuration checks and deployment. Uploading does not start the application. If superseded is true, rebuild from the latest intended commit.

If the upload response is uncertain, list the releases and compare their source revision and archive checksum before deciding whether to retry:

**Local · app project root · Bash**

```bash
nb-studio --profile studio release list purchase --json
```

### 6. Deploy {#studio-deploy}

Replace the release ID in the commands with the version uploaded in this run. Check its required configuration and reuse existing application or environment values. Resolve missing: true entries through the Variables page in Studio. Values that cannot be determined need to come from the application owner.

**Local · app project root · Bash**

```bash
nb-studio --profile studio app env list purchase \
  --release '<release-id>' --json
```

Preserve the existing database, file storage, and secrets. Initial administrator settings initialize an account; they do not reset an existing account’s password. Enable sample data only when appropriate for the application. For an unprotected environment, deploy the uploaded version:

**Local · app project root · Bash**

```bash
nb-studio --profile studio app deploy purchase \
  --release '<release-id>' \
  --wait true --json
```

--wait true waits for up to about 100 seconds. If the deployment remains queued or deploying, continue checking that deployment. Inspect deployment records before retrying an uncertain response. For a protected environment, submit the request below and wait for an approver:

**Local · app project root · Bash**

```bash
nb-studio --profile studio deploy request purchase \
  --release '<release-id>' --json
```

Record the request ID, approval link, and current status. Pending approval means deployment is incomplete; verify the new version after approval and successful deployment.

### 7. Check status and error logs {#studio-verify}

Find the deployment record for this release and confirm that its status is succeeded, then check the application state and runtime logs:

**Local · app project root · Bash**

```bash
nb-studio --profile studio deploy list purchase --limit 5 --json
nb-studio --profile studio app get purchase --json
nb-studio --profile studio app logs purchase --level error --json
```

Use the deployment ID returned by deploy list to inspect its exact status and deployment logs. deploy logs covers the deployment process; app logs covers the running application:

**Local · app project root · Bash**

```bash
nb-studio --profile studio deploy get purchase '<deployment-id>' --json
nb-studio --profile studio deploy logs purchase '<deployment-id>' --json
```

Confirm that currentVersion matches the uploaded release’s version and runtime.state is running. Use result.data.url from app get as the application’s public URL. Check ok and the application identity at /api/healthz under that URL’s base path, then verify page refresh, static assets, sign-in and permissions, and a main business operation. Check uploads and downloads when the application uses file storage.

View any generated initial administrator credentials yourself under Initial administrator on the application’s Overview tab in Studio. Record the public URL, source revision, release ID, deployment ID, and check results. For storage changes, restart that application and verify that records and files remain available. Clearly mark any verification that is incomplete.

### Update an application on Studio {#studio-update}

Before an update, review migration and configuration changes, back up this application’s database and uploaded files, and confirm the restore procedure. Preserve its configuration, secrets, and storage, then build, upload, and deploy the new release ID. Variable-only changes can redeploy the current release. Switching to an older release does not restore the database or business data; check compatibility before rolling back.

When deploying to several Studio instances, set each instance’s address and profile, then upload, deploy, and verify separately. Release IDs belong to the instance receiving the upload and cannot be reused on another instance. Sign in again with the new URL if a Studio address changes.
