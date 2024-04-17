import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';

export type InputCheckOptions = CommonFormItemCheckerOptions;

export async function inputChecker(options: InputCheckOptions) {
  const formItem = getFormItemElement({ ...options, Component: 'Input' });

  const input = formItem.querySelector('input');

  if (options.oldValue) {
    expect(input).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(input);
    await userEvent.type(input, options.newValue);
  }
}
