import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiState = vi.hoisted(() => ({
  request: vi.fn(),
}));
const currentApi = vi.hoisted(() => ({ current: apiState as unknown }));

vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => currentApi.current,
}));

describe('usePasswordResetCapability', () => {
  beforeEach(() => {
    vi.resetModules();
    apiState.request.mockReset();
    currentApi.current = apiState;
  });

  it('loads the capability from the host API', async () => {
    apiState.request.mockResolvedValue({
      data: { passwordResetAvailable: true },
    });
    const { usePasswordResetCapability } =
      await import('../password-reset-capability.js');
    const { result } = renderHook(() => usePasswordResetCapability());

    expect(result.current.isPending).toBe(true);
    await waitFor(() =>
      expect(result.current.data).toEqual({ passwordResetAvailable: true }),
    );
    expect(apiState.request).toHaveBeenCalledWith({
      path: 'authentication/capabilities',
    });
  });

  it('reports request failures and invalid responses, then recovers on refetch', async () => {
    apiState.request
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { passwordResetAvailable: false } });
    const { usePasswordResetCapability } =
      await import('../password-reset-capability.js');
    const { result } = renderHook(() => usePasswordResetCapability());

    await waitFor(() => expect(result.current.isError).toBe(true));
    await act(async () => result.current.refetch());
    expect(result.current.isError).toBe(true);
    await act(async () => result.current.refetch());
    expect(result.current).toMatchObject({
      data: { passwordResetAvailable: false },
      isPending: false,
      isError: false,
    });
  });

  it('keeps each host application’s cache and in-flight request separate', async () => {
    const apiA = { request: vi.fn() };
    const apiB = { request: vi.fn() };
    apiA.request.mockResolvedValue({ data: { passwordResetAvailable: true } });
    apiB.request.mockResolvedValue({
      data: { passwordResetAvailable: false },
    });
    const { usePasswordResetCapability } =
      await import('../password-reset-capability.js');

    currentApi.current = apiA;
    const forA = renderHook(() => usePasswordResetCapability());
    await waitFor(() =>
      expect(forA.result.current.data).toEqual({
        passwordResetAvailable: true,
      }),
    );

    currentApi.current = apiB;
    const forB = renderHook(() => usePasswordResetCapability());
    await waitFor(() =>
      expect(forB.result.current.data).toEqual({
        passwordResetAvailable: false,
      }),
    );

    // Each host's own capability, not the other host's cached value.
    expect(forA.result.current.data).toEqual({ passwordResetAvailable: true });
    expect(apiA.request).toHaveBeenCalledTimes(1);
    expect(apiB.request).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight request between callers of the same host', async () => {
    const api = { request: vi.fn() };
    let resolveRequest!: (value: {
      data: { passwordResetAvailable: boolean };
    }) => void;
    api.request.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { usePasswordResetCapability } =
      await import('../password-reset-capability.js');
    currentApi.current = api;

    const first = renderHook(() => usePasswordResetCapability());
    const second = renderHook(() => usePasswordResetCapability());
    resolveRequest({ data: { passwordResetAvailable: true } });

    await waitFor(() =>
      expect(first.result.current.data).toEqual({
        passwordResetAvailable: true,
      }),
    );
    await waitFor(() =>
      expect(second.result.current.data).toEqual({
        passwordResetAvailable: true,
      }),
    );
    expect(api.request).toHaveBeenCalledTimes(1);
  });
});
