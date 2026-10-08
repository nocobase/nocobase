import {
  authenticationToken,
  type Auth,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import { createAppPaths } from '@nocobase/app-server/config';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { I18nRuntime } from '@nocobase/i18n';
import { createI18nMiddleware } from '@nocobase/i18n/server';
import { describe, expect, it, vi } from 'vitest';

import { MailIdempotencyConflictError } from '../../server/operations/send-mail.js';
import { mailApiRoutes } from '../../server/routes/api.js';
import {
  MailError,
  mailInvalidArgument,
} from '../../server/services/errors.js';
import { mailServiceToken } from '../../server/tokens.js';
import type { MailService, MailSyncRunView } from '../../server/types.js';
import serverLocales from '../../server/locales/index.js';

describe('[API][SEC] mail API routes and permission boundaries', () => {
  it('rejects per-account automatic sync configuration as an unknown field', async () => {
    const mail = service();
    const updateAccount = vi.spyOn(mail, 'updateAccount');
    const router = await createRouter(true, mail);
    const rejected = await router.request('/api/mail/accounts/account-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'suspended',
        automaticSyncIntervalMinutes: 1,
      }),
    });

    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
    });
    expect(updateAccount).not.toHaveBeenCalled();

    const response = await router.request('/api/mail/accounts/account-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'suspended' }),
    });
    expect(response.status).toBe(200);
    expect(updateAccount).toHaveBeenCalledWith(expect.anything(), {
      accountId: 'account-1',
      status: 'suspended',
    });
  });

  it('acknowledges durable account removal with HTTP 202 and the removing account', async () => {
    const removing = {
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'user@example.com',
      scopes: [],
      status: 'removing',
    } as const;
    const remove = vi
      .fn<MailService['removeAccount']>()
      .mockResolvedValueOnce(removing)
      .mockResolvedValueOnce(undefined);
    const router = await createRouter(true, service({ removeAccount: remove }));
    const response = await router.request('/api/mail/accounts/account-1', {
      method: 'DELETE',
    });
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ data: removing });
    expect(remove).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
    );

    // Once the background task has deleted the row there is nothing to show.
    const finished = await router.request('/api/mail/accounts/account-1', {
      method: 'DELETE',
    });
    expect(finished.status).toBe(202);
    expect(await finished.text()).toBe('');
  });

  it('answers 201 with the account created by connecting it', async () => {
    const router = await createRouter(true, service());
    const response = await router.request('/api/mail/accounts/connect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'imap-smtp',
        name: 'company-mail',
        address: 'user@example.com',
        password: 'secret',
        initialSyncReceivedAfter: '2026-01-01T00:00:00Z',
      }),
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      data: { id: 'account-1', status: 'active' },
    });
  });

  it('answers bounded lists whole with meta.total', async () => {
    const label = {
      id: 'label-1',
      name: 'Work',
      color: 'blue',
      createdAt: '2026-09-14T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z',
    } as const;
    const router = await createRouter(
      true,
      service({
        listLabels: async () => [label, { ...label, id: 'label-2' }],
        listTemplates: async () => [],
      }),
    );
    for (const [path, total] of [
      ['/api/mail/labels', 2],
      ['/api/mail/templates', 0],
      ['/api/mail/providers', 0],
      ['/api/mail/accounts', 0],
      ['/api/mail/accounts/account-1/identities', 0],
      ['/api/mail/accounts/account-1/signatures', 0],
      ['/api/mail/accounts/account-1/folders', 0],
      ['/api/mail/settings/accounts', 0],
      ['/api/mail/management/accounts', 0],
      ['/api/mail/management/accounts/account-1/folders', 0],
    ] as const) {
      const response = await router.request(path);
      const body = (await response.json()) as {
        data: unknown[];
        meta: { total: number };
      };
      expect({
        path,
        status: response.status,
        count: body.data.length,
        meta: body.meta,
      }).toEqual({ path, status: 200, count: total, meta: { total } });
    }
  });

  it('answers 404 for the management folders of an account that does not exist', async () => {
    const router = await createRouter(
      true,
      service({
        listManagedFolders: async () => {
          throw new MailError({
            status: 'NOT_FOUND',
            reason: 'MAIL_ACCOUNT_NOT_FOUND',
            message: 'Mail account was not found.',
            field: 'accountId',
          });
        },
      }),
    );
    const response = await router.request(
      '/api/mail/management/accounts/missing/folders',
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: { status: 'NOT_FOUND', reason: 'MAIL_ACCOUNT_NOT_FOUND' },
    });
  });

  it('updates only the fields a PATCH sends', async () => {
    const updateTemplate = vi.fn<MailService['updateTemplate']>(
      async (_context, input) => ({
        id: input.id,
        name: input.name ?? 'Stored name',
        subject: input.subject ?? 'Stored subject',
        html: input.html ?? '<p>Stored</p>',
      }),
    );
    const updateSignature = vi.fn<MailService['updateSignature']>(
      async (_context, input) => ({
        id: input.id,
        accountId: input.accountId,
        name: input.name ?? 'Stored',
        text: input.text ?? 'Stored text',
        isDefault: input.isDefault ?? false,
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      }),
    );
    const updateLabel = vi.fn<MailService['updateLabel']>(
      async (_context, input) => ({
        id: input.id,
        name: input.name ?? 'Stored',
        color: input.color ?? 'slate',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      }),
    );
    const router = await createRouter(
      true,
      service({ updateTemplate, updateSignature, updateLabel }),
    );
    const patch = (path: string, body: unknown) =>
      router.request(path, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    expect(
      (await patch('/api/mail/templates/template-1', { subject: 'Hi' })).status,
    ).toBe(200);
    expect(updateTemplate).toHaveBeenCalledWith(expect.anything(), {
      id: 'template-1',
      subject: 'Hi',
    });
    expect(
      (
        await patch('/api/mail/accounts/account-1/signatures/signature-1', {
          isDefault: true,
        })
      ).status,
    ).toBe(200);
    expect(updateSignature).toHaveBeenCalledWith(expect.anything(), {
      id: 'signature-1',
      accountId: 'account-1',
      isDefault: true,
    });
    expect(
      (await patch('/api/mail/labels/label-1', { color: 'red' })).status,
    ).toBe(200);
    expect(updateLabel).toHaveBeenCalledWith(expect.anything(), {
      id: 'label-1',
      color: 'red',
    });
    const blankName = await patch('/api/mail/labels/label-1', { name: ' ' });
    expect(blankName.status).toBe(400);
    expect(updateLabel).toHaveBeenCalledTimes(1);
  });

  it('owns an authentication boundary', async () => {
    const router = await createRouter(false, service());
    const response = await router.request('/api/mail/accounts');
    expect(response.status).toBe(401);
  });

  it('enforces Mail workspace access', async () => {
    const router = await createRouter(true, service(), false);
    const response = await router.request('/api/mail/accounts');

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'MAIL_ACCESS_DENIED',
        domain: 'mail',
        localizedMessage: {
          locale: 'en-US',
          message: 'Mail access is required.',
        },
      },
    });
  });

  it('requires separate administrator access for cross-user data', async () => {
    const checkedResources: string[] = [];
    const router = await createRouter(true, service(), (resource) => {
      checkedResources.push(resource);
      return resource === 'mail.workspace';
    });

    await expect(router.request('/api/mail/accounts')).resolves.toMatchObject({
      status: 200,
    });
    await expect(
      router.request('/api/mail/settings/accounts'),
    ).resolves.toMatchObject({ status: 403 });
    expect(checkedResources).toEqual(['mail.workspace', 'mail.admin']);
  });

  it('requires independent management access for cross-user mail data', async () => {
    const checkedResources: string[] = [];
    const router = await createRouter(true, service(), (resource) => {
      checkedResources.push(resource);
      return resource === 'mail.management';
    });

    await expect(
      router.request('/api/mail/management/messages'),
    ).resolves.toMatchObject({ status: 200 });
    await expect(router.request('/api/mail/messages')).resolves.toMatchObject({
      status: 403,
    });
    await expect(
      router.request('/api/mail/settings/accounts'),
    ).resolves.toMatchObject({ status: 403 });
    expect(checkedResources).toEqual([
      'mail.management',
      'mail.workspace',
      'mail.admin',
    ]);
  });

  it('protects managed details and attachments with independent management access', async () => {
    const getManagedMessage = vi.fn<MailService['getManagedMessage']>(
      async () => messageView(),
    );
    const getManagedAttachment = vi.fn<MailService['getManagedAttachment']>(
      async () => ({
        fileName: 'test.txt',
        contentType: 'text/plain',
        stream: streamOf('managed attachment'),
      }),
    );
    const mail = service({ getManagedMessage, getManagedAttachment });
    const path =
      '/api/mail/management/accounts/account%2F1/messages/message%2F1';
    for (const authenticated of [false, true]) {
      const denied = await createRouter(
        authenticated,
        mail,
        (resource) => resource === 'mail.workspace',
      );
      expect((await denied.request(path)).status).toBe(
        authenticated ? 403 : 401,
      );
      expect(
        (await denied.request(`${path}/attachments/file%2F1`)).status,
      ).toBe(authenticated ? 403 : 401);
    }
    expect(getManagedMessage).not.toHaveBeenCalled();
    expect(getManagedAttachment).not.toHaveBeenCalled();
    const router = await createRouter(
      true,
      mail,
      (resource) => resource === 'mail.management',
    );
    expect((await router.request(path)).status).toBe(200);
    expect(getManagedMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account/1',
      'message/1',
    );
    const attachment = await router.request(`${path}/attachments/file%2F1`);
    expect(await attachment.text()).toBe('managed attachment');
    expect(getManagedAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account/1',
      'message/1',
      'file/1',
    );
    getManagedMessage.mockResolvedValueOnce(undefined);
    const missing = await router.request(path);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { reason: 'MAIL_MESSAGE_NOT_FOUND', domain: 'mail' },
    });
  });

  it('maps management account, folder, and message queries to the service', async () => {
    const listManagedAccounts = vi.fn<MailService['listManagedAccounts']>(
      async () => [],
    );
    const listManagedFolders = vi.fn<MailService['listManagedFolders']>(
      async () => [],
    );
    const listManagedMessages = vi.fn<MailService['listManagedMessages']>(
      async () => ({ items: [] }),
    );
    const router = await createRouter(
      true,
      service({ listManagedAccounts, listManagedFolders, listManagedMessages }),
      (resource) => resource === 'mail.management',
    );

    await router.request('/api/mail/management/accounts');
    await router.request('/api/mail/management/accounts/account%2F1/folders');
    await router.request(
      '/api/mail/management/messages?accountId=account%2F1&folderId=folder%2F1&q=alice&page=4&pageSize=20',
    );

    expect(listManagedAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
    expect(listManagedFolders).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account/1',
    );
    expect(listManagedMessages).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountIds: ['account/1'],
        folderIds: ['folder/1'],
        query: 'alice',
        offset: 60,
        withTotal: true,
        limit: 20,
        unread: undefined,
        starred: undefined,
      },
    );
  });

  it('returns counted log pages only when requested and keeps the actor scope', async () => {
    const listSyncRunsPage = vi.fn<MailService['listSyncRunsPage']>(
      async () => ({ items: [], total: 125 }),
    );
    const listSubmissionsPage = vi.fn<MailService['listSubmissionsPage']>(
      async () => ({ items: [], total: 205 }),
    );
    const router = await createRouter(
      true,
      service({ listSyncRunsPage, listSubmissionsPage }),
    );
    const sync = await router.request('/api/mail/syncRuns?page=7&pageSize=20');
    expect(await sync.json()).toEqual({
      data: [],
      meta: { page: 7, pageSize: 20, total: 125 },
    });
    expect(listSyncRunsPage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      120,
      20,
    );
    const submissions = await router.request(
      '/api/mail/submissions?page=11&pageSize=20&bulkOnly=true&groupByBatch=true',
    );
    expect(await submissions.json()).toEqual({
      data: [],
      meta: { page: 11, pageSize: 20, total: 205 },
    });
    expect(listSubmissionsPage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      true,
      200,
      true,
      20,
    );
  });

  it('maps management message actions and validates their item targets', async () => {
    const manageMessages = vi.fn<MailService['manageMessages']>(async () => ({
      items: [
        {
          accountId: 'account-1',
          messageId: 'message-1',
          status: 'succeeded',
        },
      ],
      succeeded: 1,
      failed: 0,
    }));
    const router = await createRouter(
      true,
      service({ manageMessages }),
      (resource) => resource === 'mail.management',
    );

    const response = await router.request(
      '/api/mail/management/messages/batchApply',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'markRead',
          items: [{ accountId: 'account-1', messageId: 'message-1' }],
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(manageMessages).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        action: 'markRead',
        items: [{ accountId: 'account-1', messageId: 'message-1' }],
        providerFolderId: undefined,
        permanently: undefined,
      },
    );

    const invalidResponse = await router.request(
      '/api/mail/management/messages/batchApply',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', items: [] }),
      },
    );
    expect(invalidResponse.status).toBe(400);
    expect(manageMessages).toHaveBeenCalledTimes(1);
  });

  it('translates API errors from the request locale', async () => {
    const router = await createRouter(true, service(), false);
    const response = await router.request('/api/mail/accounts', {
      headers: { 'accept-language': 'zh-CN' },
    });

    expect(response.status).toBe(403);
    const { error } = (await response.json()) as {
      error: {
        reason: string;
        message: string;
        localizedMessage: { locale: string; message: string };
      };
    };
    expect(error.reason).toBe('MAIL_ACCESS_DENIED');
    // `message` stays English developer text; the translation travels in `localizedMessage`.
    expect(error.message).not.toContain('需要');
    expect(error.localizedMessage).toEqual({
      locale: 'zh-CN',
      message: '需要邮件访问权限。',
    });
  });

  it('lists all managed accounts for an authorized Settings user', async () => {
    const listManagedAccounts = vi.fn<MailService['listManagedAccounts']>(
      async () => [
        {
          id: 'account-2',
          userId: 'user-2',
          provider: { type: 'gmail', name: 'google' },
          address: 'other@example.com',
          scopes: [],
          status: 'active',
          canSync: false,
        },
      ],
    );
    const router = await createRouter(true, service({ listManagedAccounts }));

    const response = await router.request('/api/mail/settings/accounts');

    expect(response.status).toBe(200);
    expect(listManagedAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
    expect(await response.json()).toMatchObject({
      data: [{ userId: 'user-2', address: 'other@example.com' }],
    });
  });

  it('pages the operation logs of every user for an authorized Settings user', async () => {
    const listManagedSyncRunsPage = vi.fn<
      MailService['listManagedSyncRunsPage']
    >(async () => ({ items: [syncRun('account-2', 'user-2')], total: 41 }));
    const listManagedSubmissionsPage = vi.fn<
      MailService['listManagedSubmissionsPage']
    >(async () => ({
      items: [
        {
          id: 'submission-2',
          accountId: 'account-2',
          status: 'accepted',
          createdAt: '2026-09-06T08:00:00.000Z',
          updatedAt: '2026-09-06T08:00:01.000Z',
        },
      ],
      total: 1,
    }));
    const router = await createRouter(
      true,
      service({ listManagedSyncRunsPage, listManagedSubmissionsPage }),
    );

    const runs = await router.request(
      '/api/mail/settings/syncRuns?page=3&pageSize=20',
    );
    expect(runs.status).toBe(200);
    expect(listManagedSyncRunsPage).toHaveBeenCalledWith(
      { actorId: 'user-1', signal: expect.any(AbortSignal) },
      40,
      20,
    );
    expect(await runs.json()).toEqual({
      data: [expect.objectContaining({ accountId: 'account-2' })],
      meta: { page: 3, pageSize: 20, total: 41 },
    });

    const submissions = await router.request('/api/mail/settings/submissions');
    expect(submissions.status).toBe(200);
    expect(listManagedSubmissionsPage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      0,
      20,
    );
    expect(await submissions.json()).toEqual({
      data: [expect.objectContaining({ accountId: 'account-2' })],
      meta: { page: 1, pageSize: 20, total: 1 },
    });

    const tooLarge = await router.request(
      '/api/mail/settings/submissions?pageSize=101',
    );
    expect(tooLarge.status).toBe(400);
    await expect(
      router.request('/api/mail/settings/operationLogs'),
    ).resolves.toMatchObject({ status: 404 });
  });

  it('starts a bounded asynchronous sync for the authenticated user', async () => {
    const startSync = vi.fn<MailService['startSync']>(async (context, input) =>
      syncRun(input.accountId, context.actorId),
    );
    const router = await createRouter(true, service({ startSync }));
    const response = await router.request('/api/mail/accounts/account-1/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'initial',
        receivedAfter: '2026-01-01T00:00:00Z',
      }),
    });

    expect(response.status).toBe(202);
    expect(startSync).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        mode: 'initial',
        receivedAfter: '2026-01-01T00:00:00Z',
      },
    );

    // `maxMessages` no longer caps an import and is rejected as an unknown field; dates must be RFC 3339.
    for (const body of [
      { mode: 'initial', maxMessages: 5_000 },
      { receivedAfter: '2026-01-01' },
      { receivedAfter: 'yesterday' },
    ]) {
      const rejected = await router.request(
        '/api/mail/accounts/account-1/sync',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      expect(rejected.status).toBe(400);
      expect(await rejected.json()).toMatchObject({
        error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
      });
    }
    expect(startSync).toHaveBeenCalledTimes(1);
  });

  it('lists synchronization logs for the authenticated user', async () => {
    const listSyncRunsPage = vi.fn<MailService['listSyncRunsPage']>(
      async () => ({ items: [syncRun('account-1', 'user-1')], total: 1 }),
    );
    const router = await createRouter(true, service({ listSyncRunsPage }));

    const response = await router.request('/api/mail/syncRuns');

    expect(response.status).toBe(200);
    expect(listSyncRunsPage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      0,
      20,
    );
    expect(await response.json()).toMatchObject({
      data: [{ id: 'sync-1', accountId: 'account-1' }],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });

  it('retries and cancels synchronization runs for the authenticated user', async () => {
    const retrySyncRun = vi.fn<MailService['retrySyncRun']>(async () =>
      syncRun('account-1', 'user-1'),
    );
    const cancelSyncRun = vi.fn<MailService['cancelSyncRun']>(async () => ({
      ...syncRun('account-1', 'user-1'),
      status: 'cancelled',
    }));
    const router = await createRouter(
      true,
      service({ retrySyncRun, cancelSyncRun }),
    );

    expect(
      (
        await router.request('/api/mail/syncRuns/sync-1/retry', {
          method: 'POST',
        })
      ).status,
    ).toBe(202);
    expect(
      (
        await router.request('/api/mail/syncRuns/sync-1/cancel', {
          method: 'POST',
        })
      ).status,
    ).toBe(200);
    expect(retrySyncRun).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'sync-1',
    );
    expect(cancelSyncRun).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'sync-1',
    );
  });

  it('maps unread counts, signatures, and local labels onto the Mail service', async () => {
    const getUnreadCount = vi.fn<MailService['getUnreadCount']>(async () => 7);
    const listSignatures = vi.fn<MailService['listSignatures']>(async () => []);
    const saveSignature = vi.fn<MailService['saveSignature']>(
      async (_context, input) => ({
        id: 'signature-1',
        accountId: input.accountId,
        name: input.name,
        text: input.text,
        html: input.html,
        isDefault: input.isDefault ?? false,
      }),
    );
    const listLabels = vi.fn<MailService['listLabels']>(async () => []);
    const createLabel = vi.fn<MailService['createLabel']>(async () => ({
      id: 'label-1',
      name: 'Customers',
      color: 'green',
      createdAt: '2026-09-14T00:00:00.000Z',
      updatedAt: '2026-09-14T00:00:00.000Z',
    }));
    const updateLabel = vi.fn<MailService['updateLabel']>(
      async (_context, input) => ({
        id: input.id,
        name: input.name,
        color: input.color ?? 'blue',
        createdAt: '2026-09-14T00:00:00.000Z',
        updatedAt: '2026-09-14T00:00:00.000Z',
      }),
    );
    const deleteLabel = vi.fn<MailService['deleteLabel']>(async () => {});
    const router = await createRouter(
      true,
      service({
        getUnreadCount,
        listSignatures,
        saveSignature,
        listLabels,
        createLabel,
        updateLabel,
        deleteLabel,
      }),
    );

    const unreadResponse = await router.request(
      '/api/mail/messages/countUnread',
    );
    await router.request('/api/mail/accounts/account-1/signatures');
    await router.request('/api/mail/accounts/account-1/signatures', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Sales',
        text: 'Regards',
        isDefault: true,
      }),
    });
    await router.request('/api/mail/labels');
    await router.request('/api/mail/labels', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Customers', color: 'green' }),
    });
    await router.request('/api/mail/labels/label-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Customers renamed', color: 'violet' }),
    });
    await router.request('/api/mail/labels/label-1', { method: 'DELETE' });

    expect(await unreadResponse.json()).toEqual({ data: 7 });
    expect(listSignatures).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
    );
    expect(saveSignature).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        name: 'Sales',
        text: 'Regards',
        html: undefined,
        isDefault: true,
      },
    );
    expect(createLabel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      { name: 'Customers', color: 'green' },
    );
    expect(updateLabel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      { id: 'label-1', name: 'Customers renamed', color: 'violet' },
    );
    expect(deleteLabel).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'label-1',
    );
    expect(listLabels).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
    );
  });

  it('lists send logs for the authenticated user', async () => {
    const listSubmissionsPage = vi.fn<MailService['listSubmissionsPage']>(
      async () => ({
        items: [
          {
            id: 'submission-1',
            accountId: 'account-1',
            status: 'accepted',
            providerMessageId: 'provider-message-1',
            createdAt: '2026-09-06T08:00:00.000Z',
            updatedAt: '2026-09-06T08:00:01.000Z',
          },
        ],
        total: 1,
      }),
    );
    const router = await createRouter(true, service({ listSubmissionsPage }));

    const response = await router.request('/api/mail/submissions');

    expect(response.status).toBe(200);
    expect(listSubmissionsPage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      false,
      0,
      false,
      20,
    );
    expect(await response.json()).toMatchObject({
      data: [{ id: 'submission-1', accountId: 'account-1' }],
    });
  });

  it('forwards log pages and rejects invalid pagination', async () => {
    const listSyncRunsPage = vi.fn<MailService['listSyncRunsPage']>(
      async () => ({ items: [], total: 0 }),
    );
    const listSubmissionsPage = vi.fn<MailService['listSubmissionsPage']>(
      async () => ({ items: [], total: 0 }),
    );
    const router = await createRouter(
      true,
      service({ listSyncRunsPage, listSubmissionsPage }),
    );
    expect(
      (await router.request('/api/mail/syncRuns?page=2&pageSize=21')).status,
    ).toBe(200);
    expect(listSyncRunsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      21,
      21,
    );
    expect(
      (
        await router.request(
          '/api/mail/submissions?bulkOnly=true&groupByBatch=true&page=3&pageSize=21',
        )
      ).status,
    ).toBe(200);
    expect(listSubmissionsPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      true,
      42,
      true,
      21,
    );
    for (const endpoint of ['syncRuns', 'submissions']) {
      for (const query of [
        'page=0',
        'page=1.5',
        'page=NaN',
        'pageSize=0',
        'pageSize=101',
        'pageSize=1.5',
      ]) {
        const response = await router.request(`/api/mail/${endpoint}?${query}`);
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
          error: { reason: 'INVALID_INPUT' },
        });
      }
    }
    expect(listSyncRunsPage).toHaveBeenCalledTimes(1);
    expect(listSubmissionsPage).toHaveBeenCalledTimes(1);
  });

  it('starts OAuth with the configured public callback URL', async () => {
    const startAuthorization = vi.fn<MailService['startAuthorization']>(
      async () => ({
        authorizationUrl: 'https://accounts.example.com/authorize',
        state: 'state-1',
      }),
    );
    const router = await createRouter(true, service({ startAuthorization }));
    const response = await router.request('/api/mail/authorizations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'gmail',
        name: 'google',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    });

    expect(response.status).toBe(201);
    expect(startAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        provider: { type: 'gmail', name: 'google' },
        redirectUri: 'https://mail.example.com/test/mail/oauth/callback',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      },
    );
  });

  it('uses a Mail-configured OAuth callback URL', async () => {
    const startAuthorization = vi.fn<MailService['startAuthorization']>(
      async () => ({
        authorizationUrl: 'https://accounts.example.com/authorize',
        state: 'state-1',
      }),
    );
    const router = await createRouter(
      true,
      service({ startAuthorization }),
      true,
      'https://oauth.example.com/test/mail/oauth/callback',
    );
    const response = await router.request('/api/mail/authorizations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'gmail',
        name: 'google',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    });

    expect(response.status).toBe(201);
    expect(startAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      expect.objectContaining({
        redirectUri: 'https://oauth.example.com/test/mail/oauth/callback',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    );
  });

  it('uses the request host when development public origins use loopback aliases', async () => {
    const startAuthorization = vi.fn<MailService['startAuthorization']>(
      async () => ({
        authorizationUrl: 'https://accounts.example.com/authorize',
        state: 'state-1',
      }),
    );
    const router = await createRouter(
      true,
      service({ startAuthorization }),
      true,
      undefined,
      'http://127.0.0.1:13000',
    );
    const response = await router.request(
      'http://localhost:13000/api/mail/authorizations',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'microsoft',
          name: 'microsoft-365',
          initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
        }),
      },
    );

    expect(response.status).toBe(201);
    expect(startAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      expect.objectContaining({
        redirectUri: 'http://localhost:13000/test/mail/oauth/callback',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    );
  });

  it('connects a credential-based Provider account', async () => {
    const connectAccount = vi.fn<MailService['connectAccount']>(
      async (_context, input) => ({
        id: 'account-1',
        userId: 'user-1',
        provider: input.provider,
        address: input.address,
        scopes: [],
        status: 'active',
      }),
    );
    const router = await createRouter(true, service({ connectAccount }));
    const response = await router.request('/api/mail/accounts/connect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'imap-smtp',
        name: 'company-mail',
        address: 'user@example.com',
        password: 'secret',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      }),
    });

    expect(response.status).toBe(201);
    expect(connectAccount).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        provider: { type: 'imap-smtp', name: 'company-mail' },
        address: 'user@example.com',
        username: 'user@example.com',
        password: 'secret',
        initialSyncReceivedAfter: '2026-02-01T00:00:00.000Z',
      },
    );
  });

  it('maps mailbox folders, filters, and conversations onto the Mail service', async () => {
    const listFolders = vi.fn<MailService['listFolders']>(async () => []);
    const listMessages = vi.fn<MailService['listMessages']>(async () => ({
      items: [],
    }));
    const listConversationMessages = vi.fn<
      MailService['listConversationMessages']
    >(async () => ({ items: [] }));
    const router = await createRouter(
      true,
      service({ listFolders, listMessages, listConversationMessages }),
    );

    await router.request('/api/mail/accounts/account-1/folders');
    await router.request(
      '/api/mail/messages?accountId=account-1&folderId=inbox&labelId=label-1&conversationId=thread-1&unread=true&pageToken=token-1&pageSize=25',
    );
    await router.request(
      '/api/mail/accounts/account-1/conversations/thread-1/messages?pageToken=25&pageSize=25',
    );

    expect(listFolders).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
    );
    expect(listMessages).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountIds: ['account-1'],
        folderIds: ['inbox'],
        labelIds: ['label-1'],
        conversationId: 'thread-1',
        query: undefined,
        cursor: 'token-1',
        withTotal: true,
        limit: 25,
        unread: true,
        starred: undefined,
      },
    );
    expect(listConversationMessages).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
      'thread-1',
      { cursor: '25', limit: 25 },
    );
  });

  it('rejects invalid send requests before calling the Mail service', async () => {
    const sendMessage = vi.fn<MailService['sendMessage']>();
    const router = await createRouter(true, service({ sendMessage }));
    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: 'account-1' }),
    });

    expect(response.status).toBe(400);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  describe.each(['send', 'sendBulk'])(
    'compose subject validation for %s',
    (action) => {
      it.each([
        { subject: '', status: 200 },
        { subject: '   ', status: 200 },
        { subject: undefined, status: 200 },
        { subject: null, status: 400 },
        { subject: 42, status: 400 },
        { subject: 'x'.repeat(9999), status: 400 },
      ])(
        'validates optional subjects (case %#)',
        async ({ subject, status }) => {
          const mail = service({ sendBulk: async () => messageView() });
          const submit = vi.spyOn(
            mail,
            action === 'send' ? 'sendMessage' : 'sendBulk',
          );
          const router = await createRouter(true, mail);
          const response = await router.request(
            `/api/mail/messages/${action}`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                accountId: 'account-1',
                identityId: 'identity-1',
                ...recipientsFor(action),
                subject,
                text: 'Hello',
                idempotencyKey: 'empty-subject',
              }),
            },
          );
          expect(response.status).toBe(status);
          if (status === 200)
            expect(submit).toHaveBeenCalledWith(
              expect.anything(),
              expect.objectContaining({ subject: subject ?? '' }),
            );
          else expect(submit).not.toHaveBeenCalled();
        },
      );
    },
  );

  describe.each(['send', 'sendBulk'])(
    'compose body validation for %s',
    (action) => {
      const cases = [
        {
          name: 'HTML without text',
          body: { html: '<p>Hello</p>' },
          status: 200,
        },
        {
          name: 'image-only body',
          body: { text: '', html: '<img src="cid:image-1">' },
          status: 200,
        },
        {
          name: 'blank text with HTML',
          body: { text: ' \n', html: '<p>Hello</p>' },
          status: 200,
        },
        { name: 'plain text', body: { text: 'Hello' }, status: 200 },
        { name: 'missing body', body: {}, status: 400 },
        { name: 'blank body', body: { text: ' ', html: '\n' }, status: 400 },
        {
          name: 'invalid text',
          body: { text: 42, html: '<p>Hello</p>' },
          status: 400,
        },
        {
          name: 'null text',
          body: { text: null, html: '<p>Hello</p>' },
          status: 400,
        },
        {
          name: 'invalid HTML',
          body: { text: 'Hello', html: 42 },
          status: 400,
        },
        {
          name: 'oversized text',
          body: { text: 'x'.repeat(4 * 1024 * 1024 + 1), html: '<p>Hello</p>' },
          status: 400,
        },
        {
          name: 'oversized HTML',
          body: { html: 'x'.repeat(4 * 1024 * 1024 + 1) },
          status: 400,
        },
      ];

      it.each(cases)('$name', async ({ body, status }) => {
        const mail = service({ sendBulk: async () => messageView() });
        const submit = vi.spyOn(
          mail,
          action === 'send' ? 'sendMessage' : 'sendBulk',
        );
        const router = await createRouter(true, mail);
        const response = await router.request(`/api/mail/messages/${action}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            accountId: 'account-1',
            identityId: 'identity-1',
            ...recipientsFor(action),
            subject: 'Hello',
            idempotencyKey: 'html-body',
            ...body,
          }),
        });

        expect(response.status).toBe(status);
        if (status === 200) {
          expect(submit).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ text: body.text ?? '', html: body.html }),
          );
        } else {
          expect(submit).not.toHaveBeenCalled();
        }
      });
    },
  );

  it('preserves reply, forward, and scheduling fields at the HTTP boundary', async () => {
    const sendMessage = vi.fn<MailService['sendMessage']>(
      async (_context, input) => ({
        id: input.idempotencyKey,
        accountId: input.accountId,
        status: 'pending',
        scheduledAt: input.scheduledAt,
      }),
    );
    const router = await createRouter(true, service({ sendMessage }));
    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Follow up',
        text: 'Mail body',
        inReplyToMessageId: 'message-1',
        scheduledAt: '2099-01-01T00:00:00.000Z',
        idempotencyKey: 'scheduled-reply',
      }),
    });

    expect(response.status).toBe(200);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      expect.objectContaining({
        inReplyToMessageId: 'message-1',
        scheduledAt: '2099-01-01T00:00:00.000Z',
      }),
    );

    const notRfc3339 = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        text: 'Mail body',
        scheduledAt: 'Jan 1 2099',
        idempotencyKey: 'scheduled-invalid',
      }),
    });
    expect(notRfc3339.status).toBe(400);
    expect(await notRfc3339.json()).toMatchObject({
      error: { fieldViolations: [{ field: 'scheduledAt' }] },
    });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it.each(['send', 'draft'])(
    'preserves an editable forward body for %s',
    async (action) => {
      const sendMessage = vi.fn<MailService['sendMessage']>(async () => ({
        id: 'submission-1',
        accountId: 'account-1',
        status: 'pending',
      }));
      const saveDraft = vi.fn<MailService['saveDraft']>(async () =>
        messageView(),
      );
      const router = await createRouter(
        true,
        service({ sendMessage, saveDraft }),
      );
      const response = await router.request(
        action === 'send'
          ? '/api/mail/messages/send'
          : '/api/mail/messages/saveDraft',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            accountId: 'account-1',
            identityId: 'identity-1',
            to: [{ address: 'recipient@example.com' }],
            subject: 'Fwd: Original',
            text: 'Edited original',
            forwardOfMessageId: 'message-1',
            forwardBodyIncluded: true,
            idempotencyKey: 'forward-1',
          }),
        },
      );
      expect(response.status).toBe(200);
      expect(action === 'send' ? sendMessage : saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: 'user-1' }),
        expect.objectContaining({
          forwardOfMessageId: 'message-1',
          forwardBodyIncluded: true,
          text: 'Edited original',
        }),
      );
    },
  );

  it.each(['send', 'draft'])(
    'preserves an quoted reply body for %s',
    async (action) => {
      const sendMessage = vi.fn<MailService['sendMessage']>(async () => ({
        id: 'submission-1',
        accountId: 'account-1',
        status: 'pending',
      }));
      const saveDraft = vi.fn<MailService['saveDraft']>(async () =>
        messageView(),
      );
      const router = await createRouter(
        true,
        service({ sendMessage, saveDraft }),
      );
      const response = await router.request(
        action === 'send'
          ? '/api/mail/messages/send'
          : '/api/mail/messages/saveDraft',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            accountId: 'account-1',
            identityId: 'identity-1',
            to: [{ address: 'recipient@example.com' }],
            subject: 'Re: Original',
            text: 'Edited original',
            inReplyToMessageId: 'message-1',
            replyBodyIncluded: true,
            idempotencyKey: 'reply-1',
          }),
        },
      );
      expect(response.status).toBe(200);
      expect(action === 'send' ? sendMessage : saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: 'user-1' }),
        expect.objectContaining({
          inReplyToMessageId: 'message-1',
          replyBodyIncluded: true,
          text: 'Edited original',
        }),
      );
    },
  );

  it('allows an empty-recipient draft at the HTTP boundary', async () => {
    const saveDraft = vi.fn<MailService['saveDraft']>(async () =>
      messageView(),
    );
    const router = await createRouter(true, service({ saveDraft }));

    const response = await router.request('/api/mail/messages/saveDraft', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        subject: '',
        text: '',
        draftMessageId: 'draft-message-1',
        retainedAttachmentIds: ['draft-message-1:provider-attachment-1'],
        idempotencyKey: 'draft-1',
      }),
    });

    expect(response.status).toBe(200);
    expect(saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      expect.objectContaining({
        to: [],
        subject: '',
        text: '',
        draftMessageId: 'draft-message-1',
        retainedAttachmentIds: ['draft-message-1:provider-attachment-1'],
      }),
    );
  });

  it('leaves unexpected service errors to the application as an opaque failure', async () => {
    const listAccounts = vi.fn<MailService['listAccounts']>(async () => {
      throw new Error('database password appeared in an internal error');
    });
    const router = await createRouter(true, service({ listAccounts }));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await router.request('/api/mail/accounts');
    const body = await response.text();
    errors.mockRestore();

    expect(response.status).toBe(500);
    expect(body).not.toContain('database password');
  });

  it('requires a session and dispatches owner-scoped content retries', async () => {
    const retryMessageContent = vi.fn<MailService['retryMessageContent']>(
      async () => messageView(),
    );
    const anonymous = await createRouter(
      false,
      service({ retryMessageContent }),
    );
    const unauthorized = await anonymous.request(
      '/api/mail/accounts/account-1/messages/message-1/retryContent',
      { method: 'POST' },
    );
    expect(unauthorized.status).toBe(401);
    expect(retryMessageContent).not.toHaveBeenCalled();
    const router = await createRouter(true, service({ retryMessageContent }));
    const response = await router.request(
      '/api/mail/accounts/account-1/messages/message-1/retryContent',
      { method: 'POST' },
    );
    expect(response.status).toBe(200);
    expect(retryMessageContent).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
      'message-1',
    );
  });

  it('maps message mutation routes onto the Mail service', async () => {
    const updateMessage = vi.fn<MailService['updateMessage']>(async () =>
      messageView(),
    );
    const moveMessage = vi.fn<MailService['moveMessage']>(async () =>
      messageView(),
    );
    const deleteMessage = vi.fn<MailService['deleteMessage']>(async () => {});
    const updateMessageLabels = vi.fn<MailService['updateMessageLabels']>(
      async () => messageView(),
    );
    const router = await createRouter(
      true,
      service({
        updateMessage,
        updateMessageLabels,
        moveMessage,
        deleteMessage,
      }),
    );

    expect(
      (
        await router.request(
          '/api/mail/accounts/account-1/messages/message-1',
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              read: true,
              starred: true,
              note: 'Follow up with the customer',
              todo: true,
            }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await router.request(
          '/api/mail/accounts/account-1/messages/message-1/modifyLabels',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              addLabelIds: ['Label_1'],
              removeLabelIds: ['Label_2'],
            }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await router.request(
          '/api/mail/accounts/account-1/messages/message-1/move',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ providerFolderId: 'archive' }),
          },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await router.request(
          '/api/mail/accounts/account-1/messages/message-1?permanently=true',
          { method: 'DELETE' },
        )
      ).status,
    ).toBe(204);

    expect(updateMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        messageId: 'message-1',
        read: true,
        starred: true,
        note: 'Follow up with the customer',
        todo: true,
      },
    );
    expect(updateMessageLabels).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        messageId: 'message-1',
        addLabelIds: ['Label_1'],
        removeLabelIds: ['Label_2'],
      },
    );
    expect(moveMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        messageId: 'message-1',
        providerFolderId: 'archive',
      },
    );
    expect(deleteMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      {
        accountId: 'account-1',
        messageId: 'message-1',
        permanently: true,
      },
    );
  });

  it('protects uploaded preview bytes behind workspace permission and forwards the authenticated owner', async () => {
    const getUploadedAttachment = vi.fn<MailService['getUploadedAttachment']>(
      async () => ({
        fileName: 'image.png',
        contentType: 'image/png',
        stream: new Response('image').body!,
      }),
    );
    const denied = await createRouter(
      true,
      service({ getUploadedAttachment }),
      false,
    );
    expect((await denied.request('/api/mail/attachments/upload')).status).toBe(
      403,
    );
    expect(getUploadedAttachment).not.toHaveBeenCalled();
    const router = await createRouter(true, service({ getUploadedAttachment }));
    const response = await router.request('/api/mail/attachments/upload');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('image');
    expect(getUploadedAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'upload',
    );
  });

  it('streams an owned attachment with download-safe headers', async () => {
    const getAttachment = vi.fn<MailService['getAttachment']>(async () => ({
      fileName: '季度 报告.pdf',
      contentType: 'application/pdf',
      size: 3,
      stream: streamOf('pdf'),
    }));
    const router = await createRouter(true, service({ getAttachment }));

    const response = await router.request(
      '/api/mail/accounts/account-1/messages/message-1/attachments/attachment-1',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-length')).toBe('3');
    expect(response.headers.get('content-disposition')).toContain(
      "filename*=UTF-8''%E5%AD%A3%E5%BA%A6%20%E6%8A%A5%E5%91%8A.pdf",
    );
    expect(await response.text()).toBe('pdf');
    expect(getAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      'account-1',
      'message-1',
      'attachment-1',
    );
  });

  it('answers an unexpected TypeError with an opaque 500 rather than blaming the request', async () => {
    const router = await createRouter(
      true,
      service({
        listLabels: async () => {
          throw new TypeError(
            "Cannot read properties of undefined (reading 'id')",
          );
        },
      }),
    );

    const response = await router.request('/api/mail/labels');

    // The route leaves the error to the application's handler, which answers the opaque 500 body.
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('Cannot read properties');
  });

  it('answers invalid input found below the schema with 400 and the field it names', async () => {
    const router = await createRouter(
      true,
      service({
        listMessages: async () => {
          throw mailInvalidArgument(
            'Mail page cursor is invalid.',
            'pageToken',
          );
        },
      }),
    );

    const response = await router.request(
      '/api/mail/messages?pageToken=not-a-cursor',
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_MAIL_REQUEST',
        domain: 'mail',
        fieldViolations: [{ field: 'pageToken' }],
      },
    });
  });

  it('does not silently discard unsupported attachments', async () => {
    const sendMessage = vi.fn<MailService['sendMessage']>(async () => {
      throw mailInvalidArgument(
        'Attachments are not supported.',
        'attachmentIds',
      );
    });
    const router = await createRouter(true, service({ sendMessage }));

    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        subject: 'Hello',
        text: 'Mail body',
        attachmentIds: ['attachment-1'],
        idempotencyKey: 'request-with-attachment',
      }),
    });

    expect(response.status).toBe(400);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'user-1' }),
      expect.objectContaining({ attachmentIds: ['attachment-1'] }),
    );
  });

  it('rejects oversized JSON requests before parsing them', async () => {
    const sendMessage = vi.fn<MailService['sendMessage']>(async () =>
      messageView(),
    );
    const router = await createRouter(true, service({ sendMessage }));

    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payload: 'x'.repeat(8 * 1024 * 1024) }),
    });

    expect(response.status).toBe(413);
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('rejects excessive recipient arrays at the HTTP boundary', async () => {
    const sendBulk = vi.fn<MailService['sendBulk']>(async () => messageView());
    const router = await createRouter(true, service({ sendBulk }));

    const response = await router.request('/api/mail/messages/sendBulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        recipients: Array.from({ length: 101 }, (_, index) => ({
          address: `recipient-${index}@example.com`,
        })),
        subject: 'Hello',
        text: 'Mail body',
        idempotencyKey: 'bulk-too-many-recipients',
      }),
    });

    expect(response.status).toBe(400);
    expect(sendBulk).not.toHaveBeenCalled();
  });

  // Each group is gated by its own page: a renamed path that no longer matched the page check would silently fall
  // through to the workspace permission, and a route outside the authentication boundary would answer anonymously.
  it.each([
    ['workspace', '/api/mail/messages', 'mail.workspace'],
    ['workspace', '/api/mail/syncRuns', 'mail.workspace'],
    ['settings', '/api/mail/settings/accounts', 'mail.admin'],
    ['settings', '/api/mail/settings/syncRuns', 'mail.admin'],
    ['settings', '/api/mail/settings/submissions', 'mail.admin'],
    ['management', '/api/mail/management/accounts', 'mail.management'],
    ['management', '/api/mail/management/messages', 'mail.management'],
  ])(
    'rejects anonymous and unauthorized %s requests to %s',
    async (_group, path, resource) => {
      const anonymous = await createRouter(false, service());
      expect((await anonymous.request(path)).status).toBe(401);

      const checked: string[] = [];
      const denied = await createRouter(true, service(), (id) => {
        checked.push(id);
        return false;
      });
      const response = await denied.request(path);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: { reason: 'MAIL_ACCESS_DENIED', domain: 'mail' },
      });
      expect(checked).toEqual([resource]);

      const allowed = await createRouter(
        true,
        service(),
        (id) => id === resource,
      );
      expect((await allowed.request(path)).status).toBe(200);
    },
  );

  it('checks page access before validating input', async () => {
    const router = await createRouter(true, service(), false);
    const response = await router.request('/api/mail/syncRuns?page=0');
    expect(response.status).toBe(403);
  });

  it('answers 404 for a missing path resource and 400 for a missing referenced one', async () => {
    const missingAccount = (field: string) =>
      new MailError({
        status: 'NOT_FOUND',
        reason: 'MAIL_ACCOUNT_NOT_FOUND',
        message: 'Mail account was not found.',
        field,
      });
    const router = await createRouter(
      true,
      service({
        listIdentities: async () => {
          throw missingAccount('accountId');
        },
        sendMessage: async () => {
          throw missingAccount('accountId');
        },
      }),
    );

    const path = await router.request('/api/mail/accounts/missing/identities');
    expect(path.status).toBe(404);
    expect(await path.json()).toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'MAIL_ACCOUNT_NOT_FOUND',
        domain: 'mail',
      },
    });

    const body = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'missing',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        text: 'Hello',
        idempotencyKey: 'missing-account',
      }),
    });
    expect(body.status).toBe(400);
    expect(await body.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'MAIL_ACCOUNT_NOT_FOUND',
        fieldViolations: [{ field: 'accountId' }],
      },
    });
  });

  it('reports state conflicts and duplicate labels with their own statuses', async () => {
    const router = await createRouter(
      true,
      service({
        cancelSyncRun: async () => {
          throw new MailError({
            status: 'FAILED_PRECONDITION',
            reason: 'MAIL_SYNC_RUN_STATE_INVALID',
            message: 'Only active sync runs can be cancelled.',
          });
        },
        createLabel: async () => {
          throw new MailError({
            status: 'ALREADY_EXISTS',
            reason: 'MAIL_LABEL_ALREADY_EXISTS',
            message: 'Mail label name is already in use.',
          });
        },
      }),
    );
    const cancel = await router.request('/api/mail/syncRuns/sync-1/cancel', {
      method: 'POST',
    });
    expect(cancel.status).toBe(400);
    expect(await cancel.json()).toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'MAIL_SYNC_RUN_STATE_INVALID',
      },
    });
    const label = await router.request('/api/mail/labels', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Customers' }),
    });
    expect(label.status).toBe(409);
    expect(await label.json()).toMatchObject({
      error: { status: 'ALREADY_EXISTS', reason: 'MAIL_LABEL_ALREADY_EXISTS' },
    });
  });

  it('reports a repeated idempotency key with different content as ABORTED', async () => {
    const router = await createRouter(
      true,
      service({
        sendMessage: async () => {
          throw new MailIdempotencyConflictError();
        },
      }),
    );
    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        accountId: 'account-1',
        identityId: 'identity-1',
        to: [{ address: 'recipient@example.com' }],
        text: 'Hello',
        idempotencyKey: 'reused',
      }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { status: 'ABORTED', reason: 'MAIL_IDEMPOTENCY_CONFLICT' },
    });
  });

  it('creates templates and uploads with 201 and validates the upload body in code', async () => {
    const uploadAttachment = vi.fn<MailService['uploadAttachment']>(
      async (_context, input) => ({
        id: 'upload-1',
        fileName: input.fileName,
        contentType: input.contentType,
        size: input.size,
      }),
    );
    const router = await createRouter(
      true,
      service({
        uploadAttachment,
        saveTemplate: async (_context, input) => ({
          id: 'template-1',
          name: input.name,
          subject: input.subject,
          createdAt: '2026-09-14T00:00:00.000Z',
          updatedAt: '2026-09-14T00:00:00.000Z',
        }),
      }),
    );
    const template = await router.request('/api/mail/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Welcome' }),
    });
    expect(template.status).toBe(201);

    const wrongType = await router.request('/api/mail/attachments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ file: 'x' }),
    });
    expect(wrongType.status).toBe(415);
    expect(await wrongType.json()).toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_MAIL_REQUEST' },
    });

    const noFile = new FormData();
    noFile.append('other', 'value');
    const missing = await router.request('/api/mail/attachments', {
      method: 'POST',
      body: noFile,
    });
    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({
      error: { fieldViolations: [{ field: 'file' }] },
    });

    const form = new FormData();
    form.append(
      'file',
      new File(['hello'], 'hello.txt', { type: 'text/plain' }),
    );
    const uploaded = await router.request('/api/mail/attachments', {
      method: 'POST',
      body: form,
    });
    expect(uploaded.status).toBe(201);
    expect(uploadAttachment).toHaveBeenCalledTimes(1);
  });

  it('answers an oversized JSON body with the standard error body', async () => {
    const router = await createRouter(true, service());
    const response = await router.request('/api/mail/messages/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ payload: 'x'.repeat(8 * 1024 * 1024) }),
    });
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      error: {
        code: 413,
        status: 'INVALID_ARGUMENT',
        reason: 'BODY_TOO_LARGE',
        domain: 'mail',
      },
    });
  });
});

async function createRouter(
  authenticated: boolean,
  mail: MailService,
  allowed: boolean | ((resource: string) => boolean) = true,
  oauthCallbackUrl?: string,
  publicOrigin = 'https://mail.example.com',
): Promise<Hono> {
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (!authenticated) {
        return context.json(
          { code: 'UNAUTHORIZED', message: 'Authentication required' },
          401,
        );
      }
      context.set('auth', {
        user: { id: 'user-1' },
        session: {},
      });
      await next();
    },
  } as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', {
        can: async (request: { resource: { id: string } }) =>
          typeof allowed === 'function'
            ? allowed(request.resource.id)
            : allowed,
      });
      await next();
    },
  } as unknown as AppAuthorization);
  container.instance(mailServiceToken, mail);
  const contribution = await mailApiRoutes.createRouter({
    appName: 'test',
    publicBasePath: '/test',
    config: {
      get: () => ({
        name: 'test',
        publicBasePath: '/test',
        publicOrigin,
        oauthCallbackUrl,
      }),
    },
    paths: createAppPaths({ rootDir: '/missing' }),
    router: new Hono(),
    container,
  });
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerNamespace('@nocobase/app-plugin-mail', serverLocales);
  await runtime.init();
  const router = new Hono();
  router.use('*', createI18nMiddleware(runtime));
  router.route('/api', contribution);
  return router;
}

function service(overrides: Partial<MailService> = {}): MailService {
  return {
    listProviders: async () => [],
    startAuthorization: async (_context, input) => ({
      authorizationUrl: `https://example.com/authorize/${input.provider.type}`,
      state: 'state-1',
    }),
    connectAccount: async () => ({
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'user@example.com',
      scopes: [],
      status: 'active',
    }),
    completeAuthorization: async () => ({
      id: 'account-1',
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'user@example.com',
      scopes: [],
      status: 'active',
    }),
    listAccounts: async () => [],
    updateAccount: async (_context, input) => ({
      id: input.accountId,
      userId: 'user-1',
      provider: { type: 'test', name: 'test' },
      address: 'user@example.com',
      scopes: [],
      status: input.status ?? 'active',
    }),
    removeAccount: async () => {},
    listManagedAccounts: async () => [],
    listManagedSyncRunsPage: async () => ({ items: [], total: 0 }),
    listManagedSubmissionsPage: async () => ({ items: [], total: 0 }),
    listManagedFolders: async () => [],
    listManagedMessages: async () => ({ items: [] }),
    manageMessages: async () => ({ items: [], succeeded: 0, failed: 0 }),
    listFolders: async () => [],
    listLabels: async () => [],
    listIdentities: async () => [],
    updateIdentity: async () => {
      throw new Error('Not implemented');
    },
    listSignatures: async () => [],
    saveSignature: async () => {
      throw new Error('Not implemented');
    },
    deleteSignature: async () => {},
    createLabel: async () => {
      throw new Error('Not implemented');
    },
    updateLabel: async () => {
      throw new Error('Not implemented');
    },
    deleteLabel: async () => {},
    updateMessageLabels: async () => messageView(),
    getUnreadCount: async () => 0,
    startSync: async (_context, input) => syncRun(input.accountId, 'user-1'),
    getSyncRun: async () => undefined,
    listSyncRuns: async () => [],
    listSyncRunsPage: async () => ({ items: [], total: 0 }),
    listSubmissionsPage: async () => ({ items: [], total: 0 }),
    retrySyncRun: async () => syncRun('account-1', 'user-1'),
    cancelSyncRun: async () => ({
      ...syncRun('account-1', 'user-1'),
      status: 'cancelled',
    }),
    retrySubmission: async () => {
      throw new Error('Not implemented');
    },
    cancelSubmission: async () => {
      throw new Error('Not implemented');
    },
    listSubmissions: async () => [],
    listMessages: async () => ({ items: [] }),
    getManagedMessage: async () => undefined,
    getManagedAttachment: async () => ({
      fileName: 'attachment.bin',
      contentType: 'application/octet-stream',
      stream: streamOf(''),
    }),
    getMessage: async () => undefined,
    getAttachment: async () => ({
      fileName: 'attachment.bin',
      contentType: 'application/octet-stream',
      stream: streamOf(''),
    }),
    listConversationMessages: async () => ({ items: [] }),
    sendMessage: async (_context, input) => ({
      id: input.idempotencyKey,
      accountId: input.accountId,
      status: 'accepted',
    }),
    saveDraft: async () => messageView(),
    updateMessage: async () => messageView(),
    moveMessage: async () => messageView(),
    deleteMessage: async () => {},
    ...overrides,
  };
}

function messageView(): import('../../server/types.js').MailMessage {
  return {
    id: 'message-1',
    accountId: 'account-1',
    providerMessageId: 'provider-message-1',
    folderIds: ['inbox'],
    labelIds: [],
    to: [],
    cc: [],
    bcc: [],
    replyTo: [],
    references: [],
    subject: 'Subject',
    read: false,
    starred: false,
    draft: false,
    hasAttachments: false,
    todo: false,
    attachments: [],
  };
}

function recipientsFor(action: string): Record<string, unknown> {
  return action === 'send'
    ? { to: [{ address: 'recipient@example.com' }] }
    : { recipients: [{ address: 'recipient@example.com' }] };
}

function streamOf(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

function syncRun(accountId: string, _requestedBy: string): MailSyncRunView {
  return {
    id: 'sync-1',
    accountId,
    mode: 'initial',
    phase: 'preparing',
    status: 'pending',
    policy: { maxMessages: 10_000, batchSize: 100 },
    processedMessages: 0,
    processedPages: 0,
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  };
}
