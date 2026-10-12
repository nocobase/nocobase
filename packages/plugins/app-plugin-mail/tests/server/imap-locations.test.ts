import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { type DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** An in-memory IMAP server: folders, UIDs, flags and raw messages. */
const server = vi.hoisted(() => {
  interface FakeMessage {
    raw: Buffer;
    flags: Set<string>;
    emailId?: string;
    date: Date;
    structure?: Record<string, unknown>;
  }
  interface FakeFolder {
    uidValidity: bigint;
    uidNext: number;
    messages: Map<number, FakeMessage>;
  }
  return {
    folders: new Map<string, FakeFolder>(),
    capabilities: new Set<string>(),
    sourceReads: [] as string[],
    failFlags: new Set<string>(),
    logouts: 0,
    reset(): void {
      this.folders.clear();
      this.capabilities.clear();
      this.sourceReads.length = 0;
      this.failFlags.clear();
      this.logouts = 0;
    },
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
      verify: vi.fn(),
      close: vi.fn(),
    })),
  },
}));

vi.mock('imapflow', () => {
  type Folder = ReturnType<typeof server.folders.get> & object;
  const split = (raw: Buffer): { header: Buffer; body: Buffer } => {
    const end = raw.indexOf('\r\n\r\n');
    return {
      header: raw.subarray(0, end + 4),
      body: raw.subarray(end + 4),
    };
  };
  const messageIdOf = (raw: Buffer): string | undefined =>
    /^Message-ID: (.+)$/im.exec(split(raw).header.toString())?.[1]?.trim();
  const uidsOf = (range: unknown, folder: Folder): number[] => {
    const all = [...folder.messages.keys()].sort((a, b) => a - b);
    if (Array.isArray(range)) return all.filter((uid) => range.includes(uid));
    const parts = String(range)
      .split(',')
      .map((part) => part.split(':').map((value) => Number(value)));
    return all.filter((uid) =>
      parts.some(([start, end = start]) => uid >= start && uid <= end),
    );
  };
  class ImapFlow {
    public capabilities = server.capabilities;
    public mailbox: { path: string } | false = false;
    public on(): void {}
    public async connect(): Promise<void> {}
    public async logout(): Promise<void> {
      server.logouts += 1;
    }
    public close(): void {}
    public async list(): Promise<unknown[]> {
      return [...server.folders].map(([path, folder]) => ({
        path,
        name: path,
        flags: new Set<string>(),
        specialUse: path === 'INBOX' ? '\\Inbox' : undefined,
        status: {
          messages: folder.messages.size,
          unseen: 0,
          uidNext: folder.uidNext,
          uidValidity: folder.uidValidity,
        },
      }));
    }
    public async mailboxOpen(path: string): Promise<unknown> {
      const folder = server.folders.get(path);
      if (!folder)
        throw Object.assign(new Error('Mailbox does not exist'), {
          code: 'NONEXISTENT',
        });
      this.mailbox = { path };
      return {
        path,
        uidValidity: folder.uidValidity,
        uidNext: folder.uidNext,
        exists: folder.messages.size,
      };
    }
    private selected(): Folder {
      const folder = this.mailbox && server.folders.get(this.mailbox.path);
      if (!folder) throw new Error('No mailbox is selected.');
      return folder;
    }
    public async search(query: { uid?: string }): Promise<number[]> {
      const folder = this.selected();
      return query.uid
        ? uidsOf(query.uid, folder)
        : [...folder.messages.keys()].sort((a, b) => a - b);
    }
    private metadata(uid: number, folder: Folder): Record<string, unknown> {
      const message = folder.messages.get(uid)!;
      const { header, body } = split(message.raw);
      return {
        uid,
        size: message.raw.byteLength,
        flags: new Set(message.flags),
        internalDate: message.date,
        envelope: { messageId: messageIdOf(message.raw), subject: 'Subject' },
        bodyStructure: message.structure ?? {
          type: 'text/plain',
          part: '1',
          parameters: { charset: 'utf-8' },
          size: body.byteLength,
        },
        headers: header,
        ...(message.emailId ? { emailId: message.emailId } : {}),
      };
    }
    public async *fetch(range: unknown): AsyncGenerator<unknown> {
      const folder = this.selected();
      for (const uid of uidsOf(range, folder)) yield this.metadata(uid, folder);
    }
    public async fetchOne(
      range: number | string,
      query: {
        source?: { start: number; maxLength: number };
        bodyParts?: { key: string; start?: number; maxLength?: number }[];
      },
    ): Promise<unknown> {
      const folder = this.selected();
      const uid = Number(range);
      const message = folder.messages.get(uid);
      if (!message) return false;
      if (query.source) {
        const { start, maxLength } = query.source;
        server.sourceReads.push(`${this.mailbox && this.mailbox.path}:${uid}`);
        return { uid, source: message.raw.subarray(start, start + maxLength) };
      }
      if (query.bodyParts) {
        const { header, body } = split(message.raw);
        return {
          ...this.metadata(uid, folder),
          bodyParts: new Map(
            query.bodyParts.map(({ key, start = 0, maxLength }) => {
              const value = key === 'HEADER' ? header : body;
              return [
                key.toLowerCase(),
                value.subarray(start, start + (maxLength ?? value.length)),
              ];
            }),
          ),
        };
      }
      return this.metadata(uid, folder);
    }
    private flag(range: string, flags: string[], add: boolean): boolean {
      const path = this.mailbox && this.mailbox.path;
      if (server.failFlags.has(String(path))) return false;
      const folder = this.selected();
      for (const uid of uidsOf(range, folder))
        for (const flag of flags)
          if (add) folder.messages.get(uid)!.flags.add(flag);
          else folder.messages.get(uid)!.flags.delete(flag);
      return true;
    }
    public async messageFlagsAdd(range: string, flags: string[]) {
      return this.flag(range, flags, true);
    }
    public async messageFlagsRemove(range: string, flags: string[]) {
      return this.flag(range, flags, false);
    }
    public async messageDelete(range: string): Promise<boolean> {
      const folder = this.selected();
      for (const uid of uidsOf(range, folder)) folder.messages.delete(uid);
      return true;
    }
    public async download(): Promise<unknown> {
      return {
        meta: { contentType: 'application/pdf', filename: 'file.pdf' },
        content: Readable.from([Buffer.from('attachment')]),
      };
    }
  }
  return { ImapFlow };
});

import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';
import { createDatabaseMailStore } from '../../server/store.js';
import { createImapLocationPersistence } from '../../server/store/sync.js';
import { DefaultMailService } from '../../server/service.js';
import { SyncMailboxOperation } from '../../server/operations/sync-mailbox.js';
import { createImapSmtpMailProviderDefinition } from '../../server/adapters/imap-smtp/definition.js';
import type { ImapSmtpMailProviderConfig } from '../../server/adapters/imap-smtp/config.js';
import type {
  MailAccount,
  MailProviderAdapter,
  MailStore,
} from '../../server/types.js';

const accountId = '10000000-0000-4000-8000-000000000001';
const owner = { actorId: 'owner' };
const config: ImapSmtpMailProviderConfig = {
  type: 'imap-smtp',
  name: 'imap',
  imap: { host: 'imap.example.com', port: 993, secure: true },
  smtp: { host: 'smtp.example.com', port: 465, secure: true },
};
let database: DatabaseManager;
let store: MailStore;
let batchSize: number;

beforeEach(async () => {
  server.reset();
  batchSize = 100;
  database = await createMailTestDatabase();
  store = createDatabaseMailStore(database);
  await store.saveAccount({
    id: accountId,
    userId: 'owner',
    address: 'owner@example.com',
    status: 'active',
    provider: { type: 'imap-smtp', name: 'imap' },
    credentialReference: 'credential',
    scopes: [],
    initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
  });
});
afterEach(async () => {
  await destroyMailTestDatabase(database);
});

function folder(path: string, uidValidity = 1n): void {
  server.folders.set(path, { uidValidity, uidNext: 1, messages: new Map() });
}

function raw(messageId: string, body = 'Hello'): Buffer {
  return Buffer.from(
    `From: Alice <alice@example.com>\r\nTo: Owner <owner@example.com>\r\nSubject: Subject\r\nMessage-ID: ${messageId}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
  );
}

function deliver(
  path: string,
  message: {
    raw: Buffer;
    emailId?: string;
    flags?: string[];
    date?: string;
    structure?: Record<string, unknown>;
  },
): number {
  const target = server.folders.get(path)!;
  const uid = target.uidNext;
  target.uidNext += 1;
  target.messages.set(uid, {
    raw: message.raw,
    emailId: message.emailId,
    flags: new Set(message.flags ?? []),
    date: new Date(message.date ?? '2026-03-01T00:00:00.000Z'),
    structure: message.structure,
  });
  return uid;
}

const definition = createImapSmtpMailProviderDefinition((id) =>
  createImapLocationPersistence(database, id),
);
const adapters = {
  resolve: async (account: MailAccount): Promise<MailProviderAdapter> =>
    definition.createAdapter(
      {
        publicBasePath: '/test',
        credentials: {
          put: vi.fn(),
          get: async <T>() => ({ username: 'u', password: 'p' }) as T,
          replace: vi.fn(),
          getOrRefresh: vi.fn(),
          delete: vi.fn(),
        },
      },
      config,
      account,
    ),
};

function service(): DefaultMailService {
  return new DefaultMailService({
    store,
    adapters,
    outbox: { kick: vi.fn() },
    syncBatchSize: batchSize,
  });
}

async function step(): Promise<boolean> {
  const tasks = await store.claimOutbox(
    new Date().toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    100,
  );
  if (tasks.length === 0) return false;
  expect(tasks).toHaveLength(1);
  const task = tasks[0];
  if (task.type !== 'syncMailbox') throw new Error('Expected synchronization');
  await store.markOutboxPublished(
    task.id,
    task.leaseToken!,
    new Date().toISOString(),
  );
  await new SyncMailboxOperation({ store, adapters }).execute(task.payload);
  return true;
}

async function sync(): Promise<string> {
  const run = await service().startSync(owner, { accountId });
  for (let index = 0; index < 50 && (await step()); index += 1);
  expect(await store.getSyncRun(run.id)).toMatchObject({
    status: 'completed',
  });
  return run.id;
}

async function messages(): Promise<
  {
    id: string;
    providerMessageId: string;
    imapIdSource: string | null;
    imapOrphanRunId: string | null;
    read: boolean;
    starred: boolean;
    note: string | null;
    receivedAt: string;
    folders: string[];
    locations: { folder: string; uid: number; status: string; id: string }[];
  }[]
> {
  const rows = await database
    .query()
    .selectFrom('mailMessages')
    .selectAll()
    .where('accountId', '=', accountId)
    .orderBy('providerMessageId')
    .execute<Record<string, unknown>>();
  const result = [];
  for (const row of rows) {
    const folders = await database
      .query()
      .selectFrom('mailMessageFolders')
      .select('providerFolderId')
      .where('messageId', '=', row.id)
      .orderBy('providerFolderId')
      .execute<{ providerFolderId: string }>();
    const locations = await database
      .query()
      .selectFrom('mailMessageImapLocations')
      .selectAll()
      .where('messageId', '=', row.id)
      .orderBy('providerFolderId')
      .orderBy('uid')
      .execute<Record<string, unknown>>();
    result.push({
      id: row.id as string,
      providerMessageId: row.providerMessageId as string,
      imapIdSource: (row.imapIdSource as string | null) ?? null,
      imapOrphanRunId: (row.imapOrphanRunId as string | null) ?? null,
      read: Boolean(row.read),
      starred: Boolean(row.starred),
      note: (row.note as string | null) ?? null,
      receivedAt: new Date(String(row.receivedAt)).toISOString(),
      folders: folders.map((item) => item.providerFolderId),
      locations: locations.map((item) => ({
        id: item.id as string,
        folder: item.providerFolderId as string,
        uid: Number(item.uid),
        status: item.status as string,
      })),
    });
  }
  return result;
}

describe('IMAP message identity', () => {
  it('stores one business message per native object with every folder copy', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    folder('Archive');
    deliver('INBOX', {
      raw: raw('<one@example.com>'),
      emailId: 'M1',
      date: '2026-03-02T00:00:00.000Z',
    });
    deliver('INBOX', { raw: raw('<two@example.com>'), emailId: 'M2' });
    deliver('Archive', {
      raw: raw('<one@example.com>'),
      emailId: 'M1',
      flags: ['\\Seen', '\\Flagged'],
      date: '2026-03-01T00:00:00.000Z',
    });
    // One message per page: copies of M1 arrive on different pages.
    batchSize = 1;
    await sync();
    const [one, two] = await messages();
    expect(one).toMatchObject({
      providerMessageId: 'M1',
      imapIdSource: 'objectid',
      // Read only when every copy is; starred when any copy is.
      read: false,
      starred: true,
      receivedAt: '2026-03-01T00:00:00.000Z',
      folders: ['Archive', 'INBOX'],
      locations: [
        { folder: 'Archive', uid: 1, status: 'valid' },
        { folder: 'INBOX', uid: 1, status: 'valid' },
      ],
    });
    expect(two).toMatchObject({ providerMessageId: 'M2', folders: ['INBOX'] });

    // A later run keeps the local UUID and local data.
    await service().updateMessage(owner, {
      accountId,
      messageId: one.id,
      note: 'keep',
      todo: true,
    });
    await sync();
    expect((await messages())[0]).toMatchObject({ id: one.id, note: 'keep' });
  });

  it('keeps Gmail IDs as exact uint64 strings and ignores IDs without a native capability', async () => {
    server.capabilities.add('X-GM-EXT-1');
    folder('INBOX');
    deliver('INBOX', {
      raw: raw('<gmail@example.com>'),
      emailId: '18446744073709551615',
    });
    await sync();
    expect(await messages()).toMatchObject([
      { providerMessageId: '18446744073709551615', imapIdSource: 'x-gm-msgid' },
    ]);

    await destroyMailTestDatabase(database);
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    await store.saveAccount({
      id: accountId,
      userId: 'owner',
      address: 'owner@example.com',
      status: 'active',
      provider: { type: 'imap-smtp', name: 'imap' },
      credentialReference: 'credential',
      scopes: [],
      initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
    });
    server.capabilities.clear();
    // Without OBJECTID or X-GM-EXT-1 the ID is not the server's own identity.
    await sync();
    expect(await messages()).toMatchObject([
      {
        providerMessageId: '<gmail@example.com>',
        imapIdSource: 'rfc-message-id',
      },
    ]);
  });

  it('reuses an RFC Message-ID only for byte-identical copies without attachments', async () => {
    folder('INBOX');
    folder('Archive');
    folder('Sent');
    deliver('INBOX', { raw: raw('<same@example.com>') });
    deliver('Archive', { raw: raw('<same@example.com>') });
    // Same Message-ID, different bytes: never merged.
    deliver('Sent', { raw: raw('<same@example.com>', 'Different') });
    // An attachment cannot be proven without downloading it.
    deliver('Sent', {
      raw: raw('<file@example.com>'),
      structure: {
        type: 'multipart/mixed',
        childNodes: [
          { type: 'text/plain', part: '1', size: 5 },
          {
            type: 'application/pdf',
            part: '2',
            size: 9,
            disposition: 'attachment',
          },
        ],
      },
    });
    deliver('INBOX', { raw: raw('<file@example.com>') });
    await sync();
    const rows = await messages();
    const same = rows.find(
      (row) => row.providerMessageId === '<same@example.com>',
    );
    expect(same?.locations.map((item) => item.folder)).toEqual([
      'Archive',
      'INBOX',
    ]);
    const locators = rows.filter((row) => row.imapIdSource === 'locator');
    expect(locators.map((row) => row.folders)).toEqual(
      expect.arrayContaining([['Sent'], expect.any(Array)]),
    );
    expect(locators).toHaveLength(2);
    expect(rows).toHaveLength(4);
    expect(server.sourceReads.some((read) => read === 'Sent:2')).toBe(false);
  });

  it('proves an RFC Message-ID against a stored copy on a later page and stays within budgets', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    folder('Archive');
    // An invalid native ID falls back to the Message-ID, never to a synthetic ID.
    deliver('INBOX', { raw: raw('<same@example.com>'), emailId: 'bad id!' });
    deliver('Archive', { raw: raw('<same@example.com>'), emailId: 'bad id!' });
    const large = raw('<large@example.com>', 'x'.repeat(2 * 1024 * 1024));
    deliver('INBOX', { raw: large, emailId: 'bad id!' });
    deliver('Archive', { raw: large, emailId: 'bad id!' });
    batchSize = 1;
    await sync();
    const rows = await messages();
    expect(
      rows.find((row) => row.providerMessageId === '<same@example.com>'),
    ).toMatchObject({
      imapIdSource: 'rfc-message-id',
      folders: ['Archive', 'INBOX'],
    });
    // Over the 2 MiB proof limit: the second copy keeps its own location identity.
    expect(rows.filter((row) => row.imapIdSource === 'locator')).toHaveLength(
      1,
    );
    expect(server.sourceReads.filter((read) => read.endsWith(':2'))).toEqual(
      [],
    );
  });

  it('names a copy with a long locator by its persisted location', async () => {
    const path = `Folder/${'x'.repeat(400)}`;
    folder(path);
    deliver(path, { raw: raw('not-a-message-id') });
    await sync();
    const [message] = await messages();
    expect(message.providerMessageId).toBe(
      `imap-loc:${message.locations[0].id}`,
    );
    await sync();
    expect((await messages())[0].providerMessageId).toBe(
      message.providerMessageId,
    );
  });
});

describe('IMAP verification and orphans', () => {
  it('marks a missing copy, restores a moved one and deletes orphans only after two matching passes', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    folder('Archive');
    deliver('INBOX', { raw: raw('<one@example.com>'), emailId: 'M1' });
    deliver('INBOX', { raw: raw('<two@example.com>'), emailId: 'M2' });
    await sync();
    const before = await messages();
    // M1 moves to Archive; M2 is deleted elsewhere.
    server.folders.get('INBOX')!.messages.clear();
    deliver('Archive', { raw: raw('<one@example.com>'), emailId: 'M1' });

    const run = await service().startSync(owner, { accountId });
    const seen: { orphan: (string | null)[]; count: number }[] = [];
    while (await step()) {
      const rows = await messages();
      seen.push({
        orphan: rows.map((row) => row.imapOrphanRunId),
        count: rows.length,
      });
    }
    expect(await store.getSyncRun(run.id)).toMatchObject({
      status: 'completed',
    });
    // M2 stayed, marked as an orphan, until the final verified step.
    expect(seen.some((state) => state.orphan.includes(run.id))).toBe(true);
    expect(seen.at(-2)?.count).toBe(2);
    const after = await messages();
    expect(after).toMatchObject([
      {
        id: before[0].id,
        providerMessageId: 'M1',
        imapOrphanRunId: null,
        folders: ['Archive'],
        locations: [
          { folder: 'Archive', status: 'valid' },
          { folder: 'INBOX', status: 'invalid' },
        ],
      },
    ]);
  });

  it('postpones cleanup while the mailbox changes between verification passes', async () => {
    folder('INBOX');
    deliver('INBOX', { raw: raw('<one@example.com>') });
    deliver('INBOX', { raw: raw('<two@example.com>') });
    deliver('INBOX', { raw: raw('<three@example.com>') });
    await sync();
    server.folders.get('INBOX')!.messages.delete(1);
    const run = await service().startSync(owner, { accountId });
    // preparing, then the first verification pass
    await step();
    await step();
    server.folders.get('INBOX')!.messages.delete(2);
    // The second pass differs from the first: nothing is deleted yet.
    await step();
    expect(await messages()).toHaveLength(3);
    while (await step());
    expect(await store.getSyncRun(run.id)).toMatchObject({
      status: 'completed',
    });
    expect((await messages()).map((row) => row.providerMessageId)).toEqual([
      '<three@example.com>',
    ]);
  });

  it('keeps messages whose folder disappeared or whose generation changed', async () => {
    folder('INBOX');
    folder('Archive');
    deliver('INBOX', { raw: raw('not-an-id-1') });
    deliver('Archive', { raw: raw('not-an-id-2') });
    await sync();
    const before = await messages();
    for (const row of before)
      await service().updateMessage(owner, {
        accountId,
        messageId: row.id,
        note: 'local',
      });
    server.folders.delete('Archive');
    server.folders.get('INBOX')!.uidValidity = 2n;
    // The generation change restarts the run; nothing proves the old copies gone.
    const run = await service().startSync(owner, { accountId });
    for (let index = 0; index < 50 && (await step()); index += 1);
    expect(await store.getSyncRun(run.id)).toMatchObject({
      status: 'completed',
    });
    const after = await messages();
    for (const row of before)
      expect(after.find((item) => item.id === row.id)).toMatchObject({
        note: 'local',
        locations: [{ status: 'pending' }],
      });
    // The new generation's copy is a new location identity.
    expect(after).toHaveLength(3);
  });

  it('rolls back location evidence when the lease or revision is lost', async () => {
    folder('INBOX');
    const { id } = await service().startSync(owner, { accountId });
    const run = (await store.getSyncRun(id))!;
    const claimed = await store.claimSyncRun(
      run.id,
      run.revision,
      run.phase,
      'token',
      new Date(Date.now() + 60_000).toISOString(),
    );
    const persistence = createImapLocationPersistence(database, accountId);
    const evidence = {
      copies: [
        {
          locationId: randomUUID(),
          providerMessageId: 'M1',
          source: 'objectid' as const,
          folder: 'INBOX',
          uidValidity: '1',
          uid: 1,
          read: false,
          starred: false,
        },
      ],
      changes: [],
      cleanup: true,
    };
    const input = {
      messages: [
        {
          providerMessageId: 'M1',
          providerFolderIds: ['INBOX'],
          to: [],
          cc: [],
          bcc: [],
          replyTo: [],
          references: [],
          subject: 'Lost',
          read: false,
          starred: false,
          draft: false,
          attachments: [],
        },
      ],
      phase: 'preparing' as const,
      status: 'running' as const,
      createNextTask: true,
    };
    await expect(
      persistence.commitSyncStep(
        { ...input, run: { ...claimed!, revision: claimed!.revision + 1 } },
        evidence,
      ),
    ).rejects.toThrow('lease was lost');
    await database
      .query()
      .updateTable('mailSyncRuns')
      .set({ leaseExpiresAt: new Date(Date.now() - 1_000).toISOString() })
      .where('id', '=', run.id)
      .execute();
    await expect(
      persistence.commitSyncStep({ ...input, run: claimed! }, evidence),
    ).rejects.toThrow('lease was lost');
    expect(await messages()).toEqual([]);
    // Another account's persistence cannot commit this run.
    expect(() =>
      createImapLocationPersistence(database, randomUUID()).commitSyncStep(
        { ...input, run: claimed! },
        evidence,
      ),
    ).toThrow('another account');
  });
});

describe('IMAP operations on verified copies', () => {
  async function syncedCopies(): Promise<string> {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    folder('Archive');
    deliver('INBOX', { raw: raw('<one@example.com>'), emailId: 'M1' });
    deliver('Archive', { raw: raw('<one@example.com>'), emailId: 'M1' });
    await sync();
    return (await messages())[0].id;
  }

  it('changes flags on every copy and keeps confirmed copies when a later copy fails', async () => {
    const messageId = await syncedCopies();
    const updated = await service().updateMessage(owner, {
      accountId,
      messageId,
      read: true,
      note: 'done',
    });
    expect(updated).toMatchObject({ read: true, note: 'done' });
    for (const path of ['INBOX', 'Archive'])
      expect([...server.folders.get(path)!.messages.get(1)!.flags]).toContain(
        '\\Seen',
      );

    // INBOX is changed first and succeeds; Archive then fails.
    await database
      .query()
      .updateTable('mailMessageImapLocations')
      .set({ createdAt: new Date(Date.now() + 60_000).toISOString() })
      .where('providerFolderId', '=', 'Archive')
      .execute();
    server.failFlags.add('Archive');
    await expect(
      service().updateMessage(owner, {
        accountId,
        messageId,
        starred: true,
        note: 'not saved',
      }),
    ).rejects.toThrow();
    // The first copy was confirmed and committed; note waits for full success.
    expect((await messages())[0]).toMatchObject({
      starred: true,
      note: 'done',
    });
  });

  it('reads another copy when one is gone, without marking it read', async () => {
    await syncedCopies();
    server.folders.get('INBOX')!.messages.delete(1);
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      const result = await adapter.getMessage!('M1');
      expect(result).toMatchObject({
        ok: true,
        value: { providerMessageId: 'M1', providerFolderIds: ['Archive'] },
      });
      expect([
        ...server.folders.get('Archive')!.messages.get(1)!.flags,
      ]).toEqual([]);
      await expect(adapter.getMessage!('M404')).resolves.toMatchObject({
        ok: false,
        error: { code: 'IMAP_MESSAGE_NOT_FOUND' },
      });
    } finally {
      await adapter.close?.();
    }
  });

  it('requires UIDPLUS and removes the message only after its last copy is expunged', async () => {
    const messageId = await syncedCopies();
    await expect(
      service().deleteMessage(owner, {
        accountId,
        messageId,
        permanently: true,
      }),
    ).rejects.toThrow();
    expect(server.folders.get('INBOX')!.messages.size).toBe(1);
    expect(await messages()).toHaveLength(1);

    server.capabilities.add('UIDPLUS');
    await service().deleteMessage(owner, {
      accountId,
      messageId,
      permanently: true,
    });
    expect(server.folders.get('INBOX')!.messages.size).toBe(0);
    expect(server.folders.get('Archive')!.messages.size).toBe(0);
    expect(await messages()).toEqual([]);
  });

  it('downloads an attachment only from its own valid copy and closes on cancel', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', {
      raw: raw('<file@example.com>'),
      emailId: 'F1',
      structure: {
        type: 'multipart/mixed',
        childNodes: [
          { type: 'text/plain', part: '1', size: 5 },
          {
            type: 'application/pdf',
            part: '2',
            size: 10,
            disposition: 'attachment',
            dispositionParameters: { filename: 'file.pdf' },
          },
        ],
      },
    });
    await sync();
    const message = await store.getMessageForAccount(
      accountId,
      (await messages())[0].id,
    );
    const attachment = message!.attachments[0];
    const logouts = server.logouts;
    const content = await service().getAttachment(
      owner,
      accountId,
      message!.id,
      attachment.id!,
    );
    // The connection stays open while the stream is in use.
    expect(server.logouts).toBe(logouts);
    await content.stream.cancel();
    expect(server.logouts).toBe(logouts + 1);

    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      await expect(
        adapter.getAttachment!('other', attachment.providerAttachmentId),
      ).resolves.toMatchObject({
        ok: false,
        error: { code: 'IMAP_ATTACHMENT_NOT_FOUND' },
      });
    } finally {
      await adapter.close?.();
    }
  });
});
