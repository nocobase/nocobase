import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePasswordLogin } from '../../actions/use-password-login.js';

const email = vi.hoisted(() => vi.fn());
const username = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock('../../auth-provider.js', () => ({
  useAuthentication: () => ({
    client: { signIn: { email, username } },
    refresh,
  }),
}));

describe('usePasswordLogin', () => {
  it.each([
    { identifier: 'alice@example.com', method: 'email' },
    { identifier: 'alice', method: 'username' },
  ])(
    'uses $method sign-in for $identifier and refreshes the session',
    async ({ identifier, method }) => {
      email.mockReset().mockResolvedValue({});
      username.mockReset().mockResolvedValue({});
      refresh.mockReset().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePasswordLogin());
      await act(async () =>
        result.current.submit({ identifier, password: 'password' }),
      );
      const selected = method === 'email' ? email : username;
      const other = method === 'email' ? username : email;
      expect(selected).toHaveBeenCalledExactlyOnceWith(
        { [method]: identifier, password: 'password' },
        { throw: true },
      );
      expect(other).not.toHaveBeenCalled();
      expect(refresh).toHaveBeenCalledOnce();
      expect(result.current.error).toBeUndefined();
    },
  );

  it('exposes a failed sign-in without refreshing the session', async () => {
    email.mockReset().mockRejectedValue(
      Object.assign(new Error('Unauthorized'), {
        status: 401,
        error: {
          code: 'INVALID_EMAIL_OR_PASSWORD',
          message: 'Invalid email or password',
        },
      }),
    );
    username.mockReset();
    refresh.mockReset();
    const { result } = renderHook(() => usePasswordLogin());
    await act(async () =>
      result.current.submit({
        identifier: 'alice@example.com',
        password: 'wrong',
      }),
    );
    expect(result.current.error).toEqual({
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Incorrect email or password.',
    });
    expect(result.current.isPending).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });
});
