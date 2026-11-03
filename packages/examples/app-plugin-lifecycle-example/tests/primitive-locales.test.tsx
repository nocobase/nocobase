import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import locales from '../client/locales/index.js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../client/components/ui/dialog.js';

it('uses owned translations for primitives outside the plugin namespace in all languages', async () => {
  const runtime = await createTestI18nRuntime({
    namespaces: { '@nocobase/app-plugin-lifecycle-example': locales },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <Dialog open>
        <DialogContent>
          <DialogTitle>Example</DialogTitle>
          <DialogDescription>Example description</DialogDescription>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </TestI18nProvider>,
  );
  for (const locale of Object.keys(locales)) {
    await act(() => runtime.changeLanguage(locale));
    const t = runtime.getFixedT('@nocobase/app-plugin-lifecycle-example');
    expect(
      screen.getAllByRole('button', { name: t('common.close'), exact: true }),
    ).toHaveLength(2);
  }
});
