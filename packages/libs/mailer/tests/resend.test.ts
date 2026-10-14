import { afterEach, expect, it, vi } from 'vitest';
import { createResendTransport } from '../src/index.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const config = {
  provider: 'resend' as const,
  apiKey: 'synthetic-key',
  from: 'sender@example.test',
};
const message = {
  to: 'recipient@example.test',
  subject: 'Synthetic',
  text: 'Synthetic body',
};

it('uses an idempotency key and redacts provider errors without SDK console output', async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        name: 'rate_limit_exceeded',
        message: 'synthetic-key recipient@example.test Synthetic body',
      }),
      { status: 429 },
    ),
  );
  vi.stubGlobal('fetch', fetch);
  const log = vi.spyOn(console, 'error');
  const transport = createResendTransport(config);
  const result = await transport.send(message, {
    idempotencyKey: 'synthetic-delivery',
  });
  expect(result).toMatchObject({
    status: 'failed',
    disposition: 'same_provider',
    error: { category: 'rate_limit' },
  });
  expect(JSON.stringify(result)).not.toContain('synthetic-key');
  expect(JSON.stringify(result)).not.toContain('recipient@example.test');
  const request = fetch.mock.calls[0]![1] as RequestInit;
  expect(new Headers(request.headers).get('idempotency-key')).toBe(
    'synthetic-delivery',
  );
  expect(log).not.toHaveBeenCalled();
  log.mockRestore();
  await transport.close();
});

it('retains capacity when fetch ignores abort across several timeout windows', async () => {
  vi.useFakeTimers();
  const releases: Array<(value: Response) => void> = [];
  const fetch = vi.fn(
    () => new Promise<Response>((resolve) => releases.push(resolve)),
  );
  vi.stubGlobal('fetch', fetch);
  const transport = createResendTransport(config);
  const original = Array.from({ length: 4 }, () => transport.send(message));
  await vi.advanceTimersByTimeAsync(0);
  expect(fetch).toHaveBeenCalledTimes(4);
  for (let window = 0; window < 3; window++) {
    await vi.advanceTimersByTimeAsync(20_001);
    for (let i = 0; i < 4; i++)
      expect((await transport.send(message)).status).toBe('failed');
    expect(fetch).toHaveBeenCalledTimes(4);
  }
  const close = transport.close();
  await vi.advanceTimersByTimeAsync(5_001);
  await close;
  expect(fetch).toHaveBeenCalledTimes(4);
  for (const release of releases)
    release(new Response(JSON.stringify({ id: 'synthetic-id' })));
  expect((await Promise.all(original)).map((result) => result.status)).toEqual([
    'accepted',
    'accepted',
    'accepted',
    'accepted',
  ]);
  expect((await transport.send(message)).status).toBe('failed');
});
