import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';
import { expectNoTsError } from '../utils';

export type NumberCheckOptions = CommonFormItemCheckerOptions;

export async function numberChecker(options: NumberCheckOptions) {
  const formItem = getFormItemElement({ Component: 'InputNumber', ...options });

  const input = formItem.querySelector('input');

  if (options.oldValue) {
    expectNoTsError(input).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(input);
    await userEvent.type(input, String(options.newValue));
  }
}
