// The model to copy for a page test: a page that loads data through `useApiClient`, checks a permission with
// `useCan`, formats with `useLocale`, raises a toast and opens a child-route `RouteDialog`. The page under test is
// defined in this file so the template has one to run; in an application, import the real page and its child routes
// instead and keep the setup below.
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { useRouteOverlay } from '#components/use-route-overlay';

import enUS from '../../client/locales/en-US.js';

// `vi.mock` factories run before this file's imports and code, so everything a factory uses is created here.
const { api, toaster, permission, refresh } = vi.hoisted(() => ({
  // One object for the whole file: a new one per call would restart every effect that depends on `api`.
  api: { request: vi.fn() },
  // One toaster too, so a test asserts what `show` was called with rather than how Base UI renders it.
  toaster: { show: vi.fn(), close: vi.fn() },
  // What `useCan` returns; a test sets `can`, `isPending` or `error` before rendering.
  permission: {
    can: true,
    isPending: false,
    error: undefined as unknown,
  },
  refresh: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (original) => ({
  // Keep the real module, so `ApiClientError` stays the class the page checks with `instanceof`.
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({
    can: permission.can,
    isPending: permission.isPending,
    error: permission.error,
    retry: vi.fn(),
  }),
}));

// The inline page's own copy. A real page finds its keys in `client/locales/`; this one brings them, merged over the
// application's so the dialog's close button and the shared `status.*` keys resolve as they would there.
const copy = {
  'status.sessionExpired': 'Your session has ended.',
  actions: { ...enUS.actions, create: 'Create', signInAgain: 'Sign in again' },
  items: {
    create: {
      action: 'New item',
      title: 'Create an item',
      success: 'Created the item',
    },
    form: { description: 'Name the item.' },
    error: {
      forbidden: 'You cannot view items.',
      failed: 'Items could not be loaded.',
    },
  },
};

// The real runtime, strict: a key the resources lack fails the test instead of rendering as text.
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: { ...enUS, ...copy },
  },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

interface Item {
  readonly id: number;
  readonly name: string;
  readonly updatedAt: string;
}

function ItemsPage(): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const client = useApiClient();
  const { refresh: refreshSession } = useAuthentication();
  const { can: canCreate } = useCan({
    resource: { type: 'composite', id: 'items' },
    action: 'create',
  });
  const [result, setResult] = useState<{
    readonly items?: Item[];
    readonly error?: unknown;
  }>();

  useEffect(() => {
    const controller = new AbortController();
    client
      .request<{ data: Item[] }>({ path: 'items', signal: controller.signal })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ items: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ error });
        },
      );
    return () => controller.abort();
  }, [client]);

  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  let content: ReactElement;
  const status =
    result?.error instanceof ApiClientError ? result.error.status : undefined;
  if (status === 401) {
    // The session ended: no retry, only a way to sign in again (in an application, SessionExpiredAlert).
    content = (
      <p role='alert'>
        {t('status.sessionExpired')}
        <Button onClick={() => void refreshSession()}>
          {t('actions.signInAgain')}
        </Button>
      </p>
    );
  } else if (result?.error) {
    const forbidden = status === 403;
    content = (
      <p role='alert'>
        {forbidden ? t('items.error.forbidden') : t('items.error.failed')}
        {forbidden ? null : <Button>{t('status.retry')}</Button>}
      </p>
    );
  } else if (!result?.items) {
    content = <p role='status'>{t('status.loading')}</p>;
  } else {
    content = (
      <ul>
        {result.items.map((item) => (
          <li key={item.id}>
            {item.name} {dateFormat.format(new Date(item.updatedAt))}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      {canCreate ? (
        <Button nativeButton={false} render={<Link to='new' />}>
          {t('items.create.action')}
        </Button>
      ) : null}
      {content}
      <Outlet />
    </div>
  );
}

function NewItemFooter(): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  const toaster = useToaster();
  return (
    <Button
      onClick={() => {
        toaster.show({ type: 'success', title: t('items.create.success') });
        void close();
      }}
    >
      {t('actions.create')}
    </Button>
  );
}

function NewItemPage(): ReactElement {
  const { t } = useTranslation();
  return (
    <RouteDialog title={t('items.create.title')} footer={<NewItemFooter />}>
      <p>{t('items.form.description')}</p>
    </RouteDialog>
  );
}

/** The page as the application routes it: the list at /items with the create dialog as its child route. */
function renderAt(url: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/items',
        element: <ItemsPage />,
        children: [{ path: 'new', element: <NewItemPage /> }],
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

describe('page test harness', () => {
  beforeEach(() => {
    api.request.mockReset();
    toaster.show.mockReset();
    permission.can = true;
    permission.isPending = false;
    permission.error = undefined;
    refresh.mockReset();
  });

  it('loads the list with the request the page is expected to send', async () => {
    api.request.mockResolvedValue({
      data: [{ id: 1, name: 'Alpha', updatedAt: '2026-01-02T00:00:00Z' }],
    });
    renderAt('/items');

    expect(screen.getByRole('status')).toHaveTextContent(
      enUS['status.loading'],
    );
    expect(await screen.findByText(/Alpha/)).toBeInTheDocument();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'items' }),
    );
  });

  it('explains a 403 without offering a retry', async () => {
    api.request.mockRejectedValue(
      new ApiClientError('Forbidden', {
        status: 403,
        method: 'GET',
        url: '/api/items',
      }),
    );
    renderAt('/items');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      copy.items.error.forbidden,
    );
    expect(
      screen.queryByRole('button', { name: enUS['status.retry'] }),
    ).not.toBeInTheDocument();
  });

  it('treats a 401 as an ended session, not as a failure to retry', async () => {
    api.request.mockRejectedValue(
      new ApiClientError('Unauthorized', {
        status: 401,
        method: 'GET',
        url: '/api/items',
      }),
    );
    renderAt('/items');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      copy['status.sessionExpired'],
    );
    expect(
      screen.queryByRole('button', { name: enUS['status.retry'] }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: copy.actions.signInAgain }),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shows the create action only with permission', async () => {
    api.request.mockResolvedValue({ data: [] });
    renderAt('/items');

    // A Button rendered as a Link (nativeButton={false}) is announced as a button, so query it by that role.
    expect(
      await screen.findByRole('button', { name: copy.items.create.action }),
    ).toHaveAttribute('href', '/items/new');
  });

  it('hides the create action without permission', async () => {
    permission.can = false;
    api.request.mockResolvedValue({ data: [] });
    renderAt('/items');

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(
      screen.queryByRole('button', { name: copy.items.create.action }),
    ).not.toBeInTheDocument();
  });

  it('opens the create dialog from its URL and closes it back to the list', async () => {
    api.request.mockResolvedValue({ data: [] });
    const router = renderAt('/items/new');

    expect(
      await screen.findByRole('dialog', { name: copy.items.create.title }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: copy.actions.create }),
    );

    expect(toaster.show).toHaveBeenCalledWith({
      type: 'success',
      title: copy.items.create.success,
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/items'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
