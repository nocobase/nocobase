import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router';
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

describe('AuthenticationGuard', () => {
  it.each([
    { session: null, from: '/private', expected: 'Login' },
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
  ])(
    'redirects from $from according to the session',
    async ({ session, from, expected }) => {
      useService.mockReturnValue({
        getSession: vi.fn().mockResolvedValue({ data: session }),
      });
      render(
        <MemoryRouter initialEntries={[from]}>
          <AuthenticationProvider>
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
              <Route path='/' element={<div>Home</div>} />
              <Route path='/device' element={<Device />} />
            </Routes>
          </AuthenticationProvider>
        </MemoryRouter>,
      );
      expect(await screen.findByText(expected)).toBeInTheDocument();
    },
  );

  it('connects realtime again once the signed-in person changes', async () => {
    const reconnect = vi.fn();
    let session: unknown = null;
    const getSession = vi.fn(async () => ({ data: session }));
    useService.mockReturnValue({ getSession });
    services.has.mockReturnValue(true);
    services.resolveIfCreated.mockReturnValue({ reconnect });
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
    expect(reconnect).toHaveBeenCalledOnce();
    await act(async () => refresh());
    expect(reconnect).toHaveBeenCalledOnce();
    // Without realtime, or before anything connected, there is nothing to connect again.
    services.has.mockReturnValue(false);
    session = null;
    await act(async () => refresh());
    expect(reconnect).toHaveBeenCalledOnce();
  });
});
