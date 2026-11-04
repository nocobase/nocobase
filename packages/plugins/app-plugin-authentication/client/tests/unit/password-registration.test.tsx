import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePasswordRegistration } from '../../actions/use-password-registration.js';

const email = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock('../../auth-provider.js', () => ({
  useAuthentication: () => ({ client: { signUp: { email } }, refresh }),
}));
const input = {
  email: 'person@example.test',
  name: 'Person',
  username: 'person',
  password: 'test-password',
};

describe('usePasswordRegistration', () => {
  beforeEach(() => {
    email.mockReset();
    refresh.mockReset().mockResolvedValue(undefined);
  });

  it.each([
    { token: 'session-token', user: { id: 'real' } },
    { token: null, user: { id: 'synthetic' } },
  ])(
    'reports acceptance after refreshing, regardless of response shape: %j',
    async (response) => {
      email.mockResolvedValue(response);
      const refreshed = Promise.withResolvers<void>();
      refresh.mockReturnValue(refreshed.promise);
      const { result } = renderHook(() => usePasswordRegistration());
      expect(result.current.isSuccess).toBe(false);
      let submission: Promise<void>;
      await act(async () => {
        submission = result.current.submit(input);
      });
      expect(result.current.isPending).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      await act(async () => {
        refreshed.resolve();
        await submission;
      });
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isPending).toBe(false);
      expect(email).toHaveBeenCalledWith(input, { throw: true });

      email.mockRejectedValue({
        status: 422,
        code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
      });
      await act(() => result.current.submit(input));
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error?.code).toBe(
        'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
      );
    },
  );

  it('keeps acceptance false when the session refresh fails', async () => {
    email.mockResolvedValue({ token: null, user: { id: 'synthetic' } });
    refresh.mockRejectedValue(new TypeError('Network unavailable'));
    const { result } = renderHook(() => usePasswordRegistration());
    await act(() => result.current.submit(input));
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error?.code).toBe('NETWORK_ERROR');
  });
});
