import type { ReactElement } from 'react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import {
  fireEvent,
  render as renderComponent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  listSubmissions: vi.fn(),
  listSubmissionsPage: vi.fn(),
  listSyncRunsPage: vi.fn(),
  listSyncRuns: vi.fn(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));
import MailSendLogsPage from '../../client/pages/mail-send-logs-page.js';
import MailSyncLogsPage from '../../client/pages/mail-sync-logs-page.js';

const accounts = [
  {
    id: 'alice',
    userId: 'user-alice',
    address: 'alice@example.com',
    provider: { type: 'gmail', name: 'google' },
  },
  {
    id: 'bob',
    userId: 'user-bob',
    address: 'bob@example.com',
    provider: { type: 'imap-smtp', name: 'company' },
  },
];
const submissions = [
  'accepted',
  'failed',
  'unknown',
  'pending',
  'cancelled',
].map((status, index) => ({
  id: `send-${status}`,
  accountId: index === 0 ? 'alice' : 'deleted',
  status,
  providerMessageId: index === 0 ? 'remote-sent' : undefined,
  createdAt: '2026-09-10T12:00:00Z',
  updatedAt: 'invalid-time',
  error:
    status === 'failed'
      ? {
          code: 'SMTP_REJECTED',
          category: 'recipient',
          message: 'private-provider-details',
        }
      : undefined,
}));
const syncRuns = ['completed', 'failed', 'cancelled', 'pending', 'running'].map(
  (status, index) => ({
    id: `sync-${status}`,
    accountId: index === 0 ? 'alice' : 'bob',
    status,
    mode: index === 0 ? 'initial' : 'incremental',
    phase: 'incremental',
    processedMessages: 20,
    processedPages: 2,
    createdAt: '2026-09-10T12:00:00Z',
    completedAt: status === 'completed' ? '2026-09-10T13:00:00Z' : undefined,
    canManage: status !== 'cancelled',
    error:
      status === 'failed'
        ? {
            code: 'GMAIL_HTTP_403',
            category: 'rate_limit',
            retryable: true,
            reasonCode: 'gmailUserRateLimitExceeded',
            message: 'private-provider-details',
          }
        : undefined,
  }),
);

describe('mail log pages', () => {
  let runtime: I18nRuntime;
  let fixtureTotal: number | undefined;
  const render = (element: ReactElement) =>
    renderComponent(
      <I18nProvider runtime={runtime}>
        <NamespaceScope ns={MAIL_PLUGIN_NS}>{element}</NamespaceScope>
      </I18nProvider>,
    );
  beforeEach(async () => {
    runtime = new I18nRuntime({ defaultLocale: 'en-US', locales: ['en-US'] });
    runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
    await runtime.init();
    for (const mock of Object.values(mail)) mock.mockReset();
    fixtureTotal = undefined;
    const loadPage = async (
      load: (offset: number, limit: number) => Promise<readonly unknown[]>,
      offset: number,
      limit: number,
    ) => {
      let items = await load(offset, Math.min(limit + 1, 100));
      if (limit === 100 && items.length === 100)
        items = [...items, ...(await load(offset + limit, 1))];
      return {
        items: items.slice(0, limit),
        total: fixtureTotal ?? offset + items.length,
      };
    };
    // The pages request page numbers; these fixtures serve rows from offset-based stand-ins.
    mail.listSubmissionsPage.mockImplementation(
      ({ bulkOnly = false, groupByBatch = false, page = 1, pageSize = 20 }) =>
        loadPage(
          (start, size) =>
            mail.listSubmissions(bulkOnly, start, groupByBatch, size),
          (page - 1) * pageSize,
          pageSize,
        ),
    );
    mail.listSyncRunsPage.mockImplementation(({ page = 1, pageSize = 20 }) =>
      loadPage(
        (start, size) => mail.listSyncRuns(start, size),
        (page - 1) * pageSize,
        pageSize,
      ),
    );
    mail.listAccounts.mockResolvedValue(accounts);
    mail.listSubmissions.mockResolvedValue(submissions);
    mail.listSyncRuns.mockResolvedValue(syncRuns);
  });

  it('shows accepted and rejected recipients in personal delivery logs', async () => {
    const partial = {
      ...submissions[0],
      error: {
        code: 'SMTP_RECIPIENTS_REJECTED',
        category: 'recipient',
        retryable: false,
        recipients: {
          accepted: ['delivered@example.com'],
          rejected: ['rejected@example.com'],
        },
      },
    };
    mail.listSubmissions.mockResolvedValue([partial]);
    render(<MailSendLogsPage />);
    expect(
      await screen.findByText('Partially accepted by provider'),
    ).toBeVisible();
    expect(
      screen.getByText('Accepted recipients: delivered@example.com'),
    ).toBeVisible();
    expect(
      screen.getByText('Rejected recipients: rejected@example.com'),
    ).toBeVisible();
  });

  it('renders every delivery state and public error codes without exposing provider details', async () => {
    render(<MailSendLogsPage />);
    const table = within(await screen.findByRole('table'));
    for (const submission of submissions)
      expect(table.getByText(submission.id)).toBeVisible();
    expect(table.getByText('alice@example.com')).toBeVisible();
    expect(table.getAllByText('Unknown account')).toHaveLength(4);
    expect(table.getByText('remote-sent')).toBeVisible();
    expect(table.getByText('SMTP_REJECTED')).toBeVisible();
    expect(
      table.getByText(
        'The mail provider rejected one or more recipients. Check the addresses and recipient policy.',
      ),
    ).toBeVisible();
    expect(
      screen.queryByText('private-provider-details'),
    ).not.toBeInTheDocument();
    mail.listSubmissions.mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('No send logs')).toBeVisible();
  });

  it('renders sync progress and completion without exposing internal error text', async () => {
    render(<MailSyncLogsPage />);
    const table = within(await screen.findByRole('table'));
    expect(table.getAllByText('20 messages')).toHaveLength(5);
    expect(table.getAllByText('2 batches')).toHaveLength(5);
    expect(table.getByText('GMAIL_HTTP_403')).toBeVisible();
    expect(
      table.getByText(
        "This mailbox has reached Gmail's per-user request limit. Wait before retrying; reconnecting will not resolve the limit.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText('private-provider-details'),
    ).not.toBeInTheDocument();
    mail.listSyncRuns.mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('No synchronization runs')).toBeVisible();
  });

  it.each([
    ['send', MailSendLogsPage, 'listSubmissions', 'No send logs'],
    ['sync', MailSyncLogsPage, 'listSyncRuns', 'No synchronization runs'],
  ] as const)(
    'recovers the %s page after a failed request',
    async (_name, Page, method, emptyText) => {
      mail[method].mockRejectedValueOnce(new Error('Mail request failed.'));
      mail[method].mockResolvedValue([]);
      render(<Page />);
      expect(await screen.findByText('Mail request failed.')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await waitFor(() => expect(mail[method]).toHaveBeenCalledTimes(2));
      expect(await screen.findByText(emptyText)).toBeVisible();
      expect(
        screen.queryByText('Mail request failed.'),
      ).not.toBeInTheDocument();
    },
  );

  it.each([
    ['send', MailSendLogsPage, 'listSubmissions'],
    ['sync', MailSyncLogsPage, 'listSyncRuns'],
  ] as const)(
    'paginates %s logs by 20 and keeps the current page on refresh',
    async (kind, Page, method) => {
      const rows = Array.from({ length: 40 }, (_, index) => ({
        ...(kind === 'send' ? submissions[0] : syncRuns[0]),
        id: `log-${index}`,
        phase: `phase-${index}`,
      }));
      fixtureTotal = rows.length;
      mail[method].mockImplementation((...args: unknown[]) => {
        const offset = Number(args[kind === 'send' ? 1 : 0]);
        const limit = Number(args[kind === 'send' ? 3 : 1]);
        return Promise.resolve(rows.slice(offset, offset + limit));
      });
      render(<Page />);
      expect(
        within(await screen.findByRole('table')).getAllByRole('row'),
      ).toHaveLength(21);
      expect(screen.getByText('Page 1 · 20 per page')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await waitFor(() =>
        expect(screen.getByText('Page 2 · 20 per page')).toBeVisible(),
      );
      expect(
        within(await screen.findByRole('table')).getAllByRole('row'),
      ).toHaveLength(21);
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
      expect(
        screen.getByText(kind === 'send' ? 'log-20' : 'phase-20'),
      ).toBeVisible();
      expect(
        screen.queryByText(kind === 'send' ? 'log-0' : 'phase-0'),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      await screen.findByRole('table');
      expect(mail[method]).toHaveBeenLastCalledWith(
        ...(kind === 'send' ? [false, 20, false, 21] : [20, 21]),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(
        await screen.findByText(kind === 'send' ? 'log-0' : 'phase-0'),
      ).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Previous page' }),
      ).toBeDisabled();
    },
  );

  it.each([
    ['send', MailSendLogsPage, 'listSubmissions'],
    ['sync', MailSyncLogsPage, 'listSyncRuns'],
  ] as const)(
    'jumps to unvisited %s log pages and changes page size within API limits',
    async (kind, Page, method) => {
      const rows = Array.from({ length: 205 }, (_, index) => ({
        ...(kind === 'send' ? submissions[0] : syncRuns[0]),
        id: `log-${index}`,
        phase: `phase-${index}`,
      }));
      fixtureTotal = rows.length;
      mail[method].mockImplementation((...args: unknown[]) => {
        const offset = Number(args[kind === 'send' ? 1 : 0]);
        const limit = Number(args[kind === 'send' ? 3 : 1]);
        expect(limit).toBeLessThanOrEqual(100);
        return Promise.resolve(rows.slice(offset, offset + limit));
      });
      render(<Page />);
      await screen.findByRole('table');
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Go to page' }), {
        target: { value: '4' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Go', exact: true }));
      expect(
        await screen.findByText(kind === 'send' ? 'log-60' : 'phase-60'),
      ).toBeVisible();
      fireEvent.change(
        screen.getByRole('combobox', { name: 'Rows per page' }),
        { target: { value: '100' } },
      );
      expect(
        await screen.findByText(kind === 'send' ? 'log-0' : 'phase-0'),
      ).toBeVisible();
      expect(
        within(screen.getByRole('table')).getAllByRole('row'),
      ).toHaveLength(101);
      fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
      expect(
        await screen.findByText(kind === 'send' ? 'log-100' : 'phase-100'),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      expect(
        await screen.findByText(kind === 'send' ? 'log-200' : 'phase-200'),
      ).toBeVisible();
      expect(
        within(screen.getByRole('table')).getAllByRole('row'),
      ).toHaveLength(6);
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    },
  );

  it.each([
    ['send', MailSendLogsPage, 'listSubmissionsPage'],
    ['sync', MailSyncLogsPage, 'listSyncRunsPage'],
  ] as const)(
    'shows and opens the last %s log page using the server total',
    async (kind, Page, method) => {
      const rows = Array.from({ length: 205 }, (_, index) => ({
        ...(kind === 'send' ? submissions[0] : syncRuns[0]),
        id: `last-${index}`,
        phase: `last-phase-${index}`,
      }));
      mail[method].mockImplementation(
        ({ page, pageSize }: { page: number; pageSize: number }) => {
          const offset = (page - 1) * pageSize;
          const limit = pageSize;
          return Promise.resolve({
            items: rows.slice(offset, offset + limit),
            total: rows.length,
          });
        },
      );
      render(<Page />);
      fireEvent.click(await screen.findByRole('button', { name: 'Page 11' }));
      expect(
        await screen.findByText(
          kind === 'send' ? 'last-200' : 'last-phase-200',
        ),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Page 11' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
      fireEvent.change(
        screen.getByRole('combobox', { name: 'Rows per page' }),
        { target: { value: '100' } },
      );
      expect(
        await screen.findByRole('button', { name: 'Page 3' }),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Page 11' }),
      ).not.toBeInTheDocument();
    },
  );

  it('keeps the current page and permits retry when loading the next page fails', async () => {
    mail.listSubmissions
      .mockResolvedValueOnce(
        Array.from({ length: 21 }, (_, index) => ({
          ...submissions[0],
          id: `log-${index}`,
        })),
      )
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValue(submissions);
    render(<MailSendLogsPage />);
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Offline')).toBeVisible();
    expect(screen.getByText('log-0')).toBeVisible();
    expect(screen.getByText('Page 1 · 20 per page')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByRole('table');
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });
});
