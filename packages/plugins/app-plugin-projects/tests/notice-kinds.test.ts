import { NotificationTemplateRegistry } from '@nocobase/app-plugin-notification/server';
import { expect, it } from 'vitest';

import {
  noticeKindOf,
  PROJECT_NOTICE_KINDS,
  registerNoticeKinds,
} from '../server/providers/notice-kinds.js';

it('maps every notice type to a registered kind that sends its words as they are', async () => {
  const registry = new NotificationTemplateRegistry();
  const release = registerNoticeKinds(registry);
  const ids = new Set(Object.values(PROJECT_NOTICE_KINDS));
  for (const type of [
    'owner_notified',
    'commented',
    'mentioned',
    'status_changed',
    'owner_assigned',
    'executor_assigned',
    'dependency_released',
    'batch_done',
    'another_plugin_type',
  ])
    expect(ids.has(noticeKindOf(type) as never)).toBe(true);
  const kind = registry.kind('projects.mentioned');
  expect(kind?.view.categoryKey).toBe('projects');
  expect(kind?.policies).toContainEqual(
    expect.objectContaining({ type: 'in-app', policy: 'required' }),
  );
  await expect(
    kind?.render('en-US', { title: 'Alice mentioned you', body: 'Look' }),
  ).resolves.toMatchObject({ title: 'Alice mentioned you', body: 'Look' });
  release();
  expect(registry.kind('projects.mentioned')).toBeUndefined();
});
