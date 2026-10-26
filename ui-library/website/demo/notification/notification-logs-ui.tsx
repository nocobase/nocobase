import type { ReactElement } from 'react';
import { NotificationLogsView } from '#extensions/nocobase-notification-logs-ui/page';
import type { NotificationLogDetails } from '#extensions/nocobase-notification-logs-ui/api';

const logs: readonly NotificationLogDetails[] = [
  {
    log: {
      id: 'notification-1',
      sourceType: 'invoice',
      sourceReferenceId: 'INV-1042',
      status: 'completed',
      createdAt: '2026-01-01T09:00:00Z',
      updatedAt: '2026-01-01T09:00:01Z',
    },
    deliveries: [
      {
        delivery: {
          id: 'delivery-1',
          channelName: 'email',
          channelType: 'email',
          providerType: 'smtp',
          attemptCount: 1,
          status: 'accepted',
          createdAt: '2026-01-01T09:00:00Z',
          updatedAt: '2026-01-01T09:00:01Z',
        },
        attempts: [
          {
            id: 'attempt-1',
            sequence: 1,
            providerType: 'smtp',
            status: 'accepted',
            startedAt: '2026-01-01T09:00:00Z',
            finishedAt: '2026-01-01T09:00:01Z',
          },
        ],
      },
    ],
  },
];
const loadLogs = (): Promise<readonly NotificationLogDetails[]> =>
  Promise.resolve(logs);
export function NotificationLogsUiDemo(): ReactElement {
  return <NotificationLogsView loadLogs={loadLogs} />;
}
