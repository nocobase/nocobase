import { CheckModalOptions, checkModal } from '../utils';

export interface CheckModalSettingOptions {
  title: string;
  beforeClick?: () => Promise<void> | void;
  afterClick?: () => Promise<void> | void;
  modalChecker?: Omit<CheckModalOptions, 'triggerText'>;
}

export async function checkModalSetting(options: CheckModalSettingOptions) {
  if (options.modalChecker) {
    await checkModal({
      triggerText: options.title,
      ...options.modalChecker,
    });
  }

  if (options.afterClick) {
    await options.afterClick();
  }
}
