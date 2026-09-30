# Pages, menus and routes

A page is a React component under `client/pages/`; routes and menus are declared in `client/routes.ts`. For child pages, tabs and navigation groups, see [`child-routes.md`](child-routes.md); for dialogs and drawers, see [`overlay.md`](overlay.md).

Before writing a new page, find the closest file in the worked example: the task table of [`example.md`](example.md) names where a list page, a form too long for a dialog and a settings page start. How to use each component comes from the shadcn skill ([`shadcn.md`](shadcn.md)).

## 1. Declare the route

Append an entry to the end of the existing `defineAppRoutes([...])` array in `client/routes.ts`. Leave the existing routes (home, sign-in pages) as they are, and do not overwrite the whole file. Add the icon to the existing `lucide-react` import at the top of the file, and the route type to the existing `@nocobase/app-client/plugins` import:

```ts
import { FolderKanban, Home } from 'lucide-react';
import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';
```

The projects list page to append, with child routes for create, edit, detail and the edit stacked on the detail. The detail drawer and its edit dialog come from a function, because every page that opens a project declares the same pair under itself, so the drawer opens over that page ([section 2.1 of `overlay.md`](overlay.md#21-declare-the-child-routes)):

```ts
/** The project drawer and the edit dialog stacked on it, under a page that opens projects; `owner` keeps the names unique. */
function projectDetailRoutes(owner: string): AppClientRouteDefinition[] {
  return [
    {
      // …/:projectId: detail drawer (RouteDrawer), over the page that declares it
      name: `${owner}-detail`,
      path: ':projectId',
      authz: 'skip',
      componentLoader: () => import('./pages/projects/detail/index.js'),
      children: [
        {
          // …/:projectId/edit: edit dialog, stacked on the drawer
          name: `${owner}-detail-edit`,
          path: 'edit',
          authz: 'skip',
          componentLoader: () => import('./pages/projects/detail/edit.js'),
        },
      ],
    },
  ];
}

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  // … existing routes (home, sign-in pages); keep them
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'navigation.projects', icon: FolderKanban },
    componentLoader: () => import('./pages/projects/index.js'),
    children: [
      {
        // /projects/new: create dialog (RouteDialog)
        name: 'project-new',
        path: 'new',
        authz: 'skip',
        componentLoader: () => import('./pages/projects/new.js'),
      },
      {
        // /projects/edit/:projectId: edit dialog opened from a row's menu, alone over the list
        name: 'project-edit',
        path: 'edit/:projectId',
        authz: 'skip',
        componentLoader: () => import('./pages/projects/detail/edit.js'),
      },
      // /projects/:projectId (project-detail) and /projects/:projectId/edit (project-detail-edit)
      ...projectDetailRoutes('project'),
    ],
  },
]);
```

| Field             | Description                                                                                                                                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | Route name. Only letters, digits, `.`, `_` and `-` are allowed; kebab-case is recommended. Unique among the application's App routes. It is the target of route overrides, so do not change it after release                                                                                                                |
| `path`            | A root route starts with `/`; a child route is relative to its parent, usually one segment (`new`, `:projectId`), two for a second way into the same overlay (`edit/:projectId`). It cannot contain query parameters, `#`, `*` or `..`. Two routes whose paths differ only in parameter names are rejected as the same path |
| `auth`            | Who can open the page; see [section 3](#3-auth-who-can-open-the-page). Defaults to `'required'`                                                                                                                                                                                                                             |
| `authz`           | Page authorization; declare it on the first page of every path, nested pages inherit it; see [section 4](#4-authz-page-authorization)                                                                                                                                                                                       |
| `navigation`      | Menu entry: `title` (translation key), `icon`, `order`; see [section 6](#6-menus). Omit it when the page needs no menu entry                                                                                                                                                                                                |
| `breadcrumb`      | Breadcrumb title (translation key), only on the routes of a trail the user asked for; see [section 7](#7-back-button-and-breadcrumbs)                                                                                                                                                                                       |
| `componentLoader` | Lazily loads the page module; the module must `export default` the page component                                                                                                                                                                                                                                           |
| `children`        | Child routes; see [`child-routes.md`](child-routes.md)                                                                                                                                                                                                                                                                      |

Rules:

- **Keep `componentLoader` lazy**. Route information is declared synchronously, so the router can resolve navigation without downloading every page; page code is downloaded only when the page is visited.
- **Write import paths with the `.js` extension**, even when the source file is `.tsx`. This is how this project resolves modules, not a typo.
- **Paths are internal to the application**: do not write the deployment base path `/main`. The application is mounted under a base path (`/main` by default), and the runtime adds it automatically: `/projects` is `/main/projects` in the browser.
- **Reserved paths**: `/login`, `/register`, `/forgot-password` and `/reset-password` can only use `auth: 'guest'`. They are already declared in `client/routes.ts`, and their pages are in `client/pages/auth/`.
- App routes share one path space with settings pages and dev pages. Registration rejects only an identical path; a signed-in App route whose path starts with `/settings/` or `/dev/` renders inside the Settings or Dev layout (`client/routing/app-router.tsx`). Declare administration pages with `defineSettingsRoutes()` and development pages with `defineDevRoutes()` rather than relying on that.

## 2. The page component

Put the page in `client/pages/<feature>/index.tsx`, default-export the component, and build its skeleton with `PageContainer` and `PageHeader`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import { PlusIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          // Create is the child route /projects/new; keep the query parameters so the filters survive closing the dialog.
          <Button
            nativeButton={false}
            render={<Link to={{ pathname: 'new', search: location.search }} />}
          >
            <PlusIcon data-icon='inline-start' />
            {t('projects.create.action')}
          </Button>
        }
      />
      {/* Toolbar, table… */}
      {/* Child routes (create dialog, detail drawer) render here */}
      <Outlet />
    </PageContainer>
  );
}
```

- **`PageContainer`** (`@/components/page-container`) renders a `section` that owns the full width, the spacing between blocks and the responsive padding (`w-full space-y-6 p-6 md:p-8`); the back button, the title, actions, content and the loading, empty and error states all go inside it. Do not hand-write an outer `div`, `main` or `section` with page padding, and do not change its spacing on one page (to change it everywhere, change the component).
- **`PageContainer` is provided by the component that owns the page, one per page**:
  - An inline child page (including tab content) renders inside the parent page's `PageContainer`; do not add another one.
  - A covering child page uses its own `PageContainer` inside `RouteChildPage` (see [`child-routes.md`](child-routes.md)). A child route that returns a bare `PageContainer` is neither: it renders at the parent's `Outlet`, below the parent's content.
  - Dialog and drawer content uses the overlay's own container; do not add `PageContainer`.
- **`PageHeader`** (`@/components/page-header`) props: `title` (required), `description`, `actions` (on the right, for page-level actions). The title matches the menu name (guidelines L1, L3 and L5).
- A page with child routes must place `<Outlet />` itself, or the child route content does not render; put it at the end of `PageContainer`. For how to write child routes, see [`child-routes.md`](child-routes.md) and [`overlay.md`](overlay.md).
- Navigate to a child route with a relative path (`new`, `String(id)`, `` `edit/${id}` ``) and keep the query string, as [section 2.2 of `overlay.md`](overlay.md#22-place-the-outlet-in-the-parent-page) explains.

**A relative path resolves against the route that renders the link, not against the URL on screen.** `edit`, `./edit` and `{ pathname: 'edit' }` are the same link: each is appended to the path of the route whose component renders it, directly or through any component inside that one. `..` removes that route's own segments, which is where `closeTo` and `BackButton` go by default. A link therefore means the same thing wherever the user is below its route, and a component above the view it acts on — a page's header, above its tabs — cannot reach that view with a bare segment:

| URL on screen               | The link is rendered by                | `to`                                         | Resolves to                                             |
| --------------------------- | -------------------------------------- | -------------------------------------------- | ------------------------------------------------------- |
| `/customers/12/orders`      | `:customerId`, the page and its header | `edit` or `./edit`                           | `/customers/12/edit`: beside the tabs, replacing Orders |
| `/customers/12/orders`      | `:customerId`, the page and its header | `` `${tab}/edit` ``, `tab` read from the URL | `/customers/12/orders/edit`: over Orders                |
| `/customers/12/orders`      | `orders`, the tab                      | `edit`                                       | `/customers/12/orders/edit`                             |
| `/customers/12/orders`      | `:customerId`, its `BackButton`        | `..`                                         | `/customers`: the page it covers                        |
| `/customers/12/orders/edit` | `edit`, the dialog closing by default  | `..`                                         | `/customers/12/orders`                                  |

Build a link that targets a deeper route from that route's segment, as ["Overlays opened from the header of a page with tabs" in `child-routes.md`](child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs) does, or render the link inside that route.

## 3. auth: who can open the page

| Value      | Use for                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `required` | Only signed-in users can open it. A root route without `auth` gets this                              |
| `guest`    | Sign-in, registration, password reset. Signed-in users who visit are sent away                       |
| `optional` | Opens whether or not the user is signed in; the page adjusts its content to the sign-in state itself |

- Child routes inherit the entry route's `auth` and cannot change it (a different value raises an error at registration).
- Settings pages and dev pages always require sign-in; do not write `auth` on them.
- A signed-out user who visits a `required` page is taken to the sign-in page.
- `auth` only governs navigation in the browser, not what the server allows (the rules of [section 4](#4-authz-page-authorization)).

## 4. authz: page authorization

`authz` is a `{ resource: { type, id }, action }` request, `'skip'`, or `'unrestricted'`. Nothing is inferred from the route name. Menus, page loading and the permission set page all read the resolved value, which comes from the root down:

- **A page that declares `authz`** uses it. A malformed value raises an error at registration.
- **A nested page that omits it** inherits the value of its nearest ancestor page, through navigation groups and any number of levels. A child that declares its own value overrides it for itself and its descendants.
- **The first page on a path that omits it** still registers, and the application still starts, with a development warning naming the route, its path and the default applied. A protected App page (`auth: 'required'`) or a settings page becomes `'unrestricted'`: only identities with unrestricted access, such as root, may open it, and it is hidden from everyone else's menus. A `guest` or `optional` App page, or a dev page, becomes `'skip'`.

**Always declare `authz` on the first page of every path.** The default keeps an omission from stopping the application; it is not a design choice. `'unrestricted'` may also be declared explicitly for a page only root may open; nothing grants it, so it never appears in the permission set page.

**Rules:**

- The check follows `authz`, regardless of `auth`.
- A navigation group cannot have `authz` (it raises an error at registration) and carries no permission of its own.
- A child page renders only after the parent page's check passes. Writing `'skip'` on a child page does not bypass the parent page's check.
- Without permission, the menu entry is hidden, and opening the URL directly shows "Access denied" without loading the page component. While the check is pending, protected content is not shown; a failed check is treated as no permission.
- Only root, which is unrestricted, holds every page permission. Every other identity, including one you think of as an administrator, needs the page grant in a permission set. When the feature is for people who do not have it yet, seed or assign the grant as the `nocobase-app-plugin-authorization` Skill describes, and say in your report who can open the page.
- **`auth` and `authz` both act only in the browser**. Endpoints must do their own authentication and authorization (`auth.required()`, `authorization.middleware()`) and cannot rely on the page's settings.
- **A page grant opens the page and authorizes no endpoint.** The endpoints of a restricted App page check a business action instead: an action of a `composite` registered with `authz.compositeResources.define`, which the same permission set grants beside the page. Design the composite, its actions and data scopes with the `nocobase-app-plugin-authorization` Skill; never make an endpoint check `page` `access`.

**How to choose:**

| Situation                                                                                            | What to write                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Every signed-in user may use it (the home page; its endpoints are also open to every signed-in user) | `authz: 'skip'`                                                                                                                                |
| Only for people who have been granted access                                                         | `authz: { resource: { type: 'page', id: '<id>' }, action: 'access' }`; its endpoints check a `composite` action the same permission set grants |
| A child page that needs nothing beyond its parent's check                                            | Omit `authz` to inherit the parent's value, or write `authz: 'skip'`                                                                           |
| Only root, never assignable                                                                          | `authz: 'unrestricted'`                                                                                                                        |
| A child page that needs its own authorization                                                        | `authz: { resource: { type: 'page', id: '<id>' }, action: 'access' }`                                                                          |
| A settings page                                                                                      | Its settings item: see "Settings pages" in [section 5](#5-three-kinds-of-routes)                                                               |

A page and the endpoints it calls must agree: the example's `/api/projects` is open to every signed-in user, so the projects page uses `authz: 'skip'`. Had the page a page grant, `/api/projects` would check a business action such as `composite:projects` `read`, granted with the page, not the page grant itself.

**`authz: 'skip'` skips only this page's own check**; the sign-in requirement, the parent page's check and server authorization all still apply.

**The resource id is the permission identifier**: the permission set page lists every route whose `authz` checks `page` `access`, keyed by `authz.resource.id` (deduplicated), under the Pages entry with its navigation groups in menu order. Stored grants reference that id, so changing it requires migrating them; renaming the route alone does not.

## 5. Three kinds of routes

| Function                 | Mounted at         | For                                    |
| ------------------------ | ------------------ | -------------------------------------- |
| `defineAppRoutes()`      | `/projects`        | Ordinary business pages                |
| `defineSettingsRoutes()` | `/settings/<path>` | Administration and configuration pages |
| `defineDevRoutes()`      | `/dev/<path>`      | Tool pages used only in development    |

Do not repeat `/settings` or `/dev` in the path; writing `/projects` mounts it under the matching prefix. Settings pages and dev pages are two separate path spaces and can use the same relative path. All three kinds are declared the same way (pages, groups, `children`), and all of them go in `client/routes.ts`.

### Settings pages

The template's `settingsRoutes` is an empty array by default. A settings page checks a **settings item**: a named administration capability that the server registers and its endpoints check, so the page and its API follow one grant. Add an entry, and again add the icon to the `lucide-react` import at the top of the file (here `SlidersHorizontal`):

```ts
const settingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    // Opens for identities granted read on the project-settings item; the endpoints check the same item.
    authz: {
      resource: { type: 'settings', id: 'project-settings' },
      action: 'read',
    },
    componentLoader: () => import('./pages/settings/projects/index.js'),
    name: 'project-settings',
    navigation: {
      title: 'navigation.projectSettings',
      icon: SlidersHorizontal,
      order: 100,
    },
    // Mounted at /settings/projects.
    path: '/projects',
  },
]);
```

- **Register the item on the server** in the `boot()` of the provider that owns the feature, with the service resolved from `authorizationToken`: `authz.settings.add({ id: 'project-settings', title, actions: [{ name: 'read' }, { name: 'update' }] })`, placed in the permission workspace with `authz.ui.place` (after `authz.ui.sections.add` when it needs a subsection of its own); an unplaced item is listed under "Other" with a startup warning. The server denies an item or action nobody registered, so an unregistered item keeps the page closed. The endpoints check the same item per action, `read` for loading and `update` for saving; see ["Authorization, when identity is not enough" in `../../server-routes.md`](../../server-routes.md#authorization-when-identity-is-not-enough). Actions are business actions (`read`, `update`); there is no conversion such as `list`, `show` or `edit`. Read the `nocobase-app-plugin-authorization` Skill before designing several items or actions.
- **Gate the write controls on the write action**: `useCan({ resource: { type: 'settings', id: 'project-settings' }, action: 'update' })` ([section 8](#8-show-actions-by-permission-usecan)). Without it, render the values read-only instead of hiding the page.
- Do not give a settings page a page grant (`type: 'page'`): page grants are for App pages and are listed under Pages in the permission set page. Write `'skip'` only for a settings page every signed-in user who can enter the settings area may open. A settings page that omits `authz` defaults to `'unrestricted'`, which only root may open.
- `authz` is checked before the page loads; without permission the page disappears from the settings menu, and opening its URL directly does not load the component either.
- The header shows the "Settings" entry only when the user can open at least one settings page.
- `navigation.order` sets the position in the menu; lower numbers come first.
- For tabs and detail child pages in settings pages, see [`child-routes.md`](child-routes.md).

The page itself, `client/pages/settings/projects/index.tsx` with its card beside it, is [`example/settings-page.md`](example/settings-page.md) and [`example/members-card.md`](example/members-card.md): it loads the settings with the four states, gates the members card on `update` (waiting for the check before rendering either variant), and falls back to the same values read-only. Assumes the backend provides `GET` and `PATCH /api/project-settings`, checking `read` and `update`.

- Each Card saves on its own (T4.2); add a Card per topic, each with its own load of the values it edits or one load shared as here.
- The server checks `update` on the `PATCH` endpoint no matter what the page shows; hiding the card only keeps the UI honest.
- A settings page with sections that different people manage uses one settings item per section, or one item with several actions, as the `nocobase-app-plugin-authorization` Skill describes.

### Dev pages

Pages declared with `defineDevRoutes()`, and modules imported only by them, are left out of the production build. This is a build boundary, not a permission boundary: a page whose access must also be restricted in production should be a settings page with `authz`, checked on the server.

The template's `client/routes.ts` exports only `appRoutes` and `settingsRoutes`. The first dev page adds `defineDevRoutes` to the import and a third entry to the exported array:

```ts
// client/routes.ts
import {
  defineAppRoutes,
  defineDevRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

// … appRoutes and settingsRoutes as before

const devRoutes: AppClientRouteContribution = defineDevRoutes([
  {
    // Mounted at /dev/project-fixtures, in development builds only.
    name: 'project-fixtures',
    path: '/project-fixtures',
    authz: 'skip',
    navigation: { title: 'navigation.projectFixtures' },
    componentLoader: () => import('./pages/dev/project-fixtures.js'),
  },
]);

const routes: readonly AppClientRouteContribution[] = [
  appRoutes,
  settingsRoutes,
  devRoutes,
];

export default routes;
```

### Contribute pages to another plugin's settings group

A root settings entry can declare `parent: '<group-name>'` to be appended to an existing settings group, such as the authorization plugin's `authorization` group:

```ts
const settingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  // … existing settings pages
  {
    // Appended to the authorization plugin's authorization group; path is relative to that group, so the actual URL is /settings/authorization/audit-logs.
    parent: 'authorization',
    name: 'audit-logs',
    path: '/audit-logs',
    navigation: { title: 'navigation.auditLogs' },
    // A settings item the application registers on the server, like any settings page.
    authz: { resource: { type: 'settings', id: 'audit-logs' }, action: 'read' },
    componentLoader: () => import('./pages/settings/audit-logs.js'),
  },
]);
```

- The target group is referenced by its unique name. It can be a nested group, and it can be declared by a plugin registered later.
- An appended route's `path` is relative to the target group; its translation namespace remains the contributor's own (the application's).
- Both pages and groups can be appended this way. Only root entries can declare `parent`; entries inside `children` cannot.
- A group can declare empty `children` for others to append to. Siblings are sorted by `navigation.order` (lower first, default 0), so an appended entry without `order` sorts before a plugin's own child with `order: 100`. Entries with equal `order` keep registration order: the group's own children first, then appended entries in plugin and entry registration order. Set `navigation.order` to place an appended entry.
- A missing target, a target that is a page rather than a group, a cycle, a duplicate name among siblings, and a path conflict all raise an error; groups are never silently merged.
- Root entries without `parent` still sit directly under the settings menu.
- **Update the route test when you append to another package's group.** `tests/logic/client-routes.test.ts` registers only the application's own routes, so every test in it fails with "references missing group". Import the target plugin's route contribution (for the authorization group, `import authorizationRoutes from '@nocobase/app-plugin-authorization/client/routes'`) and add `{ packageName: '@nocobase/app-plugin-authorization', routes: [authorizationRoutes], source: 'plugin' }` to the list `resolveRoutes()` passes to `resolveAppClientContributions`, then run the whole file: the page-loading test now also loads that plugin's pages.
- `parent` is not limited to settings pages: root entries of `defineAppRoutes()` and `defineDevRoutes()` also accept it. For App routes the value is a group name in the same package or `package-name:group-name`. Settings and Dev group names are unique across their whole area, so there you always write the bare group name (`'authorization'`); a qualified name is rejected at registration.

## 6. Menus

Write `navigation` on the route. The application sidebar, the settings menu and the dev menu all read their menu entries from route declarations.

| Field   | Description                                                                                                                                                                                                                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title` | Translation key, resolved in the namespace that owns the route (`client/locales/` for application routes)                                                                                                                                                                                                                            |
| `icon`  | Optional. An icon component that accepts `className`; use `lucide-react` icons directly. Give the entries of one group icons together or not at all — the collapsed icon-mode sidebar shows the label of an entry that has no icon, so a mixed group reads as inconsistent — and do not repeat a group's own icon on its first child |
| `order` | Optional. Lower numbers come first among siblings; defaults to 0. Equal values keep registration order                                                                                                                                                                                                                               |

- Add the translations to the existing `navigation` group in `client/locales/en-US.ts` and `zh-CN.ts`, for example `projects: 'Projects'` and `projects: '项目'`.
- Pages that should not appear in the menu (details, tab content and so on) have no `navigation`. When such a page is open, the menu highlights the nearest ancestor that has a menu entry.
- **A path with a parameter (`:projectId`) cannot have `navigation`**; registration raises an error, because a menu entry must point to a fixed URL (wildcards are rejected on every route, [section 1](#1-declare-the-route)).
- Navigation group: write only `name`, `navigation` and `children`, without `componentLoader`. For groups and clickable parents, see [`child-routes.md`](child-routes.md).
- Do not change the shell (`client/layouts/`) or the ServiceProvider to add a menu entry, and do not add a Refine resource for a menu. Refine resources produce no menu entries (see ["Loading data in a component" in `api.md`](api.md#loading-data-in-a-component) for what they are for); the home page entry is declared in the routes as well.
- A new page with a menu entry usually touches four places: `client/routes.ts`, the page component, `client/locales/` and, for an App page that requires sign-in, the page grant list in `tests/logic/client-routes.test.ts` ([section 12](#12-update-the-route-test)).

## 7. Back button and breadcrumbs

A page that sits below another one — a covering child page, a record's own page, a form too long for a dialog — has a back button above its title (guideline L6). Use breadcrumbs instead only when the user asks for them; do not render both, and do not add a "Back to list" button to `actions`.

### The back button

`BackButton` (`@/components/back-button`) is a component of its own: the page places it inside `PageContainer`, above `PageHeader`, and it needs nothing from the header. [Section 5 of `child-routes.md`](child-routes.md#5-covering-child-pages-routechildpage) has the complete example, a covering child page.

- It is a muted text link with an arrow and "Back" (`navigation.back`), turning to the foreground on hover.
- By default it leads to the parent route and keeps the query string, as closing an overlay does: from `/projects/import?status=active` it returns to `/projects?status=active`, and the list keeps its search and filters. The parent is found by route, not by path segment, so a child route with a two-segment path returns to its parent too.
- **The query string it keeps is the current one.** The page it returns to gets its search and filters back only if every link on the way down carried them: a link into a page below another one forwards `location.search` whole, never a selection of it. Whatever the page being left wrote there goes back too, unless the page removes it: a page that writes parameters of its own, itself or in its tabs (the Orders tab's `ordersQ`), passes `to` with those parameters removed — `<BackButton to={{ pathname: '..', search: withoutParams(location.search, CUSTOMER_PAGE_PARAMS) }} />`, with `withoutParams` from [`example/url-search.md`](example/url-search.md) — so the list gets exactly its own back, and the next customer does not open with the previous one's order search. `..` still follows the parent route the page was opened from.
- `to` sends it elsewhere, for a page that belongs to exactly one parent, such as a record page declared beside its list: `<BackButton to={{ pathname: '/customers', search: location.search }} />`. For a module reused under several parents — a record's page opened from another page as well (["The same detail page over another page" in `child-routes.md`](child-routes.md#the-same-detail-page-over-another-page)) — omit it, or keep `..` as its `pathname` when only the query string changes, as the previous point does, so the back button follows the parent route it was opened from; a hard-coded path sends a user who came from elsewhere to a page they were not on. `children` replaces the label; keep "Back" unless the destination needs naming.
- It navigates rather than going back in the browser history, which a page opened from a link or a refresh does not have, and it replaces the history entry, as closing an overlay does: the browser's Back then does not reopen the page just left, such as a form that would come back empty.

### Breadcrumbs, when the user asks for them

The route tree behind the breadcrumbs is provided by the layout the page is in: `AppLayout` for business pages, `SettingsLayout` for settings pages and `DevLayout` for dev pages. `StandalonePageLayout` does not provide one at present, so breadcrumbs placed there show nothing.

`navigation` defines the menu entry and `breadcrumb` defines the breadcrumb title; neither replaces the other. To get both a menu entry and a breadcrumb, write both on the route: `navigation: { title: 'navigation.projects' }` and `breadcrumb: { title: 'navigation.projects' }`. `breadcrumb.title` is a static translation key and can be used on a path with parameters. Declare `breadcrumb` only on the routes of the trail the user asked for.

The page places `<Breadcrumbs />` (`@/components/breadcrumbs`) where the back button would go: inside `PageContainer`, above `PageHeader`.

Breadcrumbs are generated from the matched route levels:

- Only routes with `breadcrumb` appear. Tab, dialog and drawer routes do not declare it.
- The trail is shown only when at least two matched routes declare `breadcrumb`. The parent route alone is not enough.
- Earlier page levels link to their actual URLs; a group without a component is shown as plain text. The last level is the current page and is not a link.
- The title names the page type ("Project details"), not a specific record ("Project #42"); the record name goes in the page title.

## 8. Show actions by permission (useCan)

Use `useCan` from `@nocobase/app-plugin-authorization/client` to decide whether buttons and other UI elements are shown:

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { DownloadIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';

export interface ExportProjectsButtonProps {
  readonly onExport: () => void;
}

export function ExportProjectsButton({
  onExport,
}: ExportProjectsButtonProps): ReactElement | null {
  const { t } = useTranslation();
  // A business action: the composite resource the server defines and the export endpoint checks with the same pair.
  const { can } = useCan({
    resource: { type: 'composite', id: 'projects' },
    action: 'export',
  });

  // can is false while the check is pending and when it fails: the button is not shown, so it never appears and then disappears.
  if (!can) return null;

  return (
    <Button variant='outline' onClick={onExport}>
      <DownloadIcon data-icon='inline-start' />
      {t('projects.export.action')}
    </Button>
  );
}
```

- The resource is one the server knows; an unknown type or id is denied to everyone but root, so a button that shows for root can still be missing for everyone else. The types a page checks:

  | `resource.type` | `action`                                                     | Registered by                                                                                       |
  | --------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
  | `page`          | `access`                                                     | Nothing on the server: the client routes whose `authz` checks it                                    |
  | `settings`      | The actions `authz.settings.add` declared (`read`, `update`) | `authz.settings.add` in a server provider ([section 5](#5-three-kinds-of-routes), "Settings pages") |
  | `composite`     | The business actions of the composite (`export`, `submit`)   | `authz.compositeResources.define` in a server provider                                              |

  Design composites, their actions and data scopes with the `nocobase-app-plugin-authorization` Skill before you add a `useCan` for one; `database.collection` grants belong inside composites, not in page code.

- It returns `{ can, isPending, error, retry }` and follows live updates to the current session and permissions. `can` is `false` both while the check is pending and when it fails.
- Like any other hook, call it only at the top level of a component, never inside a condition; when no check is needed, pass `{ enabled: false }` as the second argument; a disabled check returns `can: false`, so combine it with your own condition (`enabled ? can : true`) instead of hiding on `!can` alone.
- Handle the three outcomes the same way everywhere:
  - `isPending`: nothing for a single action or navigation entry; a loading state for a block whose content depends on the answer.
  - `error` (the check itself failed, not a denial): a single action or tab stays hidden, as when denied; a block whose content depends on the answer shows a retryable error that calls `retry` (the settings page in [`example/settings-page.md`](example/settings-page.md)).
  - `can` is `false` without an error: hide the action, or render the block read-only when the user may still see it (settings pages).
- Use it for page permissions too, for example for an entry on the home page that points to a page: `useCan({ resource: { type: 'page', id: 'projects' }, action: 'access' })`. A route's `authz` uses the same `{ resource: { type, id }, action }`.
- **`useCan` answers "does this user have this feature", not "can this record be acted on"**. For actions that depend on record state or data scope, the server returns the actions available for each record in the list or detail response, and the UI shows them accordingly; the endpoint checks again when it executes.
- Hide actions the user has no permission for; disable actions that are temporarily unavailable and explain why in a tooltip (guideline I7).
- In a component, get the authorization client with `useAuthorizationClient()`; outside React, resolve `authorizationClientToken` from the application container and call `client.can({ resource, action })`. When state you maintain yourself must reload after permissions change, use `useAuthorizationRevision()`. Do not use Refine's permission configuration or a global authorization client, and do not store permission results in module-level variables (they linger after switching accounts).
- **Hiding something in the UI does not replace endpoint authorization.**
- When the business has different job responsibilities, data scopes or field permissions, read the `nocobase-app-plugin-authorization` Skill first, then design the pages, business actions and record scopes.

## 9. Disable a feature (keep the page)

When the user asks to disable or hide a feature, make it reversible by default:

- Keep the page module, components and route definition; do not delete page files, dependencies or business data (unless the user explicitly asks for permanent removal).
- Control it with a flag the application owns in the `client` section of `config.yml`, such as `client.app.projectsEnabled: false`. Everything in that section reaches the browser, so it holds no secrets.
  - Pages, links and buttons read it with `useClientApplication().config.get<boolean>('app.projectsEnabled', true)` (`@nocobase/app-client`).
  - To leave the route and its menu entry out entirely, read it in `client/routes.ts`, which runs before the application exists, the way `client/theme/theme-preferences.ts` reads its defaults: `readAppClientRuntimeConfig()` from `@nocobase/app-client/runtime` (it returns `{}` in tests, so the default applies there). Otherwise keep the route and have the page show "Unavailable" or redirect; its menu entry then stays.
- Use only route APIs that actually exist: routes have no option such as `hidden` or `enabled`; do not invent one.
- **If only the menu entry is removed, the URL can still be opened directly.**
- A flag in the browser only affects what is shown; it enforces nothing. The server must reject disabled operations independently, including direct endpoint calls.
- Verify that the UI is hidden, what happens when the URL is opened directly, and that endpoint calls are rejected; also tell the user how to re-enable the feature on the frontend and on the backend.

## 10. Customize a plugin's pages

Do not declare a plugin's own page route a second time: registering another `/install` is a conflict, not a customization. Pick one of these, in order of preference:

1. **Plugin options**: when the plugin supports them, pass options where the plugin is registered in `client/plugins.ts`, for example `users({ mount: 'settings', path: '/users' })`.
2. **Source extension**: create `client/extensions/<name>/extension.ts`; it is discovered automatically.
3. **Route override**: add an entry to `client/route-overrides.ts`; its `routeId` is `<plugin-package>:<route-name>`.

- An override replaces only `componentLoader`. The route identity, path, `auth` and owning plugin stay the same.
- Source extensions and route overrides apply only to App routes (those declared with `defineAppRoutes()`); a plugin's settings pages and dev pages are not covered.
- Keep the replacement page lazy, declare `componentEntry` so tools can find the source file, and default-export the component. `componentEntry` is the replacement module's path from the application root, without an extension.

A route override replacing the workflow plugin's run detail page (an App route; its id is the package name and the route name):

```ts
// client/route-overrides.ts
import {
  defineClientRouteComponentOverrides,
  type AppClientRouteComponentOverrideDefinition,
} from '@nocobase/app-client/plugins';

export const routeComponentOverrides: readonly AppClientRouteComponentOverrideDefinition[] =
  defineClientRouteComponentOverrides([
    {
      routeId: '@nocobase/app-plugin-workflow:workflow-run-detail',
      componentEntry: './client/pages/workflow-run-detail/index',
      componentLoader: () => import('./pages/workflow-run-detail/index.js'),
    },
  ]);

export default routeComponentOverrides;
```

Or, instead of that entry (one override per route), a source extension, which keeps the override together with its own files under one folder; `client/source-extensions.ts` loads every `client/extensions/*/extension.ts`:

```ts
// client/extensions/workflow-run-ui/extension.ts
import {
  defineClientRouteComponentOverrides,
  defineClientSourceExtension,
  type AppClientSourceExtension,
} from '@nocobase/app-client/plugins';

const workflowRunUiExtension: AppClientSourceExtension =
  defineClientSourceExtension({
    name: 'workflow-run-ui',
    routeComponentOverrides: defineClientRouteComponentOverrides([
      {
        routeId: '@nocobase/app-plugin-workflow:workflow-run-detail',
        componentEntry: './client/extensions/workflow-run-ui/pages/run-detail',
        componentLoader: () => import('./pages/run-detail.js'),
      },
    ]),
  });

export default workflowRunUiExtension;
```

- **A route can be overridden only once across the three mechanisms**; a second override raises an error that names the route id. Pick one; do not stack them.
- Sign-in, registration, forgot password and reset password are the application's own routes, not the plugin's: edit the matching page in `client/pages/auth/` directly, and do not add another mechanism.

## 11. Where rendering happens

- `client/routing/` renders routes, checks access, and handles loading and error states.
- `client/layouts/` holds the three layouts: App, Settings and Dev; `client/layouts/components/` holds the containers, navigation, branding and account controls they share. Each layout owns its own permissions and route rendering.
- Declare business routes only in `client/routes.ts`, never in the directories above.

When customizing the shell, keep the behaviors listed in [section 1 of `shell.md`](shell.md#1-behaviors-to-keep).

## 12. Update the route test

`tests/logic/client-routes.test.ts` checks the application's routes:

- `keeps the landing page and the authentication pages`: the home page and the four authentication pages still exist. Adding a page does not require changing it.
- `loads every page component`: calls every page's `componentLoader` in turn (including child routes at every level, settings pages and dev pages) and confirms that the module default-exports a component. Adding a page does not require changing it; it fails when a page file has no default export. A settings or App entry with `parent` pointing at another package's group is the exception: register that package's routes in `resolveRoutes()` first (see "Contribute pages to another plugin's settings group" in [section 5](#5-three-kinds-of-routes)).
- `pins the page authorization of every signed-in page`: lists, in depth-first order, every page in the app routes that requires sign-in, including child routes (settings pages and dev pages excluded). **When you add an App page (`defineAppRoutes`) with `auth: 'required'`, including its child routes, add it here; do not add settings or dev pages, or the comparison fails**: `authorizedAs` is `null` for a page whose resolved `authz` is `'skip'`, `'unrestricted'` for an unrestricted-only page, the resource id for a page that checks page access (`'projects'`), and `type:id` for any other resource (`'composite:project-reports'`); a nested page that omits `authz` shows its parent's value. The example's projects routes add `projects`, `project-new`, `project-edit`, `project-detail` and `project-detail-edit`, all `null`, in that order; a page that declares the drawer under itself adds its own pair, such as `project-dashboard-detail` and `project-dashboard-detail-edit`. A page with tabs whose header opens overlays adds a route per tab and per overlay under each tab: `customerDetailRoutes('customer')` adds `customer-detail`, `customer-detail-overview`, `customer-detail-overview-edit`, `customer-detail-orders` and `customer-detail-orders-edit`, every other page that declares it adds the same set under its own owner, and a helper in the test spells one set out (["The route test" in `example/detail-page-tabs.md`](example/detail-page-tabs.md#the-route-test)). Stored page grants reference the resource id, and changing one requires migrating existing grants, so this list is deliberately pinned.

After the change, run `pnpm exec vitest run tests/logic/client-routes.test.ts`.

## 13. Verify

- The page opens at its path, including with the deployment base path in the browser (for example `/main/projects`); after a reload it stays on the current page.
- The menu entry appears in the sidebar, its text is correct in every language, and it is highlighted when the page is open.
- Visiting a `required` page while signed out redirects to the sign-in page.
- Without permission, a page with `authz` disappears from the menu, and opening its URL directly does not load the page component.
- Opening a child route URL directly (for example `/projects/1`, `/projects/1/edit` or `/projects/edit/1`) shows the parent page and the child route correctly: the drawer and the dialog on it for the second, the dialog alone for the third.
- On a page with tabs, open each action in the page's header from a tab other than the first: the URL keeps the tab (`/customers/1/orders/edit`), the tab stays selected behind the overlay, and closing returns to it.
- Page code loads only on navigation and is not in the initial bundle.
- Call the endpoints the page uses directly as an ordinary user, and confirm that server authorization matches the page settings.

### Checking permission states in the browser

Root holds every grant, so a hidden page, a denied tab or a read-only settings card only appears for another account. On the local development application:

1. As root, create a permission set for the check under Settings → Authorization → Permission sets (`/settings/authorization/permission-sets`) that grants exactly what the state needs: nothing for a hidden page, the page's `access` for a visible one, `read` without `update` on the settings item for a read-only card.
2. Ask the user to create a test account under Settings → Users (`/settings/users`) with that permission set as its role, or to assign the set to an existing test account from the set's Assignments. Do not choose or enter its password yourself.
3. Confirm the decision before looking at the page: the Permission Inspector (`/settings/authorization/inspector`) shows, for that account and each action, Allowed or Not allowed with the reason.
4. Ask the user to sign in as the test account into a second session file, `capture.mjs login --state storage/ui-workflow/auth-limited.json` ([`../scripts/capture.md`](../scripts/capture.md)), and take the permission shots with `"state": "storage/ui-workflow/auth-limited.json"` in their configuration. The same session calls the endpoints "as an ordinary user".
5. Afterwards delete the permission set and ask the user to remove the account, or list both in the report; delete `auth-limited.json` with the other records.

The pending and failed outcomes of `useCan` cannot be produced this way: cover them in a test, setting `permission.isPending` or `permission.error`, which the `useCan` mock of `tests/components/page-harness.test.tsx` returns.
