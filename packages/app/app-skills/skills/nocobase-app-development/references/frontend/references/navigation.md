# Detail and edit navigation

Generate navigation together with the page, before implementing its successful data state. The application shell owns desktop breadcrumbs and the mobile parent arrow. Each independent detail supplies its full trail with `usePageBreadcrumb`; do not add a second page back button. A static nested page can rely on route `breadcrumb` metadata. A first-level list or home has no invented parent. Structure without a page remains text, and tabs and overlays add no level.

## A detail under its source list

Declare the list's `navigation`, the detail's static `breadcrumb` fallback and the independent edit's `breadcrumb`. Lazy-load all pages and keep the existing permission boundary. Nest the detail under each supported source list/tab so its list remains mounted and the existing list-state contract preserves private filters. The detail renders `RouteChildPage`, its own `PageContainer`, and its final `Outlet`; the independent edit covers the detail in the same way. An edit dialog instead declares no breadcrumb and closes through `useRouteOverlay`.

```tsx
// In the detail page, before any early loading/error return.
import { usePageBreadcrumb } from '@nocobase/app-client';
import { useResolvedPath } from 'react-router';
import { useRouteSearches } from '../../../routing/route-context.js';

const owner = useResolvedPath('..').pathname;
const detail = useResolvedPath('.').pathname;
const searches = useRouteSearches();
const listLevel = {
  label: t('projects.title'),
  to: { pathname: owner, search: searches.get(owner) ?? '' },
};
const recordLevel = {
  label: request.data?.data.name ?? t('projects.detail'),
  to: { pathname: detail, search: searches.get(detail) ?? '' },
};
usePageBreadcrumb([listLevel, recordLevel]);
// Pass { listLevel, recordLevel, reload: request.reload } through Outlet context.
// A tab does not replace this declaration. A list-tab owner supplies its translated
// tab label and useListTabs().source instead of the generic listLevel above.
```

```tsx
// In an independent edit page; inherited context comes from the record detail.
const { listLevel, recordLevel } = useOutletContext<DetailContext>();
usePageBreadcrumb([listLevel, recordLevel, { label: t('projects.edit') }]);
// Cancel and a successful save navigate to recordLevel.to (replace: true).
// A dialog's Cancel closes the dialog instead; never change overlay semantics.
```

Keep `listLevel` and the record's translated fallback title when loading, on 401/403, on missing records and on retryable failures. Keep the error explanation in the page; do not turn a failed record into a list, hide its parent, or claim it is successfully loaded. An edit's parent is the record detail even after switching detail tabs. Do not use `history.back()` or cut a URL segment to determine either parent.

## A logical parent outside the URL tree

Prefer declaring the same detail under its actual source routes. When the URL must differ, define a small fixed map of permitted sources in the page module. Carry only a source id and known public list query keys in the existing URL contract; do not consume `returnUrl`, an arbitrary pathname, external URLs, or location state that survives reload as trusted navigation. Decode and validate the source id against the map, parse public state with the list's existing URL helpers, and fall back to the default source when it is missing/deleted/invalid. A detail parameter is never automatically a list parameter.

```tsx
import { navigationDestination } from '../../../routing/navigation-destination.js';
import {
  useRouteAccess,
  useRouteTree,
  useRouteSearches,
} from '../../../routing/route-context.js';

const sources = {
  completed: { pathname: '/orders/completed', label: t('orders.completed') },
  unpaid: { pathname: '/orders/unpaid', label: t('orders.unpaid') },
};
const routes = useRouteTree();
const access = useRouteAccess();
const searches = useRouteSearches();
const sourceId = params.get('source');
const source =
  sourceId === 'completed' || sourceId === 'unpaid'
    ? sources[sourceId]
    : undefined;
const fallback = sources.completed;
const destination = (item: typeof fallback) =>
  navigationDestination(
    {
      pathname: item.pathname,
      // For an explicit deep-link contract, substitute the validated, allowlisted public query.
      search: searches.get(item.pathname) ?? '',
    },
    routes,
    access,
  );
const from = source && destination(source);
const to = from || destination(fallback);
usePageBreadcrumb([
  ...(to ? [{ label: from ? source!.label : fallback.label, to }] : []),
  { label: record?.name ?? t('orders.detail') },
]);
```

The template validator matches registered destinations and every ancestor against the shell's existing access result, without a new request. It rejects external, protocol-relative, malformed, unregistered and base-prefixed paths. Permission loading, failure and revocation expose no parent link or parent name. If neither source nor default is accessible, use an explicitly declared authorized higher ancestor, or show the current page without a parent link. Do not invent a home fallback. The destination map is the business allowlist; matching any registered route alone does not make an arbitrary source valid.

The route-search map keeps active ancestry only. A source outside that ancestry has no recorded query after navigation; either nest under its owner or explicitly forward validated public list state. Private filters belong to the mounted list and clear on reload/account change; do not create a new persistent cache. Reuse `useListTabs`, `useTableUrlState`, `useListLocation` and their existing pagination/sorting reset rules. A direct open, refresh or new tab without public source context uses default list state.

## Generation checklist

- Declare list → dynamic record → independent edit together; ordinary nested routes, logical parents and two source tabs have explicit examples in the generated feature.
- Check desktop breadcrumb and mobile arrow destinations against the same expected source, including search/filter/sort/order/page size/page and actual returned records. Use browser Back too. Repeated visits and the same record from two sources must stay isolated.
- Check detail-tab switches, edit → detail → list, direct entry, refresh, new tab, deleted source, loading, load failure and missing record. Preserve parent navigation in each record state.
- Check permission pending/failure/revocation and a denied ancestor, external and malformed source, and a non-root deployment base. No unauthorized parent name or external navigation may appear.
- Check home/list without an arrow, mobile without duplicate logo/back links, long English/Chinese titles, keyboard focus, a named parent link and `aria-current="page"`. Take real desktop/mobile screenshots.

## Versions and existing applications

This behavior ships as copied template source plus synchronized application Skills. Updating package dependencies alone does not replace an existing application's shell, breadcrumbs, BackButton, route declarations or business detail pages. Identify its installed `nocobase.templatePackage` baseline and a released target containing this contract. Follow the upgrade Skill's BASE/TARGET/PROJECT three-way reconciliation for the shell, routing validator, navigation components and locales, preserve custom permissions/styles/pages, then synchronize compatible Skills and reconcile each applicable detail declaration. Never overwrite business copies wholesale. Local candidate verification establishes the tested checkout only; confirm the published target version separately before recommending it for an existing application.
