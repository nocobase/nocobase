import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';
import { expectNoTsError } from '../utils';

export type TextareaCheckOptions = CommonFormItemCheckerOptions;

export async function textareaChecker(options: TextareaCheckOptions) {
  const formItem = getFormItemElement({ Component: 'Input.TextArea', ...options });

  const textarea = formItem.querySelector('textarea');

  if (options.oldValue) {
    expectNoTsError(textarea).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(textarea);
    await userEvent.type(textarea, options.newValue);
  }
}
