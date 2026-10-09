import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailSubmissionLogView } from '../../client/mail-client.js';

const mail = vi.hoisted(() => ({
  listSubmissions: vi.fn(),
  listSubmissionsPage: vi.fn(),
  retrySubmission: vi.fn(),
  cancelSubmission: vi.fn(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));
import { MailBulkSendLogs } from '../../client/components/mail-bulk-send-logs.js';

const pending: MailSubmissionLogView = {
  id: 'queued',
  accountId: 'account',
  status: 'pending',
  canCancel: true,
  recipients: [{ address: 'customer@example.com' }],
  subject: 'Persisted mail',
  createdAt: '2026-09-16T00:00:00Z',
  updatedAt: '2026-09-16T00:00:00Z',
};

describe('bulk send history', () => {
  let fixtureTotal: number | undefined;
  beforeEach(() => {
    for (const mock of Object.values(mail)) mock.mockReset();
    fixtureTotal = undefined;
    // The component requests page numbers; this fixture serves rows from an offset-based stand-in.
    mail.listSubmissionsPage.mockImplementation(
      async ({ bulkOnly, groupByBatch, page, pageSize }) => {
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        let rows: readonly MailSubmissionLogView[] = await mail.listSubmissions(
          bulkOnly,
          offset,
          groupByBatch,
          Math.min(limit + 1, 100),
        );
        if (
          limit === 100 &&
          new Set(rows.map((row) => row.batchId ?? row.id)).size === 100
        )
          rows = [
            ...rows,
            ...(await mail.listSubmissions(
              bulkOnly,
              offset + limit,
              groupByBatch,
              1,
            )),
          ];
        const ids = [...new Set(rows.map((row) => row.batchId ?? row.id))];
        const visibleIds = new Set(ids.slice(0, limit));
        return {
          items: rows.filter((row) => visibleIds.has(row.batchId ?? row.id)),
          total: fixtureTotal ?? offset + ids.length,
        };
      },
    );
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads persisted recipients and cancels the selected queued submission', async () => {
    mail.listSubmissions.mockResolvedValue([
      pending,
      {
        ...pending,
        id: 'sent',
        subject: 'Already sent',
        status: 'accepted',
        canCancel: false,
      },
    ]);
    const cancelled = { ...pending, status: 'cancelled', canCancel: false };
    mail.cancelSubmission.mockImplementation(async () => {
      mail.listSubmissions.mockResolvedValue([cancelled]);
      return cancelled;
    });
    render(<MailBulkSendLogs />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Expand batch: Persisted mail',
      }),
    );
    const row = screen.getByText('customer@example.com').closest('tr')!;
    fireEvent.click(
      within(row).getByRole('button', { name: 'Cancel sending' }),
    );
    await waitFor(() =>
      expect(mail.cancelSubmission).toHaveBeenCalledExactlyOnceWith('queued'),
    );
    expect(await screen.findByText('cancelled 1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel sending' }),
    ).not.toBeInTheDocument();
  });

  it('refreshes pending delivery automatically and stops polling after acceptance', async () => {
    vi.useFakeTimers();
    mail.listSubmissions
      .mockResolvedValueOnce([pending])
      .mockResolvedValue([
        { ...pending, status: 'accepted', canCancel: false },
      ]);
    render(<MailBulkSendLogs />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('pending 1')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(screen.getByText('accepted 1')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    expect(mail.listSubmissions).toHaveBeenCalledTimes(2);
  });

  it('reports retry errors and never enables retry for an unknown delivery result', async () => {
    mail.listSubmissions.mockResolvedValue([
      { ...pending, status: 'failed', canCancel: false, canRetry: true },
      {
        ...pending,
        id: 'unknown',
        subject: 'Uncertain delivery',
        status: 'unknown',
        canCancel: false,
        canRetry: false,
      },
    ]);
    mail.retrySubmission.mockRejectedValue(
      new Error('Cannot retry this message.'),
    );
    render(<MailBulkSendLogs />);
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Expand batch: Persisted mail',
      }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry', exact: true }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot retry this message.',
    );
    const unknown = screen.getByText('Uncertain delivery').closest('tr')!;
    expect(
      within(unknown).queryByRole('button', { name: 'Retry failed' }),
    ).not.toBeInTheDocument();
  });

  it('groups by batch identity, keeps details collapsed and retries only that batch', async () => {
    const failed = {
      ...pending,
      status: 'failed' as const,
      canCancel: false,
      canRetry: true,
    };
    const first = { ...failed, batchId: 'batch-1' };
    const second = { ...failed, id: 'other', batchId: 'batch-2' };
    mail.listSubmissions.mockResolvedValue([
      first,
      {
        ...pending,
        id: 'accepted',
        batchId: 'batch-1',
        status: 'accepted',
        canCancel: false,
      },
      second,
    ]);
    mail.retrySubmission.mockResolvedValue({
      ...first,
      status: 'pending',
      canRetry: false,
    });
    render(<MailBulkSendLogs />);
    const parents = await screen.findAllByRole('button', {
      name: 'Expand batch: Persisted mail',
    });
    expect(parents).toHaveLength(2);
    expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument();
    const parent = parents[0].closest('tr')!;
    expect(within(parent).getByText('2')).toBeInTheDocument();
    fireEvent.click(parents[0]);
    expect(screen.getAllByText('customer@example.com')).toHaveLength(2);
    fireEvent.click(
      within(parent).getByRole('button', { name: 'Retry failed' }),
    );
    await waitFor(() =>
      expect(mail.retrySubmission).toHaveBeenCalledExactlyOnceWith('queued'),
    );
    expect(
      screen.getByRole('button', { name: 'Collapse batch: Persisted mail' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('allows older logs to be reached without mixing normal mail into the query', async () => {
    mail.listSubmissions
      .mockResolvedValueOnce(
        Array.from({ length: 21 }, (_, index) => ({
          ...pending,
          id: `sent-${index}`,
          status: 'accepted',
          canCancel: false,
        })),
      )
      .mockResolvedValue([
        {
          ...pending,
          id: 'older',
          subject: 'Older batch',
          status: 'accepted',
          canCancel: false,
        },
      ]);
    render(<MailBulkSendLogs />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled(),
    );
    expect(
      screen.getAllByRole('button', { name: /^Expand batch:/ }),
    ).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Older batch')).toBeInTheDocument();
    expect(mail.listSubmissions).toHaveBeenLastCalledWith(true, 20, true, 21);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
  });
  it('shows the last batch page instead of counting recipient rows as pages', async () => {
    mail.listSubmissionsPage.mockImplementation(async ({ page, pageSize }) => {
      const offset = (page - 1) * pageSize;
      return {
        items: Array.from({ length: 3 }, (_, index) => ({
          ...pending,
          id: `recipient-${index}`,
          batchId: `batch-${offset}`,
          status: 'accepted',
          subject: `Batch at ${offset}`,
          canCancel: false,
        })),
        total: 125,
      };
    });
    render(<MailBulkSendLogs />);
    fireEvent.click(await screen.findByRole('button', { name: 'Page 7' }));
    expect(await screen.findByText('Batch at 120')).toBeVisible();
    expect(mail.listSubmissionsPage).toHaveBeenLastCalledWith({
      bulkOnly: true,
      groupByBatch: true,
      page: 7,
      pageSize: 20,
    });
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('jumps between complete batches and supports 100 batches without exceeding the API limit', async () => {
    const batches = Array.from({ length: 105 }, (_, index) =>
      Array.from({ length: 2 }, (_, child) => ({
        ...pending,
        id: `batch-${index}-${child}`,
        batchId: `batch-${index}`,
        subject: `Batch ${index}`,
        status: 'accepted',
        canCancel: false,
      })),
    );
    fixtureTotal = batches.length;
    mail.listSubmissions.mockImplementation(
      async (_bulkOnly, offset, _groupByBatch, limit) => {
        expect(limit).toBeLessThanOrEqual(100);
        return batches.slice(offset, offset + limit).flat();
      },
    );
    render(<MailBulkSendLogs />);
    await screen.findByText('Batch 0');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Go to page' }), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go', exact: true }));
    await screen.findByText('Batch 60');
    expect(
      screen.getAllByRole('button', { name: /^Expand batch:/ }),
    ).toHaveLength(20);
    fireEvent.change(screen.getByRole('combobox', { name: 'Rows per page' }), {
      target: { value: '100' },
    });
    await screen.findByText('Batch 0');
    expect(
      screen.getAllByRole('button', { name: /^Expand batch:/ }),
    ).toHaveLength(100);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Batch 100');
    expect(
      screen.getAllByRole('button', { name: /^Expand batch:/ }),
    ).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
