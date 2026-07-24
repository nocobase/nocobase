/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useRedirect, useSignIn } from '../hooks';

const navigateMock = vi.fn();
const mockState = vi.hoisted(() => ({
  basename: undefined as string | undefined,
  matchRoutes: vi.fn(() => [{ route: { id: 'admin' } }]) as ReturnType<typeof vi.fn>,
  signIn: vi.fn().mockResolvedValue(undefined) as ReturnType<typeof vi.fn>,
  request: vi.fn().mockResolvedValue({ data: {} }) as ReturnType<typeof vi.fn>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@nocobase/client-v2', () => ({
  useApp: () => ({
    router: {
      getBasename: () => mockState.basename,
      matchRoutes: (...args: unknown[]) => mockState.matchRoutes(...args),
    },
    apiClient: {
      auth: { signIn: (...args: unknown[]) => mockState.signIn(...args) },
      request: (...args: unknown[]) => mockState.request(...args),
    },
  }),
}));

describe('plugin-auth client-v2 useRedirect', () => {
  const originalLocation = globalThis.window.location;

  beforeEach(() => {
    navigateMock.mockReset();
    mockState.basename = undefined;
    mockState.matchRoutes = vi.fn(() => [{ route: { id: 'admin' } }]);
  });

  afterEach(() => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  function wrap(initialEntries: string[]) {
    return ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
  }

  it('should navigate to default next when no redirect param is present', () => {
    mockState.basename = '/nocobase/v2';
    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('should strip v2 basename from redirect param and navigate relative', () => {
    // Aligns with v1: an in-app redirect target uses react-router navigate (virtual),
    // not window.location.replace. The basename prefix carried on the redirect query
    // (so the server can echo a root-relative path) is stripped before handing off
    // to react-router, which will prepend it again on its own.
    mockState.basename = '/nocobase/v2';
    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin?redirect=%2Fnocobase%2Fv2%2Fadmin%2Fxyz']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/admin/xyz', { replace: true });
  });

  it('should pass redirect param through as-is when not prefixed with basename', () => {
    // Server's 2FA middleware returns a bare path like `/admin` in its redirect
    // template; react-router navigate prepends the basename automatically.
    mockState.basename = '/nocobase/v2';
    const { result } = renderHook(() => useRedirect('/fallback'), {
      wrapper: wrap(['/signin?redirect=%2Fadmin']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('should treat exact basename match as root', () => {
    mockState.basename = '/nocobase/v2';
    const { result } = renderHook(() => useRedirect('/fallback'), {
      wrapper: wrap(['/signin?redirect=%2Fnocobase%2Fv2']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should accept relative target when basename is unset', () => {
    mockState.basename = undefined;
    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin']),
    });
    result.current();

    expect(navigateMock).toHaveBeenCalledWith('/admin', { replace: true });
  });

  it('should use a document redirect when the target only matches the SPA not-found route', () => {
    const replace = vi.fn();
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        replace,
      },
    });
    mockState.basename = '/v';
    mockState.matchRoutes = vi.fn(() => [{ route: { id: 'not-found', path: '*' } }]);
    const { result } = renderHook(() => useRedirect('/admin'), {
      wrapper: wrap(['/signin?redirect=%2Fv%2Fcustomer%2Forders%2F1%3Fstatus%3Dopen']),
    });

    result.current();

    expect(mockState.matchRoutes).toHaveBeenCalledWith('/v/customer/orders/1?status=open');
    expect(replace).toHaveBeenCalledWith('/v/customer/orders/1?status=open');
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe('plugin-auth client-v2 useSignIn', () => {
  beforeEach(() => {
    mockState.basename = '/nocobase/v2';
    mockState.matchRoutes = vi.fn(() => [{ route: { id: 'admin' } }]);
    mockState.signIn = vi.fn().mockResolvedValue(undefined);
    mockState.request = vi.fn().mockResolvedValue({ data: {} });
    navigateMock.mockReset();
  });

  it('should call signIn then yield to a /auth:check request before redirecting', async () => {
    // Mirrors v1's `await refreshAsync()` after sign-in: the actual user data isn't
    // consumed, but awaiting a real network round-trip gives the browser time to
    // commit any queued `window.location.href` from response interceptors (e.g. the
    // 2FA plugin's `code:302` handler). Without it, the synchronous `redirect()`
    // virtual navigate would let the wrong page flash before the full reload.
    const { result } = renderHook(() => useSignIn('basic'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/signin']}>{children}</MemoryRouter>,
    });

    await result.current.run({ account: 'admin', password: 'admin' });

    expect(mockState.signIn).toHaveBeenCalledWith({ account: 'admin', password: 'admin' }, 'basic');
    expect(mockState.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/auth:check', skipAuth: true, skipNotify: true }),
    );
    // Order matters: signIn → request → redirect/navigate.
    expect(mockState.signIn.mock.invocationCallOrder[0]).toBeLessThan(mockState.request.mock.invocationCallOrder[0]);
    expect(mockState.request.mock.invocationCallOrder[0]).toBeLessThan(navigateMock.mock.invocationCallOrder[0]);
  });

  it('should swallow /auth:check rejection so redirect still runs', async () => {
    // /auth:check may legitimately reject (e.g. server returns 401 mid-2FA flow).
    // The redirect must still proceed — the catch keeps the chain alive.
    mockState.request = vi.fn().mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useSignIn('basic'), {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/signin']}>{children}</MemoryRouter>,
    });

    await expect(result.current.run({ account: 'admin', password: 'admin' })).resolves.toBeUndefined();
    expect(mockState.request).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalled();
  });
});
