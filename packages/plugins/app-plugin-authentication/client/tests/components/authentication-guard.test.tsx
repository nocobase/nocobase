import { act, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useSearchParams,
} from 'react-router';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  AuthenticationProvider,
  GuestAuthentication,
  RequiredAuthentication,
  useAuthentication,
} from '../../auth-provider.js';

const useService = vi.hoisted(() => vi.fn());
const services = vi.hoisted(() => ({
  has: vi.fn(() => false),
  resolveIfCreated: vi.fn(),
}));
vi.mock('@nocobase/app-client', () => ({
  useService,
  useClientApplication: () => ({ services }),
  realtimeClientToken: 'realtime',
}));

function Device() {
  const [params] = useSearchParams();
  return <div>Device {params.get('user_code')}</div>;
}

function Location() {
  const { pathname, search, hash } = useLocation();
  return <output aria-label='Location'>{pathname + search + hash}</output>;
}

describe('AuthenticationGuard', () => {
  it.each([
    {
      session: null,
      from: '/private',
      expected: 'Login',
      location: '/login?redirect=%2Fprivate',
    },
    { session: null, from: '/', expected: 'Login', location: '/login' },
    {
      session: null,
      from: '/private?x=1#c',
      expected: 'Login',
      location: '/login?redirect=%2Fprivate%3Fx%3D1%23c',
    },
    {
      session: null,
      from: '/private?x=1#c',
      expected: 'Login',
      location: '/login?redirect=%2Fprivate%3Fx%3D1%23c',
      basename: '/main',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login?redirect=%2Fprivate%3Fx%3D1%23c',
      expected: 'Private',
      location: '/private?x=1#c',
      basename: '/main',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login',
      expected: 'Home',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login?redirect=%2Fdevice%3Fuser_code%3DWDJB-MJHT',
      expected: 'Device WDJB-MJHT',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login?redirect=%2F%2Fevil.example.com',
      expected: 'Home',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login?redirect=https%3A%2F%2Fevil.example',
      expected: 'Home',
    },
    {
      session: { user: { id: 'user' }, session: { id: 'session' } },
      from: '/login?redirect=%2F%5Cevil.example',
      expected: 'Home',
    },
  ])(
    'redirects from $from according to the session',
    async ({ session, from, expected, location, basename = '' }) => {
      useService.mockReturnValue({
        getSession: vi.fn().mockResolvedValue({ data: session }),
      });
      render(
        <MemoryRouter
          basename={basename || '/'}
          initialEntries={[basename + from]}
        >
          <AuthenticationProvider>
            <Location />
            <Routes>
              <Route
                path='/private'
                element={
                  <RequiredAuthentication>Private</RequiredAuthentication>
                }
              />
              <Route
                path='/login'
                element={<GuestAuthentication>Login</GuestAuthentication>}
              />
              <Route
                path='/'
                element={<RequiredAuthentication>Home</RequiredAuthentication>}
              />
              <Route path='/device' element={<Device />} />
            </Routes>
          </AuthenticationProvider>
        </MemoryRouter>,
      );
      expect(await screen.findByText(expected)).toBeInTheDocument();
      if (location)
        expect(screen.getByLabelText('Location')).toHaveTextContent(location);
    },
  );

  it('does not create a realtime connection without active subscriptions', async () => {
    const reconnect = vi.fn();
    let session: unknown = null;
    const getSession = vi.fn(async () => ({ data: session }));
    useService.mockReturnValue({ getSession });
    services.has.mockReturnValue(true);
    services.resolveIfCreated.mockReturnValue({ reconnect, active: false });
    const captured: { refresh?: () => Promise<void> } = {};
    function Capture() {
      const { refresh } = useAuthentication();
      useEffect(() => {
        captured.refresh = refresh;
      });
      return <div>Ready</div>;
    }
    const refresh = () => captured.refresh!();
    render(
      <MemoryRouter>
        <AuthenticationProvider>
          <Capture />
        </AuthenticationProvider>
      </MemoryRouter>,
    );
    await screen.findByText('Ready');
    await act(async () => refresh());
    expect(reconnect).not.toHaveBeenCalled();
    session = { user: { id: 'user' }, session: { id: 'session' } };
    await act(async () => refresh());
    expect(reconnect).not.toHaveBeenCalled();
    await act(async () => refresh());
    expect(reconnect).not.toHaveBeenCalled();
    // Without realtime, or before anything connected, there is nothing to connect again.
    services.has.mockReturnValue(false);
    session = null;
    await act(async () => refresh());
    expect(reconnect).not.toHaveBeenCalled();
  });
});
