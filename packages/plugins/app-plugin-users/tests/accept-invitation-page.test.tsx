// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  // The session as a tiny store, so signing in re-renders the page as the real provider does.
  let session: null | { user: { name: string; email: string } } = null;
  const listeners = new Set<() => void>();
  // The interface language as a tiny store too, so a switch re-renders the page.
  let locale = 'en-US';
  const localeListeners = new Set<() => void>();
  return {
    request: vi.fn(),
    locale: {
      get: () => locale,
      set: (value: string) => {
        locale = value;
        for (const listener of localeListeners) listener();
      },
      subscribe: (listener: () => void) => {
        localeListeners.add(listener);
        return () => localeListeners.delete(listener);
      },
    },
    preferenceSet: vi.fn(),
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

vi.mock('@nocobase/app-client', async () => {
  const { createContext } =
    await vi.importActual<typeof import('react')>('react');
  return {
    ApiClientError: class ApiClientError extends Error {},
    AppLocalePreferenceContext: createContext(undefined),
    // A new client per render, as signing in replaces it.
    useApiClient: () => ({ request: mocks.request }),
    useToaster: () => ({ show: vi.fn(), close: vi.fn() }),
  };
});

vi.mock('@nocobase/i18n/client', async () => {
  const { useSyncExternalStore } =
    await vi.importActual<typeof import('react')>('react');
  const useCurrent = () =>
    useSyncExternalStore(mocks.locale.subscribe, mocks.locale.get);
  return {
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: { language: useCurrent() },
    }),
    useLocale: () => ({
      locale: useCurrent(),
      locales: [
        { locale: 'en-US', label: 'English' },
        { locale: 'ja-JP', label: '日本語' },
        { locale: 'zh-CN', label: '简体中文' },
      ],
      setLocale: (value: string) => {
        mocks.locale.set(value);
        return Promise.resolve();
      },
    }),
  };
});

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

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  mocks.session.set(null);
  mocks.request.mockReset();
  mocks.preferenceSet.mockReset();
  act(() => mocks.locale.set('en-US'));
});

function lookupAndAccept(locale: string | null) {
  mocks.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('/lookup')
        ? {
            email: 'kei@example.com',
            inviterName: 'Ann',
            summary: [],
            expiresAt: '2099-01-01T00:00:00Z',
            locale,
          }
        : { email: 'kei@example.com', existingAccount: false },
    }),
  );
}

it("opens in the invitation's language and keeps the language on screen as the new account's", async () => {
  const { AppLocalePreferenceContext } = await import('@nocobase/app-client');
  mocks.preferenceSet.mockImplementation((value: string) => {
    mocks.locale.set(value);
    return Promise.resolve({
      locale: value,
      requestedLocale: value,
      fallback: false,
    });
  });
  lookupAndAccept('ja-JP');
  render(
    <AppLocalePreferenceContext.Provider
      value={{
        identity: null,
        ready: true,
        value: undefined,
        set: mocks.preferenceSet,
      }}
    >
      <MemoryRouter initialEntries={['/invite/token-ja']}>
        <Routes>
          <Route path='/invite/:token' element={<AcceptInvitationPage />} />
          <Route path='/' element={<div>Joined</div>} />
        </Routes>
      </MemoryRouter>
    </AppLocalePreferenceContext.Provider>,
  );
  const select = await screen.findByRole('combobox', {
    name: 'accept.language',
  });
  await vi.waitFor(() =>
    expect((select as HTMLSelectElement).value).toBe('ja-JP'),
  );
  expect(mocks.preferenceSet).toHaveBeenCalledExactlyOnceWith('ja-JP');
  // A choice on the page is kept and not switched back.
  fireEvent.change(select, { target: { value: 'zh-CN' } });
  await vi.waitFor(() =>
    expect((select as HTMLSelectElement).value).toBe('zh-CN'),
  );
  expect(mocks.preferenceSet).toHaveBeenCalledTimes(2);
  fireEvent.change(screen.getByLabelText('accept.name'), {
    target: { value: 'Kei' },
  });
  fireEvent.change(screen.getByLabelText('accept.password'), {
    target: { value: 'kei-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
  await screen.findByText('Joined');
  expect(mocks.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'users/invitations/accept',
      json: expect.objectContaining({ token: 'token-ja', locale: 'zh-CN' }),
    }),
  );
  expect(mocks.preferenceSet).toHaveBeenCalledTimes(2);
});

it('keeps a signed-in person in their own language', async () => {
  mocks.session.set({ user: { name: 'Kei', email: 'kei@example.com' } });
  lookupAndAccept('ja-JP');
  render(
    <MemoryRouter initialEntries={['/invite/token-ja']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'accept.join' });
  expect(mocks.locale.get()).toBe('en-US');
});

it('requires the wrong signed-in account to sign out without consuming the invitation', async () => {
  mocks.session.set({ user: { name: 'Other', email: 'other@example.com' } });
  mocks.request.mockResolvedValue({
    data: {
      email: 'nia@example.com',
      inviterName: 'Ann',
      summary: [],
      expiresAt: '2099-01-01T00:00:00Z',
    },
  });
  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'accept.signOut' });
  expect(screen.queryByRole('button', { name: 'accept.join' })).toBeNull();
  expect(
    mocks.request.mock.calls.every(([request]) =>
      request.path.endsWith('/lookup'),
    ),
  ).toBe(true);
});

it('sends an existing account to sign-in with a return path to the pending invitation', async () => {
  const { ApiClientError } = await import('@nocobase/app-client');
  const error = Object.assign(
    new ApiClientError('Sign in', {
      status: 400,
      method: 'POST',
      url: '/api/users/invitations/accept',
      reason: 'INVITATION_SIGN_IN_REQUIRED',
    }),
    { reason: 'INVITATION_SIGN_IN_REQUIRED' },
  );
  mocks.request.mockImplementation(({ path }: { path: string }) =>
    path.endsWith('/lookup')
      ? Promise.resolve({
          data: {
            email: 'nia@example.com',
            inviterName: 'Ann',
            summary: [],
            expiresAt: '2099-01-01T00:00:00Z',
          },
        })
      : Promise.reject(error),
  );
  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(await screen.findByLabelText('accept.name'), {
    target: { value: 'Nia' },
  });
  fireEvent.change(screen.getByLabelText('accept.password'), {
    target: { value: 'secret-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
  await screen.findByText('accept.existingAccount');
  const link = await screen.findByRole('button', { name: 'accept.goToLogin' });
  expect(link.getAttribute('href')).toBe('/login?redirect=%2Finvite%2Ftoken-1');
  expect(link.className).toContain('bg-primary');
  expect(screen.queryByText('accept.alreadyHaveAccount')).toBeNull();
});

it('shows sign-in as a secondary link after the registration action and keeps its return path', async () => {
  mocks.request.mockResolvedValue({
    data: {
      email: 'nia@example.com',
      inviterName: 'Ann',
      summary: [],
      expiresAt: '2099-01-01T00:00:00Z',
    },
  });
  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
  const link = await screen.findByRole('button', {
    name: 'accept.alreadyHaveAccount',
  });
  const submit = screen.getByRole('button', { name: 'accept.submit' });
  expect(
    submit.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(link.getAttribute('href')).toBe('/login?redirect=%2Finvite%2Ftoken-1');
  expect(link.className).toContain('hover:underline');
  expect(link.className).not.toContain('bg-primary');
  expect(submit.className).toContain('bg-primary');
  expect(screen.queryByText('accept.goToLogin')).toBeNull();
});

it('allows registration from an invitation link without requesting email', async () => {
  mocks.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data: path.endsWith('/lookup')
        ? {
            email: 'manual@example.com',
            inviterName: 'Admin',
            summary: [],
            expiresAt: '2099-01-01T00:00:00.000Z',
          }
        : { email: 'manual@example.com', existingAccount: false },
    }),
  );
  render(
    <MemoryRouter initialEntries={['/invite/manual-token']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
        <Route path='/' element={<div>Joined</div>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(await screen.findByLabelText('accept.name'), {
    target: { value: 'Recipient' },
  });
  fireEvent.change(screen.getByLabelText('accept.password'), {
    target: { value: 'manual-password' },
  });
  expect(
    screen.queryByRole('button', { name: 'accept.verifyEmail' }),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
  await screen.findByText('Joined');
  expect(mocks.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'users/invitations/accept',
      json: expect.objectContaining({ token: 'manual-token' }),
    }),
  );
});

it.each(['', '  nia.admin  '])(
  'submits an optional username: %s',
  async (username) => {
    mocks.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({
        data: path.endsWith('/lookup')
          ? {
              email: 'nia@example.com',
              inviterName: 'Ann',
              summary: [],
              expiresAt: '2099-01-01T00:00:00Z',
            }
          : { email: 'nia@example.com', existingAccount: false },
      }),
    );
    render(
      <MemoryRouter initialEntries={['/invite/token-1']}>
        <Routes>
          <Route path='/invite/:token' element={<AcceptInvitationPage />} />
          <Route path='/' element={<div>Joined</div>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(await screen.findByLabelText('accept.name'), {
      target: { value: 'Nia' },
    });
    fireEvent.change(screen.getByLabelText('accept.username'), {
      target: { value: username },
    });
    fireEvent.change(screen.getByLabelText('accept.password'), {
      target: { value: 'secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
    await screen.findByText('Joined');
    const input = mocks.request.mock.calls.find(([request]) =>
      request.path.endsWith('/accept'),
    )?.[0].json;
    expect(input).toEqual({
      token: 'token-1',
      name: 'Nia',
      password: 'secret-password',
      ...(username ? { username: 'nia.admin' } : {}),
      locale: 'en-US',
    });
  },
);

it('shows identity conflicts under username and keeps every value for retry', async () => {
  const { ApiClientError } = await import('@nocobase/app-client');
  const conflict = Object.assign(
    new ApiClientError('Conflict', {
      status: 409,
      method: 'POST',
      url: '/api/users/invitations/accept',
      reason: 'USER_IDENTITY_CONFLICT',
    }),
    { reason: 'USER_IDENTITY_CONFLICT' },
  );
  mocks.request.mockImplementation(({ path }: { path: string }) =>
    path.endsWith('/lookup')
      ? Promise.resolve({
          data: {
            email: 'nia@example.com',
            inviterName: 'Ann',
            summary: [],
            expiresAt: '2099-01-01T00:00:00Z',
          },
        })
      : Promise.reject(conflict),
  );
  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
        <Route path='/' element={<div>Joined</div>} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.change(await screen.findByLabelText('accept.name'), {
    target: { value: 'Nia' },
  });
  fireEvent.change(screen.getByLabelText('accept.username'), {
    target: { value: 'taken' },
  });
  fireEvent.change(screen.getByLabelText('accept.password'), {
    target: { value: 'secret-password' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
  const error = await screen.findByRole('alert');
  expect(error.textContent).toBe('accept.errors.usernameConflict');
  expect(
    screen.getByLabelText('accept.username').getAttribute('aria-describedby'),
  ).toContain(error.id);
  expect((screen.getByLabelText('accept.name') as HTMLInputElement).value).toBe(
    'Nia',
  );
  expect(
    (screen.getByLabelText('accept.username') as HTMLInputElement).value,
  ).toBe('taken');
  expect(
    (screen.getByLabelText('accept.password') as HTMLInputElement).value,
  ).toBe('secret-password');
  fireEvent.change(screen.getByLabelText('accept.username'), {
    target: { value: 'available' },
  });
  expect(screen.queryByRole('alert')).toBeNull();
  mocks.request.mockResolvedValue({
    data: { email: 'nia@example.com', existingAccount: false },
  });
  fireEvent.click(screen.getByRole('button', { name: 'accept.submit' }));
  await screen.findByText('Joined');
  expect(mocks.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      json: expect.objectContaining({
        username: 'available',
        password: 'secret-password',
        name: 'Nia',
      }),
    }),
  );
});

it('hides account fields for the signed-in invited account', async () => {
  mocks.session.set({ user: { name: 'Nia', email: 'nia@example.com' } });
  mocks.request.mockResolvedValue({
    data: {
      email: 'nia@example.com',
      inviterName: 'Ann',
      summary: [],
      expiresAt: '2099-01-01T00:00:00Z',
    },
  });
  render(
    <MemoryRouter initialEntries={['/invite/token-1']}>
      <Routes>
        <Route path='/invite/:token' element={<AcceptInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole('button', { name: 'accept.join' });
  expect(screen.queryByLabelText('accept.username')).toBeNull();
  expect(screen.queryByLabelText('accept.name')).toBeNull();
  expect(screen.queryByLabelText('accept.password')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'accept.join' }));
  await act(async () => {});
  expect(mocks.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      json: { token: 'token-1', name: 'Nia', password: '' },
    }),
  );
});
