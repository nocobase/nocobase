import { CheckDialogOptions, checkDialog } from '../utils';

export interface CheckDialogSettingOptions {
  title: string;
  beforeClick?: () => Promise<void> | void;
  afterClick?: () => Promise<void> | void;
  dialogChecker?: Omit<CheckDialogOptions, 'triggerText'>;
}

export async function checkDialogSetting(options: CheckDialogSettingOptions) {
  await checkDialog({
    triggerText: options.title,
    ...options.dialogChecker,
  });

  if (options.afterClick) {
    await options.afterClick();
  }
}
