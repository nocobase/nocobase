import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  AuthenticationProvider,
  GuestAuthentication,
  RequiredAuthentication,
} from '../../auth-provider.js';

const useService = vi.hoisted(() => vi.fn());
vi.mock('@nocobase/app-client', () => ({ useService }));

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
});
