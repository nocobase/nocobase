import { describe, expect, it, vi } from 'vitest';
import { MailMessageSyncEventsService } from '../../server/services/message-sync-events.js';
import type { MailAccount } from '../../shared/mail.js';

function fixture(status: MailAccount['status'] = 'active') {
  const getAccount = vi.fn(
    async () => ({ id: 'account-1', userId: 'owner-1', status }) as MailAccount,
  );
  const page = { items: [], checkpoint: 'opaque-checkpoint' };
  const listMessageSyncEvents = vi.fn(async () => page);
  return {
    service: new MailMessageSyncEventsService({
      store: { getAccount, listMessageSyncEvents },
    }),
    getAccount,
    listMessageSyncEvents,
    page,
  };
}

describe('Mail public message sync event reads', () => {
  it('authorizes the owner before reading and delegates opaque paging unchanged', async () => {
    const { service, getAccount, listMessageSyncEvents, page } = fixture();
    const input = {
      accountId: 'account-1',
      pageToken: 'opaque-page',
      pageSize: 2,
    };
    expect(
      await service.listMessageSyncEvents({ actorId: 'owner-1' }, input),
    ).toBe(page);
    expect(listMessageSyncEvents).toHaveBeenCalledExactlyOnceWith(input);
    expect(getAccount.mock.invocationCallOrder[0]).toBeLessThan(
      listMessageSyncEvents.mock.invocationCallOrder[0]!,
    );
  });

  it('never reads another owner, missing or removing account even with a token', async () => {
    const { service, getAccount, listMessageSyncEvents } = fixture();
    await expect(
      service.listMessageSyncEvents(
        { actorId: 'other' },
        { accountId: 'account-1', after: 'token' },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_NOT_FOUND' });
    getAccount.mockResolvedValueOnce(undefined as unknown as MailAccount);
    await expect(
      service.listMessageSyncEvents(
        { actorId: 'owner-1' },
        { accountId: 'account-1' },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_NOT_FOUND' });
    getAccount.mockResolvedValueOnce({
      id: 'account-1',
      userId: 'owner-1',
      status: 'removing',
    } as MailAccount);
    await expect(
      service.listMessageSyncEvents(
        { actorId: 'owner-1' },
        { accountId: 'account-1' },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_REMOVING' });
    expect(listMessageSyncEvents).not.toHaveBeenCalled();
  });

  it('keeps committed history readable while reauthorization is required', async () => {
    const { service, page } = fixture('reauthorizationRequired');
    expect(
      await service.listMessageSyncEvents(
        { actorId: 'owner-1' },
        { accountId: 'account-1' },
      ),
    ).toBe(page);
  });

  it('uses the existing trusted management boundary, not the owners identity', async () => {
    const { service, page, listMessageSyncEvents, getAccount } = fixture();
    expect(
      await service.listManagedMessageSyncEvents(
        { actorId: 'trusted-admin' },
        { accountId: 'account-1' },
      ),
    ).toBe(page);
    getAccount.mockResolvedValueOnce(undefined as unknown as MailAccount);
    await expect(
      service.listManagedMessageSyncEvents(
        { actorId: 'trusted-admin' },
        { accountId: 'missing' },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_ACCOUNT_NOT_FOUND' });
    expect(listMessageSyncEvents).toHaveBeenCalledOnce();
  });
});
