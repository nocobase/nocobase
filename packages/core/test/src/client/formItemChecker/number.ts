import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';

export type NumberCheckOptions = CommonFormItemCheckerOptions;

export async function numberChecker(options: NumberCheckOptions) {
  const formItem = getFormItemElement({ Component: 'InputNumber', ...options });

  const input = formItem.querySelector('input');

  if (options.oldValue) {
    expect(input).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(input);
    await userEvent.type(input, String(options.newValue));
  }
}
