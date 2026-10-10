// @vitest-environment node
import projectsPlugin from '@nocobase/app-plugin-projects/server';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import locales from '../../server/locales/index.js';

it('uses the displayed development status names in server notifications', async () => {
  if (typeof projectsPlugin.locales !== 'function')
    throw new Error('The projects plugin must supply its server locales.');
  const runtime = await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: 'studio', resources: locales },
    namespaces: {
      '@nocobase/app-plugin-projects': await projectsPlugin.locales(),
    },
  });
  const t = runtime.getFixedT('@nocobase/app-plugin-projects');
  expect(t('status.todo')).toBe('待开始');
  expect(t('status.in_progress')).toBe('开发中');
  expect(
    t('notifications.statusChanged', {
      identifier: 'TASK-1',
      status: t('status.in_progress'),
    }),
  ).toBe('TASK-1 已改为“开发中”');
  expect(
    runtime.getFixedT('studio')('studioAgents.templateMessages.inReview'),
  ).toContain('把任务退回开发中');
});
