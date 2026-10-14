import { ImapSmtpAdapter } from '../../server/adapters/imap-smtp/adapter.js';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
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
    locks: 0,
    expunges: [] as string[],
    transfers: [] as string[],
    mapping: 'valid' as
      | 'valid'
      | 'missing'
      | 'wrong-source'
      | 'wrong-generation'
      | 'invalid-generation'
      | 'deleted'
      | 'untagged'
      | 'conflict',
    failTransfer: false,
    loseResponse: false,
    onTransfer: undefined as (() => Promise<void> | void) | undefined,
    stores: [] as string[],
    onList: undefined as (() => void) | undefined,
    onFlag: undefined as (() => void) | undefined,
    onSearch: undefined as (() => number[] | false | undefined) | undefined,
    selectionModes: [] as boolean[],
    allowNetwork: true,
    reset(): void {
      this.folders.clear();
      this.capabilities.clear();
      this.sourceReads.length = 0;
      this.failFlags.clear();
      this.logouts = 0;
      this.locks = 0;
      this.expunges.length = 0;
      this.transfers.length = 0;
      this.mapping = 'valid';
      this.failTransfer = false;
      this.loseResponse = false;
      this.onTransfer = undefined;
      this.stores.length = 0;
      this.onList = undefined;
      this.onFlag = undefined;
      this.onSearch = undefined;
      this.selectionModes.length = 0;
      this.allowNetwork = true;
    },
  };
});

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => {
      if (!server.allowNetwork)
        throw new Error('Migration must not create SMTP transports');
      return {
        sendMail: vi.fn(),
        verify: vi.fn(),
        close: vi.fn(),
      };
    }),
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
    public mailbox: { path: string; uidValidity: bigint } | false = false;
    public async getMailboxLock(path: string, options: { readOnly?: boolean }) {
      await this.mailboxOpen(path, options);
      server.locks += 1;
      return {
        release: () => {
          server.locks -= 1;
        },
      };
    }
    public on(): void {}
    public async connect(): Promise<void> {
      if (!server.allowNetwork)
        throw new Error('Migration must not connect to IMAP');
    }
    public async logout(): Promise<void> {
      server.logouts += 1;
    }
    public close(): void {}
    public async list(): Promise<unknown[]> {
      server.onList?.();
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
    public async mailboxOpen(
      path: string,
      options?: { readOnly?: boolean },
    ): Promise<unknown> {
      const folder = server.folders.get(path);
      if (!folder)
        throw Object.assign(new Error('Mailbox does not exist'), {
          code: 'NONEXISTENT',
        });
      server.selectionModes.push(options?.readOnly === true);
      this.mailbox = { path, uidValidity: folder.uidValidity };
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
      const result = server.onSearch?.();
      if (result !== undefined) return result as number[];
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
        id: `synthetic-${uid}`,
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
        return {
          uid,
          source: message.raw.subarray(start, start + maxLength),
          partialOrigins: new Map([['', start]]),
        };
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
      server.stores.push(`${path}:${range}:${flags.join(',')}`);
      if (
        server.failFlags.has(String(path)) ||
        server.failFlags.has(`${path}:${flags[0]}`)
      )
        return false;
      const folder = this.selected();
      for (const uid of uidsOf(range, folder))
        for (const flag of flags)
          if (add) folder.messages.get(uid)!.flags.add(flag);
          else folder.messages.get(uid)!.flags.delete(flag);
      return true;
    }
    public async messageFlagsAdd(range: string, flags: string[]) {
      const result = this.flag(range, flags, true);
      server.onFlag?.();
      return result;
    }
    public async messageFlagsRemove(range: string, flags: string[]) {
      return this.flag(range, flags, false);
    }
    public readonly enabled = new Set<string>();
    public async exec(
      command: string,
      attributes: { value: string }[],
      options?: { untagged: { OK(response: unknown): Promise<void> } },
    ) {
      if (command === 'UID MOVE' || command === 'UID COPY') {
        const source = this.selected();
        const uid = Number(attributes[0].value);
        const destination = server.folders.get(attributes[1].value)!;
        server.transfers.push(
          `${command}:${this.mailbox && this.mailbox.path}:${uid}:${attributes[1].value}`,
        );
        if (server.failTransfer)
          throw Object.assign(new Error('COPY rejected'), {
            responseStatus: 'NO',
          });
        const original = source.messages.get(uid)!;
        const copied = destination.uidNext++;
        destination.messages.set(copied, {
          ...original,
          flags: new Set(original.flags),
        });
        if (server.mapping === 'deleted')
          destination.messages.get(copied)!.flags.add('\\Deleted');
        if (command === 'UID MOVE') source.messages.delete(uid);
        await server.onTransfer?.();
        if (server.loseResponse)
          throw new Error('Connection lost after transfer');
        const response = {
          attributes: [
            {
              section: [
                { value: 'COPYUID' },
                {
                  value:
                    server.mapping === 'invalid-generation'
                      ? '1:1'
                      : String(
                          server.mapping === 'wrong-generation'
                            ? destination.uidValidity + 1n
                            : destination.uidValidity,
                        ),
                },
                {
                  value: String(
                    server.mapping === 'wrong-source' ? uid + 1 : uid,
                  ),
                },
                { value: String(copied) },
              ],
            },
          ],
        };
        if (server.mapping === 'untagged' || server.mapping === 'conflict')
          await options?.untagged.OK(response);
        if (server.mapping === 'conflict')
          response.attributes[0].section[3].value = String(copied + 1);
        return {
          next() {},
          response:
            server.mapping === 'missing' || server.mapping === 'untagged'
              ? {}
              : response,
        };
      }
      if (command !== 'UID EXPUNGE')
        throw new Error('Global EXPUNGE is forbidden.');
      server.expunges.push(command);
      const folder = this.selected();
      for (const uid of uidsOf(attributes[0].value, folder))
        if (folder.messages.get(uid)!.flags.has('\\Deleted'))
          folder.messages.delete(uid);
      return { next() {} };
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

async function step(resolver: typeof adapters = adapters): Promise<boolean> {
  const tasks = await store.claimOutbox(
    new Date().toISOString(),
    'publisher',
    new Date(Date.now() + 30_000).toISOString(),
    1,
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
  await new SyncMailboxOperation({ store, adapters: resolver }).execute(
    task.payload,
  );
  return true;
}

async function sync(
  input: Pick<
    import('../../shared/mail.js').MailStartSyncInput,
    'mode' | 'receivedAfter'
  > = {},
  expectedStatus = 'completed',
): Promise<string> {
  const run = await service().startSync(owner, { accountId, ...input });
  for (let index = 0; index < 50 && (await step()); index += 1);
  expect((await store.getSyncRun(run.id))?.error).toBeUndefined();
  expect(await store.getSyncRun(run.id)).toMatchObject({
    status: expectedStatus,
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
    deliver('Sent', { raw: raw('<same@example.com>', 'Jello') });
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
    // Keep the MIME proof above 2 MiB without testing unrelated decoded-body column limits.
    const encoded =
      'Hello' + '=\r\n'.repeat(Math.floor((2 * 1024 * 1024 - 5) / 3));
    const large = Buffer.from(
      raw('<large@example.com>', encoded)
        .toString()
        .replace(
          '\r\n\r\n',
          '\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n',
        ),
    );
    expect(large.byteLength).toBeGreaterThan(2 * 1024 * 1024);
    const structure = {
      type: 'text/plain',
      part: '1',
      encoding: 'quoted-printable',
      size: Buffer.byteLength(encoded),
    };
    deliver('INBOX', { raw: large, emailId: 'bad id!', structure });
    deliver('Archive', { raw: large, emailId: 'bad id!', structure });
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

describe('IMAP review regressions', () => {
  it('rechecks an invalid orphan after cancellation when its folder disappears', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<old@example.com>'), emailId: 'OLD' });
    await sync();
    const original = (await messages())[0];
    server.folders.get('INBOX')!.messages.clear();
    const interrupted = await service().startSync(owner, { accountId });
    await step();
    await step();
    expect((await messages())[0]).toMatchObject({
      imapOrphanRunId: interrupted.id,
      locations: [{ status: 'invalid' }],
    });
    await store.cancelSyncRun(interrupted.id);
    server.folders.delete('INBOX');
    await sync();
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      locations: [{ status: 'pending' }],
    });
  });

  it('recovers the UUID of a native object after a new generation is fully rescanned', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<native@example.com>'), emailId: 'NATIVE' });
    await sync();
    const original = (await messages())[0];
    server.folders.get('INBOX')!.uidValidity = 2n;
    await sync();
    expect(await messages()).toHaveLength(1);
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      imapOrphanRunId: null,
    });
    expect(
      (await messages())[0].locations.map((location) => location.status).sort(),
    ).toEqual(['invalid', 'valid']);
  });

  it('rejects native identity contradictions and preserves the original record', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<native@example.com>'), emailId: 'OLD' });
    await sync();
    const before = await messages();
    server.folders.get('INBOX')!.messages.get(1)!.emailId = 'NEW';
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      expect(await adapter.listMessages!({ limit: 100 })).toMatchObject({
        ok: false,
        error: { code: 'IMAP_IDENTITY_CONFLICT' },
      });
    } finally {
      await adapter.close?.();
    }
    expect(await messages()).toEqual(before);
  });

  it('retains identity when a native field is temporarily absent', async () => {
    server.capabilities.add('OBJECTID');
    server.capabilities.add('X-GM-EXT-1');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<native@example.com>'), emailId: 'OBJECT' });
    await sync();
    const before = (await messages())[0];
    server.folders.get('INBOX')!.messages.get(1)!.emailId = undefined;
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      expect(await adapter.listMessages!({ limit: 100 })).toMatchObject({
        ok: true,
        value: { messages: [{ providerMessageId: 'OBJECT' }] },
      });
      expect(await adapter.getMessage!('OBJECT')).toMatchObject({
        ok: true,
        value: { providerMessageId: 'OBJECT', text: 'Hello' },
      });
    } finally {
      await adapter.close?.();
    }
    await sync();
    expect(
      await service().getMessage(owner, accountId, before.id),
    ).toMatchObject({ id: before.id, text: 'Hello' });
    await service().updateMessage(owner, {
      accountId,
      messageId: before.id,
      read: true,
    });
    expect((await messages())[0]).toMatchObject({
      read: true,
      id: before.id,
      imapIdSource: 'objectid',
    });
  });

  it('rejects a source collision instead of hiding it behind a locator', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<first@example.com>'), emailId: '1234' });
    await sync();
    server.capabilities.delete('OBJECTID');
    server.capabilities.add('X-GM-EXT-1');
    folder('Archive');
    deliver('Archive', { raw: raw('<second@example.com>'), emailId: '1234' });
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      expect(
        await adapter.listMessages!({
          providerFolderIds: ['Archive'],
          limit: 100,
        }),
      ).toMatchObject({ ok: false, error: { code: 'IMAP_IDENTITY_CONFLICT' } });
    } finally {
      await adapter.close?.();
    }
    expect(await messages()).toHaveLength(1);
  });

  it('rejects a delayed history result after an independently confirmed read operation', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<delayed@example.com>'), emailId: 'DELAYED' });
    await sync();
    const original = (await messages())[0];
    const pending = await service().startSync(owner, { accountId });
    const queued = (await store.getSyncRun(pending.id))!;
    const claimed = (await store.claimSyncRun(
      queued.id,
      queued.revision,
      queued.phase,
      'delayed',
      new Date(Date.now() + 60000).toISOString(),
    ))!;
    const base = await adapters.resolve((await store.getAccount(accountId))!);
    const adapter = (
      base as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
    ).forSync(claimed);
    await base.close?.();
    try {
      const page = await adapter.listMessages!({ limit: 100 });
      if (!page.ok) throw new Error(page.error.message);
      await service().updateMessage(owner, {
        accountId,
        messageId: original.id,
        read: true,
      });
      await expect(
        (
          adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
        ).commitSyncStep({
          run: claimed,
          messages: page.value.messages,
          historyPage: true,
          phase: claimed.phase,
          status: 'running',
          createNextTask: true,
        }),
      ).rejects.toThrow('copy changed');
      expect((await messages())[0]).toMatchObject({
        id: original.id,
        read: true,
      });
    } finally {
      await adapter.close?.();
    }
  });

  it('rejects stale mutation snapshots including same-millisecond ABA state changes', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<flags@example.com>'), emailId: 'FLAGS' });
    await sync();
    const persistence = createImapLocationPersistence(database, accountId);
    const [snapshot] = await persistence.listValidLocations('FLAGS');
    await persistence.commitFlags(snapshot, { read: true });
    const [newer] = await persistence.listValidLocations('FLAGS');
    expect(Date.parse(newer.updatedAt)).toBeGreaterThan(
      Date.parse(snapshot.updatedAt),
    );
    await persistence.commitFlags(newer, { read: false });
    await expect(
      persistence.commitFlags(snapshot, { starred: true }),
    ).rejects.toThrow('copy changed');
    expect((await messages())[0]).toMatchObject({
      read: false,
      starred: false,
    });
  });

  it('binds a mutation to its original UUID and refuses a replacement owner before STORE', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<target@example.com>'), emailId: 'TARGET' });
    await sync();
    const original = (await messages())[0];
    const base = await adapters.resolve((await store.getAccount(accountId))!);
    const bound = await (
      base as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
    ).forMessage(original.id, 'TARGET', 'flags');
    await base.close?.();
    const row = (await database
      .query()
      .selectFrom('mailMessages')
      .selectAll()
      .where('id', '=', original.id)
      .executeTakeFirst())!;
    await database
      .query()
      .deleteFrom('mailMessages')
      .where('id', '=', original.id)
      .execute();
    await database
      .query()
      .insertInto('mailMessages')
      .values({ ...row, id: randomUUID() })
      .execute();
    try {
      expect(await bound.setRead('TARGET', true)).toMatchObject({ ok: false });
      expect(
        server.folders.get('INBOX')!.messages.get(1)!.flags.has('\\Seen'),
      ).toBe(false);
    } finally {
      await bound.close();
    }
  });

  it('retains read results when starred fails within the same request', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<partial@example.com>'), emailId: 'PARTIAL' });
    await sync();
    const original = (await messages())[0];
    server.failFlags.add('INBOX:\\Flagged');
    await expect(
      service().updateMessage(owner, {
        accountId,
        messageId: original.id,
        read: true,
        starred: true,
        note: 'not committed',
      }),
    ).rejects.toThrow();
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      read: true,
      starred: false,
      note: null,
    });
  });
});

describe('IMAP bounded verification and protocol evidence', () => {
  it('revokes a second matching pass when LIST changes during traversal', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<moving@example.com>'), emailId: 'MOVING' });
    await sync();
    const original = (await messages())[0];
    server.folders.get('INBOX')!.messages.clear();
    let adapter = await adapters.resolve((await store.getAccount(accountId))!);
    const first = await adapter.listChanges!({
      cursor: await store.getSyncCursor(accountId),
      limit: 100,
    });
    if (!first.ok) throw new Error(first.error.message);
    expect(first.value.hasMore).toBe(true);
    await adapter.close?.();
    let lists = 0;
    server.onList = () => {
      if (++lists === 2) {
        folder('Archive');
        deliver('Archive', {
          raw: raw('<moving@example.com>'),
          emailId: 'MOVING',
        });
      }
    };
    adapter = await adapters.resolve((await store.getAccount(accountId))!);
    try {
      const second = await adapter.listChanges!({
        cursor: first.value.nextCursor,
        limit: 100,
      });
      expect(second).toMatchObject({ ok: true, value: { hasMore: true } });
      expect(lists).toBeGreaterThanOrEqual(2);
      expect((await messages())[0].id).toBe(original.id);
    } finally {
      server.onList = undefined;
      await adapter.close?.();
    }
  });

  it('restores an old-date unbound native copy below the saved high-water mark', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    folder('Archive');
    server.folders.get('Archive')!.uidNext = 10;
    deliver('INBOX', { raw: raw('<moving@example.com>'), emailId: 'MOVING' });
    await sync();
    const original = (await messages())[0];
    const copied = server.folders.get('INBOX')!.messages.get(1)!;
    server.folders
      .get('Archive')!
      .messages.set(2, { ...copied, date: new Date('2025-01-01T00:00:00Z') });
    server.folders.get('Archive')!.messages.set(3, {
      ...copied,
      emailId: 'UNRELATED-OLD',
      raw: raw('<unrelated-old@example.com>'),
      date: new Date('2025-01-01T00:00:00Z'),
    });
    server.folders.get('INBOX')!.messages.clear();
    const receivedAfter = '2026-01-01T00:00:00.000Z';
    const runId = await sync({ mode: 'incremental', receivedAfter });
    expect(await store.getSyncRun(runId)).toMatchObject({
      mode: 'incremental',
      policy: { receivedAfter },
    });
    expect(await messages()).toHaveLength(1);
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      folders: ['Archive'],
      imapOrphanRunId: null,
    });
  });

  it.each([2 * 1024 * 1024, 2 * 1024 * 1024 - 1])(
    'charges candidates, cache and terminal probes against the 8 MiB budget (%s bytes)',
    async (size) => {
      folder('INBOX');
      const headerBytes = raw('<budget@example.com>', '').length;
      const bytes = raw('<budget@example.com>', 'x'.repeat(size - headerBytes));
      for (let index = 0; index < 5; index += 1)
        deliver('INBOX', { raw: bytes });
      const adapter = await adapters.resolve(
        (await store.getAccount(accountId))!,
      );
      try {
        const result = await adapter.listMessages!({ limit: 100 });
        if (!result.ok) throw new Error(result.error.message);
        const merged = size === 2 * 1024 * 1024 ? 3 : 4;
        expect(
          result.value.messages.filter(
            (message) => message.providerMessageId === '<budget@example.com>',
          ),
        ).toHaveLength(merged);
        expect(server.sourceReads).toHaveLength(merged * 3);
      } finally {
        await adapter.close?.();
      }
    },
  );

  it.each([
    { type: 'multipart/mixed' },
    {
      type: 'multipart/alternative',
      disposition: 'attachment',
      childNodes: [{ type: 'text/plain' }],
    },
    {
      type: 'multipart/related',
      id: '<cid>',
      childNodes: [{ type: 'text/html' }],
    },
  ])(
    'does not download raw attachment or unknown structures to prove RFC identity',
    async (structure) => {
      folder('INBOX');
      for (let index = 0; index < 2; index += 1)
        deliver('INBOX', { raw: raw('<unknown@example.com>'), structure });
      const adapter = await adapters.resolve(
        (await store.getAccount(accountId))!,
      );
      try {
        const result = await adapter.listMessages!({ limit: 100 });
        if (!result.ok) throw new Error(result.error.message);
        expect(
          new Set(
            result.value.messages.map((message) => message.providerMessageId),
          ).size,
        ).toBe(2);
        expect(server.sourceReads).toEqual([]);
      } finally {
        await adapter.close?.();
      }
    },
  );

  it('fails explicitly on an over-budget header instead of trusting ENVELOPE', async () => {
    folder('INBOX');
    deliver('INBOX', { raw: raw(`<${'x'.repeat(65536)}@example.com>`) });
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      expect(await adapter.listMessages!({ limit: 100 })).toMatchObject({
        ok: false,
        error: { code: 'IMAP_HEADER_INCOMPLETE' },
      });
      expect(await messages()).toEqual([]);
    } finally {
      await adapter.close?.();
    }
  });
});

describe('IMAP production writes and draft protection', () => {
  it('protects a scheduled native draft during sync, orphan cleanup and bound mutations', async () => {
    server.capabilities.add('OBJECTID');
    server.capabilities.add('UIDPLUS');
    folder('Drafts');
    deliver('Drafts', {
      raw: raw('<scheduled@example.com>', 'scheduled body'),
      emailId: 'SCHEDULED',
      flags: ['\\Draft'],
    });
    await sync();
    const original = (await messages())[0];
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      const snapshot = await adapter.getMessage!('SCHEDULED');
      if (!snapshot.ok) throw new Error(snapshot.error.message);
      const submissionId = randomUUID();
      await store.createScheduledSubmission(
        {
          id: submissionId,
          accountId,
          status: 'pending',
          scheduledAt: '2099-01-01T00:00:00.000Z',
        },
        'scheduled-imap',
        'fingerprint',
        owner.actorId,
        {
          accountId,
          idempotencyKey: 'scheduled-imap',
          draftMessageId: original.id,
          to: [{ address: 'recipient@example.com' }],
          subject: 'Scheduled',
          text: 'scheduled body',
        },
        snapshot.value,
      );
      expect(
        await database
          .query()
          .selectFrom('mailMessages')
          .selectAll()
          .where('id', '=', original.id)
          .executeTakeFirst(),
      ).toMatchObject({
        scheduledSubmissionId: submissionId,
        imapIdSource: 'objectid',
        providerMessageId: 'SCHEDULED',
      });
      const remote = server.folders.get('Drafts')!.messages.get(1)!;
      remote.raw = raw('<scheduled@example.com>', 'remote replacement');
      remote.flags.add('\\Seen');
      await sync();
      expect(
        await store.getMessageForAccount(accountId, original.id),
      ).toMatchObject({ text: 'scheduled body', read: false });
      // Exercise the bound adapter itself, rather than only the service schedule guard.
      const flags = await (
        adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
      ).forMessage(original.id, 'SCHEDULED', 'flags');
      const deletion = await (
        adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
      ).forMessage(original.id, 'SCHEDULED', 'delete');
      try {
        expect(await flags.setRead('SCHEDULED', true)).toMatchObject({
          ok: false,
        });
        expect(await flags.setStarred('SCHEDULED', true)).toMatchObject({
          ok: false,
        });
        expect(await deletion.deleteMessage('SCHEDULED', true)).toMatchObject({
          ok: false,
        });
        expect(server.stores).toEqual([]);
        expect(server.expunges).toEqual([]);
      } finally {
        await flags.close();
        await deletion.close();
      }
      server.folders.get('Drafts')!.messages.clear();
      const cleanupRun = await sync();
      expect((await messages())[0]).toMatchObject({
        id: original.id,
        imapOrphanRunId: cleanupRun,
        locations: [{ status: 'invalid' }],
      });
      expect(
        await store.getMessageForAccount(accountId, original.id),
      ).toMatchObject({
        text: 'scheduled body',
        scheduledSend: { id: submissionId },
      });
    } finally {
      await adapter.close?.();
    }
  });

  it.each(['complete-first', 'complete-last'] as const)(
    'selects complete content from same-page native copies (%s)',
    async (order) => {
      server.capabilities.add('OBJECTID');
      folder('INBOX');
      const complete = {
        raw: raw('<content@example.com>', 'complete body'),
        emailId: 'CONTENT',
        structure: {
          type: 'multipart/mixed',
          childNodes: [
            { type: 'text/plain', part: '1', size: 13 },
            {
              type: 'application/pdf',
              part: '2',
              disposition: 'attachment',
              dispositionParameters: { filename: 'complete.pdf' },
              size: 10,
            },
          ],
        },
      };
      const incomplete = {
        raw: raw('<content@example.com>', 'incomplete body'),
        emailId: 'CONTENT',
        flags: ['\\Seen', '\\Flagged'],
        structure: { type: 'text/plain', part: '1', size: 20 * 1024 * 1024 },
      };
      for (const copy of order === 'complete-first'
        ? [complete, incomplete]
        : [incomplete, complete])
        deliver('INBOX', copy);
      const pages: import('../../server/contracts/provider.js').NormalizedMailMessage[][] =
        [];
      const persistence = createImapLocationPersistence(database, accountId);
      const commit = vi.spyOn(persistence, 'commitSyncStep');
      const pageAdapters = {
        resolve: async (account: MailAccount) =>
          createImapSmtpMailProviderDefinition(() => persistence).createAdapter(
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
      // Capture the real history input to prove both content variants share one commit.
      commit.mockImplementation(async (input, evidence) => {
        pages.push([...input.messages]);
        return createImapLocationPersistence(
          database,
          accountId,
        ).commitSyncStep(input, evidence);
      });
      const run = await service().startSync(owner, { accountId });
      for (let index = 0; index < 50; index += 1) {
        const current = (await store.getSyncRun(run.id))!;
        if (current.status === 'completed') break;
        expect(await step(pageAdapters)).toBe(true);
      }
      expect((await store.getSyncRun(run.id))?.status).toBe('completed');
      expect(
        pages.some(
          (page) =>
            page.length === 2 &&
            page.map((copy) => copy.contentStatus).join(',') ===
              (order === 'complete-first'
                ? 'complete,deferred'
                : 'deferred,complete'),
        ),
      ).toBe(true);
      const [saved] = await messages();
      expect(saved.locations).toHaveLength(2);
      expect(saved).toMatchObject({ read: false, starred: true });
      expect(
        await store.getMessageForAccount(accountId, saved.id),
      ).toMatchObject({
        text: 'complete body',
        contentStatus: 'complete',
        attachments: [{ fileName: 'complete.pdf' }],
      });
    },
  );

  it('retains complete content through a later incomplete page and detail retry', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', {
      raw: raw('<later@example.com>', 'complete body'),
      emailId: 'LATER',
      structure: {
        type: 'multipart/mixed',
        childNodes: [
          { type: 'text/plain', part: '1', size: 13 },
          {
            type: 'application/pdf',
            part: '2',
            disposition: 'attachment',
            dispositionParameters: { filename: 'complete.pdf' },
            size: 10,
          },
        ],
      },
    });
    await sync();
    const original = (await messages())[0];
    const before = (await store.getMessageForAccount(accountId, original.id))!;
    expect(before).toMatchObject({
      contentStatus: 'complete',
      text: 'complete body',
      attachments: [{ fileName: 'complete.pdf' }],
    });
    folder('Archive');
    deliver('Archive', {
      raw: raw('<later@example.com>', 'incomplete replacement'),
      emailId: 'LATER',
      flags: ['\\Seen', '\\Flagged'],
      structure: { type: 'text/plain', part: '1', size: 20 * 1024 * 1024 },
    });
    batchSize = 1;
    await sync();
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      read: false,
      starred: true,
      locations: [
        { folder: 'Archive', status: 'valid' },
        { folder: 'INBOX', status: 'valid' },
      ],
    });
    const after = (await store.getMessageForAccount(accountId, original.id))!;
    const newCopy = await database
      .query()
      .selectFrom('mailMessageImapLocations')
      .selectAll()
      .where('messageId', '=', original.id)
      .where('providerFolderId', '=', 'Archive')
      .executeTakeFirst();
    expect(Boolean(newCopy?.read)).toBe(true);
    expect(Boolean(newCopy?.starred)).toBe(true);
    expect(after.text).toBe(before.text);
    expect(after.attachments).toEqual(before.attachments);
    expect(after.contentStatus).toBe('complete');
    // Make either selected copy incomplete for the real detail FETCH path.
    server.folders.get('INBOX')!.messages.get(1)!.structure = {
      type: 'text/plain',
      part: '1',
      size: 20 * 1024 * 1024,
    };
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      const detail = await adapter.getMessage!('LATER');
      if (!detail.ok) throw new Error(detail.error.message);
      expect(detail.value).toMatchObject({
        contentStatus: 'deferred',
        attachments: [],
      });
      const saved = await store.saveMessageContent(
        accountId,
        original.id,
        detail.value,
      );
      expect(saved).toMatchObject({
        id: original.id,
        text: before.text,
        contentStatus: 'complete',
        read: false,
        starred: true,
      });
      expect(saved.attachments).toEqual(before.attachments);
      expect((await messages())[0].locations).toHaveLength(2);
    } finally {
      await adapter.close?.();
    }
  });

  it('preserves localized draft UUID, authored content and remote identity source', async () => {
    server.capabilities.add('OBJECTID');
    folder('Drafts');
    deliver('Drafts', {
      raw: raw('<draft@example.com>'),
      emailId: 'DRAFT',
      flags: ['\\Draft'],
    });
    await sync();
    const original = (await messages())[0];
    await store.localizeDraft(accountId, original.id);
    await database
      .query()
      .updateTable('mailMessages')
      .set({ text: 'locally authored', attachments: '[]' })
      .where('id', '=', original.id)
      .execute();
    // A new remote copy must remain a mirror, rather than a competing business draft.
    deliver('Drafts', {
      raw: raw('<draft@example.com>', 'remote body'),
      emailId: 'DRAFT',
      flags: ['\\Draft'],
    });
    await sync();
    const rows = await database
      .query()
      .selectFrom('mailMessages')
      .selectAll()
      .where('accountId', '=', accountId)
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: original.id,
      text: 'locally authored',
      imapIdSource: null,
      providerDraftMessageId: 'DRAFT',
      providerDraftMessageIdSource: 'objectid',
    });
  });

  it('rejects illegal location values at the actual sync transaction entry point', async () => {
    const queued = await service().startSync(owner, { accountId });
    const run = (await store.getSyncRun(queued.id))!;
    const claimed = (await store.claimSyncRun(
      run.id,
      run.revision,
      run.phase,
      'validation',
      new Date(Date.now() + 60000).toISOString(),
    ))!;
    const persistence = createImapLocationPersistence(database, accountId);
    const copy = {
      locationId: randomUUID(),
      folder: 'INBOX',
      uidValidity: '1',
      uid: 1,
      providerMessageId: 'VALID',
      source: 'objectid' as const,
      read: false,
      starred: false,
    };
    const input = {
      run: claimed,
      messages: [],
      phase: claimed.phase,
      status: 'running' as const,
      createNextTask: true,
    };
    for (const invalid of [
      { uid: 0 },
      { uid: 4294967296 },
      { uid: 1.5 },
      { uidValidity: '01' },
      { uidValidity: '0' },
      { uidValidity: '4294967296' },
      { source: 'unknown' },
      { providerMessageId: 'x'.repeat(256) },
      { source: 'x-gm-msgid', providerMessageId: '18446744073709551616' },
      { read: 'true' },
      { receivedAt: 'invalid' },
    ]) {
      await expect(
        persistence.commitSyncStep(input, {
          copies: [{ ...copy, ...invalid } as typeof copy],
          changes: [],
          cleanup: false,
        }),
      ).rejects.toThrow('Invalid IMAP');
    }
    expect(await messages()).toEqual([]);
    expect((await store.getSyncRun(run.id))?.revision).toBe(claimed.revision);
  });

  it('rolls back orphan deletion when the lease expires while waiting for the account lock', async () => {
    const guard = await import('../../server/store/account-guard.js');
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<fence@example.com>'), emailId: 'FENCE' });
    await sync();
    const original = (await messages())[0];
    const checkpoint = await store.getSyncCursor(accountId);
    const queued = await service().startSync(owner, { accountId });
    const run = (await store.getSyncRun(queued.id))!;
    const expires = Date.now() + 60000;
    const claimed = (await store.claimSyncRun(
      run.id,
      run.revision,
      run.phase,
      'fence',
      new Date(expires).toISOString(),
    ))!;
    await database
      .query()
      .updateTable('mailMessages')
      .set({ imapOrphanRunId: run.id })
      .where('id', '=', original.id)
      .execute();
    await database
      .query()
      .updateTable('mailMessageImapLocations')
      .set({ status: 'invalid' })
      .where('messageId', '=', original.id)
      .execute();
    const actualLock = guard.lockWritableAccount;
    vi.useFakeTimers({ toFake: ['Date'] });
    const lock = vi
      .spyOn(guard, 'lockWritableAccount')
      .mockImplementation(async (query, id) => {
        await actualLock(query, id);
        vi.setSystemTime(expires + 1);
      });
    try {
      await expect(
        createImapLocationPersistence(database, accountId).commitSyncStep(
          {
            run: claimed,
            messages: [],
            phase: 'completed',
            status: 'completed',
            createNextTask: false,
          },
          { copies: [], changes: [], cleanup: true },
        ),
      ).rejects.toThrow('lease was lost');
      expect((await messages())[0].id).toBe(original.id);
      expect(await store.getSyncCursor(accountId)).toEqual(checkpoint);
      expect((await store.getSyncRun(run.id))?.revision).toBe(claimed.revision);
    } finally {
      lock.mockRestore();
      vi.useRealTimers();
    }
  });

  it('boots upgraded legacy data and preserves locator UUIDs through details, attachments, flags, sync and scheduled cleanup', async () => {
    await destroyMailTestDatabase(database);
    database = await createMailTestDatabase({ migrate: false });
    const migrator = database.createMigrator({
      sources: [
        {
          directory: resolve(import.meta.dirname, '../../database/migrations'),
          packageName: '@nocobase/app-plugin-mail',
        },
      ],
    });
    await migrator.upTo('202610090001_mail_create_message_participants');
    const query = database.query();
    const now = '2026-10-12T00:00:00.000Z';
    await query
      .insertInto('mailAccounts')
      .values({
        id: accountId,
        userId: owner.actorId,
        providerType: 'imap-smtp',
        providerName: 'imap',
        address: 'owner@example.com',
        authorizationSubject: owner.actorId,
        credentialReference: 'credential',
        initialSyncReceivedAfter: '2026-01-01T00:00:00.000Z',
        scopes: [],
        status: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const legacy = (folder: string) =>
      `imap:${Buffer.from(JSON.stringify({ folder, uidValidity: '1', uid: 1 })).toString('base64url')}`;
    const identity = legacy('INBOX');
    const draftIdentity = legacy('Drafts');
    const ordinary = randomUUID();
    const scheduled = randomUUID();
    const submission = randomUUID();
    const oldAttachment = `imap-attachment:${Buffer.from(JSON.stringify({ folder: 'INBOX', uidValidity: '1', uid: 1, attachment: 0 })).toString('base64url')}`;
    const base = {
      accountId,
      recipients: { to: [], cc: [], bcc: [] },
      replyTo: [],
      references: [],
      subject: 'Subject',
      text: 'Hello',
      contentStatus: 'complete',
      attachments: [],
      draft: false,
      todo: false,
      receivedAt: now,
      sortAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await query
      .insertInto('mailMessages')
      .values([
        {
          ...base,
          id: ordinary,
          providerMessageId: identity,
          note: 'Keep note',
          todo: true,
          attachments: [
            {
              id: 'legacy-file',
              providerAttachmentId: oldAttachment,
              fileName: 'file.pdf',
              contentType: 'application/pdf',
              size: 10,
              inline: false,
            },
          ],
        },
        {
          ...base,
          id: scheduled,
          providerMessageId: 'local-draft:scheduled-legacy',
          providerDraftMessageId: draftIdentity,
          draft: true,
          text: 'Locally authored schedule',
          scheduledSubmissionId: submission,
        },
      ])
      .execute();
    await query
      .insertInto('mailSubmissions')
      .values({
        id: submission,
        accountId,
        idempotencyKey: 'legacy-schedule',
        requestFingerprint: 'fingerprint',
        status: 'pending',
        scheduledAt: '2099-01-01T00:00:00.000Z',
        requestedBy: owner.actorId,
        composeInput: {
          accountId,
          idempotencyKey: 'legacy-schedule',
          draftMessageId: scheduled,
          to: [{ address: 'recipient@example.com' }],
          subject: 'Subject',
          text: 'Locally authored schedule',
          deliverySnapshot: {
            text: 'Retain delivery snapshot',
            attachments: [],
          },
        },
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const before = await query
      .selectFrom('mailMessages')
      .selectAll()
      .orderBy('id')
      .execute();
    const submissionBefore = await query
      .selectFrom('mailSubmissions')
      .selectAll()
      .execute();
    server.allowNetwork = false;
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('Migration must not fetch');
    });
    try {
      await migrator.latest();
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      server.allowNetwork = true;
      fetch.mockRestore();
    }
    const after = await query
      .selectFrom('mailMessages')
      .selectAll()
      .orderBy('id')
      .execute();
    expect(
      after.map(
        ({
          imapIdSource: _source,
          providerDraftMessageIdSource: _draft,
          imapOrphanRunId: _orphan,
          ...row
        }) => row,
      ),
    ).toEqual(before);
    store = createDatabaseMailStore(database);
    expect(
      await query.selectFrom('mailSubmissions').selectAll().execute(),
    ).toEqual(submissionBefore);
    expect(await store.getMessageForAccount(accountId, ordinary)).toMatchObject(
      { id: ordinary, text: 'Hello', note: 'Keep note', todo: true },
    );
    const { ServiceContainer } = await import('@nocobase/service-provider');
    const { createAppPaths } = await import('@nocobase/app-server/config');
    const { Hono } = await import('hono');
    const { databaseManagerToken } = await import('@nocobase/db');
    const tokens = await import('../../server/tokens.js');
    const { default: plugin } = await import('../../server/plugin.js');
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    container.instance(tokens.mailCredentialVaultToken, {
      put: vi.fn(),
      get: async <T>() => ({ username: 'u', password: 'p' }) as T,
      replace: vi.fn(),
      getOrRefresh: vi.fn(),
      delete: vi.fn(),
    });
    const app = {
      appName: 'test',
      publicBasePath: '/test',
      config: {
        app: { name: 'test', publicBasePath: '/test' },
        get: () => ({ providers: { imap: config } }),
      },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    };
    const providers = plugin.serviceProviders.map(
      (Provider) => new Provider(app),
    );
    server.capabilities.add('OBJECTID');
    server.capabilities.add('UIDPLUS');
    folder('INBOX');
    folder('Drafts');
    deliver('INBOX', {
      raw: raw('<legacy@example.com>'),
      emailId: 'NEW-NATIVE',
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
    deliver('Drafts', {
      raw: raw('<scheduled-legacy@example.com>', 'remote replacement'),
      emailId: 'DRAFT-NATIVE',
      flags: ['\\Draft'],
    });
    try {
      for (const provider of providers) await provider.register();
      for (const provider of providers) await provider.boot();
      const adapter = await container
        .resolve(tokens.mailProviderAdapterResolverToken)
        .resolve((await store.getAccount(accountId))!);
      try {
        expect(await adapter.getMessage!(identity)).toMatchObject({
          ok: true,
          value: { providerMessageId: identity, text: 'Hello' },
        });
        const content = await service().getAttachment(
          owner,
          accountId,
          ordinary,
          oldAttachment,
        );
        const reader = content.stream.getReader();
        const bytes: Uint8Array[] = [];
        for (;;) {
          const result = await reader.read();
          if (result.done) break;
          bytes.push(result.value);
        }
        expect(Buffer.concat(bytes).toString()).toBe('attachment');
        const bound = await (
          adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
        ).forMessage(ordinary, identity, 'flags');
        try {
          expect(await bound.setRead(identity, true)).toMatchObject({
            ok: true,
          });
          expect(await bound.setStarred(identity, true)).toMatchObject({
            ok: true,
          });
        } finally {
          await bound.close();
        }
        expect(
          await store.getMessageForAccount(accountId, ordinary),
        ).toMatchObject({
          read: true,
          starred: true,
          text: 'Hello',
          note: 'Keep note',
          todo: true,
        });
        await sync();
        expect(await messages()).toHaveLength(2);
        expect(
          await store.getMessageForAccount(accountId, ordinary),
        ).toMatchObject({
          text: 'Hello',
          note: 'Keep note',
          todo: true,
          attachments: [{ providerAttachmentId: oldAttachment }],
        });
        expect(
          (await messages()).find((row) => row.id === ordinary),
        ).toMatchObject({
          providerMessageId: identity,
          imapIdSource: 'locator',
        });
        expect(
          await store.getMessageForAccount(accountId, scheduled),
        ).toMatchObject({
          text: 'Locally authored schedule',
          scheduledSend: { id: submission },
        });
        const stores = [...server.stores];
        const flags = await (
          adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
        ).forMessage(scheduled, draftIdentity, 'flags');
        const deletion = await (
          adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
        ).forMessage(scheduled, draftIdentity, 'delete');
        try {
          expect(await flags.setRead(draftIdentity, true)).toMatchObject({
            ok: false,
          });
          expect(await flags.setStarred(draftIdentity, true)).toMatchObject({
            ok: false,
          });
          expect(
            await deletion.deleteMessage(draftIdentity, true),
          ).toMatchObject({ ok: false });
        } finally {
          await flags.close();
          await deletion.close();
        }
        expect(server.stores).toEqual(stores);
        expect(server.expunges).toEqual([]);
        server.folders.get('Drafts')!.messages.clear();
        await sync();
        expect(await messages()).toHaveLength(2);
        expect(
          (await messages()).find((row) => row.id === scheduled),
        ).toMatchObject({ locations: [{ status: 'invalid' }] });
        expect(
          await store.getMessageForAccount(accountId, scheduled),
        ).toMatchObject({
          id: scheduled,
          text: 'Locally authored schedule',
          scheduledSend: { id: submission },
        });
        expect(
          (await messages()).find((row) => row.id === ordinary)
            ?.providerMessageId,
        ).toBe(identity);
        expect(
          await query
            .selectFrom('mailMessages')
            .select('providerDraftMessageIdSource')
            .where('id', '=', scheduled)
            .executeTakeFirst(),
        ).toEqual({ providerDraftMessageIdSource: 'locator' });
      } finally {
        await adapter.close?.();
      }
    } finally {
      for (const provider of providers.toReversed()) await provider.shutdown();
    }
  });

  it('uses the production boot registry and resolver to commit a confirmed copy', async () => {
    const { ServiceContainer } = await import('@nocobase/service-provider');
    const { createAppPaths } = await import('@nocobase/app-server/config');
    const { Hono } = await import('hono');
    const { databaseManagerToken } = await import('@nocobase/db');
    const tokens = await import('../../server/tokens.js');
    const { default: plugin } = await import('../../server/plugin.js');
    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    container.instance(tokens.mailCredentialVaultToken, {
      put: vi.fn(),
      get: async <T>() => ({ username: 'u', password: 'p' }) as T,
      replace: vi.fn(),
      getOrRefresh: vi.fn(),
      delete: vi.fn(),
    });
    const app = {
      appName: 'test',
      publicBasePath: '/test',
      config: {
        app: { name: 'test', publicBasePath: '/test' },
        get: () => ({ providers: { imap: config } }),
      },
      paths: createAppPaths({ rootDir: '/missing' }),
      router: new Hono(),
      container,
    };
    const providers = plugin.serviceProviders.map(
      (Provider) => new Provider(app),
    );
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', {
      raw: raw('<production@example.com>'),
      emailId: 'PRODUCTION',
    });
    await sync();
    try {
      for (const provider of providers) await provider.register();
      for (const provider of providers) await provider.boot();
      const resolver = container.resolve(
        tokens.mailProviderAdapterResolverToken,
      );
      const adapter = await resolver.resolve(
        (await store.getAccount(accountId))!,
      );
      try {
        expect(
          (
            adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
          ).persistsLocations,
        ).toBe(true);
        expect(await adapter.setRead!('PRODUCTION', true)).toMatchObject({
          ok: false,
          error: { code: 'IMAP_OPERATION_MISMATCH' },
        });
        const target = (await messages())[0];
        const bound = await (
          adapter as import('../../server/adapters/imap-smtp/adapter.js').ImapSmtpAdapter
        ).forMessage(target.id, 'PRODUCTION', 'flags');
        try {
          expect(await bound.setRead('PRODUCTION', true)).toMatchObject({
            ok: true,
          });
          expect(await bound.deleteMessage('PRODUCTION', true)).toMatchObject({
            ok: false,
            error: { code: 'IMAP_OPERATION_MISMATCH' },
          });
          expect((await messages())[0].read).toBe(true);
        } finally {
          await bound.close();
        }
      } finally {
        await adapter.close?.();
      }
    } finally {
      for (const provider of providers.toReversed()) await provider.shutdown();
    }
  });
});

describe('IMAP final scope and mutation safety', () => {
  it('refreshes previously bound flags without rewriting content', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<flags@example.com>'), emailId: 'FLAGS' });
    await sync();
    const original = (await messages())[0];
    server.folders.get('INBOX')!.messages.get(1)!.flags.add('\\Seen');
    server.folders.get('INBOX')!.messages.get(1)!.flags.add('\\Flagged');
    await sync();
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      read: true,
      starred: true,
    });
    expect(
      (await store.getMessageForAccount(accountId, original.id))?.text,
    ).toBe('Hello');
  });
  it('never chooses global EXPUNGE if UIDPLUS disappears after STORE', async () => {
    server.capabilities.add('OBJECTID');
    server.capabilities.add('UIDPLUS');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<delete@example.com>'), emailId: 'DELETE' });
    await sync();
    const original = (await messages())[0];
    server.onFlag = () => server.capabilities.delete('UIDPLUS');
    await expect(
      service().deleteMessage(owner, {
        accountId,
        messageId: original.id,
        permanently: true,
      }),
    ).rejects.toThrow();
    expect(server.expunges).toEqual([]);
    expect((await messages())[0].id).toBe(original.id);
  });
  it('retains the message after a later deletion fails and keeps the confirmed copy invalid', async () => {
    server.capabilities.add('OBJECTID');
    server.capabilities.add('UIDPLUS');
    folder('INBOX');
    folder('Sent');
    for (const path of ['INBOX', 'Sent'])
      deliver(path, {
        raw: raw('<partial-delete@example.com>'),
        emailId: 'DELETE',
      });
    await sync();
    const original = (await messages())[0];
    const ordered = await createImapLocationPersistence(
      database,
      accountId,
    ).listValidLocations(original.providerMessageId);
    server.failFlags.add(ordered[1].folder);
    await expect(
      service().deleteMessage(owner, {
        accountId,
        messageId: original.id,
        permanently: true,
      }),
    ).rejects.toThrow();
    const current = (await messages())[0];
    expect(current.id).toBe(original.id);
    expect(
      current.locations.find((copy) => copy.folder === ordered[0].folder)
        ?.status,
    ).toBe('invalid');
    expect(
      current.locations.find((copy) => copy.folder === ordered[1].folder)
        ?.status,
    ).toBe('valid');
  });
  it('does not authorize cleanup from an incomplete final SEARCH', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', { raw: raw('<search@example.com>'), emailId: 'SEARCH' });
    await sync();
    const original = (await messages())[0];
    server.folders.get('INBOX')!.messages.clear();
    let calls = 0;
    server.onSearch = () => (++calls === 2 ? false : undefined);
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      expect(
        await adapter.listChanges!({
          cursor: await store.getSyncCursor(accountId),
          limit: 100,
        }),
      ).toMatchObject({ ok: false });
      expect((await messages())[0].id).toBe(original.id);
    } finally {
      await adapter.close?.();
    }
  });
});

describe('IMAP verification exhaustion retains evidence', () => {
  it.each(['response', 'cursor', 'attempts'] as const)(
    'leaves the run partial without deletion when the %s budget is exhausted',
    async (budget) => {
      server.capabilities.add('OBJECTID');
      folder('INBOX');
      deliver('INBOX', {
        raw: raw('<retained@example.com>'),
        emailId: 'RETAINED',
      });
      await sync();
      const original = (await messages())[0];
      server.folders.get('INBOX')!.messages.clear();
      if (budget === 'response')
        server.onSearch = () => {
          throw Object.assign(new Error('Response too large'), {
            code: 'ResponseTooLarge',
          });
        };
      if (budget === 'cursor')
        server.onSearch = () =>
          Array.from({ length: 160000 }, (_, index) => 1000000 + index * 2);
      if (budget === 'attempts')
        server.onList = () => {
          server.folders.get('INBOX')!.uidNext += 1;
        };
      const run = await service().startSync(owner, { accountId });
      for (let index = 0; index < 30 && (await step()); index += 1);
      expect(await store.getSyncRun(run.id)).toMatchObject({
        status: 'partial',
      });
      expect((await messages())[0].id).toBe(original.id);
    },
  );
  it('preserves a complete long header at the exact header budget', async () => {
    folder('INBOX');
    const id = `<${'x'.repeat(1200)}@example.com>`;
    const base = raw(id).subarray(0, raw(id).indexOf('\r\n\r\n'));
    const prefix = Buffer.concat([base, Buffer.from('\r\nX-Padding: ')]);
    const bytes = Buffer.concat([
      prefix,
      Buffer.alloc(65536 - prefix.length - 4, 97),
      Buffer.from('\r\n\r\nHello'),
    ]);
    deliver('INBOX', { raw: bytes });
    const adapter = await adapters.resolve(
      (await store.getAccount(accountId))!,
    );
    try {
      const result = await adapter.listMessages!({ limit: 100 });
      expect(result).toMatchObject({
        ok: true,
        value: { messages: [{ internetMessageId: id }] },
      });
    } finally {
      await adapter.close?.();
    }
  });
});

describe('IMAP shared mutation boundary validation', () => {
  it('rejects illegal tuples for flags and delete effects before updating business data', async () => {
    server.capabilities.add('OBJECTID');
    folder('INBOX');
    deliver('INBOX', {
      raw: raw('<boundary@example.com>'),
      emailId: 'BOUNDARY',
    });
    await sync();
    const original = (await messages())[0];
    const persistence = createImapLocationPersistence(database, accountId);
    const [location] = await persistence.listValidLocations('BOUNDARY');
    for (const invalid of [
      { uid: 0 },
      { uid: 4294967296 },
      { uidValidity: '01' },
      { source: 'unknown' },
      { status: 'unknown' },
    ]) {
      const observed = { ...location, ...invalid } as typeof location;
      await expect(
        persistence.commitFlags(observed, { read: true }),
      ).rejects.toThrow('Invalid');
      await expect(persistence.commitDeleted(observed)).rejects.toThrow(
        'Invalid',
      );
    }
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      read: false,
    });
  });
});

describe('IMAP selected-copy move and durable protection', () => {
  async function prepare(native = false, copies = false, locator = false) {
    folder('INBOX');
    folder('Trash');
    folder('Sent');
    if (native) server.capabilities.add('MOVE');
    else server.capabilities.add('UIDPLUS');
    if (copies) server.capabilities.add('OBJECTID');
    deliver('INBOX', {
      raw: raw(locator ? 'not-a-message-id' : '<move@example.com>'),
      emailId: copies ? 'MOVE-OBJECT' : undefined,
    });
    if (copies)
      deliver('Sent', {
        raw: raw('<move@example.com>'),
        emailId: 'MOVE-OBJECT',
      });
    await sync();
    const message = (await messages())[0];
    await store.updateMessageState(accountId, message.id, {
      note: 'Keep my note',
      todo: true,
    });
    return message;
  }
  async function move(
    message: Awaited<ReturnType<typeof messages>>[number],
    sourceProviderFolderId?: string,
    destinationProviderFolderId = 'Trash',
  ) {
    const base = (await adapters.resolve(
      (await store.getAccount(accountId))!,
    )) as ImapSmtpAdapter;
    let bound: ImapSmtpAdapter | undefined;
    try {
      bound = await base.forMessage(
        message.id,
        message.providerMessageId,
        'move',
        { sourceProviderFolderId, destinationProviderFolderId },
      );
      return await bound.moveMessage(
        message.providerMessageId,
        destinationProviderFolderId,
      );
    } finally {
      await bound?.close();
      await base.close();
    }
  }
  it.each([false, true])(
    'moves one selected native-identity copy, preserving other copies and business UUID (MOVE=%s)',
    async (native) => {
      const original = await prepare(native, true);
      deliver('INBOX', {
        raw: raw('<external-deleted@example.com>'),
        flags: ['\\Deleted'],
      });
      let activeTransactions = 0;
      const executeTransaction = database.transaction.bind(database);
      const transactions = vi
        .spyOn(database, 'transaction')
        .mockImplementation(async (work, name) =>
          executeTransaction(async (connection) => {
            activeTransactions += 1;
            try {
              return await work(connection);
            } finally {
              activeTransactions -= 1;
            }
          }, name),
        );
      server.onTransfer = () => {
        expect(activeTransactions).toBe(0);
      };
      server.onFlag = () => {
        expect(activeTransactions).toBe(0);
      };
      const result = await move(original, 'INBOX');
      expect(transactions).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        ok: true,
        value: { providerMessageId: 'MOVE-OBJECT' },
      });
      expect((await messages())[0]).toMatchObject({
        id: original.id,
        note: 'Keep my note',
        folders: ['Sent', 'Trash'],
      });
      expect(server.folders.get('INBOX')!.messages.has(2)).toBe(true);
      expect(server.folders.get('Sent')!.messages.size).toBe(1);
      expect(server.transfers).toEqual([
        `${native ? 'UID MOVE' : 'UID COPY'}:INBOX:1:Trash`,
      ]);
      expect(server.expunges).toEqual(native ? [] : ['UID EXPUNGE']);
    },
  );
  it('changes a locator provider ID while keeping the UUID and subsequent flags usable', async () => {
    const original = await prepare(false, false, true);
    expect(await move(original)).toMatchObject({ ok: true });
    const moved = (await messages())[0];
    expect(moved.id).toBe(original.id);
    expect(moved.providerMessageId).not.toBe(original.providerMessageId);
    expect(moved.folders).toEqual(['Trash']);
    await service().updateMessage(owner, {
      accountId,
      messageId: moved.id,
      read: true,
    });
    expect(
      server.folders.get('Trash')!.messages.get(1)!.flags.has('\\Seen'),
    ).toBe(true);
    await sync({ mode: 'incremental' });
    expect((await messages()).map((message) => message.id)).toEqual([
      original.id,
    ]);
  });
  it('rejects ambiguous or incorrect sources before issuing any remote write', async () => {
    const original = await prepare(false, true);
    await expect(move(original)).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_SOURCE_REQUIRED',
    });
    await expect(move(original, 'Other')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_SOURCE_REQUIRED',
    });
    expect(server.transfers).toEqual([]);
  });
  it('rejects servers without a safe MOVE or UIDPLUS path', async () => {
    const original = await prepare();
    server.capabilities.clear();
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_UNSUPPORTED',
    });
    expect(server.transfers).toEqual([]);
    expect(server.stores).toEqual([]);
  });
  it('validates an existing source for a same-folder no-op', async () => {
    const original = await prepare();
    expect(await move(original, 'INBOX', 'INBOX')).toEqual({
      ok: true,
      value: { providerMessageId: original.providerMessageId },
    });
    expect(server.transfers).toEqual([]);
    expect((await messages())[0].locations[0].status).toBe('valid');
  });
  it.each([
    'missing',
    'wrong-source',
    'wrong-generation',
    'invalid-generation',
    'deleted',
    'conflict',
  ] as const)(
    'never clears a source when COPYUID/target evidence is %s',
    async (mapping) => {
      const original = await prepare();
      server.mapping = mapping;
      await expect(move(original, 'INBOX')).rejects.toMatchObject({
        reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
      });
      expect(server.stores).toEqual([]);
      expect(server.expunges).toEqual([]);
      expect(server.folders.get('INBOX')!.messages.size).toBe(1);
      expect((await messages())[0]).toMatchObject({
        id: original.id,
        note: 'Keep my note',
      });
      await expect(move(original, 'INBOX')).rejects.toMatchObject({
        reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
      });
      expect(server.transfers).toHaveLength(1);
    },
  );
  it('accepts the untagged COPYUID from native MOVE without UIDPLUS', async () => {
    const original = await prepare(true);
    server.mapping = 'untagged';
    expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
    expect(server.expunges).toEqual([]);
  });
  it('does not fallback or reissue native MOVE after response loss, even through synchronization', async () => {
    const original = await prepare(true, true);
    server.loseResponse = true;
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    server.loseResponse = false;
    await database.disconnect();
    await database.reconnect();
    await sync({ mode: 'incremental' }, 'partial');
    const retained = (await messages()).find(
      (message) => message.id === original.id,
    )!;
    expect(retained).toMatchObject({
      note: 'Keep my note',
      folders: ['INBOX', 'Sent'],
    });
    expect(
      retained.locations.find((location) => location.folder === 'INBOX')
        ?.status,
    ).toBe('pending');
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    expect(server.transfers).toHaveLength(1);
    expect(server.expunges).toEqual([]);
  });
  it.each(['after-copy', 'after-store'])(
    'does not globally expunge when UIDPLUS disappears %s and resumes one confirmed copy',
    async (phase) => {
      const original = await prepare();
      if (phase === 'after-copy')
        server.onTransfer = () => {
          server.capabilities.delete('UIDPLUS');
        };
      else
        server.onFlag = () => {
          server.capabilities.delete('UIDPLUS');
        };
      await expect(move(original, 'INBOX')).rejects.toMatchObject({
        reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
      });
      expect(server.expunges).toEqual([]);
      server.onTransfer = undefined;
      server.onFlag = undefined;
      server.capabilities.add('UIDPLUS');
      server.folders.get('Trash')!.messages.get(1)!.flags.add('\\Seen');
      server.folders.get('Trash')!.messages.get(1)!.flags.add('\\Flagged');
      expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
      expect((await messages())[0]).toMatchObject({
        read: true,
        starred: true,
      });
      expect(server.transfers).toHaveLength(1);
      expect(server.expunges).toEqual(['UID EXPUNGE']);
      expect((await messages())[0].id).toBe(original.id);
    },
  );
  it('preserves pending source and destination through sync and orphan cleanup before explicit recovery', async () => {
    const original = await prepare(false, true);
    server.failFlags.add('INBOX');
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    await sync({ mode: 'incremental' }, 'partial');
    const retained = (await messages()).find(
      (message) => message.id === original.id,
    )!;
    expect(
      retained.locations.filter((location) => location.status === 'pending'),
    ).toHaveLength(2);
    expect(retained.note).toBe('Keep my note');
    server.failFlags.clear();
    expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
    expect(server.transfers).toHaveLength(1);
  });
  it.each(['stale-generation', 'deleted-source'])(
    'rejects %s before copying and releases only its fresh protection',
    async (fault) => {
      const original = await prepare();
      if (fault === 'stale-generation')
        server.folders.get('INBOX')!.uidValidity += 1n;
      else server.folders.get('INBOX')!.messages.get(1)!.flags.add('\\Deleted');
      await expect(move(original, 'INBOX')).rejects.toThrow();
      expect(server.transfers).toEqual([]);
      expect(server.stores).toEqual([]);
      expect((await messages())[0].locations[0].status).toBe('valid');
    },
  );
  it('releases protection for a definite failed COPY and permits a later explicit attempt', async () => {
    const original = await prepare();
    server.failTransfer = true;
    await expect(move(original, 'INBOX')).resolves.toMatchObject({ ok: false });
    expect(server.stores).toEqual([]);
    expect(server.expunges).toEqual([]);
    expect((await messages())[0].locations[0].status).toBe('valid');
    server.failTransfer = false;
    expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
  });
  it('preserves body, local metadata and attachment bytes while issuing a new attachment API ID', async () => {
    folder('INBOX');
    folder('Trash');
    server.capabilities.add('UIDPLUS');
    deliver('INBOX', {
      raw: raw('not-a-message-id'),
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
    const original = (await messages())[0];
    await store.updateMessageState(accountId, original.id, {
      note: 'Protected note',
      todo: true,
    });
    const before = (await store.getMessageForAccount(accountId, original.id))!;
    expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
    const after = (await store.getMessageForAccount(accountId, original.id))!;
    expect(after).toMatchObject({
      id: original.id,
      note: 'Protected note',
      todo: true,
      text: before.text,
      html: before.html,
    });
    expect(after.attachments[0].id).not.toBe(before.attachments[0].id);
    expect(after.attachments[0]).toMatchObject({
      fileName: before.attachments[0].fileName,
      size: before.attachments[0].size,
    });
    const content = await service().getAttachment(
      owner,
      accountId,
      original.id,
      after.attachments[0].id!,
    );
    expect(await new Response(content.stream).text()).toBe('attachment');
  });
  it('uses imap-loc for long destination paths while retaining access to the new tuple', async () => {
    const original = await prepare(false, false, true);
    const path = 'Long/'.repeat(95);
    folder(path);
    await sync({ mode: 'incremental' });
    expect(await move(original, 'INBOX', path)).toMatchObject({ ok: true });
    const moved = (await messages())[0];
    expect(moved.providerMessageId).toMatch(/^imap-loc:/);
    expect(moved.id).toBe(original.id);
    await service().updateMessage(owner, {
      accountId,
      messageId: moved.id,
      starred: true,
    });
    expect(
      server.folders.get(path)!.messages.get(1)!.flags.has('\\Flagged'),
    ).toBe(true);
  });
  it('rejects scheduled targets at binding and destination ownership conflicts before source cleanup', async () => {
    const original = await prepare();
    await database
      .query()
      .updateTable('mailMessages')
      .set({ scheduledSubmissionId: 'pending-delivery' })
      .where('id', '=', original.id)
      .execute();
    await expect(move(original, 'INBOX')).rejects.toThrow(
      'Invalid IMAP move target',
    );
    expect(server.transfers).toEqual([]);
    await database
      .query()
      .updateTable('mailMessages')
      .set({ scheduledSubmissionId: null })
      .where('id', '=', original.id)
      .execute();
    const otherId = randomUUID();
    const other = await store.saveMessage(accountId, {
      providerMessageId: 'other-owner',
      providerFolderIds: [],
      to: [],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Other UUID',
      read: true,
      starred: false,
      draft: false,
      attachments: [],
    });
    await database
      .query()
      .insertInto('mailMessageImapLocations')
      .values({
        id: otherId,
        accountId,
        messageId: other.id,
        providerFolderId: 'Trash',
        uidValidity: '1',
        uid: 1,
        status: 'invalid',
        read: false,
        starred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute();
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    expect(server.stores).toEqual([]);
    expect(server.expunges).toEqual([]);
  });
  it('rejects stale binding and fences remote flags while a move is pending', async () => {
    const original = await prepare();
    const persistence = createImapLocationPersistence(database, accountId);
    const binding = await persistence.bindMessage(
      original.id,
      original.providerMessageId,
      'move',
      { sourceProviderFolderId: 'INBOX', destinationProviderFolderId: 'Trash' },
    );
    await database
      .query()
      .updateTable('mailMessageImapLocations')
      .set({ uid: 2 })
      .where('messageId', '=', original.id)
      .execute();
    await expect(binding.persistence.beginMove()).rejects.toThrow(
      'selected IMAP source changed',
    );
    await database
      .query()
      .updateTable('mailMessageImapLocations')
      .set({ uid: 1 })
      .where('messageId', '=', original.id)
      .execute();
    server.mapping = 'missing';
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    await expect(
      service().updateMessage(owner, {
        accountId,
        messageId: original.id,
        read: true,
      }),
    ).rejects.toMatchObject({ reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN' });
    expect(server.stores).toEqual([]);
  });
  it('reuses a concurrently recorded mapped destination only for the original UUID', async () => {
    const original = await prepare(false, true);
    const destinationId = randomUUID();
    await database
      .query()
      .insertInto('mailMessageImapLocations')
      .values({
        id: destinationId,
        accountId,
        messageId: original.id,
        providerFolderId: 'Trash',
        uidValidity: '1',
        uid: 1,
        status: 'valid',
        read: true,
        starred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute();
    expect(await move(original, 'INBOX')).toMatchObject({ ok: true });
    expect(
      (await messages())[0].locations.find(
        (location) => location.folder === 'Trash',
      ),
    ).toMatchObject({ id: destinationId, status: 'valid' });
  });
  it('fences scheduling and keeps bounded durable tokens while network cleanup is incomplete', async () => {
    const original = await prepare();
    server.failFlags.add('INBOX');
    await expect(move(original, 'INBOX')).rejects.toMatchObject({
      reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN',
    });
    const protectedRows = await database
      .query()
      .selectFrom('mailMessageImapLocations')
      .select('invalidationReason')
      .where('messageId', '=', original.id)
      .where('status', '=', 'pending')
      .execute<{ invalidationReason: string }>();
    expect(
      protectedRows.map((row) => row.invalidationReason.length).sort(),
    ).toEqual([34, 39]);
    await expect(
      store.createScheduledSubmission(
        {
          id: randomUUID(),
          accountId,
          status: 'pending',
          scheduledAt: '2099-01-01T00:00:00.000Z',
        },
        'pending-move-schedule',
        'fingerprint',
        owner.actorId,
        {
          accountId,
          idempotencyKey: 'pending-move-schedule',
          draftMessageId: original.id,
          to: [{ address: 'test@example.com' }],
          subject: 'Scheduled',
          text: 'Draft',
        },
        {
          providerMessageId: original.providerMessageId,
          providerFolderIds: ['INBOX'],
          to: [],
          cc: [],
          bcc: [],
          replyTo: [],
          references: [],
          subject: 'Draft',
          read: true,
          starred: false,
          draft: true,
          attachments: [],
        },
      ),
    ).rejects.toMatchObject({ reason: 'MAIL_IMAP_MOVE_OUTCOME_UNKNOWN' });
    expect(server.transfers).toHaveLength(1);
  });

  it('retains a localized draft identity while relocating its remote locator', async () => {
    const original = await prepare(false, false, true);
    await database
      .query()
      .updateTable('mailMessages')
      .set({ draft: true })
      .where('id', '=', original.id)
      .execute();
    const localized = await store.localizeDraft(accountId, original.id);
    const moved = await service().moveMessage(owner, {
      accountId,
      messageId: original.id,
      providerFolderId: 'Trash',
      sourceProviderFolderId: 'INBOX',
    });
    expect(moved.id).toBe(original.id);
    expect(moved.providerMessageId).toBe(localized.providerMessageId);
    expect(moved.providerDraftMessageId).not.toBe(
      localized.providerDraftMessageId,
    );
    expect(moved.providerMessageId).toMatch(/^local-draft:/);
    await service().updateMessage(owner, {
      accountId,
      messageId: original.id,
      read: true,
    });
    expect(
      server.folders.get('Trash')!.messages.get(1)!.flags.has('\\Seen'),
    ).toBe(true);
  });

  it('reloads the explicit IMAP move through private persistence without calling generic store movement', async () => {
    const original = await prepare();
    const generic = vi.spyOn(store, 'moveMessage');
    const moved = await service().moveMessage(owner, {
      accountId,
      messageId: original.id,
      providerFolderId: 'Trash',
      sourceProviderFolderId: 'INBOX',
    });
    expect(moved.id).toBe(original.id);
    expect(moved.folderIds).toEqual(['Trash']);
    expect(generic).not.toHaveBeenCalled();
  });

  it('soft deletion goes to Trash, retaining the business UUID', async () => {
    const original = await prepare();
    await service().deleteMessage(owner, {
      accountId,
      messageId: original.id,
      sourceProviderFolderId: 'INBOX',
    });
    expect((await messages())[0]).toMatchObject({
      id: original.id,
      folders: ['Trash'],
      note: 'Keep my note',
    });
  });
  it('fails ordinary deletion when Trash is missing without issuing permanent deletion', async () => {
    const original = await prepare();
    await database
      .query()
      .deleteFrom('mailFolders')
      .where('accountId', '=', accountId)
      .where('providerFolderId', '=', 'Trash')
      .execute();
    await expect(
      service().deleteMessage(owner, {
        accountId,
        messageId: original.id,
        sourceProviderFolderId: 'INBOX',
      }),
    ).rejects.toMatchObject({ reason: 'MAIL_IMAP_TRASH_NOT_FOUND' });
    expect(server.expunges).toEqual([]);
    expect(server.stores).toEqual([]);
  });
});
