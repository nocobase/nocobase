import type {
  AppClientRegisteredRoute,
  AppClientRouteComponentModule,
} from '@nocobase/app-client/plugins';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { Activity, useState, useLayoutEffect, type ReactNode } from 'react';
import {
  createMemoryRouter,
  Link,
  Outlet,
  RouterProvider,
  Routes,
  useLocation,
} from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { RouteChildPage } from '../../client/components/route-child-page';
import { RouteDialog } from '../../client/components/route-dialog';
import { RouteDrawer } from '../../client/components/route-drawer';
import { RouteOverlayHost } from '../../client/components/route-overlay';
import { renderRouteTree } from '../../client/routing/route-tree.tsx';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';

const options = {
  namespace: packageMetadata.name,
  namespaces: { [packageMetadata.name]: enUS },
  route: '/items',
  services(app: import('@nocobase/app-client').ClientApplication) {
    app.container.singleton(
      authorizationClientToken,
      (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
    );
  },
};

// Loading a lazy route can take longer than Testing Library's one-second default on a loaded CI runner.
const LOAD = { timeout: 10_000 };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function Location() {
  return <output data-testid='location'>{useLocation().pathname}</output>;
}

function ListPage() {
  const [draft, setDraft] = useState('');
  return (
    <main>
      <h1>Items</h1>
      <label>
        Parent note
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <Link to='create'>Open create</Link>
      <Link to='pages'>Open child page</Link>
      <Link to='legacy'>Open legacy</Link>
      <Outlet />
    </main>
  );
}

function CreateForm() {
  return (
    <RouteDialog
      title='Create item'
      footer={<button type='button'>Save item</button>}
    >
      <p>Item form</p>
      <Link to='details'>Open details</Link>
      <Outlet />
    </RouteDialog>
  );
}

function page(
  name: string,
  path: string,
  load: () => Promise<AppClientRouteComponentModule>,
  extra: Partial<AppClientRegisteredRoute> = {},
): AppClientRegisteredRoute {
  return {
    id: `test:${name}`,
    name,
    path,
    auth: 'required',
    authz: 'skip',
    packageName: packageMetadata.name,
    source: 'application',
    componentLoader: load,
    ...extra,
  };
}

function itemRoutes(
  children: readonly AppClientRegisteredRoute[],
): readonly AppClientRegisteredRoute[] {
  return [
    page('items', '/items', async () => ({ default: ListPage }), {
      children,
    }),
  ];
}

async function renderItems(
  children: readonly AppClientRegisteredRoute[],
  fetch?: (request: Request) => Promise<Response>,
) {
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <Routes>{renderRouteTree(itemRoutes(children))}</Routes>
      <Location />
    </>,
    { ...options, ...(fetch ? { fetch } : {}) },
  );
  await screen.findByRole('heading', { name: 'Items' }, LOAD);
  return user;
}

describe('route presentations', () => {
  it('opens a declared dialog before its module arrives and fills that one panel', async () => {
    const module = deferred<AppClientRouteComponentModule>();
    const user = await renderItems([
      page('create', '/items/create', () => module.promise, {
        presentation: { kind: 'dialog', title: 'settings.newUser' },
      }),
    ]);
    await user.type(screen.getByLabelText('Parent note'), 'kept');
    await user.click(screen.getByRole('link', { name: 'Open create' }));

    const dialog = await screen.findByRole('dialog', { name: 'New user' });
    expect(dialog.querySelector('[data-slot="loading"]')).not.toBeNull();
    // The wait belongs to the dialog, so nothing is added to the page under it.
    expect(
      screen
        .getByRole('main', { hidden: true })
        .querySelector('[data-slot="loading"]'),
    ).toBeNull();
    expect(
      within(dialog).queryByRole('button', { name: 'Save item' }),
    ).toBeNull();

    await act(async () => module.resolve({ default: CreateForm }));
    await screen.findByText('Item form', {}, LOAD);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    const ready = screen.getByRole('dialog', { name: 'Create item' });
    expect(
      within(ready).getByRole('button', { name: 'Save item' }),
    ).toBeVisible();
    expect(ready.querySelector('[data-slot="loading"]')).toBeNull();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/items$/);
    expect(screen.getByLabelText('Parent note')).toHaveValue('kept');
  });

  it('closes a declared drawer that is still loading back to its parent', async () => {
    const user = await renderItems([
      page('create', '/items/create', () => new Promise(() => undefined), {
        presentation: { kind: 'drawer', title: 'settings.newUser' },
      }),
    ]);
    await user.click(screen.getByRole('link', { name: 'Open create' }));
    const drawer = await screen.findByRole('dialog', { name: 'New user' });
    expect(drawer).toHaveAttribute('data-presentation', 'drawer');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/items$/);
  });

  it('allows closing a cold permission check without a mounted form', async () => {
    const permissions = deferred<unknown>();
    const user = await renderItems(
      [
        page('create', '/items/create', async () => ({ default: CreateForm }), {
          authz: { resource: { type: 'user', id: '*' }, action: 'create' },
          presentation: { kind: 'dialog', title: 'settings.newUser' },
        }),
      ],
      answerApi(({ path }) =>
        path === 'authorization/permissions' ? permissions.promise : null,
      ),
    );
    try {
      await user.click(screen.getByRole('link', { name: 'Open create' }));
      await screen.findByRole('dialog', { name: 'New user' });
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByTestId('location')).toHaveTextContent(/^\/items$/);
    } finally {
      await act(async () =>
        permissions.resolve({ data: { unrestricted: true, permissions: [] } }),
      );
    }
  });

  it('keeps a slow authorization check and its denial inside the declared dialog', async () => {
    const permissions = deferred<unknown>();
    const load = vi.fn(async () => ({ default: CreateForm }));
    const user = await renderItems(
      [
        page('create', '/items/create', load, {
          authz: { resource: { type: 'user', id: '*' }, action: 'create' },
          presentation: { kind: 'dialog', title: 'settings.newUser' },
        }),
      ],
      answerApi(({ path }) =>
        path === 'authorization/permissions' ? permissions.promise : null,
      ),
    );
    await user.click(screen.getByRole('link', { name: 'Open create' }));

    const dialog = await screen.findByRole('dialog', { name: 'New user' });
    expect(dialog.querySelector('[data-slot="loading"]')).not.toBeNull();
    expect(load).not.toHaveBeenCalled();

    await act(async () =>
      permissions.resolve({ data: { unrestricted: false, permissions: [] } }),
    );
    expect(
      await within(dialog).findByText('Access denied', {}, LOAD),
    ).toBeVisible();
    expect(load).not.toHaveBeenCalled();
    expect(screen.queryByText('Item form')).toBeNull();
    expect(
      screen
        .getByRole('main', { hidden: true })
        .querySelector('[data-slot="loading"]'),
    ).toBeNull();
  });

  it('retries a failed module inside its dialog without remounting the parent page', async () => {
    const load = vi
      .fn<() => Promise<AppClientRouteComponentModule>>()
      .mockRejectedValueOnce(new Error('Chunk unavailable'))
      .mockResolvedValue({ default: CreateForm });
    const user = await renderItems([
      page('create', '/items/create', load, {
        presentation: { kind: 'dialog', title: 'settings.newUser' },
      }),
    ]);
    await user.type(screen.getByLabelText('Parent note'), 'draft');
    await user.click(screen.getByRole('link', { name: 'Open create' }));

    const dialog = await screen.findByRole('dialog', { name: 'New user' });
    expect(
      await within(dialog).findByText('Unable to load page', {}, LOAD),
    ).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));

    await screen.findByText('Item form', {}, LOAD);
    expect(load).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Reload page' })).toBeNull();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(
      screen.getByLabelText('Parent note', { selector: 'input' }),
    ).toHaveValue('draft');
  });

  it('offers a full reload only after retrying the module failed again', async () => {
    const load = vi.fn<() => Promise<AppClientRouteComponentModule>>(() =>
      Promise.reject(new Error('Chunk unavailable')),
    );
    const user = await renderItems([
      page('create', '/items/create', load, {
        presentation: { kind: 'dialog', title: 'settings.newUser' },
      }),
    ]);
    await user.click(screen.getByRole('link', { name: 'Open create' }));
    const dialog = await screen.findByRole('dialog', { name: 'New user' });
    await within(dialog).findByText('Unable to load page', {}, LOAD);
    expect(
      within(dialog).queryByRole('button', { name: 'Reload page' }),
    ).toBeNull();

    await user.click(within(dialog).getByRole('button', { name: 'Retry' }));
    expect(
      await within(dialog).findByRole('button', { name: 'Reload page' }, LOAD),
    ).toBeVisible();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps a route without a presentation in charge of its own overlay, nested in a hosted one', async () => {
    const user = await renderItems([
      page('create', '/items/create', async () => ({ default: CreateForm }), {
        presentation: { kind: 'dialog', title: 'settings.newUser' },
        children: [
          page('details', '/items/create/details', async () => ({
            default: () => (
              <RouteDrawer title='Item details'>
                <p>Details body</p>
              </RouteDrawer>
            ),
          })),
        ],
      }),
      page('legacy', '/items/legacy', async () => ({
        default: () => (
          <RouteDialog title='Legacy dialog'>
            <p>Legacy body</p>
          </RouteDialog>
        ),
      })),
    ]);

    await user.click(screen.getByRole('link', { name: 'Open legacy' }));
    await screen.findByText('Legacy body', {}, LOAD);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await user.click(screen.getByRole('link', { name: 'Open create' }));
    await screen.findByText('Item form', {}, LOAD);
    await user.click(screen.getByRole('link', { name: 'Open details' }));
    await screen.findByText('Details body', {}, LOAD);
    // The nested route builds its own drawer and leaves the hosted dialog's title alone.
    const panels = [
      ...document.querySelectorAll('[data-slot="route-overlay-content"]'),
    ];
    expect(
      panels.map(
        (panel) =>
          panel.querySelector('[data-slot="route-overlay-header"] h2')
            ?.textContent,
      ),
    ).toEqual(['Create item', 'Item details']);
    expect(panels[1]).toHaveAttribute('data-presentation', 'drawer');

    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Item details' })).toBeNull(),
    );
    expect(screen.getByRole('dialog', { name: 'Create item' })).toBeVisible();
    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/items\/create$/,
    );
  });

  it('covers the parent with a declared child page while its module loads', async () => {
    const module = deferred<AppClientRouteComponentModule>();
    const user = await renderItems([
      page('pages', '/items/pages', () => module.promise, {
        presentation: { kind: 'child-page' },
      }),
    ]);
    await user.click(screen.getByRole('link', { name: 'Open child page' }));

    await waitFor(() =>
      expect(
        document.querySelectorAll('[data-slot="route-child-page"]'),
      ).toHaveLength(1),
    );
    const layer = document.querySelector('[data-slot="route-child-page"]')!;
    expect(layer.querySelector('[data-slot="loading"]')).not.toBeNull();

    await act(async () =>
      module.resolve({
        default: () => (
          <RouteChildPage className='bg-muted'>
            <h2>Child content</h2>
          </RouteChildPage>
        ),
      }),
    );
    await screen.findByRole('heading', { name: 'Child content' }, LOAD);
    expect(
      document.querySelectorAll('[data-slot="route-child-page"]'),
    ).toHaveLength(1);
    expect(layer.querySelector('[data-slot="loading"]')).toBeNull();
    expect(layer).toContainElement(
      screen.getByRole('heading', { name: 'Child content' }),
    );
    // The page's own layer classes move onto the layer the application opened.
    expect(layer).toHaveClass('bg-muted');
  });
});

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-default',
    resources: enUS,
  },
});

describe('route overlay host', () => {
  function Host({
    concealed,
    beforeClose,
  }: {
    readonly concealed: boolean;
    readonly beforeClose: () => boolean | Promise<boolean>;
  }): ReactNode {
    return (
      <RouteOverlayHost title='New item' ready concealed={concealed}>
        <Activity mode={concealed ? 'hidden' : 'visible'}>
          <RouteDialog
            title='Secret record'
            footer={<button type='button'>Save item</button>}
            beforeClose={beforeClose}
          >
            <p>Form body</p>
          </RouteDialog>
        </Activity>
      </RouteOverlayHost>
    );
  }

  it('conceals a nested portal below a hidden parent DOM element and restores the same panel', async () => {
    let conceal!: (value: boolean) => void;
    function Harness() {
      const [hidden, setHidden] = useState(false);
      useLayoutEffect(() => {
        conceal = setHidden;
      }, []);
      return (
        <Activity mode={hidden ? 'hidden' : 'visible'}>
          <main>
            <Host concealed={false} beforeClose={() => false} />
          </main>
        </Activity>
      );
    }
    const router = createMemoryRouter(
      [{ path: '/items/create', element: <Harness /> }],
      { initialEntries: ['/items/create'] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    const panel = await screen.findByRole('dialog', { name: 'Secret record' });
    await act(async () => conceal(true));
    expect(panel).not.toBeVisible();
    expect(panel.closest('[data-slot="dialog-portal"]')).toHaveStyle({
      display: 'none',
    });
    await act(async () => conceal(false));
    expect(screen.getByRole('dialog', { name: 'Secret record' })).toBe(panel);
    expect(screen.getByRole('button', { name: 'Save item' })).toBeVisible();
  });

  it('never resumes an async close that crossed concealment, even when it settles after recovery', async () => {
    const decision = deferred<boolean>();
    let conceal!: (value: boolean) => void;
    const beforeClose = vi.fn(() => decision.promise);
    function Harness() {
      const [concealed, setConcealed] = useState(false);
      useLayoutEffect(() => {
        conceal = setConcealed;
      }, []);
      return <Host concealed={concealed} beforeClose={beforeClose} />;
    }
    const router = createMemoryRouter(
      [
        {
          path: '/items',
          children: [{ path: 'create', element: <Harness /> }],
        },
      ],
      { initialEntries: ['/items/create'] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    const user = userEvent.setup();
    await screen.findByRole('dialog', { name: 'Secret record' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(beforeClose).toHaveBeenCalledTimes(1));
    await act(async () => conceal(true));
    await act(async () => conceal(false));
    await act(async () => decision.resolve(true));
    expect(screen.getByRole('dialog', { name: 'Secret record' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/items/create');
  });

  it('hides protected slots and refuses closing without calling the disconnected page guard', async () => {
    const user = userEvent.setup();
    const beforeClose = vi.fn(() => false);
    function Harness() {
      const [concealed, setConcealed] = useState(false);
      return (
        <>
          <button type='button' onClick={() => setConcealed(!concealed)}>
            Toggle recheck
          </button>
          <Host concealed={concealed} beforeClose={beforeClose} />
        </>
      );
    }
    const toggle = () =>
      act(() =>
        screen
          .getByRole('button', { name: 'Toggle recheck', hidden: true })
          .click(),
      );
    const router = createMemoryRouter(
      [
        {
          path: '/items',
          children: [{ path: 'create', element: <Harness /> }],
        },
      ],
      { initialEntries: ['/items/create'] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );

    const dialog = await screen.findByRole('dialog', { name: 'Secret record' });
    expect(
      within(dialog).getByRole('button', { name: 'Save item' }),
    ).toBeVisible();

    toggle();
    await screen.findByRole('dialog', { name: 'New item' });
    expect(screen.queryByText('Secret record')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save item' })).toBeNull();

    await user.keyboard('{Escape}');
    expect(beforeClose).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/items/create');

    toggle();
    expect(
      await screen.findByRole('dialog', { name: 'Secret record' }),
    ).toBeVisible();
  });
});
