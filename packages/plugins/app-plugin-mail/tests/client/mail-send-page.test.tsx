import { readPendingDeliveries } from '../../client/lib/mail-pending-delivery.js';
import { MailPendingDeliveries } from '../../client/components/mail-pending-deliveries.js';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope } from '@nocobase/i18n/client';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mail = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  listProviders: vi.fn(),
  listIdentities: vi.fn(),
  listSignatures: vi.fn(),
  listTemplates: vi.fn(),
  sendMessage: vi.fn(),
  sendBulk: vi.fn(),
  downloadAttachment: vi.fn(),
  saveDraft: vi.fn(),
  getMessage: vi.fn(),
  uploadAttachment: vi.fn(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));
import MailSendPage from '../../client/pages/mail-send-page.js';

describe('MailSendPage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    for (const mock of Object.values(mail)) mock.mockReset();
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account',
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
        address: 'sender@example.com',
      },
    ]);
    mail.listProviders.mockResolvedValue([
      {
        type: 'gmail',
        name: 'google',
        capabilities: { send: true, drafts: true },
      },
    ]);
    mail.listIdentities.mockResolvedValue([
      {
        id: 'sender',
        address: 'sender@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    mail.listSignatures.mockResolvedValue([]);
    mail.listTemplates.mockResolvedValue([]);
    mail.sendMessage.mockResolvedValue({ status: 'accepted' });
    mail.sendBulk.mockResolvedValue([
      { status: 'pending' },
      { status: 'pending' },
    ]);
    mail.saveDraft.mockResolvedValue({ id: 'draft', attachments: [] });
    mail.getMessage.mockResolvedValue(undefined);
    mail.uploadAttachment.mockResolvedValue({
      id: 'upload',
      fileName: 'notes.txt',
      size: 4,
    });
  });
  function mockMultipleAccounts(): void {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account',
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
        address: 'sender@example.com',
      },
      {
        id: 'other',
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
        address: 'other@example.com',
      },
    ]);
    mail.listIdentities.mockImplementation((id: string) =>
      Promise.resolve([
        {
          id: `${id}-identity`,
          address: `${id}@example.com`,
          isPrimary: true,
          canSend: true,
        },
      ]),
    );
  }

  it('keeps editing and selection uninterrupted while an autosave is pending', async () => {
    let completeSave!: (value: {
      id: string;
      text: string;
      html: string;
      attachments: [];
    }) => void;
    mail.saveDraft.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeSave = resolve;
        }),
    );
    render(<MailSendPage />);
    await screen.findByLabelText('TO');
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    editor.focus();
    editor.innerHTML = '<p>First version</p>';
    fireEvent.input(editor);
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(
      screen.getByRole('button', { name: 'Add attachment' }),
    ).toBeEnabled();
    editor.innerHTML = '<p>Latest version</p>';
    fireEvent.input(editor);
    const text = editor.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    selection.setPosition(text, 6);
    const submitted = mail.saveDraft.mock.calls[0][0];
    await act(async () =>
      completeSave({
        id: 'draft',
        text: `${submitted.text} old server suffix`,
        html: `${submitted.html}<p>old server suffix</p>`,
        attachments: [],
      }),
    );
    expect(editor).toHaveTextContent('Latest version');
    expect(document.activeElement).toBe(editor);
    expect(selection.anchorNode).toBe(text);
    expect(selection.anchorOffset).toBe(6);
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    });
    expect(mail.saveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        draftMessageId: 'draft',
        text: 'Latest version',
      }),
    );
  });

  it('submits latest content immediately while autosave is still pending', async () => {
    let complete!: (value: { id: string; attachments: [] }) => void;
    mail.saveDraft.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Sending now' },
    });
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    editor.innerHTML = 'First';
    fireEvent.input(editor);
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    editor.innerHTML = 'Latest';
    fireEvent.input(editor);
    expect(
      screen.getByRole('button', { name: 'Send', exact: true }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Latest',
          draftKey: mail.saveDraft.mock.calls[0][0].draftKey,
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Subject')).toHaveValue(''),
    );
    await act(async () => complete({ id: 'late-draft', attachments: [] }));
    expect(screen.getByLabelText('Subject')).toHaveValue('');
    expect(
      sessionStorage.getItem('nocobase:mail:composer-recovery:v1:account'),
    ).toBeNull();
  });

  it('shows autosave failure only beside the save status and keeps sending available', async () => {
    mail.saveDraft.mockRejectedValueOnce(new Error('Autosave failed'));
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Continue editing' },
    });
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    editor.innerHTML = 'Body';
    fireEvent.input(editor);
    expect(
      await screen.findByText('Draft not saved', {}, { timeout: 3000 }),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(editor).toHaveAttribute('contenteditable', 'true');
    expect(
      screen.getByRole('button', { name: 'Send', exact: true }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(1));
  });

  it('debounces for two seconds and flushes after ten seconds of continuous input', async () => {
    render(<MailSendPage />);
    await screen.findByLabelText('TO');
    vi.useFakeTimers();
    try {
      const subject = screen.getByLabelText('Subject');
      fireEvent.change(subject, { target: { value: '0' } });
      await act(async () => vi.advanceTimersByTimeAsync(1999));
      expect(mail.saveDraft).not.toHaveBeenCalled();
      await act(async () => vi.advanceTimersByTimeAsync(1));
      expect(mail.saveDraft).toHaveBeenCalledTimes(1);
      fireEvent.change(subject, { target: { value: '1' } });
      for (let index = 2; index <= 10; index++) {
        await act(async () => vi.advanceTimersByTimeAsync(1000));
        fireEvent.change(subject, { target: { value: String(index) } });
      }
      expect(mail.saveDraft).toHaveBeenCalledTimes(1);
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(mail.saveDraft).toHaveBeenCalledTimes(2);
      expect(mail.saveDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({ subject: '10' }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps edits made during manual saving open and closes after the latest content is saved', async () => {
    let complete!: (value: { id: string; attachments: [] }) => void;
    mail.saveDraft.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Manual draft' },
    });
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    editor.innerHTML = 'First';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('button', { name: 'Send', exact: true }),
    ).toBeEnabled();
    expect(editor).toHaveAttribute('contenteditable', 'true');
    editor.innerHTML = 'Latest';
    fireEvent.input(editor);
    await act(async () => complete({ id: 'manual-draft', attachments: [] }));
    expect(editor).toHaveTextContent('Latest');
    expect(screen.getByLabelText('Subject')).toHaveValue('Manual draft');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(2));
    expect(mail.saveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        draftMessageId: 'manual-draft',
        text: 'Latest',
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Subject')).toHaveValue(''),
    );
  });

  it('does not report stale writes as saved and advances the next save revision', async () => {
    mail.saveDraft.mockResolvedValueOnce({
      id: 'draft',
      draftRevision: 7,
      attachments: [],
    });
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('Subject'), {
      target: { value: 'Latest local edits' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Draft not saved')).toBeVisible();
    expect(screen.queryByText('Draft saved')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toHaveValue('Latest local edits');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(2));
    expect(mail.saveDraft).toHaveBeenLastCalledWith(
      expect.objectContaining({
        draftRevision: 8,
        subject: 'Latest local edits',
      }),
    );
  });

  it('selects sender addresses directly and preserves each account message and attachments', async () => {
    mockMultipleAccounts();
    render(<MailSendPage />);
    await screen.findByLabelText('TO');
    expect(
      screen.queryByRole('combobox', { name: 'Account' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'From address' }),
    ).toBeEnabled();
    const first = screen.getByRole('region', { name: 'New message' });
    fireEvent.change(within(first).getByLabelText('TO'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(within(first).getByLabelText('Subject'), {
      target: { value: 'First account draft' },
    });
    const body = within(first).getByRole('textbox', { name: 'Message body' });
    body.innerHTML = '<p>First account body</p>';
    fireEvent.input(body);
    fireEvent.change(first.querySelector('input[type=file][multiple]')!, {
      target: {
        files: [new File(['data'], 'notes.txt', { type: 'text/plain' })],
      },
    });
    await within(first).findByText('notes.txt');

    fireEvent.change(screen.getByRole('combobox', { name: 'From address' }), {
      target: { value: JSON.stringify(['other', 'other-identity']) },
    });
    const second = screen.getByRole('region', { name: 'New message' });
    expect(second).not.toBe(first);
    fireEvent.click(
      within(second).getByRole('checkbox', { name: 'Schedule send' }),
    );
    const schedule = within(second).getByLabelText('Send later (optional)');
    expect(second).toContainElement(schedule);
    fireEvent.change(schedule, { target: { value: '2099-01-01T10:00' } });
    expect(first).not.toBeVisible();
    expect(within(second).getByLabelText('Subject')).toHaveValue('');
    expect(within(second).queryByText('notes.txt')).not.toBeInTheDocument();
    fireEvent.change(within(second).getByLabelText('Subject'), {
      target: { value: 'Other account draft' },
    });
    await waitFor(() =>
      expect(mail.listIdentities).toHaveBeenCalledWith('other'),
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'From address' }), {
      target: { value: JSON.stringify(['account', 'account-identity']) },
    });
    expect(first).toBeVisible();
    expect(within(first).getByLabelText('TO')).toHaveValue('alice@example.com');
    expect(within(first).getByLabelText('Subject')).toHaveValue(
      'First account draft',
    );
    expect(
      within(first).getByRole('textbox', { name: 'Message body' }),
    ).toHaveTextContent('First account body');
    expect(within(first).getByText('notes.txt')).toBeVisible();
    fireEvent.click(within(first).getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account',
          identityId: 'account-identity',
          subject: 'First account draft',
          attachmentIds: ['upload'],
        }),
      ),
    );
    await waitFor(() => expect(first).not.toBeInTheDocument());
    fireEvent.change(screen.getByRole('combobox', { name: 'From address' }), {
      target: { value: JSON.stringify(['other', 'other-identity']) },
    });
    expect(second).toBeVisible();
    expect(within(second).getByLabelText('Subject')).toHaveValue(
      'Other account draft',
    );
  });

  it('keeps the selected composer open when sending finishes for another account', async () => {
    mockMultipleAccounts();
    let finishSend!: (value: { status: string }) => void;
    mail.sendMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSend = resolve;
        }),
    );
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'First account draft' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = '<p>Body</p>';
    fireEvent.input(body);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'From address' }), {
      target: { value: JSON.stringify(['other', 'other-identity']) },
    });
    const second = screen.getByRole('region', { name: 'New message' });
    fireEvent.change(within(second).getByLabelText('Subject'), {
      target: { value: 'Keep editing' },
    });
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalled());
    finishSend({ status: 'accepted' });
    await waitFor(() => expect(mail.listIdentities).toHaveBeenCalledTimes(5));
    expect(second).toBeVisible();
    expect(within(second).getByLabelText('Subject')).toHaveValue(
      'Keep editing',
    );
    expect(screen.getByRole('combobox', { name: 'From address' })).toHaveValue(
      JSON.stringify(['other', 'other-identity']),
    );
  });

  it('selects aliases with account-scoped identities and excludes unsendable addresses', async () => {
    mockMultipleAccounts();
    mail.listIdentities.mockImplementation((accountId: string) =>
      Promise.resolve([
        {
          id: 'primary',
          address: `${accountId}@example.com`,
          isPrimary: true,
          canSend: true,
        },
        {
          id: 'alias',
          address: `${accountId}-alias@example.com`,
          isPrimary: false,
          canSend: true,
        },
        {
          id: 'disabled',
          address: `${accountId}-disabled@example.com`,
          isPrimary: false,
          canSend: false,
        },
      ]),
    );
    render(<MailSendPage />);
    const from = await screen.findByRole('combobox', { name: 'From address' });
    expect(within(from).getAllByRole('option')).toHaveLength(4);
    expect(from).not.toHaveTextContent('disabled@example.com');
    fireEvent.change(from, {
      target: { value: JSON.stringify(['other', 'alias']) },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'TO', exact: true }), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Subject' }), {
      target: { value: 'From alias' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = '<p>Alias body</p>';
    fireEvent.input(body);
    await waitFor(() =>
      expect(mail.listSignatures).toHaveBeenCalledWith('other'),
    );
    expect(screen.getByRole('combobox', { name: 'From address' })).toHaveValue(
      JSON.stringify(['other', 'alias']),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'other',
          identityId: 'alias',
          subject: 'From alias',
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue(''),
    );
    expect(screen.getByRole('combobox', { name: 'From address' })).toHaveValue(
      JSON.stringify(['other', 'alias']),
    );
  });

  it('renders the center composer inline and sends cc, bcc and attachments', async () => {
    const { container } = render(<MailSendPage />);
    const to = await screen.findByLabelText('TO');
    expect(container).toContainElement(to);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Close composer' }),
    ).not.toBeInTheDocument();
    fireEvent.change(to, { target: { value: 'recipient@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bcc' }));
    fireEvent.change(screen.getByLabelText('CC'), {
      target: { value: 'copy@example.com' },
    });
    fireEvent.change(screen.getByLabelText('BCC'), {
      target: { value: 'hidden@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Hello' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = '<p>Message</p>';
    fireEvent.input(body);
    fireEvent.change(container.querySelector('input[type=file][multiple]')!, {
      target: {
        files: [new File(['data'], 'notes.txt', { type: 'text/plain' })],
      },
    });
    await screen.findByText('notes.txt');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account',
          identityId: 'sender',
          to: [{ address: 'recipient@example.com' }],
          cc: [{ address: 'copy@example.com' }],
          bcc: [{ address: 'hidden@example.com' }],
          attachmentIds: ['upload'],
          subject: 'Hello',
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Subject')).toHaveValue(''),
    );
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Compose' }),
    ).not.toBeInTheDocument();
  });
  it('uses the same form for separate sending, deduplicating recipients and preserving content and schedule', async () => {
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'alice@example.com;bob@example.com;ALICE@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Update' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = '<p>Shared body</p>';
    fireEvent.input(body);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Schedule send' }));
    fireEvent.change(screen.getByLabelText('Send later (optional)'), {
      target: { value: '2099-01-01T10:00' },
    });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send separately' }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send separately' }));
    await waitFor(() =>
      expect(mail.sendBulk).toHaveBeenCalledWith(
        expect.objectContaining({
          recipients: [
            { address: 'alice@example.com' },
            { address: 'bob@example.com' },
          ],
          subject: 'Update',
          text: 'Shared body',
          scheduledAt: new Date('2099-01-01T10:00').toISOString(),
        }),
      ),
    );
    expect(mail.sendMessage).not.toHaveBeenCalled();
    expect(mail.sendBulk.mock.calls[0][0]).not.toHaveProperty('draftMessageId');
  });

  it('keeps uploaded attachments through autosave and separate sending', async () => {
    const { container } = render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'alice@example.com,bob@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Update' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = 'Body';
    fireEvent.input(body);
    fireEvent.change(container.querySelector('input[type=file][multiple]')!, {
      target: {
        files: [new File(['data'], 'notes.txt', { type: 'text/plain' })],
      },
    });
    await screen.findByText('notes.txt');
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalled(), {
      timeout: 3000,
    });
    expect(screen.getByText('notes.txt')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Send separately' }));
    await waitFor(() =>
      expect(mail.sendBulk).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: ['upload'],
          sourceDraftMessageId: 'draft',
        }),
      ),
    );
    expect(mail.downloadAttachment).not.toHaveBeenCalled();
  });

  it.each(['normal', 'bulk'] as const)(
    'moves an uncertain %s request into outgoing records and resumes the same key',
    async (mode) => {
      const sending = mode === 'normal' ? mail.sendMessage : mail.sendBulk;
      sending.mockRejectedValueOnce(new Error('Offline'));
      render(<MailSendPage />);
      fireEvent.change(await screen.findByLabelText('TO'), {
        target: { value: 'alice@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Update' },
      });
      const body = screen.getByRole('textbox', { name: 'Message body' });
      body.innerHTML = 'Body';
      fireEvent.input(body);
      fireEvent.click(
        screen.getByRole('button', {
          name: mode === 'normal' ? 'Send' : 'Send separately',
          exact: true,
        }),
      );
      await waitFor(() =>
        expect(screen.getByLabelText('Subject')).toHaveValue(''),
      );
      const pending = readPendingDeliveries(['account']);
      expect(pending).toHaveLength(1);
      expect(pending[0].input).toMatchObject({
        subject: 'Update',
        text: 'Body',
      });
      expect(
        sessionStorage.getItem('nocobase:mail:composer-recovery:v1:account'),
      ).toBeNull();
      render(
        <MailPendingDeliveries accountIds={['account']} onResolved={vi.fn()} />,
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Update', exact: true }),
      );
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'Resume the original sending request',
        }),
      );
      await waitFor(() => expect(sending).toHaveBeenCalledTimes(2));
      expect(sending.mock.calls[1][0]).toEqual(sending.mock.calls[0][0]);
      await waitFor(() =>
        expect(readPendingDeliveries(['account'])).toEqual([]),
      );
    },
  );

  it('uses a new key for a new message while retaining the uncertain outgoing request', async () => {
    mail.sendMessage.mockRejectedValueOnce(new Error('Offline'));
    render(<MailSendPage />);
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Update' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = 'Body';
    fireEvent.input(body);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Subject')).toHaveValue(''),
    );
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'alice@example.com' },
    });
    const nextBody = screen.getByRole('textbox', { name: 'Message body' });
    nextBody.innerHTML = 'New body';
    fireEvent.input(nextBody);
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(2));
    expect(mail.sendMessage.mock.calls[1][0].idempotencyKey).not.toBe(
      mail.sendMessage.mock.calls[0][0].idempotencyKey,
    );
    expect(mail.sendMessage.mock.calls[1][0].subject).toBe('Changed');
  });

  it('reports partially accepted delivery without offering an automatic resend', async () => {
    mail.sendMessage.mockResolvedValue({
      status: 'accepted',
      error: {
        code: 'SMTP_RECIPIENTS_REJECTED',
        category: 'recipient',
        retryable: false,
        recipients: {
          accepted: ['alice@example.com'],
          rejected: ['bob@example.com'],
        },
      },
    });
    const runtime = new I18nRuntime({
      defaultLocale: 'en-US',
      locales: ['en-US'],
    });
    runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
    await runtime.init();
    render(
      <I18nProvider runtime={runtime}>
        <NamespaceScope ns={MAIL_PLUGIN_NS}>
          <MailSendPage />
        </NamespaceScope>
      </I18nProvider>,
    );
    fireEvent.change(await screen.findByLabelText('To'), {
      target: { value: 'alice@example.com,bob@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Update' },
    });
    const body = screen.getByRole('textbox', { name: 'Message body' });
    body.innerHTML = 'Body';
    fireEvent.input(body);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(
      await screen.findByText(
        /The provider rejected these recipients: bob@example.com/,
      ),
    ).toBeVisible();
    expect(screen.getByLabelText('Subject')).toHaveValue('');
    expect(readPendingDeliveries(['account'])).toEqual([]);
    expect(mail.sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['failed', 'unknown'] as const)(
    'clears the composer and recovery after %s delivery',
    async (status) => {
      mail.sendMessage.mockResolvedValueOnce({ status });
      render(<MailSendPage />);
      fireEvent.change(await screen.findByLabelText('TO'), {
        target: { value: 'recipient@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Submitted content' },
      });
      const body = screen.getByRole('textbox', { name: 'Message body' });
      body.innerHTML = 'Body';
      fireEvent.input(body);
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      await waitFor(() =>
        expect(screen.getByLabelText('Subject')).toHaveValue(''),
      );
      expect(
        screen.getByRole('textbox', { name: 'Message body' }),
      ).toBeEmptyDOMElement();
      expect(readPendingDeliveries(['account'])).toEqual([]);
      expect(
        sessionStorage.getItem('nocobase:mail:composer-recovery:v1:account'),
      ).toBeNull();
      expect(mail.sendMessage).toHaveBeenCalledTimes(1);
    },
  );

  it('does not silently discard Cc or Bcc when sending separately', async () => {
    render(<MailSendPage />);
    await screen.findByLabelText('TO');
    fireEvent.click(screen.getByRole('button', { name: 'Cc' }));
    fireEvent.change(screen.getByLabelText('CC'), {
      target: { value: 'copy@example.com' },
    });
    expect(
      screen.getByRole('button', { name: 'Send separately' }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        'Separate sending does not support Cc or Bcc. Clear them to send separately.',
      ),
    ).toBeVisible();
    expect(mail.sendBulk).not.toHaveBeenCalled();
  });

  it('allows retrying account loading after an error', async () => {
    mail.listAccounts.mockRejectedValueOnce(new Error('Offline'));
    render(<MailSendPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
    fireEvent.click(screen.getByRole('button', { name: 'Reload accounts' }));
    expect(await screen.findByLabelText('TO')).toBeVisible();
  });
});
