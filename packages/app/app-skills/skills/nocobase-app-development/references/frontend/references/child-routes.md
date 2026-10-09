# Child routes

Child pages, page tabs and navigation groups are all declared as routes. Routes are the source of navigation in App, Settings and Dev; how child content is presented (inline, covering, dialog, drawer) is decided by page code.

For the basic rules on route fields, `auth`, `authz`, menus, the back button and breadcrumbs, see [`page.md`](page.md). For dialogs and drawers (`RouteDialog`, `RouteDrawer`, `useRouteOverlay`, `beforeClose`), see [`overlay.md`](overlay.md).

## 1. Basic rules

- **Child routes go in the parent route's `children`**, declared in `client/routes.ts`, not in page component files.
- A child route's `path` is relative to its parent and is appended to the parent's path. A leading `/` is stripped before joining, so `new` and `/new` behave the same; this handbook writes the form without `/`.
- **The parent page must place `<Outlet />` itself**, where the child content should appear. Pages do not insert an Outlet automatically, and neither do `RouteChildPage`, `RouteDialog` or `RouteDrawer`; only a plain navigation group gets its Outlet from the route renderer.
- **A child route that is a page of its own returns `RouteChildPage`.** Only tab content renders inline. A child route with a `PageContainer` of its own — a record's page, a form too long for a dialog, an import page — wraps it in `RouteChildPage` ([section 5](#5-covering-child-pages-routechildpage)). Returned bare, it renders at the parent's `Outlet`, below everything the parent shows, and the user has to scroll past the parent page to find it. A page that returns a bare `PageContainer` belongs on a top-level route instead.
- Child routes inherit the entry route's `auth` and cannot change it, and follow the `authz` inheritance rules in [section 4 of `page.md`](page.md#4-authz-page-authorization): a child page renders only after the parent page's check passes.
- Link to a child route with a relative path and keep the query string ([section 2.2 of `overlay.md`](overlay.md#22-place-the-outlet-in-the-parent-page)). A relative path resolves against the route that renders the link, not the URL on screen ([section 2 of `page.md`](page.md#2-the-page-component)).
- Route declarations have no `index` field. Do not invent an index route, and do not register a child route at the parent's own path; when "opening the parent URL shows a particular child page" is needed, use the redirect in [section 4](#4-page-tabs).
- Do not change the shell, the route renderer or the ServiceProvider to add a menu entry; menu entries come only from `navigation` on routes ([section 6 of `page.md`](page.md#6-menus)).
- Design paths around business needs; there is no fixed naming format. Do not write the deployment base path `/main`.

## 2. File layout

A page with child routes becomes a folder: the page itself is `index.tsx`, and each child route is named after its path segment and placed beside it. When a child route has children of its own, it becomes a folder too:

```text
client/pages/projects/
  index.tsx                  /projects                     List page; <Outlet context={outletContext} /> at the end
  new.tsx                    /projects/new                 RouteDialog: new project
  detail/index.tsx           /projects/:projectId          RouteDrawer: project details; <Outlet context={...} /> inside the drawer
  detail/edit.tsx            /projects/edit/:projectId     RouteDialog: edit project from a row's menu, alone over the list
                             /projects/:projectId/edit     The same dialog from the drawer, stacked on it
  project-form.tsx           Form component shared by create and edit
  project-delete-dialog.tsx  Delete confirmation (AlertDialog, state inside the component)
  types.ts
```

- A fixed path segment uses a file of the same name: `/projects/new` is `projects/new.tsx`.
- A parameter segment uses a name that describes what the page is for: `:projectId` is `detail/`.
- One file serves every route that shows the same thing: both edit routes load `detail/edit.tsx`, and a page that opens the project drawer over itself loads `detail/index.tsx` ([section 2.1 of `overlay.md`](overlay.md#21-declare-the-child-routes)).
- Components and types used only by these pages stay in the same folder, not in `client/components/` (which holds components shared across the whole application).
- Keep components and non-primitive constants in separate files: when one file exports both a component and an object or array constant, Fast Refresh stops working and ESLint (`react-refresh/only-export-components`) reports an error; string and number constants are allowed. Put constants and types in a separate module such as `types.ts`.

Adding a set of child routes usually changes these files:

| File               | What to change                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `client/routes.ts` | Declare the pages, menu entries and nested `children`                                               |
| Parent page        | Place `Outlet`; add links or tabs that point to the child routes                                    |
| Child pages        | Default-export the page component                                                                   |
| `client/locales/`  | Menu and page copy (`en-US.ts`, `zh-CN.ts`)                                                         |
| `tests/`           | The route test (see [section 12 of `page.md`](page.md#12-update-the-route-test)) and behavior tests |

## 3. Four ways to present a child route

A child route renders in the parent page's Outlet, and what its component returns decides how it is shown. Tab content returns its content and is shown inline; every other child route returns one of the three components below and covers the parent page. There is no fifth way: a child route that returns its own `PageContainer` without `RouteChildPage` is shown inline with a second page frame, below the parent's content.

|                 | Inline (tabs, etc.)                      | `RouteChildPage`                             | `RouteDialog`                          | `RouteDrawer`    |
| --------------- | ---------------------------------------- | -------------------------------------------- | -------------------------------------- | ---------------- |
| Position        | Where the Outlet sits in the parent page | Covers the whole content area                | Center of the page                     | Side of the page |
| Modal           | No                                       | No; the sidebar and header remain usable     | Yes                                    | Yes              |
| `breadcrumb`    | Omit                                     | To name it in the header's trail             | Omit                                   | Omit             |
| `PageContainer` | None; uses the parent page's             | Adds its own, inside `RouteChildPage`        | None                                   | None             |
| How to leave    | Switch to another child route            | `BackButton` or browser back                 | Close button, Esc, backdrop, `close()` | Same as left     |
| Use for         | Page tabs                                | Child pages with long forms or many sections | Create and edit forms                  | Record details   |

For how to write `RouteDialog` and `RouteDrawer`, see [`overlay.md`](overlay.md). A record's own page declared beside its list leaves by `BackButton` too, with `to` pointing at the list ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)).

## 4. Page tabs

### Use child routes by default

- When building a page with tabs, each tab is a child route by default; the user does not have to ask for "routes" separately. This is the same for App, Settings and Dev pages, including plugin pages. When the user explicitly asks for a different interaction, follow the user's request.
- A tab is a view of the parent page, not a separate destination: tab routes declare no `navigation`, and no `breadcrumb` (the header's trail stops at the parent page).
- Tab content goes in the parent route's `children`; the parent page places `<Outlet />` in its content area; switching tabs uses route navigation.
- **Derive the selected tab from the URL**; do not keep a separate `activeTab` state. Every tab can be opened directly, survives a reload, and works with the browser's back and forward.
- Fixed tabs (Summary, By owner) and parameterized tabs (for example `:year`) both use this pattern. A child page with parameters reads them with `useParams()`.
- This rule is about tabs on a page. A record detail that needs tabs is such a page rather than a drawer (guideline T2.1).

### Default tab redirect

- When the parent page's URL is opened (without a tab), redirect with `replace` to the default tab's URL, keeping the query parameters.
- Default tab: the one the business specifies, if any; otherwise the first accessible tab in display order. When the specified tab is not accessible, also use the first accessible one.
- While permissions or tab data are still loading, show a loading state; when no tab is accessible, show an empty state or a no-permission state, and do not redirect.
- Clicking a tab uses ordinary navigation (without `replace`), so back and forward return to previously selected tabs.
- When a tab's URL is opened directly or reloaded, stay on that tab. Do not redirect an explicit child route URL back to the default tab, even when the user has no permission for that tab or it does not exist; leave those cases to the child route's own permission check and the page's error handling.
- Write the redirect in the parent page with existing React Router APIs: get the parent page's own path with `useResolvedPath('.')` and match it in full against `location.pathname`. Do not decide whether this is the parent URL from "the Outlet is empty" or from a string prefix.

### Complete example

Put the projects list and a new "Project reports" page into the same navigation group. The reports page has two tabs, "Summary" and "By owner":

```ts
const appRoutes: AppClientRouteContribution = defineAppRoutes([
  // … existing routes (home, sign-in pages)
  {
    // Navigation group: only name, navigation and children; no componentLoader or authz, and no path here either.
    name: 'project-management',
    navigation: { title: 'navigation.projectManagement', icon: FolderKanban },
    children: [
      {
        name: 'projects',
        path: '/projects',
        auth: 'required',
        authz: 'skip',
        navigation: { title: 'navigation.projects' },
        componentLoader: () => import('./pages/projects/index.js'),
        // … children as in page.md
      },
      {
        name: 'project-reports',
        path: '/project-reports',
        auth: 'required',
        authz: 'skip',
        navigation: { title: 'navigation.projectReports' },
        componentLoader: () => import('./pages/project-reports/index.js'),
        children: [
          {
            // Tab: no navigation and no breadcrumb.
            name: 'project-reports-summary',
            path: 'summary',
            authz: 'skip',
            componentLoader: () => import('./pages/project-reports/summary.js'),
          },
          {
            name: 'project-reports-owners',
            path: 'owners',
            authz: 'skip',
            componentLoader: () => import('./pages/project-reports/owners.js'),
          },
        ],
      },
    ],
  },
]);
```

The group has no `path`, so the pages inside it use full paths: `/projects` and `/project-reports`.

The parent page, `client/pages/project-reports/index.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useResolvedPath,
} from 'react-router';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { buttonVariants } from '#components/ui/button';
import { cn } from 'cn';

export default function ProjectReportsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  // Redirect to the default tab only when the URL is exactly the parent page (/project-reports or /project-reports/).
  const isParentEntry =
    matchPath({ path: parentPath.pathname, end: true }, location.pathname) !==
    null;

  // The order is the display order. Both tabs use the parent page's access, so the first one is the default tab.
  const tabs = [
    { path: 'summary', label: t('projectReports.tabs.summary') },
    { path: 'owners', label: t('projectReports.tabs.owners') },
  ];

  if (isParentEntry) {
    // replace: leaves no parent URL in the history, so going back does not get redirected again.
    return (
      <Navigate
        replace
        to={{ pathname: tabs[0].path, search: location.search }}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('projectReports.title')}
        description={t('projectReports.description')}
      />
      <nav
        aria-label={t('projectReports.tabs.label')}
        className='flex flex-wrap gap-1 border-b pb-2'
      >
        {tabs.map((tab) => (
          // Tabs are page navigation, so use links. NavLink adds aria-current='page' to the current tab, and the selected style is based on it.
          <NavLink
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
            )}
            key={tab.path}
            to={{ pathname: tab.path, search: location.search }}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {/* Content of the current tab */}
      <Outlet />
    </PageContainer>
  );
}
```

The tab page, `client/pages/project-reports/summary.tsx` (`owners.tsx` is written the same way):

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

// Tab content renders inside the parent page's PageContainer; do not wrap it in another PageContainer.
export default function ProjectReportsSummary(): ReactElement {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectReports.summary.title')}</CardTitle>
        <CardDescription>
          {t('projectReports.summary.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>{/* Statistics */}</CardContent>
    </Card>
  );
}
```

The copy is the `projectReports` group and the `navigation` entries in [`example/copy.md`](example/copy.md); add it to both locale files.

Behavior:

- Opening `/project-reports?range=30d` redirects with `replace` to `/project-reports/summary?range=30d`.
- Opening `/project-reports/owners` directly stays on "By owner".
- Clicking a tab adds a history entry, and the content renders where the Outlet is; the sidebar keeps "Project reports" highlighted (tab routes have no menu entry, so the nearest ancestor is highlighted).
- Switching tabs keeps the query string, so the parameters of the page this one covers survive it. A tab's own parameters, named apart from everything else ([section 5 of `table.md`](table.md#5-writing-search-and-filters-to-the-url)), may stay when switching tabs or be dropped, as the business decides; the page removes them when the user leaves ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)).

Tabs are implemented as links because they are page navigation, announced as links with `aria-current` on the selected one. To borrow the button look, apply `buttonVariants` to `NavLink`. `<Button render={<NavLink />}>` would announce each tab as a button, which is right for an action that opens a route ("New project", [section 2 of `styling.md`](styling.md#2-components-are-built-on-base-ui-not-radix)) but not for navigation. The `tabs` primitive is for tabs inside one view that are not routes: it brings the ARIA tab keyboard behavior, and its `TabsTrigger` elements sit inside `TabsList` (the skill's composition rules). Using it for route tabs would mean keeping its selected value in sync with the URL yourself.

### A record detail page with tabs

A detail view with several sections, sub-tables or tabs is a page rather than a drawer (guideline T2.1). It combines the pieces above:

- Route `/customers/:customerId` with tab children such as `overview` and `orders`; no `navigation`, because the path has a parameter. It covers the list as a child with `RouteChildPage` ([section 5](#5-covering-child-pages-routechildpage)), which keeps the list's state, or sits beside the list route.
- `BackButton` above `PageHeader` returns to the list; the record name is the `PageHeader` title. Beside the list, give it `to`: `<BackButton to={{ pathname: '/customers', search: location.search }} />`. When the page or its tabs write parameters of their own, the way back removes them ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)).
- The page reads the id with `useParams()`, renders an inner component keyed by it, and loads the record once with the pattern in ["Loading data in a component" of `api.md`](api.md#loading-data-in-a-component), including its 401, 403 and 404 states; the record name is the `PageHeader` title.
- The tab bar and the default-tab redirect work as in the example above; the page passes the loaded record to the tabs with `<Outlet context={…}>` (memoized, [section 2.2 of `overlay.md`](overlay.md#22-place-the-outlet-in-the-parent-page)), so the tabs do not load it again, and each tab loads only its own data, such as the customer's orders.
- The record's actions sit in the header, above the tabs (guideline T2.2), and what they open stacks on the tab being shown: [the next section](#overlays-opened-from-the-header-of-a-page-with-tabs). [`example/detail-page-tabs.md`](example/detail-page-tabs.md) is the complete page.

### Overlays opened from the header of a page with tabs

A tab is the view the user is on, so a dialog, drawer or covering page that the page's header opens — the record's "Edit", a form too long for a dialog — opens over the tab being shown (guideline I9): `/customers/12/orders/edit`, not `/customers/12/edit`. Declared once under the page, beside the tabs, the overlay takes the tab's place in the page's `Outlet`: the tab unmounts behind the dialog, no tab is selected, a link to the dialog forgets the tab, and closing goes to `/customers/12`, which redirects to the default tab — the user who opened "Edit" on Orders comes back to Overview.

**Declare the header's overlays under every tab.** A function returns them for one tab, so each tab adds them with one call and a new overlay is added in one place; the tab's route name, passed in, keeps their names unique. The function that declares the page takes the page that opens it, as `projectDetailRoutes(owner)` does for a drawer, because the same page is declared under every page that opens a customer ([section 5](#the-same-detail-page-over-another-page)):

```ts
// client/routes.ts, beside projectDetailRoutes
/** The overlays a customer page's header opens, declared under each of its tabs; `tab` is that tab's route name. */
function customerHeaderRoutes(tab: string): AppClientRouteDefinition[] {
  return [
    {
      // …/:customerId/<tab>/edit: edit dialog (RouteDialog), over the tab being shown
      name: `${tab}-edit`,
      path: 'edit',
      authz: 'skip',
      componentLoader: () => import('./pages/customers/detail/edit.js'),
    },
  ];
}

/**
 * A customer's page, its tabs and the overlays its header opens, under a page that opens customers; `owner` keeps
 * the names unique.
 */
function customerDetailRoutes(owner: string): AppClientRouteDefinition[] {
  const page = `${owner}-detail`;
  return [
    {
      // …/:customerId: the customer's page (RouteChildPage), covering the page that declares it
      name: page,
      path: ':customerId',
      authz: 'skip',
      componentLoader: () => import('./pages/customers/detail/index.js'),
      children: [
        {
          name: `${page}-overview`,
          path: 'overview',
          authz: 'skip',
          componentLoader: () => import('./pages/customers/detail/overview.js'),
          children: customerHeaderRoutes(`${page}-overview`),
        },
        {
          name: `${page}-orders`,
          path: 'orders',
          authz: 'skip',
          componentLoader: () => import('./pages/customers/detail/orders.js'),
          // A tab's own children, such as an order's drawer, go beside the header's overlays.
          children: customerHeaderRoutes(`${page}-orders`),
        },
      ],
    },
  ];
}
```

The customers list adds the page with `...customerDetailRoutes('customer')` among its `children`, as the projects list adds its drawer ([section 1 of `page.md`](page.md#1-declare-the-route)). Write each tab out rather than generating the tabs from a list: every `componentLoader` needs a literal `import()` path, and a tab may have an `authz` and children of its own.

**Link from the header through the tab on screen.** The header belongs to the page's route, where a bare `edit` resolves to `/customers/12/edit` whichever tab is showing ([section 2 of `page.md`](page.md#2-the-page-component)). The page finds the current tab among the tabs it renders, the way it finds its own URL for the redirect — ``matchPath({ path: `${pagePath.pathname}/${tab.path}`, end: false }, location.pathname)`` — and passes its path to the header's actions:

```tsx
// client/pages/customers/detail/index.tsx, beside the page component
/**
 * The customer's actions, at the top of the page (guideline T2.2). `tab` is the tab on screen: what they open is
 * declared under every tab and stacks on this one, so closing returns to it.
 */
function CustomerHeaderActions({
  tab,
}: {
  readonly tab: string;
}): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <Button
      nativeButton={false}
      render={
        <Link to={{ pathname: `${tab}/edit`, search: location.search }} />
      }
    >
      {t('customers.actions.edit')}
    </Button>
  );
}
```

**Each tab places an `Outlet` and passes the page's context on.** The header's overlays now render through the tab, and a child route reads the context of the nearest `Outlet` above it, which is the tab's: without one, the dialog at `…/orders/edit` renders nothing; with other data, its `onSaved` and `onNotFound` never reach the page.

```tsx
// client/pages/customers/detail/orders.tsx
import type { ReactElement } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import type { CustomerPageOutletContext } from '../types.js';

export default function CustomerOrdersTab(): ReactElement {
  const context = useOutletContext<CustomerPageOutletContext>();
  return (
    <>
      {/* … the customer's orders, which this tab loads itself */}
      {/* The overlays the page's header opens render here, over this tab: pass them the page's context. */}
      <Outlet context={context} />
    </>
  );
}
```

- **An action that belongs to one tab stays in that tab** — "New order" in the Orders tab's toolbar — and links with a bare segment, which resolves under the tab by itself; its overlay is declared under that tab only. Only actions on the record itself go in the header (guideline T2.2), and only theirs are declared under every tab.
- **Do not get back to the tab through `closeTo`, `location.state` or a query parameter** instead. With the overlay beside the tabs, the tab still unmounts while it is open and no tab is selected; state is lost on a refresh or a shared link; a query parameter travels with every link that keeps the query string.
- **An action that leaves the page** — back to the list after the record is deleted — navigates from the page's own route, in the page component or in a function the page passes through its context: `navigate({ pathname: '..', search: withoutParams(location.search, CUSTOMER_PAGE_PARAMS) }, { relative: 'route', replace: true })`, which returns the list's parameters and removes the page's own, as its `BackButton` does ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)). Counted from inside an overlay, the number of `..` levels changes with the tab.
- **A covering page the header opens** (`RouteChildPage`) is declared under every tab the same way and renders through the tab's `Outlet`, inside this page. It still covers this page whole, header and tab bar included, even after this page has been scrolled ([section 5](#5-covering-child-pages-routechildpage)).
- Registration rejects two children of one tab with the same path, so a header overlay and one of the tab's own children cannot share a segment (`new` for both); name them apart.

Behavior:

- "Edit" on `/customers/12/orders?status=vip` — `status` being the customers list's filter, carried down — opens `/customers/12/orders/edit?status=vip`; Orders stays selected and mounted behind the dialog.
- Closing, saving, Esc and Back return to `/customers/12/orders?status=vip`, without passing through the default-tab redirect.
- Opening `/customers/12/orders/edit` directly shows the page, Orders and the dialog on it.
- [`example/detail-page-tabs.md`](example/detail-page-tabs.md) is the complete page, with a test that opens "Edit" from every tab.

### When tabs have their own permissions

A tab that the parent page's check covers declares `authz: 'skip'`. When a tab is only for people who have been granted access, declare its own request:

```ts
const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'project-reports',
    path: '/project-reports',
    // …
    componentLoader: () => import('./pages/project-reports/index.js'),
    children: [
      {
        name: 'project-reports-summary',
        path: 'summary',
        authz: 'skip',
        componentLoader: () => import('./pages/project-reports/summary.js'),
      },
      {
        // Only for people who have been granted access.
        name: 'project-reports-owners',
        path: 'owners',
        authz: {
          resource: { type: 'page', id: 'project-reports-owners' },
          action: 'access',
        },
        componentLoader: () => import('./pages/project-reports/owners.js'),
      },
    ],
  },
]);
```

The parent page checks the same permission with `useCan`: tabs without permission are not shown, and the default tab is decided only after the permission check finishes. The business requirement below is to show "By owner" by default, and "Summary" when the user has no permission for it:

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useResolvedPath,
} from 'react-router';

import { Loading } from '#components/loading';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { buttonVariants } from '#components/ui/button';
import { cn } from 'cn';

export default function ProjectReportsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  const isParentEntry =
    matchPath({ path: parentPath.pathname, end: true }, location.pathname) !==
    null;
  // Keep in sync with the authz of the owners child route in routes.ts.
  const ownersAccess = useCan({
    resource: { type: 'page', id: 'project-reports-owners' },
    action: 'access',
  });

  // Tabs without permission are not shown. can is false while the check is pending and when it fails, so a failed check
  // hides the tab like a denial (page.md section 8); the tab route's own check still decides a direct URL.
  const tabs = [
    { path: 'summary', label: t('projectReports.tabs.summary') },
    ...(ownersAccess.can
      ? [{ path: 'owners', label: t('projectReports.tabs.owners') }]
      : []),
  ];

  if (isParentEntry) {
    // Redirecting before the permission check finishes may land on the wrong tab: show a loading state first.
    if (ownersAccess.isPending) {
      return (
        <Loading
          // Fixed on purpose: the page-level loading state in client/routing/client-route.tsx fills the viewport below the header the same way.
          className='min-h-[calc(100svh-4rem)]'
          label={t('status.loadingPage')}
        />
      );
    }
    // The business specifies "By owner" as the default tab; when it is not accessible, use the first accessible tab.
    const target = tabs.find((tab) => tab.path === 'owners') ?? tabs[0];
    return (
      <Navigate
        replace
        to={{ pathname: target.path, search: location.search }}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('projectReports.title')}
        description={t('projectReports.description')}
      />
      <nav
        aria-label={t('projectReports.tabs.label')}
        className='flex flex-wrap gap-1 border-b pb-2'
      >
        {tabs.map((tab) => (
          // Tabs are page navigation, so use links. NavLink adds aria-current='page' to the current tab, and the selected style is based on it.
          <NavLink
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
            )}
            key={tab.path}
            to={{ pathname: tab.path, search: location.search }}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {/* Content of the current tab */}
      <Outlet />
    </PageContainer>
  );
}
```

- Here "Summary" uses the parent page's permission, so there is always an accessible tab. When every tab has its own permission and none is accessible, show an empty state or a no-permission state, and do not redirect.
- When a user without permission opens `/project-reports/owners` directly, the child route's permission check shows "Access denied"; do not redirect back to the default tab.
- Call `useCan` at the top level of the component, once for each tab that needs a check, never inside a loop or a condition.
- The overlays a page's header declares under a tab inherit that tab's `authz`: whoever may see the tab may open them over it. An overlay with a check of its own declares it once, in the function that declares it under every tab.

## 5. Covering child pages (RouteChildPage)

When a child page has a lot of content (a long form, many sections) and needs the whole page area, but the parent page's state must be preserved, cover the parent page with `RouteChildPage`. For example, add an "Import projects" page at `/projects/import` under the projects list:

```ts
const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'projects',
    path: '/projects',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'navigation.projects', icon: FolderKanban },
    componentLoader: () => import('./pages/projects/index.js'),
    children: [
      // … the dialogs and the drawer of page.md
      {
        // A covering child page; the back button above its title returns to the list.
        name: 'project-import',
        path: 'import',
        authz: 'skip',
        componentLoader: () => import('./pages/projects/import.js'),
      },
    ],
  },
]);
```

`client/pages/projects/import.tsx`:

```tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import { BackButton } from '#components/back-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';

export default function ProjectImportPage(): ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <RouteChildPage>
        {/* A covering child page uses its own PageContainer */}
        <PageContainer>
          {/* Returns to /projects with the list's search and filters. */}
          <BackButton />
          <PageHeader
            title={t('projects.import.title')}
            description={t('projects.import.description')}
          />
          {/* The page's own content */}
        </PageContainer>
      </RouteChildPage>
      {/* Deeper child routes: the Outlet goes beside RouteChildPage, not inside it */}
      <Outlet />
    </>
  );
}
```

The list page's `<Outlet />` is already at the end of `PageContainer` (see [section 2 of `page.md`](page.md#2-the-page-component)), so it needs no change; just add a secondary button that links to `import` in the page header: `<Button variant='outline' nativeButton={false} render={<Link to={{ pathname: 'import', search: location.search }} />}>`.

- `BackButton` sits above the title and returns to the list with its query string ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)). Put no "Back to list" button in `actions`.
- The header's trail shows "Projects" here, the menu page beneath. To name this page in it, declare `breadcrumb` on its route: `{ title: 'projects.import.title' }` on `project-import`, and the header shows "Projects > Import projects". That link drops the list's query string, so keep `BackButton`, or declare the trail with `usePageBreadcrumb` and `{ pathname: '/projects', search: location.search }` as the first level and drop it.
- Put the deeper `<Outlet />` beside `RouteChildPage`, not inside it, so the next level is a sibling of this page's layer and covers the content area as this one does. A child page that can only render inside — a covering page under a tab of this page, through the tab's `Outlet` — still covers this page whole: `RouteChildPage` positions from an outer element that does not scroll, and switches off everything of this page around it.
- The covered parent page keeps its own DOM, including half-filled form input and the scroll position. While covering, `RouteChildPage` makes the sibling elements before it `inert` (not focusable, not clickable) and restores them when it leaves.
- It is not modal: the sidebar and header remain usable. It has no close button and does not respond to Esc; users go back with `BackButton` or the browser's back button.
- Use it only for child pages that cover their parent page, never on a top-level page.
- A form too long for a dialog uses the same frame; `create.tsx` ([`example/create-page.md`](example/create-page.md)) is the complete page.

### The same detail page over another page

A page that shows a record whose detail is a page of its own — an orders list's customer column, a payment list's expense number — opens that page over itself, the way a dashboard opens a project's drawer ([section 2.1 of `overlay.md`](overlay.md#the-same-drawer-over-another-page)). Declare it under this page's route with the function that declares it under its own list ([section 4](#overlays-opened-from-the-header-of-a-page-with-tabs)), so it brings its tabs and the overlays its header opens, every route under a unique name:

```ts
{
  name: 'orders',
  path: '/orders',
  // … auth, authz and navigation
  componentLoader: () => import('./pages/orders/index.js'),
  children: [
    // … the orders page's own overlays
    // /orders/:customerId, its tabs and the overlays its header opens, over the orders page:
    // the modules the customers list declares.
    ...customerDetailRoutes('order-customer'),
  ],
},
```

- The link is relative — `{ pathname: String(row.customerId), search: location.search }` — never the other module's path (`/customers/12`). It keeps the whole query string, the orders page's own filters (`?status=paid`) included: the customer page's `BackButton` brings back what it finds there, so a filter the link dropped is gone when the user returns. The customer page and its tabs name their own parameters apart from the orders page's, read only those, and remove them on the way back ([section 5 of `table.md`](table.md#5-writing-search-and-filters-to-the-url), [section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)).
- **`BackButton` on the shared page must not name one parent.** Omit `to` so it follows the parent route it was opened from ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)); a hard-coded `to` sends the user who came from `/orders` to `/customers`, a page they were not on (I9). The page's Cancel, close and redirect paths follow the same rule.
- Route names are unique across the application, so the function takes an owner and composes every name from it, outside in — `order-customer-detail`, `order-customer-detail-orders`, `order-customer-detail-orders-edit` — as `projectDetailRoutes(owner)` does for drawers ([section 2.1 of `overlay.md`](overlay.md#21-declare-the-child-routes)).
- The shared page returns `RouteChildPage` as it does under its own list: under every parent it is a child route, and without the layer it renders below that parent's content.
- The added routes join the route test's page-grant list for their own path ([section 12 of `page.md`](page.md#12-update-the-route-test)).

## 6. Navigation groups and clickable parents

- **Group**: only `name`, `navigation` and `children`, with no `componentLoader`. `path` is optional; when present, it becomes the prefix of the child routes' paths; when absent, the group is only a set of entries in the menu.
- A group renders no business component (the route renderer provides its Outlet), cannot declare `authz`, and carries no page permission of its own: the first page below a group with no page above it declares its own `authz`.
- Groups can contain groups. A group's `name` must be unique, like a route name; settings group names are unique across the whole settings area.
- **Clickable parent**: a page can also have `navigation` and child pages with `navigation`. In the menu it is then both a link and expandable: the link and the expand button are two separate controls. Choose how the child pages are presented according to [section 3](#3-four-ways-to-present-a-child-route).
- Pages that should not appear in the menu, such as details and tab content, have no `navigation`. A descendant can still declare `navigation` when its ancestor does not.
- A path with a parameter cannot have `navigation`.
- `navigation.order` sets the order among siblings; lower numbers come first.
- Navigation groups keep their expanded or collapsed state while the navigation tree stays mounted; opening a new page automatically expands its ancestor groups.

## 7. Settings pages and dev pages

- Use `defineSettingsRoutes()` and `defineDevRoutes()`; pages, groups and `children` are written the same way as in App routes. Do not write `/settings` or `/dev` in the path.
- Tabs in settings pages also use child routes ([section 4](#4-page-tabs)); nested details and tabs usually have no `navigation`.
- Settings pages and dev pages both require sign-in and declare `authz` on their first page, as [section 4 of `page.md`](page.md#4-authz-page-authorization) describes. A settings page checks its settings item (["Settings pages" in `page.md`](page.md#settings-pages)); its child pages and tabs inherit that check or declare another action or item of their own, never a page grant. A dev page usually writes `'skip'`.
- Dev pages, and modules imported only by them, are left out of the production build.
- Navigation groups carry no page permission. Access checks in the browser do not replace server authorization.

## 8. Verify

1. Open the parent page's URL, including the form with a trailing `/` and the form with query parameters: it redirects only once, with `replace`, to the default accessible tab, and keeps the query parameters; going back does not return to the parent URL only to be redirected away again. While loading, or when no tab is accessible, it does not redirect repeatedly.
2. Open each child route, including by typing its URL directly, and reload it at a URL with the deployment base path: it stays on the requested tab and does not return to the default tab.
3. The parent page stays mounted, and child content appears at the expected Outlet position.
4. Use back and forward: the selected tab and the menu highlight match the URL.
5. Check the menu, the copy in each language, the link and expand button of clickable parents, and navigation on narrow screens.
6. Remove permission for the parent page: none of the child pages can load. Then remove permission for just one child page that declares `authz` explicitly.
7. Settings pages and dev pages: a settings page's menu position is as expected; a dev page opens by URL inside the App shell and does not appear in the production build.
8. Covering child pages: opening one covers the parent from the top of the content area, whatever the parent's scroll position, and nothing of the parent shows below it; the back button returns to the list with exactly the search and filters it had, and nothing the child page or its tabs wrote is left in the list's URL; the covered page keeps its input and scroll position; after going back, it works normally.
9. Pages with tabs whose header opens overlays: from a tab other than the default, open each one. Its URL is the tab's URL plus its own segment, the tab stays selected and its content mounted behind it, and closing, saving, Esc and Back all return to that tab; opening that URL directly shows the same tab behind it.

Write these behaviors as tests in `tests/` (see [`testing.md`](testing.md)).
