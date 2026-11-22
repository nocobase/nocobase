# Child routes

Child pages, page tabs and navigation groups are all declared as routes in `client/routes.ts`; what a child route's component returns decides how it is presented. Route fields, `auth`, `authz`, menus and breadcrumbs are in [`page.md`](page.md); `RouteDialog`, `RouteDrawer` and `useRouteOverlay` in [`overlay.md`](overlay.md).

## 1. Basic rules

- Child routes go in the parent route's `children`, never in component files. A child `path` is relative to its parent (`new` and `/new` are the same).
- The parent page places `<Outlet />` itself. Nothing inserts one, neither `RouteChildPage`, `RouteDialog` nor `RouteDrawer`; only a navigation group gets its Outlet from the route renderer.
- A child route that is a page of its own returns `RouteChildPage` ([section 5](#5-covering-child-pages-routechildpage)); only tab content renders inline. A bare `PageContainer` would render below the parent's content.
- Child routes inherit the root's `auth`, and the `authz` rules of [section 4 of `page.md`](page.md#4-authz-page-authorization) apply: a child renders only after its parent's check passes.
- Link with a relative path and keep `location.search`; a relative path resolves against the route that renders the link ([section 2 of `page.md`](page.md#2-the-page-component)).
- There is no `index` route, and no child at the parent's own path; to show a default child, redirect ([section 4](#4-page-tabs)).

## 2. File layout

A page with child routes is a folder; each child is named after its segment, and becomes a folder when it has children of its own:

```text
client/pages/projects/
  index.tsx              /projects                  list page; <Outlet /> at the end
  new.tsx                /projects/new              RouteDialog: create
  detail/index.tsx       /projects/:projectId       RouteDrawer: details; <Outlet /> inside the drawer
  detail/edit.tsx        /projects/:projectId/edit  RouteDialog: edit, over the drawer
  project-form.tsx       form shared by create and edit
  scopes.ts, types.ts
```

- A parameter segment takes a name for what it shows (`:projectId` is `detail/`). One file serves every route that shows the same thing.
- Components and types used only by these pages stay in the folder, not in `client/components/`.
- Keep components and non-primitive constants in separate files, or Fast Refresh breaks and `react-refresh/only-export-components` fails.

## 3. Four ways to present a child route

- **Inline**: renders at the parent's Outlet, inside the parent's `PageContainer`; no `breadcrumb`. For page tabs.
- **`RouteChildPage`**: covers the content area, not modal (sidebar and header stay usable), with its own `PageContainer` and a `breadcrumb`; left through the shell's parent link or browser back. For a complex record's detail page (`:id/details`) or an import page.
- **`RouteDialog`**: centred and modal, no `PageContainer` or `breadcrumb`; closed by its buttons, Esc or the backdrop. For create (`new`) and edit (`:id/edit`).
- **`RouteDrawer`**: the same, on the right. For a record of about 15 fields (`:id`).

Forms never use a drawer or a covering page (guideline T3.1). Declare the container as the route's `presentation` (`{ kind: 'child-page' }`, or `{ kind: 'dialog' | 'drawer', title }`), so the application opens it before the module, its check and its data are ready, and renders waiting, denial and failure inside it. A hosted `RouteChildPage` moves its `className` onto that layer.

## 4. Page tabs

### Use child routes by default

- Each tab of a page is a child route, unless the user asks for something else. A tab is a view of its page: no `navigation`, no `breadcrumb`.
- Derive the selected tab from the URL; keep no `activeTab` state. Every tab opens directly, survives a reload, and works with back and forward. Parameterized tabs (`:year`) read `useParams()`.
- A record detail that needs tabs is a detail page, not a drawer (guideline T2.1).

### Default tab redirect

- Opening the parent URL redirects with `replace` to the default tab, keeping the query: the tab the business names, else the first accessible one.
- While permissions or tab data load, show loading; when no tab is accessible, show an empty or no-permission state and do not redirect.
- Clicking a tab is ordinary navigation (no `replace`). An explicit tab URL is never redirected, even when denied or unknown; its own check and the page's error handling apply.

### Complete example

A "Project reports" page with two tabs:

```ts
{
  name: 'project-reports',
  path: '/project-reports',
  auth: 'required',
  authz: 'skip',
  navigation: { title: 'navigation.projectReports' },
  componentLoader: () => import('./pages/project-reports/index.js'),
  children: [
    {
      name: 'project-reports-summary',
      path: 'summary',
      componentLoader: () => import('./pages/project-reports/summary.js'),
    },
    {
      name: 'project-reports-owners',
      path: 'owners',
      componentLoader: () => import('./pages/project-reports/owners.js'),
    },
  ],
},
```

`client/pages/project-reports/index.tsx`:

```tsx
export default function ProjectReportsPage(): ReactElement {
  const { t } = useTranslation();
  // Display order; both tabs use the parent's access, so the first is the default.
  const tabs = [
    {
      path: 'summary',
      dataset: 'summary',
      label: t('projectReports.tabs.summary'),
    },
    {
      path: 'owners',
      dataset: 'owners',
      label: t('projectReports.tabs.owners'),
    },
  ];
  const tabState = useListTabs({
    tabs,
    parameterKeys: ['q', 'status', ...TABLE_URL_KEYS],
  });
  if (tabState.fallback) return <Navigate replace to={tabState.fallback} />;
  return (
    <PageContainer>
      <PageHeader
        title={t('projectReports.title')}
        description={t('projectReports.description')}
      />
      {/* One row that scrolls sideways on a phone, never wrapping. */}
      <nav
        aria-label={t('projectReports.tabs.label')}
        className='flex gap-1 overflow-x-auto border-b pb-2'
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tabState.destination(tab)}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'shrink-0 text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
            )}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {/* A detail under a tab uses this source in its breadcrumb. */}
      <Outlet context={{ source: tabState.source }} />
    </PageContainer>
  );
}
```

Tab content returns its content without a `PageContainer`.

- `useListTabs` (`#hooks/use-list-tabs`) derives the active tab from the route. Tabs with different data get different `dataset` values; `parameterKeys` lists every key the lists own, and switching dataset clears them while keeping the enclosing page's. Pass only accessible tabs, and `pending: true` while checks load; a missing tab then falls back to the first accessible one.
- Tabs are links (`NavLink` adds `aria-current`) styled with `buttonVariants`; the `tabs` primitive is for tabs inside one view that are not routes.

### A record detail page with tabs

A detail with sections, sub-tables or tabs is a page at `:customerId/details`, returning `RouteChildPage` over its list, with tab children such as `overview` and `orders`:

- It declares its trail with `usePageBreadcrumb`, including while loading or failed ([section 7 of `page.md`](page.md#7-back-button-and-breadcrumbs)); the record name is the `PageHeader` title.
- It reads the id with `useParams()` and loads the record once with `useListData(path, { scopes: [customerScope(id)] })` ([`api.md`](api.md#loading-data-in-a-component)), handling 401, 403 and 404; tabs load only their own data.
- The record's actions sit in the header, above the tabs (guideline T2.2), and what they open stacks on the tab being shown ([next section](#overlays-opened-from-the-header-of-a-page-with-tabs)). The Examples template's `client/pages/skill-projects/detail.tsx` is a detail page without tabs ([`executable-list-edit.md`](executable-list-edit.md)).

### Overlays opened from the header of a page with tabs

A tab is the view the user is on, so what the page's header opens — the record's "Edit" — opens over the tab being shown (guideline I9): `/customers/12/details/orders/edit`. Declared once beside the tabs, it would replace the tab in the page's Outlet, and closing would land on the default tab.

**Declare the header's overlays under every tab**, from one function:

```ts
/** The overlays a customer page's header opens, under one tab; `tab` is that tab's route name. */
function customerHeaderRoutes(tab: string): AppClientRouteDefinition[] {
  return [
    {
      name: `${tab}-edit`,
      path: 'edit',
      presentation: { kind: 'dialog', title: 'customers.edit.title' },
      componentLoader: () => import('./pages/customers/detail/edit.js'),
    },
  ];
}

/** A customer's page, its tabs and their overlays, under a page that opens customers. */
function customerDetailRoutes(owner: string): AppClientRouteDefinition[] {
  const page = `${owner}-detail`;
  return [
    {
      name: page,
      path: ':customerId/details',
      breadcrumb: { title: 'customers.detail.title' },
      presentation: { kind: 'child-page' },
      componentLoader: () => import('./pages/customers/detail/index.js'),
      children: [
        {
          name: `${page}-overview`,
          path: 'overview',
          componentLoader: () => import('./pages/customers/detail/overview.js'),
          children: customerHeaderRoutes(`${page}-overview`),
        },
        {
          name: `${page}-orders`,
          path: 'orders',
          componentLoader: () => import('./pages/customers/detail/orders.js'),
          children: customerHeaderRoutes(`${page}-orders`), // plus the tab's own children
        },
      ],
    },
  ];
}
```

The customers list adds `...customerDetailRoutes('customer')` to its `children`, beside its `new` and `:customerId/edit` dialogs. Write each tab out: every `componentLoader` needs a literal `import()`.

- **Link from the header through the tab on screen.** The header belongs to the page's route, where a bare `edit` resolves beside the tabs. Find the current tab with ``matchPath({ path: `${pagePath}/${tab.path}`, end: false }, location.pathname)`` and link to ``{ pathname: `${tab}/edit`, search: location.search }``.
- **Each tab places an `<Outlet />`**, or the header's overlays render nothing; when they read the page's outlet context, the tab passes it on (`<Outlet context={useOutletContext()} />`).
- An action belonging to one tab ("New order" in the Orders toolbar) stays in that tab and is declared under it only. Never return to the tab through `closeTo`, `location.state` or a query parameter.
- An action that leaves the page, such as returning to the list after a delete, navigates from the page's own route (`relative: 'route'`), since the number of `..` levels from an overlay depends on the tab.
- A covering page the header opens is declared under every tab the same way and still covers the whole page.
- Two children of one tab cannot share a path; name the header's overlays apart from the tab's own.

### When tabs have their own permissions

A tab the parent's check covers omits `authz`. A tab only for some people declares `authz: { resource: { type: 'page', id: 'project-reports-owners' }, action: 'access' }`, and the parent page checks the same pair with `useCan`, once per such tab at the top level:

- Leave denied tabs out of `tabs`, pass `pending: true` to `useListTabs` while a check is pending, and show `Loading` instead of redirecting until it settles; then redirect to the business default if accessible, else the first accessible tab.
- A denied user who opens the tab URL directly gets the route's "Access denied", not a redirect. When no tab is accessible, show an empty or no-permission state.
- Header overlays under a tab inherit that tab's `authz`; one with a check of its own declares it in the function.

## 5. Covering child pages (RouteChildPage)

A child page that needs the whole content area while its parent keeps its state — a complex record's detail page, an import page — returns `RouteChildPage` (`#components/route-child-page`):

```ts
{
  name: 'project-import', // under the projects list's children
  path: 'import',
  breadcrumb: { title: 'projects.import.title' },
  presentation: { kind: 'child-page' },
  componentLoader: () => import('./pages/projects/import.js'),
},
```

```tsx
// client/pages/projects/import.tsx
export default function ProjectImportPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <RouteChildPage>
        <PageContainer>
          <PageHeader
            title={t('projects.import.title')}
            description={t('projects.import.description')}
          />
          {/* content */}
        </PageContainer>
      </RouteChildPage>
      {/* Deeper child routes: beside RouteChildPage, not inside it. */}
      <Outlet />
    </>
  );
}
```

- The list links to it with a secondary header button: `<Button variant='outline' nativeButton={false} render={<Link to={{ pathname: 'import', search: location.search }} />}>`.
- The shell's breadcrumb and phone arrow return to the list with its recorded query; add no "Back to list" button. A dynamic parent is declared with `usePageBreadcrumb`.
- The covered page keeps its DOM, input and scroll position; `RouteChildPage` makes what it covers `inert` and restores it on leaving. It is not modal: no close button, no Esc.
- A child page rendered inside it, through a tab's Outlet, still covers it whole. Never use `RouteChildPage` on a top-level page.

### The same detail page over another page

A page showing a record whose detail is a page — an orders list's customer column — opens that page over itself, as a dashboard opens a project drawer (guideline I9). Declare it under this page with the same function and its own owner:

```ts
{
  name: 'orders',
  path: '/orders',
  // …
  children: [...customerDetailRoutes('order-customer')], // /orders/:customerId/details/…
},
```

- Link relatively — ``{ pathname: `${row.customerId}/details`, search: location.search }`` — never to `/customers/12/details`, and keep the whole query. The shared page names its own parameters apart from the orders page's.
- The shared page's breadcrumb, Cancel and redirects follow its actual owner (`useResolvedPath('..')` with its recorded query), never a hard-coded list.
- The owner prefixes every route name (`order-customer-detail-orders-edit`), and the added routes join the route test.

## 6. Navigation groups and clickable parents

- A group has only `name`, `navigation` and `children`; an optional `path` prefixes its children's paths. It renders no component, cannot declare `authz`, and carries no permission: the first page below it declares its own `authz`. Group names are unique.
- A top-level group is a menu section with a heading; a nested group is a collapsible sub-menu (`NavigationMenu` `sections={false}` makes top-level groups collapsible too).
- A clickable parent is a page with `navigation` whose children also have `navigation`: the link and the expand button are separate controls.
- Details and tab content have no `navigation`; a parameterized path cannot have it. `navigation.order` sorts siblings, lower first.

## 7. Settings pages

A settings module with several views uses URL-backed tabs through `SettingsModulePage` ([System settings navigation](../../settings-navigation.md)); its tabs inherit its settings item or declare another, never a page grant.

## 8. Verify

1. Opening the parent URL (with a trailing `/`, with a query) redirects once, with `replace`, to the default accessible tab and keeps the query; back does not bounce. Loading or no accessible tab does not redirect.
2. Each child URL, typed directly and reloaded under the deployment base path, stays on its tab.
3. Removing permission for the parent blocks every child; removing one tab's permission hides only that tab.
4. A covering page covers from the top whatever the parent's scroll; returning restores the list's exact query and the covered page's input and scroll.
5. From a non-default tab, each header overlay keeps the tab's URL plus its segment, the tab stays mounted behind it, and close, save, Esc and back return to that tab.

Write these as tests in `tests/` ([`testing.md`](testing.md)).

## List-tab breadcrumbs and private conditions

Register a detail under each list tab that opens it, so the list stays mounted; the list places `Outlet` after its table and the detail returns `RouteChildPage`. A layout supplying its own breadcrumb passes `tabState.source` through outlet context, and the detail uses it as the list level of `usePageBreadcrumb`, which links to the source tab with its recorded query. A direct open uses the source tab's default list.

Keep sensitive conditions in the mounted list's `useState` only: never in URLs, history state, storage, logs or a global cache. A reload or an account change clears them. A private condition filters the complete authorized dataset before the total and the page are computed; for a small bounded dataset fetch it whole through the existing API, otherwise use an existing private query channel. Changing a condition starts at page one.

To recover a deleted or unknown tab, declare a last child `path: ':unavailableTab'` whose module default-exports a component returning `null`, with children matching every supported detail shape (`:id/details`, `:id/edit`), no menu or breadcrumb, and the parent's access. `useListTabs`' fallback then replaces the URL; the runtime accepts no wildcard paths.
