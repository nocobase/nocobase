# Pages, menus and routes

A page is a React component under `client/pages/`; its route and menu entry are declared in `client/routes.ts`. Visual and interaction rules are [`../ui-guidelines.md`](../ui-guidelines.md) (L, T2, T3, I1, I6, I9); tabs and covering child pages are [`child-routes.md`](child-routes.md); `RouteDialog` and `RouteDrawer` are [`overlay.md`](overlay.md). Start a new list page from [`executable-list-edit.md`](executable-list-edit.md).

## 1. Declare the route

Append to the existing `defineAppRoutes([...])` in `client/routes.ts`, keeping the existing routes and adding to the existing imports:

```ts
{
  name: 'projects',
  path: '/projects',
  auth: 'required',
  authz: 'skip',
  navigation: { title: 'navigation.projects', icon: FolderKanban },
  componentLoader: () => import('./pages/projects/index.js'),
  children: [
    {
      name: 'project-new', // /projects/new: create dialog
      path: 'new',
      presentation: { kind: 'dialog', title: 'projects.create.title' },
      componentLoader: () => import('./pages/projects/new.js'),
    },
    {
      name: 'project-detail', // /projects/:projectId: detail drawer
      path: ':projectId',
      presentation: { kind: 'drawer', title: 'projects.detail.title' },
      componentLoader: () => import('./pages/projects/detail/index.js'),
      children: [
        {
          name: 'project-detail-edit', // /projects/:projectId/edit: edit dialog over the drawer
          path: 'edit',
          presentation: { kind: 'dialog', title: 'projects.edit.title' },
          componentLoader: () => import('./pages/projects/detail/edit.js'),
        },
      ],
    },
  ],
},
```

`name` is unique and targeted by overrides, so never rename it after release. A child `path` is relative; full paths differing only in parameter names conflict. `breadcrumb: { title }` names a level of the header's trail ([section 7](#7-back-button-and-breadcrumbs)). `presentation` (`{ kind: 'child-page' }` or `{ kind: 'dialog' | 'drawer', title }`) lets the application open the container before the module, its check and its data are ready.

- Keep `componentLoader` lazy and write import paths with `.js`. Never write the deployment base path (`/main`); the runtime adds it.
- `/login`, `/register`, `/forgot-password` and `/reset-password` are the application's `guest` pages in `client/pages/auth/`. Administration pages are ordinary routes in the System settings structure ([section 5](#5-settings-pages)).

### Detail drawer or detail page

- About 15 fields or fewer, no sub-tables or tabs (guideline T2.1): a `RouteDrawer` at `:id`, as above. Edit is a `RouteDialog` at `:id/edit`, the drawer's child; the row menu's Edit links there too.
- More fields, sections, related lists or tabs: a detail page at `:id/details` returning `RouteChildPage` ([`child-routes.md`](child-routes.md#5-covering-child-pages-routechildpage)). Edit is a `RouteDialog` at `:id/edit`, a sibling for the row menu, and `edit` under `:id/details` for the page's header; both load the same module.

Create is a `RouteDialog` at `new`. Create and edit forms always open in a `RouteDialog`, never in a drawer or a covering page; a long form scrolls inside it. A page that opens the same record elsewhere, such as a dashboard, declares the same routes under itself, from a function taking an owner that prefixes every `name` (`...projectDetailRoutes('project-dashboard')`), so the drawer opens over that page (guideline I9).

## 2. The page component

Put the page in `client/pages/<feature>/index.tsx`, default-export it, and build it from `PageContainer` and `PageHeader`:

```tsx
export default function ProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <PageContainer>
      <PageHeader
        title={t('projects.title')}
        description={t('projects.description')}
        actions={
          // Keep the query string so the list's search and page survive the dialog.
          <Button
            nativeButton={false}
            render={<Link to={{ pathname: 'new', search: location.search }} />}
          >
            <PlusIcon data-icon='inline-start' />
            {t('projects.create.action')}
          </Button>
        }
      />
      {/* DataTable with its search, filters and phone cards: table.md */}
      <Outlet />
    </PageContainer>
  );
}
```

- `PageContainer` (`#components/page-container`) owns width, padding and block spacing; never hand-write a padded wrapper. One per page: tab content uses its parent's, a covering child page puts its own inside `RouteChildPage`, and dialog and drawer content uses none.
- `PageHeader` (`#components/page-header`) takes `title`, `description`, `eyebrow` and `actions` (guideline L1). A page with child routes places `<Outlet />` itself, at the end.
- Link to child routes with a relative path (`new`, `` `${id}/edit` ``) and keep `location.search`, so closing the overlay returns to the same list view (guideline I6).

**A relative link resolves against the route that renders it, not the URL on screen**: `edit` appends to that route's path and `..` removes its segments (where `closeTo` and `BackButton` go). On `/customers/12/orders`, `edit` rendered by the page's header (route `:customerId`) is `/customers/12/edit`, replacing the tab; rendered by the tab it is `/customers/12/orders/edit`. See ["Overlays opened from the header of a page with tabs"](child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs).

### List URL state

A list keeps its search, filters, page and sort in the URL:

- `useListLocation()` (`#hooks/use-list-location`) returns `{ params, setParams, active }`. While a child route covers the list, `params` stays the list's query and `active` is `false`; pass `active` to `useListData`.
- `useTableUrlState({ sortColumns, active, revision, rowCount, … })` (`#hooks/use-table-url-state`) reads and writes `page`, `pageSize`, `sort`/`order` (or `orderBy`); spread its pagination and sorting props into `DataTable`. `TABLE_URL_KEYS` lists the keys it owns, for a detail's breadcrumb.
- Search is `DataTableSearch` from `#components/data-table`, never a hand-made input; filters, phone cards and row actions are [`table.md`](table.md).
- After a write, lists refresh through scopes ([`data-changes.md`](data-changes.md)); pages pass no reload callback to their child routes.

## 3. auth: who can open the page

`required` (the default): signed-in users only, signed-out visitors go to sign-in. `guest`: sign-in, registration and password reset; signed-in visitors are sent away. `optional`: anyone; the page adapts itself. Child routes inherit the root's `auth` and cannot change it. `auth` only governs the browser; endpoints authenticate on their own.

## 4. authz: page authorization

`authz` is `{ resource: { type, id }, action }`, `'skip'` or `'unrestricted'`. A nested page that omits it inherits its nearest ancestor page's; a first page that omits it gets a warning and defaults to `'unrestricted'` (root only) when `required`, `'skip'` otherwise. Always declare it on the first page of every path.

- `'skip'`: every signed-in user, with endpoints open to them too. `{ resource: { type: 'page', id }, action: 'access' }`: people granted access. Omit it on a child page needing nothing beyond its parent. `'unrestricted'`: root only. A settings page checks its settings item ([section 5](#5-settings-pages)).
- A child renders only after its parent's check passes. Without permission the menu entry is hidden and the URL shows "Access denied" without loading the module. Groups cannot declare `authz`.
- Only root holds every grant. When the feature is for people who lack it, grant it as the `nocobase-app-plugin-authorization` Skill describes and report who can open the page.
- A page grant authorizes no endpoint: endpoints check a `composite` business action granted beside it, never `page` `access`. The resource id is stored in grants; changing it means migrating them.

### Permission display names

Every route resolving to a `page` permission needs a translated display name. Navigation or breadcrumb titles provide it; an overlay that has neither adds its route `name` and a translation key to `client/pages/settings/page-permission-titles.ts`. `tests/client/page-permission-titles.test.ts` rejects missing labels and stale keys.

## 5. Settings pages

A configuration page is an ordinary route with `parent` naming a settings category (`settingsBusiness`), `navigation` with `title`, `description` and `icon`, and `authz: { resource: { type: 'settings', id: 'project-settings' }, action: 'read' }`; the structure is [System settings navigation](../../settings-navigation.md).

- Register the item on the server with `authz.settings.add({ id, title, actions: [{ name: 'read' }, { name: 'update' }] })` and place it with `authz.ui.place`; the endpoints check `read` and `update` ([server routes](../../server-routes.md#authorization-when-identity-is-not-enough)).
- Gate write controls on `update` with `useCan` ([section 8](#8-show-actions-by-permission-usecan)); without it, render the values read-only. [`example/settings-page.md`](example/settings-page.md) is a complete page.
- A root entry's `parent` may also name any navigation group, `package-name:group-name` for another package's; its `path` is then relative to that group.

## 6. Menus

- `title`: a translation key (add it under `navigation` in `client/locales/en-US.ts` and `zh-CN.ts`). `icon`: a `lucide-react` component; all entries of a group get icons or none. `order`: lower first, default 0.
- A path with a parameter cannot have `navigation`; a page without an entry highlights its nearest ancestor that has one. Groups: [section 6 of `child-routes.md`](child-routes.md#6-navigation-groups-and-clickable-parents). Never change the shell to add an entry.

### A count beside an entry

The App layout passes a count of what waits on the viewer to `NavigationMenu` as `badges={{ inbox: unread }}`, keyed by route `name`, from the hook that keeps it current (such as `useInboxUnreadCount()`). A number is something waiting; `{ count, live: true, hint }` is work under way with a translated `hint`. The menu hides zero and shows "99+". Put it on an entry the menu always shows. Which counts belong there is guideline L8.

## 7. Back button and breadcrumbs

The header of `AppLayout` renders `Breadcrumbs` from the route tree, and on a phone the current title with an arrow to the nearest authorized parent (guideline L6). Pages never render breadcrumbs, and under `AppLayout` they add no `BackButton` and no "Back to list" action.

- A level is a route with `breadcrumb`, or a menu page. Tab, dialog and drawer routes add no level; denied levels are left out.
- An independent detail page declares its whole trail with `usePageBreadcrumb` (`@nocobase/app-client`), before its data loads, and keeps it on loading, error and not-found:

```tsx
const owner = useResolvedPath('..').pathname;
usePageBreadcrumb([
  {
    label: t('projects.title'),
    to: {
      pathname: owner,
      search: useAncestorSearch(owner, PROJECT_LIST_KEYS),
    },
  },
  { label: project?.name ?? t('projects.detail.title') },
]);
```

- `useAncestorSearch(path, keys)` (`client/routing/route-context.tsx`) returns the ancestor's recorded query, or after a reload the declared list keys (search, filters, `TABLE_URL_KEYS`) from the current URL. Never trust an external return URL.
- `BackButton` (`#components/back-button`) is only for a page without the shell header (`StandalonePageLayout`), above `PageHeader`.

Logical parents, list tabs and permission states: [`navigation.md`](navigation.md).

## 8. Show actions by permission (useCan)

`useCan({ resource, action })` from `@nocobase/app-plugin-authorization/client` returns `{ can, isPending, error, retry }`. The resource is one the server knows: `page` + `access`, `settings` + the item's actions (`authz.settings.add`), or `composite` + its business actions (`authz.compositeResources.define`); anything else is denied to everyone but root.

- `can` is `false` while pending and on failure, so a hidden button never flashes. Call it at the top level; `{ enabled: false }` as the second argument skips the check (and leaves `can` false).
- `isPending`: a single action shows nothing; a block whose content depends on it shows loading. `error`: a single action stays hidden; a dependent block shows a retryable error calling `retry`. `can === false`: hide the action, or render the block read-only.
- `useCan` answers "does this user have this feature", not "can this record be acted on": per-record actions come from the server's response. Hiding never replaces endpoint authorization (guideline I7).
- Outside React, call `can` on the client resolved from `authorizationClientToken`; never cache results in module variables. Design composites with the `nocobase-app-plugin-authorization` Skill.

## 9. Disable a feature (keep the page)

Keep the page and its data; add a flag to the public `client` section of `config.yml` (`client.app.projectsEnabled: false`). Pages read `useClientApplication().config.get<boolean>('app.projectsEnabled', true)`; `client/routes.ts` reads `readAppClientRuntimeConfig()` (`@nocobase/app-client/runtime`) to leave the route out. Routes have no `hidden` option. The server rejects disabled operations on its own. Tell the user how to re-enable it.

## 10. Customize a plugin's pages

Never declare a plugin's route again. Use the plugin's options in `client/plugins.ts`, or pass `routeComponentOverrides` (`defineClientRouteComponentOverrides([{ routeId: '<package>:<route-name>', componentEntry, componentLoader }])`) to `defineAppRuntime()` in `client/runtime.ts`. An override replaces only the component, does not inherit `presentation`, and applies once per route. Sign-in pages are the application's own: edit `client/pages/auth/`.

## 11. Where rendering happens

`client/routing/` renders routes, checks access and shows loading and error states (inside the declared `presentation`'s container); `client/layouts/` holds the App layout. Declare business routes only in `client/routes.ts`. To change the shell, see [`shell.md`](shell.md#1-behaviors-to-keep).

## 12. Update the route test

`tests/client/client-routes.test.ts` pins the authorization of every signed-in page, child routes included, in depth-first order; add each new one: `authorizedAs` is `null` for `'skip'`, `'unrestricted'`, the resource id for a page grant (`'projects'`), or `type:id` otherwise; an omitted `authz` shows the parent's. The routes above add `projects`, `project-new`, `project-detail`, `project-detail-edit`. Run `pnpm exec vitest run tests/client/client-routes.test.ts`.

## 13. Verify

- The page opens under the deployment base path and survives a reload.
- Opening each child URL directly (`/projects/1`, `/projects/1/edit`, `/projects/new`) shows the page with the right overlay, and closing returns to the same list query.
- Without permission the entry disappears and the URL loads no module; the endpoints, called directly as an ordinary user, agree with the page.
- For a hidden page, a denied tab or a read-only card, ask the user for a test account with a limited permission set and capture with a second session ([`../scripts/capture.md`](../scripts/capture.md)); cover pending and failed `useCan` in a test.
