import type { ReactElement } from 'react';
import { renderWithApp, type RenderedApp } from '@nocobase/app-testing/client';
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
const subscriptions = new Set<RealtimeWatchOptions<unknown>>();
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import {
  act,
  fireEvent,
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
  listFolderChoices: vi.fn(),
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
  previewSyncFolders: vi.fn(),
}));

vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));

import MailAccountsPage from '../../client/pages/mail-accounts-page.js';

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
    mail.listFolderChoices.mockResolvedValue({
      folders: folders(),
      complete: true,
      failed: false,
      initialSyncCompleted: true,
    });
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

  it('refreshes sync progress after transient errors exhaust automatic retries', async () => {
    const run = {
      id: 'run-1',
      accountId: 'account-1',
      status: 'running',
      phase: 'incremental',
      processedMessages: 0,
      processedPages: 0,
    };
    mail.startSync.mockResolvedValue(run);
    mail.getSyncRun.mockRejectedValue(new Error('Temporary status outage'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = await renderPage(<MailAccountsPage />);
    const sync = await screen.findByRole('button', { name: 'Sync' });
    await confirmSync(sync);
    vi.useFakeTimers();
    try {
      await act(async () => {});
      act(() => {
        for (const subscription of subscriptions) subscription.onReady?.();
      });
      await act(async () => vi.advanceTimersByTimeAsync(30_000));
      expect(mail.getSyncRun).toHaveBeenCalledTimes(4);
      // The run still counts as active, so account actions other than the scope dialog wait for it.
      expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
      expect(screen.getByText('Temporary status outage')).toBeVisible();

      mail.getSyncRun.mockResolvedValue({ ...run, status: 'completed' });
      act(() => {
        for (const subscription of subscriptions)
          subscription.onEvent?.({
            type: 'event',
            topic: 'mail',
            payload: { kind: 'mail.changed' },
            publishedAt: new Date().toISOString(),
          });
      });
      await act(async () => vi.advanceTimersByTimeAsync(120_000));
      expect(mail.getSyncRun).toHaveBeenCalledTimes(4);

      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await act(async () => vi.advanceTimersByTimeAsync(1_000));
      expect(screen.getByRole('button', { name: 'Deactivate' })).toBeEnabled();
      expect(screen.queryByText('Temporary status outage')).toBeNull();
      expect(mail.startSync).toHaveBeenCalledTimes(1);
    } finally {
      await app.unmount();
      vi.useRealTimers();
      log.mockRestore();
    }
  });

  it('resumes removal notifications after manually refreshing an exhausted reader', async () => {
    const accounts = (await mail.listAccounts()).map(
      (account: { id: string }) => ({ ...account, status: 'removing' }),
    );
    mail.listAccounts.mockResolvedValue(accounts);
    const app = await renderPage(<MailAccountsPage />);
    await screen.findByRole('button', { name: 'Removing…' });
    // The rendered row can precede the effect that subscribes to removal updates.
    await waitFor(() => expect(subscriptions.size).toBe(1));
    mail.listAccounts
      .mockClear()
      .mockRejectedValue(new Error('Temporary account outage'));
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    try {
      act(() => {
        for (const subscription of subscriptions) subscription.onReady?.();
      });
      await act(async () => vi.advanceTimersByTimeAsync(30_000));
      expect(mail.listAccounts).toHaveBeenCalledTimes(4);

      mail.listAccounts.mockResolvedValue(accounts);
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await act(async () => vi.advanceTimersByTimeAsync(1_000));
      expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled();

      mail.listAccounts.mockResolvedValue([]);
      act(() => {
        for (const subscription of subscriptions)
          subscription.onEvent?.({
            type: 'event',
            topic: 'mail',
            payload: { kind: 'mail.changed' },
            publishedAt: new Date().toISOString(),
          });
      });
      await act(async () => vi.advanceTimersByTimeAsync(1_000));
      expect(screen.getByText('No accounts connected')).toBeVisible();
    } finally {
      await app.unmount();
      vi.useRealTimers();
      log.mockRestore();
    }
  });

  it('shows durable removal failure, disables account actions, and refreshes after the removal notification', async () => {
    const accounts = await mail.listAccounts();
    mail.listAccounts.mockResolvedValue(
      accounts.map((account: { id: string }) => ({
        ...account,
        status: 'removing',
        removalFailed: true,
      })),
    );
    const app = await renderPage(<MailAccountsPage />);
    expect(
      await screen.findByText('Removal failed; retrying automatically'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Removing…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeDisabled();
    await waitFor(() => expect(subscriptions.size).toBe(1));
    vi.useFakeTimers();
    try {
      mail.listAccounts.mockResolvedValue([]);
      act(() => {
        for (const subscription of subscriptions)
          subscription.onEvent?.({
            type: 'event',
            topic: 'mail',
            payload: { kind: 'mail.changed' },
            publishedAt: new Date().toISOString(),
          });
      });
      // Complete the notification's debounce without waiting for real time or the 60-second fallback refresh.
      await act(async () => vi.advanceTimersByTimeAsync(1_000));
      expect(screen.getByText('No accounts connected')).toBeVisible();
    } finally {
      await app.unmount();
      vi.useRealTimers();
    }
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
    await renderPage(<MailAccountsPage />);
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
    await renderPage(<MailAccountsPage />);
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
      name: 'Signature text',
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
    await renderPage(<MailAccountsPage />);
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

    await renderPage(<MailAccountsPage />);
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

    await renderPage(<MailAccountsPage />);

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
      phase: 'preparing',
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
    await confirmSync(syncButton);
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

    await renderPage(<MailAccountsPage />);

    expect(await screen.findByText('2026-01-15')).toBeVisible();
    expect(
      screen.queryByLabelText('Initial sync after: sender@example.com'),
    ).not.toBeInTheDocument();
    expect(mail.updateAccount).not.toHaveBeenCalled();
  });

  it('opens template management from the account page', async () => {
    await renderPage(<MailAccountsPage />);

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

    await renderPage(<MailAccountsPage />);
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

    await renderPage(<MailAccountsPage />);
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

  it('confirms the scope of a newly connected account before its first import', async () => {
    const pending = {
      ...(await mail.listAccounts())[0],
      initialSyncReceivedAfter: '2026-01-15T00:00:00.000Z',
      syncFolderIds: [],
    };
    mail.listAccounts.mockResolvedValue([pending]);
    mail.listFolderChoices.mockResolvedValue({
      folders: folders(),
      complete: true,
      failed: false,
      initialSyncCompleted: false,
    });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...pending,
      syncFolderIds: input.syncFolderIds ?? undefined,
    }));
    await renderPage(<MailAccountsPage />);

    expect(
      screen.queryByRole('button', { name: 'Folders' }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Choose folders to start syncing',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      within(dialog).getByText(
        'The account is connected. Confirm the scope to start the first sync.',
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByText('Syncs messages received since 2026-01-15.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(mail.listFolderChoices).toHaveBeenCalledWith('account-1'),
    );
    expect(
      within(dialog).getByRole('radio', { name: /^Entire mailbox/ }),
    ).toBeChecked();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole('radio', { name: /^Selected folders/ }),
    );
    expect(within(dialog).getByText('3 of 3 folders selected')).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Deselect all' }),
    );
    expect(within(dialog).getByText('0 of 3 folders selected')).toBeVisible();
    expect(
      within(dialog).getByText('Select at least one folder.'),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    ).toBeDisabled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Select all' }));
    expect(within(dialog).getByText('3 of 3 folders selected')).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Deselect all' }),
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Sent' }));
    expect(
      within(dialog).getByText(/your own replies may be missing/),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );

    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX', 'Archive'],
      }),
    );
    // Nothing is stored yet, so a new account is never asked to confirm deletions; saving schedules its import.
    expect(mail.previewSyncFolders).not.toHaveBeenCalled();
    expect(mail.startSync).not.toHaveBeenCalled();
  });

  it('starts an incremental sync when an existing account keeps its scope', async () => {
    mail.startSync.mockResolvedValue({
      id: 'run-1',
      accountId: 'account-1',
      status: 'pending',
      phase: 'incremental',
      processedMessages: 0,
      processedPages: 0,
    });
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      within(dialog).getByText(
        'Confirm the folders to sync. Automatic syncs will use the same scope.',
      ),
    ).toBeVisible();
    expect(
      await within(dialog).findByText(
        'Syncs new and changed messages since the last sync.',
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('radio', { name: /^Entire mailbox/ }),
    ).toBeChecked();
    expect(mail.startSync).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );

    await waitFor(() => expect(mail.startSync).toHaveBeenCalledTimes(1));
    expect(mail.startSync.mock.calls[0][0]).toMatchObject({
      accountId: 'account-1',
    });
    expect(mail.updateAccount).not.toHaveBeenCalled();
    expect(mail.previewSyncFolders).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    // The scope stays reachable while the run is active.
    expect(screen.getByRole('button', { name: 'Sync' })).toBeEnabled();
  });

  it('follows the active run for an unchanged scope and replaces it once for a changed one', async () => {
    const run = {
      id: 'run-1',
      accountId: 'account-1',
      status: 'running',
      phase: 'history',
      processedMessages: 10,
      processedPages: 1,
    };
    // The scheduler answers with the run already in progress.
    mail.startSync.mockResolvedValue(run);
    mail.getSyncRun.mockResolvedValue(run);
    mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 0 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
    }));
    await renderPage(<MailAccountsPage />);

    await confirmSync(await screen.findByRole('button', { name: 'Sync' }));
    const sync = screen.getByRole('button', { name: 'Sync' });
    expect(sync).toBeEnabled();
    await confirmSync(sync);
    expect(mail.startSync).toHaveBeenCalledTimes(2);
    expect(mail.updateAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX', 'Sent'],
      }),
    );
    // Saving the scope replaces the active run on the server; no further sync request follows.
    expect(mail.updateAccount).toHaveBeenCalledTimes(1);
    expect(mail.startSync).toHaveBeenCalledTimes(2);
  });

  it.each(['completed', 'failed'] as const)(
    'follows the initial run a changed scope scheduled from the first confirmation until it is %s',
    async (outcome) => {
      const initial = {
        id: 'run-initial',
        accountId: 'account-1',
        mode: 'initial',
        status: 'pending',
        phase: 'preparing',
        processedMessages: 0,
        processedPages: 0,
      };
      mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 0 });
      mail.updateAccount.mockImplementation(async (input) => ({
        ...(await mail.listAccounts())[0],
        syncFolderIds: input.syncFolderIds,
        syncRun: initial,
      }));
      mail.getSyncRun.mockResolvedValue({
        ...initial,
        status: 'running',
        phase: 'history',
        processedMessages: 4,
        processedPages: 1,
      });
      await renderPage(<MailAccountsPage />);

      fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Confirm sync scope',
      });
      fireEvent.click(
        await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
      );
      fireEvent.click(
        within(dialog).getByRole('checkbox', { name: 'Archive' }),
      );
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Confirm and sync' }),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );

      // The first confirmation already shows the run the server scheduled.
      expect(screen.getByText('0 messages in 0 batches')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Deactivate' })).toBeDisabled();

      notifyMailChanged();
      expect(await screen.findByText('4 messages in 1 batches')).toBeVisible();

      mail.getSyncRun.mockResolvedValue({
        ...initial,
        status: outcome,
        phase: outcome === 'completed' ? 'completed' : 'history',
        processedMessages: 7,
        processedPages: 2,
      });
      notifyMailChanged();
      expect(await screen.findByText('7 messages in 2 batches')).toBeVisible();
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Deactivate' }),
        ).toBeEnabled(),
      );
      expect(mail.updateAccount).toHaveBeenCalledTimes(1);
      expect(mail.startSync).not.toHaveBeenCalled();
      expect(
        mail.getSyncRun.mock.calls.every(([id]) => id === 'run-initial'),
      ).toBe(true);
    },
  );

  it('stops following a run that a changed scope replaced, also when its status arrives late', async () => {
    const previous = {
      id: 'run-previous',
      accountId: 'account-1',
      mode: 'incremental',
      status: 'running',
      phase: 'incremental',
      processedMessages: 3,
      processedPages: 1,
    };
    const initial = {
      id: 'run-initial',
      accountId: 'account-1',
      mode: 'initial',
      status: 'pending',
      phase: 'preparing',
      processedMessages: 0,
      processedPages: 0,
    };
    mail.startSync.mockResolvedValue(previous);
    mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 0 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
      syncRun: initial,
    }));
    // The status of the previous run is still on its way when the scope changes.
    let answerPrevious: (run: unknown) => void = () => {};
    mail.getSyncRun.mockImplementation(
      (id: string) =>
        new Promise((resolve) => {
          if (id === 'run-previous') answerPrevious = resolve;
          else resolve({ ...initial, status: 'running', processedMessages: 5 });
        }),
    );
    await renderPage(<MailAccountsPage />);

    await confirmSync(await screen.findByRole('button', { name: 'Sync' }));
    expect(screen.getByText('3 messages in 1 batches')).toBeVisible();
    notifyMailChanged();
    await waitFor(() =>
      expect(mail.getSyncRun).toHaveBeenCalledWith('run-previous'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    expect(await screen.findByText('0 messages in 0 batches')).toBeVisible();

    // The server cancelled the previous run in favour of the initial one; its late answer changes nothing.
    await act(async () => answerPrevious({ ...previous, status: 'cancelled' }));
    expect(screen.getByText('0 messages in 0 batches')).toBeVisible();
    expect(screen.queryByText('Cancelled')).toBeNull();

    mail.getSyncRun.mockClear();
    notifyMailChanged();
    expect(await screen.findByText('5 messages in 0 batches')).toBeVisible();
    expect(mail.getSyncRun.mock.calls).toEqual([['run-initial']]);
    expect(mail.updateAccount).toHaveBeenCalledTimes(1);
    expect(mail.startSync).toHaveBeenCalledTimes(1);
  });

  it('shows no error of a replaced run whose status request fails late', async () => {
    const previous = {
      id: 'run-previous',
      accountId: 'account-1',
      mode: 'incremental',
      status: 'running',
      phase: 'incremental',
      processedMessages: 3,
      processedPages: 1,
    };
    const initial = {
      id: 'run-initial',
      accountId: 'account-1',
      mode: 'initial',
      status: 'pending',
      phase: 'preparing',
      processedMessages: 0,
      processedPages: 0,
    };
    mail.startSync.mockResolvedValue(previous);
    mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 0 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
      syncRun: initial,
    }));
    let failPrevious: (cause: unknown) => void = () => {};
    mail.getSyncRun.mockImplementation(
      (id: string) =>
        new Promise((resolve, reject) => {
          if (id === 'run-previous') failPrevious = reject;
          else resolve({ ...initial, status: 'running', processedMessages: 5 });
        }),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await renderPage(<MailAccountsPage />);
      await confirmSync(await screen.findByRole('button', { name: 'Sync' }));
      notifyMailChanged();
      await waitFor(() =>
        expect(mail.getSyncRun).toHaveBeenCalledWith('run-previous'),
      );

      fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Confirm sync scope',
      });
      fireEvent.click(
        await within(dialog).findByRole('radio', {
          name: /^Selected folders/,
        }),
      );
      fireEvent.click(
        within(dialog).getByRole('checkbox', { name: 'Archive' }),
      );
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Confirm and sync' }),
      );
      expect(await screen.findByText('0 messages in 0 batches')).toBeVisible();

      // The cancelled run's request fails only now; nothing of it reaches the page or is retried.
      await act(async () =>
        failPrevious(new Error('Status of the replaced run failed')),
      );
      mail.getSyncRun.mockClear();
      notifyMailChanged();
      expect(await screen.findByText('5 messages in 0 batches')).toBeVisible();
      expect(
        screen.queryByText('Status of the replaced run failed'),
      ).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(mail.getSyncRun.mock.calls).toEqual([['run-initial']]);
      expect(mail.updateAccount).toHaveBeenCalledTimes(1);
      expect(mail.startSync).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  it('keeps a saved scope whose folder was deleted on the server when the owner changes nothing', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        ...(await mail.listAccounts())[0],
        syncFolderIds: ['INBOX', 'Archive'],
      },
    ]);
    mail.listFolderChoices.mockResolvedValue({
      folders: folders().filter(
        (folder) => folder.providerFolderId !== 'Archive',
      ),
      complete: true,
      failed: false,
      initialSyncCompleted: true,
    });
    mail.startSync.mockResolvedValue({
      id: 'run-1',
      accountId: 'account-1',
      status: 'pending',
      phase: 'incremental',
      processedMessages: 0,
      processedPages: 0,
    });
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      await within(dialog).findByText(
        'Syncs new and changed messages since the last sync.',
      ),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() => expect(mail.startSync).toHaveBeenCalledTimes(1));
    expect(mail.updateAccount).not.toHaveBeenCalled();
    expect(mail.previewSyncFolders).not.toHaveBeenCalled();
  });

  it('ignores a deletion count that arrives after the dialog was closed, also once it is reopened', async () => {
    const answers: ((value: { removedMessageCount: number }) => void)[] = [];
    mail.previewSyncFolders.mockImplementation(
      () =>
        new Promise<{ removedMessageCount: number }>((resolve) =>
          answers.push(resolve),
        ),
    );
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    let dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() => expect(answers).toHaveLength(1));
    // The choice changes and the dialog closes before the count arrives.
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Sent' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );

    // Reopened, the owner narrows again; the first opening's count arrives meanwhile and is ignored.
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    dialog = await screen.findByRole('dialog', { name: 'Confirm sync scope' });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() => expect(answers).toHaveLength(2));
    await act(async () => answers[0]({ removedMessageCount: 0 }));
    expect(mail.previewSyncFolders).toHaveBeenCalledTimes(2);
    expect(mail.updateAccount).not.toHaveBeenCalled();
    expect(mail.startSync).not.toHaveBeenCalled();

    // The current opening still gets its own count.
    await act(async () => answers[1]({ removedMessageCount: 5 }));
    expect(
      await within(dialog).findByText(/^This change deletes 5 local messages/),
    ).toBeVisible();
    expect(mail.updateAccount).not.toHaveBeenCalled();
  });

  it('starts no sync when the scope is switched back during a preview and the dialog is closed', async () => {
    let answer!: (value: { removedMessageCount: number }) => void;
    mail.previewSyncFolders.mockImplementation(
      () =>
        new Promise<{ removedMessageCount: number }>(
          (resolve) => (answer = resolve),
        ),
    );
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() => expect(mail.previewSyncFolders).toHaveBeenCalled());
    // Back to the saved scope, which would start an ordinary sync, then closed.
    fireEvent.click(
      within(dialog).getByRole('radio', { name: /^Entire mailbox/ }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await act(async () => answer({ removedMessageCount: 0 }));

    expect(mail.previewSyncFolders).toHaveBeenCalledTimes(1);
    expect(mail.updateAccount).not.toHaveBeenCalled();
    expect(mail.startSync).not.toHaveBeenCalled();
  });

  it('previews again when the choice changes while a deletion count is on its way', async () => {
    let answer!: (value: { removedMessageCount: number }) => void;
    mail.previewSyncFolders
      .mockImplementationOnce(
        () =>
          new Promise<{ removedMessageCount: number }>(
            (resolve) => (answer = resolve),
          ),
      )
      .mockResolvedValueOnce({ removedMessageCount: 20 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
    }));
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() =>
      expect(mail.previewSyncFolders).toHaveBeenCalledWith('account-1', [
        'INBOX',
        'Sent',
      ]),
    );
    // Sent is unchecked before the count for Archive alone arrives.
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Sent' }));
    act(() => answer({ removedMessageCount: 12 }));

    expect(
      await within(dialog).findByText(/^This change deletes 20 local messages/),
    ).toBeVisible();
    expect(mail.previewSyncFolders).toHaveBeenLastCalledWith('account-1', [
      'INBOX',
    ]);
    expect(within(dialog).queryByText(/deletes 12 local/)).toBeNull();
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: 'Delete local messages and sync',
      }),
    );
    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX'],
      }),
    );
    expect(mail.updateAccount).toHaveBeenCalledTimes(1);
  });

  it('imports from the saved date when the first sync of an unchanged scope has not completed', async () => {
    const account = {
      ...(await mail.listAccounts())[0],
      initialSyncReceivedAfter: '2026-01-15T00:00:00.000Z',
      syncFolderIds: ['INBOX'],
    };
    mail.listAccounts.mockResolvedValue([account]);
    mail.listFolderChoices.mockResolvedValue({
      folders: folders(),
      complete: true,
      failed: false,
      initialSyncCompleted: false,
    });
    mail.startSync.mockResolvedValue({
      id: 'run-1',
      accountId: 'account-1',
      status: 'pending',
      phase: 'preparing',
      processedMessages: 0,
      processedPages: 0,
    });
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      within(dialog).getByRole('radio', { name: /^Selected folders/ }),
    ).toBeChecked();
    expect(
      await within(dialog).findByText('1 of 3 folders selected'),
    ).toBeVisible();
    expect(
      within(dialog).getByText('Syncs messages received since 2026-01-15.'),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() =>
      expect(mail.startSync).toHaveBeenCalledWith({
        accountId: 'account-1',
        receivedAfter: '2026-01-15T00:00:00.000Z',
      }),
    );
    expect(mail.updateAccount).not.toHaveBeenCalled();
  });

  it('treats every current folder as a different scope from the entire mailbox', async () => {
    mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 0 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
    }));
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    expect(within(dialog).getByText('3 of 3 folders selected')).toBeVisible();
    expect(
      within(dialog).getByText(
        'Syncs again with the new scope; existing messages are not added twice.',
      ),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX', 'Sent', 'Archive'],
      }),
    );
    // Saving the new scope schedules its initial sync; no second request follows.
    expect(mail.updateAccount).toHaveBeenCalledTimes(1);
    expect(mail.startSync).not.toHaveBeenCalled();
  });

  it('offers to list the folders again when the listing stopped', async () => {
    const pending = {
      ...(await mail.listAccounts())[0],
      syncFolderIds: [],
    };
    mail.listAccounts.mockResolvedValue([pending]);
    mail.listFolderChoices.mockResolvedValue({
      folders: folders().slice(0, 1),
      complete: false,
      failed: true,
      initialSyncCompleted: false,
    });
    await renderPage(<MailAccountsPage />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Choose folders to start syncing',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      await within(dialog).findByText(
        'The folder list could not be read from the mail server.',
      ),
    ).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    ).toBeDisabled();

    mail.listFolderChoices.mockResolvedValue({
      folders: folders(),
      complete: true,
      failed: false,
      initialSyncCompleted: false,
    });
    mail.startSync.mockResolvedValue({ id: 'run-2', status: 'pending' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Try again' }));
    await waitFor(() =>
      expect(mail.startSync).toHaveBeenCalledWith({ accountId: 'account-1' }),
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Confirm and sync' }),
      ).toBeEnabled(),
    );
    expect(
      within(dialog).getByRole('radio', { name: /^Entire mailbox/ }),
    ).toBeChecked();
  });

  it('waits for every page of the folder list before a connected account can start', async () => {
    const pending = {
      ...(await mail.listAccounts())[0],
      provider: { type: 'microsoft', name: 'microsoft' },
      syncFolderIds: [],
    };
    mail.listAccounts.mockResolvedValue([pending]);
    // The first page and its child folders arrived; the run is still reading the next page.
    mail.listFolderChoices.mockResolvedValue({
      folders: folders().slice(0, 2),
      complete: false,
      failed: false,
      initialSyncCompleted: false,
    });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...pending,
      syncFolderIds: input.syncFolderIds ?? undefined,
    }));
    await renderPage(<MailAccountsPage />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Choose folders to start syncing',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    expect(
      await within(dialog).findByText(
        'Getting the folder list from the mail server…',
      ),
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole('radio', { name: /^Selected folders/ }),
    );
    expect(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    ).toBeDisabled();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();

    mail.listFolderChoices.mockResolvedValue({
      folders: folders(),
      complete: true,
      failed: false,
      initialSyncCompleted: false,
    });
    act(() => {
      for (const subscription of subscriptions)
        subscription.onEvent?.({
          type: 'event',
          topic: 'mail',
          payload: { kind: 'mail.changed' },
          publishedAt: new Date().toISOString(),
        });
    });
    expect(
      await within(dialog).findByText('3 of 3 folders selected'),
    ).toBeVisible();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX', 'Sent'],
      }),
    );
  });

  it('continues with the account an OAuth Provider connected, not another waiting one', async () => {
    const base = (await mail.listAccounts())[0];
    // Account A was connected earlier and left waiting; it sorts before B.
    mail.listAccounts.mockResolvedValue([
      { ...base, id: 'account-a', address: 'a@example.com', syncFolderIds: [] },
      { ...base, id: 'account-b', address: 'b@example.com', syncFolderIds: [] },
    ]);
    const previous = window.location.href;
    window.history.replaceState(
      null,
      '',
      '/?mailAuthorization=success&mailAccountId=account-b',
    );
    try {
      await renderPage(<MailAccountsPage />);
      const dialog = await screen.findByRole('dialog', {
        name: 'Confirm sync scope',
      });
      expect(within(dialog).getByText('b@example.com')).toBeVisible();
      await waitFor(() =>
        expect(mail.listFolderChoices).toHaveBeenCalledWith('account-b'),
      );
      expect(mail.listFolderChoices).not.toHaveBeenCalledWith('account-a');
    } finally {
      window.history.replaceState(null, '', previous);
    }
  });

  it('confirms how many local messages a narrower scope deletes and saves nothing when cancelled', async () => {
    mail.previewSyncFolders.mockResolvedValue({ removedMessageCount: 12 });
    mail.updateAccount.mockImplementation(async (input) => ({
      ...(await mail.listAccounts())[0],
      syncFolderIds: input.syncFolderIds,
    }));
    await renderPage(<MailAccountsPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Sync' }));
    let dialog = await screen.findByRole('dialog', {
      name: 'Confirm sync scope',
    });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );

    expect(
      await within(dialog).findByText(
        'This change deletes 12 local messages and their local data. Messages on the mail server are not deleted, and messages still in a selected folder are kept.',
      ),
    ).toBeVisible();
    expect(mail.previewSyncFolders).toHaveBeenCalledWith('account-1', [
      'INBOX',
      'Sent',
    ]);
    // Going back and cancelling keeps the saved scope and starts nothing.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(mail.updateAccount).not.toHaveBeenCalled();
    expect(mail.startSync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    dialog = await screen.findByRole('dialog', { name: 'Confirm sync scope' });
    fireEvent.click(
      await within(dialog).findByRole('radio', { name: /^Selected folders/ }),
    );
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Archive' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm and sync' }),
    );
    fireEvent.click(
      await within(dialog).findByRole('button', {
        name: 'Delete local messages and sync',
      }),
    );
    await waitFor(() =>
      expect(mail.updateAccount).toHaveBeenCalledWith({
        accountId: 'account-1',
        syncFolderIds: ['INBOX', 'Sent'],
      }),
    );
    expect(mail.updateAccount).toHaveBeenCalledTimes(1);
    expect(mail.startSync).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('requires confirmation before removing an account', async () => {
    await renderPage(<MailAccountsPage />);

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

/** Open the sync scope dialog from an account's Sync button and confirm it without changing the scope. */
function notifyMailChanged(): void {
  act(() => {
    for (const subscription of subscriptions)
      subscription.onEvent?.({
        type: 'event',
        topic: 'mail',
        payload: { kind: 'mail.changed' },
        publishedAt: new Date().toISOString(),
      });
  });
}

async function confirmSync(button: HTMLElement): Promise<void> {
  fireEvent.click(button);
  const dialog = await screen.findByRole('dialog', {
    name: 'Confirm sync scope',
  });
  const submit = within(dialog).getByRole('button', {
    name: 'Confirm and sync',
  });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}

function folders() {
  return [
    ['INBOX', 'Inbox', 'inbox'],
    ['Sent', 'Sent', 'sent'],
    ['Archive', 'Archive', 'archive'],
  ].map(([providerFolderId, name, type]) => ({
    id: `folder-${providerFolderId}`,
    accountId: 'account-1',
    providerFolderId,
    name,
    type,
    kind: 'folder',
    synced: true,
  }));
}

async function renderPage(ui: ReactElement): Promise<RenderedApp> {
  return renderWithApp(ui, {
    namespace: MAIL_PLUGIN_NS,
    namespaces: { [MAIL_PLUGIN_NS]: locales },
    services: (app) => {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((_topic, options = {}) => {
        const callbacks = options as RealtimeWatchOptions<unknown>;
        subscriptions.add(callbacks);
        return {
          state: 'subscribed',
          error: undefined,
          retry: vi.fn(),
          close: () => {
            subscriptions.delete(callbacks);
          },
        };
      });
    },
  });
}
