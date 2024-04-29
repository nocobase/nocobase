import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';
import { expectNoTsError } from '../utils';

export type InputCheckOptions = CommonFormItemCheckerOptions;

export async function inputChecker(options: InputCheckOptions) {
  const formItem = getFormItemElement({ Component: 'Input', ...options });

  const input = formItem.querySelector('input');

  if (options.oldValue) {
    expectNoTsError(input).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(input);
    await userEvent.type(input, options.newValue);
  }
}
