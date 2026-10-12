import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { usePasswordReset } from '../../actions/use-password-reset.js';
const resetPassword = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock('../../auth-provider.js', () => ({
  useAuthentication: () => ({ client: { resetPassword }, refresh }),
}));
vi.mock('../../actions/errors.js', () => ({
  useAuthenticationErrorResolver: () => () => ({ message: 'Reset failed' }),
}));
it('keeps reset success without refreshing the guest session and prevents resubmission', async () => {
  resetPassword.mockResolvedValue({ status: true });
  refresh.mockRejectedValue(new Error('Session refresh unavailable'));
  const { result } = renderHook(() => usePasswordReset());
  await act(() =>
    result.current.submit({ token: 'test-token', password: 'new-password' }),
  );
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.error).toBeUndefined();
  await act(() =>
    result.current.submit({ token: 'test-token', password: 'new-password' }),
  );
  expect(resetPassword).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
});
