import type { InboxItem } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';

import enUS from '../../registry/inbox/inbox/locales/en-US';
import type { InboxNotice } from '../../registry/inbox/inbox/model';

export const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: enUS },
});

export function item(
  id: string,
  overrides: Partial<InboxItem> = {},
): InboxItem {
  return {
    id,
    deliveryId: `d-${id}`,
    notificationId: `n-${id}`,
    title: `Title ${id}`,
    body: `Body ${id}`,
    target: { type: 'route', path: `/things/${id}` },
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

export function notice(
  id: string,
  overrides: Partial<InboxNotice> = {},
): InboxNotice {
  return {
    notificationId: `n-${id}`,
    source: 'mystery',
    kind: 'decision',
    type: 'something_happened',
    subject: null,
    decisionKey: `k-${id}`,
    data: null,
    count: 1,
    resolvedAt: null,
    outcome: null,
    ...overrides,
  };
}
