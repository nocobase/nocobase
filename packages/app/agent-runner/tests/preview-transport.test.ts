import { expect, it, vi } from 'vitest';
import { PreviewTransport } from '../src/agent/preview-transport.ts';
import type { ApiClient } from '../src/lib/http.ts';
const delta = {
  type: 'text' as const,
  content: 'progress',
  meta: { output: { blockId: 'a', phase: 'delta' as const } },
};
it('drops previews after a transport failure without failing canonical delivery', async () => {
  const request = vi.fn(async () => {
    throw new Error('offline');
  });
  const transport = new PreviewTransport(
    { request } as unknown as ApiClient,
    'run',
  );
  transport.send(delta);
  await expect(transport.drain()).resolves.toBeUndefined();
  transport.send(delta);
  await transport.drain();
  expect(request).toHaveBeenCalledTimes(1);
});
it('bounds queued previews under transport backpressure', async () => {
  const request = vi.fn(async () => {});
  const transport = new PreviewTransport(
    { request } as unknown as ApiClient,
    'run',
  );
  for (let i = 0; i < 1000; i++) transport.send(delta);
  await transport.drain();
  expect(request.mock.calls.length).toBeLessThanOrEqual(64);
});
