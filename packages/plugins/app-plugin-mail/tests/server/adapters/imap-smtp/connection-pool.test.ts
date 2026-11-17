import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImapFlow } from 'imapflow';
import { Readable } from 'node:stream';
import type { Transporter } from 'nodemailer';

import { ImapConnectionPool } from '../../../../server/adapters/imap-smtp/connection-pool.js';
import { ImapSmtpAdapter } from '../../../../server/adapters/imap-smtp/adapter.js';
import { encodeAttachmentLocator } from '../../../../server/adapters/imap-smtp/locators.js';
import type {
  MailProviderContext,
  MailProviderAccount,
} from '../../../../server/contracts/provider.js';

const endpoint = { host: 'imap.example.com', port: 993, secure: true };
const credential = { username: 'test@example.com', password: 'test-password' };

function fixture() {
  const clients: ReturnType<typeof makeClient>[] = [];
  const create = vi.fn(() => {
    const client = makeClient();
    clients.push(client);
    return client as unknown as ImapFlow;
  });
  const pool = new ImapConnectionPool(create);
  return { clients, create, pool };
}

function makeClient() {
  return {
    usable: true,
    connect: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    close: vi.fn(),
    mailbox: { path: 'INBOX', uidValidity: 1n },
    getMailboxLock: vi.fn(async () => ({ release: vi.fn() })),
    fetchOne: vi.fn(async () => ({
      uid: 1,
      bodyStructure: {
        type: 'application/pdf',
        part: '1',
        disposition: 'attachment',
        dispositionParameters: { filename: 'test.pdf' },
        size: 4,
      },
    })),
    download: vi.fn(async () => ({
      meta: { filename: 'test.pdf', contentType: 'application/pdf' },
      content: Readable.from([Buffer.from('test')]),
    })),
  };
}

afterEach(() => vi.useRealTimers());

describe('exclusive IMAP idle connections', () => {
  it('reuses a returned connection and expires it after 60 idle seconds', async () => {
    vi.useFakeTimers();
    const { pool, create, clients } = fixture();
    const first = await pool.acquire('one', endpoint, credential);
    await pool.release(first);
    await vi.advanceTimersByTimeAsync(59_000);
    expect(clients[0].logout).not.toHaveBeenCalled();
    expect(await pool.acquire('one', endpoint, credential)).toBe(first);
    await pool.release(first);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(clients[0].logout).toHaveBeenCalledOnce();
    expect(await pool.acquire('one', endpoint, credential)).not.toBe(first);
    expect(create).toHaveBeenCalledTimes(2);
    await pool.closeAll();
  });

  it('keeps concurrent borrowers separate and retains only one idle connection', async () => {
    const { pool, clients } = fixture();
    const [first, second] = await Promise.all([
      pool.acquire('one', endpoint, credential),
      pool.acquire('one', endpoint, credential),
    ]);
    expect(first).not.toBe(second);
    await pool.release(first);
    await pool.release(second);
    expect(clients[1].logout).toHaveBeenCalledOnce();
    expect(await pool.acquire('one', endpoint, credential)).toBe(first);
    await pool.closeAll();
    expect(clients[0].logout).toHaveBeenCalledOnce();
  });

  it.each([
    'account',
    'password',
    'username',
    'host',
    'port',
    'secure',
    'tls',
  ] as const)('isolates changes to %s', async (field) => {
    const { pool } = fixture();
    const first = await pool.acquire('one', endpoint, credential);
    await pool.release(first);
    const second = await pool.acquire(
      field === 'account' ? 'two' : 'one',
      {
        ...endpoint,
        ...(field === 'host' ? { host: 'other.example.com' } : {}),
        ...(field === 'port' ? { port: 143 } : {}),
        ...(field === 'secure' ? { secure: false } : {}),
        ...(field === 'tls' ? { rejectUnauthorized: false } : {}),
      },
      {
        ...credential,
        ...(field === 'password' ? { password: 'changed' } : {}),
        ...(field === 'username' ? { username: 'changed@example.com' } : {}),
      },
    );
    expect(second).not.toBe(first);
    await pool.closeAll();
  });

  it('discards disconnected and failed connections and closes active borrowers on shutdown', async () => {
    const { pool, clients } = fixture();
    const first = await pool.acquire('one', endpoint, credential);
    await pool.release(first);
    clients[0].usable = false;
    const second = await pool.acquire('one', endpoint, credential);
    expect(clients[0].close).toHaveBeenCalledOnce();
    pool.destroy(second);
    await pool.release(second);
    const third = await pool.acquire('one', endpoint, credential);
    await pool.closeAll();
    await pool.release(third);
    await pool.closeAll();
    expect(clients[1].close).toHaveBeenCalledOnce();
    expect(clients[2].logout).toHaveBeenCalledOnce();
    await expect(pool.acquire('one', endpoint, credential)).rejects.toThrow(
      'closed',
    );
  });

  it('destroys a failed handshake and falls back to close if logout fails', async () => {
    const client = makeClient();
    client.connect.mockRejectedValueOnce(new Error('Handshake failed'));
    const pool = new ImapConnectionPool(() => client as unknown as ImapFlow);
    await expect(pool.acquire('one', endpoint, credential)).rejects.toThrow(
      'Handshake failed',
    );
    expect(client.close).toHaveBeenCalledOnce();
    const connected = await pool.acquire('one', endpoint, credential);
    client.logout.mockRejectedValueOnce(new Error('Disconnected'));
    await pool.release(connected);
    await pool.closeAll();
    expect(client.close).toHaveBeenCalledTimes(2);
  });

  it('reuses sequential attachment downloads and isolates overlapping downloads', async () => {
    const { pool, create, clients } = fixture();
    const context = {} as MailProviderContext;
    const account = {
      id: 'one',
      provider: { type: 'imap-smtp', name: 'test' },
    } as MailProviderAccount;
    const protocol = {
      imap: create,
      smtp: () => ({ close: vi.fn() }) as unknown as Transporter,
      expungeUid: vi.fn(),
    };
    const adapter = () =>
      new ImapSmtpAdapter(
        context,
        { type: 'imap-smtp', name: 'test', imap: endpoint, smtp: endpoint },
        account,
        credential,
        undefined,
        undefined,
        protocol,
        undefined,
        pool,
      );
    const locator = encodeAttachmentLocator({
      folder: 'INBOX',
      uidValidity: '1',
      uid: 1,
      attachment: 0,
    });
    const download = async (reader: ImapSmtpAdapter) => {
      const result = await reader.getAttachment('message', locator);
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    };
    for (let index = 0; index < 2; index += 1) {
      const reader = adapter();
      const result = await download(reader);
      expect(await new Response(result.stream).text()).toBe('test');
      await reader.close();
    }
    expect(create).toHaveBeenCalledOnce();
    const readers = [adapter(), adapter()];
    const results = await Promise.all(readers.map(download));
    expect(create).toHaveBeenCalledTimes(2);
    for (const result of results)
      expect(await new Response(result.stream).text()).toBe('test');
    await Promise.all(readers.map((reader) => reader.close()));

    clients[0].fetchOne.mockRejectedValueOnce(new Error('FETCH failed'));
    const failed = adapter();
    expect(await failed.getAttachment('message', locator)).toMatchObject({
      ok: false,
    });
    await failed.close();
    expect(clients[0].close).toHaveBeenCalledOnce();
    const fresh = adapter();
    expect(await new Response((await download(fresh)).stream).text()).toBe(
      'test',
    );
    expect(create).toHaveBeenCalledTimes(3);
    await fresh.close();
    await pool.closeAll();
  });
});
