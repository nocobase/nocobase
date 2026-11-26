import { expect, it, vi } from 'vitest';

import { readAuditBody } from '../src/redact.js';

it('stops waiting for a slow response snapshot and leaves the original stream intact', async () => {
  let source: ReadableStreamDefaultController<Uint8Array> | undefined;
  const response = new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        source = controller;
      },
    }),
    { headers: { 'content-type': 'application/json' } },
  );
  vi.useFakeTimers();
  try {
    const snapshot = readAuditBody(response);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(snapshot).resolves.toEqual({ truncated: true });
    source?.enqueue(new TextEncoder().encode('{"data":"arrived"}'));
    source?.close();
    await expect(response.json()).resolves.toEqual({ data: 'arrived' });
  } finally {
    vi.useRealTimers();
  }
});
