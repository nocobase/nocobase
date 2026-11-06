# Deploy an application to Studio

Use this workflow to deploy the current application to an existing NocoBase Studio. Keep application sources and build tools on the development or CI machine; Studio receives the deployment artifact. `pnpm nocobase` builds and maintains the source application, while `nb-studio` manages the destination. The application does not need a business CLI of its own.

## 1. Identify the application and destination

Inspect the application's `package.json`, build configuration and working tree. Record:

- Source directory, package name, version and commit; note uncommitted changes.
- Studio URL, including its mount path, and CLI profile.
- App ID and target environment.
- First installation or update; existing data and storage to preserve.
- Public application URL, database and required external services.

Reuse values already supplied by the user. Ask only for unresolved information that changes the deployment target or data operation. Do not infer the application from a directory name or deploy whichever repository happens to be current after switching workspaces.

For multiple destinations, record each separately. Reuse one artifact only when their runtime requirements match. The Studio URL is the management endpoint; the deployed App's public URL is separate and comes from its environment.

## 2. Prepare the Studio CLI

Check whether `nb-studio` is installed:

```bash
command -v nb-studio
nb-studio --version
```

If missing, obtain the installation command from the target Studio's **Use Studio in your agent** entry. Its command contains a short-lived download token. Use the command that Studio provides; do not invent a token or assume `@nocobase/studio-cli` is published to npm. The install script is served at `<studio-url>/api/agents/dist/installScript`, including the Studio mount path.

The currently served universal CLI package requires Node.js 24 or newer. Follow the installer's prerequisite checks and PATH instructions. A download token installs the CLI; it is not a login credential. Install the CLI once, then use profiles for separate Studio instances.

For a local coding agent, install the CLI's packaged Skill when needed:

```bash
nb-studio skills install
```

Use `--tool codex`, `--tool claude` or `--tool all` when the target tools are known. Read the installed `nb-studio-cli` Skill for command discovery and authentication rules. Inside a Studio agent run, reuse the supplied CLI, Skill and run identity rather than installing another copy or signing in as a person.

## 3. Sign in and inspect the destination

For a person's local deployment, use an explicit profile for every destination:

```bash
nb-studio --profile <profile> login --server <studio-url>
nb-studio --profile <profile> whoami
```

The person must approve the device code in the browser. Never approve it on their behalf. If the existing profile is already authenticated to the correct server, reuse it; inspect its identity before starting another login. A Studio agent run keeps its supplied identity and permission limits.

For CI, use the organization's authorized CI credential through the documented environment variables or stdin mechanism. Keep credentials out of command arguments, logs and deployment reports. A missing or expired credential requires the supported login or credential setup; do not create a key to work around it.

Business commands come from the server. Inspect their documentation before using unfamiliar arguments:

```bash
nb-studio --profile <profile> docs app
nb-studio --profile <profile> docs env
nb-studio --profile <profile> docs deploy
nb-studio --profile <profile> docs release
```

Inspect the existing App and environment before creating or updating them. Determine:

- Whether the environment accepts archives or container images.
- Its target platform and runtime requirements.
- Whether deployment requires approval and what the caller may do.
- Required variables, configuration and available storage, including room for unpacking, retained releases and backups.
- Whether the App is connected to a repository whose commit Studio can verify.

An App Host running inside a container can still be an in-process environment. Do not infer its artifact type from the presence of Docker on the server. Do not select a different environment just to avoid an approval or artifact requirement. For a new App, use the documented creation route appropriate to the chosen upload workflow; repository-backed `app ensure` has repository prerequisites too.

## 4. Build and configure

Follow the parent deployment Skill and the application's build instructions. For a compatible Linux x64 Node.js 24 archive target, for example:

```bash
pnpm build --target linux-x64 --node-version 24 --tar
```

Inspect `storage/exports/dist.tar.gz` and record its SHA256, package identity, version, build target and source revision. The archive carries application code and dependencies, not the development database, secrets or uploaded files. For an image environment, follow its image build, registry and release registration workflow instead; the archive commands below do not deploy an image.

Configure required App or environment variables through Studio's supported interfaces. Preserve existing secrets and data during updates. Initial administrator variables initialize a new account; they do not reset an existing account's password. Follow the application's sample-data setting rather than silently enabling examples.

Before an update, review migrations and establish the database and file backup and restore procedure for this App. Do not assume that Studio's own backup covers every hosted App, or that switching releases restores business data. Required variable declarations may become available only after upload; inspect them then and resolve missing values before deployment.

## 5. Choose the upload and deployment route

### Repository-backed build

When Studio knows the repository and can verify the source commit, use the documented build deployment command for an App that exists in the intended environment:

```bash
nb-studio --profile <profile> deploy \
  --app <app-id> \
  --repository <owner/repo> \
  --sha <source-commit> \
  --file storage/exports/dist.tar.gz \
  --json
```

Outside CI, supply repository and commit explicitly. Do not invent a commit or claim that an artifact from a dirty working tree exactly matches it. `release upload` also uses Studio's verified-build route; it is not a fallback for a missing repository.

### Manual archive without a connected repository

Do not repeatedly retry the verified-build route after `REPOSITORY_NOT_FOUND`. Do not connect a repository merely to bypass this prerequisite. Use Studio's release upload page or the documented application-level upload API within the caller's permissions. Read the target server's authenticated OpenAPI document at `<studio-url>/api/swagger` first.

The current API workflow is:

1. Create an upload ticket with `POST /api/releases/apps/{appId}/uploadTickets`, requesting upload only (`deploy: false`).
2. Upload the archive to the ticket's returned path using the ticket credential as `Authorization: Bearer <ticket>`, with the binary body and content type the API declares. Resolve the returned path against the documented API base; do not assume it already contains `/api` or the Studio mount path.
3. Supply `X-Artifact-SHA256` and `X-Release-Deploy: false` so integrity is checked and deployment remains a separate step.
4. Record the returned Release ID, inspect required variables and complete configuration.
5. Deploy that release through the CLI, or request deployment when approval is required.

Prefix API paths with the Studio URL, including its mount path. Use an authorized authentication mechanism for the ticket request. Do not depend on reading `~/.nb-studio/config.json`: credentials may live in the system keychain, and its storage format is not an integration API. If no supported API credential is available, use the authenticated upload page or obtain the required credential through the supported setup.

The current application-level upload routes are not exposed as ordinary CLI commands. Do not invent a command or describe this route as CLI-only. An upload ticket does not grant permission to bypass a protected environment.

### Existing release

For an unprotected environment:

```bash
nb-studio --profile <profile> app deploy <app-id> \
  --release <release-id> --wait true --json
```

For a protected environment, follow the documented deployment-request flow. A pending approval is not a completed deployment, and approval rules must not be bypassed.

Release and Deployment IDs belong to their Studio instance. Never reuse an ID from another destination, even when both uploaded the same archive.

## 6. Verify and report

Inspect the command's JSON result, deployment status and logs. An accepted upload, created release or timed-out wait does not prove deployment succeeded. After a timeout or uncertain response, inspect existing releases and deployments before retrying. Do not start a competing deployment.

Verify through the public application URL:

- Health endpoint and expected App identity.
- Static assets, page refresh, API requests and WebSocket connections.
- Sign-in and the relevant permission boundary.
- A representative business operation.
- Required data and file persistence, with restart verification when applicable. Prefer the App's restart operation; restarting Studio may interrupt other hosted Apps.

Use the parent Skill's verification guidance for the change being made. Reuse build checks for the same artifact, but verify each destination independently and report partial success explicitly. Keep external services or scheduled behavior that were not exercised separate from successful checks.

Record the destination, App and environment, artifact SHA256, source revision, Release ID, Deployment ID, public URL, verification results and unresolved items. Never include credentials. Do not report a deployment as complete while it is awaiting approval, still running, or failing its required verification.
