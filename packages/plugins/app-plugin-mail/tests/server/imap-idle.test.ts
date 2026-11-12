import { EventEmitter } from 'node:events';
import type { ImapFlow } from 'imapflow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MailImapIdle } from '../../server/runtime/imap-idle.js';
import { createImapClient } from '../../server/adapters/imap-smtp/connection.js';
import type { MailAccount } from '../../shared/mail.js';
import type { MailCredentialVault } from '../../server/contracts/provider.js';

const account: MailAccount = {
  id: 'account',
  userId: 'owner',
  address: 'owner@example.com',
  provider: { type: 'imap-smtp', name: 'imap' },
  status: 'active',
  credentialReference: 'credential',
  scopes: [],
};
const config = {
  type: 'imap-smtp' as const,
  name: 'imap',
  imap: { host: 'imap.example.com', port: 993, secure: true },
  smtp: { host: 'smtp.example.com', port: 465, secure: true },
};

class FakeImap extends EventEmitter {
  public capabilities = new Set(['IDLE']);
  public connect = vi.fn(async () => undefined);
  public mailboxOpen = vi.fn(async () => undefined);
  private finishIdle?: (value: boolean) => void;
  public idle = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        this.finishIdle = resolve;
      }),
  );
  public close = vi.fn(() => {
    this.finishIdle?.(true);
    this.emit('close');
  });
}

const instances: MailImapIdle[] = [];
function fixture() {
  const clients: FakeImap[] = [];
  const credentials = {
    get: vi.fn(async () => ({ username: 'u', password: 'p' })),
  };
  const schedule = vi.fn(async () => undefined);
  const createClient = vi.fn(() => {
    const client = new FakeImap();
    clients.push(client);
    return client as unknown as ImapFlow;
  });
  const listener = new MailImapIdle({
    credentials: credentials as unknown as MailCredentialVault,
    resolveConfig: () => config,
    schedulePushSync: schedule,
    createClient,
  });
  instances.push(listener);
  return { listener, clients, credentials, schedule, createClient };
}

afterEach(async () => {
  for (const instance of instances.splice(0)) await instance.close();
  vi.useRealTimers();
});

describe('INBOX IDLE lifecycle', () => {
  it('schedules catch-up on connect and pushes on increasing INBOX EXISTS without polling', async () => {
    vi.useFakeTimers();
    const { listener, clients, schedule } = fixture();
    listener.update(account);
    await vi.advanceTimersByTimeAsync(0);
    expect(clients[0].mailboxOpen).toHaveBeenCalledWith('INBOX', {
      readOnly: true,
    });
    expect(schedule).toHaveBeenCalledWith(account.id);
    schedule.mockClear();
    clients[0].emit('exists', { path: 'Archive', count: 2, prevCount: 1 });
    clients[0].emit('exists', { path: 'INBOX', count: 1, prevCount: 2 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(schedule).not.toHaveBeenCalled();
    clients[0].emit('exists', { path: 'INBOX', count: 2, prevCount: 1 });
    expect(schedule).toHaveBeenCalledExactlyOnceWith(account.id);
  });

  it('keeps one listener and closes it on suspension, credential replacement and removal', async () => {
    vi.useFakeTimers();
    const { listener, clients, schedule } = fixture();
    listener.reconcile([account]);
    await vi.advanceTimersByTimeAsync(0);
    listener.reconcile([account]);
    expect(clients).toHaveLength(1);
    listener.update({ ...account, status: 'suspended' });
    expect(clients[0].close).toHaveBeenCalled();
    schedule.mockClear();
    clients[0].emit('exists', { path: 'INBOX', count: 2, prevCount: 1 });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(schedule).not.toHaveBeenCalled();
    expect(clients).toHaveLength(1);
    listener.update(account);
    await vi.advanceTimersByTimeAsync(0);
    listener.update({ ...account, credentialReference: 'replacement' });
    await vi.advanceTimersByTimeAsync(0);
    expect(clients[1].close).toHaveBeenCalled();
    expect(clients).toHaveLength(3);
    listener.reconcile([]);
    expect(clients[2].close).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(clients).toHaveLength(3);
  });

  it('backs off failed reconnects, catches up on recovery and cancels retries on shutdown', async () => {
    vi.useFakeTimers();
    const { listener, clients, createClient, schedule } = fixture();
    listener.update(account);
    await vi.advanceTimersByTimeAsync(0);
    clients[0].close();
    createClient.mockImplementation(() => {
      const client = new FakeImap();
      client.connect.mockRejectedValue(new Error('Disconnected'));
      clients.push(client);
      return client as unknown as ImapFlow;
    });
    await vi.advanceTimersByTimeAsync(999);
    expect(clients).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(clients).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(clients).toHaveLength(2);
    createClient.mockImplementation(() => {
      const client = new FakeImap();
      clients.push(client);
      return client as unknown as ImapFlow;
    });
    schedule.mockClear();
    await vi.advanceTimersByTimeAsync(1);
    expect(clients).toHaveLength(3);
    expect(schedule).toHaveBeenCalledExactlyOnceWith(account.id);
    clients[2].close();
    await listener.close();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(clients).toHaveLength(3);
  });

  it('closes a connecting listener when the account is disabled', async () => {
    vi.useFakeTimers();
    const { listener, createClient, clients, schedule } = fixture();
    let connected!: () => void;
    createClient.mockImplementation(() => {
      const client = new FakeImap();
      client.connect.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            connected = resolve;
          }),
      );
      clients.push(client);
      return client as unknown as ImapFlow;
    });
    listener.update(account);
    await vi.advanceTimersByTimeAsync(0);
    listener.update({ ...account, status: 'suspended' });
    connected();
    await vi.advanceTimersByTimeAsync(0);
    expect(clients[0].close).toHaveBeenCalled();
    expect(clients[0].idle).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('backs off connections that SELECT successfully but disconnect before becoming stable', async () => {
    vi.useFakeTimers();
    const { listener, clients, schedule } = fixture();
    listener.update(account);
    await vi.advanceTimersByTimeAsync(0);
    for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 60_000]) {
      const count = clients.length;
      clients.at(-1)!.close();
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(clients).toHaveLength(count);
      expect(schedule).toHaveBeenCalledTimes(count);
      await vi.advanceTimersByTimeAsync(1);
      expect(clients).toHaveLength(count + 1);
      expect(schedule).toHaveBeenCalledTimes(count + 1);
    }
    // A full minute on the current connection restores the initial delay.
    await vi.advanceTimersByTimeAsync(60_000);
    const count = clients.length;
    clients.at(-1)!.close();
    await vi.advanceTimersByTimeAsync(999);
    expect(clients).toHaveLength(count);
    await vi.advanceTimersByTimeAsync(1);
    expect(clients).toHaveLength(count + 1);
  });

  it('does not poll or reconnect when IDLE is unsupported', async () => {
    vi.useFakeTimers();
    const { listener, clients, createClient } = fixture();
    createClient.mockImplementation(() => {
      const client = new FakeImap();
      client.capabilities.clear();
      clients.push(client);
      return client as unknown as ImapFlow;
    });
    listener.update(account);
    await vi.advanceTimersByTimeAsync(60_000);
    listener.reconcile([account]);
    expect(clients).toHaveLength(1);
    expect(clients[0].close).toHaveBeenCalled();
    expect(clients[0].idle).not.toHaveBeenCalled();
  });

  it('configures native ImapFlow to renew IDLE at 25 minutes without minute NOOPs', () => {
    const client = createImapClient(
      config.imap,
      { username: 'u', password: 'p' },
      true,
    );
    expect(client.options).toMatchObject({
      maxIdleTime: 25 * 60_000,
      socketTimeout: 26 * 60_000,
      disableAutoIdle: true,
    });
    client.close();
  });
});
