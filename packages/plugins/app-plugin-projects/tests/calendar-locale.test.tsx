import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';

import { useDateFnsLocale } from '../client/lib/format.js';
import locales from '../client/locales/index.js';

it('updates the calendar locale without remounting, including Traditional Chinese', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-projects': locales },
  });
  const hook = renderHook(() => useDateFnsLocale(), {
    wrapper: ({ children }) => (
      <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>
    ),
  });
  for (const [language, code] of [
    ['en-US', 'en-US'],
    ['zh-CN', 'zh-CN'],
    ['zh-TW', 'zh-TW'],
    ['ja-JP', 'ja'],
    ['es-ES', 'es'],
    ['pt-BR', 'pt-BR'],
    ['fr-FR', 'fr'],
    ['de-DE', 'de'],
    ['vi-VN', 'vi'],
    ['id-ID', 'id'],
  ]) {
    await act(() => runtime.changeLanguage(language));
    expect(hook.result.current.code).toBe(code);
  }
});
