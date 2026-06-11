---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Calling sub-app APIs'
description: 'How to call sub-app APIs in multi-app: access sub-app APIs through the entry app and specify the target sub-app with a path prefix, request header, or query parameter.'
keywords: 'multi-app,sub-app API,AppSupervisor,entry app,API call,NocoBase'
---

# Calling sub-app APIs

In a multi-app setup, each sub-app has its own independent APIs. When calling a sub-app API, the entry app needs to know which sub-app the request should be routed to.

For example, a main app API is usually:

```bash
GET /api/users:list
```

`/api` is the default API prefix and can be customized with the `API_BASE_PATH` environment variable.

To call the same API in a sub-app, specify the sub-app name in the request.

## Use a path prefix

Use the `/api/__app/<appName>/` prefix to call sub-app APIs:

```bash
GET /api/__app/a_xxx/users:list
```

Where:

- `a_xxx` is the sub-app name
- `users:list` is the resource and action to call
- `/api` is the current system's API base path

Query parameters can be appended as usual:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

This approach is explicit and works well when sub-app APIs are accessed through the entry app in multi-environment deployments.

## Specify the sub-app with a request header

If the caller already uses a fixed `/api/...` address, specify the sub-app with the `X-App` request header:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

This is suitable for backend service calls, or when a frontend request utility already centralizes API URLs and only needs an additional header.

## Specify the sub-app with a query parameter

You can also specify the sub-app with the `__appName` query parameter:

```bash
GET /api/users:list?__appName=a_xxx
```

If there are other query parameters, pass them together:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

In general, the path prefix or request header is clearer because the target sub-app is more explicit.

## API address in multi-environment deployments

In multi-environment deployments, there is usually an entry app and multiple runtime environments.

For example:

- Entry app address: `http://localhost:13003`
- Runtime environment address: `http://localhost:14000`

When calling sub-app APIs, it is recommended to access them through the entry app:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

The entry app routes the request to the corresponding sub-app according to the app configuration. If you clearly know which runtime environment to access, you can also call through that environment address.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Sub-app custom domains

If a sub-app has its own access domain, you can also call that sub-app's APIs directly through that domain:

```bash
GET https://app-example.example.com/api/users:list
```

If you want to go through the entry app uniformly, continue using the entry app's `/api/__app/<appName>/...` address.

## Authentication

When calling sub-app APIs, permission checks are still based on the target sub-app.

This means:

- A sign-in state or access token valid for the sub-app is required
- The main app sign-in state does not automatically equal API permissions in the sub-app

If the request does not carry valid authentication information, the sub-app returns an unauthenticated or unauthorized error according to its own authentication configuration.
