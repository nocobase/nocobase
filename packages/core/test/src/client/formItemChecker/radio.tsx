/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';
import { waitFor } from '@testing-library/react';
import { expectNoTsError } from '../utils';

export type RadioCheckOptions = CommonFormItemCheckerOptions;

export async function radioChecker(options: CommonFormItemCheckerOptions) {
  const formItem = getFormItemElement({ Component: 'Radio.Group', ...options });

  const radioGroup = formItem.querySelector('.ant-radio-group');

  if (options.oldValue) {
    expectNoTsError(radioGroup.querySelector('.ant-radio-wrapper-checked')).toHaveTextContent(options.oldValue);
  }

  if (options.newValue) {
    const el = [...radioGroup.querySelectorAll('.ant-radio-wrapper')].find((el) => el.textContent === options.newValue);

    expectNoTsError(el).toBeInTheDocument();

    await userEvent.click(el);

    await waitFor(() => {
      expectNoTsError(radioGroup.querySelector('.ant-radio-wrapper-checked')).toHaveTextContent(options.newValue);
    });
  }
}
