import { expect } from 'vitest';
import { waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormItemCheckOptions, checkFormItems } from '../formItemChecker';
import { sleep } from './utils';

export interface CheckModalOptions {
  triggerText?: string;
  modalTitle?: string;
  confirmTitle?: string;
  submitText?: string;
  contentText?: string;
  beforeCheck?: () => Promise<void> | void;
  customCheck?: () => Promise<void> | void;
  formItems?: FormItemCheckOptions[];
  afterSubmit?: () => Promise<void> | void;
}

export async function checkModal(options: CheckModalOptions) {
  const { triggerText, modalTitle, confirmTitle, submitText = 'OK', formItems = [] } = options;

  await waitFor(() => {
    expect(screen.queryByText(triggerText)).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText(triggerText));

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeInTheDocument();
  });

  const dialog = screen.getByRole('dialog');

  if (modalTitle) {
    expect(dialog.querySelector('.ant-modal-title')).toHaveTextContent(modalTitle);
  }

  if (confirmTitle) {
    expect(dialog.querySelector('.ant-modal-confirm-title')).toHaveTextContent(confirmTitle);
  }

  if (options.contentText) {
    expect(dialog).toHaveTextContent(options.contentText);
  }

  if (options.beforeCheck) {
    await options.beforeCheck();
  }

  if (options.customCheck) {
    await options.customCheck();
  }

  await checkFormItems(formItems);

  await userEvent.click(screen.getByText(submitText));

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  if (options.afterSubmit) {
    await sleep(100);
    await options.afterSubmit();
  }
}
