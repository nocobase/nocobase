import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '#components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Sheet, SheetContent, SheetTitle } from '#components/ui/sheet';
import { Spinner } from '#components/ui/spinner';
import { BrandSpinner } from '#components/brand-spinner';
import { Loading } from '#components/loading';
import { createToastManager, Toaster } from '#components/ui/toast';

import zhCN from '../../client/locales/zh-CN.js';

// Chinese, because the registry's built-in English and the application's English wording are both "Close": only a
// label that goes through the application's locale reads 关闭.
const runtime = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace: '@nocobase/app-template-default', resources: zhCN },
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

  it('labels brand loading and allows decorative inline indicators', () => {
    const { rerender } = render(<BrandSpinner />, { wrapper: I18n });
    expect(
      screen.getByRole('status', { name: zhCN['status.loading'] }),
    ).toBeVisible();
    rerender(<BrandSpinner aria-hidden='true' />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(<Loading label='正在加载客户' />);
    expect(
      screen.getByRole('status', { name: '正在加载客户' }),
    ).toHaveTextContent('正在加载客户');
  });

  it('labels the Spinner through status.loading', () => {
    render(<Spinner />, { wrapper: I18n });

    expect(
      screen.getByRole('status', { name: zhCN['status.loading'] }),
    ).toBeInTheDocument();
  });
});

describe('application-owned dialog layout overrides', () => {
  it('allows a form dialog to replace default width, padding and spacing', () => {
    render(
      <Dialog open>
        <DialogContent className='sm:max-w-3xl p-8 gap-2'>
          <DialogTitle>Custom form</DialogTitle>
          <DialogFooter className='mx-0 mb-0 px-8 py-2 gap-1'>
            Actions
          </DialogFooter>
        </DialogContent>
      </Dialog>,
      { wrapper: I18n },
    );
    const content = screen.getByRole('dialog');
    expect(content).toHaveClass('sm:max-w-3xl', 'p-8', 'gap-2');
    expect(content).not.toHaveClass('sm:max-w-lg', 'p-6', 'gap-5');
    const footer = screen.getByText('Actions');
    expect(footer).toHaveClass('mx-0', 'mb-0', 'px-8', 'py-2', 'gap-1');
    expect(footer).not.toHaveClass('-mx-6', '-mb-6', 'px-6', 'py-4', 'gap-3');
  });
  it('allows a compact confirmation to replace its size default', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent size='sm' className='sm:max-w-xl p-8 gap-2'>
          <AlertDialogTitle>Custom confirmation</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
      { wrapper: I18n },
    );
    const content = screen.getByRole('alertdialog');
    expect(content).toHaveClass('sm:max-w-xl', 'p-8', 'gap-2');
    expect(content).not.toHaveClass('sm:max-w-sm', 'p-6', 'gap-5');
  });
});
