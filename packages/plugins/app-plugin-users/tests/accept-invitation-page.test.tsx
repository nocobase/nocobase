// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useSyncExternalStore, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // The session as a tiny store, so signing in re-renders the page as the real provider does.
  let session: null | { user: { name: string; email: string } } = null;
  const listeners = new Set<() => void>();
  return {
    request: vi.fn(),
    session: {
      get: () => session,
      set: (value: typeof session) => {
        session = value;
        for (const listener of listeners) listener();
      },
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
});

vi.mock('@nocobase/app-client', () => ({
  ApiClientError: class ApiClientError extends Error {},
  // A new client per render, as signing in replaces it.
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: vi.fn(), close: vi.fn() }),
}));

vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@nocobase/app-plugin-authentication/client', async () => {
  const { useSyncExternalStore } =
    await vi.importActual<typeof import('react')>('react');
  return {
    useAuthentication: () => ({
      session: useSyncExternalStore(mocks.session.subscribe, mocks.session.get),
      client: { signOut: vi.fn() },
      refresh: vi.fn(),
    }),
  };
});

vi.mock('@nocobase/app-plugin-authentication/client/actions', () => ({
  usePasswordLogin: () => ({
    isPending: false,
    submit: () => {
      act(() => mocks.session.set({ user: { name: 'Nia', email: 'n' } }));
      return Promise.resolve();
    },
  }),
}));

const { default: AcceptInvitationPage } =
  await import('../client/pages/accept-invitation-page.js');

/** Remounts the page when the session changes, as the application does while a new session loads. */
function RemountOnSignIn(): ReactElement {
  const session = useSyncExternalStore(
    mocks.session.subscribe,
    mocks.session.get,
  );
  return <AcceptInvitationPage key={session ? 'signed-in' : 'signed-out'} />;
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

it('lets the new member in instead of reporting the invitation accepted', async () => {
  let accepted = false;
  mocks.request.mockImplementation(({ path }: { path: string }) => {
    if (path.endsWith('/lookup'))
      return accepted
        ? Promise.reject(
            Object.assign(new Error('accepted'), {
              reason: 'INVITATION_ACCEPTED',
            }),
          )
        : Promise.resolve({
            data: {
              email: 'nia@example.com',
              inviterName: 'Ann',
              summary: ['Apollo'],
              expiresAt: '2099-01-01T00:00:00.000Z',
            },
          });
    accepted = true;
    return Promise.resolve({
      data: { email: 'nia@example.com', existingAccount: false },
    });
  });

  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<RemountOnSignIn />} />
        <Route path='/' element={<p>home</p>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.change(await screen.findByLabelText('accept.name'), {
    target: { value: 'Nia' },
  });
  fireEvent.change(screen.getByLabelText('accept.password'), {
    target: { value: 'secret-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /accept\.submit/u }));

  await waitFor(() => expect(screen.getByText('home')).toBeTruthy());
  const lookups = mocks.request.mock.calls.filter(([options]) =>
    (options as { path: string }).path.endsWith('/lookup'),
  );
  expect(lookups).toHaveLength(1);
});
