import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import plugin from '../client/plugin.js';
import { RoutesExampleProvider } from '../client/components/routes-example-provider.js';
import Page from '../client/pages/routes-example-page.js';

// The page asks the server route for its greeting; this test is about the copy around it, so the request never settles.
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request: () => new Promise(() => {}) }),
}));

it('translates demo copy on language changes', async () => {
  const definition = plugin();
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace(definition.packageName, definition.locales ?? {});
  await runtime.init('zh-CN');
  render(
    <I18nProvider runtime={runtime}>
      <RoutesExampleProvider>
        <Page />
      </RoutesExampleProvider>
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { name: '路由示例' })).toBeVisible();
  expect(
    screen.getByText(/此页面使用同一客户端插件提供的 Provider。/u),
  ).toBeVisible();
  expect(screen.getByText('正在加载服务端数据…')).toBeVisible();
  await act(() => runtime.changeLanguage('en-US'));
  expect(screen.getByRole('heading', { name: 'Routes example' })).toBeVisible();
});
