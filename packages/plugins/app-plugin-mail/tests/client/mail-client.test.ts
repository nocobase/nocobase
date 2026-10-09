import { ApiClientError, type AppClient } from '@nocobase/app-client';
import { describe, expect, it, vi } from 'vitest';

import { MailClient, mailErrorMessage } from '../../client/mail-client.js';

describe('MailClient', () => {
  it('shows the server translation of a failure and never its developer message', () => {
    const failure = (payload: unknown) =>
      new ApiClientError('Internal developer text', {
        status: 403,
        payload,
        reason: 'MAIL_ACCESS_DENIED',
        domain: 'mail',
        method: 'GET',
        url: '/api/mail/accounts',
      });
    expect(
      mailErrorMessage(
        failure({
          error: {
            reason: 'MAIL_ACCESS_DENIED',
            localizedMessage: {
              locale: 'zh-CN',
              message: '需要邮件访问权限。',
            },
          },
        }),
        'fallback',
      ),
    ).toBe('需要邮件访问权限。');
    expect(mailErrorMessage(failure({ error: {} }), 'fallback')).toBe(
      'fallback',
    );
    expect(mailErrorMessage(new Error('Translated locally'), 'fallback')).toBe(
      'Translated locally',
    );
  });

  it('uses management endpoints for message details and attachments', async () => {
    const request = vi.fn(async () => ({ data: { id: 'message/1' } }));
    const app = appClient(request);
    const stream = vi
      .spyOn(app, 'stream')
      .mockResolvedValue(new ReadableStream());
    const client = new MailClient(app);
    await expect(
      client.getManagedMessage('account/1', 'message/1'),
    ).resolves.toEqual({ id: 'message/1' });
    expect(request).toHaveBeenCalledWith({
      path: 'mail/management/accounts/account%2F1/messages/message%2F1',
    });
    await client.downloadManagedAttachment('account/1', 'message/1', 'file/1');
    expect(stream).toHaveBeenCalledWith({
      path: 'mail/management/accounts/account%2F1/messages/message%2F1/attachments/file%2F1',
    });
  });

  it('maps account and authorization calls onto the Mail API', async () => {
    const request = vi.fn(async ({ path }: { path: string }) => {
      if (path === 'mail/accounts') return { data: [{ id: 'account-1' }] };
      return {
        data: {
          authorizationUrl: 'https://accounts.example.test/authorize',
          state: 'state-1',
        },
      };
    });
    const client = new MailClient(appClient(request));

    await expect(client.listAccounts()).resolves.toEqual([{ id: 'account-1' }]);
    await client.listManagedAccounts();
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/settings/accounts',
    });
    await client.listManagementAccounts();
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/management/accounts',
    });
    await client.listManagedFolders('account/1');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/management/accounts/account%2F1/folders',
    });
    await client.listManagedSyncRunsPage({ page: 2, pageSize: 50 });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/settings/syncRuns',
      query: { page: 2, pageSize: 50 },
    });
    await client.listManagedSubmissionsPage();
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/settings/submissions',
      query: { page: undefined, pageSize: undefined },
    });
    await expect(
      client.startAuthorization({ type: 'gmail', name: 'google' }),
    ).resolves.toMatchObject({ state: 'state-1' });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/authorizations',
      method: 'POST',
      json: { type: 'gmail', name: 'google' },
    });
    await client.connectAccount({
      type: 'imap-smtp',
      name: 'company-mail',
      address: 'user@example.com',
      username: 'user@example.com',
      password: 'secret',
      displayName: 'User',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/accounts/connect',
      method: 'POST',
      json: {
        type: 'imap-smtp',
        name: 'company-mail',
        address: 'user@example.com',
        username: 'user@example.com',
        password: 'secret',
        displayName: 'User',
      },
    });
  });

  it('requests page-numbered log pages and reads the total from meta', async () => {
    const request = vi.fn(async () => ({
      data: [],
      meta: { page: 11, pageSize: 20, total: 205 },
    }));
    const client = new MailClient(appClient(request));
    expect(await client.listSyncRunsPage({ page: 11, pageSize: 20 })).toEqual({
      items: [],
      total: 205,
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/syncRuns',
      query: { page: 11, pageSize: 20 },
    });
    expect(
      await client.listSubmissionsPage({
        bulkOnly: true,
        groupByBatch: true,
        page: 11,
        pageSize: 20,
      }),
    ).toEqual({ items: [], total: 205 });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/submissions',
      query: { bulkOnly: true, groupByBatch: true, page: 11, pageSize: 20 },
    });
  });

  it('encodes message queries and sync requests', async () => {
    const request = vi.fn(async ({ path }: { path: string }) =>
      path === 'mail/messages'
        ? {
            data: [{ id: 'message-1' }],
            meta: { nextPageToken: 'token-2', total: 41 },
          }
        : path === 'mail/management/messages'
          ? { data: [], meta: { page: 3, pageSize: 20, total: 41 } }
          : { data: { id: 'sync-1', status: 'pending' } },
    );
    const client = new MailClient(appClient(request));

    await expect(
      client.listMessages({
        accountId: 'account/1',
        q: 'from:alice',
        folderId: 'inbox',
        labelId: 'label/1',
        conversationId: 'thread/1',
        pageToken: 'token-1',
        unread: true,
        pageSize: 20,
      }),
    ).resolves.toEqual({
      items: [{ id: 'message-1' }],
      total: 41,
      nextCursor: 'token-2',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/messages',
      query: {
        accountId: 'account/1',
        q: 'from:alice',
        folderId: 'inbox',
        labelId: 'label/1',
        conversationId: 'thread/1',
        pageToken: 'token-1',
        unread: true,
        pageSize: 20,
      },
    });

    await expect(
      client.listManagedMessages({
        accountId: 'account/1',
        q: 'alice@example.com',
        folderId: 'folder/1',
        page: 3,
        pageSize: 20,
      }),
    ).resolves.toEqual({ items: [], total: 41 });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/management/messages',
      query: {
        accountId: 'account/1',
        q: 'alice@example.com',
        folderId: 'folder/1',
        page: 3,
        pageSize: 20,
      },
    });

    await client.manageMessages({
      action: 'move',
      items: [{ accountId: 'account/1', messageId: 'message/1' }],
      providerFolderId: 'archive',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/management/messages/batchApply',
      method: 'POST',
      json: {
        action: 'move',
        items: [{ accountId: 'account/1', messageId: 'message/1' }],
        providerFolderId: 'archive',
      },
    });

    await client.startSync({
      accountId: 'account/1',
      mode: 'initial',
      receivedAfter: '2026-01-01T00:00:00.000Z',
      maxMessages: 1000,
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/accounts/account%2F1/sync',
      method: 'POST',
      json: {
        mode: 'initial',
        receivedAfter: '2026-01-01T00:00:00.000Z',
        maxMessages: 1000,
      },
    });
  });

  it('maps P1 mailbox-management calls onto encoded Mail API paths', async () => {
    const request = vi.fn(async ({ path }: { path: string }) => ({
      data: path === 'mail/messages/countUnread' ? 4 : {},
    }));
    const client = new MailClient(appClient(request));

    await expect(client.getUnreadCount()).resolves.toBe(4);
    await client.saveSignature({
      id: 'signature/1',
      accountId: 'account/1',
      name: 'Sales',
      text: 'Regards',
      isDefault: true,
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/accounts/account%2F1/signatures/signature%2F1',
      method: 'PATCH',
      json: { name: 'Sales', text: 'Regards', isDefault: true },
    });

    await client.listLabels();
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/labels',
    });
    await client.createLabel('Customers', 'green');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/labels',
      method: 'POST',
      json: { name: 'Customers', color: 'green' },
    });
    await client.updateLabel({
      id: 'label/1',
      name: 'Customers',
      color: 'violet',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/labels/label%2F1',
      method: 'PATCH',
      json: { name: 'Customers', color: 'violet' },
    });
    await client.deleteLabel('label/1');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/labels/label%2F1',
      method: 'DELETE',
    });
    await client.updateMessageLabels({
      accountId: 'account/1',
      messageId: 'message/1',
      addLabelIds: ['Label_1'],
      removeLabelIds: ['Label_2'],
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/accounts/account%2F1/messages/message%2F1/modifyLabels',
      method: 'POST',
      json: {
        addLabelIds: ['Label_1'],
        removeLabelIds: ['Label_2'],
      },
    });

    await client.retrySyncRun('sync/1');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/syncRuns/sync%2F1/retry',
      method: 'POST',
      json: {},
    });
    await client.cancelSyncRun('sync/1');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/syncRuns/sync%2F1/cancel',
      method: 'POST',
      json: {},
    });
  });

  it('streams attachment content from the encoded Mail API path', async () => {
    const stream = vi.fn(async () => streamOf('content'));
    const client = new MailClient({
      request: vi.fn(),
      stream: stream as AppClient['stream'],
    });

    const content = await client.downloadAttachment(
      'account/1',
      'message/1',
      'attachment/1',
    );

    expect(await new Response(content).text()).toBe('content');
    expect(stream).toHaveBeenCalledWith({
      path: 'mail/accounts/account%2F1/messages/message%2F1/attachments/attachment%2F1',
    });
  });

  it('uploads outbound attachments as multipart form data', async () => {
    const request = vi.fn(async () => ({
      data: {
        id: 'attachment-1',
        fileName: 'report.txt',
        contentType: 'text/plain',
        size: 6,
        expiresAt: '2026-09-08T00:00:00.000Z',
      },
    }));
    const client = new MailClient(appClient(request));
    const file = new File(['report'], 'report.txt', { type: 'text/plain' });

    await expect(client.uploadAttachment(file)).resolves.toMatchObject({
      id: 'attachment-1',
    });
    const call = request.mock.calls[0]?.[0] as {
      body?: FormData;
      method?: string;
      path?: string;
    };
    expect(call.path).toBe('mail/attachments');
    expect(call.method).toBe('POST');
    expect(call.body?.get('file')).toBe(file);
  });

  it('maps personal template CRUD to the Mail API', async () => {
    const request = vi.fn(async () => ({
      data: {
        id: 'template-1',
        name: 'Welcome',
        subject: 'Hello',
        text: 'Welcome aboard',
        html: '',
        scope: 'private',
        ownerId: 'user-1',
      },
    }));
    const client = new MailClient(appClient(request));

    await client.listTemplates();
    expect(request).toHaveBeenLastCalledWith({ path: 'mail/templates' });
    await client.saveTemplate({
      id: 'template-1',
      name: 'Welcome',
      subject: 'Hello',
      text: 'Welcome aboard',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/templates/template-1',
      method: 'PATCH',
      json: {
        name: 'Welcome',
        subject: 'Hello',
        text: 'Welcome aboard',
      },
    });
    await client.deleteTemplate('template/1');
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/templates/template%2F1',
      method: 'DELETE',
    });
  });

  it('submits bounded bulk mail through the dedicated endpoint', async () => {
    const request = vi.fn(async () => ({ data: [] }));
    const client = new MailClient(appClient(request));
    await client.sendBulk({
      accountId: 'account-1',
      identityId: 'identity-1',
      recipients: [
        { address: 'first@example.com' },
        { address: 'second@example.com' },
      ],
      subject: 'Announcement',
      text: 'Hello',
      idempotencyKey: 'bulk-1',
    });
    expect(request).toHaveBeenLastCalledWith({
      path: 'mail/messages/sendBulk',
      method: 'POST',
      json: expect.objectContaining({
        recipients: [
          { address: 'first@example.com' },
          { address: 'second@example.com' },
        ],
      }),
    });
  });
});

function appClient(request: ReturnType<typeof vi.fn>): AppClient {
  return {
    request: request as unknown as AppClient['request'],
    stream: async () => {
      throw new Error('Not implemented by this test client.');
    },
  };
}

function streamOf(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

import { mergeMailFolders } from '../../client/lib/mail-folders.js';

describe('mail folder merging', () => {
  it('keeps additional provider folders that share a standard type', () => {
    const folders = mergeMailFolders(
      'account-1',
      [
        {
          id: 'sent-primary',
          accountId: 'account-1',
          providerFolderId: 'Sent',
          type: 'sent',
          name: 'Sent',
          kind: 'folder',
        },
        {
          id: 'sent-secondary',
          accountId: 'account-1',
          providerFolderId: 'Sent Items',
          type: 'sent',
          name: 'Sent Items',
          kind: 'folder',
        },
      ],
      {
        inbox: 'Inbox',
        sent: 'Sent',
        drafts: 'Drafts',
        trash: 'Trash',
        junk: 'Spam',
        archive: 'Archive',
      },
    );

    expect(folders.map((folder) => folder.name)).toContain('Sent');
    expect(folders.map((folder) => folder.name)).toContain('Sent Items');
  });

  it('does not display stale provider aliases as extra custom folders', () => {
    const folders = mergeMailFolders(
      'account-1',
      [
        {
          id: 'inbox-row',
          accountId: 'account-1',
          providerFolderId: 'INBOX',
          type: 'custom',
          name: 'INBOX',
          kind: 'folder',
        },
        {
          id: 'projects',
          accountId: 'account-1',
          providerFolderId: 'Projects',
          type: 'custom',
          name: 'Projects',
          kind: 'folder',
        },
      ],
      {
        inbox: '收件箱',
        sent: '已发送',
        drafts: '草稿箱',
        trash: '垃圾箱',
        junk: '垃圾邮件',
        archive: '归档',
      },
    );
    expect(folders.map((folder) => folder.name)).toContain('收件箱');
    expect(folders.map((folder) => folder.name)).not.toContain('INBOX');
    expect(folders.map((folder) => folder.name)).toContain('Projects');
  });
});
