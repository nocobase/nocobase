/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { screen } from '@testing-library/react';
import { CheckModalOptions, checkModal, expectNoTsError } from '../utils';

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
          expectNoTsError(screen.queryByText(options.deletedText)).not.toBeInTheDocument();
        }
      },
    });
  }
  if (options.afterClick) {
    await options.afterClick();
  }
}
