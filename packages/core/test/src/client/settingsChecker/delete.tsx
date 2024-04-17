import { screen } from '@testing-library/react';
import { CheckDialogOptions, checkDialog } from '../utils';

export interface CheckDeleteSettingOptions {
  title: string;
  deletedText?: string;
  afterClick?: () => Promise<void> | void;
  dialogChecker?: Omit<CheckDialogOptions, 'triggerText'>;
}

export async function checkDeleteSetting(options: CheckDeleteSettingOptions) {
  await checkDialog({
    triggerText: options.title,
    contentText: 'Are you sure you want to delete it?',
    ...options.dialogChecker,
    async afterSubmit() {
      if (options.dialogChecker.afterSubmit) {
        await options.dialogChecker.afterSubmit();
      }
      if (options.deletedText) {
        expect(screen.queryByText(options.deletedText)).not.toBeInTheDocument();
      }
    },
  });

  if (options.afterClick) {
    await options.afterClick();
  }
}
