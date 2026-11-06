import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import locales from '../client/locales/index.js';
import { Spinner } from '../client/components/ui/spinner.js';

it('uses owned translations for primitives outside the plugin namespace in all languages', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-projects': locales },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <Spinner />
    </TestI18nProvider>,
  );
  for (const locale of Object.keys(locales)) {
    await act(() => runtime.changeLanguage(locale));
    const t = runtime.getFixedT('@nocobase/app-plugin-projects');
    expect(screen.getByRole('status')).toHaveAccessibleName(
      t('common.loading'),
    );
  }
});
