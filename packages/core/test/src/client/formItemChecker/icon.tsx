import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import { CommonFormItemCheckerOptions, getFormItemElement } from './common';
import { waitFor, screen } from '@testing-library/react';

export type IconCheckOptions = CommonFormItemCheckerOptions;

export async function iconChecker(options: IconCheckOptions) {
  const formItem = getFormItemElement({ Component: 'IconPicker', ...options });

  if (options.oldValue) {
    expect(formItem.querySelector('span[role=img]')).toHaveAttribute('aria-label', options.oldValue);
  }

  if (options.newValue) {
    await userEvent.click(formItem.querySelector('span[role=img]') || formItem.querySelector('button'));

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByRole('tooltip').querySelector('.ant-popover-title')).toHaveTextContent('Icon');
    });

    await userEvent.click(screen.getByRole('tooltip').querySelector(`span[aria-label="${options.newValue}"]`));

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    expect(formItem.querySelector('span[role=img]')).toHaveAttribute('aria-label', options.newValue);
  }
}
