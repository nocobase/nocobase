# Client pages and routes

All paths in this guide are relative to the plugin package. Pages are React components in `<plugin>/client/pages/`. Routes and menu entries are declared in `<plugin>/client/routes.ts`. Register `routes` and lazy `locales` in the plugin declaration through `defineClientPlugin({ packageName, routes, locales })`; see [Client contributions](client.md) and [internationalization](i18n.md). For nested pages, Tabs and groups, also read [child routes](client-child-routes.md).

## Add a page

Declare the route with a lazy `componentLoader`:

```ts
// client/routes.ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
]);

export default routes;
```

First [copy the required page components into the plugin](client-components.md#copy-page-and-route-components-into-the-plugin). The page module must default-export its component and wrap its content in `PageContainer` to use the shared page padding and spacing:

```tsx
// client/pages/orders.tsx
import type { ReactElement } from 'react';
import { PageContainer } from '../components/page-container.js';

export default function OrdersPage(): ReactElement {
  return <PageContainer>...</PageContainer>;
}
```

Keep `componentLoader` lazy. The route metadata stays synchronous so the router can resolve navigation without downloading every page; the component is fetched when someone navigates to it.

Import paths use the `.js` extension even though the file is `.tsx`. That is the module resolution this project uses, not a mistake.

## Route paths are application-internal

Never write the deployment base path into a route. The application is mounted somewhere — `/main` by default — and the runtime restores that prefix. A path of `/orders` is reachable at `/main/orders` in the browser.

## Choosing an auth mode

| Mode       | For                                                                           |
| ---------- | ----------------------------------------------------------------------------- |
| `required` | Pages only signed-in users may open. The default for root routes when omitted |
| `guest`    | Sign-in, registration, password reset. A signed-in user is redirected away    |
| `optional` | Pages that work signed in or out and adapt themselves                         |

Descendants inherit their entry route’s auth mode and cannot switch it.

## Declaring `authz`

Declare `authz` on the first page of every path: a `{ resource: { type, id }, action }` request, `'skip'`, or `'unrestricted'` for a page only root may open. Nothing is inferred from the route name. A nested page that omits it inherits its nearest ancestor page's value. An entry page that omits it still registers, with a development warning, and defaults to `'unrestricted'` on a protected page and to `'skip'` on a guest or optional page; always declare it. A product page usually checks `{ resource: { type: 'page', id }, action: 'access' }` with a stable id. Every parent check must pass before its children render, so a child that needs nothing more may declare `'skip'`. Menus, page loaders and permission discovery all read the declared value. A request is checked independently of `auth`. Route groups cannot declare `authz`.

### Opting a page out of authorization

`authz: 'skip'` skips only the current page's authorization check. Its authentication mode, parent guards, and server authorization still apply.

```ts
defineAppRoutes([
  {
    authz: 'skip',
    auth: 'required',
    name: 'home',
    path: '/',
    componentLoader: () => import('./pages/home.js'),
  },
]);
```

Use `'skip'` for pages such as the signed-in landing page that need no additional authorization. Replacing it with a permission request restricts the page to users granted that permission.

The authorization plugin's permission workspace lists every route whose `authz` checks `page` `access`, keyed by `authz.resource.id` and listed under the Pages entry with its navigation groups as resource groups in menu order, and deduplicates the ids. The id is what stored grants reference, so changing it changes the permission identifier; renaming the route alone does not. For released features, assess how existing grants should be handled. For unreleased features, do not add migrations, backfills, or compatibility branches for temporary development data. If the release status is unclear, confirm it with the user before proceeding.

`auth` governs browser navigation. It is not server security: an endpoint the page calls must authenticate independently. See [server routes](server.md).

## One route kind

`defineAppRoutes()` is the only Client route API. There is no `/settings` or `/dev` surface, and a plugin contributes no settings or development pages: expose administration as settings items and APIs ([system settings](system-settings.md)) and leave any page over them to the application.

## Putting the page in the sidebar

Declare `navigation: { title: 'navigation.orders' }` on the route. The application sidebar reads route declarations. Titles resolve in the owning application's or plugin's translation namespace; `icon` is an optional component accepting `className`.

Omit `navigation` for a reachable page that should not have a menu entry. Menu targets must resolve to concrete paths: dynamic parameter and wildcard pages do not declare `navigation`. Visiting such a page selects its nearest visible menu ancestor.

Do not add a Refine resource just to create a menu. Resources remain useful for CRUD integration, but do not supply application navigation. The home link is also declared in routes rather than hardcoded in the sidebar.

### Groups and page children

`defineAppRoutes()` supports recursive `children`. A group has `name`, `navigation`, and `children`, without `componentLoader`. Its optional `path` prefixes descendants; omit it for a menu-only group. A page has `componentLoader` and may also have navigation and children. A clickable page with child menu items has separate link and expand controls.

Groups do not render business components. Pages must place `<Outlet />` explicitly where child content belongs. See [child routes](client-child-routes.md) for complete examples and verification.

A navigable page normally changes `client/routes.ts`, its page component, and `client/locales/`. Do not edit the shell or a ServiceProvider merely to add a menu.

## Breadcrumb route metadata

`breadcrumb` supplies a static translation key in the owning plugin namespace and is allowed on parameterized page routes. Keep it unset on Tabs, dialogs and drawers, which are views of a parent rather than independent destinations. Route metadata alone does not render a breadcrumb component; this guide does not include the host App's private breadcrumb implementation.

## Verify

- The page renders at its path, and at `/main` plus its path in the browser.
- The sidebar shows the entry, with the right label in every language, and highlights it when open.
- A signed-out visit to a `required` page redirects to sign-in.
- A page with `authz` disappears from navigation when denied, and its direct URL does not load the component.
- The page's chunk loads on navigation rather than in the initial bundle.

## Appending to another package's navigation group

A root entry passed to `defineAppRoutes()` may declare `parent: 'package-name:group-name'` to append to a navigation group another package declares, or a bare group name for one in the same package. The target can be nested and can be declared by a later plugin. The contributed route's path is relative to the target group's path; its package and locale namespace remain those of the contributing plugin. Entries inside `children` must not also declare `parent`. Missing targets, page targets, cycles, duplicate names and conflicting paths are errors; groups are never silently merged.

## Checking feature visibility

Use `useCan` from `@nocobase/app-plugin-authorization/client` for buttons and other permission-dependent UI: `useCan({ resource: { type: 'page', id: 'orders' }, action: 'access' })`. Its `{ can, isPending, error, retry }` result follows the current session and realtime permission updates; pending and failed checks do not allow access. Non-React consumers resolve `authorizationClientToken` and call `client.can({ resource, action })`. Page guards and navigation use this authorization client directly, without Refine permission hooks. Route `authz` declarations use the same `{ resource: { type, id }, action }` request; no string adapter is involved. Client visibility never replaces authorization on the endpoint.

Resolve the current application authorization client with `useAuthorizationClient()` in React or `authorizationClientToken` from its service container elsewhere. Refine access-control configuration and global authorization client accessors are not supported. Checks name domain actions such as `read` and `update`; there is no `list`/`show`/`edit` translation.
