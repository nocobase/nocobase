import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import locales from '../../client/locales/index';
import I18nExamplesPage from '../../client/pages/i18n-examples';

async function setup(locale = 'en-US', defaultLocale = 'en-US') {
  const runtime = new I18nRuntime({
    defaultLocale,
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init(locale);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider runtime={runtime}>
        <I18nExamplesPage />
      </I18nProvider>
    </QueryClientProvider>,
  );
  await screen.findByText('This message is available in English only.');
  return runtime;
}

describe('internationalization example', () => {
  it('uses application plural keys and preserves the count across language changes', async () => {
    const runtime = await setup();
    const user = userEvent.setup();
    expect(screen.getByRole('status')).toHaveTextContent('1 item');
    for (const count of [0, 2, 5]) {
      await user.click(
        screen.getByRole('button', { name: String(count), exact: true }),
      );
      expect(screen.getByRole('status')).toHaveTextContent(`${count} items`);
    }
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '多语言示例',
    );
    expect(screen.getByRole('status')).toHaveTextContent('5 个项目');
    expect(screen.getByRole('spinbutton', { name: '项目数量' })).toHaveValue(5);
    await user.click(screen.getByRole('button', { name: '1', exact: true }));
    expect(screen.getByRole('status')).toHaveTextContent('1 个项目');
    await act(() => runtime.changeLanguage('en-US'));
    expect(screen.getByRole('status')).toHaveTextContent(/^1 item$/);
  });

  it('accepts custom counts and rejects empty, negative, fractional and unsafe counts', async () => {
    await setup();
    const user = userEvent.setup();
    const input = screen.getByRole('spinbutton', { name: 'Item count' });
    await user.clear(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    for (const value of ['-1', '1.5', '9007199254740992']) {
      await user.clear(input);
      await user.type(input, value);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('status')).toHaveTextContent(
        'Enter a valid non-negative safe integer.',
      );
    }
    await user.clear(input);
    await user.type(input, '12');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('12 items');
  });

  it('shows actual fallback sources without adding missing keys to the application', async () => {
    const runtime = await setup('zh-CN', 'zh-CN');
    const fallback = within(
      screen.getByRole('region', { name: '缺失翻译回退' }),
    );
    expect(
      fallback.getByRole('row', { name: /中英文都有翻译/ }),
    ).toHaveTextContent('更改已保存。');
    expect(
      fallback.getByRole('row', { name: /仅有英文翻译/ }),
    ).toHaveTextContent('en-US');
    expect(
      fallback.getByRole('row', { name: /翻译缺失，提供 defaultValue/ }),
    ).toHaveTextContent('暂无可用翻译。');
    expect(
      fallback.getByRole('row', { name: /翻译缺失，未提供 defaultValue/ }),
    ).toHaveTextContent('key 本身');
    expect(runtime.getLocale()).toBe('zh-CN');
    expect(runtime.i18n.exists('englishOnly')).toBe(false);
    expect(runtime.i18n.exists('missingMessage')).toBe(false);

    await act(() => runtime.changeLanguage('en-US'));
    const englishFallback = within(
      screen.getByRole('region', { name: 'Missing translations' }),
    );
    await englishFallback.findByText('Translation unavailable.');
    expect(
      englishFallback.getByRole('row', { name: /Available in both languages/ }),
    ).toHaveTextContent('Your changes are saved.');
  });

  it('keeps regional comparisons stable while translating their labels', async () => {
    const runtime = await setup();
    const formats = within(
      screen.getByRole('region', { name: 'Regional formats' }),
    );
    expect(formats.getByRole('row', { name: /en-US/ })).toHaveTextContent(
      '1,234,567.89',
    );
    expect(formats.getByRole('row', { name: /de-DE/ })).toHaveTextContent(
      '1.234.567,89',
    );
    const rows = formats
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    await act(() => runtime.changeLanguage('zh-CN'));
    const translated = within(
      screen.getByRole('region', { name: '多区域格式' }),
    );
    expect(
      translated.getByRole('columnheader', { name: '金额（USD）' }),
    ).toBeVisible();
    expect(
      translated
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(rows);
  });
});
