import { describe, expect, it, vi } from 'vitest';
import { MailMessageSyncNotifier } from '../../server/message-sync-notifier.js';
import type { MailMessagesSyncedEvent } from '../../server/index.js';

const event: MailMessagesSyncedEvent = {
  eventId: 'event-1',
  accountId: 'account-1',
  ownerId: 'owner-1',
  syncRunId: 'run-1',
  phase: 'history',
  syncedAt: '2026-09-01T00:00:00.000Z',
  messageIds: ['local-1'],
};

describe('Mail message sync notifier', () => {
  it('isolates synchronous errors, rejected promises and logging failures without waiting', async () => {
    const logger = {
      error: vi.fn(() => {
        throw new Error('log failed');
      }),
    };
    const notifier = new MailMessageSyncNotifier(logger);
    const received = vi.fn();
    notifier.subscribe(() => {
      throw new Error('password=secret');
    });
    notifier.subscribe(async () => {
      throw new Error('body=private');
    });
    notifier.subscribe(() => new Promise<void>(() => {}));
    notifier.subscribe(received);
    expect(() => notifier.notify([event])).not.toThrow();
    expect(received).toHaveBeenCalledWith(event);
    await Promise.resolve();
    await Promise.resolve();
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(
      /secret|private/,
    );
  });

  it('supports independent duplicate subscriptions, idempotent cancellation and closure', () => {
    const notifier = new MailMessageSyncNotifier();
    const received = vi.fn();
    const cancel = notifier.subscribe(received);
    notifier.subscribe(received);
    cancel();
    cancel();
    notifier.notify([event]);
    expect(received).toHaveBeenCalledTimes(1);
    notifier.close();
    notifier.close();
    cancel();
    notifier.subscribe(received)();
    notifier.notify([event]);
    expect(received).toHaveBeenCalledTimes(1);
  });

  it('honors cancellation and close during dispatch and protects event snapshots', () => {
    const notifier = new MailMessageSyncNotifier();
    const received = vi.fn();
    let cancel = () => {};
    notifier.subscribe((snapshot) => {
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(Object.isFrozen(snapshot.messageIds)).toBe(true);
      cancel();
      notifier.close();
    });
    cancel = notifier.subscribe(received);
    notifier.notify([event, { ...event, eventId: 'event-2' }]);
    expect(received).not.toHaveBeenCalled();
  });

  it('does not leak subscriptions between instances or after late rejection on close', async () => {
    const logger = { error: vi.fn() };
    const first = new MailMessageSyncNotifier(logger);
    const second = new MailMessageSyncNotifier();
    const pending = Promise.withResolvers<void>();
    const received = vi.fn();
    first.subscribe(() => pending.promise);
    second.subscribe(received);
    first.notify([event]);
    first.close();
    pending.reject(new Error('late failure'));
    await Promise.resolve();
    await Promise.resolve();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(received).not.toHaveBeenCalled();
    second.notify([event]);
    expect(received).toHaveBeenCalledOnce();
  });
});
