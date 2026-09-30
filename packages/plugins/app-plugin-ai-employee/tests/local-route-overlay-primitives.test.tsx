// @vitest-environment jsdom
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useEffect, type ReactElement } from 'react';
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { RouteDialog } from '../client/components/route-dialog.js';
import { RouteDrawer } from '../client/components/route-drawer.js';
import { Button } from '../client/components/ui/button.js';
import {
  useRouteOverlay,
  type RouteOverlayContextValue,
} from '../client/components/use-route-overlay.js';

function Actions(): ReactElement {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button
      disabled={isClosing}
      onClick={() => {
        void close().catch(() => {});
      }}
    >
      Cancel editor
    </Button>
  );
}

function setup({
  beforeClose,
  closeTo,
  nested = false,
}: {
  beforeClose?: () => boolean | Promise<boolean>;
  closeTo?: string;
  nested?: boolean;
} = {}): ReturnType<typeof createMemoryRouter> {
  const router = createMemoryRouter(
    [
      {
        path: '/employees',
        element: (
          <>
            <span>Employees</span>
            <Outlet />
          </>
        ),
        children: [
          {
            path: ':id/edit',
            element: (
              <RouteDialog
                title='Edit employee'
                description='Employee configuration'
                beforeClose={beforeClose}
                closeTo={closeTo}
                footer={<Actions />}
              >
                <input aria-label='Name' defaultValue='Original' />
                <Link to='details'>Open details</Link>
                <Outlet />
              </RouteDialog>
            ),
            children: [
              {
                path: 'details',
                element: (
                  <RouteDrawer
                    title='Employee details'
                    description='Details'
                    footer={<Actions />}
                  >
                    Details content
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
        `/main/employees/42/edit${nested ? '/details' : ''}?filter=active#name`,
      ],
    },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('plugin local route overlay primitives', () => {
  it('closes a direct URL to its parent preserving queries and replacing history', async () => {
    const router = setup();
    expect(
      await screen.findByRole('dialog', { name: 'Edit employee' }),
    ).toHaveAttribute('aria-modal', 'true');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel editor' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/employees'),
    );
    expect(router.state.location.search).toBe('?filter=active');
    expect(router.state.location.hash).toBe('');
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('honors an explicit close target without copying the old query', async () => {
    const router = setup({ closeTo: '/other' });
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/other'),
    );
    expect(router.state.location.search).toBe('');
  });

  it('shares pending close requests and retains the overlay when the guard declines', async () => {
    const pending = Promise.withResolvers<boolean>();
    const guard = vi.fn(() => pending.promise);
    const router = setup({ beforeClose: guard });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel editor' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(
      screen.getByRole('button', { name: 'Cancel editor' }),
    ).toBeDisabled();
    await waitFor(() => expect(guard).toHaveBeenCalledTimes(1));
    await act(async () => {
      pending.resolve(false);
    });
    expect(router.state.location.pathname).toBe('/main/employees/42/edit');
    expect(screen.getByRole('button', { name: 'Cancel editor' })).toBeEnabled();
  });

  it('does not apply a pending guard result after navigation away', async () => {
    const pending = Promise.withResolvers<boolean>();
    const guard = vi.fn(() => pending.promise);
    const router = setup({ beforeClose: guard });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel editor' }),
    );
    await waitFor(() => expect(guard).toHaveBeenCalledOnce());
    await act(() => router.navigate('/other'));
    await act(async () => {
      pending.resolve(true);
    });
    expect(router.state.location.pathname).toBe('/main/other');
  });

  it('closes only the nested drawer and restores focus into its directly loaded parent', async () => {
    const parentGuard = vi.fn(() => false);
    const router = setup({ beforeClose: parentGuard, nested: true });
    const child = await screen.findByRole('dialog', {
      name: 'Employee details',
    });
    expect(child).toHaveAttribute('aria-modal', 'true');
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    const portal = child.closest('[data-base-ui-portal]');
    expect(
      portal?.querySelector(':scope > [data-slot="dialog-overlay"]'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel editor' }));
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/employees/42/edit'),
    );
    const parent = await screen.findByRole('dialog', { name: 'Edit employee' });
    await waitFor(() =>
      expect(parent.contains(document.activeElement)).toBe(true),
    );
    expect(parentGuard).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Original',
    );
  });

  it('returns focus to the child-opening link without resetting edited parent state', async () => {
    const router = setup();
    const name = await screen.findByRole('textbox', { name: 'Name' });
    fireEvent.change(name, { target: { value: 'Changed' } });
    const link = screen.getByRole('link', { name: 'Open details' });
    await act(async () => {
      link.focus();
    });
    fireEvent.click(link);
    const child = await screen.findByRole('dialog', {
      name: 'Employee details',
    });
    await waitFor(() =>
      expect(child.contains(document.activeElement)).toBe(true),
    );
    fireEvent.keyDown(document.activeElement ?? child, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/main/employees/42/edit'),
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
        'Changed',
      ),
    );
    await waitFor(() => expect(link).toHaveFocus());
  });

  it('checks Escape dismissal and keeps the overlay open when declined', async () => {
    const guard = vi.fn(() => false);
    const router = setup({ beforeClose: guard });
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true),
    );
    fireEvent.keyDown(document.activeElement ?? dialog, {
      key: 'Escape',
      code: 'Escape',
    });
    await waitFor(() => expect(guard).toHaveBeenCalledOnce());
    expect(router.state.location.pathname).toBe('/main/employees/42/edit');
  });

  it('leaves browser history navigation outside the close guard', async () => {
    const guard = vi.fn(() => false);
    const router = createMemoryRouter(
      [
        {
          path: '/employees',
          element: <Outlet />,
          children: [
            {
              path: 'edit',
              element: (
                <RouteDialog title='Edit employee' beforeClose={guard}>
                  Form
                </RouteDialog>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/employees', '/employees/edit'] },
    );
    render(<RouterProvider router={router} />);
    await screen.findByRole('dialog');
    await act(() => router.navigate(-1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await act(() => router.navigate(1));
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(guard).not.toHaveBeenCalled();
  });

  it('propagates a rejected hook close and permits a later retry', async () => {
    const failure = new Error('Cannot confirm changes');
    const guard = vi
      .fn<() => Promise<boolean>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(true);
    let overlay: RouteOverlayContextValue | undefined;
    function Capture(): ReactElement {
      const value = useRouteOverlay();
      useEffect(() => {
        overlay = value;
      }, [value]);
      return <span>Form</span>;
    }
    const router = createMemoryRouter(
      [
        {
          path: '/employees',
          element: <Outlet />,
          children: [
            {
              path: 'edit',
              element: (
                <RouteDialog title='Edit employee' beforeClose={guard}>
                  <Capture />
                </RouteDialog>
              ),
            },
          ],
        },
      ],
      { initialEntries: ['/employees/edit'] },
    );
    render(<RouterProvider router={router} />);
    await screen.findByRole('dialog');
    await act(async () => {
      await expect(overlay?.close()).rejects.toBe(failure);
    });
    expect(router.state.location.pathname).toBe('/employees/edit');
    expect(overlay?.isClosing).toBe(false);
    await act(async () => {
      await overlay?.close();
    });
    expect(router.state.location.pathname).toBe('/employees');
    expect(guard).toHaveBeenCalledTimes(2);
  });

  it('rejects a hook rendered outside its own provider', () => {
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
