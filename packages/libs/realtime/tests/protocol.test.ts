import { describe, expect, it } from 'vitest';

import {
  parseRealtimeClientMessage,
  parseRealtimeServerMessage,
  RealtimeProtocolError,
  REALTIME_MAX_MESSAGE_BYTES,
  encodeRealtimeServerMessage,
} from '../src/protocol.js';

describe('realtime protocol', () => {
  it('enforces the UTF-8 byte limit, including binary messages', () => {
    const message = JSON.stringify({
      type: 'publish',
      topic: 'test:updates',
      payload: '界'.repeat(REALTIME_MAX_MESSAGE_BYTES / 3),
    });
    expect(() => parseRealtimeClientMessage(message)).toThrowError(
      expect.objectContaining({ code: 'MESSAGE_TOO_LARGE' }),
    );
    const binary = new TextEncoder().encode(
      JSON.stringify({ type: 'ping', id: 'heartbeat-1' }),
    );
    expect(parseRealtimeClientMessage(binary.buffer)).toEqual({
      type: 'ping',
      id: 'heartbeat-1',
    });
  });

  it('requires an unsubscribe selector and preserves correlated replies', () => {
    expect(() =>
      parseRealtimeClientMessage('{"type":"unsubscribe"}'),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_UNSUBSCRIBE' }));
    const reply = {
      type: 'error' as const,
      id: 'subscription-attempt-2',
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    };
    expect(
      parseRealtimeServerMessage(encodeRealtimeServerMessage(reply)),
    ).toEqual(reply);
  });

  it('parses client and server messages through one contract', () => {
    expect(
      parseRealtimeClientMessage(
        JSON.stringify({ type: 'subscribe', topic: 'notifications:in-app' }),
      ),
    ).toEqual({
      type: 'subscribe',
      topic: 'notifications:in-app',
    });
    expect(
      parseRealtimeServerMessage(
        JSON.stringify({
          type: 'event',
          topic: 'notifications:in-app',
          payload: { changed: true },
          publishedAt: '2026-08-26T00:00:00.000Z',
        }),
      ),
    ).toMatchObject({
      type: 'event',
      topic: 'notifications:in-app',
      payload: { changed: true },
    });
  });

  it.each([
    ['invalid JSON', '{', 'INVALID_JSON'],
    [
      'invalid topic',
      JSON.stringify({ type: 'subscribe', topic: '../private' }),
      'INVALID_TOPIC',
    ],
    [
      'unknown type',
      JSON.stringify({ type: 'unknown' }),
      'UNKNOWN_MESSAGE_TYPE',
    ],
  ])('rejects %s', (_label, data, code) => {
    expect(() => parseRealtimeClientMessage(data)).toThrowError(
      expect.objectContaining({ code }) as RealtimeProtocolError,
    );
  });
});
