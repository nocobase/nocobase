import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';

export interface CollectionFieldCheckOptions extends CommonFormItemCheckerOptions {
  field: string;
}

export async function collectionFieldChecker(options: CollectionFieldCheckOptions) {
  const formItem = getFormItemElement({ Component: 'CollectionField', label: options.field, ...options });

  const input = formItem.querySelector('input');

  if (options.oldValue) {
    expect(input).toHaveValue(options.oldValue);
  }

  if (options.newValue) {
    await userEvent.clear(input);
    await userEvent.type(input, options.newValue);
  }
}
