import {
  prepareMailReply,
  type MailComposerRequest,
} from '@nocobase/app-plugin-mail/client';
import {
  EMPTY_MAIL_COMPOSER,
  MailComposer,
  type MailComposerProps,
} from '@nocobase/app-plugin-mail/client/components';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MailClient } from '../../client/mail-client.js';
import { useMailComposer } from '../../client/hooks/use-mail-composer.js';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';
import type {
  MailAccountView,
  MailMessage,
  MailOutboundAttachmentView,
  MailProviderView,
} from '../../shared/mail.js';

// Replace only the external transport. Preparation, composer, editor, recovery,
// translations, and application-client exports are the production modules.
const mail = vi.hoisted(() => ({
  retryMessageContent: vi.fn<MailClient['retryMessageContent']>(),
  downloadAttachment: vi.fn<MailClient['downloadAttachment']>(),
  uploadAttachment: vi.fn<MailClient['uploadAttachment']>(),
  listIdentities: vi.fn<MailClient['listIdentities']>(),
  listSignatures: vi.fn<MailClient['listSignatures']>(),
  listTemplates: vi.fn<MailClient['listTemplates']>(),
  sendMessage: vi.fn<MailClient['sendMessage']>(),
  sendBulk: vi.fn<MailClient['sendBulk']>(),
  saveDraft: vi.fn<MailClient['saveDraft']>(),
  getMessage: vi.fn<MailClient['getMessage']>(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));

const source: MailMessage = {
  id: 'original',
  accountId: 'account',
  providerMessageId: 'remote-original',
  subject: 'Original subject',
  from: { address: 'sender@example.com', name: 'Original sender' },
  to: [{ address: 'me@example.com' }],
  cc: [{ address: 'original-copy@example.com' }],
  bcc: [{ address: 'original-hidden@example.com' }],
  replyTo: [],
  references: [],
  folderIds: [],
  labelIds: [],
  read: true,
  starred: false,
  draft: false,
  hasAttachments: false,
  attachments: [],
  text: 'Original plain text\nSecond line <literal>',
};
const imageSource: MailMessage = {
  ...source,
  hasAttachments: true,
  text: undefined,
  html: '<html><head><style>.original{color:red} body{font-size:32px}</style></head><body><p class="original">Original styled body</p><img src="cid:logo%40example.com"><img src="CID:LOGO@example.com"><script>window.alert("unsafe")</script></body></html>',
  attachments: [
    {
      id: 'logo',
      messageId: source.id,
      providerAttachmentId: 'remote-logo',
      fileName: 'logo.png',
      contentType: 'image/png',
      size: 3,
      inline: true,
      contentId: '<logo@example.com>',
    },
    {
      id: 'unused',
      messageId: source.id,
      providerAttachmentId: 'remote-unused',
      fileName: 'unused.png',
      contentType: 'image/png',
      size: 3,
      inline: true,
      contentId: 'unused',
    },
    {
      id: 'ordinary',
      messageId: source.id,
      providerAttachmentId: 'remote-ordinary',
      fileName: 'ordinary.pdf',
      contentType: 'application/pdf',
      size: 3,
      inline: false,
    },
  ],
};
const upload: MailOutboundAttachmentView = {
  id: 'reply-image',
  fileName: 'logo.png',
  contentType: 'image/png',
  size: 3,
  expiresAt: '2099-01-01T00:00:00.000Z',
};
const accounts: readonly MailAccountView[] = [
  {
    id: source.accountId,
    userId: 'user',
    provider: { type: 'test', name: 'test' },
    address: 'me@example.com',
    scopes: [],
    status: 'active',
  },
];
const providers: readonly MailProviderView[] = [
  {
    type: 'test',
    name: 'test',
    label: 'Test mail',
    capabilities: { send: true, drafts: true },
  },
];
let runtime: I18nRuntime;
function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <I18nProvider runtime={runtime}>{children}</I18nProvider>;
}
function props(request: MailComposerRequest): MailComposerProps {
  return {
    request,
    accounts,
    providers,
    onClose: vi.fn(),
    onComplete: vi.fn<MailComposerProps['onComplete']>(),
  };
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  for (const mock of Object.values(mail)) mock.mockReset();
  mail.retryMessageContent.mockResolvedValue(source);
  mail.downloadAttachment.mockImplementation(
    async () => new Response('png').body!,
  );
  mail.uploadAttachment.mockResolvedValue(upload);
  mail.listIdentities.mockResolvedValue([
    {
      id: 'primary',
      accountId: source.accountId,
      address: 'me@example.com',
      isPrimary: true,
      canSend: true,
    },
  ]);
  mail.listSignatures.mockResolvedValue([]);
  mail.listTemplates.mockResolvedValue([]);
  mail.sendMessage.mockResolvedValue({
    id: 'submission',
    accountId: source.accountId,
    status: 'accepted',
  });
  mail.saveDraft.mockResolvedValue({
    ...source,
    id: 'saved-draft',
    draft: true,
  });
  runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: '@test/reply-host',
  });
  runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
  await runtime.init('en-US');
});

describe('public prepareMailReply request', () => {
  it.each([
    {
      replyTo: [
        { address: 'reply@example.com', name: 'Reply contact' },
        { address: 'team@example.com' },
      ],
      from: source.from,
      expected: 'reply@example.com, team@example.com',
    },
    { replyTo: [], from: source.from, expected: 'sender@example.com' },
    { replyTo: [], from: undefined, expected: '' },
  ])(
    'uses Reply-To, From, or an empty recipient: $expected',
    async ({ replyTo, from, expected }) => {
      const request: MailComposerRequest = await prepareMailReply(mail, {
        ...source,
        replyTo,
        from,
      });
      expect(request).toMatchObject({
        accountId: source.accountId,
        attachments: [],
        uploads: [],
        value: {
          mode: 'reply',
          relatedMessageId: source.id,
          to: expected,
          subject: 'Re: Original subject',
          cc: '',
          bcc: '',
          text: '',
          html: '',
          scheduledAt: '',
          forwardQuote: {
            kind: 'reply',
            id: source.id,
            accountId: source.accountId,
          },
        },
      });
      expect(mail.retryMessageContent).not.toHaveBeenCalled();
      expect(mail.downloadAttachment).not.toHaveBeenCalled();
      expect(mail.uploadAttachment).not.toHaveBeenCalled();
    },
  );

  it.each([
    'Re: Already a reply',
    'rE: Mixed case',
    '  RE: Whitespace preserved  ',
  ])(
    'preserves an existing case-insensitive, trimmed Re prefix: %s',
    async (subject) => {
      const request = await prepareMailReply(mail, { ...source, subject });
      expect(request.value.subject).toBe(subject);
    },
  );

  it('keeps plain text in a separate escaped quote without mutating the source or shared defaults', async () => {
    const message = structuredClone(source);
    const before = structuredClone(message);
    const defaults = structuredClone(EMPTY_MAIL_COMPOSER);
    const request = await prepareMailReply(mail, message);
    expect(request.value.forwardQuote?.text).toBe(
      'Original sender wrote:\nOriginal plain text\nSecond line <literal>',
    );
    expect(request.value.forwardQuote?.html).toContain('&lt;literal&gt;');
    expect(request.value.text).toBe('');
    expect(request.value.html).toBe('');
    expect(message).toEqual(before);
    expect(EMPTY_MAIL_COMPOSER).toEqual(defaults);
    expect(request.value).not.toBe(EMPTY_MAIL_COMPOSER);
  });

  it('copies repeated referenced CIDs once, leaves unused and ordinary files out of uploads, and preserves sanitized quoted CSS', async () => {
    const message = structuredClone(imageSource);
    const before = structuredClone(message);
    const request = await prepareMailReply(mail, message);
    expect(mail.downloadAttachment).toHaveBeenCalledExactlyOnceWith(
      'account',
      'original',
      'logo',
    );
    expect(mail.uploadAttachment).toHaveBeenCalledTimes(1);
    const file = mail.uploadAttachment.mock.calls[0]![0];
    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('logo.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(3);
    expect(request.attachments).toEqual([]);
    expect(request.uploads).toEqual([upload]);
    const quote = request.value.forwardQuote!;
    expect(quote.kind).toBe('reply');
    expect(
      quote.html.match(/cid:nocobase-reply-image@mail.inline/gu),
    ).toHaveLength(2);
    expect(quote.html).toContain('.original{color:red}');
    expect(quote.html).not.toContain('<script');
    expect(quote.html).not.toContain('/api/');
    expect(quote.attachments[0]).toMatchObject({
      id: 'logo',
      contentId: 'nocobase-reply-image@mail.inline',
    });
    expect(message).toEqual(before);
  });

  it.each([
    'deferred',
    'failed',
  ] satisfies readonly MailMessage['contentStatus'][])(
    'retries a %s body and builds the entire request from the loaded source',
    async (contentStatus) => {
      const loaded: MailMessage = {
        ...imageSource,
        accountId: 'loaded-account',
        id: 'loaded-original',
        contentStatus: 'complete',
        subject: 'Loaded subject',
        replyTo: [{ address: 'loaded-reply@example.com' }],
      };
      mail.retryMessageContent.mockResolvedValue(loaded);
      const pending: MailMessage = {
        ...source,
        contentStatus,
        text: undefined,
        html: undefined,
        attachments: [],
      };
      const before = structuredClone(pending);
      const request = await prepareMailReply(mail, pending);
      expect(mail.retryMessageContent).toHaveBeenCalledExactlyOnceWith(
        source.accountId,
        source.id,
      );
      expect(request.accountId).toBe(loaded.accountId);
      expect(request.value).toMatchObject({
        relatedMessageId: loaded.id,
        subject: 'Re: Loaded subject',
        to: 'loaded-reply@example.com',
        forwardQuote: { id: loaded.id, accountId: loaded.accountId },
      });
      expect(mail.downloadAttachment).toHaveBeenCalledExactlyOnceWith(
        loaded.accountId,
        loaded.id,
        'logo',
      );
      expect(request.uploads).toEqual([upload]);
      expect(pending).toEqual(before);
    },
  );

  it.each([
    'deferred',
    'failed',
  ] satisfies readonly MailMessage['contentStatus'][])(
    'rejects a retry that still has %s content before copying attachments',
    async (contentStatus) => {
      mail.retryMessageContent.mockResolvedValue({
        ...imageSource,
        contentStatus,
      });
      await expect(
        prepareMailReply(mail, { ...source, contentStatus: 'deferred' }),
      ).rejects.toThrow('could not be loaded');
      expect(mail.downloadAttachment).not.toHaveBeenCalled();
      expect(mail.uploadAttachment).not.toHaveBeenCalled();
    },
  );

  it('propagates loading failure without producing a partial request', async () => {
    const error = new Error('Body loading failed');
    mail.retryMessageContent.mockRejectedValue(error);
    await expect(
      prepareMailReply(mail, { ...source, contentStatus: 'failed' }),
    ).rejects.toBe(error);
    expect(mail.downloadAttachment).not.toHaveBeenCalled();
    expect(mail.uploadAttachment).not.toHaveBeenCalled();
  });

  it('propagates download failure without attempting an upload', async () => {
    const error = new Error('Image download failed');
    mail.downloadAttachment.mockRejectedValue(error);
    await expect(prepareMailReply(mail, imageSource)).rejects.toBe(error);
    expect(mail.uploadAttachment).not.toHaveBeenCalled();
  });

  it('propagates a broken download stream without attempting an upload', async () => {
    const error = new Error('Image stream failed');
    mail.downloadAttachment.mockResolvedValue(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(error);
        },
      }),
    );
    await expect(prepareMailReply(mail, imageSource)).rejects.toBe(error);
    expect(mail.uploadAttachment).not.toHaveBeenCalled();
  });

  it('propagates upload failure without mutating original image references', async () => {
    const error = new Error('Image upload failed');
    const message = structuredClone(imageSource);
    const before = structuredClone(message);
    mail.uploadAttachment.mockRejectedValue(error);
    await expect(prepareMailReply(mail, message)).rejects.toBe(error);
    expect(mail.downloadAttachment).toHaveBeenCalledTimes(1);
    expect(mail.uploadAttachment).toHaveBeenCalledTimes(1);
    expect(message).toEqual(before);
  });
});

describe('prepared request consumed unchanged by the actual composer', () => {
  it('sends a reply with copied inline images while sandboxing original HTML and CSS outside the editor', async () => {
    const request: MailComposerRequest = await prepareMailReply(
      mail,
      imageSource,
    );
    render(<MailComposer {...props(request)} />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send', exact: true }),
      ).toBeEnabled(),
    );
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    expect(editor).toBeEmptyDOMElement();
    expect(editor.querySelector('style, img')).toBeNull();
    const frame = screen.getByTitle<HTMLIFrameElement>('Quoted message');
    expect(frame.getAttribute('sandbox')).not.toContain('allow-scripts');
    expect(frame).toHaveAttribute('sandbox');
    expect(frame.getAttribute('srcdoc')).toContain('.original{color:red}');
    expect(frame.getAttribute('srcdoc')).not.toContain('window.alert');
    editor.innerHTML = '<p>My reply</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(1));
    const input = mail.sendMessage.mock.calls[0]![0];
    expect(input).toMatchObject({
      accountId: 'account',
      to: [{ address: 'sender@example.com' }],
      cc: [],
      bcc: [],
      subject: 'Re: Original subject',
      inReplyToMessageId: source.id,
      replyBodyIncluded: true,
      attachmentIds: [upload.id],
      retainedAttachmentIds: [],
    });
    expect(input.html).toContain('<blockquote type="cite">');
    expect(input.html).toContain('My reply');
    expect(input.html).toContain('.original{color:red}');
    expect(
      input.html?.match(/cid:nocobase-reply-image@mail.inline/gu),
    ).toHaveLength(2);
    expect(input.text).toContain('My reply');
    expect(input.text).toContain('> Original styled body');
    expect(mail.downloadAttachment).toHaveBeenCalledTimes(1);
    expect(mail.uploadAttachment).toHaveBeenCalledTimes(1);
  });

  it('saves the prepared request, restores its quoted images from recovery, and removes/restores the quote without changing authored content', async () => {
    const request: MailComposerRequest = await prepareMailReply(
      mail,
      imageSource,
    );
    const composerProps = props(request);
    const view = renderHook(() => useMailComposer(composerProps), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(view.result.current.identityId).toBe('primary'));
    act(() =>
      view.result.current.setComposer((value) =>
        value
          ? { ...value, text: 'Draft reply', html: '<p>Draft reply</p>' }
          : value,
      ),
    );
    act(() => view.result.current.saveComposer());
    await waitFor(() =>
      expect(view.result.current.draftSaveStatus).toBe('saved'),
    );
    expect(mail.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: source.accountId,
        inReplyToMessageId: source.id,
        replyBodyIncluded: true,
        attachmentIds: [upload.id],
        retainedAttachmentIds: [],
        html: expect.stringContaining('cid:nocobase-reply-image@mail.inline'),
        text: expect.stringContaining('Draft reply'),
      }),
    );
    view.unmount();
    render(
      <MailComposer
        {...props({
          accountId: source.accountId,
          value: EMPTY_MAIL_COMPOSER,
          attachments: [],
        })}
      />,
      { wrapper: Wrapper },
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Restore', exact: true }),
    );
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    expect(editor).toHaveTextContent('Draft reply');
    expect(editor).not.toHaveTextContent('Original styled body');
    const restoredQuote = screen
      .getByTitle('Quoted message')
      .getAttribute('srcdoc')!;
    expect(restoredQuote).toContain('Original styled body');
    const quotedDocument = new DOMParser().parseFromString(
      restoredQuote,
      'text/html',
    );
    expect(
      [...quotedDocument.querySelectorAll('img')].map((image) =>
        image.getAttribute('src'),
      ),
    ).toEqual([
      '/api/mail/accounts/account/messages/original/attachments/logo',
      '/api/mail/accounts/account/messages/original/attachments/logo',
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove quoted content' }),
    );
    expect(screen.queryByTitle('Quoted message')).not.toBeInTheDocument();
    expect(editor).toHaveTextContent('Draft reply');
    fireEvent.click(
      screen.getByRole('button', { name: 'Restore quoted content' }),
    );
    expect(screen.getByTitle('Quoted message').getAttribute('srcdoc')).toBe(
      restoredQuote,
    );
    expect(editor).toHaveTextContent('Draft reply');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Send', exact: true }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(1));
    expect(mail.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        inReplyToMessageId: source.id,
        replyBodyIncluded: true,
        attachmentIds: [upload.id],
        retainedAttachmentIds: [],
        html: expect.stringContaining('cid:nocobase-reply-image@mail.inline'),
        text: expect.stringContaining('Draft reply'),
      }),
    );
    expect(mail.downloadAttachment).toHaveBeenCalledTimes(1);
    expect(mail.uploadAttachment).toHaveBeenCalledTimes(1);
  });
});
