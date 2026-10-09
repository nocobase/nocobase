import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { format, parseISO } from 'date-fns';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function selectCalendarDate(label: string, date: string): void {
  const selectedDate = parseISO(date);
  fireEvent.click(screen.getByRole('button', { name: label }));

  for (let step = 0; step < 24; step += 1) {
    const caption = screen.getByRole('status');
    const visibleMonth = new Date(`${caption.textContent} 1`);
    if (
      visibleMonth.getFullYear() === selectedDate.getFullYear() &&
      visibleMonth.getMonth() === selectedDate.getMonth()
    ) {
      break;
    }
    fireEvent.click(
      screen.getByRole('button', {
        name:
          visibleMonth > selectedDate
            ? 'Go to the Previous Month'
            : 'Go to the Next Month',
      }),
    );
  }

  fireEvent.click(
    screen.getByRole('button', { name: format(selectedDate, 'PPPP') }),
  );
}

const mail = vi.hoisted(() => ({
  getSyncRun: vi.fn(),
  listAccounts: vi.fn(),
  listFolders: vi.fn(),
  listLabels: vi.fn(),
  listIdentities: vi.fn(),
  listProviders: vi.fn(),
  listSignatures: vi.fn(),
  listTemplates: vi.fn(),
  saveTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  createLabel: vi.fn(),
  updateLabel: vi.fn(),
  deleteLabel: vi.fn(),
  saveSignature: vi.fn(),
  deleteSignature: vi.fn(),
  removeAccount: vi.fn(),
  startAuthorization: vi.fn(),
  startSync: vi.fn(),
  updateAccount: vi.fn(),
}));

vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));

import MailAccountsDevPage from '../../client/pages/mail-accounts-dev-page.js';

describe('[UI][DATA] accounts, signatures, templates, and local labels', () => {
  beforeEach(() => {
    for (const mock of Object.values(mail)) mock.mockReset();
    mail.listProviders.mockResolvedValue([]);
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'sender@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listIdentities.mockResolvedValue([
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    mail.listFolders.mockResolvedValue([]);
    mail.listLabels.mockResolvedValue([]);
    mail.listSignatures.mockResolvedValue([]);
    mail.listTemplates.mockResolvedValue([]);
    mail.removeAccount.mockResolvedValue(undefined);
    mail.updateAccount.mockResolvedValue(undefined);
    mail.updateLabel.mockResolvedValue({
      id: 'label-1',
      name: 'Support updated',
      color: 'violet',
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });
    mail.deleteLabel.mockResolvedValue(undefined);
    mail.createLabel.mockResolvedValue({
      id: 'label-2',
      name: 'Customers',
      color: 'blue',
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });
    mail.saveSignature.mockResolvedValue({
      id: 'signature-1',
      accountId: 'account-1',
      name: 'Work',
      text: 'New signature',
      isDefault: true,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });
  });

  it('shows durable removal failure, disables account actions, and polls until removed', async () => {
    const accounts = await mail.listAccounts();
    mail.listAccounts.mockResolvedValue(
      accounts.map((account: { id: string }) => ({
        ...account,
        status: 'removing',
        removalFailed: true,
      })),
    );
    render(<MailAccountsDevPage />);
    expect(
      await screen.findByText('Removal failed; retrying automatically'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeDisabled();
    mail.listAccounts.mockResolvedValue([]);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });
    expect(await screen.findByText('No accounts connected')).toBeVisible();
  });

  it('confirms signature deletion in the drawer, preserves edits on cancel and retries failures', async () => {
    const signature = {
      id: 'signature-1',
      accountId: 'account-1',
      name: 'Work',
      text: 'Regards',
      isDefault: true,
    };
    mail.listSignatures.mockResolvedValue([signature]);
    let rejectDelete: ((reason: Error) => void) | undefined;
    mail.deleteSignature.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    render(<MailAccountsDevPage />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Signatures' }))[0],
    );
    const drawer = within(
      await screen.findByRole('dialog', { name: 'Signature management' }),
    );
    fireEvent.click(await drawer.findByRole('button', { name: /Work/ }));
    fireEvent.change(drawer.getByLabelText('Signature name'), {
      target: { value: 'Unsaved name' },
    });
    fireEvent.click(drawer.getByRole('button', { name: 'Delete signature' }));
    const firstDialog = within(
      await screen.findByRole('dialog', { name: 'Delete signature?' }),
    );
    expect(firstDialog.getByText('Work')).toBeVisible();
    expect(mail.deleteSignature).not.toHaveBeenCalled();
    fireEvent.click(firstDialog.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Delete signature?' }),
      ).not.toBeInTheDocument(),
    );
    expect(mail.deleteSignature).not.toHaveBeenCalled();
    expect(drawer.getByLabelText('Signature name')).toHaveValue('Unsaved name');
    fireEvent.click(drawer.getByRole('button', { name: 'Delete signature' }));
    const dialog = within(
      await screen.findByRole('dialog', { name: 'Delete signature?' }),
    );
    fireEvent.click(dialog.getByRole('button', { name: 'Delete signature' }));
    expect(dialog.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    fireEvent.click(dialog.getByRole('button', { name: 'Deleting…' }));
    expect(mail.deleteSignature).toHaveBeenCalledTimes(1);
    rejectDelete?.(new Error('Delete unavailable'));
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'Delete unavailable',
    );
    expect(drawer.getByLabelText('Signature name')).toHaveValue('Unsaved name');
    mail.deleteSignature.mockResolvedValue(undefined);
    mail.listSignatures.mockResolvedValue([]);
    fireEvent.click(dialog.getByRole('button', { name: 'Delete signature' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Delete signature?' }),
      ).not.toBeInTheDocument(),
    );
    expect(mail.deleteSignature).toHaveBeenCalledTimes(2);
    expect(mail.deleteSignature).toHaveBeenLastCalledWith(
      'account-1',
      'signature-1',
    );
    expect(drawer.getByLabelText('Signature name')).toHaveValue('');
    expect(
      drawer.queryByRole('button', { name: /Work/ }),
    ).not.toBeInTheDocument();
  });

  it('creates a named signature for an account', async () => {
    render(<MailAccountsDevPage />);
    const signatureButtons = await screen.findAllByRole('button', {
      name: 'Signatures',
    });
    expect(signatureButtons).toHaveLength(1);
    fireEvent.click(signatureButtons[0]);
    const signatureDrawer = await screen.findByRole('dialog', {
      name: 'Signature management',
    });
    expect(signatureDrawer).toBeVisible();
    expect(signatureDrawer).toHaveClass('fixed', 'inset-y-0', 'right-0');
    const name =
      await within(signatureDrawer).findByLabelText('Signature name');
    const signature = await within(signatureDrawer).findByRole('textbox', {
      name: 'Signature content',
    });
    fireEvent.change(name, { target: { value: 'Work' } });
    signature.innerHTML = '<p>New signature</p>';
    fireEvent.input(signature);
    fireEvent.click(
      within(signatureDrawer).getByRole('button', { name: 'Add signature' }),
    );

    await waitFor(() =>
      expect(mail.saveSignature).toHaveBeenCalledWith({
        accountId: 'account-1',
        name: 'Work',
        text: 'New signature',
        html: '<p>New signature</p>',
        isDefault: false,
      }),
    );
  });

  it('clears and restores the only signature default without reverting it on edit', async () => {
    let signature = {
      id: 'signature-1',
      accountId: 'account-1',
      name: 'Work',
      text: 'Regards',
      isDefault: true,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    };
    mail.listSignatures.mockImplementation(async () => [signature]);
    mail.saveSignature.mockImplementation(async (input) => {
      signature = { ...signature, ...input };
      return signature;
    });
    render(<MailAccountsDevPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Signatures' }));
    const drawer = within(
      await screen.findByRole('dialog', { name: 'Signature management' }),
    );
    fireEvent.click(await drawer.findByRole('button', { name: /Work/ }));
    const defaultBadge = drawer.getByRole('button', { name: 'Clear default' });
    expect(defaultBadge).toHaveTextContent(/^Default$/);
    expect(drawer.queryByText('Clear default')).not.toBeInTheDocument();
    expect(defaultBadge.parentElement?.closest('button')).toBeNull();
    fireEvent.click(defaultBadge);
    await drawer.findByRole('button', { name: 'Make default' });
    expect(mail.saveSignature).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: signature.id, isDefault: false }),
    );
    fireEvent.click(drawer.getByRole('button', { name: 'Save signature' }));
    await waitFor(() => expect(mail.saveSignature).toHaveBeenCalledTimes(2));
    expect(mail.saveSignature).toHaveBeenLastCalledWith(
      expect.objectContaining({ isDefault: false }),
    );
    await waitFor(() =>
      expect(
        drawer.getByRole('button', { name: 'Make default' }),
      ).toBeEnabled(),
    );
    fireEvent.click(drawer.getByRole('button', { name: 'Make default' }));
    await drawer.findByRole('button', { name: 'Clear default' });
    expect(mail.saveSignature).toHaveBeenLastCalledWith(
      expect.objectContaining({ isDefault: true }),
    );
  });

  it('selects and edits a signature from the management list', async () => {
    mail.listSignatures.mockResolvedValue([
      {
        id: 'signature-1',
        accountId: 'account-1',
        name: 'Work',
        text: 'Best regards',
        isDefault: true,
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);

    render(<MailAccountsDevPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Signatures' }));
    const signatureDrawer = await screen.findByRole('dialog', {
      name: 'Signature management',
    });
    const accountToggle = within(signatureDrawer).getByRole('button', {
      name: /sender@example\.com/,
    });
    expect(accountToggle).toHaveAttribute('aria-expanded', 'true');
    const signatureItem = await within(signatureDrawer).findByRole('button', {
      name: /Work/,
    });
    fireEvent.click(signatureItem);
    expect(signatureItem).toHaveAttribute('aria-current', 'true');
    fireEvent.click(accountToggle);
    expect(accountToggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(signatureDrawer).queryByRole('button', { name: /Work/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(accountToggle);
    expect(accountToggle).toHaveAttribute('aria-expanded', 'true');
    expect(signatureItem).toHaveAttribute('aria-current', 'true');
    fireEvent.change(within(signatureDrawer).getByLabelText('Signature name'), {
      target: { value: 'Work updated' },
    });
    fireEvent.click(
      within(signatureDrawer).getByRole('button', { name: 'Save signature' }),
    );

    await waitFor(() =>
      expect(mail.saveSignature).toHaveBeenCalledWith({
        accountId: 'account-1',
        id: 'signature-1',
        name: 'Work updated',
        text: 'Best regards',
        html: '<p>Best regards</p>',
        isDefault: true,
      }),
    );
  });

  it('keeps the connected account table as the default view', async () => {
    mail.listProviders.mockResolvedValue([
      {
        type: 'gmail',
        name: 'google',
        label: 'Gmail',
        connection: 'oauth',
        capabilities: {
          receive: true,
          send: true,
          incrementalSync: true,
          pushNotifications: false,
          folders: true,
          labels: false,
          drafts: false,
          moveMessage: false,
          aliases: false,
        },
      },
    ]);

    render(<MailAccountsDevPage />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Connect account' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeVisible();
    expect(
      screen.queryByLabelText('Mail account type'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Import messages received after'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect account' }));
    const accountDialog = await screen.findByRole('dialog', {
      name: 'Add mail account',
    });
    expect(accountDialog).toBeVisible();
    expect(accountDialog).toHaveClass('fixed', 'inset-y-0', 'right-0');
    expect(
      within(accountDialog).getByLabelText('Mail account type'),
    ).toBeVisible();
    expect(
      within(accountDialog).getByLabelText('Import messages received after'),
    ).toBeVisible();

    mail.startSync.mockResolvedValue({
      id: 'run-1',
      accountId: 'account-1',
      mode: 'initial',
      phase: 'folders',
      status: 'pending',
      policy: {
        receivedAfter: '2026-02-01T00:00:00.000Z',
        maxMessages: 10_000,
        batchSize: 100,
      },
      processedMessages: 0,
      processedPages: 0,
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-08T00:00:00.000Z',
    });
    selectCalendarDate('Import messages received after', '2026-02-01');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    const syncButton = screen.getByRole('button', { name: 'Sync' });
    expect(syncButton.querySelector('svg')).not.toBeInTheDocument();
    expect(syncButton.className).toBe(
      screen.getByRole('button', { name: 'Signatures' }).className,
    );
    fireEvent.click(syncButton);
    await waitFor(() =>
      expect(mail.startSync).toHaveBeenCalledWith({
        accountId: 'account-1',
        receivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    );
  });

  it('shows the saved initial sync date for each account', async () => {
    mail.listAccounts.mockResolvedValueOnce([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'sender@example.com',
        scopes: [],
        status: 'active',
        initialSyncReceivedAfter: '2026-01-15T00:00:00.000Z',
      },
    ]);

    render(<MailAccountsDevPage />);

    expect(await screen.findByText('2026-01-15')).toBeVisible();
    expect(
      screen.queryByLabelText('Initial sync after: sender@example.com'),
    ).not.toBeInTheDocument();
    expect(mail.updateAccount).not.toHaveBeenCalled();
  });

  it('opens template management from the account page', async () => {
    render(<MailAccountsDevPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));

    const templateDialog = await screen.findByRole('dialog', {
      name: 'Template management',
    });
    expect(templateDialog).toBeVisible();
    expect(templateDialog).toHaveClass('fixed', 'inset-y-0', 'right-0');
    expect(
      within(templateDialog).getByLabelText('Template name'),
    ).toBeVisible();
  });

  it('opens local label management and creates a label without an account', async () => {
    mail.listLabels.mockResolvedValue([
      {
        id: 'label-1',
        name: 'Support',
        color: 'orange',
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);

    render(<MailAccountsDevPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Labels' }));

    const labelDialog = await screen.findByRole('dialog', {
      name: 'Label management',
    });
    expect(labelDialog).toBeVisible();
    expect(await within(labelDialog).findByText('Support')).toBeVisible();
    expect(
      within(labelDialog).getByRole('region', { name: 'Labels' }),
    ).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    fireEvent.change(within(labelDialog).getByLabelText('Label name'), {
      target: { value: 'Customers' },
    });
    fireEvent.click(
      within(labelDialog).getByRole('button', { name: 'Choose Orange' }),
    );
    fireEvent.click(
      within(labelDialog).getByRole('button', { name: 'Add label' }),
    );

    await waitFor(() =>
      expect(mail.createLabel).toHaveBeenCalledWith('Customers', 'orange'),
    );
  });

  it('edits a label color and confirms deletion', async () => {
    mail.listLabels.mockResolvedValue([
      {
        id: 'label-1',
        name: 'Support',
        color: 'orange',
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);

    render(<MailAccountsDevPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Labels' }));
    const labelDialog = await screen.findByRole('dialog', {
      name: 'Label management',
    });
    fireEvent.click(
      await within(labelDialog).findByRole('button', { name: 'Edit Support' }),
    );
    expect(
      within(labelDialog).getByRole('button', { name: 'Edit Support' }),
    ).toHaveAttribute('aria-current', 'true');
    fireEvent.change(within(labelDialog).getByLabelText('Label name'), {
      target: { value: 'Support updated' },
    });
    fireEvent.click(
      within(labelDialog).getByRole('button', { name: 'Choose Violet' }),
    );
    fireEvent.click(
      within(labelDialog).getByRole('button', { name: 'Save label' }),
    );
    await waitFor(() =>
      expect(mail.updateLabel).toHaveBeenCalledWith({
        id: 'label-1',
        name: 'Support updated',
        color: 'violet',
      }),
    );

    fireEvent.click(
      await within(labelDialog).findByRole('button', {
        name: 'Delete Support updated',
      }),
    );
    const deleteDialog = await screen.findByRole('dialog', {
      name: 'Delete label?',
    });
    fireEvent.click(
      within(deleteDialog).getByRole('button', { name: 'Delete label' }),
    );
    await waitFor(() =>
      expect(mail.deleteLabel).toHaveBeenCalledWith('label-1'),
    );
  });

  it('requires confirmation before removing an account', async () => {
    render(<MailAccountsDevPage />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove account' }),
    );

    const removeDialog = await screen.findByRole('dialog', {
      name: 'Remove mail account?',
    });
    expect(removeDialog).toBeVisible();
    expect(
      within(removeDialog).getByText(/delete synchronized mail/),
    ).toBeVisible();
    expect(mail.removeAccount).not.toHaveBeenCalled();

    fireEvent.click(
      within(removeDialog).getByRole('button', { name: 'Cancel' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(mail.removeAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove account' }));
    const reopenedDialog = await screen.findByRole('dialog', {
      name: 'Remove mail account?',
    });
    fireEvent.click(
      within(reopenedDialog).getByRole('button', { name: 'Remove account' }),
    );

    await waitFor(() =>
      expect(mail.removeAccount).toHaveBeenCalledWith('account-1'),
    );
  });
});
