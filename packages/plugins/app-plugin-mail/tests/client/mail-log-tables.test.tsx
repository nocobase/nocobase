import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MailOwnSubmissionsTable } from '../../client/components/mail-log-tables.js';
import type { MailSubmissionLogView } from '../../client/mail-client.js';

function submission(
  id: string,
  values: Partial<MailSubmissionLogView> = {},
): MailSubmissionLogView {
  return {
    id,
    accountId: 'account-1',
    status: 'accepted',
    subject: `Subject ${id}`,
    recipients: [{ address: `${id}@example.com` }],
    createdAt: '2026-11-20T08:00:00.000Z',
    updatedAt: '2026-11-20T08:00:00.000Z',
    ...values,
  } as MailSubmissionLogView;
}

describe('own submissions table', () => {
  it('shows single and scheduled sends as rows and a bulk send as one row that opens to its recipients', () => {
    render(
      <MailOwnSubmissionsTable
        accountLabel={() => 'me@example.com'}
        actions={{}}
        loading={false}
        submissions={[
          submission('single'),
          submission('later', {
            status: 'pending',
            scheduledAt: '2099-01-01T00:00:00.000Z',
          }),
          ...['a', 'b', 'c'].map((id, index) =>
            submission(`bulk-${id}`, {
              bulk: true,
              batchId: 'batch-1',
              subject: 'Newsletter',
              status: index === 2 ? 'failed' : 'accepted',
            }),
          ),
        ]}
      />,
    );
    const rows = document.querySelectorAll('[data-slot="mail-submission-row"]');
    expect(rows).toHaveLength(2);
    expect(within(rows[1] as HTMLElement).getByText('Scheduled')).toBeTruthy();
    const batch = document.querySelector(
      '[data-slot="mail-submission-batch"]',
    ) as HTMLElement;
    expect(within(batch).getByText('Newsletter')).toBeTruthy();
    expect(within(batch).getByText('3 (bulk)')).toBeTruthy();
    fireEvent.click(
      within(batch).getByRole('button', { name: 'Show recipients' }),
    );
    expect(
      document.querySelectorAll('[data-slot="mail-submission-row"]'),
    ).toHaveLength(5);
    expect(screen.getByText('bulk-c@example.com')).toBeTruthy();
  });
});
