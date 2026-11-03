import type { RealtimeUserTopic } from '@nocobase/app-server/realtime';

import {
  type InAppNotificationChange,
  type InAppNotificationRealtimeEvent,
} from '../shared/realtime.js';
import type { InAppStore } from './store.js';

export {
  IN_APP_NOTIFICATION_REALTIME_TOPIC,
  type InAppNotificationChange,
  type InAppNotificationRealtimeEvent,
} from '../shared/realtime.js';

export type InAppNotificationRealtimeTopic = Pick<
  RealtimeUserTopic<InAppNotificationRealtimeEvent>,
  'publishFor'
>;

export function createRealtimeInAppStore(
  store: InAppStore,
  topic: InAppNotificationRealtimeTopic,
): InAppStore {
  return {
    async deliver(input) {
      const item = await store.deliver(input);
      await publishChange(topic, input.userId, 'created');
      return item;
    },
    list(input) {
      return store.list(input);
    },
    countUnread(userId) {
      return store.countUnread(userId);
    },
    async update(input) {
      const item = await store.update(input);
      if (item) {
        await publishChange(
          topic,
          input.userId,
          input.action === 'delete' ? 'deleted' : input.action,
        );
      }
      return item;
    },
    async markAllRead(userId) {
      const updated = await store.markAllRead(userId);
      if (updated > 0) {
        await publishChange(topic, userId, 'read-all');
      }
      return updated;
    },
  };
}

async function publishChange(
  topic: InAppNotificationRealtimeTopic,
  userId: string,
  change: InAppNotificationChange,
): Promise<void> {
  try {
    await topic.publishFor(userId, {
      kind: 'inbox.changed',
      change,
    });
  } catch (error) {
    console.error(
      'Failed to publish in-app notification realtime event.',
      error,
    );
  }
}
