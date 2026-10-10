# Client Routes, Navigation, and Overrides

Use Client Routes for navigable browser pages. A plugin contributes its pages through its single `routes` field with `defineAppRoutes()`, the only Client route API, and keeps each page behind a lazy `componentLoader()`.

## Plugins contribute no settings pages

There is no settings or dev surface: no `/settings` or `/dev` prefix, no settings layout, and no settings entry in the application header. A plugin does not contribute administration or settings pages. It exposes its administration through server APIs and, where an administrator grants it, settings items ([system settings](system-settings.md)); whether an application offers a page for it, and where, is the application's decision, made with ordinary App routes in its own `client/routes.ts`. Do not ship development-only tool pages as routes either.

Paths are internal application paths. Do not include `/main` or another deployment base path.

## Declare Client Routes through one entry

```ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    auth: 'required',
    navigation: { title: 'navigation.orders' },
    breadcrumb: { title: 'breadcrumbs.orders' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders-page.js'),
  },
]);

export default routes;
```

Each page module must default-export a React component. Declaration modules remain side-effect-free, so reading a declaration never invokes a page loader.

## Authentication and authorization boundaries

App Routes accept `auth: 'required' | 'guest' | 'optional'`. Omitted authentication defaults to `required`; child Routes inherit their ancestor's value and cannot change it. Reserved authentication paths such as `/login`, `/register`, `/forgot-password`, and `/reset-password` must use `guest`.

Declare `authz` on the first page of every path, a stable `{ resource: { type, id }, action }`, `'skip'` or `'unrestricted'`; nothing is inferred from the route name. Nested pages inherit it, and an entry page that omits it registers with a development warning and defaults to `'unrestricted'` (root only) on protected pages or `'skip'` on guest and optional pages. If access is denied, the page is omitted from available navigation and its loader is not run.

Client `auth` and `authz` control navigation and page loading only. Every Server Route called by the page must install and test its own authentication and authorization. Similar Client and Server route names create no automatic connection.

## Navigation, breadcrumbs, groups, and child pages

`navigation` adds a static route to the matching menu. Its title is a key in the owning plugin namespace, and its optional icon is a component that accepts `className`, such as a Lucide icon. Dynamic or wildcard paths cannot declare navigation because they do not produce a static target.

`breadcrumb` independently adds a page to the breadcrumb trail and may be used on a parameterized route. Menu and breadcrumb titles do not fall back to each other; declare both when the page belongs in both surfaces.

A group has `name`, `navigation`, and non-empty `children`, may have a path prefix, and has no `componentLoader`. Groups may nest recursively and pathless groups organize navigation without changing descendant URLs. A page may also contain child pages, but its component must render an `Outlet` for the matched child to appear.

```ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export default defineAppRoutes([
  {
    name: 'business',
    navigation: { title: 'navigation.business' },
    children: [
      {
        name: 'orders',
        path: '/orders',
        navigation: { title: 'navigation.orders' },
        authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
        componentLoader: () => import('./pages/orders.js'),
        children: [
          {
            name: 'order-detail',
            path: ':orderId',
            breadcrumb: { title: 'breadcrumbs.orderDetail' },
            authz: 'skip',
            componentLoader: () => import('./pages/order-detail.js'),
          },
        ],
      },
    ],
  },
]);
```

```tsx
import type { ReactElement } from 'react';
import { NavLink, Outlet } from 'react-router';

export default function OrdersPage(): ReactElement {
  return (
    <section>
      <NavLink to='new'>New order</NavLink>
      <Outlet />
    </section>
  );
}
```

Relative links resolve from the current route. Test direct navigation, refresh, browser back and forward, parent layout preservation, menu selection, denied access, and each intended Outlet.

A root App route may declare `parent` to be appended to an existing navigation group: a group name in the same package, or `package-name:group-name` for one another package declares. Only root entries may declare it; its path is relative to the target group. Avoid accidental name and normalized-path collisions; parameter names do not make structurally identical dynamic paths distinct.

## Implement page Tabs through child routes

Use child routes for page Tabs by default. Declare each Tab in the parent's `children`, omit its `navigation` and `breadcrumb` when it is only a view within the parent, and render `Outlet` in the parent page. Use plugin-owned shadcn Tabs primitives and derive their controlled value from the matched URL; Tab changes navigate through React Router rather than updating independent selection state. Preserve the component's keyboard and focus behavior.

Opening the exact parent URL redirects with replace to the business default when accessible, otherwise the first accessible Tab in display order, preserving `location.search`. While permission/data checks are loading, show loading content; if no Tab is accessible, show an empty or denied state without redirecting. Never redirect an explicit child URL merely because it is denied, unknown, or not the default. Ordinary Tab changes add history entries so back/forward restores selection.

Use `useResolvedPath('.')` and `matchPath({ path: parentPath.pathname, end: true }, location.pathname)` to identify the exact parent entry. Do not infer it from an absent Outlet, a path prefix, or an invented route `index` field. Read the plugin-focused [Service, Context, and routed Tabs examples](./client-examples.md) for a complete two-Tab page with authorization loading, query preservation, plugin-owned shadcn primitives, and a behavior test. The [child routes and Tabs implementation](client-child-routes.md) covers broader child presentation patterns using plugin-owned component copies. Follow the [component copy workflow](client-components.md#copy-page-and-route-components-into-the-plugin) before using those examples.

For full navigation, breadcrumb, and page access contracts, read [pages, routes, and menus](client-pages-and-routes.md). Keep the declarations in the plugin's `client/routes.ts`. Refine resources support CRUD and do not create sidebar entries.

## Route dialogs and drawers

For URL-addressable dialogs and drawers, read the [child route overlay guide](client-child-routes.md#child-pages-shown-as-dialogs-or-drawers), including the complete closing example and incorrect usage. Keep route declarations in the plugin's `client/routes.ts` and place the owning page's `Outlet` explicitly.

Copy the required route wrappers, overlay implementation and hook into the plugin using the [component copy workflow](client-components.md#copy-page-and-route-components-into-the-plugin). The examples import those local copies, not host App files. The overlay wrapper and hook must share the same plugin-local React context instance; do not mix wrappers and hooks from different copies.

When using `useRouteOverlay()`, call it in a descendant component rendered inside the intended `RouteDialog` or `RouteDrawer`, including a component passed as `footer`, never in the page component that returns that wrapper. Render the descendant as JSX rather than calling it as a function. Outside the provider the hook throws; beneath another overlay it can instead read the parent context and close the wrong layer. Apply this placement rule to forms that close after saving as well as explicit close buttons.

## Replace a page without duplicating its Route

When the App needs different UI for a plugin page, override only the component loader. Preserve the plugin's route identity, path, authentication, access, navigation, and children:

```ts
const override = {
  routeId: '@nocobase/app-plugin-orders:orders',
  componentLoader: () => import('./pages/custom-orders-page.js'),
  componentEntry: './client/pages/custom-orders-page',
};
```

The target ID must resolve to a page rather than a group, and a route may have only one final override. Include `componentEntry` so later maintainers can locate App-owned source. If an overridden parent page owns children, the replacement must preserve its `Outlet`.

## Test declarations and behavior

Plugin declaration tests should inspect the real contribution and invoke page loaders:

```ts
import { describe, expect, it } from 'vitest';

import routes from '../../client/routes.js';

describe('client routes', () => {
  it('declares App pages with lazy components', async () => {
    expect(routes.parent).toBe('app');
    expect(routes.routes[0]).toMatchObject({
      name: 'orders',
      path: '/orders',
      auth: 'required',
    });
    await expect(
      routes.routes[0]?.componentLoader?.(),
    ).resolves.toHaveProperty('default');
  });
});
```

Also cover inherited auth, access denial, nested routing and Outlet behavior, plugin options when routes are factory-produced, override uniqueness, and any page-to-Server-API flow. Test anonymous, denied, and allowed API requests independently of Client navigation.

Run the plugin's focused checks and the target App tests when registration or final routing changes.

Use the maintained route example declaration (`packages/examples/app-plugin-routes-example/client/routes.ts`), route declaration tests (`packages/examples/app-plugin-routes-example/tests/client/routes.test.ts`), and app-client child route tests (`packages/app/app-client/tests/child-routes.test.ts`) for current contracts.
