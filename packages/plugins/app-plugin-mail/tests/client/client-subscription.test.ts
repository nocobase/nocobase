import type { RealtimeClient, RealtimeListener } from '@nocobase/app-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAIL_REALTIME_TOPIC } from '../../shared/realtime.js';
import {
  subscribeToMailInvalidations,
  type MailFocusTarget,
} from '../../client/subscription.js';

describe('Mail Client subscription', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('refreshes after connection recovery, valid events, and focus', async () => {
    vi.useFakeTimers();
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    let eventListener: RealtimeListener<unknown> | undefined;
    let openListener: (() => void) | undefined;
    let focusListener: EventListener | undefined;
    const unsubscribeEvent = vi.fn();
    const realtime: Pick<RealtimeClient, 'watch'> = {
      watch: vi.fn((topic, options) => {
        expect(topic).toBe(MAIL_REALTIME_TOPIC);
        eventListener = options?.onEvent as RealtimeListener<unknown>;
        openListener = options?.onReady;
        return {
          state: 'subscribed',
          error: undefined,
          retry: vi.fn(),
          close: unsubscribeEvent,
        };
      }),
    };
    const target: MailFocusTarget = {
      addEventListener: vi.fn((_type, listener) => {
        focusListener = listener;
      }),
      removeEventListener: vi.fn(),
    };
    const refresh = vi.fn();

    const cleanup = subscribeToMailInvalidations(realtime, target, refresh);

    openListener?.();
    await vi.advanceTimersByTimeAsync(100);
    eventListener?.({
      type: 'event',
      topic: MAIL_REALTIME_TOPIC,
      payload: { kind: 'unrelated' },
      publishedAt: '2026-09-02T00:00:00.000Z',
    });
    eventListener?.({
      type: 'event',
      topic: MAIL_REALTIME_TOPIC,
      payload: { kind: 'mail.changed' },
      publishedAt: '2026-09-02T00:00:01.000Z',
    });
    await vi.advanceTimersByTimeAsync(100);
    // Returning from DevTools immediately must not reload an already fresh page.
    focusListener?.(new Event('focus'));
    expect(refresh).toHaveBeenCalledTimes(2);
    now.mockReturnValue(30_000);
    focusListener?.(new Event('focus'));

    expect(refresh).toHaveBeenCalledTimes(3);
    focusListener?.(new Event('focus'));
    expect(refresh).toHaveBeenCalledTimes(3);
    now.mockReturnValue(60_000);
    focusListener?.(new Event('focus'));
    expect(refresh).toHaveBeenCalledTimes(4);

    cleanup();

    expect(target.removeEventListener).toHaveBeenCalledWith(
      'focus',
      focusListener,
    );
    expect(unsubscribeEvent).toHaveBeenCalledOnce();
  });
});
