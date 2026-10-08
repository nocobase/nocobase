import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({
  listManagedAccounts: vi.fn(),
}));

vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));

import MailSettingsPage from '../../client/pages/mail-settings-page.js';

describe('mail settings page', () => {
  beforeEach(() => {
    mail.listManagedAccounts.mockReset();
  });

  it('renders managed accounts in a table with owner and sync metadata', async () => {
    mail.listManagedAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        ownerName: 'alice',
        provider: { type: 'gmail', name: 'google' },
        address: 'sender@example.com',
        displayName: 'Support inbox',
        scopes: [],
        status: 'active',
        initialSyncReceivedAfter: '2026-01-15T00:00:00.000Z',
        canSync: true,
      },
    ]);

    render(<MailSettingsPage />);

    const table = await screen.findByRole('table');
    expect(table).toBeVisible();
    expect(
      within(table).getByRole('columnheader', { name: 'Account' }),
    ).toBeVisible();
    expect(
      within(table).getByRole('columnheader', { name: 'Owner' }),
    ).toBeVisible();
    expect(within(table).getByText('sender@example.com')).toBeVisible();
    expect(within(table).getByText('Support inbox')).toBeVisible();
    expect(within(table).getByText('alice')).toBeVisible();
    expect(within(table).queryByText(/User ID:/)).not.toBeInTheDocument();
    expect(within(table).getByText('2026-01-15')).toBeVisible();
  });
  it('selects account pages and resets to the first page when the page size changes', async () => {
    mail.listManagedAccounts.mockResolvedValue(
      Array.from({ length: 61 }, (_, index) => ({
        id: `account-${index}`,
        userId: 'owner',
        address: `sender-${index}@example.com`,
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
      })),
    );
    render(<MailSettingsPage />);
    expect(
      within(await screen.findByRole('table')).getAllByRole('row'),
    ).toHaveLength(21);
    expect(screen.getAllByText(/User ID:/)).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(screen.getByText('sender-60@example.com')).toBeVisible();
    expect(screen.queryByText('sender-0@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows per page' }), {
      target: { value: '50' },
    });
    expect(screen.getByText('sender-0@example.com')).toBeVisible();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(
      51,
    );
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
  });
});
