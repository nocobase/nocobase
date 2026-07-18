---
title: "Light extensions"
keywords: "Light extensions,GitHub sync,RunJS,NocoBase"
displayName: "Light extensions"
packageName: '@nocobase/plugin-light-extension'
description: |
  Create RunJS light extensions, upload trusted custom frontend applications, and manage GitHub source synchronization.
isFree: true
builtIn: true
defaultEnabled: false
editionLevel: 0
---

# Light extensions

Light extensions organize multi-file RunJS source into reusable blocks, fields, actions, and other entries. You can create one from the built-in template, a ZIP file, or GitHub.com, then continue to Pull or Push its source.

Synchronization works with source snapshots. NocoBase keeps local versions and a synchronization baseline, but it does not mirror the complete GitHub commit history.

## Before you start

Enable the Light extensions plugin in the plugin manager. If you need to access a private repository or Push to GitHub, also enable [Variables and secrets](../plugin-environment-variables/index.md).

Store the GitHub token in Variables and secrets with the variable type set to `secret`. An ordinary variable cannot be used as a synchronization credential.

Use a GitHub fine-grained personal access token and grant access only to the target repository:

- Pull only: set Contents under Repository permissions to Read-only
- Push: set Contents under Repository permissions to Read and write

The token value is never stored in the light-extension configuration or returned by the synchronization API. The light extension stores only an `authRef` such as `{{ $env.GITHUB_SYNC }}`, and the UI masks part of the variable name when displaying it again.

:::tip Public repositories can be pulled anonymously

Without a token, NocoBase can still test and Pull a public repository anonymously. Private Pull and every Push that requires authentication return credential unavailable.

If Variables and secrets is disabled, anonymous access can still be attempted. You cannot select a Token secret or complete an operation that requires credentials.

:::

## Create a light extension

Go to "Plugin settings / Light extensions" and click "Add new". Enter the name, title, and description, then choose a source.

<!-- Add a screenshot of the Create light extension dialog showing Template, ZIP file, and GitHub source. -->

### Create from the template

Choose "Template", then click "Create". NocoBase creates the default source, validates its entries, and builds the runtime artifacts.

### Create from a ZIP file

Choose "ZIP file", upload the source archive, then click "Create". NocoBase validates paths, file counts, file sizes, UTF-8 content, duplicate paths, and other archive safety limits before creating and compiling the light extension.

ZIP import does not connect a remote repository. To add GitHub synchronization later, click "Sync code" in the light-extension list and configure a source.

### Create from GitHub

Choose "GitHub source", then complete these fields:

- "GitHub repository" — accepts `owner/repository` or `https://github.com/owner/repository`
- "Branch" — leave empty to use the remote default branch
- "Subdirectory" — leave empty to synchronize the repository root
- "Token secret" — optional for public repositories; select an existing `secret` variable for private repositories

When you click "Create", NocoBase checks the repository, branch, subdirectory, and credential, pulls the remote snapshot, validates and compiles the source, and establishes the initial synchronization baseline.

When GitHub already contains the source of truth, prefer "Create from GitHub". This avoids an ambiguous initial binding between two different non-empty snapshots.

## Configure synchronization for an existing light extension

Find the record in the light-extension list and click "Sync code". The first time, enter the GitHub repository, branch, subdirectory, and optional "Token secret".

<!-- Add a screenshot of the Sync code drawer showing GitHub configuration, Test connection, and Configure. -->

Click "Test connection" first, then click "Configure". After configuration, reopening "Sync code" automatically creates the latest Plan and shows the local Head, remote revision, and synchronization state.

The Plan pins the local Head, remote revision, and remote configuration version reviewed for this operation. If either side changes before Pull or Push, the operation stops. Reopen or refresh "Sync code" to get a new Plan, then try again.

## Pull, Push, and disconnect

"Sync code" enables only the operations allowed by the current Plan:

- "Pull from Git" gives the remote snapshot to the light-extension validator and compiler, then updates the local Head and runtime artifacts in one local transaction
- "Push to Git" publishes the current local snapshot to GitHub only when the remote revision still matches the Plan
- "Disconnect" disables the synchronization source and clears its credential reference without deleting local light-extension source, GitHub content, or the internal baseline; reconnecting the same target can reuse that baseline

Push requires confirmation. The first release never force-pushes. If the remote branch changed, NocoBase stops and asks you to refresh the Plan.

## Understand synchronization states

| State | Meaning | Next step |
| --- | --- | --- |
| In sync | Local and remote snapshots match | No action is needed |
| Local changes | Local has a new version and remote still matches the last baseline | Use "Push to Git" |
| Remote changes | Remote has a new version and local still matches the last baseline | Use "Pull from Git" |
| Diverged | Local and remote both changed from the last synchronization baseline | Resolve the source manually outside this screen, then return one side to a safe synchronization state |
| Initial sync needs a clear source | Both sides contain different non-empty content during the first binding | Create the light extension from GitHub, or use an empty branch or subdirectory for the first synchronization |

NocoBase does not merge automatically or choose one side when the state is `Diverged`. Export or copy both snapshots, merge them in a local editor, then save the same reviewed snapshot on both sides through "Edit code" and GitHub. Reopen "Sync code" to inspect the Plan. If you cannot make both sides identical, disconnect and use "Create from GitHub" or an empty target to establish an explicit baseline.

## Host a custom frontend application

A **custom frontend application** is an already-built browser application uploaded to a light extension. Multi-portal can expose the application at a workspace URL while keeping the existing NocoBase login, role, and API permission checks.

:::warning Trusted same-origin code

Only administrators should upload a custom frontend package. Its HTML and JavaScript run as trusted same-origin code and can use the current user's NocoBase session. This feature does not provide an untrusted-code sandbox.

:::

### Prepare the ZIP package

The ZIP root must contain `entry.json`. A minimal package looks like this:

```text
entry.json
index.html
assets/
  app.js
  app.css
  logo.png
```

Use `schemaVersion: 1`. The stable lowercase `key` must match `^[a-z0-9][a-z0-9-]{0,62}$`. The `entry` field is optional and defaults to `index.html`.

```json
{
  "schemaVersion": 1,
  "key": "customer-console",
  "title": "Customer console",
  "entry": "dist/application.html"
}
```

`dirname(entry)` is the static root. If `entry` is `dist/application.html`, only files under `dist/` are hosted, and `application.html` becomes the application entry document.

Use relative asset URLs such as `./assets/app.js` or `assets/app.css`. Root-absolute URLs such as `/assets/app.js` are not supported in the first release because they point to the NocoBase deployment root instead of the workspace.

### Build a minimal package with Vite

The following steps use Vite's vanilla TypeScript template. React, Vue, and other templates have the same packaging requirements.

Create the project and install its dependencies:

```bash
npm create vite@latest customer-console -- --template vanilla-ts
cd customer-console
npm install
```

Configure `vite.config.ts` to generate relative asset URLs:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
```

Without `base: './'`, Vite generates root-absolute `/assets/*` URLs that cannot load from a workspace path.

Create `public/entry.json` in the project:

```json
{
  "schemaVersion": 1,
  "key": "customer-console",
  "title": "Customer console",
  "entry": "index.html"
}
```

Vite copies files from `public/` to the `dist/` root. Build and package the application:

```bash
npm run build
cd dist
zip -r ../customer-console.zip .
unzip -t ../customer-console.zip
```

The final ZIP root must contain at least:

```text
entry.json
index.html
assets/
```

Files such as favicons copied from `public/` are also included, which is expected. Extract and inspect the ZIP once before uploading it. Do not wrap the `dist/` directory itself in the ZIP, and do not upload the complete Vite source project.

### Upload and replace the current application

Open "Plugin settings / Light extensions", find the target light extension, and click "Custom frontend". Upload the ZIP package and confirm the application information before saving.

Uploading another package with the same `key` replaces the current content without changing the Entry ID, so an existing Multi-portal binding keeps working. If validation or storage fails, the previous content remains available.

Only the current content is exposed. There is no release list, publish step, version history, rollback, or online build process.

The mechanical upload limits are:

| Item | Limit |
|---|---|
| Compressed ZIP | 50 MiB |
| Files | 2,000 |
| One uncompressed file | 25 MiB |
| Total uncompressed data | 200 MiB |
| Compression ratio | 100:1 |
| `entry.json` | 128 KiB |

The upload also rejects traversal paths, absolute paths, backslashes, links, special device entries, duplicate paths, and case-insensitive path collisions.

### Bind the application to Multi-portal

Enable [Multi-portal](../plugin-multi-portal/index.md), create or edit a workspace, then set "Frontend type" to "Custom frontend" and select the uploaded application.

The workspace URL becomes the application's base URL. NocoBase inserts the correct HTML `<base>` value at response time, so root navigation and history-router deep links can load the same relative assets.

### Call NocoBase APIs

The application can use native `fetch` or `@nocobase/sdk/client`. Keep requests on the same origin so the browser sends the existing login cookies.

For a GET request with native `fetch`:

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';

const response = await fetch(`${apiBase.replace(/\/$/, '')}/orders:list`, {
  credentials: 'same-origin',
});
```

Every HTTP method other than GET, HEAD, and OPTIONS must copy the readable CSRF cookie into the `X-CSRF-Token` header. The cookie name is `nb_csrf_token_<appName>`; the main application uses `main`, while a sub-application name can be read from the injected API base URL.

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';
const appNameMatch = apiBase.match(/\/__app\/([^/]+)/);
const appName = appNameMatch ? decodeURIComponent(appNameMatch[1]) : 'main';
const csrfToken = document.cookie
  .split(';')
  .map((item) => item.trim())
  .find((item) => item.startsWith(`nb_csrf_token_${appName}=`))
  ?.split('=')
  .slice(1)
  .join('=');

await fetch(`${apiBase.replace(/\/$/, '')}/orders:create`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': decodeURIComponent(csrfToken) } : {}),
  },
  body: JSON.stringify({ title: 'New order' }),
});
```

Use an SDK version that matches the NocoBase version. Replace the example version below with the current NocoBase version, then bundle the SDK with the application:

```bash
NOCOBASE_VERSION=2.2.0-beta.15
npm install "@nocobase/sdk@${NOCOBASE_VERSION}"
```

When developing from a NocoBase source checkout before that version is published, install the current source package directly:

```bash
npm install /path/to/nocobase/packages/core/sdk
```

The SDK reads the injected API base URL and applies the existing cookie and CSRF behavior:

```ts
import { createClient } from '@nocobase/sdk/client';

const client = createClient();

const response = await client.request({
  url: 'orders:list',
  method: 'get',
});
```

Workspace permission and data API permission are separate. Opening the workspace only proves that the current role can load the frontend application. Every API request still passes through the collection, resource, field, and role permissions configured in NocoBase.

### Troubleshoot hosted applications

| Status | What to check |
|---|---|
| `404` | Check the requested relative path, `entry.json.entry`, and whether a missing request is a document navigation or a JS/CSS/image request |
| `403` | Check the user's workspace role permission and the target API's own data permission |
| `503` | Check whether Light extensions is enabled, the repository is enabled, the Entry still exists, and the current asset set is complete |

An unauthenticated document request redirects to the NocoBase v2 sign-in page and returns to the original workspace URL after sign-in. An unauthenticated asset request returns `401` instead of HTML.

## Common errors

### Credential unavailable

Check that Variables and secrets is enabled, the variable exists, its type is `secret`, and its current value is not empty. Ordinary variables and partial expressions are rejected.

### Authentication failed or insufficient permission

Check whether the token expired, whether it has access to the correct repository, and whether its Contents permission is sufficient. Pull requires at least Read-only; Push requires Read and write.

### Branch protection

GitHub branch protection or a ruleset can prevent the token identity from updating the target branch. Allow that identity in the rule or use a writable branch. NocoBase does not bypass protection rules or force-push.

### Rate limit reached

Wait for the GitHub rate limit to reset before running "Test connection", Pull, or Push again. Repeated retries do not bypass the limit.

### Remote source changed

GitHub received a new commit after the Plan was created, or the remote configuration version changed. Reopen "Sync code" for a new Plan before deciding whether to Pull or Push.

### Another sync operation is in progress

While a synchronization job is `pending`, `running`, or `finalize-pending`, configure, disconnect, archive, and delete return busy. Wait for the job or recovery process to finish, then retry the original operation. Do not modify internal synchronization tables to bypass this protection.

## First-release limits

The first release supports GitHub.com over HTTPS, one branch, and one optional subdirectory. It does not support:

- GitHub Enterprise, GitLab, or other providers
- SSH, Git LFS, or submodules
- Webhooks, schedules, or automatic synchronization
- Automatic merging, automatic conflict resolution, or force push
- Complete Git history mirroring

## Related links

- [Variables and secrets](../plugin-environment-variables/index.md) — create the `secret` token used for synchronization
- [Multi-portal](../plugin-multi-portal/index.md) — bind a custom frontend application to a workspace URL
