import { describe, expect, it, vi } from 'vitest';

import {
  createMailMessageChangeNotifier,
  notifyMailMessageChange,
  type MailMessageChangeNotifier,
  type MailRealtimeTopic,
} from '../../server/realtime.js';

describe('Mail realtime notifications', () => {
  it('publishes a user-scoped invalidation event', () => {
    const publishFor = vi.fn();
    const notifier = createMailMessageChangeNotifier({
      publishFor,
    } satisfies MailRealtimeTopic);

    notifier.notify('user-1');

    expect(publishFor).toHaveBeenCalledWith('user-1', {
      kind: 'mail.changed',
    });
  });

  it('does not make persistence fail when realtime publishing fails', () => {
    const error = new Error('socket unavailable');
    const logger = { error: vi.fn() };
    const notifier: MailMessageChangeNotifier = {
      notify: vi.fn(() => {
        throw error;
      }),
    };

    expect(() =>
      notifyMailMessageChange(notifier, 'user-1', logger),
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mail.realtime.failed',
        userId: 'user-1',
        err: { type: 'Error', message: error.message, stack: error.stack },
      }),
      'Failed to publish Mail realtime event.',
    );
    logger.error.mockImplementation(() => {
      throw new Error('transport unavailable');
    });
    expect(() =>
      notifyMailMessageChange(notifier, 'user-1', logger),
    ).not.toThrow();
  });
});
