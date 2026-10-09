// The model to copy for a page test: a page that loads data through `useApiClient`, checks a permission with
// `useCan`, formats with `useLocale`, raises a toast and opens a child-route `RouteDialog`. The page under test is
// defined in this file so the template has one to run; in an application, import the real page and its child routes
// instead and keep the setup below.
import {
  apiClientToken,
  ApiClientError,
  useApiClient,
  useToaster,
} from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
  useAuthentication,
} from '@nocobase/app-plugin-authentication/client';
import {
  AuthorizationClient,
  authorizationClientToken,
  useCan,
  type AuthorizationSnapshot,
} from '@nocobase/app-plugin-authorization/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement, useEffect, useState } from 'react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RouteDialog } from '#components/route-dialog';
import { Button } from '#components/ui/button';
import { useRouteOverlay } from '#components/use-route-overlay';

import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';

// Substitute the authentication service at its token, keeping the real provider and hooks.
// Authentication itself is covered by server tests that sign in through the application's real routes.
const getSession = vi.fn(async () => ({ data: null }));
let permissions: AuthorizationSnapshot;
let itemsResponse: unknown;
const api = vi.fn(({ method, path }: ApiCall) => {
  if (method === 'GET' && path === 'authorization/permissions')
    return { data: permissions };
  if (method === 'GET' && path === 'items') return itemsResponse;
  return new Response(null, { status: 404 });
});

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

/** renderWithApp owns the router; declare the page and its child routes inside it. */
function LocationProbe(): ReactElement {
  const location = useLocation();
  return <span data-testid='location'>{location.pathname}</span>;
}

async function renderAt(route: string) {
  return renderWithApp(
    <AuthenticationProvider>
      <LocationProbe />
      <Routes>
        <Route path='/items' element={<ItemsPage />}>
          <Route path='new' element={<NewItemPage />} />
        </Route>
      </Routes>
    </AuthenticationProvider>,
    {
      route,
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: { ...enUS, ...copy } },
      fetch: answerApi(api),
      // These services replace the corresponding plugins for this focused page test. Do not register both.
      services: (app) => {
        app.container.instance(authenticationClientToken, { getSession });
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
    },
  );
}

describe('page test harness', () => {
  beforeEach(() => {
    api.mockClear();
    getSession.mockClear();
    permissions = {
      unrestricted: false,
      permissions: [
        { resource: { type: 'composite', id: 'items' }, actions: ['create'] },
      ],
    };
    itemsResponse = { data: [] };
  });

  it('loads the list with the request the page is expected to send', async () => {
    itemsResponse = {
      data: [{ id: 1, name: 'Alpha', updatedAt: '2026-01-02T00:00:00Z' }],
    };
    await renderAt('/items');

    expect(await screen.findByText(/Alpha/)).toBeInTheDocument();
    expect(api).toHaveBeenCalledWith({ method: 'GET', path: 'items' });
  });

  it('shows loading until the API answers', async () => {
    let respond!: (value: unknown) => void;
    itemsResponse = new Promise((resolve) => {
      respond = resolve;
    });
    await renderAt('/items');

    expect(screen.getByRole('status')).toHaveTextContent(
      enUS['status.loading'],
    );
    respond({
      data: [{ id: 1, name: 'Alpha', updatedAt: '2026-01-02T00:00:00Z' }],
    });
    expect(await screen.findByText(/Alpha/)).toBeInTheDocument();
  });

  it('explains a 403 without offering a retry', async () => {
    itemsResponse = Response.json(
      { error: { message: 'Forbidden' } },
      { status: 403 },
    );
    await renderAt('/items');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      copy.items.error.forbidden,
    );
    expect(
      screen.queryByRole('button', { name: enUS['status.retry'] }),
    ).not.toBeInTheDocument();
  });

  it('treats a 401 as an ended session, not as a failure to retry', async () => {
    itemsResponse = Response.json(
      { error: { message: 'Unauthorized' } },
      { status: 401 },
    );
    await renderAt('/items');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      copy['status.sessionExpired'],
    );
    expect(
      screen.queryByRole('button', { name: enUS['status.retry'] }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(getSession).toHaveBeenCalledTimes(1));
    await userEvent.click(
      screen.getByRole('button', { name: copy.actions.signInAgain }),
    );
    expect(getSession).toHaveBeenCalledTimes(2);
  });

  it('shows the create action only with permission', async () => {
    await renderAt('/items');

    // A Button rendered as a Link is announced as a button.
    expect(
      await screen.findByRole('button', { name: copy.items.create.action }),
    ).toHaveAttribute('href', '/items/new');
    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'authorization/permissions',
    });
  });

  it('hides the create action without permission', async () => {
    permissions = { unrestricted: false, permissions: [] };
    const { app } = await renderAt('/items');

    await act(async () => {
      await app.container.resolve(authorizationClientToken).snapshot();
    });
    expect(
      screen.queryByRole('button', { name: copy.items.create.action }),
    ).not.toBeInTheDocument();
  });

  it('opens the create dialog from its URL and closes it back to the list', async () => {
    const view = await renderAt('/items/new');

    expect(
      await screen.findByRole('dialog', { name: copy.items.create.title }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: copy.actions.create }),
    );

    expect(view.toasts()).toEqual([
      expect.objectContaining({
        type: 'success',
        title: copy.items.create.success,
      }),
    ]);
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/items$/),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
