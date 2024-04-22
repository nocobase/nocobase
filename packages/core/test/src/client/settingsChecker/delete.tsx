import { expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CheckModalOptions, checkModal } from '../utils';

export interface CheckDeleteSettingOptions {
  title: string;
  deletedText?: string;
  afterClick?: () => Promise<void> | void;
  modalChecker?: Omit<CheckModalOptions, 'triggerText'>;
}

export async function checkDeleteSetting(options: CheckDeleteSettingOptions) {
  if (options.modalChecker) {
    await checkModal({
      triggerText: options.title,
      contentText: 'Are you sure you want to delete it?',
      ...options.modalChecker,
      async afterSubmit() {
        if (options.modalChecker.afterSubmit) {
          await options.modalChecker.afterSubmit();
        }
        if (options.deletedText) {
          expect(screen.queryByText(options.deletedText)).not.toBeInTheDocument();
        }
      },
    });
  }
  if (options.afterClick) {
    await options.afterClick();
  }
}
