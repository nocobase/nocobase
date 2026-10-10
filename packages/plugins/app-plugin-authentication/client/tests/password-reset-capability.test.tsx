import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiState = vi.hoisted(() => ({
  request: vi.fn(),
}));

vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => apiState,
}));

describe('usePasswordResetCapability', () => {
  beforeEach(() => {
    vi.resetModules();
    apiState.request.mockReset();
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
});
