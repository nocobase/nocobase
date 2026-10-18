import type { ReactElement } from 'react';
import { renderWithApp, type RenderedApp } from '@nocobase/app-testing/client';
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  watch: vi.fn((_topic: string, _options?: RealtimeWatchOptions<unknown>) => ({
    state: 'subscribed' as const,
    error: undefined,
    retry: () => {},
    close: () => {},
  })),
  onOpen: vi.fn(() => () => undefined),
}));

vi.mock('../../client/runtime.js', () => ({
  useMailClient: () => mail,
}));

import { MAIL_VIRTUAL_FOLDER_IDS } from '../../shared/mail.js';
import type {
  MailClient,
  MailMessage,
  MailOutboundAttachmentView,
} from '../../client/mail-client.js';
import MailWorkspacePage from '../../client/pages/mail-workspace-page.js';
import { MAIL_UNREAD_COUNT_CHANGED_EVENT } from '../../client/components/mail-navigation-icon.js';

describe('[UI][SRV] mail workspace, composer, drafts, and management', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const setFormValue = async (element: HTMLElement, value: string) => {
    if (element instanceof HTMLSelectElement) {
      await user.selectOptions(element, value);
      return;
    }
    await user.clear(element);
    if (value) await user.type(element, value);
  };

  const seedRichTextHtml = (editor: HTMLElement, html: string) => {
    // These tests seed rich editor markup directly to verify serialization rather than keyboard editing.
    editor.innerHTML = html;
    fireEvent.input(editor);
  };

  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    user = userEvent.setup();
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
    await renderPage(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    // The button appears before accounts and provider capabilities finish loading.
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
    await act(async () => {});
    const identities = mail.listIdentities.mock.calls.length;
    const folders = mail.listFolders.mock.calls.length;
    const initialLoads = mail.listAccounts.mock.calls.length;
    await act(async () => {
      // Window focus is a browser lifecycle event, not a user control interaction.
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
    await renderPage(<MailWorkspacePage />);
    await user.click(
      await screen.findByRole('button', { name: /current-mail/ }),
    );
    await screen.findByText('Body current-mail');
    await user.click(screen.getByRole('button', { name: 'Compose' }));
    const composer = await screen.findByRole('dialog', { name: 'New message' });
    await setFormValue(
      within(composer).getByLabelText('To'),
      'unfinished@example.com',
    );
    mail.listMessages.mockResolvedValue({ items: [incoming, initial] });
    const watch = realtime.watch as unknown as {
      mock: {
        calls: [string, { onEvent: (event: { payload: unknown }) => void }][];
      };
    };
    const listener = watch.mock.calls.at(-1)![1].onEvent;
    act(() => listener({ payload: { kind: 'mail.changed' } }));
    await screen.findByRole('button', { name: /new-mail/ });
    expect(screen.getByText('Body current-mail')).toBeInTheDocument();
    expect(within(composer).getByLabelText('To')).toHaveValue(
      'unfinished@example.com',
    );
  });

  it('links first-time users to the accounts page the application names', async () => {
    mail.listAccounts.mockResolvedValue([]);
    await renderPage(<MailWorkspacePage accountsHref='/mail/accounts' />);
    const connect = await screen.findByRole('link', {
      name: 'Connect mail account',
    });
    expect(connect).toHaveAttribute('href', '/mail/accounts');
    expect(screen.getByRole('button', { name: 'Compose' })).toBeDisabled();
  });

  it('shows no setup link when the application names no accounts page', async () => {
    mail.listAccounts.mockResolvedValue([]);
    await renderPage(<MailWorkspacePage />);
    await screen.findByText('Connect your first mailbox');
    expect(
      screen.queryByRole('link', { name: 'Connect mail account' }),
    ).not.toBeInTheDocument();
  });

  it.each(['/', '/main', '/team/crm'])(
    'links production empty workspaces under %s',
    async (basePath) => {
      vi.stubEnv('DEV', false);
      const runtimeConfig = document.getElementById('nocobase-runtime-config')!;
      const originalConfig = runtimeConfig.textContent;
      runtimeConfig.textContent = JSON.stringify({
        version: 1,
        config: { app: { basePath } },
      });
      try {
        mail.listAccounts.mockResolvedValue([]);
        await renderPage(
          <MailWorkspacePage
            accountsHref='/mail/accounts?from=workspace'
            headerActions={<button type='button'>Application action</button>}
          />,
        );
        const connect = await screen.findByRole('link', {
          name: 'Connect mail account',
        });
        expect(connect).toHaveAttribute(
          'href',
          `${basePath === '/' ? '' : basePath}/mail/accounts?from=workspace`,
        );
        expect(
          screen.getByRole('button', { name: 'Application action' }),
        ).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Compose' })).toBeDisabled();
        expect(
          screen.getByRole('button', { name: 'Sync all mailboxes' }),
        ).toBeDisabled();
        expect(
          document.querySelector('a[href*="/dev/mail/accounts"]'),
        ).toBeNull();
      } finally {
        runtimeConfig.textContent = originalConfig;
        vi.unstubAllEnvs();
      }
    },
  );

  it.each([undefined, ''])(
    'does not invent a personal account route without accountsHref %j',
    async (accountsHref) => {
      mail.listAccounts.mockResolvedValue([]);
      const { rerender } = await renderPage(
        <MailWorkspacePage
          accountsHref={accountsHref}
          headerActions={<button type='button'>Application action</button>}
        />,
      );
      await screen.findByText('Connect your first mailbox');
      expect(
        screen.queryByRole('link', { name: 'Connect mail account' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Mail accounts' }),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector('a[href*="/dev/mail/accounts"]'),
      ).toBeNull();
      rerender(<MailWorkspacePage accountsHref='/mail/accounts' />);
      expect(
        screen.getByRole('link', { name: 'Connect mail account' }),
      ).toHaveAttribute('href', '/mail/accounts');
    },
  );

  it('does not invent account links for a populated workspace either', async () => {
    await renderPage(<MailWorkspacePage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    expect(
      screen.queryByRole('link', { name: 'Mail accounts' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Connect mail account' }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="/dev/mail/accounts"]')).toBeNull();
  });

  it('keeps production account management and application actions beside Compose and Sync', async () => {
    const extraAction = vi.fn();
    mail.getSyncRun.mockResolvedValue({
      ...(await mail.startSync()),
      status: 'completed',
    });
    mail.startSync.mockClear();
    await renderPage(
      <MailWorkspacePage
        accountsHref='/mail/accounts'
        headerActions={
          <button type='button' onClick={extraAction}>
            Application action
          </button>
        }
      />,
    );
    const compose = screen.getByRole('button', { name: 'Compose' });
    const sync = screen.getByRole('button', { name: 'Sync all mailboxes' });
    await waitFor(() => expect(compose).toBeEnabled());
    expect(
      await screen.findByRole('link', { name: 'Mail accounts' }),
    ).toHaveAttribute('href', '/mail/accounts');
    expect(
      screen.queryByRole('link', { name: 'Connect mail account' }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(sync).toBeEnabled());
    await user.click(
      screen.getByRole('button', { name: 'Application action' }),
    );
    expect(extraAction).toHaveBeenCalledOnce();
    await user.click(sync);
    await waitFor(() =>
      expect(mail.startSync).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'account-1' }),
      ),
    );
    await user.click(compose);
    await screen.findByRole('dialog', { name: 'New message' });
  });

  it.each(['suspended', 'removing'])(
    'offers account recovery when the only mailbox is %s',
    async (status) => {
      mail.listAccounts.mockResolvedValue([
        {
          id: 'account-1',
          userId: 'user-1',
          provider: { type: 'gmail', name: 'google' },
          address: 'user@example.com',
          scopes: [],
          status,
        },
      ]);
      await renderPage(<MailWorkspacePage accountsHref='/mail/accounts' />);
      expect(
        await screen.findByRole('link', { name: 'Connect mail account' }),
      ).toHaveAttribute('href', '/mail/accounts');
      expect(screen.getByRole('button', { name: 'Compose' })).toBeDisabled();
    },
  );

  it('keeps composer errors and entered text when the mailbox refreshes', async () => {
    mail.listTemplates.mockRejectedValue(new Error('templates unavailable'));
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    const editor = await screen.findByRole('dialog', { name: 'New message' });
    expect(await within(editor).findByRole('alert')).toHaveTextContent(
      'templates unavailable',
    );
    await setFormValue(
      within(editor).getByLabelText('To'),
      'draft@example.com',
    );
    await setFormValue(screen.getByLabelText('Search mail'), 'project');
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'project' }),
      ),
    );
    expect(within(editor).getByRole('alert')).toHaveTextContent(
      'templates unavailable',
    );
    expect(within(editor).getByLabelText('To')).toHaveValue(
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
    await renderPage(<MailWorkspacePage />);
    await user.click(
      await screen.findByRole('button', { name: /Reading flow/ }),
    );
    expect(await screen.findByText('Message content')).toBeInTheDocument();
    const requests = mail.listMessages.mock.calls.length;
    expect(
      screen.getByRole('button', { name: 'Back to message list' }),
    ).toHaveClass('@min-[56rem]/mail:hidden');
    expect(
      screen.getByRole('button', { name: 'Mailboxes and folders' }),
    ).toHaveClass('@min-[56rem]/mail:hidden');
    expect(screen.getByRole('combobox', { name: 'Account' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Reading flow/ }),
    ).toBeInTheDocument();
    expect(mail.listMessages).toHaveBeenCalledTimes(requests);
  });

  it('keeps the mounted list, page and scroll position when returning and ignores late details', async () => {
    const first = { ...createUnreadMessage('First mobile page'), read: true };
    const second = { ...createUnreadMessage('Second mobile page'), read: true };
    mail.listMessages.mockResolvedValueOnce({
      items: [first],
      nextCursor: 'mobile-page-2',
    });
    mail.listMessages.mockResolvedValueOnce({ items: [second] });
    let resolveDetails!: (message: typeof second) => void;
    mail.getMessage.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDetails = resolve;
        }),
    );
    const { container } = await renderPage(<MailWorkspacePage />);
    await screen.findByText(first.subject);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByText(second.subject);
    const list = screen.getByRole('region', { name: 'Mail' });
    list.scrollTop = 137;
    const requests = mail.listMessages.mock.calls.length;
    await user.click(
      screen.getByRole('button', { name: new RegExp(second.subject) }),
    );
    expect(container.querySelector('[data-slot=mail-list-pane]')).toHaveClass(
      'hidden',
    );
    expect(
      container.querySelector('[data-slot=mail-conversation-pane]'),
    ).toHaveClass('flex');
    expect(screen.getByRole('region', { name: 'Mail' })).toBe(list);
    await user.click(
      screen.getByRole('button', { name: 'Back to message list' }),
    );
    await act(async () => {
      resolveDetails(second);
    });
    expect(container.querySelector('[data-slot=mail-list-pane]')).toHaveClass(
      'flex',
    );
    expect(
      container.querySelector('[data-slot=mail-conversation-pane]'),
    ).toHaveClass('hidden');
    expect(screen.getByRole('region', { name: 'Mail' })).toBe(list);
    expect(list.scrollTop).toBe(137);
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(screen.queryByText(second.text)).not.toBeInTheDocument();
    expect(mail.listMessages).toHaveBeenCalledTimes(requests);
    expect(mail.updateMessage).not.toHaveBeenCalled();
  });

  it('closes mailbox navigation for the current folder and returns from the conversation', async () => {
    const message = {
      ...createUnreadMessage('Mobile drawer message'),
      read: true,
    };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    const { container } = await renderPage(<MailWorkspacePage />);
    await user.click(
      await screen.findByRole('button', { name: new RegExp(message.subject) }),
    );
    await screen.findByText(message.text);
    const requests = mail.listMessages.mock.calls.length;
    await user.click(
      screen.getByRole('button', { name: 'Mailboxes and folders' }),
    );
    const drawer = await screen.findByRole('dialog', {
      name: 'Mailboxes and folders',
    });
    const currentFolder = drawer.querySelector<HTMLButtonElement>(
      'button[aria-current="page"]',
    );
    expect(currentFolder).not.toBeNull();
    await user.click(currentFolder!);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(container.querySelector('[data-slot=mail-list-pane]')).toHaveClass(
      'flex',
    );
    expect(
      container.querySelector('[data-slot=mail-conversation-pane]'),
    ).toHaveClass('hidden');
    expect(mail.listMessages).toHaveBeenCalledTimes(requests);
  });

  it.each(['Unread', 'Starred', 'Sent', 'Drafts'])(
    'closes the drawer and switches to %s',
    async (name) => {
      await renderPage(<MailWorkspacePage />);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
      );
      await user.click(
        screen.getByRole('button', { name: 'Mailboxes and folders' }),
      );
      const drawer = await screen.findByRole('dialog', {
        name: 'Mailboxes and folders',
      });
      await user.click(within(drawer).getByRole('button', { name }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(mail.listMessages).toHaveBeenLastCalledWith(
          expect.objectContaining(
            name === 'Unread'
              ? { unread: true }
              : name === 'Starred'
                ? { starred: true }
                : {
                    folderId:
                      name === 'Sent'
                        ? MAIL_VIRTUAL_FOLDER_IDS.sent
                        : MAIL_VIRTUAL_FOLDER_IDS.drafts,
                  },
          ),
        ),
      );
    },
  );

  it('closes navigation on account and label changes', async () => {
    mail.listLabels.mockResolvedValue([
      { id: 'mobile-label', name: 'Customer', color: 'blue' },
    ]);
    await renderPage(<MailWorkspacePage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    await user.click(
      screen.getByRole('button', { name: 'Mailboxes and folders' }),
    );
    let drawer = await screen.findByRole('dialog', {
      name: 'Mailboxes and folders',
    });
    await setFormValue(
      within(drawer).getByRole('combobox', { name: 'Account' }),
      'account-1',
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({ accountId: 'account-1' }),
      ),
    );
    await user.click(
      screen.getByRole('button', { name: 'Mailboxes and folders' }),
    );
    drawer = await screen.findByRole('dialog', {
      name: 'Mailboxes and folders',
    });
    await user.click(within(drawer).getByRole('button', { name: 'Customer' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(mail.listMessages).toHaveBeenLastCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          labelId: 'mobile-label',
        }),
      ),
    );
  });

  it('focuses the narrow reader and restores its retained row without scrolling', async () => {
    const message = { ...createUnreadMessage('Keyboard reading'), read: true };
    mail.listMessages.mockResolvedValue({ items: [message] });
    mail.getMessage.mockResolvedValue(message);
    await renderPage(<MailWorkspacePage />);
    const row = await screen.findByRole('button', {
      name: new RegExp(message.subject),
    });
    const navigation = screen.getByRole('button', {
      name: 'Mailboxes and folders',
    });
    const bounds = new DOMRect(0, 0, 160, 36);
    vi.spyOn(navigation, 'getClientRects').mockReturnValue(
      Object.assign([bounds], { item: () => bounds }),
    );
    const list = screen.getByRole('region', { name: 'Mail' });
    list.scrollTop = 137;
    row.focus();
    await user.click(row);
    const back = screen.getByRole('button', { name: 'Back to message list' });
    await waitFor(() => expect(back).toHaveFocus());
    await screen.findByText(message.text);
    await user.click(back);
    await waitFor(() => expect(row).toHaveFocus());
    expect(list.scrollTop).toBe(137);
  });

  it('closes an open drawer when CSS hides its trigger and focuses the live search control', async () => {
    await renderPage(<MailWorkspacePage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    // Compose can be enabled before the initial message-list effect has settled.
    await waitFor(() => {
      expect(mail.listMessages).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('region', { name: 'Mail' })).toHaveAttribute(
        'aria-busy',
        'false',
      );
    });
    await screen.findByText('No messages match this mailbox view.');
    const navigation = screen.getByRole('button', {
      name: 'Mailboxes and folders',
    });
    const bounds = new DOMRect(0, 0, 160, 36);
    const visibleRects = Object.assign([bounds], { item: () => bounds });
    const hiddenRects = Object.assign([], { item: () => null });
    let visible = true;
    vi.spyOn(navigation, 'getClientRects').mockImplementation(() =>
      visible ? visibleRects : hiddenRects,
    );
    let notify!: () => void;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        readonly callback: () => void;
        constructor(callback: () => void) {
          this.callback = callback;
        }
        observe(target: Element): void {
          if (target === navigation) notify = this.callback;
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    try {
      const requests = mail.listMessages.mock.calls.length;
      await user.click(navigation);
      await screen.findByRole('dialog', { name: 'Mailboxes and folders' });
      act(() => {
        visible = false;
        notify();
      });
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(
          screen.getByRole('textbox', { name: 'Search mail' }),
        ).toHaveFocus(),
      );
      expect(mail.listMessages).toHaveBeenCalledTimes(requests);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('closes navigation with its translated close control without changing the list', async () => {
    await renderPage(<MailWorkspacePage />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    await waitFor(() => expect(mail.listMessages).toHaveBeenCalledTimes(1));
    const requests = mail.listMessages.mock.calls.length;
    await user.click(
      screen.getByRole('button', { name: 'Mailboxes and folders' }),
    );
    const drawer = await screen.findByRole('dialog', {
      name: 'Mailboxes and folders',
    });
    await user.click(
      within(drawer).getByRole('button', { name: 'Close mailbox navigation' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
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
      await renderPage(<MailWorkspacePage />);
      await user.click(
        await screen.findByRole('button', { name: /quote-removal/ }),
      );
      await user.click(await screen.findByRole('button', { name: action }));
      await setFormValue(
        await screen.findByLabelText('To'),
        'recipient@example.com',
      );
      const title = action === 'Reply' ? 'Quoted message' : 'Forwarded message';
      const editor = screen.getByLabelText('Message body');
      seedRichTextHtml(editor, '<p>My own message</p>');
      await user.click(
        screen.getByRole('button', { name: 'Remove quoted content' }),
      );
      expect(screen.queryByTitle(title)).not.toBeInTheDocument();
      expect(editor).toHaveTextContent('My own message');
      await user.click(
        screen.getByRole('button', { name: 'Restore quoted content' }),
      );
      expect(screen.getByTitle(title).getAttribute('srcdoc')).toContain(
        'Body quote-removal',
      );
      await user.click(
        screen.getByRole('button', { name: 'Remove quoted content' }),
      );
      await user.click(screen.getByRole('button', { name: 'Send' }));
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
      await renderPage(<MailWorkspacePage />);
      await user.click(
        await screen.findByRole('button', { name: /reply-target/ }),
      );
      await user.click(await screen.findByRole('button', { name: 'Reply' }));
      expect(await screen.findByLabelText('To')).toHaveValue(
        hasReplyTo
          ? 'reply@example.com, team@example.com'
          : 'sender@example.com',
      );
      expect(
        screen.getByTitle('Quoted message').getAttribute('srcdoc'),
      ).toContain('Body reply-target');
      expect(screen.getByLabelText('Message body')).toBeEmptyDOMElement();
      const editor = screen.getByLabelText('Message body');
      seedRichTextHtml(editor, '<p>My reply</p>');
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
      );
      await user.click(screen.getByRole('button', { name: 'Send' }));
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
    await renderPage(<MailWorkspacePage />);
    await user.click(
      await screen.findByRole('button', { name: /image-reply/ }),
    );
    await user.click(await screen.findByRole('button', { name: 'Reply' }));
    const editor = await screen.findByLabelText('Message body');
    seedRichTextHtml(editor, '<p>My reply</p>');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
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
      await renderPage(<MailWorkspacePage />);
      await user.click(await screen.findByRole('button', { name: /opened/ }));
      await screen.findByText('Body opened');
      expect(mail.updateMessage).toHaveBeenCalledExactlyOnceWith({
        accountId: 'account-1',
        messageId: 'opened',
        read: true,
      });
      expect(refresh).not.toHaveBeenCalled();
      // Opening the same message during the write does not send a duplicate mutation.
      await user.click(screen.getByRole('button', { name: /opened/ }));
      await screen.findByText('Body opened');
      expect(mail.updateMessage).toHaveBeenCalledTimes(1);
      await act(async () => {
        finishRead({ ...message, read: true });
      });
      await user.click(screen.getByRole('button', { name: 'More actions' }));
      expect(
        await screen.findByRole('menuitem', { name: 'Mark unread' }),
      ).toBeVisible();
      await user.keyboard('{Escape}');
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
    await renderPage(<MailWorkspacePage />);
    await user.click(
      await screen.findByRole('button', { name: /failed-read/ }),
    );
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
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByRole('button', { name: /thread/ }));
    await screen.findByText('Body thread');
    await waitFor(() => expect(mail.updateMessage).toHaveBeenCalledTimes(1));
    await user.click(
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
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByRole('button', { name: /first/ }));
    await user.click(screen.getByRole('button', { name: /second/ }));
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
      await renderPage(
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
      await user.click(next);
      expect(await screen.findByText(range(51, 100, 2333))).toBeVisible();
      mail.listMessages.mockResolvedValueOnce({
        items,
        total: 2333,
        nextCursor: 'page-4',
      });
      await user.click(next);
      expect(await screen.findByText(range(101, 150, 2333))).toBeVisible();
      mail.listMessages.mockRejectedValueOnce(new Error('Page unavailable'));
      await user.click(next);
      await screen.findByText('Page unavailable');
      expect(screen.getByText(range(101, 150, 2333))).toBeVisible();
      mail.listMessages.mockResolvedValueOnce({
        items: items.slice(0, 3),
        total: 153,
      });
      await user.click(next);
      expect(await screen.findByText(range(151, 153, 153))).toBeVisible();
      expect(next).toBeDisabled();
      mail.listMessages.mockResolvedValueOnce({ items: [], total: 0 });
      await user.click(screen.getByRole('button', { name: labels.unreadOnly }));
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
    await renderPage(<MailWorkspacePage />);
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
    await user.click(next);
    await user.click(next);
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
    await user.click(previous);
    await screen.findByText('Page unavailable');
    expect(screen.getByText('Second page message')).toBeVisible();
    expect(screen.getByText('Page 2')).toBeVisible();
    mail.listMessages.mockResolvedValueOnce({
      items: [message('First page message')],
      nextCursor: 'page-2',
    });
    await user.click(previous);
    await screen.findByText('First page message');
    expect(mail.listMessages).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageToken: undefined }),
    );
    expect(screen.getByText('Page 1')).toBeVisible();

    mail.listMessages.mockResolvedValueOnce({
      items: [message('Second page message')],
    });
    await user.click(next);
    await screen.findByText('Second page message');
    mail.listMessages.mockResolvedValueOnce({
      items: [message('Unread message')],
    });
    await user.click(screen.getByRole('button', { name: 'Unread' }));
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

  it('ignores a pending page response after switching mailbox filters', async () => {
    mail.listMessages.mockResolvedValueOnce({
      items: [],
      nextCursor: 'page-2',
    });
    await renderPage(<MailWorkspacePage />);
    const next = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(next).toBeEnabled());
    let resolvePage!: (page: { items: []; nextCursor: string }) => void;
    mail.listMessages.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePage = resolve;
        }),
    );
    await user.click(next);
    mail.listMessages.mockResolvedValueOnce({ items: [] });
    await user.click(screen.getByRole('button', { name: 'Unread' }));
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
      await renderPage(<MailWorkspacePage />);
    });

    await user.click(screen.getByText('forward-source'));
    await user.click(await screen.findByRole('button', { name: 'Forward' }));

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
    await setFormValue(screen.getByLabelText('To'), 'recipient@example.com');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
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
    const first = await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByText('styled-forward'));
    await user.click(await screen.findByRole('button', { name: 'Forward' }));
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Please review</p>');
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
      await renderPage(<MailWorkspacePage />);
    });
    await user.click(screen.getByText('Saved styled forward'));
    await user.click(await screen.findByRole('button', { name: 'Edit draft' }));
    const restored = await screen.findByLabelText('Message body');
    expect(restored).toHaveTextContent('Please review');
    expect(restored).not.toHaveTextContent('Original styled body');
    expect(
      screen.getByTitle('Forwarded message').getAttribute('srcdoc'),
    ).toContain('.banner');
    seedRichTextHtml(restored, '<p>Updated note</p>');
    await setFormValue(screen.getByLabelText('To'), 'recipient@example.com');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
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
        await renderPage(<MailWorkspacePage />);
        const compose = await screen.findByRole('button', { name: 'Compose' });
        await waitFor(() => expect(compose).toBeEnabled());
        await user.click(compose);
        await setFormValue(
          await screen.findByLabelText('To'),
          'recipient@example.com',
        );
        await setFormValue(screen.getByLabelText('Subject'), subject);
        const editor = screen.getByLabelText('Message body');
        seedRichTextHtml(editor, '<p>Message content</p>');
        const send = screen.getByRole('button', { name: 'Send' });
        await waitFor(() => expect(send).toBeEnabled());
        await user.click(send);
        expect(confirm).toHaveBeenCalledWith(
          'Send this message without a subject?',
        );
        expect(mail.sendMessage).not.toHaveBeenCalled();
        expect(editor).toHaveTextContent('Message content');
        confirm.mockReturnValue(true);
        await user.click(send);
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
    await renderPage(<MailWorkspacePage />);

    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
    expect(
      screen.queryByRole('combobox', { name: 'From' }),
    ).not.toBeInTheDocument();
    await setFormValue(
      await screen.findByLabelText('To'),
      'recipient@example.com',
    );
    await setFormValue(screen.getByLabelText('Subject'), 'Production message');
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message content</p>');
    await user.click(screen.getByRole('button', { name: 'Send' }));

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
      await renderPage(<MailWorkspacePage />);
      const compose = await screen.findByRole('button', { name: 'Compose' });
      await waitFor(() => expect(compose).toBeEnabled());
      await user.click(compose);
      await waitFor(() =>
        expect(screen.getByLabelText('From address')).toHaveValue(
          JSON.stringify(['account-1', 'identity-1']),
        ),
      );
      await setFormValue(screen.getByLabelText('To'), 'recipient@example.com');
      await setFormValue(screen.getByLabelText('Subject'), 'Delivery status');
      const body = screen.getByLabelText('Message body');
      seedRichTextHtml(body, '<p>Test content</p>');
      await user.click(screen.getByRole('button', { name: 'Send' }));
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
    await renderPage(<MailWorkspacePage />);

    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    const ccButton = await screen.findByRole('button', { name: 'Cc' });

    expect(screen.queryByLabelText('Cc')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Bcc')).not.toBeInTheDocument();

    await user.click(ccButton);
    expect(await screen.findByLabelText('Cc')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bcc')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Bcc' }));
    expect(await screen.findByLabelText('Bcc')).toBeInTheDocument();
  });

  it('shows the scheduled time only after enabling scheduled send', async () => {
    await renderPage(<MailWorkspacePage />);

    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    await waitFor(() =>
      expect(mail.listIdentities).toHaveBeenCalledWith('account-1'),
    );
    await setFormValue(screen.getByLabelText('To'), 'recipient@example.com');
    await setFormValue(screen.getByLabelText('Subject'), 'Scheduled message');
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message content</p>');

    expect(
      screen.queryByLabelText('Send later (optional)'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Schedule send' }));
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    const scheduledAt = '2099-01-01T10:30';
    await setFormValue(
      screen.getByLabelText('Send later (optional)'),
      scheduledAt,
    );
    expect(screen.getByRole('button', { name: 'Schedule send' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Schedule send' }));

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

    await renderPage(<MailWorkspacePage />);

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

    await renderPage(<MailWorkspacePage />);

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

    await user.click(projects);

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

    await renderPage(<MailWorkspacePage />);

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

    await renderPage(<MailWorkspacePage />);
    await setFormValue(await screen.findByLabelText('Account'), 'account-1');

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
    await renderPage(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(await screen.findByText('IMAP message'));
    await screen.findByRole('heading', { name: 'IMAP message' });
    await user.click(
      await screen.findByRole('button', { name: 'More actions' }),
    );
    const menu = await screen.findByRole('menu');
    expect(
      await within(menu).findByRole('menuitem', { name: 'Delete' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(mail.deleteMessage).not.toHaveBeenCalled();
  });

  // Skipped while it fails intermittently in CI: the "Permanently delete" menu item is sometimes not found before the
  // query times out (https://github.com/chenos/nocobase-ci/actions/runs/38114158032/job/114395623484). Re-enable once
  // the menu's rendering is awaited deterministically.
  // eslint-disable-next-line vitest/no-disabled-tests -- kept as a skip rather than a todo so the body survives
  it.skip('permanently deletes a message from Trash only after confirmation', async () => {
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
      await renderPage(<MailWorkspacePage />);
      await setFormValue(await screen.findByLabelText('Account'), 'account-1');
      await waitFor(() => {
        expect(mail.listMessages).toHaveBeenLastCalledWith(
          expect.objectContaining({ accountId: 'account-1' }),
        );
        expect(screen.getByRole('region', { name: 'Mail' })).toHaveAttribute(
          'aria-busy',
          'false',
        );
      });
      await user.click(await screen.findByText('Trash message'));
      await screen.findByRole('heading', { name: 'Trash message' });
      await user.click(screen.getByRole('button', { name: 'More actions' }));
      await user.click(
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

    await renderPage(<MailWorkspacePage />);

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

    await renderPage(<MailWorkspacePage accountsHref='/mail/accounts' />);

    expect(
      await screen.findByRole('button', { name: 'Compose' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Sync all mailboxes' }),
    ).toBeDisabled();
    await screen.findByText('Connect your first mailbox');
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
    await renderPage(<MailWorkspacePage />);
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
    await renderPage(<MailWorkspacePage accountsHref='/mail/accounts' />);
    expect(await screen.findByText('Previously visible mail')).toBeVisible();
    mail.listAccounts.mockResolvedValue([{ ...active, status: 'suspended' }]);
    now.mockReturnValue(30_000);
    // Trigger the browser focus lifecycle event directly; it has no user-facing control.
    fireEvent.focus(window);
    await screen.findByText('Connect your first mailbox');
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
    await renderPage(<MailWorkspacePage />);

    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    await user.click(await screen.findByRole('button', { name: 'Signature' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Support signature' }),
    );
    await setFormValue(
      screen.getByLabelText('To'),
      'first@example.com, second@example.com',
    );
    await setFormValue(screen.getByLabelText('Subject'), 'Team update');
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message content</p>');
    expect(
      screen.queryByRole('checkbox', {
        name: 'Send one private message per recipient (up to 100)',
      }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));

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
      await renderPage(<MailWorkspacePage />);
      await user.click(await screen.findByRole('button', { name: 'Compose' }));
      const editor = await screen.findByLabelText('Message body');
      await waitFor(() => expect(editor).toHaveTextContent('Regards, Sales'));
      await user.click(screen.getByRole('button', { name: 'Signature' }));
      await user.click(
        await screen.findByRole('menuitem', { name: 'Support' }),
      );
      expect(editor).toHaveTextContent('Support team');
      expect(editor).not.toHaveTextContent('Regards, Sales');
      await user.click(screen.getByRole('button', { name: 'Signature' }));
      await user.click(
        await screen.findByRole('menuitem', { name: 'No signature' }),
      );
      expect(editor).not.toHaveTextContent('Support team');
    } finally {
      confirm.mockRestore();
    }
  });

  it('does not allow sending without a subject and message body', async () => {
    const user = userEvent.setup();
    await renderPage(<MailWorkspacePage />);

    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await setFormValue(
      await screen.findByLabelText('To'),
      'recipient@example.com',
    );
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await setFormValue(screen.getByLabelText('Subject'), 'Subject');
    expect(send).toBeDisabled();

    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message content</p>');
    await waitFor(() => expect(send).toBeEnabled());
  });

  it('keeps local labels available even when IMAP has no Provider label support', async () => {
    const user = userEvent.setup();
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

    await renderPage(<MailWorkspacePage />);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    expect(screen.queryByRole('button', { name: 'New label' })).toBeNull();
    const messageRow = await screen.findByRole('button', {
      name: /IMAP message/,
    });
    expect(messageRow).not.toHaveAttribute('aria-current');
    expect(within(messageRow).getByText('Local label')).toBeInTheDocument();
    await user.click(await screen.findByText('IMAP message'));
    await screen.findByRole('heading', { name: 'IMAP message' });
    expect(within(messageRow).getByText('Local label')).toBeInTheDocument();
    const conversation = screen
      .getByRole('heading', { name: 'IMAP message' })
      .closest('section');
    if (!conversation) throw new Error('Missing conversation view');
    await user.click(
      within(conversation).getByRole('button', { name: 'More actions' }),
    );
    const menu = await screen.findByRole('menu', {}, { timeout: 3000 });
    expect(
      within(menu).queryByRole('menuitem', { name: 'Archive' }),
    ).toBeNull();
    await user.click(within(menu).getByRole('menuitem', { name: /^Labels/ }));
    const labelsDialog = await screen.findByRole('dialog');
    expect(
      within(labelsDialog).getByRole('checkbox', {
        name: 'Local label',
      }),
    ).toBeInTheDocument();
    await user.click(
      within(labelsDialog).getByRole('button', { name: 'Close' }),
    );
    const compose = screen.getByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    expect(
      screen.getByRole('button', { name: 'Save draft' }),
    ).toBeInTheDocument();
  });

  it('auto-saves rich text after two seconds and updates the same local draft', async () => {
    await renderPage(<MailWorkspacePage />);
    await vi.waitFor(() => expect(mail.listAccounts).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Compose' }));
    await vi.waitFor(() => expect(mail.listIdentities).toHaveBeenCalled());
    vi.useFakeTimers();
    try {
      const subject = screen.getByLabelText('Subject');
      // Direct change events make autosave boundaries deterministic while fake timers are advanced below.
      fireEvent.change(subject, { target: { value: 'Auto-saved message' } });
      const editor = screen.getByLabelText('Message body');
      seedRichTextHtml(editor, '<p>Hello <strong>team</strong></p>');
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

      fireEvent.change(subject, { target: { value: 'Updated message' } });
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
    const user = userEvent.setup();
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
    await renderPage(<MailWorkspacePage />);

    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    expect(
      await screen.findByText('An unfinished message can be restored.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByLabelText('Subject')).toHaveValue('Recovered subject');
    expect(screen.getByLabelText('Message body')).toHaveTextContent(
      'Recovered body',
    );
  });

  it('closes immediately and flushes the draft in the background without a confirmation', async () => {
    const user = userEvent.setup();
    await renderPage(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await setFormValue(await screen.findByLabelText('To'), 'draft@example.com');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('To')).not.toBeInTheDocument();
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
    await renderPage(
      <MailWorkspacePage
        templateVariables={{
          record: { number: 'SO-1001', customer: { name: 'Ada' } },
        }}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    await user.click(await screen.findByRole('button', { name: 'Template' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Order update' }),
    );
    expect(screen.getByLabelText('Subject')).toHaveValue('Order SO-1001');
    expect(screen.getByLabelText('Message body')).toHaveTextContent(
      'Hello Ada',
    );
  });

  it('removes inline attachment references when the image is deleted from the body', async () => {
    await renderPage(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    // Compose is rendered before account and provider metadata enables it.
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await setFormValue(
      await screen.findByLabelText('To'),
      'recipient@example.com',
    );
    await setFormValue(screen.getByLabelText('Subject'), 'Inline image');
    const file = new File(['image'], 'inline.png', { type: 'image/png' });
    const input = await waitFor(() => {
      const candidate = document.querySelector(
        'input[accept="image/png,image/jpeg,image/gif,image/webp"]',
      );
      expect(candidate).toBeInstanceOf(HTMLInputElement);
      return candidate as HTMLInputElement;
    });
    await user.upload(input, file);
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
    seedRichTextHtml(editor, '<p>Remaining text</p>');
    expect(
      screen.queryByRole('button', { name: 'Remove report.txt' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));
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
    await renderPage(<MailWorkspacePage />);
    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    await setFormValue(
      await screen.findByLabelText('To'),
      'recipient@example.com',
    );
    await setFormValue(screen.getByLabelText('Subject'), 'Inline image');
    const file = new File(['image'], 'inline.png', { type: 'image/png' });
    const input = document.querySelector(
      'input[accept="image/png,image/jpeg,image/gif,image/webp"]',
    );
    await user.upload(input!, file);
    await waitFor(() =>
      expect(screen.getByAltText('inline.png')).toHaveAttribute(
        'src',
        '/api/mail/attachments/attachment-1',
      ),
    );
    expect(
      screen.queryByRole('button', { name: 'Remove report.txt' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));
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
    await renderPage(<MailWorkspacePage />);

    const compose = await screen.findByRole('button', { name: 'Compose' });
    await waitFor(() => expect(compose).toBeEnabled());
    await user.click(compose);
    const input = await waitFor(() => {
      const candidate = document.querySelector('input[type="file"][multiple]');
      expect(candidate).toBeInstanceOf(HTMLInputElement);
      return candidate as HTMLInputElement;
    });
    const file = new File(['report'], 'report.txt', { type: 'text/plain' });
    await user.upload(input, file);
    expect(await screen.findByText('report.txt')).toBeInTheDocument();
    await setFormValue(screen.getByLabelText('To'), 'recipient@example.com');
    await setFormValue(screen.getByLabelText('Subject'), 'Attachment message');
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message with attachment</p>');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(mail.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ attachmentIds: ['attachment-1'] }),
      ),
    );
    expect(mail.uploadAttachment).toHaveBeenCalledWith(file);
  });

  it('keeps uploaded attachment references stable across autosaves', async () => {
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
    await renderPage(<MailWorkspacePage />);
    await vi.waitFor(() => expect(mail.listAccounts).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Compose' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Compose' }));
    const input = await vi.waitFor(() => {
      const candidate = document.querySelector('input[type="file"][multiple]');
      expect(candidate).toBeInstanceOf(HTMLInputElement);
      return candidate as HTMLInputElement;
    });
    await user.upload(
      input,
      new File(['report'], 'report.txt', { type: 'text/plain' }),
    );
    await vi.waitFor(() => expect(mail.uploadAttachment).toHaveBeenCalled());
    await screen.findByRole('button', { name: 'Remove report.txt' });
    vi.useFakeTimers();
    try {
      const subject = screen.getByLabelText('Subject');
      // Direct change events make autosave boundaries deterministic while fake timers are advanced below.
      fireEvent.change(subject, { target: { value: 'First save' } });
      await vi.advanceTimersByTimeAsync(2_000);
      await vi.waitFor(() => expect(mail.saveDraft).toHaveBeenCalledTimes(1));

      fireEvent.change(subject, { target: { value: 'Second save' } });
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
    await renderPage(<MailWorkspacePage />);

    const sync = await screen.findByRole('button', {
      name: 'Sync all mailboxes',
    });
    await waitFor(() => expect(sync).toBeEnabled());
    await user.click(sync);

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

    await renderPage(<MailWorkspacePage />);

    const sync = await screen.findByRole('button', {
      name: 'Sync all mailboxes',
    });
    await waitFor(() => expect(sync).toBeEnabled());
    await user.click(sync);

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
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    const first = await screen.findByRole('dialog', { name: 'New message' });
    await waitFor(() =>
      expect(
        within(first).getByLabelText('From address').querySelectorAll('option'),
      ).toHaveLength(3),
    );
    await setFormValue(
      within(first).getByLabelText('To'),
      'first-recipient@example.com',
    );
    await setFormValue(within(first).getByLabelText('Subject'), 'First draft');
    const body = within(first).getByLabelText('Message body');
    seedRichTextHtml(body, '<p>First message body</p>');
    const attachmentInput = await waitFor(() => {
      const candidate = first.querySelector('input[type=file][multiple]');
      expect(candidate).toBeInstanceOf(HTMLInputElement);
      return candidate as HTMLInputElement;
    });
    await user.upload(
      attachmentInput,
      new File(['report'], 'report.txt', { type: 'text/plain' }),
    );
    await within(first).findByText('report.txt');
    await setFormValue(
      within(first).getByLabelText('From address'),
      JSON.stringify(['account-2', 'identity-account-2']),
    );
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'New message' })).not.toBe(
        first,
      ),
    );
    const second = screen.getByRole('dialog', { name: 'New message' });
    expect(within(second).getByLabelText('Subject')).toHaveValue('');
    expect(within(second).queryByText('report.txt')).not.toBeInTheDocument();
    await setFormValue(
      within(second).getByLabelText('Subject'),
      'Second draft',
    );
    await setFormValue(
      within(second).getByLabelText('From address'),
      JSON.stringify(['account-1', 'identity-account-1']),
    );
    await waitFor(() =>
      expect(
        screen
          .getByRole('dialog', { name: 'New message' })
          .querySelector('input[value="First draft"]'),
      ).not.toBeNull(),
    );
    const restored = screen.getByRole('dialog', { name: 'New message' });
    expect(within(restored).getByLabelText('To')).toHaveValue(
      'first-recipient@example.com',
    );
    expect(within(restored).getByLabelText('Message body')).toHaveTextContent(
      'First message body',
    );
    expect(within(restored).getByText('report.txt')).toBeVisible();
    await setFormValue(
      within(restored).getByLabelText('From address'),
      JSON.stringify(['account-3', 'identity-account-3']),
    );
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'New message' })).not.toBe(
        restored,
      ),
    );
    const third = screen.getByRole('dialog', { name: 'New message' });
    await setFormValue(
      within(third).getByLabelText('To'),
      'third-recipient@example.com',
    );
    await setFormValue(
      within(third).getByLabelText('Subject'),
      'Third message',
    );
    const thirdBody = within(third).getByLabelText('Message body');
    seedRichTextHtml(thirdBody, '<p>Third body</p>');
    await waitFor(() =>
      expect(within(third).getByRole('button', { name: 'Send' })).toBeEnabled(),
    );
    await user.click(within(third).getByRole('button', { name: 'Send' }));
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
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    await screen.findByText('Account identities unavailable');
    const from = screen.getByRole('combobox', { name: 'From address' });
    expect(within(from).getAllByRole('option')).toHaveLength(2);
    expect(mail.listIdentities).not.toHaveBeenCalledWith('suspended');
    expect(mail.listIdentities).not.toHaveBeenCalledWith('receive-only');
    await setFormValue(
      screen.getByLabelText('Subject'),
      'Keep same-account content',
    );
    await setFormValue(from, JSON.stringify(['account-1', 'alias']));
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

    await renderPage(<MailWorkspacePage />);

    await user.click(await screen.findByRole('button', { name: 'Compose' }));
    await waitFor(() =>
      expect(mail.listIdentities).toHaveBeenCalledWith('account-2'),
    );
    await setFormValue(
      await screen.findByLabelText('To'),
      'recipient@example.com',
    );
    await setFormValue(
      screen.getByLabelText('Subject'),
      'Cached account message',
    );
    const editor = screen.getByLabelText('Message body');
    seedRichTextHtml(editor, '<p>Message content</p>');
    await user.click(screen.getByRole('button', { name: 'Send' }));

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
    const { container } = await renderPage(<MailWorkspacePage />);
    await user.click(
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
    await user.click(edit);
    await user.click(edit);
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
    await renderPage(<MailWorkspacePage />);
    // PM-351 tracks the error cleared after cancellation fails; retain low-level clicks here and do not claim this test verifies real user interaction.
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
    await renderPage(<MailWorkspacePage />);
    await user.click(await screen.findByText('reopened-draft'));
    await user.click(await screen.findByRole('button', { name: 'Edit draft' }));
    const editor = await screen.findByLabelText('Message body');
    expect(editor).toHaveTextContent('Latest stored body');
    seedRichTextHtml(editor, '<p>Edited after reopening</p>');
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
      await renderPage(<MailWorkspacePage />);
      await user.click(await screen.findByRole('button', { name: 'Compose' }));
      await setFormValue(
        await screen.findByLabelText('Subject'),
        'Saved manually',
      );
      await user.click(screen.getByRole('button', { name: 'Save draft' }));
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
    await renderPage(<MailWorkspacePage />);

    await user.click(await screen.findByText('Existing draft'));
    await user.click(await screen.findByRole('button', { name: 'Edit draft' }));
    expect((await screen.findAllByText('old.txt')).length).toBeGreaterThan(0);
    await user.click(
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
      await renderPage(<MailWorkspacePage />);
      await user.click(await screen.findByText('inline-draft'));
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
  it.each([false, true])(
    'prepares reply images only once and preserves another composer opened while preparation is pending: %s',
    async (openAnotherComposer) => {
      const message: MailMessage = {
        ...createUnreadMessage('pending-reply'),
        read: true,
        replyTo: [{ address: 'reply@example.com' }],
        references: [],
        html: '<p>Pending original</p><img src="cid:logo"><img src="cid:logo">',
        hasAttachments: true,
        attachments: [
          {
            id: 'logo',
            messageId: 'pending-reply',
            providerAttachmentId: 'remote-logo',
            fileName: 'logo.png',
            contentType: 'image/png',
            size: 3,
            inline: true,
            contentId: 'logo',
          },
        ],
      };
      let finishUpload!: (value: MailOutboundAttachmentView) => void;
      const pendingUpload = new Promise<MailOutboundAttachmentView>(
        (resolve) => {
          finishUpload = resolve;
        },
      );
      const download = vi
        .fn<MailClient['downloadAttachment']>()
        .mockImplementation(async () => new Response('png').body!);
      const upload = vi
        .fn<MailClient['uploadAttachment']>()
        .mockReturnValue(pendingUpload);
      mail.downloadAttachment.mockImplementation(download);
      mail.uploadAttachment.mockImplementation(upload);
      mail.listMessages.mockResolvedValue({ items: [message] });
      mail.getMessage.mockResolvedValue(message);
      await renderPage(<MailWorkspacePage />);
      await user.click(
        await screen.findByRole('button', { name: /pending-reply/ }),
      );
      const reply = await screen.findByRole('button', { name: 'Reply' });
      await user.click(reply);
      await waitFor(() => expect(upload).toHaveBeenCalledTimes(1));
      await user.click(reply);
      await user.click(reply);
      await act(async () => {});
      expect(download).toHaveBeenCalledExactlyOnceWith(
        'account-1',
        'pending-reply',
        'logo',
      );
      expect(upload).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('dialog', { name: 'New message' }),
      ).not.toBeInTheDocument();
      if (openAnotherComposer) {
        await user.click(screen.getByRole('button', { name: 'Compose' }));
        await setFormValue(
          await screen.findByLabelText('Subject'),
          'Do not overwrite this composer',
        );
      }
      await act(async () =>
        finishUpload({
          id: 'pending-reply-image',
          fileName: 'logo.png',
          contentType: 'image/png',
          size: 3,
          expiresAt: '',
        }),
      );
      expect(await screen.findByLabelText('Subject')).toHaveValue(
        openAnotherComposer
          ? 'Do not overwrite this composer'
          : 'Re: pending-reply',
      );
      if (openAnotherComposer) {
        expect(screen.getByLabelText('To')).toHaveValue('');
        expect(screen.queryByTitle('Quoted message')).not.toBeInTheDocument();
      } else {
        expect(screen.getByLabelText('To')).toHaveValue('reply@example.com');
        expect(
          screen.getByTitle('Quoted message').getAttribute('srcdoc'),
        ).toContain('Pending original');
        const editor = screen.getByLabelText('Message body');
        seedRichTextHtml(editor, '<p>Prepared reply</p>');
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
        );
        await user.click(screen.getByRole('button', { name: 'Send' }));
        await waitFor(() =>
          expect(mail.sendMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              accountId: 'account-1',
              inReplyToMessageId: 'pending-reply',
              replyBodyIncluded: true,
              attachmentIds: ['pending-reply-image'],
              retainedAttachmentIds: [],
              html: expect.stringContaining(
                'cid:nocobase-pending-reply-image@mail.inline',
              ),
            }),
          ),
        );
      }
      expect(download).toHaveBeenCalledTimes(1);
      expect(upload).toHaveBeenCalledTimes(1);
    },
  );
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

async function renderPage(ui: ReactElement): Promise<RenderedApp> {
  return renderWithApp(ui, {
    namespace: MAIL_PLUGIN_NS,
    namespaces: { [MAIL_PLUGIN_NS]: locales },
    services: (app) => {
      vi.spyOn(
        app.container.resolve(realtimeClientToken),
        'watch',
      ).mockImplementation((topic, options) =>
        realtime.watch(topic, options as RealtimeWatchOptions<unknown>),
      );
    },
  });
}
