import { ApiClientError } from '@nocobase/app-client';
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
import type {
  MailAccountView,
  MailAttachment,
  MailMessage,
  MailOutboundAttachmentView,
  MailProviderView,
  MailPublicError,
  MailSubmissionView,
} from '../../shared/mail.js';
import {
  EMPTY_MAIL_COMPOSER,
  type MailComposerProps,
  type MailComposerRequest,
  type MailComposerSubmissionSnapshot,
} from '@nocobase/app-plugin-mail/client/components';
import { MailWorkspaceComposer } from '../../client/components/mail-workspace-composer.js';
import { useMailComposer } from '../../client/hooks/use-mail-composer.js';
import { readPendingDeliveries } from '../../client/lib/mail-pending-delivery.js';
import locales from '../../client/locales/index.js';
import { MAIL_PLUGIN_NS } from '../../client/namespace.js';

// Only the external Mail transport is replaced; the hook, workspace, editor,
// translations, and application-client exports are the production modules.
const mail = vi.hoisted(() => ({
  listIdentities: vi.fn<MailClient['listIdentities']>(),
  listSignatures: vi.fn<MailClient['listSignatures']>(),
  listTemplates: vi.fn<MailClient['listTemplates']>(),
  sendMessage: vi.fn<MailClient['sendMessage']>(),
  sendBulk: vi.fn<MailClient['sendBulk']>(),
  saveDraft: vi.fn<MailClient['saveDraft']>(),
  getMessage: vi.fn<MailClient['getMessage']>(),
  downloadAttachment: vi.fn<MailClient['downloadAttachment']>(),
  uploadAttachment: vi.fn<MailClient['uploadAttachment']>(),
}));
vi.mock('../../client/runtime.js', () => ({ useMailClient: () => mail }));

const accounts: readonly MailAccountView[] = ['account-1', 'account-2'].map(
  (id) => ({
    id,
    userId: 'user-1',
    provider: { type: 'test', name: 'test' },
    address: `${id}@example.com`,
    scopes: [],
    status: 'active',
  }),
);
const providers: readonly MailProviderView[] = [
  {
    type: 'test',
    name: 'test',
    label: 'Test mail',
    capabilities: { send: true, drafts: true },
  },
];
const upload: MailOutboundAttachmentView = {
  id: 'upload-1',
  fileName: 'notes.txt',
  contentType: 'text/plain',
  size: 5,
  expiresAt: '2099-09-08T00:00:00.000Z',
};
const retained: MailAttachment = {
  id: 'retained-1',
  messageId: 'source-message',
  providerAttachmentId: 'provider-attachment',
  fileName: 'original.txt',
  contentType: 'text/plain',
  size: 5,
  inline: false,
};
const rejection: MailPublicError = {
  code: 'RECIPIENT_REJECTED',
  category: 'recipient',
  retryable: false,
  recipients: {
    accepted: ['reader@example.com'],
    rejected: ['rejected@example.com'],
  },
};

function request(accountId = 'account-1'): MailComposerRequest {
  return {
    accountId,
    value: {
      ...EMPTY_MAIL_COMPOSER,
      to: 'reader@example.com',
      subject: `Subject for ${accountId}`,
      text: `Body for ${accountId}`,
      html: `<p>Body for ${accountId}</p>`,
    },
    attachments: [],
  };
}
function submission(
  id = 'submission-1',
  status: MailSubmissionView['status'] = 'accepted',
  accountId = 'account-1',
): MailSubmissionView {
  return { id, accountId, status, providerMessageId: `provider-${id}` };
}
function draft(): MailMessage {
  return {
    id: 'saved-draft',
    accountId: 'account-1',
    providerMessageId: 'local-draft:1',
    folderIds: [],
    labelIds: [],
    to: [],
    cc: [],
    bcc: [],
    subject: 'Saved draft',
    read: true,
    starred: false,
    draft: true,
    hasAttachments: false,
    todo: false,
    replyTo: [],
    references: [],
    attachments: [],
  };
}
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function props(overrides: Partial<MailComposerProps> = {}): MailComposerProps {
  return {
    request: request(),
    accounts,
    providers,
    onClose: vi.fn(),
    onComplete: vi.fn<MailComposerProps['onComplete']>(),
    ...overrides,
  };
}

let runtime: I18nRuntime;
function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <I18nProvider runtime={runtime}>{children}</I18nProvider>;
}
async function mountComposer(value: MailComposerProps) {
  const view = renderHook(() => useMailComposer(value), { wrapper: Wrapper });
  await waitFor(() => expect(view.result.current.identityId).not.toBe(''));
  return view;
}

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  for (const mock of Object.values(mail)) mock.mockReset();
  mail.listIdentities.mockImplementation(async (accountId) => [
    {
      id: `${accountId}-primary`,
      accountId,
      address: `${accountId}@example.com`,
      isPrimary: true,
      canSend: true,
    },
    {
      id: `${accountId}-alias`,
      accountId,
      address: `alias-${accountId}@example.com`,
      isPrimary: false,
      canSend: true,
    },
  ]);
  mail.listSignatures.mockResolvedValue([]);
  mail.listTemplates.mockResolvedValue([]);
  mail.sendMessage.mockResolvedValue(submission());
  mail.sendBulk.mockResolvedValue([submission('bulk-1', 'pending')]);
  mail.saveDraft.mockResolvedValue(draft());
  mail.uploadAttachment.mockResolvedValue({ ...upload, id: 'copied-upload' });
  mail.downloadAttachment.mockImplementation(
    async () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hello'));
          controller.close();
        },
      }),
  );
  runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: '@test/composer-host',
  });
  runtime.registerNamespace(MAIL_PLUGIN_NS, locales);
  await runtime.init('en-US');
});

describe('Mail composer completion through the actual hook', () => {
  it('closes before completing with the response ID and a detached exact wire body including signature, quote, copies, and attachments', async () => {
    const response = { ...submission(), error: rejection };
    const pending = deferred<MailSubmissionView>();
    mail.sendMessage.mockReturnValue(pending.promise);
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const order: string[] = [];
    const value = props({
      request: {
        ...request(),
        value: {
          ...request().value,
          mode: 'reply',
          relatedMessageId: 'quoted-message',
          cc: 'copy@example.com; second-copy@example.com',
          bcc: 'hidden@example.com',
          text: 'Reply\nSender signature',
          html: '<p>Reply</p><p>Sender signature</p>',
          forwardQuote: {
            kind: 'reply',
            id: 'quoted-message',
            accountId: 'account-1',
            attachments: [],
            text: 'Original quoted body',
            html: '<p>Original quoted body</p>',
          },
        },
        attachments: [retained],
        uploads: [upload],
      },
      onClose: () => {
        order.push('closed');
      },
      onComplete: (...args) => {
        order.push('complete');
        onComplete(...args);
      },
    });
    const view = await mountComposer(value);
    act(() => view.result.current.sendComposer());
    const wire = mail.sendMessage.mock.calls[0]![0];
    const originalWire = structuredClone(wire);
    expect(wire).toMatchObject({
      accountId: 'account-1',
      identityId: 'account-1-primary',
      signatureId: null,
      to: [{ address: 'reader@example.com' }],
      cc: [
        { address: 'copy@example.com' },
        { address: 'second-copy@example.com' },
      ],
      bcc: [{ address: 'hidden@example.com' }],
      text: 'Reply\nSender signature\n\n> Original quoted body',
      attachmentIds: ['upload-1'],
      retainedAttachmentIds: ['retained-1'],
      inReplyToMessageId: 'quoted-message',
      replyBodyIncluded: true,
      draftKey: expect.any(String),
      idempotencyKey: expect.any(String),
    });
    expect(wire.html).toContain('Sender signature');
    expect(wire.html).toContain('<blockquote type="cite">');
    expect(wire.html).toContain('Original quoted body');
    // An API implementation or later editor update cannot mutate the snapshot.
    Object.assign(wire.to[0]!, { address: 'transport-mutated@example.com' });
    act(() =>
      view.result.current.setComposer((current) =>
        current ? { ...current, text: 'Later edit' } : current,
      ),
    );
    await act(async () => pending.resolve(response));
    expect(order).toEqual(['closed', 'complete']);
    expect(view.result.current.composer).toBeUndefined();
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(
      'partial',
      ['rejected@example.com'],
      rejection,
      {
        kind: 'normal',
        input: originalWire,
        submissions: [response],
      },
    );
    const details = onComplete.mock.calls[0]![3]!;
    expect(details.submissions[0]).not.toBe(response);
    expect(details.submissions[0]!.error).not.toBe(response.error);
    Object.assign(response, { id: 'changed-after-completion' });
    expect(details.submissions[0]!.id).toBe('submission-1');
    expect(readPendingDeliveries(['account-1'])).toEqual([]);
    expect(mail.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('reports scheduled with the normalized submitted time and unchanged pending response status', async () => {
    const scheduledAt = '2099-09-08T10:30:00.000Z';
    const response = { ...submission('scheduled-1', 'pending'), scheduledAt };
    mail.sendMessage.mockResolvedValue(response);
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const view = await mountComposer(
      props({
        request: {
          ...request(),
          value: { ...request().value, scheduledAt: '2099-09-08T10:30:00Z' },
        },
        onComplete,
      }),
    );
    act(() => view.result.current.sendComposer());
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith('scheduled', [], undefined, {
      kind: 'normal',
      input: mail.sendMessage.mock.calls[0]![0],
      submissions: [response],
    });
    expect(mail.sendMessage.mock.calls[0]![0].scheduledAt).toBe(scheduledAt);
  });

  it.each(['accepted', 'failed', 'unknown', 'partial'] as const)(
    'preserves %s response records and the legacy outcome/error arguments',
    async (outcome) => {
      const response: MailSubmissionView = {
        ...submission(
          'outcome-id',
          outcome === 'partial' ? 'accepted' : outcome,
        ),
        error:
          outcome === 'partial'
            ? rejection
            : outcome === 'accepted'
              ? undefined
              : {
                  code: 'PROVIDER_FAILURE',
                  category: 'provider',
                  retryable: false,
                },
      };
      mail.sendMessage.mockResolvedValue(response);
      const onComplete = vi.fn<MailComposerProps['onComplete']>();
      const view = await mountComposer(props({ onComplete }));
      act(() => view.result.current.sendComposer());
      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
      expect(onComplete).toHaveBeenCalledWith(
        outcome,
        outcome === 'partial' ? ['rejected@example.com'] : [],
        response.error,
        {
          kind: 'normal',
          input: mail.sendMessage.mock.calls[0]![0],
          submissions: [response],
        },
      );
      expect(view.result.current.composer).toBeUndefined();
      expect(mail.sendMessage).toHaveBeenCalledTimes(1);
    },
  );

  it('captures the bulk wire only after retained attachments are copied and preserves every pending record', async () => {
    const copying = deferred<MailOutboundAttachmentView>();
    mail.uploadAttachment.mockReturnValue(copying.promise);
    const responses = [
      submission('bulk-a', 'pending'),
      submission('bulk-b', 'pending'),
    ];
    mail.sendBulk.mockResolvedValue(responses);
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const view = await mountComposer(
      props({
        allowBulkSend: true,
        request: {
          ...request(),
          value: {
            ...request().value,
            mode: 'edit',
            draftMessageId: 'source-draft',
            to: 'reader@example.com;READER@example.com; other@example.com',
          },
          uploads: [upload],
          attachments: [
            retained,
            {
              ...retained,
              id: 'retained-backed',
              outboundAttachmentId: 'already-uploaded',
            },
          ],
        },
        onComplete,
      }),
    );
    act(() => view.result.current.sendComposer('bulk'));
    await waitFor(() => expect(mail.uploadAttachment).toHaveBeenCalledTimes(1));
    expect(mail.sendBulk).not.toHaveBeenCalled();
    const file = mail.uploadAttachment.mock.calls[0]![0];
    expect(file.name).toBe('original.txt');
    expect(file.type).toBe('text/plain');
    expect(file.size).toBe(5);
    expect(mail.downloadAttachment).toHaveBeenCalledExactlyOnceWith(
      'account-1',
      'source-draft',
      'retained-1',
    );
    act(() => {
      view.result.current.setIdentityId('account-1-alias');
      view.result.current.setComposer((current) =>
        current ? { ...current, text: 'Edited while copying' } : current,
      );
    });
    await act(async () => copying.resolve({ ...upload, id: 'copied-upload' }));
    const wire = mail.sendBulk.mock.calls[0]![0];
    expect(wire).toMatchObject({
      identityId: 'account-1-primary',
      recipients: [
        { address: 'reader@example.com' },
        { address: 'other@example.com' },
      ],
      text: 'Body for account-1',
      attachmentIds: ['upload-1', 'copied-upload', 'already-uploaded'],
      sourceDraftMessageId: 'source-draft',
      draftKey: expect.any(String),
    });
    expect(wire).not.toHaveProperty('retainedAttachmentIds');
    expect(wire).not.toHaveProperty('draftMessageId');
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(
      'accepted',
      [],
      undefined,
      {
        kind: 'bulk',
        input: wire,
        submissions: responses,
      },
    );
    const details = onComplete.mock.calls[0]![3]!;
    expect(details.submissions).not.toBe(responses);
    expect(details.submissions.map((item) => item.status)).toEqual([
      'pending',
      'pending',
    ]);
    expect(mail.sendMessage).not.toHaveBeenCalled();
    expect(mail.sendBulk).toHaveBeenCalledTimes(1);
  });

  it.each(['normal', 'bulk'] as const)(
    'reports transport uncertainty for %s with an empty record list and the recoverable exact wire',
    async (mode) => {
      mail.sendMessage.mockRejectedValue(new Error('Connection lost'));
      mail.sendBulk.mockRejectedValue(new Error('Connection lost'));
      const onComplete = vi.fn<MailComposerProps['onComplete']>();
      const onClose = vi.fn();
      const view = await mountComposer(
        props({ allowBulkSend: true, onComplete, onClose }),
      );
      act(() => view.result.current.sendComposer(mode));
      await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
      const wire =
        mode === 'normal'
          ? mail.sendMessage.mock.calls[0]![0]
          : mail.sendBulk.mock.calls[0]![0];
      expect(onComplete).toHaveBeenCalledWith('unknown', undefined, undefined, {
        kind: mode,
        input: wire,
        submissions: [],
      });
      expect(readPendingDeliveries(['account-1'])).toEqual([
        {
          accountId: 'account-1',
          mode,
          input: JSON.parse(JSON.stringify(wire)),
        },
      ]);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(view.result.current.composer).toBeUndefined();
      expect(view.result.current.error).toBeUndefined();
      expect(
        mail.sendMessage.mock.calls.length + mail.sendBulk.mock.calls.length,
      ).toBe(1);
    },
  );

  it('keeps a definitively rejected request editable without reporting a completed or unknown send', async () => {
    mail.sendMessage.mockRejectedValue(
      new ApiClientError('Request refused', {
        status: 400,
        reason: 'INVALID_INPUT',
        domain: 'mail',
        method: 'POST',
        path: '/api/mail/send',
      }),
    );
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const onClose = vi.fn();
    const onCompletionError =
      vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
    const view = await mountComposer(
      props({ onComplete, onClose, onCompletionError }),
    );
    act(() => view.result.current.sendComposer());
    await waitFor(() => expect(view.result.current.error).toBeDefined());
    expect(view.result.current.composer?.text).toBe('Body for account-1');
    expect(view.result.current.sending).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onCompletionError).not.toHaveBeenCalled();
    expect(mail.sendMessage).toHaveBeenCalledTimes(1);
    expect(readPendingDeliveries(['account-1'])).toEqual([]);
  });

  it('reports an explicit saved draft separately, without treating it as a submitted send', async () => {
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const onClose = vi.fn();
    const view = await mountComposer(props({ onComplete, onClose }));
    act(() => view.result.current.saveComposer(true));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith('draft', undefined, undefined, {
      kind: 'draft',
      submissions: [],
      draft: { id: 'saved-draft', accountId: 'account-1' },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(view.result.current.composer).toBeUndefined();
    expect(mail.saveDraft).toHaveBeenCalledTimes(1);
    expect(mail.sendMessage).not.toHaveBeenCalled();
    expect(mail.sendBulk).not.toHaveBeenCalled();
    expect(readPendingDeliveries(['account-1'])).toEqual([]);
  });

  it('still reports the saved draft reference when the close callback mutates its response and throws', async () => {
    const saved = draft();
    mail.saveDraft.mockResolvedValue(saved);
    const closeError = new Error('Draft host close failed');
    const onClose = vi.fn(() => {
      Object.assign(saved, { id: 'mutated-by-close' });
      throw closeError;
    });
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const onCompletionError =
      vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
    const view = await mountComposer(
      props({ onClose, onComplete, onCompletionError }),
    );
    act(() => view.result.current.saveComposer(true));
    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledExactlyOnceWith(
        'draft',
        undefined,
        undefined,
        {
          kind: 'draft',
          submissions: [],
          draft: { id: 'saved-draft', accountId: 'account-1' },
        },
      ),
    );
    expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(closeError);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mail.saveDraft).toHaveBeenCalledTimes(1);
    expect(mail.sendMessage).not.toHaveBeenCalled();
    expect(mail.sendBulk).not.toHaveBeenCalled();
    expect(view.result.current.composer).toBeUndefined();
  });

  it('keeps interleaved simultaneous operations attached to their own submitted content and response IDs', async () => {
    const first = deferred<MailSubmissionView>();
    const second = deferred<MailSubmissionView>();
    mail.sendMessage
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const firstView = await mountComposer(props({ onComplete }));
    const secondView = await mountComposer(
      props({ request: request('account-2'), onComplete }),
    );
    act(() => firstView.result.current.sendComposer());
    act(() => secondView.result.current.sendComposer());
    const firstWire = structuredClone(mail.sendMessage.mock.calls[0]![0]);
    const secondWire = structuredClone(mail.sendMessage.mock.calls[1]![0]);
    expect(firstWire.idempotencyKey).not.toBe(secondWire.idempotencyKey);
    await act(async () =>
      second.resolve(submission('second-id', 'accepted', 'account-2')),
    );
    expect(firstView.result.current.sending).toBe(true);
    expect(secondView.result.current.composer).toBeUndefined();
    await act(async () => first.resolve(submission('first-id')));
    expect(onComplete.mock.calls.map((call) => call[3])).toEqual([
      {
        kind: 'normal',
        input: secondWire,
        submissions: [submission('second-id', 'accepted', 'account-2')],
      },
      {
        kind: 'normal',
        input: firstWire,
        submissions: [submission('first-id')],
      },
    ]);
    expect(mail.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('continues to call an existing three-parameter integration with the same arguments', async () => {
    const legacy =
      vi.fn<
        (
          result: string,
          recipients?: readonly string[],
          error?: MailPublicError,
        ) => void
      >();
    const onComplete: MailComposerProps['onComplete'] = (
      result,
      recipients,
      error,
    ) => legacy(result, recipients, error);
    mail.sendMessage.mockResolvedValue({ ...submission(), error: rejection });
    const view = await mountComposer(props({ onComplete }));
    act(() => view.result.current.sendComposer());
    await waitFor(() => expect(legacy).toHaveBeenCalledTimes(1));
    expect(legacy).toHaveBeenCalledWith(
      'partial',
      ['rejected@example.com'],
      rejection,
    );
  });

  it.each(['sync', 'async'] as const)(
    'allows a legacy %s value-returning callback without treating its return value as a mail outcome',
    async (kind) => {
      const outcomes: string[] = [];
      const onComplete = vi.fn((result: string) =>
        kind === 'sync'
          ? outcomes.push(result)
          : Promise.resolve(outcomes.push(result)),
      );
      const onCompletionError =
        vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
      const view = await mountComposer(
        props({ onComplete, onCompletionError }),
      );
      act(() => view.result.current.sendComposer());
      await waitFor(() => expect(view.result.current.sending).toBe(false));
      expect(outcomes).toEqual(['accepted']);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onCompletionError).not.toHaveBeenCalled();
      expect(view.result.current.composer).toBeUndefined();
      expect(mail.sendMessage).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['sync', 'async'] as const)(
    'isolates a %s completion error exactly once without retransmission or an unknown/draft outcome',
    async (kind) => {
      const error = new Error('Integration failed');
      const onComplete = vi.fn<MailComposerProps['onComplete']>(() => {
        if (kind === 'sync') throw error;
        return Promise.reject(error);
      });
      const onCompletionError =
        vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
      const onClose = vi.fn();
      const view = await mountComposer(
        props({ onComplete, onCompletionError, onClose }),
      );
      act(() => view.result.current.sendComposer());
      await waitFor(() =>
        expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(error),
      );
      await act(async () => {});
      expect(onComplete).toHaveBeenCalledExactlyOnceWith(
        'accepted',
        [],
        undefined,
        {
          kind: 'normal',
          input: mail.sendMessage.mock.calls[0]![0],
          submissions: [submission()],
        },
      );
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mail.sendMessage).toHaveBeenCalledTimes(1);
      expect(mail.saveDraft).not.toHaveBeenCalled();
      expect(view.result.current.sending).toBe(false);
      expect(view.result.current.composer).toBeUndefined();
      expect(readPendingDeliveries(['account-1'])).toEqual([]);
    },
  );

  it.each(['accepted', 'unknown'] as const)(
    'still notifies %s exactly once when the application close callback throws',
    async (outcome) => {
      const closeError = new Error('Host close failed');
      const response = submission();
      if (outcome === 'accepted') mail.sendMessage.mockResolvedValue(response);
      else mail.sendMessage.mockRejectedValue(new Error('Transport lost'));
      const onClose = vi.fn(() => {
        Object.assign(response, { id: 'mutated-by-close' });
        throw closeError;
      });
      const onComplete = vi.fn<MailComposerProps['onComplete']>();
      const onCompletionError =
        vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
      const view = await mountComposer(
        props({ onClose, onComplete, onCompletionError }),
      );
      act(() => view.result.current.sendComposer());
      await waitFor(() =>
        expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(closeError),
      );
      expect(onComplete).toHaveBeenCalledExactlyOnceWith(
        outcome,
        outcome === 'accepted' ? [] : undefined,
        undefined,
        {
          kind: 'normal',
          input: mail.sendMessage.mock.calls[0]![0],
          submissions: outcome === 'accepted' ? [submission()] : [],
        },
      );
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(mail.sendMessage).toHaveBeenCalledTimes(1);
      expect(mail.saveDraft).not.toHaveBeenCalled();
      expect(view.result.current.composer).toBeUndefined();
      expect(view.result.current.sending).toBe(false);
    },
  );

  it.each(['draft', 'unknown'] as const)(
    'does not turn a rejected asynchronous %s completion into another outcome',
    async (outcome) => {
      const error = new Error('Async host integration failed');
      const onComplete = vi.fn<MailComposerProps['onComplete']>(async () => {
        throw error;
      });
      const onCompletionError =
        vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
      if (outcome === 'unknown')
        mail.sendMessage.mockRejectedValue(new Error('Transport lost'));
      const view = await mountComposer(
        props({ onComplete, onCompletionError }),
      );
      act(() => {
        if (outcome === 'draft') view.result.current.saveComposer(true);
        else view.result.current.sendComposer();
      });
      await waitFor(() =>
        expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(error),
      );
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0]![0]).toBe(outcome);
      expect(view.result.current.composer).toBeUndefined();
      expect(view.result.current.draftSaveStatus).not.toBe('failed');
      expect(mail.sendMessage).toHaveBeenCalledTimes(
        outcome === 'draft' ? 0 : 1,
      );
      expect(mail.saveDraft).toHaveBeenCalledTimes(outcome === 'draft' ? 1 : 0);
    },
  );

  it.each(['sync', 'async'] as const)(
    'contains a %s error-reporter failure and logs no message content',
    async (kind) => {
      const completionFailure = new Error('Private message content');
      const reporterFailure = new Error('Private error handler content');
      const onComplete = vi.fn<MailComposerProps['onComplete']>(async () => {
        throw completionFailure;
      });
      const onCompletionError = vi.fn<
        NonNullable<MailComposerProps['onCompletionError']>
      >(() => {
        if (kind === 'sync') throw reporterFailure;
        return Promise.reject(reporterFailure);
      });
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const view = await mountComposer(
          props({ onComplete, onCompletionError }),
        );
        act(() => view.result.current.sendComposer());
        await waitFor(() => expect(log).toHaveBeenCalledTimes(1));
        expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(
          completionFailure,
        );
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(log.mock.calls[0]).toHaveLength(1);
        expect(log.mock.calls[0]![0]).toEqual(expect.any(String));
        expect(log.mock.calls[0]![0]).not.toContain('Private');
        expect(mail.sendMessage).toHaveBeenCalledTimes(1);
        expect(view.result.current.composer).toBeUndefined();
      } finally {
        log.mockRestore();
      }
    },
  );

  it('lets a public-contract consumer upsert every response by ID without changing status or duplicating activity', async () => {
    const activity = new Map<
      string,
      {
        submission: MailSubmissionView;
        snapshot: MailComposerSubmissionSnapshot;
      }
    >();
    const consume = vi.fn<MailComposerProps['onComplete']>(
      (_outcome, _rejected, _error, details) => {
        if (!details || details.kind === 'draft') return;
        for (const item of details.submissions) {
          activity.set(item.id, { submission: item, snapshot: details });
        }
      },
    );
    const records = [
      submission('activity-pending', 'pending'),
      { ...submission('activity-failed', 'failed'), error: rejection },
      submission('activity-unknown', 'unknown'),
    ];
    mail.sendBulk.mockResolvedValue(records);
    const bulk = await mountComposer(
      props({ allowBulkSend: true, onComplete: consume }),
    );
    act(() => bulk.result.current.sendComposer('bulk'));
    await waitFor(() => expect(consume).toHaveBeenCalledTimes(1));
    expect(consume.mock.calls[0]![0]).toBe('unknown');
    expect([...activity.values()].map((item) => item.submission)).toEqual(
      records,
    );
    expect(activity.get('activity-failed')!.submission.error).toEqual(
      rejection,
    );
    for (const item of activity.values()) {
      expect(item.snapshot).toMatchObject({
        kind: 'bulk',
        input: mail.sendBulk.mock.calls[0]![0],
      });
    }
    // Replaying a notification updates the same records, not a second activity.
    consume(...consume.mock.calls[0]!);
    expect(activity.size).toBe(3);
    const beforeNonDelivery = [...activity.entries()];
    const draftView = await mountComposer(props({ onComplete: consume }));
    act(() => draftView.result.current.saveComposer(true));
    await waitFor(() => expect(consume).toHaveBeenCalledTimes(3));
    expect(consume.mock.calls[2]![3]).toMatchObject({
      kind: 'draft',
      submissions: [],
    });
    mail.sendMessage.mockRejectedValue(new Error('No response records'));
    const unknown = await mountComposer(props({ onComplete: consume }));
    act(() => unknown.result.current.sendComposer());
    await waitFor(() => expect(consume).toHaveBeenCalledTimes(4));
    expect(consume.mock.calls[3]![3]).toMatchObject({
      kind: 'normal',
      submissions: [],
    });
    expect([...activity.entries()]).toEqual(beforeNonDelivery);
    expect(activity.has('saved-draft')).toBe(false);
  });

  it('does not await asynchronous integration work before closing or finishing the send', async () => {
    const integration = deferred<void>();
    const onComplete = vi.fn<MailComposerProps['onComplete']>(
      () => integration.promise,
    );
    const onCompletionError =
      vi.fn<NonNullable<MailComposerProps['onCompletionError']>>();
    const view = await mountComposer(props({ onComplete, onCompletionError }));
    act(() => view.result.current.sendComposer());
    await waitFor(() => expect(view.result.current.sending).toBe(false));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(view.result.current.composer).toBeUndefined();
    const error = new Error('Late integration rejection');
    await act(async () => integration.reject(error));
    expect(onCompletionError).toHaveBeenCalledExactlyOnceWith(error);
    expect(mail.sendMessage).toHaveBeenCalledTimes(1);
  });
});

describe('workspace composer account and identity switching', () => {
  it('keeps the first send snapshot when switching accounts and completes the second send first', async () => {
    const first = deferred<MailSubmissionView>();
    const second = deferred<MailSubmissionView>();
    mail.sendMessage
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const onComplete = vi.fn<MailComposerProps['onComplete']>();
    const onClose = vi.fn();
    const onSelectAccount = vi.fn();
    render(
      <MailWorkspaceComposer
        {...props({ onComplete, onClose })}
        onSelectAccount={onSelectAccount}
      />,
      { wrapper: Wrapper },
    );
    const sender = await screen.findByRole('combobox', {
      name: 'From address',
    });
    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'alias-account-2@example.com' }),
      ).toBeInTheDocument(),
    );
    fireEvent.change(sender, {
      target: { value: JSON.stringify(['account-1', 'account-1-alias']) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send', exact: true }));
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(1));
    fireEvent.change(sender, {
      target: { value: JSON.stringify(['account-2', 'account-2-alias']) },
    });
    await waitFor(() => expect(screen.getByLabelText('To')).toHaveValue(''));
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: 'second@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Second account subject' },
    });
    const editor = screen.getByRole('textbox', { name: 'Message body' });
    editor.innerHTML = '<p>Second account body</p>';
    fireEvent.input(editor);
    const send = screen.getByRole('button', { name: 'Send', exact: true });
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);
    await waitFor(() => expect(mail.sendMessage).toHaveBeenCalledTimes(2));
    const firstWire = mail.sendMessage.mock.calls[0]![0];
    const secondWire = mail.sendMessage.mock.calls[1]![0];
    expect(firstWire).toMatchObject({
      accountId: 'account-1',
      identityId: 'account-1-alias',
      text: 'Body for account-1',
    });
    expect(secondWire).toMatchObject({
      accountId: 'account-2',
      identityId: 'account-2-alias',
      text: 'Second account body',
    });
    await act(async () =>
      second.resolve(submission('workspace-second', 'accepted', 'account-2')),
    );
    await act(async () => first.resolve(submission('workspace-first')));
    expect(onComplete.mock.calls.map((call) => call[3])).toEqual([
      {
        kind: 'normal',
        input: secondWire,
        submissions: [submission('workspace-second', 'accepted', 'account-2')],
      },
      {
        kind: 'normal',
        input: firstWire,
        submissions: [submission('workspace-first')],
      },
    ]);
    expect(onSelectAccount).toHaveBeenCalledWith('account-2');
    // The inactive first session must not close the active workspace twice.
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
