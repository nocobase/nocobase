import { describe, expect, it, vi } from 'vitest';

import { QueueDispatcher } from '../../src/consumer.js';
import { withChannel } from '../../src/index.js';
import {
  decodeEnvelope,
  encodeEnvelope,
  serializeMessage,
} from '../../src/message.js';
import { redisQueueIdentity } from '../../src/naming.js';
import { assertJobId, backoffDelay } from '../../src/options.js';
import { deferred } from '../contract/queue-contract.js';

function dispatcher(): QueueDispatcher {
  return new QueueDispatcher({ onActive: vi.fn(), onIdle: vi.fn() });
}

describe('QueueDispatcher', () => {
  it('requeues a job when no handler is registered', async () => {
    await expect(
      dispatcher().dispatch({ id: 'a', channel: 'x', text: '{}' }),
    ).resolves.toEqual({ kind: 'requeue' });
  });

  it('gives every handler its own copy of the message', async () => {
    const queue = dispatcher();
    const seen: unknown[] = [];
    queue.register(async (_c, message) => {
      (message as { n: number }).n += 1;
      seen.push(message);
    });
    queue.register(async (_c, message) => {
      seen.push(message);
    });
    await queue.dispatch({ id: 'a', channel: 'x', text: '{"n":1}' });
    expect(seen).toEqual([{ n: 2 }, { n: 1 }]);
  });

  it('aggregates several failures', async () => {
    const queue = dispatcher();
    queue.register(() => Promise.reject(new Error('one')));
    queue.register(() => Promise.reject(new Error('two')));
    const outcome = await queue.dispatch({ id: 'a', channel: 'x', text: '1' });
    expect(outcome.kind).toBe('failed');
    expect((outcome as { error: unknown }).error).toBeInstanceOf(
      AggregateError,
    );
  });

  it('treats a failure after the shutdown signal as an interruption', async () => {
    const queue = dispatcher();
    const started = deferred();
    queue.register(
      (_c, _m, signal) =>
        new Promise((_resolve, reject) => {
          started.resolve();
          signal.addEventListener('abort', () =>
            reject(signal.reason as Error),
          );
        }),
    );
    const dispatching = queue.dispatch({ id: 'a', channel: 'x', text: '1' });
    await started.promise;
    queue.interrupt();
    await expect(dispatching).resolves.toEqual({ kind: 'requeue' });
  });

  it('notifies when the first handler arrives and the last one leaves', async () => {
    const onActive = vi.fn();
    const onIdle = vi.fn();
    const queue = new QueueDispatcher({ onActive, onIdle });
    const first = queue.register(() => Promise.resolve());
    const second = queue.register(() => Promise.resolve());
    expect(onActive).toHaveBeenCalledTimes(1);
    await first();
    expect(onIdle).not.toHaveBeenCalled();
    await second();
    await second();
    expect(onIdle).toHaveBeenCalledTimes(1);
  });
});

describe('withChannel', () => {
  it('accepts one channel or a list and passes the result through', async () => {
    const handler = vi.fn(() => Promise.reject(new Error('handled')));
    const filtered = withChannel(['a', 'b'], handler);
    const signal = new AbortController().signal;
    await expect(filtered('c', 1, signal)).resolves.toBeUndefined();
    await expect(filtered('b', 1, signal)).rejects.toThrow('handled');
    await expect(withChannel('a', handler)('a', 2, signal)).rejects.toThrow();
    expect(handler).toHaveBeenCalledTimes(2);
  });
});

describe('messages and IDs', () => {
  it('encodes BullMQ JSON rules and a versioned envelope', () => {
    expect(serializeMessage(undefined)).toBe('{}');
    expect(serializeMessage(null)).toBe('null');
    expect(() => serializeMessage(Symbol('x'))).toThrow(/serialize to JSON/u);
    const envelope = encodeEnvelope(
      serializeMessage({ version: 1, payload: 'x' }),
    );
    expect(decodeEnvelope(envelope)).toBe('{"version":1,"payload":"x"}');
    expect(() => decodeEnvelope({ version: 2, payload: '1' })).toThrow();
    expect(() => decodeEnvelope({ raw: true })).toThrow();
  });

  it('checks job IDs with the BullMQ 6.3.6 rules', () => {
    expect(() => assertJobId('12')).toThrow(/integer/u);
    expect(() => assertJobId('a:b')).toThrow(/":"/u);
    expect(() => assertJobId('a:b:c')).not.toThrow();
    expect(() => assertJobId('12a')).not.toThrow();
    expect(() => assertJobId('')).toThrow();
  });

  it('computes BullMQ backoff delays', () => {
    expect(backoffDelay(undefined, 1)).toBe(0);
    expect(backoffDelay(100, 3)).toBe(100);
    expect(backoffDelay({ type: 'exponential', delay: 100 }, 3)).toBe(400);
  });

  it('derives the Redis identity from namespace and queue', () => {
    const a = redisQueueIdentity('crm', 'email');
    expect(a.name).toBe('q-ZW1haWw');
    expect(a).not.toEqual(redisQueueIdentity('crm2', 'email'));
    expect(redisQueueIdentity('crm', 'email')).toEqual(a);
  });
});
