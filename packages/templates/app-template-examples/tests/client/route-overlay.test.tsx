import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  NavigationGuardProvider,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createMemoryRouter,
  Link,
  MemoryRouter,
  Outlet,
  Route,
  RouterProvider,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackForm } from '../../client/components/feedback-form';
import { RouteDialog } from '../../client/components/route-dialog';
import { RouteDrawer } from '../../client/components/route-drawer';
import { useRouteOverlay } from '../../client/components/use-route-overlay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../client/components/ui/alert-dialog';
import enUS from '../../client/locales/en-US.js';

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: enUS,
  },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

function Actions() {
  const { close, isClosing } = useRouteOverlay();
  return (
    <button disabled={isClosing} onClick={() => void close()}>
      Cancel
    </button>
  );
}
function setup(
  beforeClose?: () => boolean | Promise<boolean>,
  closeTo?: string,
  nested = false,
) {
  const router = createMemoryRouter(
    [
      {
        path: '/orders',
        element: (
          <>
            <span>Orders</span>
            <Outlet />
          </>
        ),
        children: [
          {
            path: 'edit/:id',
            element: (
              <RouteDialog
                title='Edit'
                beforeClose={beforeClose}
                closeTo={closeTo}
                footer={<Actions />}
              >
                <input aria-label='Name' defaultValue='Original' />
                <Link to='details'>Open details</Link>
                {/* A page places the outlet wherever its next child belongs. */}
                <Outlet />
              </RouteDialog>
            ),
            children: [
              {
                path: 'details',
                element: (
                  <RouteDrawer title='Details' footer={<Actions />}>
                    Detail
                  </RouteDrawer>
                ),
              },
            ],
          },
        ],
      },
      { path: '/other', element: <span>Other</span> },
    ],
    {
      basename: '/main',
      initialEntries: [
        `/main/orders/edit/42${nested ? '/details' : ''}?filter=recent#field`,
      ],
    },
  );
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}

describe('route overlays', () => {
  it('closes a direct link to its route parent, preserving query and removing hash', async () => {
    const router = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/orders'),
    );
    expect(router.state.location.search).toBe('?filter=recent');
    expect(router.state.location.hash).toBe('');
    expect(router.state.historyAction).toBe('REPLACE');
  });
  it('uses the explicit target without merging query', async () => {
    const router = setup(undefined, '/other');
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/other'),
    );
    expect(router.state.location.search).toBe('');
  });
  it('keeps the dialog open while checking and when rejected', async () => {
    let resolve!: (value: boolean) => void;
    const check = vi.fn(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
    );
    const router = setup(check);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await waitFor(() => expect(check).toHaveBeenCalledTimes(1));
    await act(async () => {
      resolve(false);
    });
    expect(check).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe('/main/orders/edit/42');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  });
  it('ignores a pending result after navigation away', async () => {
    let resolve!: (value: boolean) => void;
    const router = setup(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await act(() => router.navigate('/other'));
    await act(async () => {
      resolve(true);
    });
    expect(router.state.location.pathname).toBe('/main/other');
  });
  it('closes only the top drawer and retains its parent dialog', async () => {
    const router = setup(undefined, undefined, true);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/orders/edit/42'),
    );
    expect(await screen.findByRole('dialog', { name: 'Edit' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original',
    );
  });
});

describe('route overlay presentation', () => {
  it('composes the dialog primitives so it follows the dialog styles', async () => {
    setup();
    const dialog = await screen.findByRole('dialog', { name: 'Edit' });
    expect(dialog).toHaveAttribute('data-slot', 'route-overlay-content');
    expect(dialog).toHaveAttribute('data-presentation', 'dialog');
    const header = dialog.querySelector(
      ':scope > [data-slot="route-overlay-header"] > [data-slot="dialog-header"]',
    );
    expect(
      header?.querySelector('[data-slot="dialog-title"]'),
    ).toHaveTextContent('Edit');
    expect(
      dialog.querySelector(':scope > [data-slot="route-overlay-body"]'),
    ).toContainElement(screen.getByRole('textbox', { name: 'Name' }));
    const footer = dialog.querySelector(
      ':scope > [data-slot="route-overlay-footer"] > [data-slot="dialog-footer"]',
    );
    expect(footer).toContainElement(
      screen.getByRole('button', { name: 'Cancel' }),
    );
    // The footer sits at the panel's edges, so the margins it uses inside `DialogContent` are reset.
    expect(footer).toHaveClass('mx-0', 'mb-0');
    expect(footer).not.toHaveClass('-mx-6', '-mb-6');
    expect(
      dialog.querySelector(':scope > [data-slot="dialog-close"]'),
    ).toHaveAccessibleName('Close');
  });

  it('presents a drawer with the same regions', async () => {
    setup(undefined, undefined, true);
    const drawer = await screen.findByRole('dialog', { name: 'Details' });
    expect(drawer).toHaveAttribute('data-presentation', 'drawer');
    expect(
      drawer.querySelector(
        ':scope > [data-slot="route-overlay-footer"] > [data-slot="dialog-footer"]',
      ),
    ).toContainElement(within(drawer).getByRole('button', { name: 'Cancel' }));
  });
});

describe('route overlay interactions', () => {
  it('renders an owning backdrop for the nested layer and dismisses only that layer', async () => {
    const user = userEvent.setup();
    const parentCheck = vi.fn(() => true);
    const router = setup(parentCheck, undefined, true);
    const child = await screen.findByRole('dialog', { name: 'Details' });
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    // The hit target must belong to the child portal. A parent's z-indexed
    // backdrop otherwise obscures the child's unstyled internal backdrop.
    const portal = child.closest('[data-base-ui-portal]');
    const backdrop = portal?.querySelector(
      ':scope > [data-slot="dialog-overlay"]',
    );
    expect(backdrop).toBeInTheDocument();
    await user.click(backdrop!);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/orders/edit/42'),
    );
    expect(parentCheck).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible(),
    );
  });

  it('dismisses only the top layer with Escape', async () => {
    const user = userEvent.setup();
    const parentCheck = vi.fn(() => true);
    const router = setup(parentCheck, undefined, true);
    const child = await screen.findByRole('dialog', { name: 'Details' });
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/orders/edit/42'),
    );
    expect(parentCheck).not.toHaveBeenCalled();
    expect(await screen.findByRole('dialog', { name: 'Edit' })).toBeVisible();
  });

  it('retains edited parent state and restores focus to the link that opened its child', async () => {
    const user = userEvent.setup();
    const router = setup();
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Changed');
    const link = screen.getByRole('link', { name: 'Open details' });
    await user.click(link);
    const child = await screen.findByRole('dialog', { name: 'Details' });
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/orders/edit/42'),
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Changed',
      ),
    );
    await waitFor(() => expect(link).toHaveFocus());
  });

  it('restores focus into the parent when closing a directly loaded nested route', async () => {
    const user = userEvent.setup();
    setup(undefined, undefined, true);
    const child = await screen.findByRole('dialog', { name: 'Details' });
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const parent = await screen.findByRole('dialog', { name: 'Edit' });
    await waitFor(() =>
      expect(parent.contains(document.activeElement)).toBe(true),
    );
  });

  it('allows history back and forward without running the close guard', async () => {
    const guard = vi.fn(() => false);
    const router = createMemoryRouter(
      [
        {
          path: '/orders',
          element: (
            <>
              <span>Orders</span>
              <Outlet />
            </>
          ),
          children: [
            {
              path: 'edit',
              element: (
                <RouteDialog title='Edit' beforeClose={guard}>
                  Form
                </RouteDialog>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/orders', '/orders/edit'] },
    );
    render(<RouterProvider router={router} />, { wrapper: I18n });
    expect(await screen.findByRole('dialog', { name: 'Edit' })).toBeVisible();
    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe('/orders');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(() => router.navigate(1));
    expect(await screen.findByRole('dialog', { name: 'Edit' })).toBeVisible();
    expect(guard).not.toHaveBeenCalled();
  });

  it('logs a rejected internal close request and leaves the dialog open', async () => {
    const failure = new Error('Confirmation unavailable');
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const router = setup(() => Promise.reject(failure));
      fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
      await waitFor(() =>
        expect(log).toHaveBeenCalledWith(
          'Failed to close route overlay',
          failure,
        ),
      );
      expect(router.state.location.pathname).toBe('/main/orders/edit/42');
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    } finally {
      log.mockRestore();
    }
  });

  it('propagates a failed close check to the hook caller and permits a retry', async () => {
    const failure = new Error('Confirmation unavailable');
    const guard = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(true);
    let overlay: ReturnType<typeof useRouteOverlay> | undefined;
    function Capture() {
      const value = useRouteOverlay();
      useEffect(() => {
        overlay = value;
      }, [value]);
      return <span>Form</span>;
    }
    const router = createMemoryRouter(
      [
        {
          path: '/orders',
          element: <Outlet />,
          children: [
            {
              path: 'edit',
              element: (
                <RouteDialog title='Edit' beforeClose={guard}>
                  <Capture />
                </RouteDialog>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/orders/edit'] },
    );
    render(<RouterProvider router={router} />, { wrapper: I18n });
    await screen.findByRole('dialog', { name: 'Edit' });
    await act(async () => {
      await expect(overlay!.close()).rejects.toBe(failure);
    });
    expect(router.state.location.pathname).toBe('/orders/edit');
    expect(overlay!.isClosing).toBe(false);
    await act(async () => {
      await overlay!.close();
    });
    expect(router.state.location.pathname).toBe('/orders');
    expect(guard).toHaveBeenCalledTimes(2);
  });

  it('reports hook use outside a route overlay', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => render(<Actions />)).toThrow(
        'useRouteOverlay must be used inside RouteDialog or RouteDrawer',
      );
    } finally {
      log.mockRestore();
    }
  });
});

describe('unsaved changes in a route overlay', () => {
  // The pattern of section 2.5 in overlay.md: the dirty check is a navigation guard, so every way out reaches it,
  // including browser back, which never calls `beforeClose`.
  function GuardedEdit({
    guard,
  }: {
    readonly guard: (dirty: boolean) => boolean | Promise<boolean>;
  }) {
    const dirtyRef = useRef(false);
    useNavigationGuard(() => guard(dirtyRef.current));
    return (
      <RouteDialog title='Edit' footer={<Actions />}>
        <input
          aria-label='Name'
          defaultValue='Original'
          onChange={() => {
            dirtyRef.current = true;
          }}
        />
      </RouteDialog>
    );
  }
  function setupGuarded(guard: (dirty: boolean) => boolean | Promise<boolean>) {
    const history: { back?: () => void; path?: string } = {};
    function Probe() {
      const navigate = useNavigate();
      const { pathname, search } = useLocation();
      useEffect(() => {
        history.back = () => void navigate(-1);
        history.path = `${pathname}${search}`;
      });
      return null;
    }
    render(
      <MemoryRouter
        initialEntries={['/orders?page=2', '/orders/edit?page=2']}
        initialIndex={1}
      >
        <NavigationGuardProvider>
          <Probe />
          <Routes>
            <Route
              path='/orders'
              element={
                <>
                  <span>Orders</span>
                  <Outlet />
                </>
              }
            >
              <Route path='edit' element={<GuardedEdit guard={guard} />} />
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    return history;
  }

  it('asks on Cancel, the close button, the backdrop, Escape and browser back, keeping the input when declined', async () => {
    const guard = vi.fn((dirty: boolean) => !dirty);
    const history = setupGuarded(guard);
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.type(name, ' draft');
    const dialog = screen.getByRole('dialog', { name: 'Edit' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );
    // A tap outside the dialog, as on a phone, is one more way out and reaches the same guard.
    const backdrop = dialog
      .closest('[data-base-ui-portal]')
      ?.querySelector(':scope > [data-slot="dialog-overlay"]');
    expect(backdrop).toBeInTheDocument();
    await userEvent.click(backdrop!);
    await userEvent.keyboard('{Escape}');
    act(() => history.back!());
    await waitFor(() => expect(guard).toHaveBeenCalledTimes(5));
    expect(guard.mock.calls.every(([dirty]) => dirty)).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original draft',
    );
    await waitFor(() => expect(history.path).toBe('/orders/edit?page=2'));
  });

  it('leaves through browser back once the user agrees, returning to the list query', async () => {
    let answer!: (discard: boolean) => void;
    const history = setupGuarded((dirty) =>
      dirty
        ? new Promise<boolean>((resolve) => {
            answer = resolve;
          })
        : true,
    );
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' draft',
    );
    act(() => history.back!());
    // While the question is open, the overlay and its input stay mounted.
    await waitFor(() => expect(answer).toBeTypeOf('function'));
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original draft',
    );
    await act(async () => answer(true));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(history.path).toBe('/orders?page=2');
  });
});

describe('detail drawer, edit dialog and a confirmation', () => {
  const save = vi.fn();
  beforeEach(() => save.mockClear());
  // The one three-layer path the phone experience allows (mobile.md M7.2, guideline I1): a detail drawer opens an edit
  // dialog, whose unsaved-changes question is the single confirmation. Only the top layer takes input, and leaving
  // returns one layer at a time to the URL below it.
  function EditOrder() {
    const dirtyRef = useRef(false);
    const [answer, setAnswer] = useState<((discard: boolean) => void) | null>(
      null,
    );
    useNavigationGuard(() =>
      dirtyRef.current
        ? new Promise<boolean>((resolve) => setAnswer(() => resolve))
        : true,
    );
    const reply = (discard: boolean) => {
      answer?.(discard);
      setAnswer(null);
    };
    return (
      <RouteDialog
        title='Edit order'
        footer={
          <>
            <Actions />
            <button type='button' onClick={save}>
              Save
            </button>
          </>
        }
      >
        <input
          aria-label='Name'
          defaultValue='Original'
          onChange={() => {
            dirtyRef.current = true;
          }}
        />
        <AlertDialog open={answer !== null}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => reply(false)}>
                Keep editing
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => reply(true)}>
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </RouteDialog>
    );
  }

  /** The orders list with a detail drawer at /orders/42 and its edit dialog; returns the current URL as it changes. */
  function renderOrders(): { path?: string } {
    const location: { path?: string } = {};
    function Probe() {
      const { pathname, search } = useLocation();
      useEffect(() => {
        location.path = `${pathname}${search}`;
      });
      return null;
    }
    render(
      <MemoryRouter
        initialEntries={['/orders?status=open', '/orders/42?status=open']}
        initialIndex={1}
      >
        <NavigationGuardProvider>
          <Probe />
          <Routes>
            <Route
              path='/orders'
              element={
                <>
                  <span>Orders</span>
                  <Outlet />
                </>
              }
            >
              <Route
                path=':id'
                element={
                  <RouteDrawer title='Order 42' footer={<Actions />}>
                    <p>Order details</p>
                    {/* Overlay links keep the view's query (I9). */}
                    <Link to='edit?status=open'>Edit</Link>
                    <Outlet />
                  </RouteDrawer>
                }
              >
                <Route path='edit' element={<EditOrder />} />
              </Route>
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    return location;
  }

  it('asks once over the dialog, keeps the draft, then returns to the drawer and the list one layer at a time', async () => {
    const user = userEvent.setup();
    const location = renderOrders();

    await user.click(await screen.findByRole('link', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit order' });
    expect(location.path).toBe('/orders/42/edit?status=open');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      ' draft',
    );

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    const prompt = await screen.findByRole('alertdialog', {
      name: 'Discard changes?',
    });
    // The confirmation is the only layer that takes input: the dialog and the drawer below are out of reach.
    expect(
      screen.queryByRole('dialog', { name: 'Order 42' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Edit order' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1);
    // The confirmation opened inside the dialog has a backdrop of its own, stacked after the dialog's, so a tap on
    // the dialog's Save below lands on it (Base UI leaves a nested backdrop out unless it is forced; mobile.md M7.2).
    // jsdom has no hit testing: the browser check in the delivery measures the taps themselves.
    const promptPortal = prompt.closest('[data-base-ui-portal]')!;
    const overlay = promptPortal.querySelector(
      '[data-slot="alert-dialog-overlay"]',
    );
    expect(overlay).toBeInTheDocument();
    const dialogPortal = document
      .querySelector('[data-slot="route-overlay-content"]')!
      .closest('[data-base-ui-portal]')!;
    expect(
      dialogPortal.compareDocumentPosition(promptPortal) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // The keyboard cannot reach Save either: Tab cycles through the confirmation and its focus guards, never into the
    // edit dialog below.
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(false);
    }
    expect(save).not.toHaveBeenCalled();
    await user.click(
      within(prompt).getByRole('button', { name: 'Keep editing' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original draft',
    );
    await waitFor(() =>
      expect(location.path).toBe('/orders/42/edit?status=open'),
    );

    await user.click(
      within(screen.getByRole('dialog', { name: 'Edit order' })).getByRole(
        'button',
        { name: 'Cancel' },
      ),
    );
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: 'Discard',
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit order' }),
      ).not.toBeInTheDocument(),
    );
    expect(location.path).toBe('/orders/42?status=open');
    expect(screen.getByRole('dialog', { name: 'Order 42' })).toBeVisible();

    await user.click(
      within(screen.getByRole('dialog', { name: 'Order 42' })).getByRole(
        'button',
        { name: 'Cancel' },
      ),
    );
    await waitFor(() => expect(location.path).toBe('/orders?status=open'));
    expect(screen.getByText('Orders')).toBeVisible();
  });
  it('answers Enter and Space only on the confirmation, never on the Save below', async () => {
    const user = userEvent.setup();
    const location = renderOrders();
    await user.click(await screen.findByRole('link', { name: 'Edit' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit order' });
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Name' }),
      ' draft',
    );
    const askToLeave = async () => {
      await user.click(
        within(screen.getByRole('dialog', { name: 'Edit order' })).getByRole(
          'button',
          { name: 'Cancel' },
        ),
      );
      return screen.findByRole('alertdialog', { name: 'Discard changes?' });
    };

    // Whatever the confirmation focuses when it opens, it is not the Save below.
    let prompt = await askToLeave();
    await waitFor(() =>
      expect(prompt.contains(document.activeElement)).toBe(true),
    );

    // Enter and Space on "Keep editing" close only the confirmation and keep the draft.
    for (const key of ['{Enter}', ' ']) {
      within(prompt).getByRole('button', { name: 'Keep editing' }).focus();
      await user.keyboard(key);
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      expect(save).not.toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Original draft',
      );
      expect(location.path).toBe('/orders/42/edit?status=open');
      prompt = await askToLeave();
    }

    // Enter on "Discard" leaves the dialog for the drawer below, still without saving.
    within(prompt).getByRole('button', { name: 'Discard' }).focus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit order' }),
      ).not.toBeInTheDocument(),
    );
    expect(location.path).toBe('/orders/42?status=open');
    expect(screen.getByRole('dialog', { name: 'Order 42' })).toBeVisible();
    expect(save).not.toHaveBeenCalled();
  });
});

describe('the dirty prop of a route overlay', () => {
  // The default path of M7.4: a page passes whether its form is dirty, and the overlay asks before every way out.
  function DirtyEdit() {
    const [dirty, setDirty] = useState(false);
    const savedRef = useRef(false);
    const navigate = useNavigate();
    const { search } = useLocation();
    return (
      <RouteDialog
        title='Edit'
        dirty={() => dirty && !savedRef.current}
        footer={
          <>
            <Actions />
            <button
              onClick={() => {
                savedRef.current = true;
                void navigate({ pathname: '..', search });
              }}
            >
              Save
            </button>
          </>
        }
      >
        <input
          aria-label='Name'
          defaultValue='Original'
          onChange={() => setDirty(true)}
        />
      </RouteDialog>
    );
  }
  function setupDirty() {
    const history: { back?: () => void; path?: string } = {};
    function Probe() {
      const navigate = useNavigate();
      const { pathname, search } = useLocation();
      useEffect(() => {
        history.back = () => void navigate(-1);
        history.path = `${pathname}${search}`;
      });
      return null;
    }
    render(
      <MemoryRouter
        initialEntries={['/orders?page=2', '/orders/edit?page=2']}
        initialIndex={1}
      >
        <NavigationGuardProvider>
          <Probe />
          <Routes>
            <Route path='/orders' element={<Outlet />}>
              <Route path='edit' element={<DirtyEdit />} />
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    return history;
  }
  async function keepEditing() {
    const prompt = await screen.findByRole('alertdialog', {
      name: 'Discard changes?',
    });
    await userEvent.click(
      within(prompt).getByRole('button', { name: 'Keep editing' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  }

  it('asks on Cancel, the close button, Escape and browser back, and keeps the input on Keep editing', async () => {
    const history = setupDirty();
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' draft',
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit' });

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );
    await keepEditing();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );
    await keepEditing();
    await userEvent.keyboard('{Escape}');
    await keepEditing();
    act(() => history.back!());
    await keepEditing();

    expect(screen.getByRole('dialog', { name: 'Edit' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original draft',
    );
    await waitFor(() => expect(history.path).toBe('/orders/edit?page=2'));
  });

  it('closes to the list query once the user discards', async () => {
    const history = setupDirty();
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' draft',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const prompt = await screen.findByRole('alertdialog', {
      name: 'Discard changes?',
    });
    await userEvent.click(
      within(prompt).getByRole('button', { name: 'Discard' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(history.path).toBe('/orders?page=2');
  });

  it('closes without asking when nothing changed', async () => {
    const history = setupDirty();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    await waitFor(() => expect(history.path).toBe('/orders?page=2'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('lets the save navigate without asking', async () => {
    const history = setupDirty();
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' saved',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(history.path).toBe('/orders?page=2'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('the unsaved-changes question cannot be switched off by a draft', () => {
  // A page that keeps a draft and passes a `dirty` that says "nothing to lose" once the draft is stored, then saves
  // through a FeedbackForm whose onSubmit navigates back.
  function DraftEdit() {
    const navigate = useNavigate();
    const { search } = useLocation();
    return (
      <RouteDialog
        title='Edit'
        dirty={() => false}
        footer={
          <>
            <Actions />
            <button type='submit' form='draft-form'>
              Save
            </button>
          </>
        }
      >
        <FeedbackForm
          id='draft-form'
          onSubmit={async () => {
            await Promise.resolve();
            await navigate({ pathname: '..', search });
          }}
        >
          <input aria-label='Name' defaultValue='Original' />
        </FeedbackForm>
      </RouteDialog>
    );
  }
  function setupDraft() {
    const history: { path?: string } = {};
    function Probe() {
      const { pathname, search } = useLocation();
      useEffect(() => {
        history.path = `${pathname}${search}`;
      });
      return null;
    }
    render(
      <MemoryRouter
        initialEntries={['/orders?page=2', '/orders/edit?page=2']}
        initialIndex={1}
      >
        <NavigationGuardProvider>
          <Probe />
          <Routes>
            <Route path='/orders' element={<Outlet />}>
              <Route path='edit' element={<DraftEdit />} />
            </Route>
          </Routes>
        </NavigationGuardProvider>
      </MemoryRouter>,
      { wrapper: I18n },
    );
    return history;
  }

  it('asks once the user has typed, whatever dirty says', async () => {
    const history = setupDraft();
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' draft',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const prompt = await screen.findByRole('alertdialog', {
      name: 'Discard changes?',
    });
    await userEvent.click(
      within(prompt).getByRole('button', { name: 'Keep editing' }),
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original draft',
    );
    await waitFor(() => expect(history.path).toBe('/orders/edit?page=2'));
  });

  it('closes without asking when nothing was typed', async () => {
    const history = setupDraft();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' }),
    );
    await waitFor(() => expect(history.path).toBe('/orders?page=2'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('lets the save of a FeedbackForm leave without asking', async () => {
    const history = setupDraft();
    await userEvent.type(
      await screen.findByRole('textbox', { name: 'Name' }),
      ' saved',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(history.path).toBe('/orders?page=2'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
