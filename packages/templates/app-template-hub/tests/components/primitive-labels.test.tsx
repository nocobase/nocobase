import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { Dialog, DialogContent, DialogTitle } from '#components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '#components/ui/sheet';
import { Spinner } from '#components/ui/spinner';
import { createToastManager, Toaster } from '#components/ui/toast';

import zhCN from '../../client/locales/zh-CN.js';

// Chinese, because the registry's built-in English and the application's English wording are both "Close": only a
// label that goes through the application's locale reads 关闭.
const runtime = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace: '@nocobase/app-template-hub', resources: zhCN },
});

function I18n({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}

// These shipped primitives replace the English the registry builds into them with translation keys. Updating one
// by overwriting it with the registry's file brings the English back, and the matching test fails.
describe('labels built into the shipped primitives', () => {
  it('names the Dialog close button through actions.close', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Panel</DialogTitle>
        </DialogContent>
      </Dialog>,
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('button', { name: zhCN.actions.close }),
    ).toBeInTheDocument();
  });

  it('names the Sheet close button through actions.close', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Panel</SheetTitle>
        </SheetContent>
      </Sheet>,
      { wrapper: I18n },
    );

    expect(
      screen.getByRole('button', { name: zhCN.actions.close }),
    ).toBeInTheDocument();
  });

  it('names the toast close button through actions.close', async () => {
    const manager = createToastManager();
    render(<Toaster toastManager={manager} />, { wrapper: I18n });

    act(() => {
      manager.add({ title: 'Saved' });
    });

    // Base UI keeps the close button aria-hidden until the toast list is expanded, so find it by its label.
    const [close] = await screen.findAllByLabelText(zhCN.actions.close);
    expect(close).toHaveAttribute('data-slot', 'toast-close');
  });

  it('labels the Spinner through status.loading', () => {
    render(<Spinner />, { wrapper: I18n });

    expect(
      screen.getByRole('status', { name: zhCN['status.loading'] }),
    ).toBeInTheDocument();
  });
});
