import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { UserMenu } from '../../client/layouts/components/user-menu.tsx';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

async function openAccountMenu(): Promise<void> {
  act(() => screen.getByRole('button', { name: 'Open account menu' }).focus());
  await userEvent.keyboard('{Enter}');
}
async function signOutFromMenu() {
  await openAccountMenu();
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
}

describe('account menu sign out', () => {
  it('ends the server session and refreshes the displayed identity', async () => {
    const view = await renderAuthenticatedClient(<UserMenu />);
    await signOutFromMenu();
    await waitFor(() => expect(view.identity().session).toBeNull());
    expect(
      await (await view.session.fetch('/auth/get-session')).json(),
    ).toBeNull();
    expect(view.toasts()).toHaveLength(0);
    await openAccountMenu();
    expect(screen.queryByText(view.session.user.email)).not.toBeInTheDocument();
  });
  it('reports a rejected origin without pretending the session ended', async () => {
    const view = await renderAuthenticatedClient(<UserMenu />, {
      beforeRequest(request) {
        // Exercise the real origin guard and error resolver, not a fabricated authentication result.
        if (request.url.endsWith('/sign-out'))
          request.headers.set('origin', 'https://untrusted.example');
      },
    });
    await signOutFromMenu();
    await waitFor(() => expect(view.toasts()).toHaveLength(1));
    expect(view.toasts()[0]).toMatchObject({
      type: 'error',
      title: expect.stringContaining('This origin is not trusted.'),
    });
    expect(view.identity().session?.user.id).toBe(view.session.user.id);
    expect(
      await (await view.session.fetch('/auth/get-session')).json(),
    ).toMatchObject({ user: { id: view.session.user.id } });
    await openAccountMenu();
    expect(
      await screen.findByRole('menuitem', { name: 'Sign out' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });
  it('reports a network failure and successfully retries sign-out', async () => {
    let offline = true;
    const view = await renderAuthenticatedClient(<UserMenu />, {
      beforeRequest(request) {
        // Network loss cannot be produced by the in-process server.
        if (offline && request.url.endsWith('/sign-out'))
          throw new TypeError('Failed to fetch');
      },
    });
    await signOutFromMenu();
    await waitFor(() => expect(view.toasts()).toHaveLength(1));
    expect(view.toasts()[0]).toMatchObject({
      type: 'error',
      title: 'Could not reach the server. Check your connection and try again.',
    });
    expect(view.identity().session?.user.id).toBe(view.session.user.id);
    expect(
      await (await view.session.fetch('/auth/get-session')).json(),
    ).toMatchObject({ user: { id: view.session.user.id } });
    offline = false;
    await signOutFromMenu();
    await waitFor(() => expect(view.identity().session).toBeNull());
    expect(
      await (await view.session.fetch('/auth/get-session')).json(),
    ).toBeNull();
    expect(view.toasts()).toHaveLength(1);
  });
});
