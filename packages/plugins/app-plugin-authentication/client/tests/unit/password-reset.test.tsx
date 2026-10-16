import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePasswordReset } from '../../actions/use-password-reset.js';

const resetPassword = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
const sessionState = vi.hoisted(() => ({ signedIn: false }));
vi.mock('../../auth-provider.js', () => ({
  useAuthentication: () => ({
    client: { resetPassword },
    refresh,
    session: sessionState.signedIn
      ? { user: { id: 'synthetic' }, session: {} }
      : null,
  }),
}));
vi.mock('../../actions/errors.js', () => ({
  useAuthenticationErrorResolver: () => () => ({
    code: 'INVALID_TOKEN',
    message: 'Invalid reset link.',
  }),
}));

beforeEach(() => {
  resetPassword.mockReset();
  refresh.mockReset().mockResolvedValue(undefined);
  sessionState.signedIn = false;
});

it('keeps a guest reset success visible without remounting the guest route', async () => {
  resetPassword.mockResolvedValue({});
  const { result } = renderHook(() => usePasswordReset());
  await act(() =>
    result.current.submit({
      password: 'replacement-password',
      token: 'synthetic-token',
    }),
  );
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.error).toBeUndefined();
  expect(refresh).not.toHaveBeenCalled();
});

it('refreshes an existing session without turning a successful reset into a refresh error', async () => {
  sessionState.signedIn = true;
  resetPassword.mockResolvedValue({});
  refresh.mockRejectedValue(new Error('Synthetic refresh failure'));
  const { result } = renderHook(() => usePasswordReset());
  await act(() =>
    result.current.submit({
      password: 'replacement-password',
      token: 'synthetic-token',
    }),
  );
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.error).toBeUndefined();
  expect(refresh).toHaveBeenCalledOnce();
});

it('reports an expired or consumed token and clears success', async () => {
  resetPassword.mockRejectedValue(new Error('Synthetic failure'));
  const { result } = renderHook(() => usePasswordReset());
  await act(() =>
    result.current.submit({
      password: 'replacement-password',
      token: 'synthetic-token',
    }),
  );
  expect(result.current.isSuccess).toBe(false);
  expect(result.current.error?.code).toBe('INVALID_TOKEN');
});
