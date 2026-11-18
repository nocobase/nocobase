import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { NotificationLogDetails } from '../../registry/notification/notification-logs-ui/api.js';
import enUS from '../../registry/notification/notification-logs-ui/locales/en-US.js';
import zhCN from '../../registry/notification/notification-logs-ui/locales/zh-CN.js';
import { NotificationLogsView } from '../../registry/notification/notification-logs-ui/page.js';

const log: NotificationLogDetails = {
  log: {
    id: '0f8c2a1e-5b7d-4c3a-9e21-6d4f8b0a7c11',
    sourceType: 'record-notification',
    sourceReferenceId: 'record-notification:tasks:42:assigned:7',
    status: 'completed',
    createdAt: '2026-11-04T09:30:00Z',
    updatedAt: '2026-11-04T09:30:01Z',
  },
  deliveries: [],
};

async function renderView(
  locale: 'en-US' | 'zh-CN',
  props: Partial<Parameters<typeof NotificationLogsView>[0]> = {},
) {
  const runtime = await createTestI18nRuntime({
    locale,
    application: {
      namespace: 'app',
      resources: locale === 'en-US' ? enUS : zhCN,
    },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <NotificationLogsView
        loadLogs={() => Promise.resolve([log])}
        {...props}
      />
    </TestI18nProvider>,
  );
}

it('shows the short notification ID and keeps full values in titles', async () => {
  await renderView('en-US');
  const id = await screen.findByText('0f8c2a1e');
  expect(id).toHaveAttribute('title', log.log.id);
  expect(
    screen.getByText('record-notification:tasks:42:assigned:7'),
  ).toHaveAttribute('title', 'record-notification:tasks:42:assigned:7');
});

it('formats dates in the application language', async () => {
  await renderView('zh-CN');
  const expected = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(log.log.createdAt));
  expect(await screen.findByText(expected)).toBeVisible();
});

it('hides its own heading but keeps read recovery when showHeading is false', async () => {
  const loadLogs = vi.fn().mockRejectedValue(new Error('Unavailable'));
  await renderView('en-US', { loadLogs, showHeading: false });
  expect(
    await screen.findByRole('button', {
      name: enUS.notificationLogs.logs.retryRead,
    }),
  ).toBeVisible();
  expect(
    screen.queryByRole('heading', { name: enUS.notificationLogs.logs.title }),
  ).not.toBeInTheDocument();
});
