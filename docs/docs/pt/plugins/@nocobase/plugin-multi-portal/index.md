---
title: "Multi-portal"
keywords: "Multi-portal,Plugin,NocoBase"
displayName: "Multi-portal"
packageName: '@nocobase/plugin-multi-portal'
supportedVersions:
  - 2.x
description: |
  Create workspace entry points backed by NocoBase layouts or trusted custom frontend applications.
isFree: false
builtIn: false
defaultEnabled: false
editionLevel: 2
---

# Multi-portal

**Multi-portal** provides multiple workspace entry points for one NocoBase application. Each workspace has its own access path and role permissions, and can use either a NocoBase layout or a custom frontend application uploaded through Light extensions.

## Before you start

Enable Multi-portal and the UI layout plugin. To use a custom frontend, also enable [Light extensions](../plugin-light-extension/index.md) and upload a client application package first.

:::warning Trusted same-origin code

A custom frontend runs as trusted same-origin HTML and JavaScript. Only bind packages reviewed and uploaded by administrators. Workspace permission does not turn the package into an untrusted-code sandbox.

:::

## Create a workspace

Go to "Plugin settings / Multi-portal" and click "Add Multi-portal". Configure the title, UID, access path, frontend type, and enabled state.

The access path must start with `/` and cannot be `/`, contain a wildcard, query, or hash. NocoBase derives the route name from the first path segment.

### Use a NocoBase layout

Select "NocoBase Layout", then choose an enabled desktop or mobile layout. Existing layout workspaces keep their layout, menu, route, and role behavior.

### Use a custom frontend

Select "Custom frontend", then choose an available application uploaded through Light extensions.

Multi-portal stores the application Entry ID. Replacing the uploaded package with the same `key` keeps the binding, while switching the workspace back to a NocoBase layout removes the client-app reference.

If the application is unavailable, the list shows one of these stable states:

| State | Meaning |
|---|---|
| Ready | The repository, Entry, and current assets are available |
| Repository disabled | The light-extension repository is disabled |
| Repository archived | The light-extension repository is archived |
| Entry missing | The bound Entry no longer exists or is unhealthy |
| Assets missing | The Entry exists, but its current asset set is incomplete |
| Provider unavailable | Light extensions is disabled or unavailable |

Use "Repair" to open Light extensions and correct the repository, Entry, or upload. Multi-portal does not silently fall back to a NocoBase layout.

## Configure workspace access

When authentication check is enabled, an unauthenticated document request goes to the NocoBase v2 sign-in page and returns to the original workspace URL after sign-in. An unauthenticated JS, CSS, image, font, or WASM request returns `401` instead of a sign-in document.

Grant workspace access to the required roles in the Multi-portal permission settings. A signed-in user without workspace permission receives `403`.

If authentication check is disabled, the workspace document and assets are public. This setting does not make NocoBase data APIs public.

## Understand workspace and data permissions

Workspace permission only controls whether a role can load the workspace frontend. API requests still pass through the normal NocoBase resource and data ACL checks.

For a same-origin GET request, the custom frontend can use native `fetch`:

```js
const apiBase = window.__nocobase_api_base_url__ || '/api/';

const response = await fetch(`${apiBase.replace(/\/$/, '')}/orders:list`, {
  credentials: 'same-origin',
});
```

Every HTTP method other than GET, HEAD, and OPTIONS needs the application-scoped CSRF cookie in the `X-CSRF-Token` header:

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

Bundle the SDK with the application as a project dependency:

```bash
yarn add @nocobase/sdk
```

`@nocobase/sdk/client` reads the injected API base URL and applies the existing cookie and CSRF behavior:

```ts
import { createClient } from '@nocobase/sdk/client';

const client = createClient();

await client.request({
  url: 'orders:list',
  method: 'get',
});
```

Changing the current role changes API permissions in the same way as the standard NocoBase UI. Access to one workspace never bypasses collection, field, action, or record permissions.

## URL and asset behavior

The workspace root redirects to a trailing-slash URL. Entry HTML receives the correct `<base>` value, so history-router deep links use the same relative JS, CSS, image, font, and WASM paths.

Custom frontend packages must use relative assets. Root-absolute `/assets/*` paths are not supported in the first release. Only an HTML document navigation can fall back to the application entry; a missing static asset returns `404`.

The workspace always serves the current uploaded content. There is no release list, publish step, version history, or rollback.

## Troubleshooting

| Response or state | What to check |
|---|---|
| `401` | The request is an unauthenticated asset request rather than a document navigation |
| `403` | The current role lacks workspace permission, or the target API denies its data operation |
| `404` | The workspace, Entry, or requested relative asset does not exist |
| `503` | Light extensions, the repository, the Entry runtime, or the current assets are unavailable |

If a deep URL opens the standard NocoBase frontend after sign-in, check that the workspace is enabled and still uses "Custom frontend". The client fallback route performs one guarded full-page reload; it stops repeated reloads and shows an error when the Gateway cannot serve the application.

## Related links

- [Light extensions](../plugin-light-extension/index.md) — prepare, upload, replace, and troubleshoot custom frontend packages
