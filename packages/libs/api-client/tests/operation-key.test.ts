import { describe, expect, it, vi } from 'vitest';
import { createApiClient, createOperationKey } from '../src/index.js';

describe('operation key transport', () => {
  it('forwards caller-owned keys in headers for every standard write without changing the body', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () =>
        Response.json({ data: { record: { id: 'one' } } }),
      );
    const api = createApiClient({ baseURL: '/api', fetch });
    const repo = api.repository<{ id: string; name: string }>('orders');
    const idempotencyKey = createOperationKey();
    const signal = new AbortController().signal;
    expect(idempotencyKey).toMatch(/^\d{13}\.[a-f0-9-]{36}$/);
    await repo.createOne({
      values: { id: 'one', name: 'Camera' },
      idempotencyKey,
      signal,
    });
    await repo.updateOne({
      filter: { id: 'one' },
      values: { name: 'Updated' },
      idempotencyKey,
      signal,
    });
    await repo.deleteOne({ filter: { id: 'one' }, idempotencyKey, signal });
    for (const [, request] of fetch.mock.calls) {
      expect(new Headers(request?.headers).get('Idempotency-Key')).toBe(
        idempotencyKey,
      );
      expect(request?.signal).toBe(signal);
      expect(JSON.parse(String(request?.body))).not.toHaveProperty('signal');
      expect(JSON.parse(String(request?.body))).not.toHaveProperty(
        'idempotencyKey',
      );
    }
    expect(createOperationKey()).not.toBe(idempotencyKey);
  });
  it('retains unkeyed legacy calls and never retries a refused keyed request without its key', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(Response.json({ data: { record: { id: 'one' } } }))
      .mockResolvedValueOnce(
        Response.json(
          {
            error: {
              code: 'INVALID_ARGUMENT',
              status: 400,
              reason: 'IDEMPOTENCY_UNAVAILABLE',
              domain: 'app',
              message: 'Not integrated',
              requestId: 'synthetic',
            },
          },
          { status: 400 },
        ),
      );
    const repo = createApiClient({ baseURL: '/api', fetch }).repository(
      'orders',
    );
    await repo.createOne({ values: { id: 'one' } });
    expect(
      new Headers(fetch.mock.calls[0][1]?.headers).has('Idempotency-Key'),
    ).toBe(false);
    await expect(
      repo.createOne({
        values: { id: 'two' },
        idempotencyKey: createOperationKey(),
      }),
    ).rejects.toMatchObject({ reason: 'IDEMPOTENCY_UNAVAILABLE' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
