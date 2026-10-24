import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDemoData } from '../../client/demo-data.js';

const api = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({ useApiClient: () => api }));
afterEach(() => vi.resetAllMocks());

it('keeps the newest response when a previous refresh finishes late', async () => {
  const pending: ((value: unknown) => void)[] = [];
  api.request.mockImplementation(
    () => new Promise((resolve) => pending.push(resolve)),
  );
  const { result } = renderHook(() => useDemoData({ enabled: false }));
  let first: Promise<void>;
  let second: Promise<void>;
  act(() => {
    first = result.current.refresh();
    second = result.current.refresh();
  });
  await act(async () => {
    pending[1]!({ data: { state: 'ready', present: true } });
    await second!;
  });
  await act(async () => {
    pending[0]!({ data: { state: 'importing', present: false } });
    await first!;
  });
  expect(result.current.status).toMatchObject({
    state: 'ready',
    present: true,
  });
});

it('discards the previous account data when access is revoked', async () => {
  api.request.mockResolvedValueOnce({
    data: { state: 'ready', accounts: [{ username: 'demo' }] },
  });
  const { result } = renderHook(() => useDemoData({ enabled: false }));
  await act(() => result.current.refresh());
  expect(result.current.status?.accounts).toHaveLength(1);
  api.request.mockRejectedValueOnce({
    status: 403,
    reason: 'PERMISSION_DENIED',
  });
  await act(() => result.current.refresh());
  expect(result.current.status).toBeNull();
  expect(result.current.error).toMatchObject({ status: 403 });
});
