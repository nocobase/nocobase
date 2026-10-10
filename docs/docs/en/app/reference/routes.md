---
title: 'Route types'
description: 'What each of the three route types is for.'
---

# Route types

:::warning Being written
This page is being written.
:::

What each of the three route types is for.

## This page will cover

- Two on the server: root-level callbacks and webhooks, and business endpoints under `/api`
- One on the client: pages declared with `defineAppRoutes()`. There is no separate settings or dev surface; a page that configures something is an ordinary page in the application's navigation
- Which path each one mounts under

## `authz` on client routes

`authz` is `'skip'`, `'unrestricted'` or a `{ resource: { type, id }, action }` request that the client checks before loading the page component. Nothing is inferred from the route name. Declare it on the first page of every path: a nested page that omits it inherits the value of its nearest ancestor page, through groups and any number of levels, and a child's own value overrides it. A first page that omits it still registers, with a development warning: a protected page (`auth: 'required'`) defaults to `'unrestricted'`, which only identities with unrestricted access such as root may open, and a `guest` or `optional` page defaults to `'skip'`. `'unrestricted'` may also be declared for a root-only page and is never offered as a grant. `'skip'` skips only this page's check, not sign-in or parent checks. A denied page is hidden from its navigation and its URL does not load the component; server endpoints the page calls still check authorization themselves.

```ts
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'navigation.orders' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
]);
```
