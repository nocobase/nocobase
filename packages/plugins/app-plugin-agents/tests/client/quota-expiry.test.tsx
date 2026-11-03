// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { clientMocks } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());

const { useQuotaExpiry } =
  await import('../../client/hooks/use-quota-expiry.js');
const { agentsQueryClient } = await import('../../client/query.js');
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('refreshes the shared cache once when several visible pickers observe the same reset', async () => {
  vi.useFakeTimers();
  const invalidate = vi
    .spyOn(agentsQueryClient(), 'invalidateQueries')
    .mockResolvedValue();
  const items = [
    { quota: [{ resetsAt: new Date(Date.now() + 5000).toISOString() }] },
  ];
  renderHook(() => {
    useQuotaExpiry(items);
    useQuotaExpiry(items);
  });
  await act(() => vi.advanceTimersByTimeAsync(5100));
  expect(invalidate).toHaveBeenCalledTimes(1);
});

it('does not schedule reads for unknown reset times', async () => {
  vi.useFakeTimers();
  const invalidate = vi
    .spyOn(agentsQueryClient(), 'invalidateQueries')
    .mockResolvedValue();
  renderHook(() => useQuotaExpiry([{ quota: [{ resetsAt: null }] }]));
  await act(() => vi.advanceTimersByTimeAsync(86400000));
  expect(invalidate).not.toHaveBeenCalled();
});
