---
title: 'Pages and navigation'
description: 'Add a page, put it in the menu, require sign-in.'
---

# Pages and navigation

:::warning Being written
This page is being written.
:::

Add a page, put it in the menu, require sign-in.

## This page will cover

- Declare the route and write the page component
- Register the navigation entry — a route alone does not put the page in the menu
- `auth` requires sign-in for navigation; note it is not server-side security
- Settings pages are ordinary pages: put them in the main navigation, for example under a Settings group

## Declare `authz` on every entry page

Declare `authz` on the first page of every path: either `{ resource: { type: 'page', id }, action: 'access' }`, which lists the page in the permission workspace and shows it only to users granted it, `'skip'`, which checks nothing beyond sign-in and parent routes (typical for guest pages), or `'unrestricted'`, which only root may open. A nested page that omits `authz` inherits its nearest ancestor page's value; a child that declares its own overrides it. Nothing is inferred from the route name. A first page that omits `authz` does not stop the application: a protected page defaults to `'unrestricted'`, hidden from everyone but root, and a guest or optional page to `'skip'`, with a development warning. Always declare it rather than rely on that default.

```ts
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'Orders' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders/index.js'),
    children: [
      {
        name: 'order-detail',
        path: ':orderId',
        authz: 'skip',
        componentLoader: () => import('./pages/orders/detail.js'),
      },
    ],
  },
  {
    name: 'login-help',
    path: '/login-help',
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/login-help.js'),
  },
]);
```
