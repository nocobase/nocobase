import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope, APP_NS } from '@nocobase/i18n/client';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it } from 'vitest';
import HomePage from '../../client/pages/home.tsx';
import enUS from '../../client/locales/en-US.ts';
import zhCN from '../../client/locales/zh-CN.ts';

it.each(['en-US', 'zh-CN'])(
  'shows translated examples with deployment-relative links in %s',
  async (locale) => {
    const runtime = new I18nRuntime({
      defaultLocale: locale,
      locales: ['en-US', 'zh-CN'],
      applicationNamespace: '@nocobase/app-template-examples',
    });
    runtime.registerApplicationNamespace('@nocobase/app-template-examples', {
      'en-US': () => Promise.resolve({ default: enUS }),
      'zh-CN': () => Promise.resolve({ default: zhCN }),
    });
    await runtime.init(locale);
    render(
      <I18nProvider runtime={runtime}>
        <NamespaceScope ns={APP_NS}>
          <MemoryRouter basename='/demo' initialEntries={['/demo/']}>
            <HomePage />
          </MemoryRouter>
        </NamespaceScope>
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      locale === 'zh-CN' ? '从可运行的示例开始' : 'Explore working examples',
    );
    expect(
      screen.getByRole('link', {
        name: locale === 'zh-CN' ? /^多语言示例/u : /^Internationalization/u,
      }),
    ).toHaveAttribute('href', '/demo/i18n-examples');
    expect(
      screen.getByRole('link', {
        name: locale === 'zh-CN' ? /^模板打印/u : /^Template printing/u,
      }),
    ).toHaveAttribute('href', '/demo/template-print-example');
    expect(
      screen.getAllByRole('link').map((link) => link.getAttribute('href')),
    ).toEqual([
      '/demo/route-overlays',
      '/demo/articles',
      '/demo/numeric-examples',
      '/demo/i18n-examples',
      '/demo/external-crm',
      '/demo/repository-example/find-many',
      '/demo/repository-example/crm',
      '/demo/repository-example/orders',
      '/demo/authorization-example',
      '/demo/file-repository',
      '/demo/template-print-example',
      '/demo/routes-example',
      '/demo/notification-example',
      '/demo/ai-employee-example',
    ]);
  },
);
