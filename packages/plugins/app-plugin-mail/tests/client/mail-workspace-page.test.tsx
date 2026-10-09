import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mail = vi.hoisted(() => ({
  cancelSubmission: vi.fn(),
  deleteMessage: vi.fn(),
  downloadAttachment: vi.fn(),
  getSyncRun: vi.fn(),
  getMessage: vi.fn(),
  getManagedMessage: vi.fn(),
  downloadManagedAttachment: vi.fn(),
  listAccounts: vi.fn(),
  listManagementAccounts: vi.fn(),
  listManagedFolders: vi.fn(),
  listManagedMessages: vi.fn(),
  manageMessages: vi.fn(),
  listProviders: vi.fn(),
  listConversationMessages: vi.fn(),
  listFolders: vi.fn(),
  listLabels: vi.fn(),
  listIdentities: vi.fn(),
  listSignatures: vi.fn(),
  listMessages: vi.fn(),
  listTemplates: vi.fn(),
  sendMessage: vi.fn(),
  sendBulk: vi.fn(),
  saveDraft: vi.fn(),
  startSync: vi.fn(),
  updateMessage: vi.fn(),
  updateMessageLabels: vi.fn(),
  createLabel: vi.fn(),
  moveMessage: vi.fn(),
  uploadAttachment: vi.fn(),
}));

const realtime = vi.hoisted(() => ({
  subscribe: vi.fn(() => () => undefined),
  onOpen: vi.fn(() => () => undefined),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  return {
    ...actual,
    useService: (token: unknown) =>
      token === actual.realtimeClientToken ? realtime : undefined,
  };
});

vi.mock('../../client/runtime.js', () => ({
  useMailClient: () => mail,
}));

import MailWorkspacePage from '../../client/pages/mail-workspace-page.js';
import MailManagementPage from '../../client/pages/mail-management-page.js';
import { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../../client/components/mail-navigation-icon.js';

describe('[UI][SRV] mail workspace, composer, drafts, and management', () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const mock of Object.values(mail)) mock.mockReset();
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'user@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listManagementAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'user@example.com',
        scopes: [],
        status: 'active',
        canSync: false,
        canMoveMessages: true,
      },
    ]);
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
          pushNotifications: true,
          folders: true,
          labels: true,
          drafts: true,
          moveMessage: true,
          aliases: true,
        },
      },
    ]);
    mail.listFolders.mockResolvedValue([]);
    mail.deleteMessage.mockResolvedValue(undefined);
    mail.listManagedFolders.mockResolvedValue([]);
    mail.listLabels.mockResolvedValue([]);
    mail.listIdentities.mockResolvedValue([
      {
        id: 'identity-1',
        accountId: 'account-1',
        address: 'user@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    mail.listSignatures.mockResolvedValue([]);
    mail.listMessages.mockResolvedValue({ items: [] });
    mail.listManagedMessages.mockResolvedValue({ items: [] });
    mail.manageMessages.mockResolvedValue({
      items: [],
      succeeded: 0,
      failed: 0,
    });
    mail.listTemplates.mockResolvedValue([]);
    mail.sendMessage.mockResolvedValue({
      id: 'submission-1',
      accountId: 'account-1',
      status: 'accepted',
    });
    mail.sendBulk.mockResolvedValue([]);
    mail.saveDraft.mockResolvedValue({ id: 'draft-1', draft: true });
    mail.uploadAttachment.mockResolvedValue({
      id: 'attachment-1',
      fileName: 'report.txt',
      contentType: 'text/plain',
      size: 6,
      expiresAt: '2026-09-08T00:00:00.000Z',
    });
    mail.startSync.mockResolvedValue({
      id: 'sync-1',
      accountId: 'account-1',
      mode: 'incremental',
      phase: 'incremental',
      status: 'pending',
      policy: { maxMessages: 10_000, batchSize: 200 },
      processedMessages: 0,
      processedPages: 0,
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:00:00.000Z',
    });
  });

  it('does not reload composer metadata on repeated focus or unchanged account responses', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    // HTTP responses produce new arrays and objects even when data is unchanged.
    const accounts = await mail.listAccounts();
    const providers = await mail.listProviders();
    mail.listAccounts
      .mockClear()
      .mockImplementation(async () => structuredClone(accounts));
    mail.listProviders
      .mockClear()
      .mockImplementation(async () => structuredClone(providers));
    render(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    // The button appears before accounts and provider capabilities finish loading.
    await waitFor(() => expect(compose).toBeEnabled());
    fireEvent.click(compose);
    await waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
    await act(async () => {});
    const identities = mail.listIdentities.mock.calls.length;
    const folders = mail.listFolders.mock.calls.length;
    const initialLoads = mail.listAccounts.mock.calls.length;
    await act(async () => {
      fireEvent.focus(window);
      fireEvent.focus(window);
    });
    expect(mail.listAccounts).toHaveBeenCalledTimes(initialLoads);
    now.mockReturnValue(30_000);
    await act(async () => {
      fireEvent.focus(window);
    });
    expect(mail.listAccounts).toHaveBeenCalledTimes(initialLoads + 1);
    expect(mail.listIdentities).toHaveBeenCalledTimes(identities);
    expect(mail.listFolders).toHaveBeenCalledTimes(folders);
    await act(async () => {
      fireEvent.focus(window);
    });
    expect(mail.listAccounts).toHaveBeenCalledTimes(initialLoads + 1);
  });

  it('refreshes provider changes without focus and keeps the current reader and composer', async () => {
    const initial = { ...createUnreadMessage('current-mail'), read: true };
    const incoming = { ...createUnreadMessage('new-mail'), read: true };
    mail.listMessages.mockResolvedValue({ items: [initial] });
    mail.getMessage.mockResolvedValue(initial);
    render(<MailWorkspacePage />);
    fireEvent.click(
      await screen.findByRole('button', { name: /current-mail/ }),
    );
    await screen.findByText('Body current-mail');
    fireEvent.click(screen.getByRole('button', { name: 'Compose' }));
    const composer = await screen.findByRole('dialog', { name: 'New message' });
    fireEvent.change(within(composer).getByLabelText('TO'), {
      target: { value: 'unfinished@example.com' },
    });
    mail.listMessages.mockResolvedValue({ items: [incoming, initial] });
    const subscribe = realtime.subscribe as unknown as {
      mock: { calls: [string, (event: { payload: unknown }) => void][] };
    };
    const listener = subscribe.mock.calls.at(-1)![1];
    act(() => listener({ payload: { kind: 'mail.changed' } }));
    await screen.findByRole('button', { name: /new-mail/ });
    expect(screen.getByText('Body current-mail')).toBeInTheDocument();
    expect(within(composer).getByLabelText('TO')).toHaveValue(
      'unfinished@example.com',
    );
  });

  it('links first-time users to mailbox setup in Dev tools', async () => {
    mail.listAccounts.mockResolvedValue([]);
    render(<MailWorkspacePage />);
    const connect = await screen.findByRole('link', {
      name: 'Connect mail account',
    });
    expect(connect).toHaveAttribute('href', '/dev/mail/accounts');
    expect(screen.getByRole('button', { name: 'Compose' })).toBeDisabled();
  });

  it('keeps composer errors and entered text when the mailbox refreshes', async () => {
    mail.listTemplates.mockRejectedValue(new Error('templates unavailable'));
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    const editor = await screen.findByRole('dialog', { name: 'New message' });
    expect(await within(editor).findByRole('alert')).toHaveTextContent(
      'templates unavailable',
    );
    fireEvent.change(within(editor).getByLabelText('TO'), {
      target: { value: 'draft@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Search mail'), {
      target: { value: 'project' },
    });
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'project' }),
      ),
    );
    expect(within(editor).getByRole('alert')).toHaveTextContent(
      'templates unavailable',
    );
    expect(within(editor).getByLabelText('TO')).toHaveValue(
      'draft@example.com',
    );
    expect(screen.getByRole('button', { name: 'Compose' })).toBeDisabled();
    expect(editor).not.toHaveAttribute('aria-modal', 'true');
  });

  it('keeps navigation and the current list visible while reading a conversation', async () => {
    const message = {
      id: 'reading-1',
      accountId: 'account-1',
      subject: 'Reading flow',
      from: { address: 'sender@example.com' },
      to: [],
      cc: [],
      bcc: [],
      folderIds: [],
      labelIds: [],
      attachments: [],
      read: true,
      starred: false,
      text: 'Message content',
    };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    render(<MailWorkspacePage />);
    fireEvent.click(
      await screen.findByRole('button', { name: /Reading flow/ }),
    );
    expect(await screen.findByText('Message content')).toBeInTheDocument();
    const requests = mail.listMessages.mock.calls.length;
    expect(
      screen.queryByRole('button', { name: 'Back to messages' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Mailbox navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Account' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Reading flow/ }),
    ).toBeInTheDocument();
    expect(mail.listMessages).toHaveBeenCalledTimes(requests);
  });

  it.each(['Reply', 'Forward'])(
    'removes and restores quoted content in %s without changing the authored body',
    async (action) => {
      const message = {
        ...createUnreadMessage('quote-removal'),
        replyTo: [],
        read: true,
        from: { address: 'sender@example.com' },
      };
      mail.listMessages.mockResolvedValue({ items: [message] });
      mail.getMessage.mockResolvedValue(message);
      render(<MailWorkspacePage />);
      fireEvent.click(
        await screen.findByRole('button', { name: /quote-removal/ }),
      );
      fireEvent.click(await screen.findByRole('button', { name: action }));
      fireEvent.change(await screen.findByLabelText('TO'), {
        target: { value: 'recipient@example.com' },
      });
      const title = action === 'Reply' ? 'Quoted message' : 'Forwarded message';
      const editor = screen.getByLabelText('Message body');
      editor.innerHTML = '<p>My own message</p>';
      fireEvent.input(editor);
      fireEvent.click(
        screen.getByRole('button', { name: 'Remove quoted content' }),
      );
      expect(screen.queryByTitle(title)).not.toBeInTheDocument();
      expect(editor).toHaveTextContent('My own message');
      fireEvent.click(
        screen.getByRole('button', { name: 'Restore quoted content' }),
      );
      expect(screen.getByTitle(title).getAttribute('srcdoc')).toContain(
        'Body quote-removal',
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Remove quoted content' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      await waitFor(() =>
        expect(mail.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'My own message',
            html: '<p>My own message</p>',
            ...(action === 'Reply'
              ? { replyBodyIncluded: true }
              : { forwardBodyIncluded: true }),
          }),
        ),
      );
    },
  );

  it.each([true, false])(
    'replies to Reply-To with a From fallback: %s',
    async (hasReplyTo) => {
      const message = {
        ...createUnreadMessage('reply-target'),
        read: true,
        from: { address: 'sender@example.com' },
        replyTo: hasReplyTo
          ? [{ address: 'reply@example.com' }, { address: 'team@example.com' }]
          : [],
      };
      mail.listMessages.mockResolvedValue({ items: [message] });
      mail.getMessage.mockResolvedValue(message);
      render(<MailWorkspacePage />);
      fireEvent.click(
        await screen.findByRole('button', { name: /reply-target/ }),
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Reply' }));
      expect(await screen.findByLabelText('TO')).toHaveValue(
        hasReplyTo
          ? 'reply@example.com, team@example.com'
          : 'sender@example.com',
      );
      expect(
        screen.getByTitle('Quoted message').getAttribute('srcdoc'),
      ).toContain('Body reply-target');
      expect(screen.getByLabelText('Message body')).toBeEmptyDOMElement();
      const editor = screen.getByLabelText('Message body');
      editor.innerHTML = '<p>My reply</p>';
      fireEvent.input(editor);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      await waitFor(() =>
        expect(mail.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            inReplyToMessageId: message.id,
            replyBodyIncluded: true,
            html: expect.stringContaining('Body reply-target'),
            text: expect.stringContaining('My reply'),
          }),
        ),
      );
    },
  );

  it('includes copied reply images in the outgoing attachments without forwarding ordinary files', async () => {
    const message = {
      ...createUnreadMessage('image-reply'),
      read: true,
      replyTo: [],
      from: { address: 'sender@example.com' },
      html: '<p>Original body</p><img src="cid:logo">',
      attachments: [
        {
          id: 'logo',
          messageId: 'image-reply',
          providerAttachmentId: 'logo',
          fileName: 'logo.png',
          contentType: 'image/png',
          size: 3,
          inline: true,
          contentId: 'logo',
        },
      ],
    };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    mail.downloadAttachment.mockResolvedValue(new Response('png').body);
    mail.uploadAttachment.mockResolvedValue({
      id: 'reply-image',
      fileName: 'logo.png',
      contentType: 'image/png',
      size: 3,
      expiresAt: '',
    });
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: /image-reply/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reply' }));
    const editor = await screen.findByLabelText('Message body');
    editor.innerHTML = '<p>My reply</p>';
    fireEvent.input(editor);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: ['reply-image'],
          replyBodyIncluded: true,
          html: expect.stringContaining('cid:nocobase-reply-image@mail.inline'),
        }),
      ),
    );
  });

  it('marks opened unread mail as read and immediately invalidates the unread badge', async () => {
    const message = createUnreadMessage('opened');
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    let finishRead!: (value: typeof message) => void;
    mail.updateMessage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRead = resolve;
        }),
    );
    const refresh = vi.fn();
    window.addEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, refresh);
    try {
      render(<MailWorkspacePage />);
      fireEvent.click(await screen.findByRole('button', { name: /opened/ }));
      await screen.findByText('Body opened');
      expect(mail.updateMessage).toHaveBeenCalledExactlyOnceWith({
        accountId: 'account-1',
        messageId: 'opened',
        read: true,
      });
      expect(refresh).not.toHaveBeenCalled();
      // Opening the same message during the write does not send a duplicate mutation.
      fireEvent.click(screen.getByRole('button', { name: /opened/ }));
      await screen.findByText('Body opened');
      expect(mail.updateMessage).toHaveBeenCalledTimes(1);
      await act(async () => {
        finishRead({ ...message, read: true });
      });
      fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
      expect(
        await screen.findByRole('menuitem', { name: 'Mark unread' }),
      ).toBeVisible();
      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      expect(screen.getByRole('button', { name: /opened/ })).not.toHaveClass(
        'bg-muted/30',
      );
      expect(refresh).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, refresh);
    }
  });

  it('keeps the body readable and unread state intact when marking read fails', async () => {
    const message = createUnreadMessage('failed-read');
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    mail.updateMessage.mockRejectedValue(new Error('Read update failed'));
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: /failed-read/ }));
    expect(await screen.findByText('Read update failed')).toBeVisible();
    expect(screen.getByText('Body failed-read')).toBeVisible();
    expect(mail.updateMessage).toHaveBeenCalledExactlyOnceWith({
      accountId: 'account-1',
      messageId: 'failed-read',
      read: true,
    });
    expect(screen.getByRole('button', { name: /failed-read/ })).toHaveClass(
      'bg-muted/30',
    );
  });

  it('marks loaded conversation messages read, including earlier pages, without writing already-read mail or drafts', async () => {
    const unread = {
      ...createUnreadMessage('thread'),
      conversationId: 'conversation-1',
    };
    const read = { ...createUnreadMessage('read'), read: true };
    const draft = { ...createUnreadMessage('draft'), draft: true };
    const older = createUnreadMessage('older');
    mail.listMessages.mockResolvedValue({ items: [unread] });
    mail.listConversationMessages
      .mockResolvedValueOnce({
        items: [unread, read, draft],
        nextCursor: 'older',
      })
      .mockResolvedValueOnce({ items: [older] });
    mail.updateMessage.mockImplementation(async ({ messageId }) => ({
      ...(messageId === 'older' ? older : unread),
      read: true,
    }));
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: /thread/ }));
    await screen.findByText('Body thread');
    await waitFor(() => expect(mail.updateMessage).toHaveBeenCalledTimes(1));
    fireEvent.click(
      screen.getByRole('button', { name: 'Load earlier messages' }),
    );
    await screen.findByText('Body older');
    await waitFor(() => expect(mail.updateMessage).toHaveBeenCalledTimes(2));
    expect(mail.updateMessage).toHaveBeenLastCalledWith({
      accountId: 'account-1',
      messageId: 'older',
      read: true,
    });
  });

  it('does not mark an unread message read when its detail arrives after selecting another message', async () => {
    const first = createUnreadMessage('first');
    const second = { ...createUnreadMessage('second'), read: true };
    mail.listMessages.mockResolvedValue({ items: [first, second] });
    let finishFirst!: (value: typeof first) => void;
    mail.getMessage
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(second);
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: /first/ }));
    fireEvent.click(screen.getByRole('button', { name: /second/ }));
    await screen.findByText('Body second');
    await act(async () => {
      finishFirst(first);
    });
    expect(mail.updateMessage).not.toHaveBeenCalled();
    expect(screen.queryByText('Body first')).not.toBeInTheDocument();
  });

  it.each(['en-US', 'zh-CN'] as const)(
    'shows localized message ranges, partial pages, and empty filtered results in %s',
    async (locale) => {
      const runtime = new I18nRuntime({
        defaultLocale: 'en-US',
        locales: ['en-US', 'zh-CN'],
      });
      runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
      await runtime.init(locale);
      const labels = (await locales[locale]()).default.workspace;
      const items = Array.from({ length: 50 }, (_, index) => ({
        ...createUnreadMessage(`message-${index}`),
        read: true,
      }));
      mail.listMessages.mockResolvedValueOnce({
        items,
        total: 2333,
        nextCursor: 'page-2',
      });
      render(
        <I18nProvider runtime={runtime}>
          <MailWorkspacePage />
        </I18nProvider>,
      );
      const range = (start: number, end: number, total: number) =>
        locale === 'zh-CN'
          ? `第 ${start}-${end} 条，共 ${total} 条`
          : `${start}-${end} of ${total}`;
      expect(await screen.findByText(range(1, 50, 2333))).toBeVisible();
      expect(mail.listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ pageSize: 50 }),
      );
      const next = screen.getByRole('button', { name: labels.nextPage });
      mail.listMessages.mockResolvedValueOnce({
        items,
        total: 2333,
        nextCursor: 'page-3',
      });
      fireEvent.click(next);
      expect(await screen.findByText(range(51, 100, 2333))).toBeVisible();
      mail.listMessages.mockResolvedValueOnce({
        items,
        total: 2333,
        nextCursor: 'page-4',
      });
      fireEvent.click(next);
      expect(await screen.findByText(range(101, 150, 2333))).toBeVisible();
      mail.listMessages.mockRejectedValueOnce(new Error('Page unavailable'));
      fireEvent.click(next);
      await screen.findByText('Page unavailable');
      expect(screen.getByText(range(101, 150, 2333))).toBeVisible();
      mail.listMessages.mockResolvedValueOnce({
        items: items.slice(0, 3),
        total: 153,
      });
      fireEvent.click(next);
      expect(await screen.findByText(range(151, 153, 153))).toBeVisible();
      expect(next).toBeDisabled();
      mail.listMessages.mockResolvedValueOnce({ items: [], total: 0 });
      fireEvent.click(screen.getByRole('button', { name: labels.unreadOnly }));
      expect(await screen.findByText(labels.noResults)).toBeVisible();
      expect(screen.queryByText(range(151, 153, 153))).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: labels.previousPage }),
      ).toBeDisabled();
    },
  );

  it('pages forward and backward, preserves the page on failure, and resets filters', async () => {
    const message = (id: string) => ({
      id,
      accountId: 'account-1',
      subject: id,
      from: { address: 'sender@example.com' },
      to: [],
      cc: [],
      bcc: [],
      folderIds: [],
      labelIds: [],
      read: true,
      starred: false,
    });
    mail.listMessages.mockResolvedValueOnce({
      items: [message('First page message')],
      nextCursor: 'page-2',
    });
    render(<MailWorkspacePage />);
    await screen.findByText('First page message');
    const previous = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(previous).toBeDisabled();
    expect(screen.getByText('Page 1')).toBeVisible();

    let resolvePage!: (page: { items: ReturnType<typeof message>[] }) => void;
    mail.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    fireEvent.click(next);
    fireEvent.click(next);
    expect(next).toBeDisabled();
    expect(mail.listMessages).toHaveBeenCalledTimes(2);
    expect(mail.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageToken: 'page-2', pageSize: 50 }),
    );
    await act(async () => {
      resolvePage({ items: [message('Second page message')] });
    });
    expect(screen.queryByText('First page message')).not.toBeInTheDocument();
    expect(screen.getByText('Second page message')).toBeVisible();
    expect(screen.getByText('Page 2')).toBeVisible();
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();

    mail.listMessages.mockRejectedValueOnce(new Error('Page unavailable'));
    fireEvent.click(previous);
    await screen.findByText('Page unavailable');
    expect(screen.getByText('Second page message')).toBeVisible();
    expect(screen.getByText('Page 2')).toBeVisible();
    mail.listMessages.mockResolvedValueOnce({
      items: [message('First page message')],
      nextCursor: 'page-2',
    });
    fireEvent.click(previous);
    await screen.findByText('First page message');
    expect(mail.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageToken: undefined }),
    );
    expect(screen.getByText('Page 1')).toBeVisible();

    mail.listMessages.mockResolvedValueOnce({
      items: [message('Second page message')],
    });
    fireEvent.click(next);
    await screen.findByText('Second page message');
    mail.listMessages.mockResolvedValueOnce({
      items: [message('Unread message')],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unread' }));
    await screen.findByText('Unread message');
    expect(screen.getByText('Page 1')).toBeVisible();
    expect(previous).toBeDisabled();
    expect(mail.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ unread: true }),
    );
    expect(mail.listMessages.mock.lastCall?.[0]).not.toHaveProperty(
      'pageToken',
    );
  });

  it.each([['management', MailManagementPage, 'listManagedMessages']] as const)(
    'jumps directly to unvisited %s pages, rejects empty pages, and resets page size',
    async (_name, Page, method) => {
      const first = createUnreadMessage('First page');
      const fourth = createUnreadMessage('Fourth page');
      mail[method].mockImplementation(async (input) => ({
        items: input.page === 5 ? [] : [input.page === 4 ? fourth : first],
        total: input.pageSize * 5,
      }));
      render(<Page />);
      await screen.findByText(first.subject);
      fireEvent.change(screen.getByRole('spinbutton', { name: 'Go to page' }), {
        target: { value: '4' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Go', exact: true }));
      await screen.findByText(fourth.subject);
      expect(mail[method]).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 4, pageSize: 20 }),
      );
      expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      mail[method].mockResolvedValueOnce({ items: [] });
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText(
        'This page has no records. Choose another page or refresh.',
      );
      expect(screen.getByText(fourth.subject)).toBeVisible();
      expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      fireEvent.change(
        screen.getByRole('combobox', { name: 'Rows per page' }),
        { target: { value: '50' } },
      );
      await screen.findByText(first.subject);
      expect(mail[method]).toHaveBeenLastCalledWith(
        expect.objectContaining({ pageSize: 50 }),
      );
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    },
  );

  it('ignores a pending page response after switching mailbox filters', async () => {
    mail.listMessages.mockResolvedValueOnce({
      items: [],
      nextCursor: 'page-2',
    });
    render(<MailWorkspacePage />);
    const next = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(next).toBeEnabled());
    let resolvePage!: (page: { items: []; nextCursor: string }) => void;
    mail.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    fireEvent.click(next);
    mail.listMessages.mockResolvedValueOnce({ items: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Unread' }));
    await waitFor(() => expect(mail.listMessages).toHaveBeenCalledTimes(3));
    await act(async () => {
      resolvePage({ items: [], nextCursor: 'stale-page-3' });
    });
    expect(screen.getByText('Page 1')).toBeVisible();
    expect(next).toBeDisabled();
  });

  it.each([
    { text: 'Original message body', html: undefined },
    { text: undefined, html: '<p>Original <strong>message body</strong></p>' },
  ])('prefills the forwarded message body: %j', async (body) => {
    const message = {
      ...createUnreadMessage('forward-source'),
      ...body,
      read: true,
    };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    await act(async () => {
      render(<MailWorkspacePage />);
    });

    fireEvent.click(screen.getByText('forward-source'));
    fireEvent.click(await screen.findByRole('button', { name: 'Forward' }));

    const editor = await screen.findByLabelText('Message body');
    expect(editor).toBeEmptyDOMElement();
    const quote = screen.getByTitle('Forwarded message');
    const quotedDocument = new DOMParser().parseFromString(
      quote.getAttribute('srcdoc') ?? '',
      'text/html',
    );
    expect(quotedDocument.body.textContent).toContain('Original message body');
    expect(quote).not.toHaveAttribute(
      'sandbox',
      expect.stringContaining('allow-scripts'),
    );
    if (body.html)
      expect(quotedDocument.querySelector('strong')?.textContent).toBe(
        'message body',
      );
    expect(screen.getByLabelText('Subject')).toHaveValue('Fwd: forward-source');
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Original message body'),
          forwardOfMessageId: message.id,
          forwardBodyIncluded: true,
        }),
      ),
    );
  });

  it('preserves forwarded CSS when saving, reopening and editing a draft', async () => {
    const source = {
      ...createUnreadMessage('styled-forward'),
      read: true,
      html: '<head><style>.banner { color: red; padding: 20px; }</style></head><body><table width="600"><tr><td class="banner" style="background:gold">Original styled body</td></tr></table></body>',
      text: 'Original styled body',
    };
    mail.saveDraft.mockImplementation(
      async (input: { html: string; text: string }) => ({
        ...source,
        ...input,
        id: 'styled-draft',
        draft: true,
      }),
    );
    mail.listMessages.mockResolvedValue({ items: [source] });
    mail.getMessage.mockResolvedValue(source);
    const first = render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByText('styled-forward'));
    fireEvent.click(await screen.findByRole('button', { name: 'Forward' }));
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Please review</p>';
    fireEvent.input(editor);
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    expect(editor.innerHTML).toBe('<p>Please review</p>');
    await waitFor(() => expect(mail.saveDraft).toHaveBeenCalled());
    const input = mail.saveDraft.mock.calls[0][0] as {
      html: string;
      text: string;
    };
    expect(input.html).toContain('.banner { color: red; padding: 20px; }');
    expect(input.html).toContain('style="background:gold"');
    expect(input.text).toContain('Please review');
    first.unmount();

    const draft = {
      ...source,
      ...input,
      id: 'styled-draft',
      subject: 'Saved styled forward',
      draft: true,
    };
    mail.listMessages.mockResolvedValue({ items: [draft] });
    mail.getMessage.mockResolvedValue(draft);
    await act(async () => {
      render(<MailWorkspacePage />);
    });
    fireEvent.click(screen.getByText('Saved styled forward'));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit draft' }));
    const restored = await screen.findByLabelText('Message body');
    expect(restored).toHaveTextContent('Please review');
    expect(restored).not.toHaveTextContent('Original styled body');
    expect(
      screen.getByTitle('Forwarded message').getAttribute('srcdoc'),
    ).toContain('.banner');
    restored.innerHTML = '<p>Updated note</p>';
    fireEvent.input(restored);
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalled());
    const sent = mail.sendMessage.mock.calls[0][0] as {
      html: string;
      text: string;
    };
    expect(sent.html).toContain('<table width="600">');
    expect(sent.html).toContain('style="background:gold"');
    expect(sent.html.match(/Original styled body/gu)).toHaveLength(1);
    expect(sent.text).toBe('Updated note\n\nOriginal styled body');
  });

  it.each(['', '   '])(
    'confirms sending without a subject (%j) and preserves the composer on cancel',
    async (subject) => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      try {
        render(<MailWorkspacePage />);
        fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
        fireEvent.change(await screen.findByLabelText('TO'), {
          target: { value: 'recipient@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Subject'), {
          target: { value: subject },
        });
        const editor = screen.getByLabelText('Message body');
        editor.innerHTML = '<p>Message content</p>';
        fireEvent.input(editor);
        const send = screen.getByRole('button', { name: 'Send' });
        await waitFor(() => expect(send).toBeEnabled());
        fireEvent.click(send);
        expect(confirm).toHaveBeenCalledWith(
          'Send this message without a subject?',
        );
        expect(mail.sendMessage).not.toHaveBeenCalled();
        expect(editor).toHaveTextContent('Message content');
        confirm.mockReturnValue(true);
        fireEvent.click(send);
        await waitFor(() =>
          expect(mail.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({ subject }),
          ),
        );
      } finally {
        confirm.mockRestore();
      }
    },
  );

  it('sends mail from the production workspace composer', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    await waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
    expect(
      screen.queryByRole('combobox', { name: 'From' }),
    ).not.toBeInTheDocument();
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Production message' },
    });
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message content</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith({
        accountId: 'account-1',
        identityId: 'identity-1',
        signatureId: null,
        to: [{ address: 'recipient@example.com' }],
        cc: [],
        bcc: [],
        subject: 'Production message',
        text: 'Message content',
        html: '<p>Message content</p>',
        inReplyToMessageId: undefined,
        forwardOfMessageId: undefined,
        scheduledAt: undefined,
        draftMessageId: undefined,
        attachmentIds: [],
        retainedAttachmentIds: [],
        idempotencyKey: expect.any(String),
        draftKey: expect.any(String),
        replyBodyIncluded: undefined,
      }),
    );
  });

  it.each(['unknown', 'failed'])(
    'reports a %s submission without claiming delivery was queued',
    async (status) => {
      mail.sendMessage.mockResolvedValue({
        id: 'submission-1',
        accountId: 'account-1',
        status,
        ...(status === 'failed'
          ? {
              error: {
                code: 'GMAIL_HTTP_403',
                category: 'rate_limit',
                retryable: true,
                reasonCode: 'gmailUserRateLimitExceeded',
              },
            }
          : {}),
      });
      render(<MailWorkspacePage />);
      fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
      await waitFor(() =>
        expect(screen.getByLabelText('From address')).toHaveValue(
          JSON.stringify(['account-1', 'identity-1']),
        ),
      );
      fireEvent.change(screen.getByLabelText('TO'), {
        target: { value: 'recipient@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Delivery status' },
      });
      const body = screen.getByLabelText('Message body');
      body.innerHTML = '<p>Test content</p>';
      fireEvent.input(body);
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      if (status === 'unknown') {
        expect(
          await screen.findByText(
            'The sending result could not be confirmed. Check your mailbox with the provider before sending again.',
          ),
        ).toBeInTheDocument();
      } else {
        const notice = await screen.findByText(
          (_, element) =>
            element?.tagName === 'SPAN' &&
            element.textContent?.includes(
              'One or more messages could not be sent.',
            ),
        );
        expect(notice).toHaveTextContent('GMAIL_HTTP_403');
        expect(notice).toHaveTextContent(/Gmail's per-user request limit/);
      }
      expect(screen.queryByLabelText('Subject')).not.toBeInTheDocument();
      expect(
        sessionStorage.getItem('nocobase:mail:composer-recovery:v1:account-1'),
      ).toBeNull();
      expect(
        screen.queryByText('Message queued for delivery.'),
      ).not.toBeInTheDocument();
    },
  );

  it('keeps Cc and Bcc fields hidden until their text buttons are clicked', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));

    expect(screen.queryByLabelText('CC')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('BCC')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cc' }));
    expect(screen.queryByLabelText('CC')).toBeInTheDocument();
    expect(screen.queryByLabelText('BCC')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Bcc' }));
    expect(screen.queryByLabelText('BCC')).toBeInTheDocument();
  });

  it('shows the scheduled time only after enabling scheduled send', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    await waitFor(() =>
      expect(mail.listIdentities).toHaveBeenCalledWith('account-1'),
    );
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Scheduled message' },
    });
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message content</p>';
    fireEvent.input(editor);

    expect(
      screen.queryByLabelText('Send later (optional)'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Schedule send' }));
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    const scheduledAt = '2099-01-01T10:30';
    fireEvent.change(screen.getByLabelText('Send later (optional)'), {
      target: { value: scheduledAt },
    });
    expect(screen.getByRole('button', { name: 'Schedule send' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Schedule send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      ),
    );
  });

  it('opens all accounts first', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'first@example.com',
        scopes: [],
        status: 'active',
      },
      {
        id: 'account-2',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'default@example.com',
        scopes: [],
        status: 'active',
      },
    ]);

    render(<MailWorkspacePage />);

    expect(await screen.findByLabelText('Account')).toHaveValue('');
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: undefined }),
      ),
    );
    const folders = screen.getAllByRole('navigation', { name: 'Folders' })[1];
    expect(
      within(folders)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Sent', 'Drafts']);
  });

  it('lists account-specific folders in collapsible groups without changing account scope', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'first@example.com',
        scopes: [],
        status: 'active',
      },
      {
        id: 'account-2',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'second@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listFolders.mockImplementation(async (accountId: string) => [
      {
        id: `${accountId}-folder`,
        accountId,
        providerFolderId: accountId === 'account-1' ? 'Projects' : 'Receipts',
        type: 'custom',
        name: accountId === 'account-1' ? 'Projects' : 'Receipts',
        kind: 'folder',
      },
    ]);

    render(<MailWorkspacePage />);

    const accountTree = await screen.findByRole('navigation', {
      name: 'Accounts',
    });
    const projects = await within(accountTree).findByRole('button', {
      name: /Projects.*first@example\.com/,
    });
    const receipts = within(accountTree).getByRole('button', {
      name: /Receipts.*second@example\.com/,
    });
    expect(
      within(accountTree).getByRole('button', { name: 'first@example.com' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(projects.querySelector('svg')).toBeInTheDocument();
    expect(receipts.querySelector('svg')).toBeInTheDocument();

    fireEvent.click(projects);

    await waitFor(() =>
      expect(screen.getByLabelText('Account')).toHaveValue(''),
    );
    expect(projects).toHaveAttribute('aria-current', 'page');
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          folderId: 'Projects',
        }),
      ),
    );
  });

  it('keeps connected accounts visible when optional labels loading fails', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'first@example.com',
        scopes: [],
        status: 'active',
      },
      {
        id: 'account-2',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'second@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listLabels.mockRejectedValueOnce(new Error('labels unavailable'));

    render(<MailWorkspacePage />);

    const accountSelect = await screen.findByLabelText('Account');
    expect(
      within(accountSelect).getByRole('option', {
        name: 'first@example.com',
      }),
    ).toBeInTheDocument();
    expect(
      within(accountSelect).getByRole('option', {
        name: 'second@example.com',
      }),
    ).toBeInTheDocument();
  });

  it('shows the standard folders and custom folders for a selected account', async () => {
    mail.listFolders.mockResolvedValue([
      {
        id: 'folder-custom',
        accountId: 'account-1',
        providerFolderId: 'Projects',
        type: 'custom',
        name: 'Projects',
        kind: 'folder',
      },
    ]);

    render(<MailWorkspacePage />);
    fireEvent.change(await screen.findByLabelText('Account'), {
      target: { value: 'account-1' },
    });

    await waitFor(() => {
      const folders = screen.getAllByRole('navigation', { name: 'Folders' })[1];
      expect(
        within(folders)
          .getAllByRole('button')
          .slice(0, 6)
          .map((button) => button.textContent),
      ).toEqual(['Sent', 'Drafts', 'Archive', 'Spam', 'Trash', 'Projects']);
      const projects = within(folders).getByRole('button', {
        name: /Projects.*user@example\.com/,
      });
      expect(projects.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('disables ordinary deletion when the Provider cannot move messages', async () => {
    const providers = await mail.listProviders();
    mail.listProviders.mockResolvedValue(
      providers.map((provider: { capabilities: object }) => ({
        ...provider,
        capabilities: { ...provider.capabilities, moveMessage: false },
      })),
    );
    const message = {
      id: 'imap-1',
      accountId: 'account-1',
      providerMessageId: 'imap:message',
      folderIds: ['INBOX'],
      from: { address: 'sender@example.com' },
      to: [],
      cc: [],
      bcc: [],
      subject: 'IMAP message',
      read: true,
      starred: false,
      draft: false,
      hasAttachments: false,
      attachments: [],
      todo: false,
      labelIds: [],
      replyTo: [],
      references: [],
    };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByText('IMAP message'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'More actions' }),
    );
    expect(
      await screen.findByRole('menuitem', { name: 'Delete' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(mail.deleteMessage).not.toHaveBeenCalled();
  });

  it('permanently deletes a message from Trash only after confirmation', async () => {
    const message = {
      id: 'message-trash',
      accountId: 'account-1',
      providerMessageId: 'provider-trash',
      folderIds: ['TRASH'],
      labelIds: [],
      from: { address: 'sender@example.com' },
      to: [{ address: 'user@example.com' }],
      cc: [],
      bcc: [],
      subject: 'Trash message',
      preview: 'Remove permanently',
      read: true,
      starred: false,
      draft: false,
      hasAttachments: false,
      attachments: [],
      todo: false,
    };
    mail.listFolders.mockResolvedValue([
      {
        id: 'folder-trash',
        accountId: 'account-1',
        providerFolderId: 'TRASH',
        type: 'trash',
        name: 'Trash',
        kind: 'folder',
      },
    ]);
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    try {
      render(<MailWorkspacePage />);
      fireEvent.change(await screen.findByLabelText('Account'), {
        target: { value: 'account-1' },
      });
      await waitFor(() => {
        expect(mail.listMessages).toHaveBeenLastCalledWith(
          expect.objectContaining({ accountId: 'account-1' }),
        );
        expect(screen.getByRole('region', { name: 'Mail' })).toHaveAttribute(
          'aria-busy',
          'false',
        );
      });
      fireEvent.click(await screen.findByText('Trash message'));
      await screen.findByRole('heading', { name: 'Trash message' });
      fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
      fireEvent.click(
        await screen.findByRole('menuitem', { name: 'Permanently delete' }),
      );

      expect(confirm).toHaveBeenCalledWith(
        'Permanently delete this message? This action cannot be undone.',
      );
      expect(mail.deleteMessage).toHaveBeenCalledWith(
        'account-1',
        'message-trash',
        true,
      );
    } finally {
      confirm.mockRestore();
    }
  });

  it('groups messages from the same conversation into one mailbox row', async () => {
    mail.listMessages.mockResolvedValue({
      items: [
        {
          id: 'message-1',
          accountId: 'account-1',
          providerMessageId: 'provider-message-1',
          conversationId: 'conversation-1',
          folderIds: ['INBOX'],
          labelIds: [],
          from: { address: 'latest@example.com' },
          to: [{ address: 'user@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Project update',
          preview: 'Latest update',
          receivedAt: '2026-09-08T00:00:00.000Z',
          read: false,
          starred: false,
          draft: false,
          hasAttachments: false,
          todo: false,
        },
        {
          id: 'message-2',
          accountId: 'account-1',
          providerMessageId: 'provider-message-2',
          conversationId: 'conversation-1',
          folderIds: ['INBOX'],
          labelIds: [],
          from: { address: 'older@example.com' },
          to: [{ address: 'user@example.com' }],
          cc: [],
          bcc: [],
          subject: ' Re:   project   update ',
          preview: 'Older update',
          receivedAt: '2026-09-07T00:00:00.000Z',
          read: true,
          starred: true,
          draft: false,
          hasAttachments: true,
          todo: true,
        },
      ],
    });

    render(<MailWorkspacePage />);

    expect(await screen.findByText('Project update')).toBeInTheDocument();
    expect(screen.getAllByText('Project update')).toHaveLength(1);
    expect(screen.getByText('2', { exact: true })).toBeInTheDocument();
  });

  it('hides suspended accounts and does not load their mail or folders', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'user@example.com',
        scopes: [],
        status: 'suspended',
      },
    ]);

    render(<MailWorkspacePage />);

    expect(
      await screen.findByRole('button', { name: 'Compose' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Sync all mailboxes' }),
    ).toBeDisabled();
    await screen.findByRole('link', { name: 'Connect mail account' });
    expect(
      screen.queryByRole('option', { name: 'user@example.com' }),
    ).toBeNull();
    expect(mail.listMessages).not.toHaveBeenCalled();
    expect(mail.listFolders).not.toHaveBeenCalled();
  });

  it('excludes suspended accounts from the account selector with active accounts present', async () => {
    const active = (await mail.listAccounts())[0];
    mail.listAccounts.mockResolvedValue([
      active,
      {
        ...active,
        id: 'suspended',
        address: 'paused@example.com',
        status: 'suspended',
      },
    ]);
    render(<MailWorkspacePage />);
    const selector = await screen.findByLabelText('Account');
    await waitFor(() =>
      expect(mail.listFolders).toHaveBeenCalledWith('account-1'),
    );
    expect(
      within(selector).getByRole('option', { name: 'user@example.com' }),
    ).toBeVisible();
    expect(
      within(selector).queryByRole('option', { name: 'paused@example.com' }),
    ).toBeNull();
    expect(mail.listFolders).not.toHaveBeenCalledWith('suspended');
  });

  it('clears previously loaded mail when the last account is suspended while away', async () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    const active = (await mail.listAccounts())[0];
    mail.listMessages.mockResolvedValue({
      items: [
        {
          ...createUnreadMessage('old-mail'),
          subject: 'Previously visible mail',
        },
      ],
    });
    render(<MailWorkspacePage />);
    expect(await screen.findByText('Previously visible mail')).toBeVisible();
    mail.listAccounts.mockResolvedValue([{ ...active, status: 'suspended' }]);
    now.mockReturnValue(30_000);
    fireEvent.focus(window);
    await screen.findByRole('link', { name: 'Connect mail account' });
    expect(screen.queryByText('Previously visible mail')).toBeNull();
    expect(
      screen.queryByRole('option', { name: 'user@example.com' }),
    ).toBeNull();
  });

  it('keeps the selected signature when sending to multiple recipients', async () => {
    mail.listSignatures.mockResolvedValue([
      {
        id: 'signature-1',
        accountId: 'account-1',
        name: 'Support signature',
        text: 'Regards, Support',
        isDefault: false,
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Signature' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Support signature' }),
    );
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'first@example.com, second@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Team update' },
    });
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message content</p>';
    fireEvent.input(editor);
    expect(
      screen.queryByRole('checkbox', {
        name: 'Send one private message per recipient (up to 100)',
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          signatureId: null,
          to: [
            { address: 'first@example.com' },
            { address: 'second@example.com' },
          ],
        }),
      ),
    );
    expect(mail.sendBulk).not.toHaveBeenCalled();
  });

  it('inserts the default signature and replaces it when another signature is selected', async () => {
    mail.listSignatures.mockResolvedValue([
      {
        id: 'signature-default',
        accountId: 'account-1',
        name: 'Default',
        text: 'Regards, Sales',
        html: '<p>Regards, Sales</p>',
        isDefault: true,
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
      {
        id: 'signature-support',
        accountId: 'account-1',
        name: 'Support',
        text: 'Support team',
        html: '<p>Support team</p>',
        isDefault: false,
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    try {
      render(<MailWorkspacePage />);
      fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
      const editor = await screen.findByLabelText('Message body');
      await waitFor(() => expect(editor).toHaveTextContent('Regards, Sales'));
      fireEvent.click(screen.getByRole('button', { name: 'Signature' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Support' }));
      expect(editor).toHaveTextContent('Support team');
      expect(editor).not.toHaveTextContent('Regards, Sales');
      fireEvent.click(screen.getByRole('button', { name: 'Signature' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'No signature' }));
      expect(editor).not.toHaveTextContent('Support team');
    } finally {
      confirm.mockRestore();
    }
  });

  it('does not allow sending without a subject and message body', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Subject' },
    });
    expect(send).toBeDisabled();

    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message content</p>';
    fireEvent.input(editor);
    await waitFor(() => expect(send).toBeEnabled());
  });

  it('keeps local labels available even when IMAP has no Provider label support', async () => {
    const message = {
      id: 'message-1',
      accountId: 'account-1',
      providerMessageId: 'imap-message-1',
      folderIds: ['INBOX'],
      labelIds: ['local-label-1'],
      from: { address: 'sender@example.com' },
      to: [{ address: 'user@example.com' }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'IMAP message',
      text: 'Message content',
      read: true,
      starred: false,
      draft: false,
      hasAttachments: false,
      attachments: [],
    };
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'imap-smtp', name: 'personal' },
        address: 'user@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listProviders.mockResolvedValue([
      {
        type: 'imap-smtp',
        name: 'personal',
        label: 'IMAP / SMTP',
        connection: 'credentials',
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
    mail.listFolders.mockResolvedValue([
      {
        id: 'archive',
        accountId: 'account-1',
        providerFolderId: 'Archive',
        type: 'archive',
        name: 'Archive',
        kind: 'folder',
      },
    ]);
    mail.listLabels.mockResolvedValue([
      {
        id: 'local-label-1',
        name: 'Local label',
        color: 'green',
        createdAt: '2026-09-08T00:00:00.000Z',
        updatedAt: '2026-09-08T00:00:00.000Z',
      },
    ]);
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);

    render(<MailWorkspacePage />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    expect(screen.queryByRole('button', { name: 'New label' })).toBeNull();
    const messageRow = await screen.findByRole('button', {
      name: /IMAP message/,
    });
    expect(messageRow).not.toHaveAttribute('aria-current');
    expect(within(messageRow).getByText('Local label')).toBeInTheDocument();
    fireEvent.click(await screen.findByText('IMAP message'));
    await screen.findByRole('heading', { name: 'IMAP message' });
    expect(within(messageRow).getByText('Local label')).toBeInTheDocument();
    const conversation = screen
      .getByRole('heading', { name: 'IMAP message' })
      .closest('section');
    if (!conversation) throw new Error('Missing conversation view');
    fireEvent.keyDown(
      within(conversation).getByRole('button', { name: 'More actions' }),
      { key: 'ArrowDown' },
    );
    const menu = await screen.findByRole('menu', {}, { timeout: 3000 });
    expect(
      within(menu).queryByRole('menuitem', { name: 'Archive' }),
    ).toBeNull();
    fireEvent.click(within(menu).getByRole('menuitem', { name: /^Labels/ }));
    expect(
      within(screen.getByRole('dialog')).getByRole('checkbox', {
        name: 'Local label',
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Compose' }));
    expect(
      screen.getByRole('button', { name: 'Save draft' }),
    ).toBeInTheDocument();
  });

  it('auto-saves rich text after two seconds and updates the same local draft', async () => {
    vi.useFakeTimers();
    try {
      render(<MailWorkspacePage />);
      await vi.waitFor(() => expect(mail.listAccounts).toHaveBeenCalled());

      fireEvent.click(screen.getByRole('button', { name: 'Compose' }));
      await vi.waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Auto-saved message' },
      });
      const editor = screen.getByLabelText('Message body');
      editor.innerHTML = '<p>Hello <strong>team</strong></p>';
      fireEvent.input(editor);
      await vi.advanceTimersByTimeAsync(2_000);
      await vi.waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1));
      expect(mail.saveDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({
          draftMessageId: undefined,
          subject: 'Auto-saved message',
          text: 'Hello team',
          html: '<p>Hello <strong>team</strong></p>',
        }),
      );

      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Updated message' },
      });
      await vi.advanceTimersByTimeAsync(2_000);
      await vi.waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(2));
      expect(mail.saveDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({
          draftMessageId: 'draft-1',
          subject: 'Updated message',
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores an unfinished composer snapshot on demand', async () => {
    window.sessionStorage.setItem(
      'nocobase:mail:composer-recovery:v1:account-1',
      JSON.stringify({
        version: 1,
        accountId: 'account-1',
        identityId: 'identity-1',
        composer: {
          mode: 'new',
          to: 'customer@example.com',
          cc: '',
          bcc: '',
          subject: 'Recovered subject',
          text: 'Recovered body',
          html: '<p>Recovered body</p>',
          scheduledAt: '',
        },
        composeAttachments: [],
        retainedAttachments: [],
      }),
    );
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    expect(
      await screen.findByText('An unfinished message can be restored.'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByLabelText('Subject')).toHaveValue('Recovered subject');
    expect(screen.getByLabelText('Message body')).toHaveTextContent(
      'Recovered body',
    );
  });

  it('closes immediately and flushes the draft in the background without a confirmation', async () => {
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'draft@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('TO')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Close this message?' }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mail.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ to: [{ address: 'draft@example.com' }] }),
      ),
    );
  });

  it('binds current record values when applying a template', async () => {
    mail.listTemplates.mockResolvedValue([
      {
        id: 'template-1',
        name: 'Order update',
        subject: 'Order {{record.number}}',
        text: 'Hello {{record.customer.name}}',
        html: '<p>Hello <strong>{{record.customer.name}}</strong></p>',
        scope: 'private',
      },
    ]);
    render(
      <MailWorkspacePage
        templateVariables={{
          record: { number: 'SO-1001', customer: { name: 'Ada' } },
        }}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Template' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Order update' }),
    );
    expect(screen.getByLabelText('Subject')).toHaveValue('Order SO-1001');
    expect(screen.getByLabelText('Message body')).toHaveTextContent(
      'Hello Ada',
    );
  });

  it('removes inline attachment references when the image is deleted from the body', async () => {
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.change(await screen.findByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Inline image' },
    });
    const file = new File(['image'], 'inline.png', { type: 'image/png' });
    const input = document.querySelector(
      'input[accept="image/png,image/jpeg,image/gif,image/webp"]',
    );
    fireEvent.change(input!, { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByAltText('inline.png')).toHaveAttribute(
        'src',
        '/api/mail/attachments/attachment-1',
      ),
    );
    expect(
      screen.queryByRole('button', { name: 'Remove report.txt' }),
    ).not.toBeInTheDocument();
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Remaining text</p>';
    fireEvent.input(editor);
    expect(
      screen.queryByRole('button', { name: 'Remove report.txt' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: [],
          html: '<p>Remaining text</p>',
        }),
      ),
    );
  });

  it('previews an uploaded inline image and sends image-only HTML with its attachment', async () => {
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Inline image' },
    });
    const file = new File(['image'], 'inline.png', { type: 'image/png' });
    const input = document.querySelector(
      'input[accept="image/png,image/jpeg,image/gif,image/webp"]',
    );
    fireEvent.change(input!, { target: { files: [file] } });
    await waitFor(() =>
      expect(screen.getByAltText('inline.png')).toHaveAttribute(
        'src',
        '/api/mail/attachments/attachment-1',
      ),
    );
    expect(
      screen.queryByRole('button', { name: 'Remove report.txt' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          attachmentIds: ['attachment-1'],
          html: expect.stringContaining(
            'src="cid:nocobase-attachment-1@mail.inline"',
          ),
        }),
      ),
    );
  });

  it('uploads and submits composer attachments', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    const input = document.querySelector('input[type="file"][multiple]');
    if (!(input instanceof HTMLInputElement))
      throw new Error('Missing file input');
    const file = new File(['report'], 'report.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('report.txt')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Attachment message' },
    });
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message with attachment</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ attachmentIds: ['attachment-1'] }),
      ),
    );
    expect(mail.uploadAttachment).toHaveBeenCalledWith(file);
  });

  it('keeps uploaded attachment references stable across autosaves', async () => {
    vi.useFakeTimers();
    try {
      mail.saveDraft.mockResolvedValue({
        id: 'draft-1',
        draft: true,
        attachments: [
          {
            id: 'draft-1:provider-attachment-1',
            messageId: 'draft-1',
            providerAttachmentId: 'provider-attachment-1',
            fileName: 'report.txt',
            contentType: 'text/plain',
            size: 6,
            inline: false,
          },
        ],
      });
      render(<MailWorkspacePage />);
      await vi.waitFor(() => expect(mail.listAccounts).toHaveBeenCalled());
      fireEvent.click(screen.getByRole('button', { name: 'Compose' }));
      const input = document.querySelector('input[type="file"][multiple]');
      if (!(input instanceof HTMLInputElement))
        throw new Error('Missing file input');
      fireEvent.change(input, {
        target: {
          files: [new File(['report'], 'report.txt', { type: 'text/plain' })],
        },
      });
      await vi.waitFor(() => expect(mail.uploadAttachment).toHaveBeenCalled());
      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'First save' },
      });
      await vi.advanceTimersByTimeAsync(2_000);
      await vi.waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1));

      fireEvent.change(screen.getByLabelText('Subject'), {
        target: { value: 'Second save' },
      });
      await vi.advanceTimersByTimeAsync(2_000);
      await vi.waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(2));
      expect(mail.saveDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({
          attachmentIds: ['attachment-1'],
          retainedAttachmentIds: [],
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('syncs the current all-account scope by default', async () => {
    render(<MailWorkspacePage />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Sync all mailboxes' }),
    );

    await waitFor(() =>
      expect(mail.startSync).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          receivedAfter: expect.any(String),
        }),
      ),
    );
  });

  it('syncs every active account when the workspace is in all-account scope', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'first@example.com',
        scopes: [],
        status: 'active',
      },
      {
        id: 'account-2',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'second@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.startSync.mockImplementation(async ({ accountId }) => ({
      id: `sync-${accountId}`,
      accountId,
      mode: 'incremental',
      phase: 'incremental',
      status: 'pending',
      policy: { maxMessages: 10_000, batchSize: 200 },
      processedMessages: 0,
      processedPages: 0,
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:00:00.000Z',
    }));

    render(<MailWorkspacePage />);

    const sync = await screen.findByRole('button', {
      name: 'Sync all mailboxes',
    });
    await waitFor(() => expect(sync).toBeEnabled());
    fireEvent.click(sync);

    await waitFor(() => expect(mail.startSync).toHaveBeenCalledTimes(2));
    expect(mail.startSync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accountId: 'account-1',
        receivedAfter: expect.any(String),
      }),
    );
    expect(mail.startSync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        accountId: 'account-2',
        receivedAfter: expect.any(String),
      }),
    );
  });

  it('offers all three accounts and keeps each sender draft and attachments when switching', async () => {
    mail.listAccounts.mockResolvedValue(
      [1, 2, 3].map((number) => ({
        id: `account-${number}`,
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: `sender${number}@example.com`,
        scopes: [],
        status: 'active',
      })),
    );
    mail.listIdentities.mockImplementation(async (accountId: string) => [
      {
        id: `identity-${accountId}`,
        accountId,
        address: `${accountId}@example.com`,
        isPrimary: true,
        canSend: true,
      },
      {
        id: `blocked-${accountId}`,
        accountId,
        address: `blocked-${accountId}@example.com`,
        canSend: false,
      },
    ]);
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    const first = await screen.findByRole('dialog', { name: 'New message' });
    await waitFor(() =>
      expect(
        within(first).getByLabelText('From address').querySelectorAll('option'),
      ).toHaveLength(3),
    );
    fireEvent.change(within(first).getByLabelText('TO'), {
      target: { value: 'first-recipient@example.com' },
    });
    fireEvent.change(within(first).getByLabelText('Subject'), {
      target: { value: 'First draft' },
    });
    const body = within(first).getByLabelText('Message body');
    body.innerHTML = '<p>First message body</p>';
    fireEvent.input(body);
    fireEvent.change(first.querySelector('input[type=file][multiple]')!, {
      target: {
        files: [new File(['report'], 'report.txt', { type: 'text/plain' })],
      },
    });
    await within(first).findByText('report.txt');
    fireEvent.change(within(first).getByLabelText('From address'), {
      target: { value: JSON.stringify(['account-2', 'identity-account-2']) },
    });
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'New message' })).not.toBe(
        first,
      ),
    );
    const second = screen.getByRole('dialog', { name: 'New message' });
    expect(within(second).getByLabelText('Subject')).toHaveValue('');
    expect(within(second).queryByText('report.txt')).not.toBeInTheDocument();
    fireEvent.change(within(second).getByLabelText('Subject'), {
      target: { value: 'Second draft' },
    });
    fireEvent.change(within(second).getByLabelText('From address'), {
      target: { value: JSON.stringify(['account-1', 'identity-account-1']) },
    });
    await waitFor(() =>
      expect(
        screen
          .getByRole('dialog', { name: 'New message' })
          .querySelector('input[value="First draft"]'),
      ).not.toBeNull(),
    );
    const restored = screen.getByRole('dialog', { name: 'New message' });
    expect(within(restored).getByLabelText('TO')).toHaveValue(
      'first-recipient@example.com',
    );
    expect(within(restored).getByLabelText('Message body')).toHaveTextContent(
      'First message body',
    );
    expect(within(restored).getByText('report.txt')).toBeVisible();
    fireEvent.change(within(restored).getByLabelText('From address'), {
      target: { value: JSON.stringify(['account-3', 'identity-account-3']) },
    });
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'New message' })).not.toBe(
        restored,
      ),
    );
    const third = screen.getByRole('dialog', { name: 'New message' });
    fireEvent.change(within(third).getByLabelText('TO'), {
      target: { value: 'third-recipient@example.com' },
    });
    fireEvent.change(within(third).getByLabelText('Subject'), {
      target: { value: 'Third message' },
    });
    const thirdBody = within(third).getByLabelText('Message body');
    thirdBody.innerHTML = '<p>Third body</p>';
    fireEvent.input(thirdBody);
    await waitFor(() =>
      expect(within(third).getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    fireEvent.click(within(third).getByRole('button', { name: 'Send' }));
    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-3',
          identityId: 'identity-account-3',
          subject: 'Third message',
          attachmentIds: [],
          retainedAttachmentIds: [],
        }),
      ),
    );
    expect(
      window.localStorage.getItem(
        'nocobase:mail:last-compose-account:v1:user-1',
      ),
    ).toBe('account-3');
  });

  it('keeps available senders when another account fails and excludes inactive or receive-only accounts', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
      },
      {
        id: 'unavailable',
        provider: { type: 'gmail', name: 'google' },
        status: 'active',
      },
      {
        id: 'suspended',
        provider: { type: 'gmail', name: 'google' },
        status: 'suspended',
      },
      {
        id: 'receive-only',
        provider: { type: 'imap', name: 'imap' },
        status: 'active',
      },
    ]);
    mail.listProviders.mockResolvedValue([
      {
        type: 'gmail',
        name: 'google',
        capabilities: { send: true, receive: true },
      },
      {
        type: 'imap',
        name: 'imap',
        capabilities: { send: false, receive: true },
      },
    ]);
    mail.listIdentities.mockImplementation(async (accountId: string) => {
      if (accountId === 'unavailable')
        throw new Error('Account identities unavailable');
      return [
        {
          id: 'primary',
          accountId,
          address: 'primary@example.com',
          isPrimary: true,
          canSend: true,
        },
        { id: 'alias', accountId, address: 'alias@example.com', canSend: true },
        {
          id: 'blocked',
          accountId,
          address: 'blocked@example.com',
          canSend: false,
        },
      ];
    });
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    await screen.findByText('Account identities unavailable');
    const from = screen.getByRole('combobox', { name: 'From address' });
    expect(within(from).getAllByRole('option')).toHaveLength(2);
    expect(mail.listIdentities).not.toHaveBeenCalledWith('suspended');
    expect(mail.listIdentities).not.toHaveBeenCalledWith('receive-only');
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Keep same-account content' },
    });
    fireEvent.change(from, {
      target: { value: JSON.stringify(['account-1', 'alias']) },
    });
    expect(from).toHaveValue(JSON.stringify(['account-1', 'alias']));
    expect(screen.getByLabelText('Subject')).toHaveValue(
      'Keep same-account content',
    );
  });

  it('uses the browser-cached account when opening a new composer', async () => {
    mail.listAccounts.mockResolvedValue([
      {
        id: 'account-1',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'first@example.com',
        scopes: [],
        status: 'active',
      },
      {
        id: 'account-2',
        userId: 'user-1',
        provider: { type: 'gmail', name: 'google' },
        address: 'second@example.com',
        scopes: [],
        status: 'active',
      },
    ]);
    mail.listIdentities.mockImplementation(async (accountId) => [
      {
        id: `identity-${accountId}`,
        accountId,
        address:
          accountId === 'account-2'
            ? 'second@example.com'
            : 'first@example.com',
        isPrimary: true,
        canSend: true,
      },
    ]);
    window.localStorage.setItem(
      'nocobase:mail:last-compose-account:v1:user-1',
      'account-2',
    );

    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
    await waitFor(() =>
      expect(mail.listIdentities).toHaveBeenCalledWith('account-2'),
    );
    fireEvent.change(screen.getByLabelText('TO'), {
      target: { value: 'recipient@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Cached account message' },
    });
    const editor = screen.getByLabelText('Message body');
    editor.innerHTML = '<p>Message content</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-2',
          identityId: 'identity-account-2',
        }),
      ),
    );
  });

  it('shows scheduled time and waits for cancellation before reopening the draft', async () => {
    const draft = {
      ...createUnreadMessage('scheduled-draft'),
      read: true,
      draft: true,
      scheduledSend: {
        id: 'scheduled-1',
        accountId: 'account-1',
        status: 'pending',
        scheduledAt: '2099-01-01T10:00:00Z',
      },
    };
    mail.listMessages.mockResolvedValue({ items: [draft] });
    mail.getMessage.mockResolvedValue(draft);
    let finishCancel!: () => void;
    mail.cancelSubmission.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishCancel = resolve;
        }),
    );
    const { container } = render(<MailWorkspacePage />);
    fireEvent.click(
      await screen.findByRole('button', { name: /scheduled-draft/ }),
    );
    const edit = await screen.findByRole('button', {
      name: 'Cancel schedule and edit',
    });
    expect(
      container.querySelector('time[datetime="2099-01-01T10:00:00Z"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Cancel scheduled send' }),
    ).toBeInTheDocument();
    fireEvent.click(edit);
    fireEvent.click(edit);
    await waitFor(() => expect(mail.cancelSubmission).toHaveBeenCalledTimes(1));
    expect(mail.cancelSubmission).toHaveBeenCalledWith('scheduled-1');
    expect(screen.queryByLabelText('Message body')).not.toBeInTheDocument();
    await act(async () => {
      finishCancel();
    });
    expect(await screen.findByLabelText('Message body')).toHaveTextContent(
      'Body scheduled-draft',
    );
    expect(
      screen.getByRole('checkbox', { name: 'Schedule send' }),
    ).not.toBeChecked();
  });

  it('keeps the scheduled draft closed when cancellation loses the send race', async () => {
    const draft = {
      ...createUnreadMessage('scheduled-draft'),
      read: true,
      draft: true,
      scheduledSend: {
        id: 'scheduled-1',
        accountId: 'account-1',
        status: 'pending',
        scheduledAt: '2099-01-01T10:00:00Z',
      },
    };
    mail.listMessages.mockResolvedValue({ items: [draft] });
    mail.getMessage.mockResolvedValue(draft);
    mail.cancelSubmission.mockRejectedValue(new Error('Already submitting'));
    render(<MailWorkspacePage />);
    fireEvent.click(
      await screen.findByRole('button', { name: /scheduled-draft/ }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel schedule and edit' }),
    );
    await screen.findByText(
      'Sending has started or the status has changed. Refresh to check the sending status.',
    );
    expect(screen.queryByLabelText('Message body')).not.toBeInTheDocument();
  });

  it('reloads an existing draft revision before editing and persists the new content', async () => {
    const stale = {
      ...createUnreadMessage('reopened-draft'),
      draft: true,
      read: true,
      draftRevision: 1,
    };
    const latest = { ...stale, draftRevision: 7, text: 'Latest stored body' };
    mail.listMessages.mockResolvedValue({ items: [stale] });
    mail.getMessage.mockResolvedValueOnce(stale).mockResolvedValue(latest);
    mail.saveDraft.mockImplementation(
      async (input: { draftRevision: number; text: string }) =>
        input.draftRevision > latest.draftRevision
          ? { ...latest, ...input }
          : latest,
    );
    render(<MailWorkspacePage />);
    fireEvent.click(await screen.findByText('reopened-draft'));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit draft' }));
    const editor = await screen.findByLabelText('Message body');
    expect(editor).toHaveTextContent('Latest stored body');
    editor.innerHTML = '<p>Edited after reopening</p>';
    fireEvent.input(editor);
    await waitFor(
      () =>
        expect(mail.saveDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            draftRevision: 8,
            text: 'Edited after reopening',
          }),
        ),
      { timeout: 3000 },
    );
    expect((await mail.saveDraft.mock.results[0].value).text).toBe(
      'Edited after reopening',
    );
  });

  it.each([true, false])(
    'closes the compose dialog only after manual save succeeds (%s)',
    async (succeeds) => {
      let resolveSave!: (value: { id: string; attachments: [] }) => void;
      let rejectSave!: (error: Error) => void;
      mail.saveDraft.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolveSave = resolve;
            rejectSave = reject;
          }),
      );
      render(<MailWorkspacePage />);
      fireEvent.click(await screen.findByRole('button', { name: 'Compose' }));
      fireEvent.change(await screen.findByLabelText('Subject'), {
        target: { value: 'Saved manually' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
      await waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1));
      expect(screen.getByLabelText('Subject')).toHaveValue('Saved manually');
      await act(async () => {
        if (succeeds) resolveSave({ id: 'manual-draft', attachments: [] });
        else rejectSave(new Error('Offline'));
      });
      if (succeeds) {
        await waitFor(() =>
          expect(screen.queryByLabelText('Subject')).not.toBeInTheDocument(),
        );
        expect(
          sessionStorage.getItem(
            'nocobase:mail:composer-recovery:v1:account-1',
          ),
        ).toBeNull();
      } else {
        expect(screen.getByLabelText('Subject')).toHaveValue('Saved manually');
        expect(await screen.findByText('Draft not saved')).toBeVisible();
      }
    },
  );

  it('edits an existing draft and can remove its retained attachment', async () => {
    const draft = {
      id: 'draft-1',
      accountId: 'account-1',
      providerMessageId: 'provider-draft-1',
      providerDraftId: 'provider-draft-resource-1',
      folderIds: ['DRAFT'],
      labelIds: [],
      from: { address: 'user@example.com' },
      to: [{ address: 'recipient@example.com' }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Existing draft',
      text: 'Draft content',
      read: true,
      starred: false,
      draft: true,
      hasAttachments: true,
      attachments: [
        {
          id: 'draft-1:provider-attachment-1',
          messageId: 'draft-1',
          providerAttachmentId: 'provider-attachment-1',
          fileName: 'old.txt',
          contentType: 'text/plain',
          size: 3,
          inline: false,
        },
      ],
    };
    mail.listMessages.mockResolvedValue({ items: [draft] });
    mail.getMessage.mockResolvedValue(draft);
    render(<MailWorkspacePage />);

    fireEvent.click(await screen.findByText('Existing draft'));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit draft' }));
    expect((await screen.findAllByText('old.txt')).length).toBeGreaterThan(0);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove old.txt' }),
    );
    await waitFor(
      () =>
        expect(mail.saveDraft).toHaveBeenCalledWith(
          expect.objectContaining({
            draftMessageId: 'draft-1',
            retainedAttachmentIds: [],
          }),
        ),
      { timeout: 3000 },
    );
  });

  it('opens managed message details without selecting or marking the row read', async () => {
    const message = createUnreadMessage('detail-message');
    mail.listManagedMessages.mockResolvedValue({ items: [message] });
    mail.getManagedMessage.mockResolvedValue(message);
    render(<MailManagementPage />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'View details' }),
    );
    expect(await screen.findByText('Body detail-message')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'data-slot',
      'sheet-content',
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'right');
    expect(mail.getManagedMessage).toHaveBeenCalledWith(
      'account-1',
      'detail-message',
    );
    expect(mail.getMessage).not.toHaveBeenCalled();
    expect(mail.manageMessages).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen
        .getAllByRole('checkbox')
        .every((checkbox) => !(checkbox as HTMLInputElement).checked),
    ).toBe(true);
  });

  it.each([false, true])(
    'shows draft status without read state in the table and detail drawer (read: %s)',
    async (read) => {
      const draft = {
        ...createUnreadMessage('managed-draft'),
        draft: true,
        read,
      };
      mail.listManagedMessages.mockResolvedValue({ items: [draft] });
      mail.getManagedMessage.mockResolvedValue(draft);
      render(<MailManagementPage />);
      await screen.findByText('managed-draft');
      const row = screen.getByText('managed-draft').closest('tr')!;
      expect(within(row).getByText('dev.management.draft')).toBeInTheDocument();
      expect(
        within(row).queryByText('dev.management.read'),
      ).not.toBeInTheDocument();
      expect(
        within(row).queryByText('dev.management.unread'),
      ).not.toBeInTheDocument();
      fireEvent.click(within(row).getByRole('checkbox'));
      expect(screen.getByRole('button', { name: 'Mark read' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Mark unread' }),
      ).toBeDisabled();
      fireEvent.click(
        within(row).getByRole('button', { name: 'View details' }),
      );
      await screen.findByText('Body managed-draft');
      const drawer = screen.getByRole('dialog');
      expect(
        within(drawer).getByText('dev.management.draft'),
      ).toBeInTheDocument();
      expect(
        within(drawer).queryByText('dev.management.read'),
      ).not.toBeInTheDocument();
      expect(
        within(drawer).queryByText('dev.management.unread'),
      ).not.toBeInTheDocument();
      expect(mail.manageMessages).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['Mark read', 'markRead'],
    ['Mark unread', 'markUnread'],
  ])('skips selected drafts when applying %s', async (label, action) => {
    const draft = { ...createUnreadMessage('managed-draft'), draft: true };
    const received = createUnreadMessage('received-mail');
    mail.listManagedMessages.mockResolvedValue({ items: [draft, received] });
    mail.manageMessages.mockResolvedValue({
      items: [
        {
          accountId: received.accountId,
          messageId: received.id,
          status: 'succeeded',
        },
      ],
      succeeded: 1,
      failed: 0,
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      render(<MailManagementPage />);
      await screen.findByText('managed-draft');
      fireEvent.click(screen.getAllByRole('checkbox')[0]);
      fireEvent.click(screen.getByRole('button', { name: label }));
      await waitFor(() =>
        expect(mail.manageMessages).toHaveBeenCalledWith({
          action,
          items: [{ accountId: received.accountId, messageId: received.id }],
        }),
      );
      expect(confirm).toHaveBeenCalledWith(
        expect.stringContaining('1 selected messages'),
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: label })).toBeDisabled(),
      );
      const row = screen.getByText('managed-draft').closest('tr')!;
      expect(within(row).getByRole('checkbox')).toBeChecked();
    } finally {
      confirm.mockRestore();
    }
  });

  it.each([false, true])(
    'omits inline images from draft attachment lists while preserving real files (%s)',
    async (withFile) => {
      const draft = {
        ...createUnreadMessage('inline-draft'),
        draft: true,
        read: true,
        html: '<p>Draft body</p><img src="cid:logo">',
        attachments: [
          {
            id: 'image-1',
            messageId: 'inline-draft',
            providerAttachmentId: 'image-1',
            fileName: 'logo.png',
            contentType: 'image/png',
            size: 3,
            inline: true,
            contentId: 'logo',
          },
          ...(withFile
            ? [
                {
                  id: 'document-1',
                  messageId: 'inline-draft',
                  providerAttachmentId: 'document-1',
                  fileName: 'report.pdf',
                  contentType: 'application/pdf',
                  size: 5,
                  inline: false,
                },
              ]
            : []),
        ],
      };
      mail.listMessages.mockResolvedValue({ items: [draft] });
      mail.getMessage.mockResolvedValue(draft);
      render(<MailWorkspacePage />);
      fireEvent.click(await screen.findByText('inline-draft'));
      const frame = await screen.findByTitle('inline-draft');
      expect(frame.getAttribute('srcdoc')).toContain('/attachments/image-1');
      expect(
        screen.queryByRole('button', { name: 'Download logo.png' }),
      ).not.toBeInTheDocument();
      if (withFile)
        expect(
          screen.getByRole('button', { name: 'Download report.pdf' }),
        ).toBeVisible();
      else expect(screen.queryByText(/1 attachment/)).not.toBeInTheDocument();
    },
  );

  it('renders managed HTML with protected inline images and reports attachment download failures', async () => {
    const message = {
      ...createUnreadMessage('html-detail'),
      html: '<p>Full body</p><img src="cid:logo">',
      attachments: [
        {
          id: 'file-1',
          messageId: 'html-detail',
          providerAttachmentId: 'remote-file',
          fileName: 'logo.png',
          contentType: 'image/png',
          size: 3,
          inline: true,
          contentId: 'logo',
        },
        {
          id: 'document-1',
          messageId: 'html-detail',
          providerAttachmentId: 'document-1',
          fileName: 'report.pdf',
          contentType: 'application/pdf',
          size: 5,
          inline: false,
        },
      ],
    };
    mail.listManagedMessages.mockResolvedValue({ items: [message] });
    mail.getManagedMessage.mockResolvedValue(message);
    mail.downloadManagedAttachment.mockRejectedValueOnce(
      new Error('Attachment unavailable'),
    );
    render(<MailManagementPage />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'View details' }),
    );
    const frame = await screen.findByTitle('html-detail');
    expect(frame).toHaveAttribute(
      'sandbox',
      'allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    );
    expect(frame.getAttribute('srcdoc')).toContain(
      '/api/mail/management/accounts/account-1/messages/html-detail/attachments/file-1',
    );
    fireEvent.click(screen.getByRole('button', { name: 'report.pdf' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Attachment unavailable',
    );
    expect(mail.downloadManagedAttachment).toHaveBeenCalledWith(
      'account-1',
      'html-detail',
      'document-1',
    );
    expect(mail.downloadAttachment).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'report.pdf' })).toBeEnabled();
  });

  it('retries a failed detail request and ignores a closed message response', async () => {
    const first = createUnreadMessage('first-detail');
    const second = createUnreadMessage('second-detail');
    let resolveFirst!: (message: typeof first) => void;
    mail.listManagedMessages.mockResolvedValue({ items: [first, second] });
    mail.getManagedMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    render(<MailManagementPage />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'View details' }))[0],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    mail.getManagedMessage.mockRejectedValueOnce(
      new Error('Detail unavailable'),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[1]);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Detail unavailable',
    );
    mail.getManagedMessage.mockResolvedValueOnce(second);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Body second-detail')).toBeInTheDocument();
    await act(async () => {
      resolveFirst(first);
    });
    expect(screen.queryByText('Body first-detail')).not.toBeInTheDocument();
  });

  it('lists synchronized messages across every account in the management table', async () => {
    mail.listManagedMessages.mockResolvedValue({
      items: [
        {
          id: 'message-1',
          accountId: 'account-1',
          providerMessageId: 'provider-message-1',
          folderIds: ['INBOX'],
          labelIds: [],
          from: { address: 'sender@example.com' },
          to: [{ address: 'user@example.com' }],
          cc: [],
          bcc: [],
          subject: 'Management table message',
          read: false,
          starred: false,
          draft: false,
          hasAttachments: false,
          receivedAt: '2026-09-07T00:00:00.000Z',
        },
      ],
    });

    render(<MailManagementPage />);

    expect(
      await screen.findByText('Management table message'),
    ).toBeInTheDocument();
    expect(mail.listManagedMessages).toHaveBeenCalledWith({
      accountId: undefined,
      q: undefined,
      page: 1,
      pageSize: 20,
    });
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveValue(
      '20',
    );
  });

  it('opens the last management page and updates its last page number after filtering', async () => {
    mail.listManagedMessages.mockImplementation(
      async ({ page, pageSize, q }) => ({
        items: [createUnreadMessage(`Message at ${(page - 1) * pageSize}`)],
        total: q ? 25 : 205,
      }),
    );
    render(<MailManagementPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Page 11' }));
    expect(await screen.findByText('Message at 200')).toBeVisible();
    expect(mail.listManagedMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 11, pageSize: 20 }),
    );
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: /Search/i }), {
      target: { value: 'filtered' },
    });
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Page 11' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('replaces management rows when paging and clears selection when returning', async () => {
    const first = createUnreadMessage('First page message');
    const second = createUnreadMessage('Second page message');
    // Two pages at any page size: the second one is the last.
    mail.listManagedMessages.mockImplementation(async ({ page, pageSize }) =>
      page > 1
        ? { items: [second], total: pageSize + 1 }
        : { items: [first], total: pageSize + 1 },
    );
    render(<MailManagementPage />);
    await screen.findByText(first.subject);
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText(second.subject);
    expect(screen.queryByText(first.subject)).not.toBeInTheDocument();
    expect(screen.getByText('Page 2 · 20 per page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    expect(mail.listManagedMessages).toHaveBeenLastCalledWith({
      accountId: undefined,
      q: undefined,
      page: 2,
      pageSize: 20,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await screen.findByText(first.subject);
    expect(screen.queryByText(second.subject)).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
    expect(screen.getByText('Page 1 · 20 per page')).toBeInTheDocument();
  });

  it('keeps the management page on a failed request and resets pagination for filters and refresh', async () => {
    const first = createUnreadMessage('First page message');
    const second = createUnreadMessage('Second page message');
    // Two pages at any page size: the second one is the last.
    mail.listManagedMessages.mockImplementation(async ({ page, pageSize }) =>
      page > 1
        ? { items: [second], total: pageSize + 1 }
        : { items: [first], total: pageSize + 1 },
    );
    render(<MailManagementPage />);
    await screen.findByText(first.subject);
    mail.listManagedMessages.mockRejectedValueOnce(
      new Error('Page unavailable'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText('Page unavailable');
    expect(screen.getByText('Page 1 · 20 per page')).toBeInTheDocument();
    expect(screen.getByText(first.subject)).toBeInTheDocument();
    for (const reset of [
      () =>
        fireEvent.change(screen.getByRole('combobox', { name: 'Account' }), {
          target: { value: 'account-1' },
        }),
      () =>
        fireEvent.change(
          screen.getByRole('textbox', { name: 'Search subject or preview' }),
          { target: { value: 'search' } },
        ),
      () => fireEvent.click(screen.getByRole('button', { name: 'Refresh' })),
      ...['50', '100'].map(
        (size) => () =>
          fireEvent.change(
            screen.getByRole('combobox', { name: 'Rows per page' }),
            {
              target: { value: size },
            },
          ),
      ),
    ]) {
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText(second.subject);
      expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(mail.listManagedMessages.mock.lastCall?.[0].pageSize).toBe(
        Number(
          (
            screen.getByRole('combobox', {
              name: 'Rows per page',
            }) as HTMLSelectElement
          ).value,
        ),
      );
      fireEvent.click(screen.getAllByRole('checkbox')[1]);
      reset();
      await screen.findByText(first.subject);
      expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
      expect(
        screen.getByRole('button', { name: 'Previous page' }),
      ).toBeDisabled();
      expect(mail.listManagedMessages.mock.lastCall?.[0].page).toBe(1);
    }
    expect(mail.listManagedMessages).toHaveBeenLastCalledWith({
      accountId: 'account-1',
      q: 'search',
      page: 1,
      pageSize: 100,
    });
  });

  it('ignores a management page response after the account filter changes', async () => {
    const first = createUnreadMessage('First page message');
    const stale = createUnreadMessage('Stale page message');
    mail.listManagedMessages.mockResolvedValue({
      items: [first],
      total: 21,
    });
    render(<MailManagementPage />);
    await screen.findByText(first.subject);
    let resolvePage!: (page: { items: (typeof stale)[] }) => void;
    mail.listManagedMessages.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePage = resolve;
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Account' }), {
      target: { value: 'account-1' },
    });
    await screen.findByText(first.subject);
    await act(async () => {
      resolvePage({ items: [stale] });
    });
    expect(screen.queryByText(stale.subject)).not.toBeInTheDocument();
    expect(screen.getByText('Page 1 · 20 per page')).toBeInTheDocument();
  });

  it('refreshes batch results on the current management page and keeps failures selected', async () => {
    const first = createUnreadMessage('First page message');
    const second = createUnreadMessage('Second page message');
    // Two pages at any page size: the second one is the last.
    mail.listManagedMessages.mockImplementation(async ({ page, pageSize }) =>
      page > 1
        ? { items: [second], total: pageSize + 1 }
        : { items: [first], total: pageSize + 1 },
    );
    mail.manageMessages.mockResolvedValue({
      items: [
        { accountId: second.accountId, messageId: second.id, status: 'failed' },
      ],
      succeeded: 0,
      failed: 1,
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      render(<MailManagementPage />);
      await screen.findByText(first.subject);
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await screen.findByText(second.subject);
      fireEvent.click(screen.getAllByRole('checkbox')[1]);
      fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));
      await waitFor(() =>
        expect(mail.listManagedMessages).toHaveBeenCalledTimes(3),
      );
      await screen.findByText(second.subject);
      expect(screen.getByText('Page 2 · 20 per page')).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')[1]).toBeChecked();
      expect(mail.listManagedMessages).toHaveBeenLastCalledWith({
        accountId: undefined,
        q: undefined,
        page: 2,
        pageSize: 20,
      });
    } finally {
      confirm.mockRestore();
    }
  });

  it('runs a management action for selected rows and keeps failed rows selected', async () => {
    const messages = [
      {
        id: 'message-1',
        accountId: 'account-1',
        providerMessageId: 'provider-message-1',
        folderIds: ['INBOX'],
        labelIds: [],
        from: { address: 'sender@example.com' },
        to: [{ address: 'user@example.com' }],
        cc: [],
        bcc: [],
        subject: 'First management message',
        read: false,
        starred: false,
        draft: false,
        hasAttachments: false,
      },
      {
        id: 'message-2',
        accountId: 'account-1',
        providerMessageId: 'provider-message-2',
        folderIds: ['INBOX'],
        labelIds: [],
        from: { address: 'sender@example.com' },
        to: [{ address: 'user@example.com' }],
        cc: [],
        bcc: [],
        subject: 'Second management message',
        read: false,
        starred: false,
        draft: false,
        hasAttachments: false,
      },
    ] as const;
    mail.listManagedMessages.mockResolvedValue({ items: messages });
    mail.manageMessages.mockResolvedValue({
      items: [
        {
          accountId: 'account-1',
          messageId: 'message-1',
          status: 'succeeded',
        },
        {
          accountId: 'account-1',
          messageId: 'message-2',
          status: 'failed',
          error: {
            code: 'MAIL_MANAGEMENT_ACTION_FAILED',
            category: 'unknown',
            retryable: false,
          },
        },
      ],
      succeeded: 1,
      failed: 1,
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<MailManagementPage />);

    expect(
      await screen.findByText('First management message'),
    ).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Mark read' }));

    await waitFor(() =>
      expect(mail.manageMessages).toHaveBeenCalledWith({
        action: 'markRead',
        items: [
          { accountId: 'account-1', messageId: 'message-1' },
          { accountId: 'account-1', messageId: 'message-2' },
        ],
      }),
    );
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        '1 succeeded, 1 failed. Failed messages remain selected for retry.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')[2]).toBeChecked();
    confirm.mockRestore();
  });
});

function createUnreadMessage(id: string) {
  return {
    id,
    accountId: 'account-1',
    providerMessageId: `provider-${id}`,
    subject: id,
    text: `Body ${id}`,
    from: { address: 'sender@example.com' },
    to: [],
    cc: [],
    bcc: [],
    folderIds: [],
    labelIds: [],
    attachments: [],
    read: false,
    starred: false,
    draft: false,
    hasAttachments: false,
  };
}
