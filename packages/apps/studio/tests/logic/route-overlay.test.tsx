import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RouteDialog } from '../../client/components/route-dialog';
import { RouteDrawer } from '../../client/components/route-drawer';
import { useRouteOverlay } from '../../client/components/use-route-overlay';

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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
  render(<RouterProvider router={router} />);
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
    fireEvent.click(
      await screen.findByRole('button', { name: 'routeOverlay.close' }),
    );
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
    fireEvent.click(screen.getByRole('button', { name: 'routeOverlay.close' }));
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
    render(<RouterProvider router={router} />);
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
      fireEvent.click(
        await screen.findByRole('button', { name: 'routeOverlay.close' }),
      );
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
    render(<RouterProvider router={router} />);
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
