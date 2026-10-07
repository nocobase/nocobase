# Detail page with tabs: `customers/detail/`

Part of the [projects worked example](../example.md). A project's details fit a drawer, so this page uses the customers of [section 4 of `child-routes.md`](../child-routes.md#a-record-detail-page-with-tabs): a customer's page with an Overview tab and an Orders tab, covering whichever page opened it, whose header opens the edit dialog over the tab being shown.

**Depends on**: [session alert](session-expired-alert.md), [URL search](url-search.md) (`withoutParams`), [copy](copy.md) (the `customers` group); its routes, which `customerDetailRoutes` declares under every page that opens a customer, in ["Overlays opened from the header of a page with tabs" in `child-routes.md`](../child-routes.md#overlays-opened-from-the-header-of-a-page-with-tabs).

**Add first**: `yes n | pnpm exec shadcn add alert card skeleton`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

**Links to**: its tabs, `overview` and `orders`, and under each of them `edit`, the edit dialog.

Rules: guidelines T2, I6 and I9; [section 4 of `child-routes.md`](../child-routes.md#4-page-tabs); [section 2.2 of `overlay.md`](../overlay.md#22-place-the-outlet-in-the-parent-page).

```text
client/pages/customers/
  types.ts
  detail/index.tsx     …/:customerId             The customer's page (RouteChildPage): header, tab bar, the tab's Outlet
  detail/overview.tsx  …/:customerId/overview    Tab
  detail/orders.tsx    …/:customerId/orders      Tab
  detail/edit.tsx      …/:customerId/<tab>/edit  RouteDialog: edit, over the tab being shown; one module for every tab
```

The endpoint contract this assumes: `GET /api/customers/:id` returns `{ data: Customer }`, 404 when it does not exist, and `GET /api/customers/:id/orders` takes `q`, `status`, `page` and `pageSize` and returns the customer's orders as `{ data: [...], meta: { page, pageSize, total } }`. Ids are strings.

## Types

```ts
// client/pages/customers/types.ts
export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly updatedAt: string;
}

/**
 * The query parameters the customer's page and its tabs write, such as the Orders tab's search and status filter.
 * Every other parameter belongs to the page this one covers, which gets them back unchanged when the user leaves.
 */
export const CUSTOMER_PAGE_PARAMS: readonly string[] = [
  'ordersQ',
  'ordersStatus',
];

/** What a page that opens a customer passes to the customer's page: the list, the orders page, a dashboard. */
export interface CustomersOutletContext {
  readonly reload: () => void;
}

/** What the edit dialog reads from the view it opens over. */
export interface CustomerEditOutletContext {
  readonly onSaved: (customer: Customer) => void;
  readonly onNotFound: () => void;
}

/** What the customer's page passes to its tabs, and each tab passes on to the overlays the header opens over it. */
export interface CustomerPageOutletContext extends CustomerEditOutletContext {
  readonly customer: Customer;
}
```

## The page

```tsx
// client/pages/customers/detail/index.tsx
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
  useResolvedPath,
} from 'react-router';

import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { withoutParams } from '@/hooks/use-url-search';
import { cn } from 'cn';

import {
  CUSTOMER_PAGE_PARAMS,
  type Customer,
  type CustomerPageOutletContext,
  type CustomersOutletContext,
} from '../types.js';

/** Route `:customerId` under every page that opens a customer: the customer's page, covering that page. */
export default function CustomerPage(): ReactElement {
  const { customerId = '' } = useParams();
  // Key by id: when forward or back switches to another customer, the page's state starts over.
  return <CustomerPageContent key={customerId} customerId={customerId} />;
}

function CustomerPageContent({
  customerId,
}: {
  readonly customerId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const pagePath = useResolvedPath('.');
  // The page this one covers — the customers list, the orders page, a dashboard — refreshes through its context.
  const { reload: reloadOwner } = useOutletContext<CustomersOutletContext>();

  // The order is the display order; both tabs use the page's access, so the first one is the default tab.
  const tabs = [
    { path: 'overview', label: t('customers.tabs.overview') },
    { path: 'orders', label: t('customers.tabs.orders') },
  ];
  const isParentEntry =
    matchPath({ path: pagePath.pathname, end: true }, location.pathname) !==
    null;
  // The tab on screen. The header builds its links from it: rendered by this page's route, a bare `edit` would
  // resolve beside the tabs rather than over the one the user is looking at.
  const currentTab = tabs.find(
    (tab) =>
      matchPath(
        { path: `${pagePath.pathname}/${tab.path}`, end: false },
        location.pathname,
      ) !== null,
  );
  // True on the tab itself, false while an overlay is open over it.
  const onTab =
    currentTab !== undefined &&
    matchPath(
      { path: `${pagePath.pathname}/${currentTab.path}`, end: true },
      location.pathname,
    ) !== null;

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${customerId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly customer?: Customer;
    readonly error?: unknown;
  }>();

  useEffect(() => {
    // Abort the request when the parameters change or the component unmounts, so an old result never overwrites a new one.
    const controller = new AbortController();
    const key = `${customerId}:${reloadCount}`;
    api
      .request<{ data: Customer }>({
        path: `customers/${encodeURIComponent(customerId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, customer: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          // The customer no longer exists: the page behind may still show it (guideline R3).
          if (error instanceof ApiClientError && error.status === 404) {
            reloadOwner();
          }
        },
      );
    return () => controller.abort();
  }, [api, customerId, reloadCount, reloadOwner]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;

  // After an edit is saved, show the customer the endpoint returned at once (guideline R2).
  const [saved, setSaved] = useState<Customer>();
  // The edit dialog found that the customer no longer exists.
  const [gone, setGone] = useState(false);
  const notFound = gone || status === 404;
  // The last customer loaded. The tabs keep it while "not found" shows, so a dialog open over a tab stays open to say so.
  const customer = saved ?? result?.customer;

  const onSaved = useCallback(
    (updated: Customer) => {
      setSaved(updated);
      reloadOwner();
    },
    [reloadOwner],
  );
  const onNotFound = useCallback(() => {
    setGone(true);
    reloadOwner();
  }, [reloadOwner]);
  // The tabs read it and pass it on to the overlays over them. Keep it stable: the edit dialog's loading effect
  // depends on its functions.
  const outletContext = useMemo<CustomerPageOutletContext | undefined>(
    () =>
      customer === undefined ? undefined : { customer, onSaved, onNotFound },
    [customer, onSaved, onNotFound],
  );

  // The dialog found the customer gone and has closed: the "Edit" that opened it went with the header's actions,
  // so move focus to the explanation (guideline A6).
  const notFoundRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gone && onTab) notFoundRef.current?.focus();
  }, [gone, onTab]);

  if (isParentEntry) {
    // The page's own URL: go to the default tab once, keeping the query (section 4 of child-routes.md).
    return (
      <Navigate
        replace
        to={{ pathname: tabs[0].path, search: location.search }}
      />
    );
  }

  let body: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
  } else if (notFound || status === 403) {
    // Not found or no permission: a retry will not succeed either, so only explain it (guidelines R3 and S4).
    body = (
      <Alert ref={notFoundRef} tabIndex={-1} variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
            ? t('customers.error.notFound')
            : t('customers.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {t('customers.error.requestFailed')}
        </AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (customer === undefined) {
    body = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-3'
      >
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  } else {
    body = (
      <nav
        aria-label={t('customers.tabs.label')}
        className='flex flex-wrap gap-1 border-b pb-2'
      >
        {tabs.map((tab) => (
          // Tabs are page navigation, so they are links; NavLink marks the current one with aria-current='page'.
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
    );
  }

  const shown = notFound ? undefined : customer;
  return (
    <RouteChildPage>
      <PageContainer>
        {/* Back to whichever page this one covers — `..`, not that page's path (section 5 of child-routes.md) —
            with its search and filters as they were, and without the parameters this page and its tabs wrote. */}
        <BackButton
          to={{
            pathname: '..',
            search: withoutParams(location.search, CUSTOMER_PAGE_PARAMS),
          }}
        />
        <PageHeader
          title={shown?.name ?? t('customers.detail.title')}
          actions={
            shown && currentTab ? (
              <CustomerHeaderActions tab={currentTab.path} />
            ) : undefined
          }
        />
        {body}
        {/* The tab on screen, and the overlays the header opens over it. Outside the branches above, so a dialog
            that finds the customer gone stays open to say so; the tab itself is hidden then. */}
        {outletContext ? (
          <div className={notFound ? 'hidden' : 'contents'}>
            <Outlet context={outletContext} />
          </div>
        ) : null}
      </PageContainer>
    </RouteChildPage>
  );
}

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

- **The header links through the tab on screen.** The header is rendered by the page's route, where a bare `edit` resolves to `/customers/12/edit`, beside the tabs ([section 2 of `page.md`](../page.md#2-the-page-component)). `currentTab` is found the way the redirect finds the page's own URL, and `CustomerHeaderActions` links to `` `${tab}/edit` ``, the route `customerDetailRoutes` declares under every tab: the dialog opens at `/customers/12/orders/edit`, over Orders, and closing returns to `/customers/12/orders`.
- **One context for the tabs and the overlays over them.** The tabs read the customer from it, and the edit dialog reads `onSaved` and `onNotFound` through whichever tab it opens over, which passes the context on. `onSaved` shows the returned customer at once, then refreshes the page behind (guideline R2).
- **Not found**: a 404 on load shows the explanation without tabs; the edit dialog finding the customer gone switches the page to "not found" while the dialog stays open to say so, because the tab's `Outlet` sits outside the state branches and only its container is hidden. When the dialog closes, the "Edit" that opened it has gone with the header's actions, so focus moves to the explanation (guidelines R3 and A6).
- **`BackButton` goes to `..`, without this page's parameters.** The page is declared under every page that opens a customer, so it returns to the parent route rather than naming one ([section 5 of `child-routes.md`](../child-routes.md#the-same-detail-page-over-another-page)). The current query string holds the covered page's search and filters, which came down with every link, and whatever this page's tabs wrote; `withoutParams` removes the latter, listed in `CUSTOMER_PAGE_PARAMS`, so the list gets exactly its own back ([section 7 of `page.md`](../page.md#7-back-button-and-breadcrumbs)). A "Delete" beside "Edit" leaves the same way: after the confirmation, the page navigates from its own route with `navigate({ pathname: '..', search: withoutParams(location.search, CUSTOMER_PAGE_PARAMS) }, { relative: 'route', replace: true })`, not from inside an overlay, where the number of levels changes with the tab.
- **States**: a skeleton while loading, 401 through `SessionExpiredAlert`, 403 and 404 without "Retry", other failures with it (guidelines S1 and S4).

## A tab

```tsx
// client/pages/customers/detail/overview.tsx
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { CustomerPageOutletContext } from '../types.js';

/** Tab `overview` of a customer's page. */
export default function CustomerOverviewTab(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  // The page's context: the customer, and what the overlays over this tab report back to the page.
  const context = useOutletContext<CustomerPageOutletContext>();
  const { customer } = context;
  const dateFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  return (
    <>
      {/* Tab content renders inside the page's PageContainer; it adds none of its own. */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.overview.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
            <dt className='text-muted-foreground'>
              {t('customers.fields.email')}
            </dt>
            <dd className='min-w-0 wrap-anywhere'>{customer.email ?? '—'}</dd>
            <dt className='text-muted-foreground'>
              {t('customers.fields.updatedAt')}
            </dt>
            <dd>{dateFormat.format(new Date(customer.updatedAt))}</dd>
          </dl>
        </CardContent>
      </Card>
      {/* The overlays the page's header opens render here, over this tab. They read the page's context from the
          nearest Outlet above them, which is this one, so pass it on unchanged. */}
      <Outlet context={context} />
    </>
  );
}
```

- **It ends with an `Outlet` that passes the page's context on.** The edit dialog is its child route, and a child route reads the context of the nearest `Outlet` above it. A tab without one renders nothing at `…/overview/edit`; one that passes other data breaks the dialog's `onSaved`.
- `orders.tsx` is written the same way: it loads the customer's orders itself from `customers/${encodeURIComponent(customerId)}/orders`, sending its search as `q`, with the loader of [project summary](project-summary.md), and ends with the same `<Outlet context={context} />`. Its search box and status filter write `ordersQ` and `ordersStatus` (`useUrlSearch({ param: 'ordersQ' })`), never the `q` and `status` of the page this one covers, which it neither reads nor changes ([section 5 of `table.md`](../table.md#5-writing-search-and-filters-to-the-url)); a new parameter joins `CUSTOMER_PAGE_PARAMS`. Its own children, such as an order's drawer, declared beside the header's overlays, read the same context; when they need more, the tab passes an object that adds their fields to it.

`detail/edit.tsx` is not written out here: write it first, as the [edit dialog](edit-dialog.md) with `Customer` in place of `Project`, since the test below and the routes in [`child-routes.md`](../child-routes.md) import it; the `customers.form.*` keys it calls are not in [copy](copy.md), so add them to both locale files. It reads `CustomerEditOutletContext` and its id from `useParams()`, and nothing in it depends on the tab it opens over.

## The test

`tests/components/customer-page.test.tsx` renders the page with the routes `customerDetailRoutes` declares, written out, and opens the header's "Edit" from every tab, which catches a tab that does not pass the page's context on through its `Outlet`; that every tab declares the header's overlays is the route test's to check (below). It then goes back to check that the list gets exactly its own parameters:

```tsx
// tests/components/customer-page.test.tsx
// The setup of tests/components/page-harness.test.tsx — its vi.hoisted values and every vi.mock — unchanged; only
// what differs is shown. The runtime reads the application's own locale files,
// where the customer copy lives, so the queries name what the user reads.
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import CustomerPage from '@/pages/customers/detail/index';
import EditCustomerPage from '@/pages/customers/detail/edit';
import CustomerOrdersTab from '@/pages/customers/detail/orders';
import CustomerOverviewTab from '@/pages/customers/detail/overview';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';

// … vi.hoisted and vi.mock as in page-harness.test.tsx

const runtime = await createTestI18nRuntime({
  application: { namespace: packageMetadata.name, resources: enUS },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

const customer = { id: '12', name: 'Acme', updatedAt: '2026-01-01T00:00:00Z' };
const reloadCustomers = vi.fn();

/** The customer's page as `customerDetailRoutes` declares it, under a stand-in for the customers list. */
function renderAt(url: string) {
  const overlays = [{ path: 'edit', element: <EditCustomerPage /> }];
  const router = createMemoryRouter(
    [
      {
        path: '/customers',
        // The page reads the context of the page it covers; the list itself is not under test.
        element: <Outlet context={{ reload: reloadCustomers }} />,
        children: [
          {
            path: ':customerId',
            element: <CustomerPage />,
            children: [
              {
                path: 'overview',
                element: <CustomerOverviewTab />,
                children: overlays,
              },
              {
                path: 'orders',
                element: <CustomerOrdersTab />,
                children: overlays,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

describe('customer page', () => {
  beforeEach(() => {
    api.request.mockReset();
    // The page, the edit dialog and the orders tab each load; answer them all with the customer or an empty list.
    api.request.mockImplementation(({ path }: { readonly path: string }) =>
      Promise.resolve(
        path.endsWith('/orders')
          ? { data: [], meta: { page: 1, pageSize: 20, total: 0 } }
          : { data: customer },
      ),
    );
    reloadCustomers.mockReset();
  });

  it.each(['overview', 'orders'] as const)(
    'stacks the header edit on the %s tab and returns to it',
    async (tab) => {
      const router = renderAt(`/customers/12/${tab}?status=vip`);

      await userEvent.click(
        await screen.findByRole('button', {
          name: enUS.customers.actions.edit,
        }),
      );

      expect(
        await screen.findByRole('dialog', { name: enUS.customers.edit.title }),
      ).toBeInTheDocument();
      expect(router.state.location).toMatchObject({
        pathname: `/customers/12/${tab}/edit`,
        search: '?status=vip',
      });
      // The tab stays selected behind the dialog. The open dialog hides the page from the accessibility tree, so
      // the query includes hidden elements.
      expect(
        screen.getByRole('link', {
          name: enUS.customers.tabs[tab],
          hidden: true,
        }),
      ).toHaveAttribute('aria-current', 'page');

      await userEvent.click(
        screen.getByRole('button', { name: enUS.actions.cancel }),
      );

      await waitFor(() =>
        expect(router.state.location).toMatchObject({
          pathname: `/customers/12/${tab}`,
          search: '?status=vip',
        }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
  );

  it('goes back with the list filters, dropping the parameters this page wrote', async () => {
    const router = renderAt('/customers/12/orders?status=vip&ordersQ=acme');

    await userEvent.click(
      await screen.findByRole('link', { name: enUS.navigation.back }),
    );

    await waitFor(() =>
      expect(router.state.location).toMatchObject({
        pathname: '/customers',
        search: '?status=vip',
      }),
    );
  });

  it('opens an edit URL directly over its tab', async () => {
    renderAt('/customers/12/orders/edit');

    expect(
      await screen.findByRole('dialog', { name: enUS.customers.edit.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: enUS.customers.tabs.orders,
        hidden: true,
      }),
    ).toHaveAttribute('aria-current', 'page');
  });
});
```

## The route test

Every page that declares `customerDetailRoutes` adds a route per tab and per overlay under each tab to the page grant list of `tests/logic/client-routes.test.ts` ([section 12 of `page.md`](../page.md#12-update-the-route-test)). A helper in the test spells out one owner's set, with its names and authorization written literally rather than taken from the application's function, whose output is what the test checks:

```ts
// tests/logic/client-routes.test.ts, in 'pins the page authorization of every signed-in page'
expect(pageAuthorizations(resolved.routes)).toEqual([
  { name: 'home', authorizedAs: null },
  { name: 'customers', authorizedAs: null },
  // … the customers list's other children, in declaration order
  ...customerDetailPages('customer'),
  { name: 'orders', authorizedAs: null },
  ...customerDetailPages('order-customer'),
]);

/** The pages `customerDetailRoutes(owner)` declares, depth first. */
function customerDetailPages(
  owner: string,
): { name: string; authorizedAs: string | null }[] {
  const page = `${owner}-detail`;
  return [
    { name: page, authorizedAs: null },
    ...['overview', 'orders'].flatMap((tab) => [
      { name: `${page}-${tab}`, authorizedAs: null },
      { name: `${page}-${tab}-edit`, authorizedAs: null },
    ]),
  ];
}
```

A new tab, or a new overlay in the header, changes one line of the helper; a changed name or `authz` in the application's function still fails the test. When opening a customer requires a grant of its own, declare it on the page's route in `customerDetailRoutes`, and every route below inherits it: the helper's `authorizedAs` becomes that resource id throughout, while the permission set page still lists it once, since grants are keyed by resource id rather than by route.
