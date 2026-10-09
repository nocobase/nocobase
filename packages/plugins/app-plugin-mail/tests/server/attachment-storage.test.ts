import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import type { DatabaseManager } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveMailOutboundAttachmentStorage } from '../../server/outbound-attachments.js';
import { createDatabaseMailStore } from '../../server/store.js';
import type {
  MailStore,
  MailUploadAttachmentInput,
} from '../../server/types.js';
import {
  createMailTestDatabase,
  destroyMailTestDatabase,
} from '../helpers/database.js';

describe('outbound attachment bytes and metadata', () => {
  let database: DatabaseManager;
  let store: MailStore;
  let directory: string;
  let storage: DriveMailOutboundAttachmentStorage;
  const objectPath = (key: string) => join(directory, key.replaceAll('/', '_'));
  const disk = {
    putStream:
      vi.fn<
        (
          key: string,
          stream: Readable,
          options: { contentType: string; contentLength: number },
        ) => Promise<void>
      >(),
    getStream: vi.fn(async (key: string) => createReadStream(objectPath(key))),
    delete: vi.fn(async (key: string) => {
      await rm(objectPath(key));
    }),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    database = await createMailTestDatabase();
    store = createDatabaseMailStore(database);
    directory = await mkdtemp(join(tmpdir(), 'mail-attachments-'));
    disk.putStream.mockImplementation(async (key, stream) => {
      await pipeline(stream, createWriteStream(objectPath(key)));
    });
    disk.getStream.mockImplementation(async (key) =>
      createReadStream(objectPath(key)),
    );
    disk.delete.mockImplementation(async (key) => {
      await rm(objectPath(key));
    });
    storage = new DriveMailOutboundAttachmentStorage(
      store,
      {
        // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- DriveManager's public API names this method use.
        use: () => disk,
      },
      'local',
    );
  });
  afterEach(async () => {
    vi.useRealTimers();
    await destroyMailTestDatabase(database);
    await rm(directory, { recursive: true, force: true });
  });

  it('round-trips bytes through storage and scopes reads to the owner', async () => {
    const uploaded = await storage.create(
      'alice',
      input({ fileName: ' ../report\r\n.csv ', contentType: '' }),
    );
    const row = await store.getOutboundAttachment('alice', uploaded.id);
    expect(row).toMatchObject({
      fileName: '.._report__.csv',
      contentType: 'application/octet-stream',
      size: 5,
      userId: 'alice',
    });
    expect(
      new Date(row!.expiresAt).getTime() - new Date(row!.createdAt).getTime(),
    ).toBe(86_400_000);
    const opened = await storage.open('alice', uploaded.id);
    expect(await new Response(opened.stream).text()).toBe('hello');
    expect(await readFile(objectPath(row!.key), 'utf8')).toBe('hello');
    disk.getStream.mockClear();
    await expect(storage.open('bob', uploaded.id)).rejects.toThrow('not found');
    await expect(storage.open('alice', 'missing')).rejects.toThrow('not found');
    expect(disk.getStream).not.toHaveBeenCalled();
  });

  it.each([
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    25 * 1024 * 1024 + 1,
  ])('rejects invalid size %s before writing bytes', async (size) => {
    await expect(storage.create('alice', input({ size }))).rejects.toThrow();
    expect(disk.putStream).not.toHaveBeenCalled();
    expect(await readdir(directory)).toEqual([]);
  });

  it('rejects empty filenames and supports empty files', async () => {
    await expect(
      storage.create('alice', input({ fileName: '  ' })),
    ).rejects.toThrow('filename is required');
    const uploaded = await storage.create(
      'alice',
      input({
        fileName: 'a'.repeat(510),
        size: 0,
        stream: new Blob([]).stream(),
      }),
    );
    expect(uploaded.fileName).toHaveLength(500);
    expect(
      await new Response(
        (await storage.open('alice', uploaded.id)).stream,
      ).text(),
    ).toBe('');
  });

  it('removes the uploaded object when metadata persistence fails', async () => {
    const failure = new Error('Database write failed');
    vi.spyOn(store, 'createOutboundAttachment').mockRejectedValueOnce(failure);
    await expect(storage.create('alice', input())).rejects.toBe(failure);
    expect(disk.delete).toHaveBeenCalledTimes(1);
    expect(await readdir(directory)).toEqual([]);
  });

  it('preserves the original persistence error when compensating deletion also fails', async () => {
    const failure = new Error('Database write failed');
    vi.spyOn(store, 'createOutboundAttachment').mockRejectedValueOnce(failure);
    disk.delete.mockRejectedValueOnce(new Error('Disk unavailable'));
    await expect(storage.create('alice', input())).rejects.toBe(failure);
    expect(disk.delete).toHaveBeenCalledTimes(1);
  });

  it('does not insert metadata when the object cannot be written', async () => {
    const save = vi.spyOn(store, 'createOutboundAttachment');
    disk.putStream.mockRejectedValueOnce(new Error('Disk full'));
    await expect(storage.create('alice', input())).rejects.toThrow('Disk full');
    expect(save).not.toHaveBeenCalled();
  });

  it('denies expired uploads and cleans both stored bytes and metadata', async () => {
    const uploaded = await storage.create('alice', input());
    const row = await store.getOutboundAttachment('alice', uploaded.id);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(row!.expiresAt));
    await expect(storage.open('alice', uploaded.id)).rejects.toThrow(
      'not found',
    );
    expect(await storage.cleanupExpired(row!.expiresAt)).toBe(1);
    expect(
      await store.getOutboundAttachment('alice', uploaded.id),
    ).toBeUndefined();
    expect(await readdir(directory)).toEqual([]);
    expect(await storage.cleanupExpired(row!.expiresAt)).toBe(0);
  });
});

function input(
  overrides: Partial<MailUploadAttachmentInput> = {},
): MailUploadAttachmentInput {
  return {
    fileName: 'hello.txt',
    contentType: 'text/plain',
    size: 5,
    stream: new Blob(['hello']).stream(),
    ...overrides,
  };
}
