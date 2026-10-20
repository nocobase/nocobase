import { mailLogError, writeMailLog, type MailLogger } from './logging.js';
import type { RealtimeUserTopic } from '@nocobase/app-server/realtime';

import type { MailRealtimeEvent } from '../shared/realtime.js';

export {
  MAIL_REALTIME_TOPIC,
  type MailRealtimeEvent,
} from '../shared/realtime.js';

export interface MailMessageChangeNotifier {
  notify(userId: string): void | Promise<void>;
}

export type MailRealtimeTopic = Pick<
  RealtimeUserTopic<MailRealtimeEvent>,
  'publishFor'
>;

export function createMailMessageChangeNotifier(
  topic: MailRealtimeTopic,
): MailMessageChangeNotifier {
  return {
    async notify(userId: string): Promise<void> {
      await topic.publishFor(userId, { kind: 'mail.changed' });
    },
  };
}

export function notifyMailMessageChange(
  notifier: MailMessageChangeNotifier | undefined,
  userId: string,
  logger?: MailLogger,
): void {
  if (!notifier) return;
  try {
    void Promise.resolve(notifier.notify(userId)).catch(report);
  } catch (error) {
    report(error);
  }
  function report(error: unknown): void {
    writeMailLog(
      logger,
      'error',
      { event: 'mail.realtime.failed', userId, err: mailLogError(error) },
      'Failed to publish Mail realtime event.',
    );
  }
}
