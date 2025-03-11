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
import { waitFor, screen } from '@testing-library/react';
import { expectNoTsError } from '../utils';

export type IconCheckOptions = CommonFormItemCheckerOptions;

export async function iconChecker(options: IconCheckOptions) {
  const formItem = getFormItemElement({ Component: 'IconPicker', ...options });

  if (options.oldValue) {
    expectNoTsError(formItem.querySelector('span[role=img]')).toHaveAttribute('aria-label', options.oldValue);
  }

  if (options.newValue) {
    await userEvent.click(formItem.querySelector('span[role=img]') || formItem.querySelector('button'));

    await waitFor(() => {
      expectNoTsError(screen.queryByRole('tooltip')).toBeInTheDocument();
      // expectNoTsError(screen.getByRole('tooltip').querySelector('.ant-popover-title')).toHaveTextContent('Icon');
    });

    await userEvent.click(screen.getByRole('tooltip').querySelector(`span[aria-label="${options.newValue}"]`));

    await waitFor(() => {
      expectNoTsError(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    expectNoTsError(formItem.querySelector('span[role=img]')).toHaveAttribute('aria-label', options.newValue);
  }
}
