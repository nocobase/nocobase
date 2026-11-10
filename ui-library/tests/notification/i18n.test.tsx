import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import enUS from '../../registry/notification/notification-logs-ui/locales/en-US.js';
import zhCN from '../../registry/notification/notification-logs-ui/locales/zh-CN.js';
import koKR from '../../registry/notification/notification-logs-ui/locales/ko-KR.js';
import ruRU from '../../registry/notification/notification-logs-ui/locales/ru-RU.js';
import {
  NotificationLogsPage,
  NotificationLogsView,
} from '../../registry/notification/notification-logs-ui/page.js';

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
  expect(
    screen.queryByRole('button', { name: '刷新' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('No deliveries yet')).not.toBeInTheDocument();
});

const shippedLocales = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'ko-KR': koKR,
  'ru-RU': ruRU,
} as const;

it.each(Object.keys(shippedLocales) as (keyof typeof shippedLocales)[])(
  'ships all rendered keys in %s',
  async (locale) => {
    const runtime = await createTestI18nRuntime({
      locale,
      application: {
        namespace: 'app',
        resources: shippedLocales[locale],
      },
    });
    render(
      <TestI18nProvider runtime={runtime}>
        <NotificationLogsPage />
      </TestI18nProvider>,
    );
    await screen.findByText(
      shippedLocales[locale].notificationLogs.logs.emptyTitle,
    );
  },
);

it.each(['en-US', 'zh-CN'] as const)(
  'offers only contextual read recovery in %s',
  async (locale) => {
    const resource = locale === 'en-US' ? enUS : zhCN;
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: 'app', resources: resource },
    });
    const loadLogs = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValue([]);
    render(
      <TestI18nProvider runtime={runtime}>
        <NotificationLogsView loadLogs={loadLogs} />
      </TestI18nProvider>,
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: resource.notificationLogs.logs.retryRead,
      }),
    );
    await screen.findByText(resource.notificationLogs.logs.emptyTitle);
    expect(loadLogs).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole('button', {
        name: resource.notificationLogs.logs.retryRead,
      }),
    ).not.toBeInTheDocument();
  },
);
