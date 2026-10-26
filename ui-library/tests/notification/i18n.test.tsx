import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import enUS from '../../registry/notification/notification-logs-ui/locales/en-US.js';
import zhCN from '../../registry/notification/notification-logs-ui/locales/zh-CN.js';
import { NotificationLogsPage } from '../../registry/notification/notification-logs-ui/page.js';

vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  const api = actual.createApiClient({
    baseURL: '/custom/api',
    fetch: async (url) => {
      expect(String(url)).toBe('/custom/api/notifications/logs?pageSize=100');
      return Response.json({ data: [] });
    },
  });
  return {
    ...actual,
    useApiClient: () => api,
  };
});

it('translates installed notification log source using application-owned resources', async () => {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  });
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <NotificationLogsPage />
    </I18nProvider>,
  );
  await screen.findByText('No deliveries yet');
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(screen.getByRole('heading', { name: '通知日志' })).toBeVisible();
  expect(screen.getByRole('button', { name: '刷新' })).toBeVisible();
  expect(screen.queryByText('No deliveries yet')).not.toBeInTheDocument();
});

it.each(['en-US', 'zh-CN'] as const)(
  'ships all rendered keys in %s',
  async (locale) => {
    const runtime = await createTestI18nRuntime({
      locale,
      application: {
        namespace: 'app',
        resources: locale === 'en-US' ? enUS : zhCN,
      },
    });
    render(
      <TestI18nProvider runtime={runtime}>
        <NotificationLogsPage />
      </TestI18nProvider>,
    );
    await screen.findByText(
      (locale === 'en-US' ? enUS : zhCN).notificationLogs.logs.emptyTitle,
    );
  },
);
